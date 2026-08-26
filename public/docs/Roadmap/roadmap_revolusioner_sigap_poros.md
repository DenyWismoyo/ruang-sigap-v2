# 🚀 Analisis Mendalam & Roadmap Revolusioner
## RUANG SIGAP / POROS — Platform E-Government Next Generation

**Tanggal Analisis**: 26 Agustus 2026  
**Dilakukan oleh**: Antigravity AI Agent (Claude Sonnet 4.6 Thinking)  
**Cakupan**: Frontend (Next.js), Backend (Cloud Functions v2), Agent Skills, Firestore Schema, AI Integration

---

## 🔍 BAGIAN 1 — STATUS KAPABILITAS EKSISTING

### Peta Modul Lengkap (Sudah Dibangun)

| Kategori | Modul | Kapabilitas Unik |
|---|---|---|
| **Ruang Kerja** | Dashboard, Ruang Kerja, Kotak Masuk, Tugas, Logbook, Portal Integrasi | Smart Greeting, QuickAccess Card, Feed terpadu |
| **Produktivitas** | Checklist, Bukti E-Kinerja, Kompetensi, Surat Keluar, Delegasi Tugas, Formulir, Survei | Rekap kinerja → PDF → Google Drive |
| **Koordinasi** | Notulensi, Jadwal Internal, Pelayanan Publik, Tapem, Layanan SKW | Booking Ruang, Notulensi AI |
| **Informasi** | Arsip, Repository Dokumen, Knowledge Base, Tutorial, Pengumuman, Aset, Keuangan | Full-text search via `searchKeywords[]` |
| **Analitika** | Evaluasi Kinerja, Perencanaan (Si-RANA), Rekap Surat, Laporan | `kinerja_agregat` harian otomatis |
| **Administrasi** | Master Pengguna, Jabatan, Templat, Form Builder, Dashboard Feedback | Role-based access + feature flags |
| **Pusat Kontrol** | Panel Instansi (SaaS), Master OPD, Laporan Langganan, Mitra Affiliate | Multi-tenant isolasi penuh |

### Kapabilitas AI yang Sudah Ada

```
✅ extractSuratDataAIV2      — OCR + metadata extraction dari PDF/gambar surat
✅ extractVoiceDisposisiAIV2 — Voice-to-disposition intent (suara perintah)
✅ agentStrategicDisposition — Mini Orchestrator: 2 Agent Paralel (Instruktur + Mapper)
✅ /api/ai/copilot           — Percakapan kontekstual SigapCopilot
✅ /api/ai/suggest-disposition — Saran penerima disposisi
✅ /api/ai/suggest-eskalasi  — Deteksi surat yang perlu dieskalasi
✅ /api/ai/grammar           — Perbaikan tata bahasa surat
✅ /api/ai/copywriter        — Generasi konten/draft surat
✅ /api/ai/smart-template    — Template disposisi cerdas
✅ /api/ai/extract-skw       — Ekstrak data SKW dari dokumen
✅ /api/ai/generate-job-profile — Profil jabatan otomatis
✅ /api/ai/generate-laporan  — Generasi laporan otomatis
```

### Infrastruktur Backend

```
✅ Cloud Functions v2 (asia-southeast2) — 15+ fungsi aktif
✅ Firestore Triggers — Logbook auto-write, notifikasi otomatis
✅ Cron Jobs — sendAgendaReminders (15min), dailyKinerjaAggregator, aggregateHealthScore
✅ FCM Push Notification — Real-time ke Android/iOS/Web
✅ PWA + IndexedDB Offline Queue — offlineSync.ts
✅ Multi-tenant SaaS — Isolasi via opdId + feature flags
✅ Rate Limiting — Firestore-based per user per fungsi
✅ Google Drive Integration — Upload bukti kinerja otomatis
✅ Google Calendar Sync — googleCalendarSyncEnabled flag sudah ada
```

---

## 🔬 BAGIAN 2 — GAP ANALYSIS & PELUANG REVOLUSIONER

### Gap Kritis yang Teridentifikasi

> [!WARNING]
> **5 Area Gap Utama** yang menghambat produktivitas masif dan skalabilitas platform

**Gap 1 — AI belum "Proaktif"**  
Semua AI saat ini bersifat *reaktif* (user harus minta). Belum ada AI yang secara proaktif memantau, memprioritaskan, dan mengeksekusi workflow tanpa trigger manual.

