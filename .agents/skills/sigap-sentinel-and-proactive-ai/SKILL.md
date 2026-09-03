---
name: sigap-sentinel-and-proactive-ai
description: >
  Panduan implementasi SIGAP Sentinel (AI Pemantau Proaktif), AI Daily Briefing Cron,
  dan pola pengembangan Cloud Function yang bersifat proaktif (bukan reaktif).
  Gunakan saat membuat cron atau trigger yang memantau deadline, beban kerja, atau
  kondisi anomali dan mengirim notifikasi otomatis ke user. Juga mencakup arsitektur
  upgrade SigapCopilot ke mode Agentic (tool-calling).
---

# SIGAP Sentinel & Proactive AI -- Panduan Implementasi

`
Konsep Inti : AI Proaktif = Sistem yang bertindak TANPA menunggu user meminta
Data Source  : userSummaries, disposisi, tugas, logbook, jadwal_tempat
Notif Channel: FCM Push (primary) + In-App Notification (secondary)
Backend File : functions/src/cron/index.ts (tambah di sini)
Region       : asia-southeast2
`

---

## Perbedaan AI Reaktif vs Proaktif

| | AI Reaktif (Existing) | AI Proaktif (Sentinel) |
|---|---|---|
| Trigger | User klik tombol | Sistem cron/trigger otomatis |
| Contoh | "Scan surat ini dengan AI" | "Surat ini mendekati deadline, user diberitahu" |
| User experience | User sadar dan minta | User terkejut positif, merasa dibantu |
| Biaya AI | Per request user | Per cron run (lebih efisien) |

---

## Modul 1 -- SIGAP Sentinel (Deadline Monitor)

### Arsitektur

`
Cron setiap 1 jam
    -> Query disposisi/tugas mendekati deadline
    -> Filter: belum ada tindak lanjut / belum selesai
    -> Kirim FCM + simpan di notifications
    -> Update sentinelAlertSent: true untuk cegah duplicate
`

### Cloud Function Pattern

Tambahkan ke functions/src/cron/index.ts:

`	ypescript
export const sigapSentinelHourly = onSchedule(
  { 
    schedule: 'every 1 hours', 
    region: REGION, 
    timeZone: 'Asia/Jakarta',
    memory: '256MiB',
    timeoutSeconds: 300
  },
  async (event) => {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Query disposisi mendekati batasWaktu (H-1 dan H-3)
    const disposisiQuery = db.collection('disposisi')
      .where('batasWaktu', '>=', admin.firestore.Timestamp.fromDate(now))
      .where('batasWaktu', '<=', admin.firestore.Timestamp.fromDate(threeDaysFromNow))
      .where('sentinelAlertSent', '!=', true);

    const disposisiSnap = await disposisiQuery.get();
    
    for (const doc of disposisiSnap.docs) {
      const disposisi = { id: doc.id, ...doc.data() };
      const deadline = disposisi.batasWaktu.toDate();
      const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Alert H-3 dan H-1
      if (hoursLeft <= 24 || (hoursLeft <= 72 && hoursLeft > 48)) {
        const label = hoursLeft <= 24 ? 'BESOK' : '3 HARI LAGI';
        
        // Kirim notif ke penerima yang belum selesai
        const belumSelesai = disposisi.kepadaJabatanId.filter(
          (jid) => !disposisi.penerimaSelesai?.includes(jid)
        );
        
        for (const jabatanId of belumSelesai) {
          const userSnap = await db.collection('users')
            .where('jabatanId', '==', jabatanId)
            .where('status', '==', 'aktif')
            .limit(1).get();
          
          if (!userSnap.empty) {
            const user = userSnap.docs[0].data();
            await db.collection('notifications').add({
              userId: user.uid, userNip: user.nip, opdId: disposisi.opdId,
              type: 'sentinel_deadline',
              message: [] Disposisi dari  mendekati batas waktu.,
              link: '/dashboard/surat/' + disposisi.suratId,
              isRead: false,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
            
            if (user.fcmTokens?.length) {
              await sendFcmMessageByUid(user.uid, {
                title: label + ': Deadline Disposisi',
                body: 'Disposisi dari ' + disposisi.dariNama + ' perlu diselesaikan!',
                data: { link: '/dashboard/surat/' + disposisi.suratId }
              });
            }
          }
        }
        
        // Mark H-1 agar tidak spam
        if (hoursLeft <= 24) {
          await doc.ref.update({ sentinelAlertSent: true });
        }
      }
    }
  }
);
`

### Anti-Spam: Tambahkan field ke dokumen disposisi dan tugas

`	ypescript
// Di disposisi document:
sentinelAlertSent?: boolean;     // true = sudah kirim alert H-1

// Di tugas document:  
sentinelOverdueSent?: boolean;   // true = sudah kirim overdue alert
`

---

## Modul 2 -- AI Daily Briefing (07.00 WIB)

### Pattern Implementasi

