# PANDUAN PENGGUNAAN SISTEM

## Teman Digital Anda untuk Memahami Semua Fitur dengan Mudah

> **Untuk Siapa Panduan Ini?**
> Panduan ini dibuat untuk **semua pengguna sistem** — dari Staf TU yang baru pertama kali login, Pimpinan yang ingin memahami alur disposisi, hingga Admin yang mengelola tim. Kami tulis dalam bahasa sehari-hari agar Anda bisa langsung paham dan langsung praktek — tanpa perlu baca buku tebal.

---

# MENGENAL SISTEM INI

## 1.1 Apa Itu Sistem Ini?

Sistem ini adalah **platform manajemen persuratan digital** yang dirancang khusus untuk kebutuhan administrasi di lingkungan Pemerintah Daerah.

Bayangkan seluruh proses surat-menyurat kantor Anda — dari surat masuk, disposisi ke bawahan, laporan tindak lanjut, hingga pengarsipan — semuanya terjadi dalam **satu tempat digital**, tanpa kertas, tanpa WhatsApp yang berantakan, tanpa harus tanya-tanya "sudah ditindaklanjuti belum?".

Itulah yang sistem ini lakukan.

## 1.2 Prinsip Utama: 1 Input → 5 Output Otomatis

Ini adalah hal paling penting yang perlu dipahami. Filosofi sistem ini sangat sederhana:

**CUKUP INPUT SATU KALI, SISTEM YANG MENGERJAKAN SISANYA.**

```
INPUT TUNGGAL: Staf TU menginput surat masuk (1x kerja)
                              |
              ┌───────────────┴───────────────┐
              |           SISTEM              |
              └───────────────┬───────────────┘
                              |
         ┌─────────┬──────────┼──────────┬─────────┐
         ↓         ↓          ↓          ↓         ↓
    OUTPUT 1   OUTPUT 2   OUTPUT 3   OUTPUT 4  OUTPUT 5
    AGENDA     DISPOSISI  LAPORAN    E-KINERJA  ARSIP
    HARIAN     (rantai)   TINDAK     (Google    DIGITAL
    (otomatis) (notif)    LANJUT     Drive)     (bisa dicari)
```

**Penjelasan tiap output:**

- **Output 1 — Agenda Harian:** Surat jenis "Undangan" yang diinput dengan detail tanggal/jam/lokasi otomatis muncul di halaman Agenda Harian — bisa dilihat semua pihak yang terlibat, tanpa perlu nulis ulang ke kalender.

- **Output 2 — Disposisi Digital:** Pimpinan bisa langsung kirim instruksi ke bawahan lewat sistem, lengkap dengan catatan, batas waktu, dan notifikasi otomatis. Setiap langkah tercatat — siapa, kapan, apa instruksinya.

- **Output 3 — Laporan Tindak Lanjut:** Setiap laporan progres yang dikirim pelaksana tersimpan rapi dan bisa dipantau pimpinan secara langsung (*real-time*), kapan saja.

- **Output 4 — Bukti E-Kinerja:** Semua aktivitas (terima disposisi, kirim laporan, selesaikan tugas) secara otomatis tercatat di Logbook dan bisa dikonversi menjadi Bukti E-Kinerja yang siap diunggah ke Google Drive.

- **Output 5 — Arsip Digital:** Surat yang sudah selesai tersimpan permanen dan bisa dicari dalam hitungan detik — berdasarkan nomor surat, perihal, pengirim, atau status.

## 1.3 Masalah yang Dipecahkan Sistem Ini

| Masalah Lama (Cara Manual)                           | Solusinya di Sistem Ini                                   |
| ---------------------------------------------------- | --------------------------------------------------------- |
| Surat menumpuk di meja dan sering terlupakan         | Ruang Kerja digital dengan notifikasi *real-time*         |
| Disposisi cuma via lisan atau lembar kertas          | Disposisi digital dengan instruksi, deadline, dan riwayat |
| Tidak tahu apakah bawahan sudah menindaklanjuti      | Tab Pemantauan real-time per surat                        |
| Laporan kinerja harus diketik ulang setiap bulan     | Logbook otomatis + rekap 1 klik                           |
| Surat fisik hilang atau susah dicari                 | Arsip digital dengan pencarian canggih                    |
| Tidak ada bukti tertulis bahwa ASN sudah bekerja     | Logbook + Bukti Kinerja otomatis ter-*generate*           |
| Jadwal rapat terlewat karena tidak tercatat          | Agenda Harian otomatis dari setiap surat undangan         |

---

# PENGGUNA & HAK AKSES

## 2.1 Tiga Jenis Pengguna

Sistem mengenal 3 jenis pengguna dengan peran dan hak akses berbeda:

### Staf TU (`staf_tu`)

**Peran:** Pintu masuk semua surat ke dalam sistem

- Bisa menginput surat masuk baru
- Bisa melihat seluruh surat di instansi
- Bisa mencetak agenda
- Akses ke manajemen arsip
- Tidak bisa mendisposisikan surat ke bawahan pimpinan

### Pimpinan (Level Jabatan 1-5)

**Peran:** Pengambil keputusan dan pendisposisi surat

- Menerima surat baru di Ruang Kerja
- Mendisposisikan surat ke bawahan (satu orang atau lebih sekaligus)
- Memantau laporan tindak lanjut dari bawahan secara langsung
- Bisa menyelesaikan surat sendiri tanpa mendisposisikan
- Bisa mengarsipkan surat
- Melihat laporan kinerja tim dan instansi

### Staf Pelaksana (Level Jabatan 6 ke atas)

**Peran:** Penerima tugas dan pelapor tindak lanjut

- Menerima disposisi dari atasan
- Wajib konfirmasi terima setiap disposisi
- Melaporkan progres pekerjaan ke atasan
- Bisa meneruskan disposisi ke bawahannya (jika punya)
- Bisa eskalasi surat kembali ke atasan jika tidak sanggup menangani

## 2.2 Sistem Level Jabatan

Sistem menggunakan angka level jabatan untuk menentukan hierarki:

- **Level 1-3:** Pimpinan tinggi (Kepala Instansi, Sekretaris)
- **Level 4-5:** Pimpinan menengah (Kepala Bidang, Kepala Sub-Bagian)
- **Level 6 ke atas:** Staf Pelaksana

> **Tips:** Surat masuk yang belum ada tujuan jabatan spesifiknya akan otomatis muncul di Ruang Kerja pimpinan teratas instansi Anda (yang angka level-nya paling kecil = posisi paling tinggi).

## 2.3 Fitur PLT (Pejabat Pelaksana Tugas)

Kalau seorang pejabat sedang cuti atau berhalangan, sistem punya solusinya:

- Admin bisa menunjuk PLT untuk jabatan tertentu
- PLT bisa "masuk" sebagai pemegang jabatan tersebut
- Semua surat dan disposisi yang masuk ke jabatan itu bisa dilihat oleh PLT
- Perpindahan antara jabatan asli dan jabatan PLT dilakukan dengan toggle mudah

---

# MENU-MENU UTAMA

## 3.1 Dashboard / Beranda

**Path:** `/dashboard`

Halaman pertama setelah login. Berisi ringkasan pekerjaan hari ini dalam satu tampilan.

**Yang ada di Dashboard:**

- **Sapaan Cerdas:** Menyapa Anda berdasarkan waktu ("Selamat Pagi, Pak Budi!")
- **4 Kartu Angka KPI:** Disposisi Baru, Tindak Lanjut Menunggu, Tugas Aktif, Tugas Lewat Deadline
- **4 Kartu Akses Cepat:** Langsung ke Ruang Kerja, Logbook, Surat Masuk, Arsip
- **Agenda Harian:** Jadwal kegiatan mendatang (Carousel di HP, Tabel di komputer)
- **Mini Kalender:** Penanda hari-hari yang ada kegiatannya
- **Widget Kinerja Personal:** Ringkasan pencapaian Anda hari ini

## 3.2 Kotak Masuk / Surat Masuk

**Path:** `/dashboard/surat`

Pusat manajemen semua surat masuk instansi Anda.

**Tampilan Dua Panel:**

- **Panel Kiri:** Daftar surat dengan filter dan kolom pencarian
- **Panel Kanan:** Isi surat yang diklik (tampil PDF + detail + aksi tindak lanjut)

**Tab Filter Status:**

- **Semua** — seluruh surat yang sedang aktif
- **Baru** — surat yang belum ada disposisinya
- **Proses Tindak Lanjut** — sedang dikerjakan
- **Selesai** — sudah selesai diproses
- **Pemantauan** — khusus untuk pimpinan/admin memantau progres

**Arti Status Surat:**

| Status | Artinya |
|--------|---------|
| BARU (kuning) | Surat baru masuk, belum ada disposisi |
| DIDISPOSISIKAN (biru) | Sudah dikirim ke pelaksana, belum dikonfirmasi terima |
| PROSES TINDAK LANJUT (oranye) | Pelaksana sudah terima dan sedang mengerjakan |
| SELESAI (hijau) | Semua pihak sudah menyelesaikan |
| DIARSIPKAN (abu-abu) | Sudah diarsipkan, tidak tampil di daftar aktif |
| REVISI DISPOSISI (merah muda) | Disposisi dikembalikan, perlu direvisi |