**Gap 2 — Analitika Organisasi belum Actionable**  
`kinerja_agregat` dan `aggregateHealthScore` ada, tapi belum ada dashboard yang menunjukkan *rekomendasi konkret berbasis data* — "Bidang mana yang bottleneck?", "Surat mana yang hampir lewat deadline?".

**Gap 3 — Kolaborasi Cross-OPD masih Terbatas**  
`lintasOpd` feature flag ada, tapi belum ada workspace kolaborasi antar OPD yang seamless — perlu portal koordinasi lintas instansi seperti "ruang kerja bersama" untuk proyek daerah.

**Gap 4 — Integrasi Ekosistem Pemerintahan Belum Ada**  
Belum ada konektor ke sistem nasional: SIASN, SIMPEGDA, e-Kinerja BKN, SPSE, SAKIP. Ini adalah differentiator terbesar vs kompetitor.

**Gap 5 — User Engagement & Gamifikasi Nol**  
Tidak ada mekanisme untuk mendorong ASN mengisi logbook, menyelesaikan tugas tepat waktu, atau menggunakan fitur secara konsisten — padahal data untuk gamifikasi sudah ada.

---

## 🗺️ BAGIAN 3 — ROADMAP FASE VI–XI (2026–2027)

---

### 🔥 FASE VI — "SIGAP Intelligence Layer"
**Target: September – Oktober 2026**
**Tema: AI yang Benar-Benar Proaktif**

#### 6.1 — **SIGAP Sentinel** (AI Pemantau Real-time)
*Cloud Function baru: `sentinelAgent` (Firestore Trigger + Cron)*

AI yang secara otomatis:
- Memantau semua surat `statusPenyelesaian: 'Didisposisikan'` yang mendekati `batasWaktu` (H-1, H-3)
- Mengirim **Push Notification + In-App Alert** yang cerdas: *"⚠️ Surat 'Undangan Rapat Koordinasi' dari Kemendagri belum ditindaklanjuti. Batas waktu: besok pukul 17.00"*
- Mengidentifikasi **pola bottleneck**: jabatan mana yang paling sering terlambat → laporan otomatis ke pimpinan
- **Eskalasi Otomatis**: Jika tindak lanjut belum ada H+2 dari deadline, notif naik ke level jabatan di atasnya

```typescript
// functions/src/sentinelAgent.ts — Cloud Function baru
export const sigapSentinelCron = onSchedule(
  { schedule: 'every 1 hours', region: REGION },
  async () => { ... }
);
```

#### 6.2 — **AI Daily Briefing** (Push Notification Pagi)
*Cron setiap hari pukul 07.00 WIB*

Setiap ASN menerima **ringkasan harian personal** via Push Notification:
- "📋 Anda punya 3 surat belum ditindaklanjuti"
- "⏰ 2 deadline tugas hari ini"
- "📅 Rapat Koordinasi Anggaran jam 10.00 di Ruang Rapat Utama"
- "✅ Kemarin Anda menyelesaikan 5 kegiatan — produktivitas tinggi!"

*Menggunakan data dari `userSummaries`, `tugas`, `logbook`, `jadwal_tempat`*

#### 6.3 — **SigapCopilot v2 — Agentic Mode**
*Upgrade `/api/ai/copilot`*

Dari chatbot menjadi **AI Agent** yang bisa benar-benar mengeksekusi:
- *"Disposisikan surat dari Kemendagri ke Sekretaris untuk ditindaklanjuti minggu ini"* → eksekusi langsung
- *"Buatkan saya agenda rapat hari Jumat pukul 14.00 di Ruang Rapat A"* → buat jadwal di database
- *"Tampilkan semua surat yang belum saya tindaklanjuti bulan ini"* → query Firestore dan tampilkan

**Implementasi**: Tool-calling pattern dengan daftar fungsi yang bisa dipanggil AI

```typescript
const AGENT_TOOLS = [
  { name: 'createDisposisi', ... },
  { name: 'querySurat', ... },
  { name: 'createJadwal', ... },
  { name: 'createTugas', ... },
];
```

---

### 🏗️ FASE VII — "Workspace Kolaborasi Antar-Instansi"
**Target: Oktober – November 2026**
**Tema: Breaking OPD Silos**

