# BUKU PANDUAN (MANUAL BOOK) APLIKASI POROS

## 1. Pendahuluan
**POROS** (sebelumnya Ruang Sigap v2) adalah aplikasi Sistem Informasi Manajemen Terpadu yang dirancang untuk mendukung ruang kerja digital secara komprehensif bagi instansi pemerintahan maupun organisasi. Aplikasi ini berfungsi sebagai portal integrasi tunggal yang menangani tata naskah dinas, produktivitas pegawai, evaluasi kinerja, serta manajemen operasional secara *real-time*. Ini adalah sebuah mahakarya *Business Process Reengineering* (BPR) yang mentransformasi birokrasi pemerintahan menjadi ekosistem digital yang efisien, transparan, dan terukur.

## 2. Filosofi Sistem: "1 Input = 5 Output" (Efisiensi 500%)
Keunggulan mutlak dari POROS adalah arsitektur datanya yang sangat efisien. Staf Tata Usaha (TU) hanya perlu melakukan **satu kali klik / input data surat**, dan sistem secara cerdas mendistribusikannya menjadi 5 cabang aliran kerja (Output) tanpa intervensi manual lagi:
1. **Agenda Harian**: Langsung masuk ke kalender agenda pimpinan/staf secara _real-time_.
2. **Sistem Disposisi**: Membuka jalur instruksi berjenjang dari Pimpinan → Kabid → Kasi → Pelaksana secara hierarkis dan instan.
3. **Laporan Tindak Lanjut**: Memaksa pelaksana memberikan bukti tindak lanjut tertulis (dan _file_) yang mengikat kembali ke surat asal.
4. **Analitik Kinerja Kuantitatif**: Sistem secara otomatis menghitung *Response Time* pimpinan dan Beban Kerja (SLA) staf untuk basis penilaian Sasaran Kinerja Pegawai (SKP) yang objektif.
5. **Arsip Digital Permanen**: Tersimpan di *cloud* dengan metode pencarian cerdas *(Google-like search)*, menihilkan kebutuhan gudang arsip fisik.

## 3. Arsitektur dan Pengguna
Aplikasi ini berbasis *Software as a Service* (SaaS) dengan arsitektur **Multi-Tenant (Multi OPD)**, di mana Pemerintah Daerah dapat mengelola puluhan Kecamatan, Kelurahan, hingga Dinas tingkat 1 dalam **Satu Platform** yang terisolasi sempurna. Pembagian peran (Role-Based Access Control) meliputi:
- **Pimpinan (Top Management)**: Memiliki hak akses penuh untuk melakukan pengawasan (monitoring) kinerja bawahan, melihat laporan analitik, dan memberikan disposisi strategis.
- **Admin OPD**: Pengelola tingkat instansi/OPD (Organisasi Perangkat Daerah) yang mengatur data master pegawai dan struktur organisasi internal.
- **Staf TU**: Pengelola utama arus tata usaha, pendistribusian surat, dan manajemen kearsipan.
- **User / Pegawai**: Pengguna akhir (pelaksana) untuk operasional harian, pengerjaan tugas, dan pelaporan kinerja.
- **Role Fungsional Tambahan**: Akses spesifik yang diberikan sesuai tugas tambahan, seperti notulis rapat, petugas pelayanan, pengelola tata pemerintahan, bendahara, operator surat, dll.

## 4. Fitur Utama
### 4.1. Ruang Kerja (Workspace)
- **Kotak Masuk Surat**: Manajemen surat masuk dengan integrasi notifikasi (*real-time*).
- **Tugas Saya & Delegasi**: Sistem penugasan *(task management)* yang terstruktur.
- **Logbook Harian**: Pencatatan aktivitas harian pegawai.
- **Portal Integrasi**: Penghubung ke berbagai sistem eksternal pendukung.

### 4.2. Produktivitas
- **E-Kinerja & Kompetensi**: Perekaman bukti kinerja, manajemen portofolio kompetensi (talenta).
- **Tata Naskah Dinas Elektronik (TNDE)**: Pembuatan surat keluar, bank template, dan persetujuan draf berjenjang *(digital signature routing)*.
- **Formulir & Survei**: Builder formulir dinamis dan umpan balik *(feedback)*.

### 4.3. Koordinasi & Informasi
- **Manajemen Rapat & Jadwal**: Pembuatan notulensi dan manajemen kalender internal.
- **Pelayanan Publik & SKW**: Modul khusus untuk layanan masyarakat, tingkat kelurahan hingga kecamatan.
- **Repositori & Arsip**: Penyimpanan arsip surat dan dokumen digital *(Knowledge Base)*.

## 5. Dampak Implementasi Skala Ekosistem (Pemerintah Daerah)
Apabila POROS diimplementasikan secara masif dan serentak di seluruh OPD dalam satu wilayah (misalnya Pemerintah Kota/Kabupaten), sistem ini akan bertransformasi dari sekadar aplikasi persuratan menjadi **Tulang Punggung (Backbone) Smart Governance** yang memberikan keuntungan eksponensial, antara lain:
1. **Otomatisasi Administrasi Lintas Sektoral**: Surat perintah atau undangan dari pimpinan daerah (Wali Kota/Sekda) dapat terdistribusi, terdisposisi, dan dipantau tindak lanjutnya hingga ke tingkat Kelurahan dalam hitungan detik.
2. **Daftar Hadir Digital Berbasis Disposisi**: Untuk acara lintas OPD, kehadiran dapat divalidasi dan digeneralisasi langsung dari sistem persuratan, menghasilkan *e-Presence* dan daftar hadir yang siap di-*export* untuk keperluan SPJ/Perjalanan Dinas tanpa input ulang.
3. **Big Data Kinerja Daerah**: Kepala Daerah memiliki dasbor sentral untuk memantau kecepatan respons (*response time*) dan penyelesaian target SLA dari setiap Kepala Dinas secara serentak dan *real-time*.
4. **Sentralisasi Arsip & Keberlanjutan Pemerintahan**: Menghilangkan risiko hilangnya dokumen vital akibat mutasi/pergantian pejabat. Seluruh rekam jejak instruksi, kebijakan, dan komunikasi antar OPD akan menjadi arsip memori institusi yang abadi dan mudah dicari.
