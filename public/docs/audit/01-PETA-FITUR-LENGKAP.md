# PETA FITUR LENGKAP - RUANG SIGAP

> **Audit Komprehensif Frontend ke Backend**
> Dokumen ini memetakan seluruh fitur yang ada dalam aplikasi digitalisasi administrasi **RUANG SIGAP**, mencakup modul frontend (Next.js), backend (Firebase Cloud Functions), infrastruktur database (Firestore), dan layanan eksternal yang terintegrasi.
>
> _Dibuat berdasarkan audit kode sumber pada: 21 Agustus 2026_

---

## ARSITEKTUR SISTEM OVERVIEW

```
FRONTEND                   |  BACKEND
Next.js 15 (App Router)    |  Firebase Cloud Functions v2
React 18 + TypeScript      |  Google Cloud Run (asia-southeast2)
Tailwind CSS + shadcn/ui   |  Firestore (Realtime DB)
Framer Motion              |  Firebase Auth
TanStack Query             |  Firebase Storage
PWA (offline support)      |  Firebase FCM (Push Notif)

INTEGRASI EKSTERNAL
Google Drive API | Gemini AI API | Calendar API
```

---

## VARIAN TEMA UI

Sistem memiliki **dua tema tampilan** yang dapat dipilih per-OPD maupun per-user:

| Tema | Path | Keterangan |
|------|------|-----------|
| **SIGAP** | `/dashboard/sigap/` | Tampilan modern, default untuk kebanyakan OPD |
| **POROS** | `/dashboard/poros/` | Tampilan alternatif, sedang dalam masa transisi |

Kedua tema memiliki **struktur route yang identik** dengan komponen dan styling berbeda.

---

## MODUL 1: AUTENTIKASI & PROFIL

### 1.1 Login (`/login`)

| Fitur | Implementasi |
|-------|-------------|
| Login via NIP | `getEmailFromNip()` Cloud Function -> Firebase Auth |
| Login via Email | Langsung Firebase Auth (Admin/Staf TU) |
| Login via Google OAuth | Firebase Auth Google Provider |
| JWT Custom Claims | `setNipClaim()` menyimpan level jabatan, opdId, theme |
| Redirect berdasarkan tema | Middleware redirect ke `/sigap` atau `/poros` |

**Backend Functions:**
- `checkAdminEmail` - Validasi email Admin/Staf TU
- `getEmailFromNip` - Konversi NIP ke email untuk login
- `setNipClaim` - Set custom claims JWT (level, opdId, role, theme)

### 1.2 Profil Pengguna (`/dashboard/profil`)

| Fitur | Keterangan |
|-------|-----------|
| Edit data personal | Nama, NIP, No. WA, golongan |
| Hubungkan Google Account | OAuth flow -> simpan `googleRefreshToken` |
| Set folder Google Drive E-Kinerja | URL folder Drive untuk upload bukti kinerja |
| Preferensi notifikasi | Toggle per jenis notifikasi (surat, disposisi, tugas) |
| Pilih tema tampilan | SIGAP / POROS per-user override |
| Sinkronisasi Google Calendar | Toggle untuk kalender |

**Koleksi Firestore:** `users/{nip}`

---

## MODUL 2: MANAJEMEN SURAT MASUK

### 2.1 Kotak Masuk (`/dashboard/surat`)

| Fitur | Detail |
|-------|--------|
| Tampilan Dua Panel | Panel kiri (daftar) + panel kanan (detail + PDF viewer) |
| Tab Filter Status | Semua / Baru / Proses Tindak Lanjut / Selesai / Pemantauan |
| Search Real-time | Pencarian by perihal, nomor, pengirim |
| Input Surat Baru | Form dengan validasi Zod + upload PDF |
| AI Scan Surat | Kirim base64 PDF -> Gemini API -> auto-fill form |
| Drag & Drop Upload | Upload file via drag and drop |
| Preview PDF In-App | PDF.js untuk render surat langsung di browser |
| Jejak Audit | Tab riwayat semua aksi pada surat |
| Tab Pemantauan | Khusus pimpinan, lihat siapa terima/sudah lapor |

**Alur Status Surat:**
```
Baru -> Didisposisikan -> Proses Tindak Lanjut -> Selesai -> Diarsipkan
         |                                                    |
         +------ Revisi Disposisi (kembali ke Baru) ---------+
```