#### 7.1 — **Ruang Proyek Bersama** (Cross-OPD Project Space)
*Modul baru: `/dashboard/proyek`*

Workspace kolaborasi lintas OPD untuk program/proyek daerah:
- Satu "Proyek" bisa melibatkan multiple OPD (e.g., "Program Stunting" → Dinkes + Dinas Sosial + Bappeda)
- Setiap anggota proyek bisa saling share dokumen, tugas, dan progress
- **Milestone Tracker**: gantt chart sederhana untuk monitoring progress
- **Dokumen Bersama**: Repository dokumen yang bisa diakses semua member proyek
- Notifikasi cross-OPD via FCM

**Schema Firestore Baru**:
```typescript
// proyek/{proyekId}
interface Proyek {
  namaProyek: string;
  deskripsi: string;
  opdIds: string[];          // Multi-OPD
  adminOpdId: string;        // Koordinator utama
  anggotaIds: string[];      // Array NIP anggota
  targetSelesai: Timestamp;
  status: 'Aktif' | 'Selesai' | 'Ditunda';
  milestones: Milestone[];
}
```

#### 7.2 — **Portal Disposisi Lintas Instansi** (Extended lintasOpd)
*Upgrade fitur `lintasOpd` yang sudah ada feature flag-nya*

- Kepala Dinas bisa mendisposisikan ke OPD lain (bukan hanya internal)
- Tanda terima digital yang tersertifikasi (timestamp Firestore = bukti hukum)
- Tracking status lintas OPD real-time
- Notifikasi otomatis ke pimpinan OPD tujuan

#### 7.3 — **Shared Calendar Instansi**
*Upgrade `/dashboard/jadwal`*

- Kalender yang bisa di-share antar OPD
- Sinkronisasi otomatis dengan Google Calendar (field `googleCalendarSyncEnabled` sudah ada!)
- Konflik jadwal detection: "Kepala Dinas sudah ada acara jam 14.00"
- iCal export untuk integrasi dengan kalender eksternal

---

### 🔌 FASE VIII — "Ekosistem Integrasi Nasional"
**Target: November – Desember 2026**
**Tema: SIGAP sebagai Hub E-Government**

#### 8.1 — **Konektor SIASN/BKN**
*API Route baru: `/api/integrations/siasn`*

Sinkronisasi data kepegawaian dari SIASN BKN:
- Import data ASN otomatis (NIP, nama, jabatan, golongan) → tidak perlu input manual
- Sinkronisasi data cuti, kenaikan pangkat, mutasi
- Validasi NIP saat registrasi user baru
- **Auto-update jabatan** jika ada mutasi

```typescript
// Cron mingguan: sinkronisasi data ASN dari API BKN
export const syncSiasnData = onSchedule(
  { schedule: 'every monday 00:00', ... },
  async () => { /* Panggil API SIASN */ }
);
```

#### 8.2 — **Konektor e-Kinerja BKN**
*API Route: `/api/integrations/e-kinerja-bkn`*

- Export data logbook SIGAP → format e-Kinerja BKN otomatis
- Import SKP (Sasaran Kinerja Pegawai) dari sistem BKN
- Generate laporan kinerja yang kompatibel dengan format BKN
- **Zero double-entry**: ASN cukup isi di SIGAP, data otomatis tersinkron ke BKN

#### 8.3 — **WhatsApp Business Integration**
*Cloud Function baru: `whatsappNotificationAgent`*

- Kirim notifikasi penting via WhatsApp (field `nomorWa` sudah ada di UserProfile!)
- Format pesan terstruktur: disposisi baru, deadline approaching, meeting reminder
- Two-way: ASN bisa reply via WA untuk "acknowledge" disposisi
- Rate limiting: maksimal 3 notif WA per hari per user

#### 8.4 — **Integrasi e-SIAP / SPSE**
*Portal Integrasi Extension*

- Link ke sistem e-procurement (SPSE) untuk dokumen pengadaan
- Import data anggaran dari SIMDA/SIPD
- Embed dokumen SAKIP (Laporan Kinerja) langsung di dashboard
- Webhook receiver untuk notifikasi dari sistem lain

---

### 🎯 FASE IX — "Analytics & Decision Intelligence"
**Target: Januari – Februari 2027**
**Tema: Data-Driven Governance**

#### 9.1 — **Executive Intelligence Dashboard**
*Modul baru: `/dashboard/executive-dashboard` (Pimpinan only)*