**Cara Input Surat Baru (khusus Staf TU):**

1. Klik tombol **"+ Input Surat"**
2. Isi data surat: Nomor, Perihal, Pengirim, Tanggal Surat, Tanggal Diterima, Klasifikasi, Jenis Surat
3. Kalau suratnya Undangan: isi detail agenda (tanggal kegiatan, jam, lokasi)
4. Upload file surat (PDF/JPG/PNG)
5. Klik **Simpan** — Surat langsung muncul di Ruang Kerja pimpinan!

**Klasifikasi Surat:**

- **Biasa** — surat rutin harian
- **Penting** — perlu perhatian lebih
- **Segera** — harus segera ditindaklanjuti
- **Rahasia** — dokumen sensitif, akses terbatas

**Jenis Surat:**

- **Undangan** — otomatis buat Agenda Harian
- **Pemberitahuan** — informasi tanpa tindak lanjut khusus
- **Permohonan** — ada permintaan yang perlu direspons
- **Lainnya** — jenis surat di luar kategori di atas

## 3.3 Ruang Kerja (MENU PALING PENTING)

**Path:** `/dashboard/ruang-kerja`

Kalau ada satu menu yang wajib Anda buka setiap hari, itulah **Ruang Kerja**. Ini adalah kotak masuk terpadu semua pekerjaan Anda.

**4 Jenis Item yang Muncul di Feed Ruang Kerja:**

**A. SURAT BARU** (khusus Pimpinan & Staf TU):

- Surat masuk yang belum ada disposisinya, menunggu tindakan Anda
- Dua pilihan aksi: **[Disposisikan]** (kirim ke bawahan) atau **[Tindaklanjuti Sendiri]** (Anda tangani langsung — surat langsung Selesai)

**B. SURAT DISPOSISI** (untuk Pelaksana):

- Disposisi dari atasan yang masuk ke Anda
- Kartu berwarna Kuning/Oranye = belum Anda konfirmasi terima
- Kartu berwarna Merah = sudah lewat deadline!
- Kalau **BELUM DITERIMA**: hanya ada tombol **[Terima Disposisi]**
- Kalau **SUDAH DITERIMA**: ada tombol **[Lapor Tindak Lanjut]** + **[Disposisi Lanjut]** + **[Eskalasi]**

**C. TUGAS:**

- Tugas yang diberikan atasan di luar alur surat
- Tombol: **[Mulai]** lalu **[Selesai]**, **[Komentar]**
- Menyelesaikan tugas otomatis buat entri di Logbook Anda

**D. DRAF PERSETUJUAN** (khusus Pimpinan):

- Dokumen (Google Docs) dari bawahan yang menunggu persetujuan Anda
- Pilihan: **[Setujui]** atau **[Revisi + catatan]**

**Filter Tabs:**

- **Semua (n)** — semua item aktif
- **Surat/Disposisi (n)** — hanya surat dan disposisi
- **Tugas (n)** — hanya tugas
- **Draf (n)** — hanya draf persetujuan
- **Agenda & Catatan** — tampilan khusus HP

**Urutan Tampilan di Feed:**

1. Item yang sudah *overdue* (melewati deadline) — selalu muncul paling atas
2. Item terbaru — dari yang paling baru

**Panel Samping Kanan (di komputer):**

- Quick Links — link favorit Anda
- Sticky Note — catatan tempel digital pribadi
- Agenda 7 Hari — jadwal kegiatan dalam seminggu ke depan

> **Catatan Teknis:** Ketika Anda melakukan aksi (kirim disposisi, laporan), item langsung hilang dari tampilan meski server masih memproses. Ini disengaja agar feed tidak terasa "lambat" atau item tidak terus muncul di layar Anda.

## 3.4 Alur Disposisi Lengkap (Langkah demi Langkah)

### LANGKAH 1: Pimpinan Mendisposisikan Surat

1. Di Ruang Kerja, Pimpinan melihat kartu bertuliskan **"SURAT BARU"**
2. Klik **[Disposisikan]**
3. Form disposisi terbuka
4. Pilih penerima dari daftar bawahan (boleh lebih dari satu orang sekaligus)
5. Tulis instruksi — atau pilih dari **Templat Instruksi** yang sudah tersimpan
6. Set batas waktu/deadline (opsional)
7. Pilih jenis: **Normal** (penerima wajib lapor tindak lanjut) atau **Informasional** (cukup untuk diketahui saja)
8. Klik **[Kirim Disposisi]**
9. **Yang terjadi otomatis:** Notifikasi push ke semua penerima, status surat berubah jadi "Didisposisikan", entri Logbook terbuat untuk Anda sebagai pengirim

### LANGKAH 2: Pelaksana Menerima Disposisi

1. Di Ruang Kerja, Pelaksana melihat kartu **"SURAT DISPOSISI"** berwarna kuning/oranye
2. Kartu menampilkan: siapa yang mengirim, perihal surat, instruksi, dan deadline
3. Klik **[Terima Disposisi]** — ini wajib dilakukan sebagai konfirmasi bahwa Anda sudah membaca
4. Kartu berubah tampilan (tidak lagi kuning)
5. **Yang terjadi otomatis:** Pengirim dapat notifikasi "Disposisi sudah diterima", entri Logbook terbuat untuk Anda

### LANGKAH 3: Pelaksana Melaporkan Tindak Lanjut

1. Setelah mengerjakan pekerjaan, klik **[Lapor Tindak Lanjut]**
2. Form laporan muncul, isi:
   - Judul Laporan (contoh: "Koordinasi dengan Bagian Hukum sudah selesai")
   - Isi Laporan (ceritakan apa yang sudah Anda kerjakan)
   - Warna Label (kode visual: default/merah/hijau/biru/kuning/ungu)
   - Checklist item yang sudah selesai (opsional)
   - Upload lampiran via Google Drive (opsional)
3. Pilih mode pengiriman:
   - **[Kirim Laporan - Proses]** = laporan terkirim, tapi disposisi masih terbuka (bisa lapor lagi nanti)
   - **[Selesaikan & Tutup]** = laporan terkirim, disposisi ditutup, kartu hilang dari feed
4. **Yang terjadi otomatis:** Notifikasi ke atasan, entri Logbook terbuat, Bukti Kinerja otomatis tersimpan

### LANGKAH 4: Disposisi Lanjutan (Subdelegasi ke Bawahan)

Kalau Anda perlu meneruskan pekerjaan ke bawahan Anda sendiri:

1. Klik **[Disposisi Lanjut]**
2. Pilih bawahan sebagai penerima
3. Tulis instruksi baru
4. Kirim — bawahan Anda mendapat notifikasi

### LANGKAH 5: Eskalasi ke Atasan

Kalau Anda merasa tidak bisa atau tidak berwenang menangani surat ini:

1. Klik **[Eskalasi ke Atasan]**
2. Pilih jabatan atasan tujuan
3. Tulis alasan eskalasi
4. Kirim — atasan mendapat notifikasi eskalasi dari Anda

### LANGKAH 6: Surat Selesai & Diarsipkan

- Surat otomatis berstatus "Selesai" ketika **semua disposisi** yang ada sudah ditutup
- Pimpinan/Admin bisa mengarsipkan surat kapan saja
- Surat yang diarsipkan hanya bisa ditemukan di halaman **Arsip**

## 3.5 Logbook Harian

**Path:** `/dashboard/logbook`

Logbook adalah **buku catatan kegiatan digital pribadi** Anda. Bayangkan seperti jurnal kerja harian yang terisi otomatis.

**Cara Berpindah Hari:**

- Klik tombol **[<]** dan **[>]** untuk mundur/maju satu hari
- Atau ketik langsung tanggal yang diinginkan
- Klik **[Hari Ini]** untuk kembali ke hari ini

**Kegiatan di Logbook Ada 2 Jenis:**

**A. Diisi Otomatis oleh Sistem** — tanpa Anda perlu melakukan apapun:

- Kirim disposisi → *"Mendisposisikan surat: [Perihal]"*
- Terima disposisi → *"Menerima disposisi surat: [Perihal]"*
- Kirim laporan → *"Tindak Lanjut Surat: [Perihal] - [Judul Laporan]"*
- Selesaikan surat → *"Menyelesaikan surat: [Perihal]"*
- Eskalasi surat → *"Eskalasi surat ke pimpinan: [Perihal]"*
- Arsipkan surat → *"Mengarsipkan surat: [Perihal]"*
- Selesaikan tugas → *"Menyelesaikan tugas: [Judul Tugas]"*

**B. Ditambah Manual oleh Anda:**