**Klasifikasi Surat:** Biasa | Penting | Segera | Rahasia

**Jenis Surat:** Undangan | Pemberitahuan | Permohonan | Lainnya

**Koleksi Firestore:** `surat/{suratId}`

**Backend Triggers:**
- `onSuratSummaryUpdate` - Update counter KPI saat status surat berubah
- `onSuratCreate` - Auto-generate search keywords, set `tujuanJabatanId`

### 2.2 Surat Lintas OPD

| Fitur | Detail |
|-------|--------|
| Kirim surat antar instansi | `lintasOpd.ts` Cloud Function |
| Tracking status lintas OPD | `dikirim` -> `diterima` -> `ditolak` |
| Isolasi data per-OPD | Firestore Rules + query filter `opdId` |

---

## MODUL 3: RUANG KERJA

**Path:** `/dashboard/ruang-kerja`

**4 Jenis Item yang Tampil di Feed:**

| Tipe Item | Kondisi Tampil | Aksi Tersedia |
|-----------|---------------|---------------|
| **SURAT_BARU** | Pimpinan level 1-5, surat belum didisposisikan | Disposisikan / Tindaklanjuti Sendiri |
| **SURAT_DISPOSISI** | Semua user, ada disposisi aktif ke jabatan ini | Terima / Lapor TL / Disposisi Lanjut / Eskalasi |
| **TUGAS** | User dengan tugas aktif | Mulai / Selesai / Komentar |
| **DRAF_PERSETUJUAN** | Pimpinan, ada draf menunggu review | Setujui / Revisi + catatan |

**Fitur Khusus:**
- Optimistic UI - item langsung hilang dari feed saat diaksi (tanpa tunggu server)
- Overdue items selalu muncul di atas
- Filter tabs: Semua | Surat/Disposisi | Tugas | Draf | Agenda & Catatan

**Panel Samping Kanan (Desktop):**
- Quick Links Widget - Link favorit personal user
- Sticky Note - Catatan tempel digital
- Agenda 7 Hari - Preview agenda minggu ini

---

## MODUL 4: DISPOSISI DIGITAL

**Koleksi Firestore:** `disposisi/{disposisiId}`

**Alur Disposisi:**
```
Pimpinan -> [Disposisikan] -> Form Disposisi -> Simpan ke Firestore
                                                    |
                                    Cloud Function: onDisposisiCreate
                                                    |
                              Notifikasi FCM ke penerima
                              Update status surat
                                                    |
                    Penerima -> [Terima Disposisi] -> penerimaDiterima[]
                                                    |
                    onDisposisiSummaryUpdate -> update KPI counter
                                                    |
                    Penerima -> [Lapor TL] -> TindakLanjut doc
                                                    |
                    onTindakLanjutCreate -> notif ke pengirim
                                                    |
                    Penerima -> [Selesaikan & Tutup] -> penerimaSelesai[]
                                                    |
                    Semua selesai? -> Surat status "Selesai"
```

| Fitur Disposisi | Detail |
|----------------|--------|
| Multi-penerima | Centang beberapa jabatan sekaligus |
| Templat instruksi | Pilih dari bank templat, auto-fill instruksi |
| Batas waktu | Deadline opsional, penanda overdue |
| Normal vs Informasional | Normal = wajib lapor; Informasional = hanya FYI |
| Tembusannya | CC ke jabatan lain tanpa perlu tindak lanjut |
| Disposisi Lanjut | Pelaksana bisa subdelegasi ke bawahannya |
| Eskalasi | Pelaksana kembalikan ke atasan dengan alasan |
| Revisi Disposisi | Pimpinan bisa minta perbaikan disposisi |

**Backend Triggers:**
- `onDisposisiCreate` - Kirim FCM push notif ke penerima, buat logbook pengirim
- `onDisposisiSummaryUpdate` - Sinkronisasi counter KPI (disposisiBaru, tindakLanjutMenunggu)
- Auto-cleanup self-disposition

---

## MODUL 5: LOGBOOK HARIAN

**Path:** `/dashboard/logbook`
**Koleksi Firestore:** `logbook/{userId}_{tanggal}`

