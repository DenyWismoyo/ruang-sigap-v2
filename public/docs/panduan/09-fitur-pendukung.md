# Panduan 09 — Fitur Pendukung

> Berbagai menu pendukung yang melengkapi alur kerja utama RUANG SIGAP

---

## 1. Manajemen Tugas

> Menu: **Tugas** | Path: `/dashboard/poros/tugas`

### Apa Itu Tugas?

Tugas adalah **perintah kerja terstruktur** yang dibuat atasan dan ditugaskan kepada bawahan, terpisah dari alur disposisi surat. Tugas bisa berdiri sendiri atau terhubung dengan surat tertentu.

### Membuat Tugas

1. Klik tombol **"+ Buat Tugas"**
2. Isi formulir tugas:
   - **Judul Tugas** (wajib)
   - **Deskripsi** — Penjelasan detail pekerjaan
   - **Penerima Tugas** — Bawahan yang ditugaskan
   - **Prioritas** — Tinggi / Sedang / Rendah
   - **Batas Waktu** — Deadline pengerjaan
   - **Surat Terkait** — Link ke surat terkait (opsional)
   - **Sub-tugas** — Daftar poin pekerjaan spesifik
   - **Kategori** — Penyusunan Laporan / Analisis Data / Koordinasi / dll

3. Klik **"Buat Tugas"**

### Status Tugas

| Status | Arti |
|--------|------|
| **Baru** | Tugas baru dibuat, belum dikerjakan |
| **Dikerjakan** | Pelaksana sudah mulai mengerjakan |
| **Selesai** | Tugas telah diselesaikan |
| **Dibatalkan** | Tugas dibatalkan oleh pemberi tugas |

### Fitur Tugas

- **Komentar:** Komunikasi antara pemberi dan penerima tugas
- **Sub-tugas:** Pecah tugas besar menjadi poin-poin kecil
- **Lampiran:** Upload file atau tambahkan link terkait tugas
- **Delegasi:** Penerima tugas dapat mendelegasikan ke pihak lain

---

## 2. Checklist Board (Kanban)

> Menu: **Checklist** | Path: `/dashboard/poros/checklist`

### Apa Itu Checklist Board?

Papan kanban personal untuk mengorganisir pekerjaan dalam format visual **Todo — In Progress — Done**.

### Cara Menggunakan

1. Buat papan baru dengan judul
2. Tambahkan item-item pekerjaan
3. Geser item antar kolom sesuai progres:
   - **Todo** — Belum dimulai
   - **In Progress** — Sedang dikerjakan
   - **Done** — Selesai

Checklist Board bisa ditautkan ke Tugas tertentu untuk tracking yang lebih terorganisir.

---

## 3. Bank Templat Instruksi

> Menu: **Bank Templat** | Path: `/dashboard/poros/bank-templat`

### Apa Itu Bank Templat?

Bank Templat adalah **repositori instruksi disposisi yang sering digunakan**. Daripada mengetik instruksi yang sama berulang kali, simpan template instruksi yang sering dipakai dan gunakan kembali saat mendisposisikan.

### Cara Membuat Templat

1. Buka menu Bank Templat
2. Klik **"+ Templat Baru"**
3. Isi:
   - **Judul Templat** (mis. "Instruksi Rapat Koordinasi")
   - **Isi Instruksi** (teks lengkap instruksi)
4. Simpan

### Cara Menggunakan Templat

Saat form disposisi terbuka, klik ikon **"Templat"** (buku) di sebelah field instruksi. Pilih templat yang sesuai — teks instruksi otomatis terisi.

Templat dapat dibagikan ke OPD lain (untuk instansi yang menggunakan paket Profesional/Enterprise).

---

## 4. Repositori Dokumen

> Menu: **Dokumen** | Path: `/dashboard/poros/dokumen`

### Apa Itu Repositori Dokumen?

Sistem penyimpanan dan organisasi dokumen/tautan penting OPD dalam struktur **folder-subfolder**. Berbeda dengan Google Drive, repositori ini terintegrasi langsung di RUANG SIGAP dan dapat dikontrol aksesnya.

### Fitur

- Buat folder dan sub-folder
- Tambahkan link (URL) dokumen dari Google Drive, website, atau sumber lain
- Upload file PDF, Excel, Word, gambar, dll
- Tentukan jenis ikon dokumen (Sheet, Doc, PDF, Video, dll)
- Bagikan folder ke OPD lain
- Pencarian dokumen berdasarkan nama

---

## 5. Jadwal Tempat/Ruang

> Menu: **Jadwal** | Path: `/dashboard/poros/jadwal`

### Apa Itu Jadwal Tempat?

Sistem **booking ruang rapat dan jadwal kegiatan internal** OPD. Memungkinkan pegawai memesan penggunaan ruang rapat, aula, atau venue kegiatan.

### Cara Membuat Jadwal

1. Klik **"+ Buat Jadwal"**
2. Isi:
   - Nama kegiatan
   - Penanggung jawab
   - Tanggal dan jam mulai-selesai
   - Jenis: **Fisik** (nama tempat) atau **Virtual** (tautan rapat)
   - Peserta (pilih dari daftar jabatan)
   - Jumlah personil
