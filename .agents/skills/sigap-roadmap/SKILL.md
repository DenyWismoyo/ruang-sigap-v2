---
name: sigap-roadmap
description: >
  Roadmap pengembangan SIGAP E-Office — Fase I–V SUDAH SELESAI (Agustus 2025–Agustus 2026).
  Fase VI–XI adalah roadmap yang sedang/akan dikerjakan (September 2026–April 2027).
  Gunakan saat: merencanakan fitur baru, menjelaskan kapabilitas sistem ke calon pengguna,
  menulis changelog, atau memvalidasi apakah suatu fitur sudah ada.
  JANGAN menambahkan fitur ke roadmap "Sudah Dibangun" yang belum ada di codebase.
---

# Roadmap SIGAP E-Office — Ground Truth

Dokumen ini adalah **ground truth** rekam jejak pembangunan dan rencana sistem SIGAP.
**Fase I–V** = sudah diimplementasikan di codebase produksi.
**Fase VI–XI** = roadmap yang direncanakan, belum dibangun.

---

## Prinsip Penting

1. **Roadmap = Fakta + Rencana Terpisah Jelas**: Selalu bedakan "sudah dibangun" vs "direncanakan".
2. **Verifikasi Dulu**: Sebelum mencantumkan fitur ke dokumen publik (changelog, landing page, dll), verifikasi keberadaannya di codebase.
3. **Living Document**: Update roadmap ini setiap kali fase baru selesai dibangun.
4. **Jangan Promosikan Rencana sebagai Fakta**: Fase VI ke atas adalah rencana — jangan sebut sebagai fitur existing ke calon user.

---

## Fase I — MVP Persuratan & Disposisi Dasar
**Agustus – Oktober 2025** ✅ SELESAI

Fitur yang dibangun:
- Input surat masuk (form lengkap: nomor, perihal, pengirim, tanggal, jenis, PDF)
- Kotak masuk + filter status/jenis
- Disposisi dasar: pilih jabatan penerima, catatan, batas waktu
- Lifecycle status: Baru → Didisposisikan → Selesai
- Agenda Harian terintegrasi surat
- Autentikasi Firebase Auth (Google OAuth)
- Multi-OPD tenant isolation via Firestore Security Rules

---

## Fase II — AI, Role Management & Arsip
**November 2025 – Januari 2026** ✅ SELESAI

Fitur yang dibangun:
- Manajemen jabatan struktural (Eselon II/III/IV/Pelaksana) per OPD
- Admin Panel: registrasi pegawai, pemetaan user ke jabatan
- AI Input Surat: ekstraksi otomatis data dari PDF via Gemini (`/api/ai/draft-form`)
- AI Saran Disposisi: rekomendasi penerima (`/api/ai/suggest-disposition`)
- Full-text search via `searchKeywords[]` array index
- Modul Arsip digital (warna, kategori)
- Preview PDF inline

---

## Fase III — Ruang Kerja, Disposisi Berjenjang & Laporan
**Februari – April 2026** ✅ SELESAI

Fitur yang dibangun:
- Ruang Kerja: feed terpadu (disposisi + tugas + agenda)
- Disposisi multi-level berjenjang dengan lacak setiap level
- Tindak Lanjut: laporan progres + bukti + selesai oleh pelaksana
- Tab Pemantauan real-time pimpinan
- Manajemen Tugas (QuickAdd, Edit, Checklist)
- Notulensi rapat
- Revisi Disposisi
- PWA: offline queue IndexedDB (`offlineSync.ts`), install prompt

---

## Fase IV — Logbook Terintegrasi & Enterprise Backend
**Mei – Juli 2026** ✅ SELESAI

Fitur yang dibangun:
- Logbook Harian per ASN dengan kategori & timestamp
- Auto-Logbook via `writeLogbookEntry()` & `logActivity()` — setiap aksi sistem mencatat otomatis
- Rekap E-Kinerja bulanan → PDF → upload Google Drive
- SigapCopilot: AI percakapan kontekstual
- AI Suggest Eskalasi (`/api/ai/suggest-eskalasi`)
- AI Grammar & Copywriter
- FCM Push Notification real-time
- Global Search lintas modul
- Rekap Surat dashboard statistik
- Portal Integrasi apps-in-apps

---

## Fase V — Disposisi Lintas Instansi Skala Daerah
**Agustus 2026** ✅ SELESAI

Fitur yang dibangun:
- Disposisi multi-level cross-jabatan (5+ level: Kepala Daerah → Pelaksana)
- `DispositionTracker.tsx`: visualisasi tree/timeline disposisi
- `RiwayatDisposisi.tsx`: log lengkap setiap perubahan disposisi
- `ActivityLogSection.tsx`: audit trail per dokumen surat
- Dukungan jabatan PLT (Pelaksana Tugas) pada alur disposisi
- Modul Pengumuman Instansi
- Smart Greeting + Quick Access beranda personal
- Landing Page + 4 halaman publik baru (fitur, keamanan, replikasi, changelog)
- Role Access Config per OPD via `roleAccessConfig` di `opd_config`

---

## Modul Fungsional Existing (Sudah Dibangun)