| Fitur | Detail |
|-------|--------|
| Auto-entry dari aksi sistem | Disposisi kirim/terima, laporan TL, selesaikan tugas, arsip |
| Tambah kegiatan manual | Form "Smart Add" dengan mode Umum dan Tindak Lanjut |
| Navigasi tanggal | Mundur/maju satu hari, ketik tanggal langsung |
| Progress bar harian | Persentase kegiatan yang ditandai selesai |
| Rekap Bulanan | Generate PDF rekap atau upload langsung ke Google Drive |

**Kategori Kegiatan:** Surat | Disposisi | Tugas | Rapat | Laporan | Umum

**Auto-entry yang dibuat sistem:**
| Aksi | Entri Logbook |
|------|--------------|
| Kirim disposisi | "Mendisposisikan surat: [Perihal]" |
| Terima disposisi | "Menerima disposisi surat: [Perihal]" |
| Kirim laporan | "Tindak Lanjut Surat: [Perihal] - [Judul Laporan]" |
| Selesaikan surat | "Menyelesaikan surat: [Perihal]" |
| Eskalasi surat | "Eskalasi surat ke pimpinan: [Perihal]" |
| Arsipkan surat | "Mengarsipkan surat: [Perihal]" |
| Selesaikan tugas | "Menyelesaikan tugas: [Judul Tugas]" |

---

## MODUL 6: LAPORAN TINDAK LANJUT

**Koleksi Firestore:** `tindak_lanjut/{id}`

| Fitur | Detail |
|-------|--------|
| Form laporan | Judul, isi, warna label, checklist, lampiran Google Drive |
| Dua mode kirim | Kirim (proses lanjut) vs Selesaikan & Tutup (tutup disposisi) |
| Edit laporan | Hanya pembuat yang bisa edit laporannya sendiri |
| Warna label | Default / Merah / Hijau / Biru / Kuning / Ungu |
| Checklist item | Daftar poin tugas dengan centang selesai/belum |
| Auto-save ke Bukti Kinerja | Setiap laporan otomatis masuk Bukti Kinerja |

---

## MODUL 7: BUKTI KINERJA (E-KINERJA)

**Path:** `/dashboard/bukti-kinerja`
**Koleksi Firestore:** `bukti_kinerja/{id}`

| Sumber Data | Badge Label |
|------------|------------|
| Laporan Tindak Lanjut | "Laporan TL" |
| Tugas yang Diselesaikan | "Penyelesaian Tugas" |
| Upload Manual | "Manual Upload" |

**Fitur Ekspor:**
- Download PDF laporan kinerja per periode
- Upload ke Google Drive ke folder E-Kinerja dengan nama terformat:
  `8. 2026 Agustus - Bukti E Kinerja`

---

## MODUL 8: AGENDA HARIAN

**Path:** `/dashboard/agenda`

**Sumber Data:**
1. Surat jenis "Undangan" dengan `detailAgenda` terisi (otomatis)
2. Jadwal internal dari modul Jadwal Tempat

**Backend Cron:**
- `sendAgendaReminders` - Setiap 15 menit, kirim push notif 1 jam sebelum agenda
- `archiveOldInvitations` - Setiap hari 01:00 WIB, auto-arsipkan undangan yang sudah lewat

**Fitur Notulensi Cepat:** Dari kartu agenda -> buat notulensi dengan data rapat pre-filled

---

## MODUL 9: ARSIP DIGITAL

**Path:** `/dashboard/arsip`

| Fitur | Detail |
|-------|--------|
| Pencarian teks | By perihal, nomor, pengirim |
| Filter status | Semua / Selesai / Diarsipkan |
| Filter jenis surat | Undangan / Pemberitahuan / Permohonan / Lainnya |
| Paginasi | 10 surat per halaman |
| Detail surat lengkap | File PDF, riwayat disposisi, laporan TL, jejak audit |

---

## MODUL 10: MANAJEMEN TUGAS

**Path:** `/dashboard/tugas`
**Koleksi Firestore:** `tugas/{tugasId}`

| Fitur | Detail |
|-------|--------|
| Status alur | Baru -> Dikerjakan -> Selesai / Dibatalkan |
| Sub-tugas | Pecah tugas menjadi poin-poin kecil |
| Komentar | Chat antara pemberi dan penerima tugas |
| Lampiran | File atau link relevan |
| Delegasi | Penerima bisa meneruskan ke pihak lain |
| Prioritas | Tinggi / Sedang / Rendah |
| Kategori | Penyusunan Laporan / Analisis Data / Koordinasi / dll |