Dashboard real-time khusus pimpinan (Kepala Dinas/Kepala Daerah):
- **Heatmap Beban Kerja**: Visualisasi siapa yang overloaded vs underutilized
- **Bottleneck Detection**: Surat mana yang tersangkut di jabatan mana
- **Trend Analysis**: Jumlah surat masuk vs terselesaikan per bulan
- **SLA Compliance**: % surat yang terselesaikan tepat waktu
- **Predictive Alert**: "Berdasarkan pola historis, bulan Oktober biasanya volume surat meningkat 40%"

*Menggunakan data dari `kinerja_agregat`, `aggregateHealthScore`, `userSummaries`*

#### 9.2 — **Laporan Otomatis Terjadwal**
*Cron Function baru: `generateScheduledReports`*

- **Laporan Mingguan**: Auto-generate setiap Jumat sore, kirim ke email pimpinan
- **Laporan Bulanan E-Kinerja**: Auto-compile dari logbook + bukti kinerja semua ASN
- **Laporan LKJIP**: Draft otomatis Laporan Kinerja Instansi Pemerintah
- Format: PDF + Excel + JSON (untuk integrasi sistem lain)

#### 9.3 — **Predictive Disposition AI**
*Upgrade `agentStrategicDisposition`*

Dari 2-agent menjadi **5-agent orchestrator**:
1. **Content Analyzer** — Analisis mendalam isi surat
2. **Historical Pattern Agent** — Cek disposisi surat sejenis di masa lalu
3. **Workload Balancer** — Perhatikan beban kerja penerima saat ini
4. **Urgency Classifier** — Klasifikasi urgency dan tentukan SLA
5. **Synthesis Agent** — Gabungkan semua insight, hasilkan rekomendasi final

*Accuracy rate bisa meningkat dari ~70% ke ~90%+*

#### 9.4 — **Anomaly Detection**
*Cloud Function: `anomalyDetector`*

Deteksi pola anormal secara otomatis:
- Login dari IP/device tidak biasa → alert security
- Volume surat jauh di atas normal → mungkin ada masalah
- Akun tidak aktif yang tiba-tiba aktif → keamanan
- Laporan tindak lanjut yang terlalu singkat/copy-paste → quality control

---

### 🎮 FASE X — "Engagement & Gamifikasi ASN"
**Target: Februari – Maret 2027**
**Tema: Making Bureaucracy Fun & Rewarding**

#### 10.1 — **Sistem Achievement & Leaderboard**
*Modul: `/dashboard/achievement`*

Gamifikasi produktivitas ASN berbasis data yang sudah ada:
- **Badge/Medali**: "Penyelelesai Tepat Waktu", "Logbook Konsisten 30 Hari", "100 Surat Diproses"
- **Leaderboard OPD**: Ranking produktivitas antar bidang/seksi (bukan antar personal untuk menghindari kompetisi destruktif)
- **Streak System**: Berapa hari berturut-turut login & isi logbook
- **Progress Bar**: "Anda sudah mengerjakan X% dari target kinerja bulan ini"
- **Notifikasi Achievement**: Push notif saat mendapat badge baru

```typescript
// Schema baru
interface Achievement {
  userId: string;
  type: 'badge' | 'milestone' | 'streak';
  achievementId: string;
  unlockedAt: Timestamp;
  metadata: Record<string, any>;
}
```

#### 10.2 — **Micro-Learning & Tutorial Interaktif**
*Upgrade `/dashboard/tutorial`*

Dari halaman tutorial statis menjadi **learning platform**:
- **Tutorial Video Terintegrasi**: Langsung di dalam app, bukan redirect YouTube
- **Quiz Singkat**: Setelah tutorial, ada kuis untuk memastikan pemahaman
- **Learning Path**: "Roadmap menjadi power user SIGAP dalam 7 hari"
- **Completion Certificate**: Sertifikat digital penggunaan sistem
- **AI Tutor**: Copilot bisa menjawab "Bagaimana cara X di SIGAP?"

#### 10.3 — **Feedback Loop Cerdas**
*Upgrade `/dashboard/feedback`*

- **Contextual Feedback**: Setelah user selesaikan tugas besar → auto-popup survei singkat
- **NPS Score**: Net Promoter Score internal per OPD
- **Pain Point Detection AI**: AI menganalisis feedback teks bebas, cluster masalah
- **Feature Request Tracker**: User bisa vote fitur yang diinginkan
- Auto-escalate feedback negatif ke admin OPD

