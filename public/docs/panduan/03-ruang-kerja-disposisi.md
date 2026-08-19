# Panduan 03 — Ruang Kerja & Alur Disposisi

> Menu: **Ruang Kerja** | Path: `/dashboard/poros/ruang-kerja`

---

## Apa Itu Ruang Kerja?

Ruang Kerja adalah **jantung operasional** RUANG SIGAP. Ini adalah halaman di mana semua pekerjaan Anda dikumpulkan dalam satu "inbox" terpadu. Di Ruang Kerja, Anda bisa melihat dan mengelola:

- Surat baru yang menunggu disposisi (Pimpinan/Admin)
- Disposisi yang masuk dari atasan (Pelaksana)
- Tugas yang diberikan kepada Anda
- Draf dokumen yang menunggu persetujuan Anda
- Agenda 7 hari ke depan (panel samping)

---

## Tampilan Ruang Kerja

```
+--------------------------------------------------+------------------+
|  QUICK ADD TASK                                  |  QUICK LINKS     |
|  [Ketik tugas cepat...] [+ Tambah]               |  [Link Favorit]  |
|--------------------------------------------------|                  |
|  FILTER TAB                                       |  STICKY NOTE     |
|  [Semua(5)] [Surat(2)] [Tugas(2)] [Draf(1)]      |  [Catatan tempel]|
|                                                  |                  |
|  FEED UTAMA (VISIONARY FEED)                     |  AGENDA 7 HARI   |
|  +-------------------------------------------+  |  [Kalender]      |
|  | SURAT BARU: "Undangan Rapat Koordinasi"   |  |                  |
|  | Dari: Staf TU | Segera                    |  |  Sel, 19 Agt     |
|  | [Disposisikan] [Tindaklanjuti Sendiri]    |  |  09:00 Rapat...  |
|  +-------------------------------------------+  |                  |
|  +-------------------------------------------+  |  Rab, 20 Agt     |
|  | DISPOSISI: "Permohonan Bantuan Dana"      |  |  13:00 Seminar.. |
|  | Dari: Kepala Bidang | Deadline: 2 hari    |  |                  |
|  | [Terima] [Disposisi Lanjut] [Lapor]       |  +------------------+
|  +-------------------------------------------+  
|  +-------------------------------------------+
|  | TUGAS: "Buat Rekapitulasi Q3"             |
|  | Dari: Kasubag | Prioritas Tinggi          |
|  | [Mulai] [Selesai] [Komentar]              |
|  +-------------------------------------------+
|  [Muat Lebih Banyak]                            
+--------------------------------------------------+
```

---

## Jenis Item di Feed Ruang Kerja

### 1. SURAT BARU (Untuk Pimpinan & Admin)

Kartu surat berwarna **biru** yang menandakan surat masuk belum terdisposisi.

**Aksi yang tersedia:**
- **Disposisikan** — Buka form disposisi untuk mendelegasikan ke bawahan
- **Tindaklanjuti Sendiri** — Pimpinan menangani surat ini secara mandiri (surat langsung berstatus Selesai)

---

### 2. DISPOSISI MASUK (Untuk Pelaksana)

Kartu surat berwarna berbeda tergantung statusnya:
- **Kuning/Orange:** Disposisi baru, perlu di-acknowledge
- **Merah/Berkedip:** Disposisi overdue (melewati batas waktu)
- **Normal:** Disposisi sudah diterima, menunggu laporan

**Aksi yang tersedia berdasarkan status:**

| Status Disposisi | Aksi yang Tersedia |
|-----------------|-------------------|
| Belum Diterima | **[Terima Disposisi]** |
| Sudah Diterima | **[Lapor Tindak Lanjut]**, **[Disposisi Lanjut]**, **[Eskalasi ke Atasan]** |

---

### 3. TUGAS (Tasks)

Kartu tugas yang diberikan atasan di luar alur surat disposisi.

**Aksi yang tersedia:**
- **Mulai** — Ubah status tugas ke "Dikerjakan"
- **Selesai** — Tandai tugas selesai (otomatis masuk Logbook)
- **Komentar** — Tambahkan catatan/update progress

---

### 4. DRAF PERSETUJUAN (Untuk Pimpinan)

Kartu dokumen (Google Doc) yang dikirim bawahan untuk disetujui.

**Aksi yang tersedia:**
- **Setujui** — Dokumen dilanjutkan ke proses berikutnya
- **Revisi** — Kembalikan ke pengirim dengan catatan

---

## Alur Disposisi Lengkap

### FASE 1: Menerima Disposisi

Ketika Anda mendapat disposisi dari atasan:

1. Kartu disposisi muncul di feed Ruang Kerja Anda
2. Klik **"Terima Disposisi"** untuk mengakui bahwa Anda sudah membaca
3. Status berubah dari "Kuning (Belum Terima)" ke "Normal (Sudah Terima)"
4. Atasan yang mengirim disposisi mendapat notifikasi bahwa disposisi sudah diterima

> **Penting:** Menekan "Terima" bukan berarti pekerjaan selesai. Ini hanya tanda bahwa Anda sudah membaca dan mengakui disposisi tersebut.

---

### FASE 2: Pilihan Tindakan

Setelah menerima disposisi, Anda memiliki 3 pilihan:

#### A. Lapor Tindak Lanjut (Kerjakan Sendiri)

Gunakan ini ketika Anda yang mengerjakan pekerjaan dari disposisi tersebut.