---

## MODUL 11: CHECKLIST BOARD (KANBAN)

**Path:** `/dashboard/checklist`
**Koleksi Firestore:** `checklist_boards/{id}`

Papan visual tiga kolom: **Todo - In Progress - Done**

---

## MODUL 12: BANK TEMPLAT INSTRUKSI

**Path:** `/dashboard/bank-templat`
**Koleksi Firestore:** `instruksi_templat/{id}`

Simpan instruksi disposisi yang sering dipakai. Support berbagi ke instansi lain (`sharedWithOpdIds`).

---

## MODUL 13: REPOSITORI DOKUMEN

**Path:** `/dashboard/dokumen`
**Koleksi Firestore:** `dokumen_folders/{id}`, `dokumen_links/{id}`

Struktur folder-subfolder dengan dukungan: folder, link URL, upload file (PDF/Excel/Word/gambar/video).

---

## MODUL 14: JADWAL TEMPAT / BOOKING RUANG

**Path:** `/dashboard/jadwal`
**Koleksi Firestore:** `jadwal_tempat/{id}`

| Fitur | Detail |
|-------|--------|
| Booking ruang rapat | Nama tempat, kegiatan, penanggung jawab, waktu |
| Alur persetujuan | Menunggu -> Disetujui / Ditolak |
| Mode Fisik & Virtual | Nama tempat fisik atau tautan meeting online |
| Auto-integrasi Agenda | Jadwal disetujui otomatis muncul di Agenda Harian peserta |

---

## MODUL 15: PERSETUJUAN DRAF DOKUMEN

**Path:** `/dashboard/persetujuan-draf`
**Koleksi Firestore:** `draf_persetujuan/{id}`

| Fitur | Detail |
|-------|--------|
| Submit Google Docs URL | Draf dokumen dari Google Docs |
| Rantai persetujuan | Konfigurasi siapa saja dan urutan approval |
| Status per step | Menunggu / Disetujui / Revisi |
| Notifikasi ke reviewer | Kartu muncul di Ruang Kerja reviewer |
| Revisi + catatan | Reviewer bisa beri catatan saat meminta revisi |

---

## MODUL 16: KNOWLEDGE BASE

**Path:** `/dashboard/knowledge`
**Koleksi Firestore:** `knowledge_articles/{id}`

Repositori artikel, SOP, panduan internal. Bisa dibagikan antar instansi.

---

## MODUL 17: NOTULENSI RAPAT

**Koleksi Firestore:** `notulensi_rapat/{id}`

Bisa dibuat manual atau otomatis dari Agenda/Ruang Kerja dengan data rapat pre-filled.

---

## MODUL 18: SURAT KELUAR

**Path:** `/dashboard/surat-keluar`

Manajemen pencatatan surat yang dikirim keluar oleh instansi.

---

## MODUL 19: NOTIFIKASI

### Push Notification (FCM)

| Event Trigger | Penerima |
|--------------|---------|
| Disposisi baru | Penerima disposisi |
| Disposisi diterima | Pengirim disposisi |
| Laporan TL baru | Pengirim disposisi |
| Tugas baru | Penerima tugas |
| Eskalasi masuk | Target eskalasi |
| Agenda 1 jam lagi | Semua penerima disposisi surat undangan |
| Pengumuman | Sesuai target OPD |

### In-App Notification
**Koleksi Firestore:** `notifications/{id}` (realtime listener pada ikon lonceng)

---

## MODUL 20: AI (KECERDASAN BUATAN)

**Model:** Gemini 2.5 Flash Lite (via Google Generative Language API)
**Security:** Gemini API Key disimpan di Google Cloud Secret Manager

| Fungsi AI | Implementasi | Feature Gate |
|-----------|-------------|-------------|
| AI Scan Surat | `extractSuratDataAIV2` - Baca PDF, extract metadata lengkap | `OpdConfig.features.aiSuratReader` |
| AI Ringkasan Eksekutif | Field `ringkasanEksekutif` di dokumen Surat | Termasuk dalam AI Scan |
| AI Saran Disposisi | `suggestedDisposisi[]` dan `suggestedPenerimaIds[]` | Roadmap |
| AI Notulensi | Bantu susun isi notulensi | `OpdConfig.features.aiNotulensi` |
| Rate Limiting | Cooldown 30 detik per user, via Firestore transaction | Built-in |