---

### 🌐 FASE XI — "Mobile-First & Citizen Integration"
**Target: Maret – April 2027**
**Tema: Membuka SIGAP ke Publik**

#### 11.1 — **Aplikasi Mobile Native** (React Native / Flutter)
*New Project: SIGAP Mobile App*

Dari PWA menjadi **native app** di App Store & Play Store:
- Biometrik authentication (fingerprint/face ID)
- Kamera langsung untuk scan surat
- Offline-first architecture yang lebih robust dari IndexedDB
- Push notification native (lebih reliable dari web push)
- Widget home screen: "3 surat belum ditindaklanjuti"

#### 11.2 — **Portal Warga / Citizen Portal**
*Modul baru: `/portal-warga` (tenant baru, bukan `/dashboard`)*

Warga bisa berinteraksi dengan OPD langsung:
- **Pengaduan Online**: Submit keluhan, pantau status
- **Permohonan Layanan**: Ajukan permohonan dokumen (KTP, KK, izin, dll)
- **Tracking Status**: Seperti tracking paket — "Permohonan Anda sedang diproses di Bidang Perizinan"
- **Rating Layanan**: Warga beri rating setelah layanan selesai
- **Notifikasi Status**: WA/Email otomatis saat status permohonan berubah

*Terhubung dengan modul `Pelayanan Publik` yang sudah ada di SIGAP*

#### 11.3 — **Open API / Webhook Platform**
*Endpoint: `/api/v1/public` + Webhook Manager UI*

Membuka SIGAP sebagai platform:
- **REST API Publik** untuk integrasi sistem pihak ketiga
- **Webhook Manager**: OPD bisa subscribe notifikasi ke sistem mereka
- **API Key Management**: Per-OPD API key dengan rate limiting
- **Developer Portal**: Dokumentasi API publik
- **Sandbox Environment**: Testing tanpa data produksi

---

## 📊 BAGIAN 4 — PRIORITAS & EFFORT MATRIX

| Fitur | Impact | Effort | Prioritas | Fase |
|---|---|---|---|---|
| AI Daily Briefing | 🔴 Sangat Tinggi | 🟢 Rendah | **#1** | VI |
| SIGAP Sentinel (Alert Deadline) | 🔴 Sangat Tinggi | 🟡 Sedang | **#2** | VI |
| SigapCopilot v2 Agentic | 🔴 Sangat Tinggi | 🔴 Tinggi | **#3** | VI |
| Executive Dashboard | 🔴 Sangat Tinggi | 🟡 Sedang | **#4** | IX |
| WhatsApp Integration | 🟠 Tinggi | 🟢 Rendah | **#5** | VIII |
| Konektor SIASN | 🟠 Tinggi | 🔴 Tinggi | **#6** | VIII |
| Cross-OPD Project Space | 🟠 Tinggi | 🔴 Tinggi | **#7** | VII |
| Gamifikasi Achievement | 🟡 Sedang | 🟡 Sedang | **#8** | X |
| Mobile Native App | 🟠 Tinggi | 🔴 Sangat Tinggi | **#9** | XI |
| Citizen Portal | 🟠 Tinggi | 🔴 Sangat Tinggi | **#10** | XI |
| Open API Platform | 🟡 Sedang | 🔴 Tinggi | **#11** | XI |
| Laporan Otomatis Terjadwal | 🟠 Tinggi | 🟢 Rendah | **#12** | IX |

---

## 🛠️ BAGIAN 5 — REKOMENDASI TEKNIS SEGERA

> [!IMPORTANT]
> 3 hal yang bisa langsung dikerjakan minggu ini (low effort, high impact)

### Quick Win #1 — AI Daily Briefing Cron (2-3 hari)
Cron setiap pagi yang memanggil Gemini untuk buat ringkasan personal dan kirim via FCM. Data sudah tersedia di `userSummaries` + `tugas` + `logbook`. Tinggal tambah Cloud Function baru.

### Quick Win #2 — SIGAP Sentinel untuk Deadline (3-4 hari)  
Upgrade cron `sendAgendaReminders` yang sudah ada — tambahkan logika pemantauan `batasWaktu` disposisi dan tugas. Data dan infrastruktur FCM sudah siap.

