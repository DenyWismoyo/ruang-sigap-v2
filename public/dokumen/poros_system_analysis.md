# Analisis Sistem & Proposisi Nilai: POROS (SIGAP)

**Sistem Integrasi & Administrasi Persuratan (SIGAP)** yang dikembangkan oleh **POROS** bukan sekadar aplikasi pencatatan surat digital. Ini adalah sebuah mahakarya *Business Process Reengineering* (BPR) yang mentransformasi birokrasi pemerintahan dari model tradisional (berbasis kertas dan lambat) menjadi ekosistem digital yang efisien, transparan, dan terukur.

Dokumen ini membedah masalah fundamental administrasi pemerintahan saat ini, dan bagaimana SIGAP menyelesaikannya secara elegan dengan rasio nilai (ROI) yang sangat tinggi dibandingkan harga langganannya.

---

## 1. Analisis *Pain Points* (Masalah Birokrasi Saat Ini)

Sebelum adanya SIGAP, proses persuratan di lingkungan Organisasi Perangkat Daerah (OPD) menghadapi *bottleneck* kronis:

1. **Redundansi Pekerjaan (Entry Ganda)**
   - Staf TU harus mencatat surat masuk di Buku Agenda Manual.
   - Kemudian menyalinnya ke Lembar Disposisi kertas.
   - Kemudian merekap ulang untuk laporan bulanan.
2. **Kehilangan Jejak (Blind Spots)**
   - Pimpinan sulit melacak apakah instruksi disposisi sudah dikerjakan atau belum. Seringkali surat "menumpuk" di meja ajudan atau kepala bidang tanpa *follow-up*.
3. **Pengukuran Kinerja Absurd**
   - Laporan Kinerja Pegawai (SKP) seringkali dibuat berdasarkan asumsi, bukan data riil karena sulitnya menghitung berapa beban kerja aktual masing-masing staf.
4. **Biaya Operasional (Capital/Opex) Tinggi**
   - Biaya kertas (HVS), tinta *printer*, kurir antar-bidang, penyewaan gudang arsip, hingga risiko dokumen hilang atau rusak karena bencana (banjir/rayap).

---

## 2. Solusi Elegan SIGAP: Filosofi "1 Input = 5 Output"

Keunggulan mutlak dari SIGAP adalah arsitektur datanya yang sangat efisien. Staf Tata Usaha (TU) hanya perlu melakukan **satu kali klik / input data surat**, dan sistem secara cerdas mendistribusikannya menjadi 5 cabang aliran kerja (Output) tanpa intervensi manual lagi:

> [!TIP]
> **Efisiensi 500%**
> 1 Input Surat Masuk menghasilkan:
> 1. **Agenda Harian**: Langsung masuk ke kalender agenda pimpinan/staf secara _real-time_.
> 2. **Sistem Disposisi**: Membuka jalur instruksi berjenjang dari Pimpinan → Kabid → Kasi → Pelaksana secara hierarkis dan instan.
> 3. **Laporan Tindak Lanjut**: Memaksa pelaksana memberikan bukti tindak lanjut tertulis (dan _file_) yang mengikat kembali ke surat asal.
> 4. **Analitik Kinerja Kuantitatif**: Sistem secara otomatis menghitung *Response Time* pimpinan dan Beban Kerja (SLA) staf untuk basis penilaian SKP objektif.
> 5. **Arsip Digital Permanen**: Tersimpan di *cloud* dengan metode pencarian Google-like, menihilkan kebutuhan gudang arsip fisik.

---

## 3. Fleksibilitas & Arsitektur *Multi-Tenant* (Satu untuk Semua)