---

## MODUL 21: PANEL ADMIN OPD

**Path:** `/dashboard/(admin)/`

| Sub-modul | Fitur |
|-----------|-------|
| Manajemen Jabatan | CRUD jabatan, atur hierarki level, assign PLT |
| Manajemen Users | CRUD user, activate/deactivate, reset password |
| Pengaturan OPD | Konfigurasi instansi, logo, fitur aktif |
| Pengaturan UI | Default tema, preferensi tampilan instansi |
| Pengumuman | Buat pengumuman ke semua user atau OPD tertentu |
| Form Builder | Buat formulir kustom dengan berbagai tipe field |
| Laporan Langganan | Lihat status paket dan tagihan |
| Feedback Admin | Lihat dan kelola feedback/bug report dari user |
| PLT (Pejabat Pelaksana Tugas) | Tunjuk PLT untuk jabatan yang kosong/cuti |

---

## MODUL 22: LAPORAN & ANALITIKA KINERJA

**Path:** `/dashboard/laporan`

| Fitur | Akses |
|-------|-------|
| Total surat masuk per periode | Pimpinan + Admin |
| Surat selesai vs terlambat | Pimpinan + Admin |
| Rata-rata waktu respons | Pimpinan + Admin |
| Grafik tren volume surat | Pimpinan + Admin |
| Tabel beban kerja per jabatan | Pimpinan + Admin |
| Tabel kinerja per jabatan | Pimpinan + Admin |
| Laporan mingguan otomatis | Pimpinan + Admin |

**Backend Cron:**
- `generateDailyPerformanceStats` - Setiap 02:00 WIB, agregasi kinerja per OPD
- `generateWeeklyReport` - Setiap Jumat, laporan mingguan ke pimpinan

---

## MODUL 23: FITUR FUNGSIONAL KHUSUS

Tersedia untuk role fungsional spesifik (`additionalRoles`):

| Modul | Role | Keterangan |
|-------|------|-----------|
| Manajemen Aset | `pengurus_barang` | CRUD aset, maintenance, peminjaman |
| Keuangan & SPJ | `bendahara` | Transaksi, kertas kerja, opname kas |
| Notulensi Rapat | `notulis_rapat` | Buat notulensi rapat |
| Pelayanan Publik | `petugas_pelayanan` | Layanan warga, pengambilan dokumen |
| Tata Pemerintahan | `pengelola_tapem` | Kerja sama, data wilayah |
| SKW Kelurahan | `petugas_kelurahan` | Surat Keterangan Waris digital |

---

## MODUL 24: INFRASTRUKTUR BACKEND

### Cloud Functions

| Modul | Fungsi | Trigger |
|-------|--------|---------|
| `aiFunctions.ts` | AI scan surat | HTTP Callable |
| `api/index.ts` | Auth & manajemen user/OPD | HTTP Callable |
| `triggers/index.ts` | 10+ event triggers | Firestore onCreate/onUpdate/onDelete |
| `triggers/logbookTriggers.ts` | Auto-logbook | Firestore onCreate |
| `triggers/doubleWrite.ts` | Sinkronisasi koleksi | Firestore onWrite |
| `cron/index.ts` | Jadwal otomatis | Cloud Scheduler |
| `agregasiSummaries.ts` | Agregasi KPI | HTTP Callable |
| `autoHeal.ts` | Auto-repair data | HTTP Callable |
| `backupFunction.ts` | Backup Firestore | HTTP Callable |
| `lintasOpd.ts` | Surat lintas instansi | HTTP Callable |
| `compressPdf.ts` | Kompresi PDF | HTTP Callable |

### Scheduled Cron Jobs

| Job | Jadwal | Fungsi |
|-----|--------|--------|
| `sendAgendaReminders` | Setiap 15 menit | Push notif 1 jam sebelum agenda |
| `archiveOldInvitations` | 01:00 WIB harian | Auto-arsip undangan lewat tanggal |
| `generateDailyPerformanceStats` | 02:00 WIB harian | Agregasi kinerja per OPD |
| `generateWeeklyReport` | Jumat tiap minggu | Laporan mingguan ke pimpinan |
| `checkOverdueTasks` | Setiap pagi | Tandai tugas lewat deadline |
| `generateTagihan` | Bulanan | Generate tagihan langganan per OPD |