- Klik **[+ Tambah Kegiatan]**
- Modal "Smart Add Kegiatan" terbuka
- **Mode Umum:** tulis kegiatan apapun secara bebas
- **Mode Tindak Lanjut:** kaitkan dengan surat/disposisi tertentu

**Kategori Kegiatan:** Surat (biru), Disposisi (amber), Tugas (hijau), Rapat (ungu), Laporan (indigo), Umum (abu-abu)

**Progress Bar Harian:** Menampilkan persentase kegiatan hari ini yang sudah ditandai selesai.

---

### FITUR REKAP BULANAN — Penting untuk E-Kinerja!

Inilah fitur yang paling berguna di akhir bulan untuk menyiapkan laporan kinerja:

1. Klik **[Rekap Bulanan]**
2. Pilih Bulan & Tahun
3. Klik **[Generate Rekap]** — sistem menarik semua data logbook bulan tersebut
4. Preview teks rekap ditampilkan — bisa Anda cek dulu sebelum dikirim
5. Dua pilihan ekspor:
   - **[Download PDF]** — file PDF format resmi langsung terunduh
   - **[Upload ke Drive]** — diunggah otomatis ke folder Google Drive E-Kinerja Anda, dengan sub-folder nama otomatis: *"8. 2026 Agustus - Bukti E Kinerja"*

> **Syarat Upload ke Drive:** Akun Google harus sudah dihubungkan di menu Profil dan link folder Google Drive E-Kinerja sudah diisi.

## 3.6 Laporan Tindak Lanjut

**Path:** `/dashboard/laporan`

**Dua cara membuat Laporan TL:**

- **Cara A:** Dari Ruang Kerja — klik **[Lapor Tindak Lanjut]** di kartu disposisi
- **Cara B:** Dari Detail Surat — klik tab "Tindak Lanjut" — klik **[+ Tambah Laporan]**

**Yang Bisa Diisi di Form Laporan:**

- Judul Laporan (opsional tapi sangat disarankan — buat pencarian lebih mudah)
- Isi Laporan (ceritakan detail pekerjaan yang sudah dilakukan)
- Warna Label (6 pilihan untuk menandai jenis laporan)
- Checklist (daftar pekerjaan spesifik dengan centang selesai/belum)
- Upload Lampiran (file bukti via Google Drive)

**Arti Warna Label:**

| Warna | Gunakan Saat... |
|-------|-----------------|
| Default (putih) | Laporan biasa |
| Merah | Ada masalah atau kendala |
| Hijau | Pekerjaan berjalan lancar / sudah selesai |
| Biru | Informasi penting perlu disampaikan |
| Kuning | Perlu perhatian lebih dari atasan |
| Ungu | Laporan khusus / istimewa |

**Setelah laporan dikirim, ini yang terjadi otomatis:**

- Atasan mendapat notifikasi
- Entri Logbook Anda terbuat
- Bukti Kinerja tersimpan di halaman Bukti Kinerja

## 3.7 Bukti Kinerja (E-Kinerja)

**Path:** `/dashboard/bukti-kinerja`

Portofolio digital kinerja Anda. Terisi dari 3 sumber:

1. **Laporan Tindak Lanjut** — otomatis tersimpan saat Anda kirim laporan
2. **Tugas yang Diselesaikan** — otomatis tersimpan saat Anda tandai tugas selesai
3. **Upload Manual** — Anda bisa unggah dokumen apapun sebagai bukti kerja tambahan

**Tab Upload:** Form untuk upload bukti kerja manual

**Tab Riwayat:** Galeri semua bukti kinerja yang sudah tersimpan

**Asal-usul Bukti Kinerja (Badge):**

- **"Laporan TL"** — dari laporan tindak lanjut surat
- **"Penyelesaian Tugas"** — dari tugas yang Anda selesaikan
- **"Manual Upload"** — yang Anda upload sendiri

**Download Laporan Kinerja PDF:**
Klik **[Download Laporan PDF]** — pilih periode — PDF siap diunduh dengan format profesional

## 3.8 Laporan Kinerja Instansi

**Path:** `/dashboard/laporan`

Statistik dan analitika kinerja instansi secara keseluruhan — khusus untuk pimpinan dan admin.

**Yang Ditampilkan:**

- Total Surat Masuk (dalam periode tertentu)
- Surat Selesai vs. Surat Terlambat
- Rata-rata Waktu Respons (dalam jam)

**Grafik Performa:** Tren volume surat dan tingkat penyelesaian

**Tabel Beban Kerja Per Jabatan:** Jabatan mana yang paling banyak menangani surat dan tugas

**Tabel Kinerja Per Jabatan:**

- Total tugas selesai & tugas selesai tepat waktu
- Rata-rata waktu penyelesaian
- Total disposisi yang diterima

**Laporan Mingguan Otomatis:** Sistem menghasilkan laporan mingguan yang tersimpan dan bisa diakses untuk perbandingan antar instansi.

## 3.9 Agenda Harian

**Path:** `/dashboard/agenda`

Kalender digital yang selalu menampilkan kegiatan 7 hari ke depan.

**Sumber Data Agenda (ada 2):**

1. Surat jenis "Undangan" yang diinput dengan detail agenda — otomatis muncul
2. Jadwal Internal yang dibuat melalui menu Jadwal Tempat

**Kode Warna:**

- Biru/Indigo — agenda dari surat undangan
- Hijau — jadwal internal

**Setiap Kartu Agenda Menampilkan:**

- Judul/perihal kegiatan
- Tanggal dan jam
- Lokasi (atau "Rapat Virtual" untuk meeting online)
- Status disposisi: sudah/belum didisposisikan kepada siapa

**Fitur Notulensi Cepat:**
Dari kartu agenda, klik **[Buat Notulensi]** — form notulensi terbuka dengan data rapat sudah terisi otomatis, Anda tinggal mengisi isi notulensinya saja.

## 3.10 Arsip Digital

**Path:** `/dashboard/arsip`

Tempat penyimpanan permanen semua surat yang sudah selesai atau diarsipkan.

**Bagaimana Surat Bisa Masuk Arsip?**

- **Otomatis:** Saat semua disposisi ditutup, surat berstatus "Selesai"
- **Manual:** Pimpinan/Admin klik tombol Arsipkan kapan saja

**Tampilan:**

- Di komputer: Tabel dengan kolom Perihal, Nomor, Pengirim, Status, Tanggal
- Di HP: Kartu-kartu

**Filter Pencarian:**

- Status: Semua / Selesai / Diarsipkan
- Jenis Surat: Semua / Undangan / Pemberitahuan / Permohonan / Lainnya
- Pencarian teks: ketik perihal, nomor, atau nama pengirim

**Navigasi Halaman:** 10 surat per halaman dengan tombol Awal/Sebelumnya/Selanjutnya/Akhir

**Klik surat di arsip:** Membuka detail lengkap termasuk file asli, riwayat disposisi, laporan TL, dan jejak audit lengkap.

---

# FITUR-FITUR PENDUKUNG

## 4.1 Manajemen Tugas

**Path:** `/dashboard/tugas`

Tugas adalah perintah kerja terstruktur yang bisa diberikan atasan ke bawahan, di luar alur surat disposisi biasa.

**Alur Status Tugas:** Baru — Dikerjakan — Selesai / Dibatalkan

**Fitur Unggulan Tugas:**

- **Sub-tugas:** Pecah tugas besar menjadi poin-poin kecil yang bisa dicentang
- **Komentar:** Komunikasi langsung antara pemberi dan penerima tugas
- **Lampiran:** Sertakan file atau link yang relevan
- **Delegasi:** Penerima tugas bisa meneruskan ke pihak lain
- **Prioritas:** Tinggi / Sedang / Rendah
- **Kategori:** Penyusunan Laporan / Analisis Data / Koordinasi / dan lainnya

Ketika tugas diselesaikan, dua hal otomatis terjadi: entri Logbook terbuat dan Bukti Kinerja tersimpan.

## 4.2 Checklist Board (Papan Kanban)

**Path:** `/dashboard/checklist`

Papan kerja visual personal dengan tiga kolom: **Todo — In Progress — Done**

Sangat berguna untuk mengorganisir pekerjaan harian Anda. Bisa ditautkan ke Tugas tertentu.

## 4.3 Bank Templat Instruksi

**Path:** `/dashboard/bank-templat`

Simpan teks instruksi disposisi yang sering Anda gunakan, agar tidak perlu mengetik ulang setiap kali.

**Cara pakai:** Saat form disposisi terbuka, klik ikon buku — pilih templat — instruksi terisi otomatis.

Templat bisa dibagikan ke instansi lain (fitur paket Pro/Enterprise).

## 4.4 Repositori Dokumen

**Path:** `/dashboard/dokumen`

Penyimpanan dokumen instansi dengan struktur folder-subfolder, mirip Google Drive tapi terintegrasi langsung dalam sistem.

Mendukung: folder, link URL, upload file (PDF/Excel/Word/gambar/video).

## 4.5 Jadwal Tempat / Booking Ruang

**Path:** `/dashboard/jadwal`