`	ypescript
export const aiDailyBriefing = onSchedule(
  { 
    schedule: '0 7 * * *',      // Setiap hari jam 07:00 WIB
    region: REGION, timeZone: 'Asia/Jakarta',
    memory: '512MiB', timeoutSeconds: 540
  },
  async (event) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Batch per OPD untuk efisiensi
    const opdSnap = await db.collection('opd_config')
      .where('status', '==', 'aktif').get();
    
    for (const opdDoc of opdSnap.docs) {
      const opdId = opdDoc.id;
      const usersSnap = await db.collection('users')
        .where('opdId', '==', opdId)
        .where('status', '==', 'aktif').get();
      
      for (const userDoc of usersSnap.docs) {
        const user = userDoc.data();
        if (!user.fcmTokens?.length) continue;
        
        // Ambil counter dari userSummaries (sudah tersedia, GRATIS)
        const summaryDoc = await db.collection('userSummaries').doc(user.jabatanId).get();
        const summary = summaryDoc.data() || {};
        
        const parts = [];
        if ((summary.suratBaruCount || 0) > 0) parts.push(summary.suratBaruCount + ' surat belum ditindaklanjuti');
        if ((summary.tugasBaruCount || 0) > 0) parts.push(summary.tugasBaruCount + ' tugas menunggu');
        if ((summary.tindakLanjutMenunggu || 0) > 0) parts.push(summary.tindakLanjutMenunggu + ' disposisi aktif');
        
        const body = parts.length > 0 
          ? parts.join(' | ')
          : 'Tidak ada item urgent. Selamat bekerja produktif!';
        
        await sendFcmMessageByUid(user.uid, {
          title: 'Selamat Pagi, ' + user.namaLengkap.split(' ')[0] + '!',
          body: body,
          data: { link: '/dashboard' }
        });
      }
    }
  }
);
`

---

## Modul 3 -- SigapCopilot v2 Agentic (Tool-Calling)

### Konsep Upgrade

Upgrade /api/ai/copilot dari chatbot ke AI Agent yang bisa eksekusi aksi:
- User: "Tampilkan surat belum ditindaklanjuti bulan ini"
- AI parse -> pilih tool query_surat -> eksekusi -> tampilkan hasil
- User: "Buat jadwal rapat hari Jumat jam 14.00 di Ruang A"  
- AI parse -> konfirmasi ke user -> eksekusi create_jadwal

### Tools yang Diimplementasikan

`	ypescript
const AGENT_TOOLS = [
  { name: 'query_surat', description: 'Cari/tampilkan surat berdasarkan filter' },
  { name: 'get_user_summary', description: 'Tampilkan ringkasan tugas dan surat saat ini' },
  { name: 'create_jadwal', description: 'Buat agenda/jadwal baru (REQUIRES CONFIRMATION)' },
  { name: 'create_tugas', description: 'Delegasikan tugas ke bawahan (REQUIRES CONFIRMATION)' },
];

// Tools yang butuh konfirmasi user sebelum eksekusi
const CONFIRMATION_REQUIRED = ['create_jadwal', 'create_tugas', 'create_disposisi'];
`

---

## Anti-Pattern yang Dilarang

| Anti-Pattern | Masalah | Solusi |
|---|---|---|
| Cron kirim notif tanpa flag sentinelAlertSent | Spam notifikasi tiap jam | Flag dokumen setelah kirim H-1 |
| Daily briefing semua user sekaligus | Timeout Cloud Function | Batch per OPD |
| Agentic eksekusi tanpa konfirmasi | User kaget dengan perubahan | Selalu konfirmasi aksi write |
| Cron interval < 1 jam untuk sentinel | Biaya Firestore reads meledak | Minimum 1 jam |

---

---

## Modul 4 -- AI Strategic Disposition Orchestration & On-Demand Callable v2

### Dual Pipeline Architecture:
1. **Pipeline 1: Pre-computed AI Extraction saat Upload (OCR & Async Trigger)**
   - Saat dokumen surat diunggah via OCR (`extractSuratDataAIV2`), AI langsung mengekstrak metadata + `suggestedDisposisi` (2 opsi instruksi taktis) dan menyimpannya langsung di koleksi `surat/{id}`.
   - Background Trigger `agentStrategicDisposition` (`onDocumentCreated`) memetakan kandidat penerima (`suggestedPenerimaIds`) secara asinkron menggunakan Firestore database target (`database-siyap`).

2. **Pipeline 2: On-Demand Interactive AI (`getStrategicDisposisiAIV2`)**
   - Dipanggil on-demand saat pimpinan mengklik tombol **Saran AI** (`Sparkles`) di Form Disposisi Detail Surat, Quick Disposisi Modal, atau Inline Ruang Kerja.
   - Menggunakan Callable Firebase Function v2 (`asia-southeast2`) dengan secret `GEMINI_API_KEY` (Secret Manager) dan fallback ke Next.js API route `/api/ai/suggest-disposition`.
   - Mengembalikan saran instruksi dan auto-select penerima bawahan langsung ke form UI.

### Aturan Hirarki & Aksesibilitas Saran AI:
- **JANGAN BATASI DENGAN `level < 5`**: Seluruh pimpinan atau pejabat yang memiliki bawahan (Level 1 Kadis s/d Level 6 Kasubbag TU UPTD / Kasi) berhak melihat dan memanfaatkan fitur Rekomendasi Asisten AI.
- Form Disposisi wajib menampilkan banner saran instruksi jika `surat.suggestedDisposisi` terisi, dan tombol "Saran Penerima AI" jika `surat.suggestedPenerimaIds` terisi.

---

## Data Sources untuk Proactive AI

| Data | Koleksi | Field |
|---|---|---|
| Surat belum TL | userSummaries | suratBaruCount |
| Disposisi mendekati deadline | disposisi | batasWaktu |
| Tugas overdue | tugas | batasWaktu + status |
| Agenda hari ini | surat | jenisSurat=='Undangan' + detailAgenda.tanggal |
| Logbook kemarin | logbook | {userId}_{YYYY-MM-DD} |
| Health score OPD | kinerja_agregat | {opdId}_{YYYY-MM-DD} |