### Koleksi Firestore Utama

```
Database ID: database-siyap | Region: asia-southeast2 (Jakarta)

users/              -> Profil semua pengguna
jabatan/            -> Struktur jabatan per OPD
opd/                -> Data instansi
opd_config/         -> Konfigurasi paket & fitur per OPD
surat/              -> Semua surat masuk
disposisi/          -> Rantai disposisi
tindak_lanjut/      -> Laporan tindak lanjut
logbook/            -> Logbook harian per user
tugas/              -> Manajemen tugas
bukti_kinerja/      -> Bukti E-Kinerja
notifications/      -> Notifikasi in-app
jadwal_tempat/      -> Booking ruang rapat
draf_persetujuan/   -> Persetujuan draf dokumen
notulensi_rapat/    -> Catatan notulensi
knowledge_articles/ -> Knowledge base
instruksi_templat/  -> Bank templat instruksi
dokumen_folders/    -> Folder repositori dokumen
dokumen_links/      -> Link/file repositori dokumen
checklist_boards/   -> Papan kanban personal
kinerja_agregat/    -> Data agregat kinerja OPD
aset_inventaris/    -> Data aset (fungsional)
keuangan_transaksi/ -> Transaksi keuangan (fungsional)
tagihan/            -> Tagihan langganan
activity_logs/      -> Jejak audit per surat
rate_limits/        -> Rate limiting AI
```

---

## MODUL 25: OFFLINE & PWA

| Fitur | Detail |
|-------|--------|
| Service Worker | Cache halaman dan aset statik |
| Offline queue | Aksi yang dilakukan offline di-queue dan sync saat online |
| Install prompt | `InstallPwaButton.tsx` - ajak user install ke home screen |
| Offline indicator | Banner notif saat koneksi terputus |

---

## MODUL 26: KEAMANAN & MIDDLEWARE

| Fitur | Implementasi |
|-------|-------------|
| Auth guard semua route `/dashboard` | Middleware redirect ke `/login` |
| Role-based routing | Custom JWT claims -> redirect ke tema yang benar |
| Data isolation per-OPD | Semua query filter by `opdId` |
| Firestore Security Rules | Validasi write per collection |
| CORS | Whitelist domain untuk Cloud Functions |
| Rate limiting AI | Firestore transaction-based cooldown 30 detik |

---

## MODUL 27: INTEGRASI EKSTERNAL

| Integrasi | Fungsi |
|-----------|--------|
| **Google Drive** | Upload bukti kinerja, rekap logbook |
| **Google OAuth** | Login & koneksi akun Google |
| **Gemini AI** | AI scan surat, ringkasan eksekutif |
| **Google Calendar** | (Opsional) Sinkronisasi agenda |
| **FCM** | Push notification ke browser/HP |
| **WhatsApp** | (Roadmap) Notifikasi WA via `whatsapp.ts` |

---

## MODUL 28: SISTEM LANGGANAN & BILLING

**Paket Tersedia:** Dasar | Profesional | Enterprise | Custom

| Fitur Gate | Dasar | Profesional | Enterprise |
|------------|-------|------------|-----------|
| AI Surat Reader | Tidak | Ya | Ya |
| AI Notulensi | Tidak | Tidak | Ya |
| Analitika Kinerja | Tidak | Ya | Ya |
| Manajemen Aset | Tidak | Ya | Ya |
| Persetujuan Draf | Tidak | Ya | Ya |
| Form Builder | Tidak | Ya | Ya |
| Surat Lintas OPD | Tidak | Tidak | Ya |

**Billing:** Generate tagihan bulanan otomatis berdasarkan jumlah pengguna aktif x harga paket.

---

*Dokumen ini bagian dari seri audit. Lihat juga:*
- `02-PETA-FUNGSI-BACKEND.md` - Detail fungsi backend
- `03-ESTIMASI-BIAYA.md` - Kerangka estimasi biaya
- `04-RINGKASAN-EKSEKUTIF.md` - Ringkasan dan kesimpulan