Sistem pemesanan ruang rapat dan jadwal kegiatan internal instansi.

**Alur:** Menunggu Persetujuan — Disetujui / Ditolak

Jadwal yang disetujui otomatis muncul di Agenda Harian semua peserta. Mendukung mode **Fisik** (nama tempat) dan **Virtual** (tautan *meeting*).

## 4.6 Persetujuan Draf Dokumen

**Path:** `/dashboard/persetujuan-draf`

Workflow review dan persetujuan dokumen Google Docs sebelum dikirim atau ditandatangani.

Rantai persetujuan bisa dikonfigurasi (siapa saja, urutan berapa tahap). Setiap reviewer mendapat kartu di Ruang Kerja untuk menyetujui atau merevisi.

## 4.7 Knowledge Base

**Path:** `/dashboard/knowledge`

Repositori artikel, SOP, dan panduan internal instansi. Bisa dikategorikan dan dibagikan ke instansi lain.

## 4.8 Notulensi Rapat

**Dua cara membuat:**

- **Cara A:** Dari menu Notulensi, buat secara manual
- **Cara B:** Dari Ruang Kerja / Agenda, klik **[Buat Notulensi]** — data rapat otomatis terisi

**Isi Notulensi:** Judul Rapat, Tanggal, Pemimpin Rapat, Notulis, Peserta, Isi Notulensi.

## 4.9 Surat Keluar

**Path:** `/dashboard/surat-keluar`

Manajemen surat keluar instansi, terpisah dari surat masuk. Pencatatan surat yang dikirim keluar oleh instansi Anda.

---

# NOTIFIKASI & KOMUNIKASI

## 5.1 Notifikasi Push (ke Browser/HP)

Sistem otomatis mengirim notifikasi langsung ke browser atau perangkat Anda ketika:

- Ada disposisi baru masuk ke Anda
- Disposisi Anda sudah diterima oleh penerima
- Ada laporan tindak lanjut baru dari bawahan
- Ada tugas baru yang ditugaskan ke Anda
- Ada eskalasi masuk dari bawahan
- Ada pengumuman dari instansi

> **Penting:** Anda harus mengizinkan notifikasi browser saat sistem meminta pop-up izin. Jika terlewat atau tidak sengaja ditolak, atur ulang di: **Pengaturan Browser — Situs — Notifikasi**.

## 5.2 Notifikasi Di Dalam Aplikasi

Ikon lonceng di pojok kanan atas menampilkan riwayat notifikasi yang belum dibaca. Klik notifikasi mana saja untuk langsung dibawa ke halaman yang relevan.

---

# INTEGRASI GOOGLE

## 6.1 Cara Menghubungkan Akun Google

Di menu **Profil** — klik **[Hubungkan Akun Google]** — login dengan akun Google Anda — izinkan akses Drive.

**Setelah terhubung, Anda bisa:**

- Upload rekap Logbook bulanan langsung ke Google Drive
- Upload bukti kinerja ke folder Drive yang ditentukan
- (Opsional) Sinkronisasi agenda ke Google Calendar

## 6.2 Pengaturan Folder E-Kinerja

Setelah Google terhubung, isi link folder Google Drive E-Kinerja Anda di halaman Profil.

Sistem akan otomatis menyimpan file ke dalam sub-folder dengan nama yang terformat rapi:

**Format:** `[Nomor Bulan]. [Tahun] [Nama Bulan] - Bukti E Kinerja`

**Contoh:** `8. 2026 Agustus - Bukti E Kinerja`

---

# NAVIGASI & TAMPILAN

## 7.1 Navigasi di Komputer (Desktop)

- **Sidebar Kiri:** Menu navigasi utama dengan ikon dan label
- **Mega Menu:** Arahkan kursor ke grup menu untuk melihat sub-menu
- **Top Bar:** Pencarian global, lonceng notifikasi, profil pengguna, tombol ganti tema
- **Breadcrumb:** Jejak lokasi halaman saat ini di bagian atas konten

## 7.2 Navigasi di HP (Mobile)

- **Bottom Navigation Bar:** 5 ikon di bagian bawah layar untuk menu yang paling sering diakses
- **Hamburger Menu:** Tombol tiga garis di kiri atas — drawer semua menu lengkap
- **Smart FAB:** Tombol aksi mengambang di sudut kanan bawah untuk aksi cepat
- **Geser (Swipe):** Beberapa halaman mendukung geser kiri-kanan untuk berpindah tampilan

## 7.3 Tema Tampilan (Gelap / Terang)

Klik tombol toggle tema di top bar untuk berpindah antara:

- **Light Mode** (terang) — cocok untuk siang hari di ruangan terang
- **Dark Mode** (gelap) — lebih nyaman untuk mata saat malam hari

Pilihan Anda tersimpan otomatis dan tidak akan berubah walau Anda logout.

## 7.4 Dua Varian Tampilan

Sistem memiliki dua varian tampilan yang bisa dipilih:

- **Tampilan Modern** — desain bersih, modern, dan profesional (default/utama)
- **Tampilan Klasik** — tampilan lama (saat ini dalam masa transisi)

Admin dapat mengatur tampilan default untuk instansi. Setiap pengguna juga bisa memilih tampilan individual di halaman Profil.

---

# OTOMASI SISTEM

Salah satu keunggulan utama sistem ini adalah **banyak hal yang berjalan otomatis** tanpa perlu Anda lakukan secara manual.

## 8.1 Auto-Logbook

Setiap aksi penting otomatis membuat catatan di Logbook harian Anda — tanpa perlu input manual:

| Aksi yang Anda Lakukan | Catatan Logbook yang Otomatis Muncul |
| ---------------------- | ------------------------------------- |
| Kirim disposisi | "Mendisposisikan surat: [Perihal Surat]" |
| Terima disposisi | "Menerima disposisi surat: [Perihal Surat]" |
| Kirim laporan progres | "Tindak Lanjut Surat: [Perihal] - [Judul Laporan]" |
| Selesaikan surat | "Menyelesaikan surat: [Perihal Surat]" |
| Eskalasi surat | "Eskalasi surat ke pimpinan: [Perihal Surat]" |
| Arsipkan surat | "Mengarsipkan surat: [Perihal Surat]" |
| Selesaikan tugas | "Menyelesaikan tugas: [Judul Tugas]" |

## 8.2 Auto-Bukti Kinerja

Setiap laporan tindak lanjut yang Anda kirim otomatis tersimpan sebagai Bukti Kinerja. Tidak perlu input ulang — sistem yang mengerjakannya.

## 8.3 Auto-Agenda

Setiap surat jenis "Undangan" yang diinput dengan detail agenda (tanggal/jam/lokasi) otomatis muncul di halaman Agenda Harian semua pihak yang terlibat.

## 8.4 Auto-Notifikasi

Setiap perpindahan status surat (kirim disposisi, terima disposisi, laporan masuk) otomatis mengirim notifikasi ke pihak yang relevan.

## 8.5 Auto-Cleanup

Sistem secara otomatis membersihkan disposisi yang tidak perlu (misalnya pimpinan yang secara tidak sengaja mendisposisikan ke dirinya sendiri) — mencegah item tidak berguna mengotori feed Ruang Kerja Anda.

---

# DATA & KEAMANAN

## 9.1 Bagaimana Data Disimpan?

Data tersimpan di infrastruktur *cloud* modern yang andal dan *real-time*. Setiap perubahan data (surat baru masuk, laporan terkirim, dll.) langsung terbarui di semua perangkat yang membuka sistem — tanpa perlu *refresh* halaman manual.

| Jenis Data | Keterangan |
| --- | --- |
| Surat | Semua surat masuk instansi |
| Disposisi | Semua disposisi yang pernah dikirim |
| Tindak Lanjut | Laporan tindak lanjut per disposisi |
| Logbook Harian | Catatan kegiatan harian per pegawai |
| Tugas | Data semua tugas |
| Pengguna | Profil semua pengguna |
| Jabatan | Struktur jabatan instansi |
| Notifikasi | Riwayat semua notifikasi |
| Bukti Kinerja | Dokumen bukti kinerja digital |
| Jadwal Tempat | Booking jadwal ruang rapat |

## 9.2 Keamanan Data Antar Instansi

Data setiap instansi sepenuhnya terpisah satu sama lain. Pengguna di instansi A tidak bisa melihat data instansi B — ini dijaga ketat di level sistem. Satu-satunya cara data lintas instansi bisa terlihat adalah melalui fitur Surat Lintas Instansi yang eksplisit dan disengaja.

## 9.3 Jejak Audit

Setiap aksi yang dilakukan pada sebuah surat tercatat permanen dengan detail:

- Siapa yang melakukan (nama + jabatan)
- Aksi apa yang dilakukan
- Kapan tepatnya (tanggal dan jam)
- Catatan/keterangan tambahan

Jejak audit ini bisa dilihat di bagian bawah halaman detail setiap surat.

---

# PERTANYAAN YANG SERING DIAJUKAN

