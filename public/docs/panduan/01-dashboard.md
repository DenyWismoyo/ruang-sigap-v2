# Panduan 01 — Dashboard & Beranda

> Menu: **Beranda / Home** | Path: `/dashboard/poros`

---

## Apa Itu Dashboard?

Dashboard adalah **halaman pertama** yang muncul setelah Anda login. Dashboard berfungsi sebagai **pusat kendali** yang merangkum seluruh informasi penting dalam satu tampilan. Anda tidak perlu membuka menu satu per satu untuk mengetahui status pekerjaan hari ini.

---

## Komponen-Komponen Dashboard

### 1. Greeting Cerdas (Smart Greeting)

Di bagian paling atas, sistem akan menyapa Anda secara personal sesuai waktu:
- **Pagi (04:00–11:00):** "Selamat Pagi, [Nama]! Siap untuk memulai hari yang produktif?"
- **Siang (11:00–15:00):** "Selamat Siang, [Nama]! Jangan lupa istirahat sejenak."
- **Sore (15:00–19:00):** "Selamat Sore, [Nama]! Mari tuntaskan pekerjaan hari ini."
- **Malam (19:00–04:00):** "Selamat Malam, [Nama]! Terima kasih atas dedikasi Anda hari ini."

---

### 2. Widget KPI (Key Performance Indicator)

Widget ini menampilkan **4 indikator utama kinerja** Anda secara real-time:

| Indikator | Keterangan |
|-----------|------------|
| **Disposisi Baru** | Jumlah disposisi yang belum Anda acknowledge (terima) |
| **Tindak Lanjut Menunggu** | Disposisi yang sudah diterima namun belum dilaporkan |
| **Tugas Aktif** | Jumlah tugas yang sedang berjalan (status Baru + Dikerjakan) |
| **Tugas Lewat Deadline** | Tugas yang telah melewati batas waktu |

> **Tips:** Klik pada widget KPI untuk langsung membuka halaman yang relevan (mis. klik "Disposisi Baru" akan membuka Ruang Kerja dengan filter Surat).

---

### 3. Quick Access Card

Empat kartu akses cepat ke menu yang paling sering digunakan:

| Kartu | Tujuan |
|-------|--------|
| **Ruang Kerja** | Daftar surat & disposisi yang perlu ditindaklanjuti |
| **Logbook** | Catatan kegiatan harian |
| **Surat Masuk** | Daftar semua surat masuk OPD |
| **Arsip** | Surat-surat yang telah selesai diproses |

---

### 4. Agenda Harian (Mobile Carousel / Desktop Grid)

Menampilkan **undangan rapat dan kegiatan** yang akan berlangsung dalam 7 hari ke depan. Untuk setiap agenda ditampilkan:

- **Perihal/Judul** kegiatan
- **Tanggal & Jam** pelaksanaan
- **Lokasi** kegiatan
- **Status Disposisi:** apakah undangan ini sudah didisposisikan kepada siapa

**Tampilan Mobile:** Carousel yang bisa digeser ke kiri-kanan
**Tampilan Desktop:** Grid/tabel yang lebih lebar

> **Tips:** Klik pada kartu agenda untuk membuka detail surat undangan tersebut.

---

### 5. Mini Kalender

Kalender interaktif mini di sisi kanan (desktop) yang menunjukkan:
- Tanggal hari ini (disorot)
- Tanggal-tanggal yang memiliki kegiatan (ditandai)

Klik pada tanggal tertentu untuk melihat agenda di tanggal tersebut.

---

### 6. Widget Kinerja Personal

Menampilkan **ringkasan kinerja personal** dalam periode tertentu:
- Total surat yang telah ditindaklanjuti
- Tingkat penyelesaian tepat waktu
- Progress tugas yang sedang berjalan

---

### 7. Tabel Agenda Lengkap (Desktop)

Untuk tampilan desktop, tersedia **tabel agenda** yang lebih detail dengan kolom:
- **Waktu** (tanggal & jam)
- **Perihal & Pengirim** surat
- **Lokasi** kegiatan
- **Disposisi Kepada** (nama penerima disposisi)

---

## Cara Menggunakan Dashboard

### Untuk Staf TU

1. Cek widget KPI untuk melihat apakah ada surat baru yang belum diproses
2. Lihat agenda hari ini untuk memastikan tidak ada undangan yang terlewat
3. Klik "Surat Masuk" untuk mulai menginput surat baru

### Untuk Pimpinan

1. Perhatikan angka **"Surat Baru"** di KPI — ini adalah surat yang menunggu disposisi Anda
2. Lihat agenda 7 hari ke depan untuk persiapan rapat
3. Klik "Ruang Kerja" untuk mengelola antrian disposisi

### Untuk Pelaksana/Staf

1. Perhatikan **"Disposisi Baru"** — ini adalah pekerjaan yang baru masuk dari atasan
2. Perhatikan **"Tugas Aktif"** — pantau tugas yang sedang berjalan
3. Klik "Logbook" untuk mencatat kegiatan hari ini

---

## Notifikasi Push

RUANG SIGAP mendukung **push notification** real-time melalui browser. Anda akan mendapat notifikasi ketika:
- Ada disposisi baru masuk
- Ada laporan tindak lanjut dari bawahan
- Ada tugas baru yang diberikan kepada Anda
- Ada pengumuman dari pimpinan

> **Perhatian:** Pastikan Anda mengizinkan notifikasi browser ketika sistem meminta. Jika Anda melewatkan pop-up izin, buka Pengaturan browser > Site Settings > Notifications untuk mengaktifkannya secara manual.

---

## Navigasi Aplikasi

### Desktop (Laptop/PC)

- **Sidebar Kiri:** Menu navigasi utama dengan ikon dan label
- **Mega Menu:** Hover pada kategori menu untuk melihat sub-menu
- **Top Bar:** Pencarian global, notifikasi, profil, dan toggle tema

### Mobile (Smartphone)

- **Bottom Navigation Bar:** 5 ikon di bawah layar untuk menu utama
- **Hamburger Menu:** Tombol tiga garis di kiri atas untuk semua menu
- **Smart FAB:** Tombol aksi mengambang di sudut kanan bawah untuk aksi cepat

---

*Dokumen selanjutnya: [Panduan 02 — Kotak Masuk & Surat](./02-kotak-masuk-surat.md)*
