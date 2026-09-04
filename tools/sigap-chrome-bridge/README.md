# SIGAP e-Kinerja Bridge (Chrome Extension Manifest V3)

Ekstensi resmi Chrome untuk menghubungkan aplikasi **RUANG SIGAP / POROS E-Office** dengan portal **e-Kinerja BKPSDM Kota Surakarta** (`http://103.115.227.196/e-kinerja/v4/`).

---

## ⚡ Cara Pasang di Google Chrome (Hanya 1 Menit)

1. Buka browser **Google Chrome**.
2. Ketik alamat ini di address bar lalu tekan Enter:
   ```text
   chrome://extensions
   ```
3. Di pojok kanan atas, aktifkan tombol switch **"Developer mode"** (Mode Pengembang).
4. Di pojok kiri atas, klik tombol **"Load unpacked"** (Muat yang belum dibongkar).
5. Arahkan dan pilih folder berikut:
   ```text
   d:\Project\RUANG SIGAP\tools\sigap-chrome-bridge
   ```
6. **Selesai!** Ekstensi **SIGAP e-Kinerja Bridge** langsung aktif dan muncul di toolbar Chrome Anda.

---

## 🚀 Cara Kerja (Zero-Click Cross-Tab Sync)

1. Buka tab **RUANG SIGAP** (`http://localhost:3000` atau domain resmi) di sebelah kiri.
2. Buka tab **e-Kinerja BKPSDM** (`http://103.115.227.196/e-kinerja/v4/d_kegiatan_harian`) di sebelah kanan.
3. Di aplikasi SIGAP, buka bukti kinerja lalu klik tombol **"🚀 Kirim Langsung ke e-Kinerja"**.
4. **BAM!** Formulir di tab e-Kinerja sebelah kanan langsung terisi ke-8 kolomnya secara otomatis dan tersorot warna hijau sukses!

---

## 🛠️ Fitur Otomasi Cerdas
- **Cross-Tab Real-time**: Mengirim data langsung tanpa perlu salin-tempel clipboard.
- **Auto-F2**: Otomatis memicu tombol `[F2: Buat Kode Baru]` jika kode kegiatan masih kosong.
- **Select2 Compatibility**: Otomatis memilih nama aktivitas yang sesuai dari 152 kamus Kepwal Solo.
- **URL Google Drive**: Otomatis memasukkan link file bukti kinerja dari Google Drive pegawai.
- **Floating Toast Notification**: Menampilkan feedback visual elegan di tab e-Kinerja saat data berhasil masuk.