**Q: Kenapa surat saya tidak muncul di Ruang Kerja padahal sudah diinput?**

A: Cek tiga hal: 1) Apakah status surat sudah "Baru"? 2) Apakah Tujuan Jabatan sudah diisi dengan benar? 3) Coba *refresh* halaman. Jika pimpinan tidak melihat surat baru, periksa apakah level jabatan akun Anda sudah benar (level 1-5 untuk pimpinan).

---

**Q: Bagaimana cara mendisposisikan ke beberapa orang sekaligus?**

A: Di form disposisi, centang beberapa nama dari daftar bawahan — semua yang dipilih akan mendapat disposisi dan notifikasi bersamaan.

---

**Q: Apa bedanya disposisi "Normal" dan "Informasional"?**

A: **Normal** = penerima wajib menindaklanjuti dan melaporkan hasilnya. **Informasional** = penerima hanya perlu mengetahui surat ini, tidak perlu membuat laporan tindak lanjut.

---

**Q: Bisakah laporan tindak lanjut diedit setelah dikirim?**

A: Bisa. Buka detail surat — tab Tindak Lanjut — klik ikon pensil pada laporan. Hanya pembuat laporan yang bisa mengedit laporannya sendiri.

---

**Q: Kenapa upload ke Google Drive gagal?**

A: Pastikan tiga hal: 1) Akun Google sudah dihubungkan di Profil, 2) Link folder Google Drive E-Kinerja sudah diisi di Profil, 3) Izin akses Drive belum kedaluwarsa. Coba hubungkan ulang akun Google jika masalah berlanjut.

---

**Q: Apa yang terjadi kalau saya klik "Selesaikan & Tutup" pada laporan TL?**

A: Disposisi Anda akan ditandai selesai dan kartu disposisi hilang dari Ruang Kerja Anda. Jika semua penerima disposisi untuk surat tersebut sudah menutup disposisinya, status surat berubah otomatis menjadi "Selesai".

---

**Q: Bagaimana cara melihat siapa saja yang sudah menindaklanjuti surat?**

A: Buka Surat Masuk — klik surat — pilih tab **"Pemantauan"** (untuk pimpinan/admin) atau tab **"Tindak Lanjut"** untuk melihat semua laporan yang sudah masuk.

---

**Q: Apakah logbook saya bisa dilihat oleh atasan?**

A: Tidak secara langsung — logbook bersifat **pribadi**. Namun atasan tetap bisa memantau pekerjaan Anda melalui laporan tindak lanjut yang Anda kirim dari detail surat.

---

**Q: Bagaimana cara membuat rekap bulanan untuk laporan kinerja?**

A: Buka **Logbook** — klik **[Rekap Bulanan]** — pilih bulan — klik **[Generate Rekap]** — pilih **[Download PDF]** atau **[Upload ke Drive]**.

---

**Q: Bisa tidak mendisposisikan ke seseorang di luar instansi saya?**

A: Bisa, melalui fitur **Surat Lintas Instansi** (tersedia untuk paket Enterprise). Pastikan instansi tujuan sudah terdaftar dalam sistem.

---

**Q: Bagaimana jika saya lupa mengonfirmasi terima disposisi?**

A: Kartu disposisi akan tetap berwarna kuning/oranye di Ruang Kerja Anda sampai Anda klik **[Terima Disposisi]**. Pengirim disposisi juga bisa melihat bahwa Anda belum mengonfirmasi terima.

---

**Q: Apakah ada batas maksimal surat yang bisa diinput?**

A: Bergantung pada paket langganan instansi (Dasar/Profesional/Enterprise). Lihat detailnya di pengaturan instansi.

---

**Q: Bagaimana cara mencari surat lama yang sudah diarsipkan?**

A: Buka menu **Arsip** — gunakan kolom pencarian (ketik nomor surat atau perihal) — gunakan filter status jika perlu.

---

**Q: Apa itu PLT dan bagaimana cara mengaktifkannya?**

A: PLT (Pejabat Pelaksana Tugas) adalah fitur untuk mendelegasikan akses jabatan sementara. Admin instansi mengaturnya di menu **Admin — Jabatan — pilih jabatan — tambahkan PLT**.

---

# KAMUS ISTILAH

| Istilah | Artinya dalam Bahasa Sehari-hari |
| ---------------------- | ----------------------------------------------------------------------- |
| **Disposisi** | Pendelegasian instruksi dari atasan ke bawahan terkait surat masuk |
| **Acknowledge** | Konfirmasi terima disposisi — tanda bahwa Anda sudah membacanya |
| **Tindak Lanjut (TL)** | Laporan progres pekerjaan yang dikirim pelaksana kepada atasannya |
| **Eskalasi** | Pengembalian surat ke atasan karena pelaksana tidak bisa menangani |
| **Feed** | Daftar item yang muncul di Ruang Kerja |
| **Overdue** | Item yang sudah melewati batas waktu (deadline) |
| **Instansi** | Organisasi Perangkat Daerah (Dinas, Badan, Kantor, Kecamatan, dll) |
| **E-Kinerja** | Bukti elektronik kinerja ASN yang digunakan untuk penilaian SKP |
| **SKP** | Sasaran Kinerja Pegawai — dokumen penilaian kinerja resmi ASN |
| **Klasifikasi Surat** | Tingkat urgensi surat: Biasa / Penting / Segera / Rahasia |
| **PLT** | Pejabat Pelaksana Tugas — pengganti sementara pejabat yang berhalangan |
| **Draf Persetujuan** | Dokumen yang dikirim untuk di-review dan disetujui pimpinan |
| **Informasional** | Jenis disposisi yang hanya untuk diketahui, tidak perlu tindak lanjut |
| **Jejak Audit** | Riwayat lengkap semua aksi yang dilakukan pada sebuah surat |
| **Real-time** | Data yang langsung terbarui saat itu juga, tanpa perlu refresh |
| **Push Notification** | Pemberitahuan yang langsung muncul di perangkat/browser Anda |

---

# TIPS & TRIK PENGGUNAAN

Bagian ini berisi kumpulan tips praktis dari pengalaman penggunaan sehari-hari — hal-hal kecil yang sering tidak diketahui pengguna baru tapi bisa membuat pekerjaan jauh lebih efisien.

## Untuk Staf TU

**Manfaatkan AI Scan Surat Sepenuhnya**

Saat menginput surat, jangan langsung isi form manual. Upload file PDF-nya terlebih dahulu, lalu klik tombol **[Scan dengan AI]**. Sistem akan membaca isi surat dan mengisi otomatis: nomor surat, perihal, pengirim, tanggal, jenis surat, bahkan detail agenda jika itu undangan rapat. Anda tinggal memeriksa dan mengoreksi jika ada yang kurang tepat — tidak perlu mengetik dari nol.

> Fitur ini menggunakan Gemini AI dan hanya tersedia jika instansi Anda sudah mengaktifkan fitur AI Surat Reader. Tanyakan ke Admin OPD jika fitur ini belum muncul.

**Input Surat Undangan dengan Detail Agenda**

Jangan lewatkan pengisian detail agenda (tanggal kegiatan, jam, lokasi) saat menginput surat undangan. Jika diisi lengkap, surat itu akan otomatis muncul di Agenda Harian semua pejabat yang menerima disposisinya — tanpa mereka perlu mencatat sendiri.

**Gunakan Drag & Drop**

Di halaman upload surat, Anda bisa langsung drag file PDF dari folder komputer dan lepas di area upload — tidak perlu klik "Pilih File" terlebih dahulu.

---

## Untuk Pelaksana (Staf)

**Konfirmasi Terima Disposisi Sesegera Mungkin**

Begitu kartu disposisi muncul di Ruang Kerja Anda (berwarna kuning/oranye), segera klik **[Terima Disposisi]** meskipun Anda belum sempat mengerjakan tugasnya. Konfirmasi terima hanya berarti "saya sudah membaca" — bukan "saya sudah selesai". Ini penting karena atasan Anda bisa memantau siapa yang sudah terima dan siapa yang belum.

**Kirim Laporan Bertahap — Jangan Tunggu Selesai**

Anda tidak harus menunggu pekerjaan 100% selesai baru lapor. Gunakan tombol **[Kirim Laporan - Proses]** untuk mengirim update progres sementara — "sudah koordinasi dengan bagian X", "draft sudah dibuat, menunggu review". Ini menunjukkan bahwa Anda aktif bekerja dan membuat atasan tenang karena tahu perkembangannya.

**Manfaatkan Warna Label Laporan**

Gunakan warna merah jika ada kendala yang perlu diketahui atasan. Gunakan warna hijau jika pekerjaan berjalan sesuai rencana. Atasan yang memantau banyak laporan sekaligus bisa langsung melihat mana yang perlu perhatian dan mana yang aman — hanya dari kode warnanya.

**Tambahkan Kegiatan Manual di Logbook**

