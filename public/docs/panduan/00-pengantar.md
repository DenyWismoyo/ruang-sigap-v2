# RUANG SIGAP — Buku Panduan Pengguna

> **Sistem Informasi Governansi & Administrasi Persuratan**
> Versi Dokumen: 2.0 | Edisi: Agustus 2026

---

## Tentang RUANG SIGAP

**RUANG SIGAP** adalah platform manajemen administrasi persuratan digital yang dirancang khusus untuk Perangkat Daerah (OPD/SKPD) di lingkungan Pemerintah Daerah. Sistem ini mengintegrasikan seluruh alur kerja administrasi mulai dari penerimaan surat masuk, proses disposisi berjenjang, tindak lanjut, pelaporan kinerja, hingga pengarsipan ke dalam satu ekosistem digital yang terintegrasi.

---

## Prinsip Utama: 1 Input, 5 Output

Filosofi inti RUANG SIGAP adalah **efisiensi melalui otomasi**. Dari satu kali input surat masuk, sistem secara otomatis menghasilkan **5 output presisi** tanpa perlu double-entry data:

```
    INPUT: SURAT MASUK (1x Entry oleh Staf TU)
                        |
              [ RUANG SIGAP ENGINE ]
                        |
         _______________+_______________
        |       |       |       |       |
        v       v       v       v       v
   AGENDA   DISPOSISI  LAP.TL  E-KINERJA  ARSIP
  HARIAN   (Terkirim) (Record)  (Drive)  (Digital)
```

**Output 1: Agenda Harian** — Surat jenis Undangan otomatis menjadi agenda yang terlihat oleh pimpinan dan penerima disposisi.

**Output 2: Disposisi** — Alur pendelegasian wewenang dari pimpinan ke pelaksana, tercatat dengan instruksi, deadline, dan jejak audit lengkap.

**Output 3: Laporan Tindak Lanjut** — Setiap pelaporan progres tindak lanjut oleh pelaksana tersimpan otomatis dan dapat dilihat oleh pimpinan.

**Output 4: Laporan E-Kinerja** — Aktivitas disposisi, tindak lanjut, dan penyelesaian tugas secara otomatis menjadi bukti kinerja yang dapat diunggah ke Google Drive folder E-Kinerja.

**Output 5: Arsip Digital** — Setiap surat yang telah selesai diproses tersimpan permanen dalam arsip digital yang dapat dicari dan difilter kapan saja.

---

## Struktur Buku Panduan Ini

| No | Dokumen | Topik |
|----|---------|-------|
| 01 | [Panduan Dashboard & Beranda](./01-dashboard.md) | Halaman Utama & Widget Kinerja |
| 02 | [Panduan Kotak Masuk & Surat](./02-kotak-masuk-surat.md) | Manajemen Surat Masuk |
| 03 | [Panduan Ruang Kerja & Disposisi](./03-ruang-kerja-disposisi.md) | Alur Disposisi Persuratan |
| 04 | [Panduan Logbook Harian](./04-logbook.md) | Catatan Kegiatan Harian |
| 05 | [Panduan Laporan Tindak Lanjut](./05-laporan-tindak-lanjut.md) | Pelaporan & Bukti Kinerja |
| 06 | [Panduan Laporan Kinerja](./06-laporan-kinerja.md) | Rekap & Analitika Kinerja |
| 07 | [Panduan Agenda Harian](./07-agenda.md) | Kalender & Jadwal Kegiatan |
| 08 | [Panduan Arsip Digital](./08-arsip.md) | Pengarsipan Surat |
| 09 | [Panduan Fitur Pendukung](./09-fitur-pendukung.md) | Tugas, Checklist, Templat, dll |
| 10 | [Roadmap & Transformasi Digital](./10-roadmap-transformasi.md) | Visi & Pengembangan |

---

## Peran Pengguna (User Roles)

| Peran | Kode | Akses & Fungsi Utama |
|-------|------|----------------------|
| **Staf TU (Tata Usaha)** | `staf_tu` | Input surat masuk, cetak agenda, pengelolaan arsip |
| **Admin OPD** | `admin_opd` | Manajemen pengguna, monitoring seluruh surat OPD (Read-Only) |
| **Pimpinan** | Level <= 5 | Menerima & mendisposisikan surat, melihat laporan kinerja bawahan |
| **Staf Pelaksana** | Level > 5 | Menerima disposisi, melaporkan tindak lanjut |
| **Super Admin** | `super_admin` | Pengelolaan seluruh OPD & sistem |

---

## Alur Kerja Utama — Disposisi Persuratan

```
[Staf TU]          [Pimpinan/Sekretaris]      [Pelaksana/Staf]
    |                       |                        |
    | 1. Input Surat        |                        |
    |---------------------->|                        |
    |                       |                        |
    |                       | 2. Terima & Review     |
    |                       | Surat di Ruang Kerja   |
    |                       |                        |
    |                       | 3. Kirim Disposisi     |
    |                       | (+ Instruksi & Deadline)|
    |                       |----------------------->|
    |                       |                        |
    |                       |                        | 4. Terima &
    |                       |                        | Acknowledge Disposisi
    |                       |                        |
    |                       |                        | 5. Kerjakan &
    |                       |                        | Lapor Tindak Lanjut
    |                       |                        |
    |                       | 6. Notifikasi          |
    |                       | Laporan Masuk          |
    |                       |<-----------------------|
    |                       |                        |
    |                       | 7. Selesaikan &        |
    |                       | Arsipkan Surat         |
    |                       |                        |
    v-------- AUTO ---------v--------- AUTO ---------v
   Logbook  |  Lap. Tindak Lanjut  |  Arsip Digital
   E-Kinerja|  Agenda Harian       |  Analitika
```

---

## Teknologi & Infrastruktur

| Komponen | Teknologi |
|----------|-----------|
| **Frontend** | Next.js 14 (App Router) + TypeScript |
| **UI Framework** | Tailwind CSS + Shadcn/UI |
| **Animasi** | Framer Motion |
| **Database** | Firebase Firestore (NoSQL, Real-time) |
| **Autentikasi** | Firebase Authentication |
| **Penyimpanan File** | Google Drive API (melalui OAuth2) |
| **Push Notification** | Firebase Cloud Messaging (FCM) |
| **State Management** | TanStack Query (React Query) |
| **PDF Generation** | React-PDF |
| **AI Copilot** | Gemini API (Google Cloud) |

---

## Konvensi Dokumen Ini

> **Tips** — Saran penggunaan terbaik

> **Perhatian** — Hal yang perlu diperhatikan

> **Penting** — Informasi kritis

> **Langkah** — Instruksi step-by-step

---

*Panduan ini dibuat berdasarkan audit kode sumber RUANG SIGAP versi produksi (Agustus 2026). Untuk pertanyaan lebih lanjut, hubungi tim teknis atau Admin Super.*
