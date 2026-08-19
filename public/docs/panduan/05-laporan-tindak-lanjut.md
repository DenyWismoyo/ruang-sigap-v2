# Panduan 05 — Laporan Tindak Lanjut & Bukti Kinerja

> Menu: **Laporan Tindak Lanjut** & **Bukti Kinerja** | Path: `/dashboard/poros/laporan` & `/dashboard/poros/bukti-kinerja`

---

## Bagian A: Laporan Tindak Lanjut

### Apa Itu Laporan Tindak Lanjut?

Laporan Tindak Lanjut (TL) adalah **dokumentasi progres pekerjaan** yang Anda kerjakan atas perintah disposisi dari atasan. Setiap kali Anda melaporkan kemajuan pekerjaan dari disposisi, sistem mencatatnya sebagai Laporan Tindak Lanjut.

Laporan TL berfungsi sebagai:
1. **Bukti pekerjaan** yang dapat dilihat oleh atasan secara real-time
2. **Sumber data** untuk laporan kinerja bulanan/tahunan
3. **Jejak audit** untuk pembuktian pertanggungjawaban pekerjaan
4. **Input otomatis** untuk Logbook dan Bukti E-Kinerja

---

### Cara Membuat Laporan Tindak Lanjut

Ada **dua cara** membuat laporan tindak lanjut:

#### Cara 1: Dari Ruang Kerja (Inline)

1. Di feed Ruang Kerja, temukan kartu disposisi yang ingin dilaporkan
2. Klik **"Lapor Tindak Lanjut"** (atau "Lapor Progres")
3. Form laporan muncul langsung di bawah kartu (inline)
4. Isi form dan klik kirim

#### Cara 2: Dari Detail Surat

1. Buka halaman Surat (menu Surat Masuk)
2. Klik surat yang ingin dilaporkan
3. Di panel kanan, klik tab **"Tindak Lanjut"**
4. Klik tombol **"+ Tambah Laporan"**
5. Isi form dan klik kirim

---

### Form Laporan Tindak Lanjut

| Field | Keterangan | Wajib? |
|-------|------------|--------|
| **Judul Laporan** | Judul singkat yang mendeskripsikan laporan ini | Tidak, tapi sangat disarankan |
| **Isi Laporan** | Deskripsi detail apa yang telah dikerjakan | Ya |
| **Warna Label** | Kode warna prioritas/kategori laporan | Tidak |
| **Checklist** | Daftar item yang telah diselesaikan | Tidak |
| **Upload Lampiran** | File bukti (via Google Drive) | Tidak |

**Warna Label:**
- **Default (Putih):** Laporan biasa
- **Merah:** Pekerjaan bermasalah / ada kendala
- **Hijau:** Pekerjaan berjalan lancar / selesai
- **Biru:** Informasi penting
- **Kuning:** Perlu perhatian khusus
- **Ungu:** Laporan khusus/istimewa

**Checklist di Laporan:**
Anda dapat menambahkan daftar pekerjaan spesifik yang telah dilakukan:

```
Checklist:
[x] Koordinasi dengan Bagian Hukum
[x] Penyusunan Draft Naskah
[ ] Finalisasi dan Tanda Tangan
[ ] Pengiriman ke Instansi Tujuan
```

---

### Mode Pengiriman Laporan

| Tombol | Artinya |
|--------|---------|
| **"Kirim Laporan (Proses)"** | Laporan dikirim, disposisi tetap terbuka. Anda bisa mengirim laporan lagi nanti (laporan berkala/progres) |
| **"Selesaikan & Tutup"** | Laporan dikirim dan disposisi Anda ditandai selesai. Kartu disposisi akan hilang dari Ruang Kerja Anda |

> **Tips:** Gunakan "Kirim Laporan (Proses)" untuk pekerjaan yang memerlukan beberapa tahap pelaporan. Gunakan "Selesaikan & Tutup" hanya ketika pekerjaan benar-benar sudah selesai.

---

### Melihat Riwayat Laporan Tindak Lanjut

#### Dari Sisi Pelaksana

Di tab "Tindak Lanjut" halaman detail surat, Anda bisa melihat semua laporan yang sudah Anda kirim untuk surat tersebut.

#### Dari Sisi Pimpinan/Atasan

Di halaman **Tab Pemantauan** di menu Surat, pimpinan dapat melihat:
- Siapa saja yang sudah melapor
- Isi laporan masing-masing pelaksana
- Status penyelesaian per pelaksana
- Lampiran yang dilampirkan

---

### Edit dan Revisi Laporan

Jika Anda perlu memperbarui laporan yang sudah dikirim:

1. Buka tab "Tindak Lanjut" di detail surat
2. Temukan laporan yang ingin diedit
3. Klik ikon **Edit** (pensil)
4. Lakukan perubahan
5. Klik "Simpan"

> **Perhatian:** Hanya pemilik laporan yang dapat mengedit laporannya sendiri.

---

## Bagian B: Bukti Kinerja (E-Kinerja)

> Menu: **Bukti Kinerja** | Path: `/dashboard/poros/bukti-kinerja`

### Apa Itu Bukti Kinerja?

Bukti Kinerja adalah **portofolio digital kinerja** Anda yang terkumpul dari berbagai sumber. Fitur ini mengumpulkan semua bukti pekerjaan Anda dari:

1. **Laporan Tindak Lanjut** (otomatis)
2. **Tugas yang Diselesaikan** (otomatis)
3. **Upload Manual** (dokumen apapun yang relevan)

---

### Tampilan Halaman Bukti Kinerja

Halaman ini memiliki dua tab:

**Tab 1: Upload Bukti Baru**
- Form untuk mengupload dokumen bukti kerja secara manual
- Input judul dan pilih file dari komputer
- File akan diupload ke Google Drive Anda

**Tab 2: Riwayat Bukti Kinerja**
- Galeri/grid semua bukti kinerja yang tersimpan
- Klik kartu untuk membuka file di Google Drive

---

### Cara Upload Bukti Kinerja Manual

1. Buka menu **Bukti Kinerja**
2. Di tab "Upload Bukti Baru":
   - Isi **Judul** dokumen
   - Klik area upload dan pilih file dari komputer
3. Klik **"Upload"**
4. File diunggah ke Google Drive dan muncul di tab Riwayat

---

### Jenis Sumber Bukti Kinerja

| Badge | Sumber | Keterangan |
|-------|--------|------------|
| **Laporan TL** | Dari laporan tindak lanjut surat | Otomatis terbuat |
| **Penyelesaian Tugas** | Dari tugas yang diselesaikan | Otomatis terbuat |
| **Manual Upload** | Diupload manual oleh pengguna | Manual |

---

### Download Laporan Kinerja PDF

Fitur khusus untuk menghasilkan **Laporan Kinerja dalam format PDF** profesional:

1. Klik tombol **"Download Laporan PDF"**
2. Pilih periode (bulan dan tahun)
3. Sistem mengambil semua data bukti kinerja periode tersebut
4. PDF dihasilkan dan otomatis diunduh

Format PDF mencakup:
- Header resmi dengan nama, jabatan, dan OPD
- Daftar semua bukti kinerja periode tersebut
- Tanggal dan sumber masing-masing bukti

---

### Integrasi dengan Logbook

Setiap Laporan Tindak Lanjut yang Anda kirim otomatis:
1. **Membuat entri Logbook** dengan kategori "Laporan"
2. **Membuat bukti kinerja** di halaman ini
3. **Mengirim notifikasi** ke atasan yang mendisposisikan

Dengan demikian, Anda tidak perlu double-entry data — satu kali lapor, semua tercatat.

---

### Tips Manajemen Bukti Kinerja

> **Tips 1:** Pastikan Google Drive sudah terhubung di Profil Anda sebelum mencoba upload. Tanpa integrasi Drive, file tidak dapat diunggah.

> **Tips 2:** Beri judul yang deskriptif pada setiap bukti kinerja (mis. "Laporan Koordinasi Pengadaan Barang - Agustus 2026") agar mudah dicari dan diidentifikasi saat audit.

> **Tips 3:** Di akhir tahun, gunakan fitur ini untuk mengompilasi semua bukti kinerja sebagai portofolio untuk penilaian SKP (Sasaran Kinerja Pegawai).

> **Tips 4:** Untuk rapat yang Anda hadiri, Anda bisa upload foto undangan surat + notulensi sebagai bukti kehadiran.

---

## Alur Lengkap dari Surat hingga Bukti Kinerja

```
Input Surat (Staf TU)
       |
       v
Disposisi (Pimpinan)
       |
       v
Terima Disposisi (Pelaksana)       --> Auto: Logbook Entry
       |
       v
Kerjakan Pekerjaan
       |
       v
Kirim Laporan Tindak Lanjut        --> Auto: Logbook Entry
       |                           --> Auto: Bukti Kinerja
       v
Pimpinan Lihat Laporan
       |
       v
Selesaikan Surat                   --> Auto: Arsip
       |
       v
Akhir Bulan: Generate E-Kinerja    --> PDF + Upload Drive
```

---

*Dokumen selanjutnya: [Panduan 06 — Laporan Kinerja](./06-laporan-kinerja.md)*