Sistem otomatis mencatat kegiatan dari disposisi dan tugas. Tapi kegiatan lain yang Anda lakukan — rapat informal, koordinasi via telepon, survei lapangan — perlu Anda tambahkan manual. Semakin lengkap logbook Anda, semakin kuat rekam jejak kinerja yang bisa Anda tunjukkan di akhir bulan.

---

## Untuk Pimpinan

**Gunakan Templat Instruksi untuk Efisiensi**

Jika Anda sering menggunakan instruksi yang sama saat mendisposisikan surat (contoh: "Mohon segera ditindaklanjuti dan dilaporkan hasilnya dalam 3 hari"), simpan di Bank Templat Instruksi. Saat mendisposisikan berikutnya, Anda tinggal pilih templat — tidak perlu mengetik ulang.

**Pantau via Tab Pemantauan, Bukan via Tanya**

Daripada menelepon atau mengirim pesan untuk menanyakan "sudah sejauh mana?", buka halaman Surat Masuk — klik surat yang ingin dipantau — pilih tab **Pemantauan**. Anda bisa melihat secara langsung siapa yang sudah terima, siapa yang sudah lapor, dan isi laporan terkininya. Hemat waktu, tidak perlu meeting koordinasi hanya untuk update status.

**Disposisikan ke Beberapa Orang Sekaligus**

Untuk surat yang perlu ditangani bersama beberapa bidang, centang lebih dari satu nama penerima dalam form disposisi. Semua mendapat notifikasi bersamaan dan bisa bekerja paralel — bukan berurutan.

---

# PERBANDINGAN: CARA LAMA vs CARA SISTEM INI

Tabel ini dirancang untuk membantu pengguna baru (dan calon pengguna) memahami secara konkret apa yang berubah ketika instansi beralih ke sistem digital ini.

## Alur Surat Masuk

| Tahapan | Cara Manual Sebelumnya | Dengan Sistem Ini |
|---------|----------------------|-------------------|
| Surat diterima | Dicatat di buku agenda manual | Diinput digital, tersimpan permanen |
| Pengisian metadata | Ketik satu per satu (nomor, perihal, pengirim) | AI membaca PDF → form terisi otomatis |
| Penyampaian ke Pimpinan | Bawa fisik atau taruh di tray meja | Muncul otomatis di Ruang Kerja, notifikasi ke HP |
| Disposisi | Tulisan tangan di lembar disposisi | Form digital dengan instruksi, deadline, penerima |
| Konfirmasi terima | Pimpinan tidak tahu apakah bawahan sudah baca | Notifikasi "sudah diterima" + timestamp tercatat |
| Laporan tindak lanjut | Laporan lisan, email, atau kertas terpisah | Laporan digital terhubung ke surat, terpantau real-time |
| Arsip surat | Dijilid/difotokopi, simpan di lemari | Tersimpan digital, dicari dalam detik kapan saja |

## Rekap Kinerja Bulanan

| Langkah | Cara Manual | Dengan Sistem Ini |
|---------|-------------|-------------------|
| Kumpulkan data kegiatan | Ingat-ingat atau cari di email/catatan | Logbook sudah terisi otomatis sepanjang bulan |
| Susun laporan | Ketik ulang semua kegiatan di Word/Excel | Klik Generate → rekap sudah tersusun rapi |
| Format dokumen | Atur margin, font, header secara manual | Template profesional sudah tersedia |
| Kirim ke Drive | Buka Drive, cari folder, upload manual | Klik Upload ke Drive → tersimpan di folder yang tepat otomatis |
| Waktu total | 2–4 jam per bulan | 5–10 menit per bulan |

---

# STUDI KASUS: SEHARI KERJA DENGAN SISTEM INI

Bagian ini menggambarkan bagaimana sistem ini digunakan dalam skenario kerja nyata sehari-hari — bukan penjelasan teknis, tapi cerita yang bisa Anda bayangkan terjadi di tempat kerja Anda.

## Pagi: Surat Undangan Rapat Koordinasi

Pukul 08.15, Staf TU menerima surat fisik undangan rapat koordinasi dari Sekretariat Daerah. Ia membuka halaman Upload Surat, menyeret file PDF ke area upload, lalu klik **[Scan dengan AI]**. Dalam 5 detik, form terisi lengkap: nomor surat, perihal, nama instansi pengirim, tanggal surat, dan — karena ini undangan — detail agenda (tanggal rapat, jam, lokasi) juga terdeteksi otomatis.

Staf TU memeriksa sebentar, mengoreksi satu kata yang kurang tepat, lalu klik **Simpan**.

Detik itu juga: Kepala Dinas menerima notifikasi di ponselnya — "Surat baru: Undangan Rapat Koordinasi APBD". Surat itu muncul di Ruang Kerjanya. Agenda rapat otomatis tercatat di Agenda Harian semua yang akan terlibat.

Pukul 08.30, Kepala Dinas membuka Ruang Kerja, baca sekilas isi surat via preview PDF, lalu mendisposisikan ke Kepala Bidang Anggaran dengan instruksi: *"Mohon disiapkan bahan presentasi pagu anggaran 2026. Laporan H-1 rapat."* Deadline diset hari Selasa.

Kepala Bidang Anggaran langsung mendapat notifikasi. Ia buka Ruang Kerja, klik **[Terima Disposisi]**. Kepala Dinas mendapat notifikasi balik: disposisi sudah diterima.

**Total waktu dari surat diterima hingga sampai ke pelaksana: kurang dari 20 menit. Tanpa kertas, tanpa tray meja, tanpa telepon.**

---

## Siang: Laporan Progres Sambil Lapangan

Pukul 14.00, Kepala Bidang Anggaran sedang di luar kantor menghadiri rapat teknis. Sambil menunggu rapat dimulai, ia membuka sistem di ponsel, masuk ke Ruang Kerja, dan klik **[Lapor Tindak Lanjut]** pada kartu disposisi surat tadi.

Ia ketik singkat: *"Draft bahan presentasi sudah 70%, koordinasi data realisasi dengan Subbag Keuangan selesai siang ini. Bahan final akan dikirim besok pagi."*

Pilih warna label **Hijau** (berjalan lancar), klik **[Kirim Laporan - Proses]**.

Detik itu juga, Kepala Dinas di kantornya mendapat notifikasi: "Ada laporan tindak lanjut baru dari Kabid Anggaran." Ia baca sekilas — puas, tidak perlu menelepon untuk tanya kabar.

Laporan itu juga otomatis tersimpan sebagai Bukti Kinerja Kepala Bidang hari ini.

---

## Akhir Bulan: Rekap Kinerja 5 Menit

Hari terakhir bulan, semua pegawai masing-masing buka menu Logbook, klik **[Rekap Bulanan]**, pilih bulan yang baru lewat, klik **[Generate Rekap]**.

Dalam hitungan detik, rekap bulanan tersusun otomatis: semua disposisi yang diterima, laporan yang dikirim, tugas yang diselesaikan — lengkap dengan tanggal dan keterangan.

Klik **[Upload ke Drive]** — file PDF tersimpan otomatis di folder Google Drive E-Kinerja masing-masing pegawai dengan nama folder yang sudah terformat rapi.

Selesai. Tidak ada yang perlu mengetik ulang, tidak ada yang perlu mencari-cari email lama, tidak ada yang kerja lembur untuk rekap kinerja bulanan.

---

# PANDUAN PERAN: APA YANG PERLU DILAKUKAN SETIAP HARI

## Staf TU — Rutinitas Harian

| Waktu | Aktivitas |
|-------|-----------|
| Pagi | Buka dashboard — cek apakah ada surat fisik yang belum diinput |
| Setelah surat diterima | Upload dan input segera (gunakan AI Scan untuk efisiensi) |
| Siang | Pastikan tidak ada surat berstatus "Baru" yang sudah lebih dari 1 hari tanpa disposisi |
| Jika diminta | Cetak agenda harian atau rekap surat untuk keperluan pimpinan |

## Pelaksana — Rutinitas Harian

| Waktu | Aktivitas |
|-------|-----------|
| Pagi | Buka Ruang Kerja — konfirmasi semua disposisi baru yang masuk |
| Sepanjang hari | Kerjakan tugas dari disposisi — kirim laporan progres jika ada perkembangan |
| Sore | Tambahkan kegiatan non-disposisi ke Logbook secara manual jika perlu |
| Jika selesai | Klik **[Selesaikan & Tutup]** pada disposisi yang sudah dituntaskan |

## Pimpinan — Rutinitas Harian

| Waktu | Aktivitas |
|-------|-----------|
| Pagi | Buka Ruang Kerja — disposisikan semua surat baru |
| Siang | Pantau laporan tindak lanjut via tab Pemantauan |
| Kapan saja | Setujui atau revisi draf dokumen yang menunggu persetujuan |
| Akhir minggu | Cek tab Laporan Kinerja — lihat statistik tim |

---

# KEAMANAN & PRIVASI PENGGUNA

## Apa yang Bisa Dilihat Siapa