3. Submit untuk persetujuan Admin/Pimpinan
4. Admin/Pimpinan approve atau tolak permintaan
5. Setelah disetujui, jadwal muncul di Agenda Harian peserta

### Status Jadwal

| Status | Keterangan |
|--------|------------|
| **Menunggu Persetujuan** | Baru diajukan |
| **Disetujui** | Sudah diapprove |
| **Ditolak** | Ditolak dengan alasan |

---

## 6. Persetujuan Draf

> Menu: **Persetujuan Draf** | Path: `/dashboard/poros/persetujuan-draf`

### Apa Itu Persetujuan Draf?

Sistem workflow untuk **review dan persetujuan dokumen** (surat keluar, SK, laporan, dll.) yang dibuat di Google Docs sebelum dikirim/ditandatangani.

### Alur Persetujuan

```
Pembuat Draf --> Pengiriman ke Reviewer 1
                      |
                   Review
                  /      \
           Setuju        Revisi
              |             |
         Reviewer 2     Kembali ke Pembuat
              |
           Setuju
              |
          Final / Selesai
```

### Cara Menggunakan

1. Pembuat membuat dokumen di Google Docs
2. Salin link Google Docs ke RUANG SIGAP
3. Tentukan rantai persetujuan (siapa saja yang harus menyetujui dan urutannya)
4. Kirim untuk review
5. Reviewer mendapat notifikasi di Ruang Kerja (kartu "Draf")
6. Reviewer bisa Setuju atau Revisi (dengan catatan)

---

## 7. Knowledge Base

> Menu: **Knowledge** | Path: `/dashboard/poros/knowledge`

### Apa Itu Knowledge Base?

Repositori **artikel pengetahuan, SOP, panduan, dan referensi** yang dibuat dan dibagikan dalam OPD. Berfungsi seperti Wikipedia internal organisasi.

### Fitur

- Buat artikel dengan editor teks kaya
- Kategorisasi artikel
- Lampirkan file pendukung
- Bagikan ke OPD lain
- Pencarian berdasarkan judul atau konten

---

## 8. Notulensi Rapat

> Menu: **Notulensi** | Path: `/dashboard/poros/notulensi` (di menu Fungsional)

### Cara Membuat Notulensi

**Cara 1: Manual**
1. Buka menu Notulensi
2. Klik **"+ Notulensi Baru"**
3. Isi formulir notulensi

**Cara 2: Dari Agenda (Cepat)**
Di Ruang Kerja atau Halaman Agenda, klik tombol **"Buat Notulensi"** pada kartu agenda. Data rapat otomatis terisi.

### Isi Notulensi

- Judul Rapat
- Tanggal Rapat
- Pemimpin Rapat
- Notulis
- Daftar Peserta
- Isi Notulensi (teks bebas)

---

## 9. AI Copilot (Poros Copilot)

> Tombol: Ikon robot/AI di sudut layar

### Apa Itu Poros Copilot?

Asisten AI berbasis Gemini yang terintegrasi langsung di RUANG SIGAP. Copilot dapat membantu:

- **Membuat instruksi disposisi** berdasarkan konteks surat
- **Merangkum isi surat** (ringkasan eksekutif)
- **Membuat catatan logbook** secara otomatis
- **Memberikan saran tindak lanjut** berdasarkan jenis surat
- **Menjawab pertanyaan** seputar penggunaan aplikasi

### Cara Menggunakan Copilot

1. Klik ikon Copilot (otak/robot) di sudut kanan bawah
2. Panel Copilot terbuka dari sisi kanan
3. Ketik pertanyaan atau perintah
4. Copilot akan merespons dan dapat mengambil aksi langsung (mis. membuat entri logbook)

---

## 10. Profil & Pengaturan

> Menu: **Profil** | Path: `/dashboard/poros/profil`

### Apa yang Bisa Diatur di Profil?

| Pengaturan | Keterangan |
|------------|------------|
| **Nama & NIP** | Informasi identitas (biasanya diatur Admin) |
| **Foto Profil** | Upload foto untuk tampilan di aplikasi |
| **Nomor WhatsApp** | Untuk notifikasi via WA (opsional) |
| **Email Personal** | Email cadangan untuk notifikasi |
| **Integrasi Google** | Hubungkan akun Google untuk fitur Google Drive & Calendar |
| **Folder E-Kinerja** | Tentukan folder Google Drive tujuan upload laporan |
| **Sinkronisasi Calendar** | Aktifkan/nonaktifkan sinkronisasi agenda ke Google Calendar |

### Integrasi Google (Penting!)

Untuk menggunakan fitur upload ke Google Drive:

1. Buka menu Profil
2. Klik tombol **"Hubungkan Akun Google"**
3. Login dengan akun Google yang ingin digunakan
4. Izinkan akses ke Google Drive
5. Setelah terhubung, masukkan link folder Google Drive E-Kinerja Anda

> **Tips:** Gunakan akun Google instansi (bukan akun pribadi) untuk keperluan kedinasan.

---

*Dokumen selanjutnya: [Panduan 10 — Roadmap & Transformasi Digital](./10-roadmap-transformasi.md)*
