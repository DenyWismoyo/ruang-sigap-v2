---
name: sigap-executive-analytics
description: >
  Panduan membangun Executive Intelligence Dashboard dan laporan otomatis di RUANG SIGAP.
  Mencakup query pattern untuk kinerja_agregat, aggregateHealthScore, userSummaries,
  cara menghitung SLA compliance dari data disposisi, dan pola laporan otomatis via Cron + Gemini.
  Gunakan saat membangun fitur analitika, dashboard pimpinan, atau laporan yang memerlukan
  data agregat lintas user/jabatan/OPD.
---

# SIGAP Executive Analytics -- Panduan Implementasi

`
Data Utama   : kinerja_agregat, aggregateHealthScore, userSummaries, disposisi, tindak_lanjut
Akses        : admin_opd, super_admin, user dengan level <= 3 (pimpinan)
Backend      : functions/src/cron/aggregateHealthScore.ts (sudah ada, bisa di-extend)
Frontend     : src/app/dashboard/sigap/(main)/evaluasi/ (sudah ada, tambahkan di sini)
`

---

## Koleksi Agregat yang Tersedia (Sudah Ada di Codebase)

### 1. kinerja_agregat/{opdId}_{YYYY-MM-DD}

`	ypescript
interface KinerjaAgregat {
  opdId: string;
  tanggal: string;              // 'YYYY-MM-DD'
  totalSuratMasuk: number;
  totalDisposisi: number;
  totalTindakLanjut: number;
  totalSelesai: number;
  rataSuratPerHari: number;
  updatedAt: Timestamp;
}

// Query pattern untuk chart 30 hari terakhir:
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

const snap = await db.collection('kinerja_agregat')
  .where('opdId', '==', opdId)
  .where('tanggal', '>=', thirtyDaysAgo.toISOString().slice(0, 10))
  .orderBy('tanggal', 'asc')
  .get();
`

### 2. userSummaries/{jabatanId}

`	ypescript
// Cache real-time counter per jabatan -- JANGAN query dari frontend secara loop
// Ambil semua sekaligus untuk dashboard:

const summariesSnap = await db.collection('userSummaries')
  .where('opdId', '==', opdId)
  .get();

const bottlenecks = summariesSnap.docs
  .map(d => ({ jabatanId: d.id, ...d.data() }))
  .filter(s => s.tindakLanjutMenunggu > 5)  // jabatan yang overloaded
  .sort((a, b) => b.tindakLanjutMenunggu - a.tindakLanjutMenunggu);
`

### 3. opd_health_scores/{opdId} (dari aggregateHealthScore.ts)

`	ypescript
// Sudah diisi oleh aggregateHealthScore.ts cron
// Berisi composite score kesehatan OPD

interface OpdHealthScore {
  opdId: string;
  score: number;              // 0-100
  breakdown: {
    suratTerselesaikan: number;
    ketepatan Waktu: number;
    partisipasiLogbook: number;
  };
  updatedAt: Timestamp;
}
`

---

## Query Pattern: SLA Compliance

Hitung persentase surat yang diselesaikan tepat waktu:

`	ypescript
// Ambil semua tindak_lanjut dalam periode tertentu
const tlSnap = await db.collection('tindak_lanjut')
  .where('opdId', '==', opdId)
  .where('createdAt', '>=', startDate)
  .where('createdAt', '<=', endDate)
  .where('isFinalAction', '==', true)
  .get();

let onTime = 0;
let late = 0;

for (const tlDoc of tlSnap.docs) {
  const tl = tlDoc.data();
  
  // Ambil disposisi induk untuk mendapatkan batasWaktu
  const disposisiDoc = await db.collection('disposisi').doc(tl.disposisiId).get();
  const disposisi = disposisiDoc.data();
  
  if (disposisi?.batasWaktu) {
    const deadline = disposisi.batasWaktu.toDate();
    const selesai = tl.createdAt.toDate();
    
    if (selesai <= deadline) onTime++;
    else late++;
  }
}

const slaCompliance = onTime / (onTime + late) * 100;
// Result: 78.5% surat diselesaikan tepat waktu
`

---

## Executive Dashboard -- Komponen yang Dibutuhkan

### 1. Heatmap Beban Kerja

Visualisasi siapa yang overloaded vs underutilized:

`	sx
// src/app/dashboard/sigap/(main)/evaluasi/components/WorkloadHeatmap.tsx

interface WorkloadData {
  jabatanId: string;
  namaJabatan: string;
  namaUser: string;
  suratPending: number;
  tugasPending: number;
  disposisiMenunggu: number;
  totalBeban: number; // computed: sum of all pending items
}

// Color coding:
// totalBeban >= 10 -> merah (overloaded)
// totalBeban 5-9   -> kuning (normal)
// totalBeban 0-4   -> hijau (ringan)

const getLoadColor = (total: number) => {
  if (total >= 10) return 'bg-red-100 border-red-300 text-red-800';
  if (total >= 5) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
  return 'bg-green-100 border-green-300 text-green-800';
};
`

### 2. Bottleneck Detection Chart

