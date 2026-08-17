# Modul Sistem dan Pengaturan Poros

Modul ini mengelola konfigurasi level tinggi aplikasi, keamanan, serta komunikasi luas.

## 1. Pengaturan (Settings)
- **Fungsi Utama**: Kontrol pimpinan institusi / `super_admin`.
- **Fitur**: Mengubah nama instansi, logo, struktur organisasi, hingga hierarki level jabatan (Eselon II, III, IV, Pelaksana).

## 2. Pengumuman & Tutorial
- **Fungsi Utama**: Papan buletin satu arah dari `super_admin` ke seluruh pegawai (Global) atau ke OPD spesifik (Internal).
- **Fitur Spesial**:
  - Dilengkapi fitur indikator baca (View Tracking) bergambar mata 👁️.
  - Form dilengkapi dengan integrasi **AI Copywriter** (*Gemini 3.5 Flash Lite*) yang bisa secara otomatis menulis draf pengumuman jika admin meminta. Teks menggunakan format Markdown rapi.

## 3. Laporan (Reporting)
- Laporan komprehensif (cetak PDF / Excel) mengenai total kinerja, disposisi macet, atau keaktifan staf. Digunakan pada akhir tahun atau triwulan untuk evaluasi.

## 4. Search & Portal Integrasi
- **Search**: Fungsi pencarian universal (Global Search) untuk mencari Nomor Surat di seluruh sudut aplikasi (Arsip, Disposisi, Inbox).
- **Portal Integrasi**: Penghubung (shortcut) ke aplikasi eksternal (misal: Aplikasi Gaji, Aplikasi BKN) agar Poros dapat berperan sebagai gerbang SSO (Single Sign-On) bagi pegawai.