| Data | Bisa Dilihat Oleh |
|------|--------------------|
| Logbook harian | Hanya pemiliknya sendiri |
| Laporan tindak lanjut | Pembuat laporan + atasan yang mendisposisikan + admin |
| Detail surat & disposisi | Semua pihak yang terlibat dalam rantai disposisi |
| Laporan kinerja instansi | Pimpinan (level ≤ 5) + Admin OPD |
| Data seluruh surat | Staf TU + Admin OPD |
| Profil pengguna lain | Tidak bisa dilihat (privasi) |

## Keamanan Akses

- Setiap pengguna login dengan akun pribadi — tidak ada akun bersama (*shared account*)
- Sesi login memiliki batas waktu; pengguna yang tidak aktif akan diminta login ulang
- Semua data terenkripsi dalam perjalanan (HTTPS) dan saat disimpan
- Admin OPD bisa menonaktifkan akun pegawai yang sudah tidak aktif/mutasi kapan saja

## Apa yang Terjadi Jika Saya Salah Input?

- **Surat:** Hubungi Admin OPD untuk mengedit atau menghapus surat yang salah diinput
- **Laporan TL:** Klik ikon pensil di laporan untuk mengedit (hanya pemilik laporan)
- **Logbook:** Klik ikon pensil di entri logbook untuk mengedit atau menghapus
- **Disposisi yang sudah terkirim:** Tidak bisa ditarik kembali — pastikan penerima dan instruksi sudah benar sebelum kirim

---

# ROADMAP PENGEMBANGAN

## Yang Sudah Berjalan Sepenuhnya

Sistem saat ini sudah mampu **menghasilkan 5 output dari 1 input surat** dan beroperasi penuh dengan fitur-fitur berikut:

**Administrasi Persuratan Digital:**
- Input surat masuk dengan AI Scan otomatis (Gemini 2.0 Flash — sudah aktif)
- Rantai Disposisi Digital dengan instruksi, deadline, dan notifikasi
- Pemantauan tindak lanjut secara real-time oleh pimpinan
- Arsip Digital yang dapat dicari kapan saja

**Kinerja & Produktivitas:**
- Logbook Harian otomatis per pegawai
- Rekap Bulanan → PDF atau Google Drive (1 klik)
- Bukti E-Kinerja otomatis dari setiap laporan & tugas
- Manajemen Tugas dengan sub-tugas, komentar, dan prioritas

**Kolaborasi & Jadwal:**
- Agenda Harian otomatis dari surat undangan
- Booking Ruang Rapat terintegrasi Agenda
- Notulensi Rapat dengan data otomatis terisi
- Persetujuan Draf Dokumen (Google Docs)

**Infrastruktur:**
- Notifikasi *push* real-time ke browser/HP (FCM)
- Integrasi Google Drive (upload bukti kinerja)
- Offline mode: surat tersimpan lokal jika koneksi terputus
- Fitur PLT untuk delegasi akses jabatan sementara

---

## Bagian 1 — Pengembangan Sistem Lanjutan

Fitur-fitur berikut memperdalam kecerdasan dan kemampuan sistem di tingkat per-instansi, dan dapat dinikmati tanpa perlu menunggu instansi lain bergabung.

---

### AI Pembaca Surat — Diperkaya (Versi Lanjutan)

Fitur AI Scan surat sudah aktif dan berfungsi membaca PDF surat masuk secara otomatis. Pengembangan lanjutannya mencakup:

- **Ringkasan Eksekutif:** AI menyusun 1–2 kalimat ringkasan isi surat yang bisa langsung dibaca pimpinan tanpa membuka file PDF
- **Saran Disposisi:** Berdasarkan isi surat, AI merekomendasikan jabatan yang paling tepat untuk menerima disposisi
- **Deteksi Urgensi:** AI menilai tingkat urgensi surat dan menyarankan klasifikasi (Biasa/Penting/Segera/Rahasia) secara otomatis
- **Multi-halaman:** Saat ini AI membaca halaman 1 — pengembangan selanjutnya memungkinkan analisis multi-halaman untuk surat panjang

*Dampak:* Staf TU cukup verifikasi hasil AI, bukan mengetik dari awal. Pimpinan bisa membaca ringkasan tanpa membuka lampiran.

---

### Asisten AI Penyusunan Laporan Tindak Lanjut

Pelaksana cukup mendeskripsikan secara singkat apa yang sudah dikerjakan — dalam poin-poin bebas, bahkan dalam kalimat tidak lengkap — lalu AI menyusunnya menjadi laporan tindak lanjut yang lengkap, profesional, dan terstruktur sesuai format standar pemerintahan.

*Dampak:* Hambatan terbesar dalam pelaporan bukan pekerjaannya, tapi "tidak tahu harus nulis apa." AI menghilangkan hambatan itu dan meningkatkan kualitas laporan yang diterima pimpinan.

---

### Asisten AI Penyusunan Surat Keluar & Nota Dinas

Dari konteks disposisi, instruksi pimpinan, dan laporan tindak lanjut, AI membantu menyusun draf surat keluar, surat balasan, atau nota dinas dengan format resmi pemerintahan — data sudah otomatis terisi dari konteks yang ada, tinggal direvisi dan disetujui pimpinan.

*Dampak:* Pekerjaan yang sebelumnya butuh 30–60 menit bisa selesai dalam 5 menit. Konsistensi format surat keluar terjaga di seluruh instansi.

---

### Sistem Pengingat & Eskalasi Otomatis Berbasis SLA

Setiap jenis surat bisa dikonfigurasi dengan *Service Level Agreement* (SLA): undangan harus direspons dalam 1 hari, surat permohonan dalam 3 hari, dan sebagainya.

Jika sebuah disposisi tidak ditindaklanjuti melebihi SLA, sistem otomatis mengirim pengingat bertahap: pengingat pertama ke pelaksana, pengingat kedua ke atasan langsung, dan eskalasi otomatis ke pimpinan lebih tinggi jika tetap tidak direspons.

*Dampak:* Tidak ada lagi surat yang "tenggelam." Budaya responsif tumbuh secara sistemik karena ada konsekuensi otomatis dari ketidakresponsifan.

---

### Analitik Prediktif & Rekomendasi Cerdas

Sistem belajar dari ribuan data historis untuk memberikan rekomendasi: "Surat dari instansi X rata-rata butuh 4 hari untuk selesai — deadline ini terlalu ketat", "Bidang Y sedang kelebihan beban tugas bulan ini", atau "Pola surat masuk setiap Senin pagi biasanya lebih tinggi 40% dari hari lain."

*Dampak:* Pimpinan mendapat wawasan berbasis data untuk pengambilan keputusan yang lebih tepat sasaran.

---

### Tanda Tangan Elektronik Resmi (TTE)

Integrasi dengan BSrE Kominfo atau PERURI untuk tanda tangan digital resmi pada semua dokumen yang dihasilkan sistem — surat keputusan, surat tugas, notulensi rapat, laporan — sehingga dokumen digital memiliki kekuatan hukum yang setara dengan tanda tangan basah.

*Dampak:* Dokumen tidak perlu dicetak-tanda tangan-scan lagi. Proses persetujuan yang biasanya berhari-hari bisa selesai dalam jam dari mana saja.

---

### Notifikasi WhatsApp & Telegram

Selain notifikasi push ke browser, sistem mengirim ringkasan harian atau notifikasi penting ke WhatsApp atau Telegram pengguna — untuk pengguna yang tidak selalu membuka browser sepanjang hari.

Format notifikasi: *"📬 [NAMA], Anda memiliki 3 disposisi baru hari ini. 2 di antaranya mendekati deadline. Buka sistem untuk merespons."*

*Dampak:* Tingkat respons terhadap disposisi meningkat secara signifikan karena notifikasi hadir di platform yang paling sering dibuka pengguna.

---

### Rekap Otomatis & Pengiriman Laporan Mingguan ke Pimpinan

Setiap Jumat sore, sistem otomatis menghasilkan dan mengirimkan ringkasan mingguan ke masing-masing pimpinan: berapa surat masuk minggu ini, berapa yang selesai, berapa yang masih dalam proses, dan mana yang sudah melewati deadline.

*Dampak:* Pimpinan mendapat gambaran kondisi timnya setiap akhir minggu tanpa perlu meminta laporan secara manual.

---

### Integrasi Ekspor ke Sistem SKP Nasional

Data logbook dan bukti kinerja dapat diekspor langsung dalam format yang kompatibel dengan aplikasi SKP ASN nasional — menghilangkan proses input ulang yang melelahkan di akhir periode penilaian.

*Dampak:* SKP yang akurat, tidak bisa dimanipulasi, dan tidak memakan waktu pegawai di akhir tahun.

---

### Portal Layanan Publik Online (G2C)

Masyarakat mengajukan permohonan layanan publik secara online — izin, surat keterangan, pengaduan — yang otomatis masuk sebagai surat masuk di sistem instansi, bisa dilacak statusnya secara real-time oleh pemohon sendiri.