`	sx
// Tampilkan jabatan yang paling sering jadi bottleneck
// (surat masuk tapi lama tidak didisposisikan)

const getBottleneckData = async (opdId: string) => {
  const suratBaru = await db.collection('surat')
    .where('opdId', '==', opdId)
    .where('statusPenyelesaian', '==', 'Baru')
    .where('createdAt', '<', Timestamp.fromDate(threeDaysAgo))
    .get();
  
  // Group by tujuanJabatanId untuk lihat di jabatan mana surat menumpuk
  const byJabatan = suratBaru.docs.reduce((acc, doc) => {
    const jid = doc.data().tujuanJabatanId;
    acc[jid] = (acc[jid] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(byJabatan)
    .map(([jabatanId, count]) => ({ jabatanId, suratMenumpuk: count }))
    .sort((a, b) => b.suratMenumpuk - a.suratMenumpuk);
};
`

### 3. Trend Chart (30 Hari)

Gunakan recharts (sudah ada di package.json) dengan data dari kinerja_agregat:

`	sx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Data format untuk recharts:
const chartData = kinerjaAgregatDocs.map(doc => ({
  tanggal: doc.tanggal.slice(5),  // 'MM-DD'
  suratMasuk: doc.totalSuratMasuk,
  selesai: doc.totalSelesai,
}));

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={chartData}>
    <Line type="monotone" dataKey="suratMasuk" stroke="#3b82f6" name="Surat Masuk" />
    <Line type="monotone" dataKey="selesai" stroke="#22c55e" name="Diselesaikan" />
    <XAxis dataKey="tanggal" />
    <YAxis />
    <Tooltip />
  </LineChart>
</ResponsiveContainer>
`

---

## Laporan Otomatis Terjadwal

### Pattern: Generate PDF Laporan Mingguan

`	ypescript
// functions/src/cron/index.ts -- tambahkan

export const weeklyReportGenerator = onSchedule(
  {
    schedule: '0 16 * * 5',    // Setiap Jumat jam 16.00 WIB
    region: REGION, timeZone: 'Asia/Jakarta',
    memory: '512MiB', timeoutSeconds: 300,
    secrets: [geminiApiKey]
  },
  async (event) => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const opdSnap = await db.collection('opd_config')
      .where('status', '==', 'aktif').get();
    
    for (const opdDoc of opdSnap.docs) {
      const opdId = opdDoc.id;
      
      // Kumpulkan data minggu ini
      const [suratSnap, tlSnap] = await Promise.all([
        db.collection('surat').where('opdId', '==', opdId)
          .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(lastWeek)).get(),
        db.collection('tindak_lanjut').where('opdId', '==', opdId)
          .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(lastWeek))
          .where('isFinalAction', '==', true).get()
      ]);
      
      const stats = {
        totalSuratMasuk: suratSnap.size,
        totalSelesai: tlSnap.size,
        completionRate: suratSnap.size > 0 ? (tlSnap.size / suratSnap.size * 100).toFixed(1) : 0
      };
      
      // Gunakan Gemini untuk narratif executive summary
      const apiKey = geminiApiKey.value();
      const narratif = await generateNarrativeWithGemini(stats, apiKey);
      
      // Kirim ke admin_opd via email/FCM
      const adminSnap = await db.collection('users')
        .where('opdId', '==', opdId)
        .where('role', '==', 'admin_opd')
        .where('status', '==', 'aktif').get();
      
      for (const adminDoc of adminSnap.docs) {
        const admin = adminDoc.data();
        if (admin.fcmTokens?.length) {
          await sendFcmMessageByUid(admin.uid, {
            title: 'Laporan Mingguan Tersedia',
            body: Total  surat | % diselesaikan,
            data: { link: '/dashboard/evaluasi' }
          });
        }
      }
    }
  }
);

async function generateNarrativeWithGemini(stats: any, apiKey: string): Promise<string> {
  const prompt = Buat narasi eksekutif 2 kalimat tentang kinerja persuratan minggu ini.
Data: 
Gaya: formal birokrasi, ringkas, actionable.;
  
  const response = await fetch(
    https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  );
  const result = await response.json();
  return result.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
`

---

## Akses Control untuk Executive Dashboard

`	sx
// Hanya tampilkan ke pimpinan (level <= 3) atau admin
const { userProfile, jabatanProfile } = useUserAuth();
const isPimpinan = jabatanProfile && jabatanProfile.level <= 3;
const isAdmin = ['admin_opd', 'super_admin'].includes(userProfile.role);

if (!isPimpinan && !isAdmin) {
  return <AccessDenied message="Dashboard ini hanya untuk pimpinan dan admin." />;
}
`

---

## Anti-Pattern yang Dilarang

| Anti-Pattern | Masalah | Solusi |
|---|---|---|
| Loop query Firestore per jabatan untuk heatmap | N+1 reads, lambat | Ambil userSummaries semua sekaligus |
| Hitung SLA di frontend dari raw data | Terlalu lambat, boros bandwidth | Precompute di kinerja_agregat via cron |
| Tampilkan data user lain ke non-pimpinan | Privacy violation | Selalu cek level jabatan sebelum render |
| Re-calculate stats setiap render | Performance buruk | Gunakan SWR/React Query dengan staleTime |
| Generate laporan saat user klik (sync) | Timeout di browser | Trigger cron / Cloud Function async |
