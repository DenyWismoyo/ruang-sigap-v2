# Panduan 06 — Laporan Kinerja & Analitika

> Menu: **Laporan Kinerja / Rekap Surat** | Path: `/dashboard/poros/laporan` & `/dashboard/poros/rekap-surat`

---

## Apa Itu Laporan Kinerja?

Laporan Kinerja adalah fitur yang menyajikan **ringkasan dan analitika kinerja OPD** secara keseluruhan dalam bentuk statistik, grafik, dan tabel. Fitur ini ditujukan terutama untuk:
- **Pimpinan OPD** — Memantau efektivitas pengelolaan surat
- **Admin OPD** — Menganalisis beban kerja dan performa tim
- **Kepala Bidang/Seksi** — Melihat kinerja sub-unit

---

## Bagian A: Rekap Surat (Statistik Umum)

> Path: `/dashboard/poros/rekap-surat`

### Informasi yang Ditampilkan

Halaman ini menampilkan **statistik agregat surat** OPD Anda:

| Indikator | Keterangan |
|-----------|------------|
| **Total Surat Masuk** | Jumlah surat yang diterima dalam periode |
| **Surat Selesai** | Jumlah surat yang telah diselesaikan |
| **Surat Terlambat** | Surat yang melebihi SLA (Service Level Agreement) |
| **Rata-rata Waktu Respons** | Waktu rata-rata dari terima surat hingga disposisi pertama (dalam jam) |

### Filter Periode

Pilih tanggal akhir periode — sistem akan menghitung data 7 hari terakhir dari tanggal tersebut dan menampilkan data per OPD.

### Grafik Performa

Grafik bar/line yang menampilkan tren:
- Volume surat masuk per hari/minggu
- Tingkat penyelesaian surat
- Distribusi waktu respons

---

## Bagian B: Analitika Kinerja (Agregat OPD)

### Indikator Kinerja Utama OPD

| KPI | Cara Hitung |
|-----|-------------|
| **Total Disposisi** | Jumlah disposisi yang dikirim dalam periode |
| **Total Tugas** | Jumlah tugas yang dibuat dan diselesaikan |
| **Rata-rata Waktu Respons Disposisi** | Rata-rata jam dari terima surat hingga kirim disposisi pertama |
| **Persentase Penyelesaian Tepat Waktu** | % surat/tugas yang diselesaikan sebelum deadline |
| **Tingkat Revisi Disposisi** | % disposisi yang dikembalikan/direvisi |

### Beban Kerja Per Jabatan

Tabel yang menampilkan distribusi pekerjaan:

| Jabatan | Nama Pejabat | Tugas Aktif | Disposisi Aktif | Total Beban |
|---------|-------------|-------------|-----------------|-------------|
| Kepala Bidang A | Budi S. | 3 | 5 | 8 |
| Kasubag B | Siti R. | 7 | 3 | 10 |
| Staff C | Ahmad F. | 2 | 2 | 4 |

Data ini membantu pimpinan mengidentifikasi beban kerja yang tidak merata.

### Kinerja Per Jabatan

Tabel kinerja individual:

| Jabatan | Total Tugas Selesai | Tepat Waktu | Rata-rata Waktu | Total Disposisi Diterima |
|---------|---------------------|-------------|-----------------|--------------------------|
| ... | ... | ... | ... | ... |

---

## Bagian C: Laporan Mingguan OPD

Sistem secara **otomatis menghasilkan laporan mingguan** yang diperbarui setiap minggu. Laporan ini tersimpan di koleksi `laporanMingguan` di database dan dapat dilihat oleh Super Admin untuk membandingkan kinerja antar OPD.

Data laporan mingguan mencakup:
- Total surat masuk minggu tersebut
- Jumlah surat yang diselesaikan
- Jumlah surat yang terlambat
- Rata-rata waktu respons dalam jam

---

## Cara Membaca Laporan

### Bagi Pimpinan OPD

1. **Cek Total Surat Masuk vs Selesai:** Idealnya persentase selesai >80%
2. **Perhatikan Surat Terlambat:** Jumlah harus mendekati 0
3. **Analisis Beban Kerja:** Pastikan beban merata, tidak ada satu jabatan yang overwhelmed
4. **Respons Time:** Semakin kecil angka waktu respons, semakin baik

### Bagi Admin OPD

1. Gunakan data beban kerja untuk merencanakan redistribusi tugas
2. Identifikasi jabatan yang kinerjanya di bawah rata-rata untuk pembinaan
3. Eksport data untuk laporan ke atasan

---

## Bagian D: Integrasi dengan E-Kinerja Individu

Data laporan kinerja individual (per pegawai) tidak hanya tersedia di halaman ini, tetapi juga:

1. **Logbook Harian** — Rekap harian dari setiap kegiatan
2. **Bukti Kinerja** — Portofolio digital yang bisa diunduh sebagai PDF
3. **Rekap Bulanan** — Laporan bulanan yang bisa diupload ke Google Drive

---

## Tips Penggunaan Laporan Kinerja

> **Tips 1:** Cek laporan kinerja setiap minggu (misalnya setiap Jumat) untuk memantau apakah ada surat yang terlambat ditindaklanjuti.

> **Tips 2:** Gunakan data beban kerja untuk briefing staf — tunjukkan kepada tim bahwa data mereka termonitor secara transparan.

> **Tips 3:** Screenshot atau download rekap mingguan dan bagikan ke group WhatsApp tim sebagai bentuk akuntabilitas publik.

> **Tips 4:** Integrasikan data dari laporan ini ke dalam laporan kinerja triwulanan/tahunan OPD.

---

*Dokumen selanjutnya: [Panduan 07 — Agenda Harian](./07-agenda.md)*