*Dampak:* Antrean fisik berkurang. Masyarakat tahu persis di mana suratnya diproses dan siapa yang menangani.

---

### Koneksi dengan Ekosistem Pemerintahan Nasional

Integrasi API dengan sistem-sistem yang sudah ada:

- **SIASN** — sinkronisasi data jabatan dan golongan ASN secara otomatis
- **SIPD** — korelasi surat masuk dengan program dan kegiatan anggaran
- **e-Monev** — surat tindak lanjut otomatis terhubung ke laporan monitoring
- **JDIH** — referensi peraturan perundangan langsung dari detail surat
- **Satu Data Indonesia** — kontribusi data kinerja pemerintah daerah ke platform nasional

*Dampak:* Input satu kali, bermanfaat di banyak sistem sekaligus. Tidak ada data yang dikerjakan dua kali.

---

---

# OPTIMALISASI SISTEM — KETIKA SELURUH PERANGKAT DAERAH BERGABUNG

> Sistem ini dirancang dengan satu visi besar: **menjadi tulang punggung digital seluruh tata kelola pemerintahan daerah** — dari meja Bupati/Walikota, Sekretaris Daerah, para Kepala Dinas, hingga staf administrasi di kecamatan terpencil sekalipun.
>
> Fitur-fitur di bagian ini membutuhkan satu syarat: **seluruh Organisasi Perangkat Daerah (OPD) dalam satu wilayah telah menggunakan sistem ini**. Ketika syarat itu terpenuhi, inilah yang bisa terjadi — sesuatu yang belum pernah ada sebelumnya dalam tata kelola pemerintahan daerah kita.

Bayangkan sebuah hari kerja di mana Bupati atau Walikota membuka satu layar dan dalam hitungan detik tahu: berapa surat masuk di seluruh kota hari ini, siapa yang belum merespons, program mana yang tersendat, dan OPD mana yang kinerjanya menonjol. Bukan dari laporan yang sudah disiapkan dan dirapikan staf — tapi dari data nyata yang mengalir langsung dari setiap meja kerja di seluruh perangkat daerah.

Itulah yang mungkin terjadi ketika sistem ini digunakan secara penuh oleh semua pihak.

---

## Fitur-Fitur yang Aktif Ketika Semua OPD Terhubung

### Daftar Hadir Rapat Digital Lintas Instansi

Selama ini, rapat lintas instansi selalu membutuhkan daftar hadir kertas — diedarkan, ditandatangani, dikumpulkan, diarsipkan manual. Tidak akurat, mudah dimanipulasi (titip tanda tangan), dan hasilnya tidak terhubung ke data kinerja siapapun.

Ketika seluruh OPD menggunakan sistem ini, setiap undangan rapat menghasilkan **QR Code Kehadiran** unik. Peserta dari instansi manapun scan QR dengan ponsel saat tiba — absensi tercatat otomatis, terhubung ke profil mereka, dan masuk ke rekam jejak kinerja. Penyelenggara mendapat laporan kehadiran lengkap dalam satu halaman, real-time, tanpa kertas.

*Ketika ini terjadi:* Tidak ada lagi titip absen. Data kehadiran rapat seluruh perangkat daerah menjadi bagian permanen dari catatan kinerja ASN yang tidak bisa dimanipulasi.

---

### Surat Lintas OPD yang Benar-Benar Terlacak

Surat dari Sekretaris Daerah ke seluruh Kepala Dinas selama ini melewati proses cetak-kirim fisik atau email yang tidak terlacak. "Sudah ditindaklanjuti belum?" — pertanyaan yang tidak terjawab kecuali ditelepon satu per satu.

Ketika semua OPD terhubung, surat dari Sekda ke seluruh instansi dikirim dalam satu klik. Surat masuk ke Ruang Kerja Kepala Dinas masing-masing, notifikasi ke ponsel mereka. Tindak lanjutnya bisa dipantau langsung dari meja Sekda — tanpa rapat koordinasi hanya untuk tanya "sudah sampai mana?".

*Ketika ini terjadi:* Koordinasi yang biasanya memakan berhari-hari bisa diselesaikan dalam jam. Tidak ada celah bagi surat penting untuk diabaikan.

---

### Dashboard Eksekutif Kepala Daerah — Kondisi Kota di Ujung Jari

Bupati atau Walikota punya **Dashboard Eksekutif** yang menampilkan kondisi nyata seluruh kota/kabupaten secara real-time:

- Berapa surat masuk hari ini di seluruh OPD, berapa yang belum direspons
- OPD mana yang paling responsif dan mana yang paling lambat
- Program kerja mana yang berjalan lancar, mana yang macet
- Perbandingan kinerja antar OPD dalam periode tertentu
- Siapa pegawai dengan konsistensi kinerja tertinggi bulan ini — berdasarkan data

Ini bukan laporan yang sudah dirapikan. Ini **data hidup** dari ribuan meja kerja di seluruh instansi, teragregasi menjadi satu pandangan yang bisa dibaca dalam 60 detik.

*Ketika ini terjadi:* Kepala Daerah tidak lagi bergantung pada laporan yang sudah "dimasak." Keputusan diambil berdasarkan fakta, bukan persepsi.

---

### Indeks Kinerja ASN — Objektif, Transparan, Adil untuk Semua

Ketika semua ASN di seluruh OPD menggunakan sistem yang sama, setiap aktivitas kerja mereka tercatat dalam satu sistem yang tidak bisa dimanipulasi. Dari data ini, sistem membangun **Indeks Kinerja ASN** yang objektif:

- Rata-rata waktu respons terhadap disposisi
- Persentase tugas selesai tepat waktu
- Frekuensi dan kualitas laporan tindak lanjut
- Konsistensi pengisian logbook
- Tingkat kehadiran dalam rapat lintas instansi

*Ketika ini terjadi:* Penilaian kinerja tidak lagi subjektif. ASN yang benar-benar rajin mendapat pengakuan yang adil. Budaya kerja bertanggung jawab tumbuh secara organik — bukan karena dipaksa, tapi karena sistemnya mendorong ke arah sana.

---

### Deteksi Masalah Lintas OPD secara Otomatis

AI menganalisis pola dari ribuan surat dan laporan seluruh OPD untuk mendeteksi masalah yang tidak terlihat di permukaan: *"47 surat terkait banjir masuk ke 8 instansi berbeda dalam 3 bulan terakhir, namun tidak ada satu pun koordinasi lintas OPD yang terbentuk untuk menanganinya."*

Temuan ini disajikan sebagai rekomendasi kebijakan ke Sekda atau Kepala Daerah — lengkap dengan ringkasan, instansi terlibat, dan usulan koordinasi yang perlu diambil.

*Ketika ini terjadi:* Sistem tidak lagi hanya mencatat administrasi. Ia menjadi **mitra kebijakan** yang membantu pimpinan daerah melihat masalah sebelum membesar.

---

### Benchmark Kinerja Antar Kota/Kabupaten

Ketika lebih dari satu kota/kabupaten menggunakan sistem ini, data agregat (yang sudah dianonimkan) memungkinkan perbandingan kinerja administrasi antar daerah — rata-rata waktu respons surat, tingkat penyelesaian disposisi, volume aktivitas per pegawai.

Ini memungkinkan pembelajaran antar daerah: daerah yang kinerjanya lebih baik bisa berbagi praktik terbaik, dan daerah yang tertinggal bisa mendapat intervensi yang lebih tepat sasaran dari pemerintah pusat.

*Ketika ini terjadi:* Kompetisi sehat antar daerah dalam hal kinerja administrasi menjadi nyata dan terukur — bukan sekadar slogan.

---

### Satu Ekosistem, Nol Celah Administrasi

Ketika setiap surat, setiap disposisi, setiap laporan, setiap rapat, dan setiap keputusan di seluruh Pemerintah Daerah tercatat dalam satu sistem yang sama — sesuatu yang luar biasa terjadi:

**Tidak ada lagi celah administrasi.**

Tidak ada surat yang jatuh di antara meja. Tidak ada program yang macet karena koordinasi gagal. Tidak ada laporan yang tidak bisa dipertanggungjawabkan. Tidak ada "saya tidak tahu" dari pejabat yang seharusnya tahu.

Yang ada adalah **tata kelola pemerintahan daerah yang benar-benar modern** — di mana data mengalir transparan dari bawah ke atas dan dari atas ke bawah, keputusan diambil berdasarkan fakta, dan setiap pegawai dari staf paling baru hingga Kepala Daerah bekerja dalam satu ekosistem yang saling terhubung, saling memantau, dan saling mendukung.

Ini bukan utopia. Ini adalah langkah selanjutnya yang sudah bisa dimulai hari ini — satu instansi dalam satu waktu, bergerak bersama menuju pemerintahan daerah yang lebih baik untuk semua.

---

*Panduan ini disusun dari audit menyeluruh terhadap seluruh fitur dan alur bisnis sistem — mencakup 29 custom hooks, 30+ halaman, dan keseluruhan logika kerja sistem per Agustus 2026.*

