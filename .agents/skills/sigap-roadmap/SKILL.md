---
name: sigap-roadmap
description: >
  Roadmap pengembangan SIGAP E-Office yang sesungguhnya — 5 Fase dari Agustus 2025
  hingga kini. Gunakan saat: merencanakan fitur baru, menjelaskan kapabilitas sistem
  ke calon pengguna, menulis changelog, atau memvalidasi apakah suatu fitur sudah ada.
  JANGAN menambahkan fitur ke roadmap yang belum dibangun di codebase.
---

# Roadmap Sesungguhnya SIGAP E-Office

Dokumen ini adalah **ground truth** rekam jejak pembangunan sistem SIGAP.
Setiap fase dan fitur yang tercantum di sini **sudah diimplementasikan** dalam codebase produksi.

---

## Prinsip Penting

1. **Roadmap = Fakta, bukan Aspirasi**: Jangan menulis fitur yang tidak ada di `src/` atau `functions/` ke dalam roadmap publik.
2. **Verifikasi Dulu**: Sebelum mencantumkan fitur ke dokumen publik (changelog, landing page, dll), verifikasi keberadaannya di codebase.
3. **Living Document**: Update roadmap ini setiap kali fase baru selesai dibangun.

---

## Fase I — MVP Persuratan & Disposisi Dasar
**Agustus – Oktober 2025**

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
**November 2025 – Januari 2026**

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
**Februari – April 2026**

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
**Mei – Juli 2026**

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
**Agustus 2026 — Sekarang**

Fitur yang dibangun:
- Disposisi multi-level cross-jabatan (5+ level: Kepala Daerah → Pelaksana)
- `DispositionTracker.tsx`: visualisasi tree/timeline disposisi
- `RiwayatDisposisi.tsx`: log lengkap setiap perubahan disposisi
- `ActivityLogSection.tsx`: audit trail per dokumen surat
- Dukungan jabatan PLT (Pelaksana Tugas) pada alur disposisi
- Modul Pengumuman Instansi
- Smart Greeting + Quick Access beranda personal
- Landing Page + 4 halaman publik baru (fitur, keamanan, replikasi, changelog)

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

---

## Catatan Teknis Penting

- **Schema Firestore**: Rujuk `sigap-firestore-schema` SKILL untuk detail koleksi
- **Cloud Functions**: Semua notifikasi & trigger ada di `functions/`
- **AI API Routes**: Ada di `src/app/api/ai/` (copilot, suggest-disposition, suggest-eskalasi, grammar, dll)
- **Hooks**: Semua data fetching terpusat di `src/app/dashboard/sigap/hooks/`
- **Logbook Utils**: `src/lib/logbookUtils.ts` — gunakan `writeLogbookEntry()` untuk auto-log