**Langkah:**
1. Klik **"Lapor Tindak Lanjut"** atau **"Lapor Progres"**
2. Form laporan akan muncul (inline di kartu atau modal)
3. Isi:
   - **Judul Laporan** (opsional tapi sangat disarankan)
   - **Isi Laporan** — Deskripsi apa yang sudah dikerjakan
   - **Warna Label** — Kode warna prioritas (default/merah/hijau/biru/kuning/ungu)
   - **Checklist** — Daftar item yang sudah diselesaikan (opsional)
   - **Upload Lampiran** — Bukti dokumen via Google Drive (opsional)
4. Pilih mode pengiriman:
   - **"Kirim Laporan (Proses)"** — Laporan dikirim, disposisi tetap terbuka (masih bisa lapor lagi)
   - **"Selesaikan & Tutup"** — Laporan dikirim dan disposisi ditandai selesai

> **Otomasi Setelah Lapor:**
> - Notifikasi dikirim ke atasan yang mendisposisikan
> - Entri otomatis dibuat di Logbook Anda
> - Jika status "Selesai", Bukti Kinerja otomatis terbuat

#### B. Disposisi Lanjutan (Teruskan ke Bawahan)

Gunakan ini ketika Anda perlu mendelegasikan pekerjaan ke bawahan Anda.

**Langkah:**
1. Klik **"Disposisi Lanjut"**
2. Modal atau inline form disposisi terbuka
3. Pilih **penerima disposisi** (satu atau beberapa bawahan)
4. Ketik **instruksi** (atau pilih dari templat instruksi yang sudah tersimpan)
5. Set **batas waktu** (deadline) opsional
6. Pilih apakah ini disposisi biasa atau **pemberitahuan informasional saja**
7. Klik **"Kirim Disposisi"**

> **Otomasi Setelah Kirim Disposisi:**
> - Notifikasi dikirim ke semua penerima
> - Entri otomatis dibuat di Logbook Anda: "Mendisposisikan surat: [Perihal]"
> - Status surat berubah menjadi "Didisposisikan"

#### C. Eskalasi ke Atasan (Kembalikan ke Pimpinan)

Gunakan ini ketika Anda tidak dapat menangani pekerjaan ini dan perlu mengembalikannya ke atasan.

**Langkah:**
1. Klik **"Eskalasi ke Atasan"**
2. Pilih jabatan atasan tujuan
3. Tulis catatan alasan eskalasi
4. Klik **"Kirim Eskalasi"**

---

## Form Disposisi Detail

Ketika membuka form disposisi, Anda akan melihat:

### Pilihan Penerima Disposisi

```
[ Cari nama / jabatan... ]

Daftar Bawahan:
  [ ] Kepala Seksi A (Budi Santoso)
  [x] Staff Pelaksana (Siti Rahayu)    <- Dipilih
  [ ] Staff Senior (Ahmad Fauzi)
  
[+ Tambah Semua]  [Hanya Saya]
```

### Instruksi Disposisi

Anda dapat:
1. Mengetik instruksi secara bebas
2. Memilih dari **Templat Instruksi** yang sudah tersimpan (klik ikon buku)
3. Menggunakan instruksi otomatis dari AI Copilot

### Opsi Tambahan

- **Batas Waktu:** Set deadline untuk penyelesaian
- **Jenis Disposisi:** Normal (perlu tindak lanjut) atau Informasional (hanya untuk diketahui)
- **Tembusan:** Pihak lain yang perlu mengetahui (CC)

---

## Filter Feed

Di bagian atas feed terdapat tab filter:

| Tab | Isi |
|-----|-----|
| **Semua (n)** | Semua item aktif di Ruang Kerja |
| **Surat/Disposisi (n)** | Hanya surat baru dan disposisi masuk |
| **Tugas (n)** | Hanya daftar tugas |
| **Draf (n)** | Hanya draf yang menunggu persetujuan (Pimpinan) |
| **Agenda & Catatan** | Khusus mobile: tampilkan panel agenda |

---

## Fitur Pendukung di Ruang Kerja

### Quick Add Task

Di bagian atas feed terdapat field untuk **menambahkan tugas cepat** tanpa harus masuk ke menu Tugas.

1. Ketik deskripsi tugas
2. Klik "+" atau tekan Enter
3. Tugas langsung muncul di feed dan tercatat di sistem

### Sticky Note

Panel kanan menyediakan **catatan tempel digital** (Sticky Note) yang bisa Anda gunakan untuk mencatat hal-hal penting yang perlu diingat. Catatan ini hanya terlihat oleh Anda.

### Quick Links Widget

Menyimpan dan menampilkan link-link penting (Google Drive, Aplikasi lain, dsb) yang sering Anda akses.

### Agenda 7 Hari

Panel kanan bawah menampilkan jadwal kegiatan 7 hari ke depan (undangan surat + jadwal internal).

---

## Mekanisme Keamanan Anti-Ghosting

RUANG SIGAP menggunakan teknologi **Optimistic UI** untuk mencegah masalah "ghosting" (item yang tidak hilang dari feed setelah diproses). Ketika Anda melakukan aksi (disposisi, laporan, selesaikan), item langsung hilang dari tampilan meskipun proses server masih berjalan, memberikan pengalaman yang responsif.

Jika karena alasan teknis item kembali muncul, cukup klik **"Refresh Feed"** (ikon refresh di sudut atas).

---

## Urutan Prioritas Feed

Item di Ruang Kerja diurutkan berdasarkan:

1. **Overdue (Terlambat)** — Item yang melewati deadline selalu tampil di atas
2. **Terbaru** — Surat/disposisi yang paling baru masuk

---

*Dokumen selanjutnya: [Panduan 04 — Logbook Harian](./04-logbook.md)*