### Quick Win #3 — WhatsApp Notification via field `nomorWa` (2-3 hari)
Field `nomorWa` sudah ada di `users` schema. Tinggal tambah integrasi Twilio atau WhatsApp Business Cloud API di Cloud Function. Kirim notif penting via WA untuk user yang tidak aktif buka app.

---

## 🧱 BAGIAN 6 — ARSITEKTUR REKOMENDASI

### Upgrade Agent Skills yang Diperlukan

Setelah roadmap ini disetujui, beberapa skill baru perlu dibuat:
- `sigap-sentinel-agent` — Panduan implementasi AI Sentinel monitoring
- `sigap-analytics-patterns` — Pola query dan visualisasi data kinerja
- `sigap-integration-hub` — Template konektor sistem eksternal
- `sigap-citizen-portal` — Arsitektur portal warga
- `sigap-mobile-patterns` — Pola offline-first untuk React Native

### Firestore Schema Additions yang Dibutuhkan

```typescript
// Koleksi Baru yang Diperlukan

// 1. Sentinel Alerts
interface SentinelAlert {
  suratId?: string;
  tugasId?: string;
  disposisiId?: string;
  alertType: 'deadline_approaching' | 'overdue' | 'escalation' | 'bottleneck';
  targetJabatanId: string;
  isRead: boolean;
  createdAt: Timestamp;
}

// 2. Proyek Bersama
interface Proyek {
  namaProyek: string;
  opdIds: string[];
  koordinatorOpdId: string;
  anggotaNips: string[];
  milestones: Array<{ id: string; nama: string; target: Timestamp; status: string }>;
  status: 'Aktif' | 'Selesai' | 'Ditunda';
  createdAt: Timestamp;
}

// 3. Achievements
interface UserAchievement {
  nip: string;
  opdId: string;
  badges: string[];
  streakHariIni: number;
  totalSuratDiproses: number;
  totalTugasSelesai: number;
  updatedAt: Timestamp;
}

// 4. Citizen Requests
interface PermohonanWarga {
  opdId: string;
  nama: string;
  nik: string;
  jenisPermohonan: string;
  dokumenPendukung: string[];
  status: 'Baru' | 'Diproses' | 'Selesai' | 'Ditolak';
  handlerJabatanId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 📅 BAGIAN 7 — TIMELINE VISUAL

```
SEP 2026   |████████████| FASE VI — AI Intelligence Layer
           |  Sentinel + Daily Briefing + Copilot Agentic

OKT 2026   |████████████| FASE VII — Workspace Kolaborasi
           |  Cross-OPD Project + Shared Calendar + Disposisi Lintas Instansi

NOV 2026   |████████████| FASE VIII — Integrasi Ekosistem Nasional
           |  SIASN + e-Kinerja BKN + WhatsApp + SPSE

DES 2026   |████████████| (Buffer & Polish)
           |  Testing, bug fixing, performance optimization

JAN 2027   |████████████| FASE IX — Analytics & Decision Intelligence
           |  Executive Dashboard + Laporan Otomatis + Predictive AI

FEB 2027   |████████████| FASE X — Engagement & Gamifikasi
           |  Achievement System + Micro-Learning + Feedback Loop

MAR 2027   |████████████| FASE XI — Mobile & Citizen
           |  Mobile Native App + Portal Warga + Open API
```

---

## 💎 VISI JANGKA PANJANG

RUANG SIGAP bukan hanya **E-Office**, tapi menjadi:

> **"Operating System for Indonesian Government"**

Satu platform yang mengintegrasikan semua aspek pekerjaan ASN:
- Persuratan & Disposisi (✅ Sudah ada)
- Manajemen Kinerja E-Kinerja (✅ Sudah ada)
- Koordinasi & Kolaborasi (🚧 Fase VII)
- Integrasi Sistem Nasional (🚧 Fase VIII)
- Decision Intelligence (🚧 Fase IX)
- Citizen Services (🚧 Fase XI)

**Competitive Moat**: Sistem manapun bisa buat fitur, tapi data historis + AI model yang sudah terlatih dengan konteks birokrasi Indonesia adalah *unfair advantage* yang sulit ditiru.

---

*Dokumen ini adalah proposal roadmap untuk didiskusikan dan disetujui. Setiap fase akan dikerjakan secara iteratif dengan deployment mingguan.*