Berbeda dengan vendor lain yang mengharuskan 1 Dinas = 1 Aplikasi (Server terpisah, biaya _maintenance_ tinggi), SIGAP menggunakan arsitektur **Super Admin - Multi OPD**.
- Pemerintah Kota/Kabupaten dapat mengelola puluhan Kecamatan, Kelurahan, hingga Dinas tingkat 1 dalam **Satu Platform**.
- Kewenangan diisolasi secara sempurna melalui _Role-Based Access Control_ (RBAC): `super_admin`, `admin_opd`, `pimpinan`, `staf_tu`, `pelaksana`.
- Modul _Compliance_ B2G: Terintegrasinya pembuatan dokumen tagihan resmi (*Enterprise PDF Generation* untuk SPK, BAST, Faktur Pajak) membuat siklus bisnis Poros dengan instansi pemerintah menjadi mulus secara regulasi.

---

## 4. Analisis Strategi Harga (Pricing vs Value Proposition)

Model _Flat Pricing_ per OPD per Bulan yang ditawarkan sangat kompetitif, menargetkan _Product-Market Fit_ yang sempurna untuk birokrasi Indonesia.

| Paket | Harga Flat / Bulan | Kapasitas | Nilai Keekonomisan (ROI) |
|---|---|---|---|
| **Starter** | **Rp 500.000** | Kelurahan / UPT (15-30 User, 500 Surat) | Jauh lebih murah dari gaji 1 pegawai honorer. Menghilangkan biaya kertas/tinta (kurang lebih 1jt/bulan) untuk level Kelurahan. |
| **Basic** | **Rp 1.000.000** | Kecamatan (50-75 User, 1.000 Surat) | Peningkatan efisiensi waktu distribusi disposisi kecamatan dari rata-rata 2 hari menjadi 2 menit. Nilai waktu pejabat eselon tak terhingga. |
| **Standard** | **Rp 1.500.000** | Dinas Tipe C/B (50-75 User, 2.500 Surat) | Dinas sudah mulai membutuhkan analitik kinerja. Harga ini sepadan dengan modul Analitika & Laporan Tindak Lanjut yang disediakan. |
| **Pro** | **Rp 3.500.000** | Dinas Tipe A / Badan (150 User, 10.000 Surat) | Dengan lalu lintas dokumen puluhan ribu, pencarian arsip instan (1 detik) menghemat ratusan jam kerja operator. |
| **Enterprise**| **Rp 11.000.000+** | Sekretariat Daerah / Kota (Tak Terbatas) | Menyediakan layanan ekosistem kota (*Smart City* Backbone). Harga yang sangat wajar dibanding membangun & merawat server mandiri (Miliaran Rupiah). |

### Kesimpulan Harga: *A No-Brainer Deal*
Jika sebuah OPD mencoba membangun sistem serupa dari nol (Pengadaan *Software*), biayanya bisa mencapai **Rp 200 Juta - 500 Juta** di awal, ditambah biaya pemeliharaan *server* tahunan.
Dengan Poros, OPD hanya membayar Rp 500rb - 1.5Jt per bulan. Risiko _downtime_ dialihkan ke Poros, tanpa pusing memikirkan infrastruktur (SaaS Model). Ini adalah argumen penjualan (_sales pitch_) yang **tak bisa ditolak** oleh Kepala Dinas manapun yang sadar akan efisiensi APBD.

---

## 5. Ringkasan Eksekutif (Kesimpulan)

Poros (melalui SIGAP) berhasil memetakan *User Journey* birokratis Indonesia dengan sangat akurat. 
- Sistem ini **tidak memaksa staf bekerja lebih**, melainkan **mengurangi beban repetitif** mereka.
- Sistem ini memberikan **"Mata Tak Terlihat"** bagi Pimpinan untuk mengontrol kinerja bawahan.
- Sistem ini menyediakan alat administrasi bisnis yang *seamless* bagi pengembang (Modul Penagihan PDF Otomatis).

Dengan model harga berbasis *tiering*, Poros dapat memenetrasi pasar dari instansi level terendah (Kelurahan) hingga hierarki tertinggi (Pemerintah Kota), menciptakan ketergantungan teknologi ( *High Switching Cost*) yang positif bagi keberlangsungan bisnis platform jangka panjang.