| Modul | Kategori | Path |
|---|---|---|
| Notulensi | Tata Persuratan | `/dashboard/notulensi` |
| Surat Keluar | Tata Persuratan | `/dashboard/surat-keluar` |
| Templat Surat | Tata Persuratan | `/dashboard/templat` |
| Jadwal & Kalender | Produktivitas | `/dashboard/jadwal` |
| Kompetensi | SDM | `/dashboard/kompetensi` |
| Talent Management | SDM | `/dashboard/talenta` |
| SKW (Sasaran Kinerja) | E-Kinerja | `/dashboard/skw` |
| Bukti Kinerja | E-Kinerja | `/dashboard/bukti-kinerja` |
| Laporan Tindak Lanjut | Pelaporan | `/dashboard/laporan` |
| Form Builder (Admin) | Administrasi | `/dashboard/form-builder` |
| Dokumen Penagihan | Keuangan | `/dashboard/dokumen-penagihan` |
| Tapem | Modul Khusus | `/dashboard/tapem` |
| Rapat Virtual | Koordinasi | `/dashboard/rapat-virtual` |
| Perencanaan Si-RANA | Analitika | `/dashboard/perencanaan` |
| Evaluasi Kinerja | Analitika | `/dashboard/evaluasi` |
| Pelayanan Publik | Koordinasi | `/dashboard/pelayanan` |

---

## Catatan Teknis Penting

- **Schema Firestore**: Rujuk `sigap-firestore-schema` SKILL untuk detail koleksi
- **Cloud Functions**: Semua notifikasi & trigger ada di `functions/`
- **AI API Routes**: Ada di `src/app/api/ai/` (copilot, suggest-disposition, suggest-eskalasi, grammar, dll)
- **AI Functions**: `functions/src/aiFunctions.ts` — extractSuratDataAIV2, extractVoiceDisposisiAIV2, agentStrategicDisposition
- **Hooks**: Semua data fetching terpusat di `src/app/dashboard/sigap/hooks/`
- **Logbook Utils**: `src/lib/logbookUtils.ts` — gunakan `writeLogbookEntry()` untuk auto-log
- **Cron Jobs**: `functions/src/cron/` — sendAgendaReminders (15min), dailyKinerjaAggregator, aggregateHealthScore

---

## ═══════════════════════════════════════
## ROADMAP MENDATANG (Belum Dibangun)
## Gunakan untuk PERENCANAAN SAJA
## ═══════════════════════════════════════

> **PENTING**: Fase VI ke bawah adalah RENCANA, bukan fakta codebase.
> Update menjadi "SELESAI" hanya setelah fitur benar-benar ada di `src/` atau `functions/`.

---

## Fase VI — "SIGAP Intelligence Layer" 🚧 DIRENCANAKAN
**Target: September – Oktober 2026**

Fitur yang direncanakan:
- **SIGAP Sentinel**: Cron per jam memantau deadline disposisi/tugas, kirim alert proaktif via FCM
- **AI Daily Briefing**: Cron pukul 07.00 WIB — ringkasan harian personal ke setiap ASN via push notification
- **SigapCopilot v2 Agentic**: Upgrade dari chatbot ke AI Agent yang bisa eksekusi aksi (buat disposisi, query surat, tambah jadwal)
- Rujuk skill `sigap-sentinel-and-proactive-ai` untuk pola implementasi

---

## Fase VII — "Workspace Kolaborasi Antar-Instansi" 🚧 DIRENCANAKAN
**Target: Oktober – November 2026**

Fitur yang direncanakan:
- **Ruang Proyek Bersama**: Workspace kolaborasi lintas OPD untuk proyek daerah (koleksi `proyek` baru)
- **Disposisi Lintas OPD Enhanced**: Upgrade feature flag `lintasOpd` yang sudah ada
- **Shared Calendar Sinkronisasi**: Manfaatkan field `googleCalendarSyncEnabled` yang sudah di schema `users`

---

## Fase VIII — "Ekosistem Integrasi Nasional" 🚧 DIRENCANAKAN
**Target: November – Desember 2026**

Fitur yang direncanakan:
- **Konektor SIASN/BKN**: Sinkronisasi data ASN otomatis dari API BKN
- **Konektor e-Kinerja BKN**: Export logbook SIGAP → format BKN, zero double-entry
- **WhatsApp Business Integration**: Notifikasi via WA — field `nomorWa` sudah ada di `users` schema, tinggal dipakai
- **Integrasi SPSE/SIMDA**: Webhook receiver untuk sistem pemerintahan lain

---

## Fase IX — "Analytics & Decision Intelligence" 🚧 DIRENCANAKAN
**Target: Januari – Februari 2027**

Fitur yang direncanakan:
- **Executive Intelligence Dashboard**: Heatmap beban kerja, bottleneck detection, SLA compliance
- **Laporan Otomatis Terjadwal**: Cron Jumat sore → laporan mingguan; bulanan → E-Kinerja PDF
- **Predictive Disposition AI**: Upgrade `agentStrategicDisposition` dari 2-agent ke 5-agent orchestrator
- Rujuk skill `sigap-executive-analytics` untuk pola query dan visualisasi

---

## Fase X — "Engagement & Gamifikasi ASN" 🚧 DIRENCANAKAN
**Target: Februari – Maret 2027**

Fitur yang direncanakan:
- **Achievement & Badge System**: Streak logbook, badge "penyelesai tepat waktu", milestone
- **Leaderboard Per Bidang**: Ranking produktivitas per seksi/bidang (bukan personal)
- **Micro-Learning Platform**: Tutorial interaktif dengan quiz dan sertifikat digital

---

## Fase XI — "Mobile-First & Citizen Integration" 🚧 DIRENCANAKAN
**Target: Maret – April 2027**

Fitur yang direncanakan:
- **Mobile Native App**: React Native/Flutter — biometrik, kamera scan surat, widget home screen
- **Portal Warga**: Tenant `/portal-warga` — pengaduan online, permohonan layanan, tracking status
- **Open API Platform**: REST API publik + Webhook Manager + API Key Management per OPD
