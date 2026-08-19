# RUANG SIGAP — BLUEPRINT PENGETAHUAN SISTEM
## Dokumen Referensi Komprehensif untuk Pemahaman Mendalam

> **Tujuan Dokumen Ini:**
> Dokumen ini adalah **sumber pengetahuan tunggal (single knowledge source)** yang merangkum seluruh aspek sistem RUANG SIGAP — mulai dari filosofi, alur kerja, cara penggunaan tiap menu, logika bisnis, hingga potensi pengembangan. Dokumen ini dirancang agar siapapun yang membacanya dapat memahami sistem secara menyeluruh dan mendalam hanya dari satu sumber.

---

# BAGIAN 1 — IDENTITAS & FILOSOFI SISTEM

## 1.1 Apa Itu RUANG SIGAP?

**RUANG SIGAP** (Sistem Informasi Governansi & Administrasi Persuratan) adalah platform manajemen persuratan digital yang dirancang khusus untuk **Perangkat Daerah (OPD/SKPD)** di lingkungan Pemerintah Daerah Indonesia.

Sistem ini bukan sekadar aplikasi input-output surat biasa. RUANG SIGAP adalah **ekosistem administrasi digital terintegrasi** yang menghubungkan seluruh rantai birokrasi persuratan — dari Staf TU yang menginput surat, Pimpinan yang mendisposisikan, Pelaksana yang menindaklanjuti, hingga dokumen arsip yang tersimpan secara permanen.

## 1.2 Prinsip Utama: 1 Input → 5 Output Presisi

Ini adalah filosofi inti yang paling penting untuk dipahami:

**DARI SATU KALI INPUT SURAT MASUK, SISTEM MENGHASILKAN 5 OUTPUT SECARA OTOMATIS:**

```
INPUT TUNGGAL: Staf TU menginput surat masuk (1 kali kerja)
                              |
              ┌───────────────┴───────────────┐
              |         RUANG SIGAP           |
              └───────────────┬───────────────┘
                              |
         ┌─────────┬──────────┼──────────┬─────────┐
         ↓         ↓          ↓          ↓         ↓
    OUTPUT 1   OUTPUT 2   OUTPUT 3   OUTPUT 4  OUTPUT 5
    AGENDA     DISPOSISI  LAPORAN    E-KINERJA  ARSIP
    HARIAN     (rantai)   TINDAK     (Google    DIGITAL
    (otomatis) (notif)    LANJUT     Drive)     (searchable)
```

**Penjelasan tiap output:**

- **Output 1 — Agenda Harian:** Surat jenis "Undangan" yang diinput dengan detail tanggal/jam/lokasi otomatis menjadi item di halaman Agenda Harian yang dapat dilihat oleh seluruh penerima disposisi.

- **Output 2 — Disposisi:** Pimpinan dapat langsung mendelegasikan surat ke bawahan melalui sistem dengan instruksi, deadline, dan notifikasi otomatis. Setiap disposisi tercatat dengan jejak audit lengkap (siapa, kapan, apa instruksinya).

- **Output 3 — Laporan Tindak Lanjut:** Setiap laporan kemajuan yang dikirim pelaksana tersimpan secara otomatis, dapat dilihat pimpinan secara real-time, dan menjadi dokumen pertanggungjawaban.

- **Output 4 — Laporan E-Kinerja:** Setiap aktivitas disposisi, penerimaan, dan penyelesaian tindak lanjut secara otomatis tercatat di Logbook Harian dan dapat dikonversi menjadi Bukti E-Kinerja yang bisa diunggah langsung ke Google Drive folder resmi ASN.

- **Output 5 — Arsip Digital:** Surat yang telah selesai diproses tersimpan permanen dalam arsip digital yang dapat dicari berdasarkan nomor surat, perihal, pengirim, atau status — kapan saja, dalam hitungan detik.

## 1.3 Masalah yang Dipecahkan RUANG SIGAP

| Masalah Lama (Manual) | Solusi RUANG SIGAP |
|-----------------------|--------------------|
| Surat menumpuk di meja dan terlupakan | Ruang Kerja digital dengan notifikasi real-time |
| Disposisi hanya via lisan atau lembar kertas | Disposisi digital dengan instruksi, deadline, dan riwayat |
| Tidak bisa tahu apakah bawahan sudah menindaklanjuti | Tab Pemantauan real-time per surat |
| Laporan kinerja harus diketik ulang setiap bulan | Logbook otomatis + rekap 1 klik |
| Surat fisik hilang atau sulit dicari | Arsip digital dengan pencarian canggih |
| Tidak ada bukti bahwa ASN sudah bekerja | Logbook + Bukti Kinerja otomatis ter-generate |
| Agenda rapat terlewat karena tidak tercatat | Agenda Harian otomatis dari surat undangan |

---

# BAGIAN 2 — PENGGUNA & HAK AKSES

## 2.1 Jenis Pengguna (User Roles)

Sistem RUANG SIGAP mengenal 5 jenis pengguna dengan hak akses yang berbeda:

### Staf TU (staf_tu)
**Fungsi Utama:** Pintu masuk semua surat ke dalam sistem
- Berhak menginput surat masuk baru ke dalam sistem
- Dapat melihat seluruh surat OPD
- Dapat mencetak agenda
- Tidak dapat mendisposisikan ke bawahan pimpinan
- Memiliki akses ke manajemen arsip

### Admin OPD (admin_opd)
**Fungsi Utama:** Pengelola teknis sistem di level OPD
- Berhak menambah/menonaktifkan pengguna di OPD-nya
- Dapat melihat seluruh surat dan disposisi OPD (Mode Read-Only — tidak dapat membuat disposisi atau laporan TL)
- Dapat mengatur struktur jabatan
- Dapat memonitor aktivitas seluruh pegawai OPD

### Pimpinan (Level ≤ 5 dalam struktur jabatan)
**Fungsi Utama:** Pengambil keputusan dan pendisposisi surat
- Menerima surat baru yang masuk (muncul di Ruang Kerja)
- Mendisposisikan surat ke bawahan
- Melihat laporan tindak lanjut dari bawahan secara real-time
- Dapat menyelesaikan surat secara mandiri (Self-Action)
- Dapat mengarsipkan surat yang sudah selesai
- Melihat laporan kinerja tim/OPD

### Staf Pelaksana (Level > 5)
**Fungsi Utama:** Penerima disposisi dan pelapor tindak lanjut
- Menerima disposisi dari atasan (muncul di Ruang Kerja)
- Wajib meng-acknowledge (konfirmasi terima) setiap disposisi
- Melaporkan progres tindak lanjut pekerjaan
- Dapat meneruskan disposisi ke bawahan (jika punya bawahan)
- Dapat mengeskalasikan surat kembali ke atasan

### Super Admin (super_admin)
**Fungsi Utama:** Pengelola seluruh sistem multi-OPD
- Dapat mengelola semua OPD
- Dapat melihat laporan konsolidasi antar OPD
- Mengelola paket langganan dan fitur
- Memiliki akses impersonation (masuk sebagai pengguna lain untuk troubleshoot)

## 2.2 Sistem Jabatan (Level Hierarki)

RUANG SIGAP menggunakan sistem level jabatan untuk menentukan hierarki disposisi:
- **Level 1-3:** Pimpinan tinggi (Kepala OPD, Sekretaris)
- **Level 4-5:** Pimpinan menengah (Kepala Bidang, Kepala Sub-Bagian)
- **Level 6+:** Staf Pelaksana

Surat masuk baru (yang belum ada tujuan jabatan spesifik) akan muncul di Ruang Kerja pimpinan teratas OPD (level terendah angkanya = posisi tertinggi).

## 2.3 Fitur PLT (Pejabat Pelaksana Tugas)

Jika seorang pejabat berhalangan, sistem mendukung mekanisme PLT:
- Admin dapat menunjuk PLT untuk jabatan tertentu
- PLT dapat "acting" sebagai pemegang jabatan tersebut
- Semua disposisi dan surat yang datang ke jabatan itu akan terlihat oleh PLT
- Toggle switching mudah antara jabatan asli dan jabatan PLT

---

# BAGIAN 3 — MENU-MENU UTAMA

## 3.1 Dashboard / Beranda
**Path:** `/dashboard/poros`

Dashboard adalah halaman pertama setelah login. Fungsinya sebagai pusat kendali yang merangkum:

**Smart Greeting:** Sapaan personal berbasis waktu (Selamat Pagi/Siang/Sore/Malam + nama pengguna)

**Widget KPI (4 kartu angka):**
- Disposisi Baru — surat yang perlu direspons
- Tindak Lanjut Menunggu — disposisi yang belum dilaporkan
- Tugas Aktif — tugas sedang berjalan
- Tugas Lewat Deadline — tugas terlambat

**Quick Access Cards:** 4 kartu akses cepat ke Ruang Kerja, Logbook, Surat Masuk, Arsip

**Agenda Harian:**
- Mobile: Carousel horizontal
- Desktop: Tabel/grid

**Mini Kalender:** Penanda hari yang memiliki kegiatan

**Widget Kinerja Personal:** Ringkasan pencapaian individual

## 3.2 Kotak Masuk / Surat Masuk
**Path:** `/dashboard/poros/surat`

Ini adalah pusat manajemen seluruh surat masuk OPD.

**Tampilan Split-View:**
- Panel Kiri: Daftar surat dengan filter dan pencarian
- Panel Kanan: Preview surat yang diklik (PDF viewer + detail + tindak lanjut)

**Tab Filter Status:**
- Semua — seluruh surat aktif (kecuali Diarsipkan)
- Baru — surat yang belum ada disposisi
- Proses Tindak Lanjut — sedang dikerjakan
- Selesai — sudah selesai diproses
- Pemantauan — khusus monitoring disposisi (Pimpinan/Admin)

**Status Surat dan Maknanya:**
- BARU (kuning) — surat baru masuk, belum ada disposisi
- DIDISPOSISIKAN (biru) — pimpinan sudah kirim disposisi, pelaksana belum konfirmasi
- PROSES TINDAK LANJUT (oranye) — pelaksana sudah terima dan sedang mengerjakan
- SELESAI (hijau) — semua pihak sudah menyelesaikan
- DIARSIPKAN (abu-abu) — telah diarsipkan, tidak muncul di daftar aktif
- REVISI DISPOSISI (merah muda) — disposisi dikembalikan, perlu direvisi

**Cara Input Surat Baru:**
1. Klik tombol "+ Input Surat"
2. Isi: Nomor Surat, Perihal, Pengirim, Tanggal Surat, Tanggal Diterima, Klasifikasi, Jenis Surat
3. Jika Undangan: isi detail agenda (tanggal kegiatan, jam, lokasi)
4. Upload file surat (PDF/JPG/PNG)
5. Klik Simpan → Surat langsung muncul di Ruang Kerja pimpinan

**Klasifikasi Surat:**
- Biasa — surat rutin
- Penting — perlu perhatian khusus
- Segera — harus ditindaklanjuti cepat
- Rahasia — dokumen sensitif, akses terbatas

**Jenis Surat:**
- Undangan — akan menghasilkan Agenda Harian otomatis
- Pemberitahuan — informasi tanpa tindak lanjut khusus
- Permohonan — ada permintaan yang perlu direspons
- Lainnya — jenis surat yang tidak masuk kategori di atas

## 3.3 Ruang Kerja (MENU TERPENTING)
**Path:** `/dashboard/poros/ruang-kerja`

Ruang Kerja adalah "inbox" terpadu semua pekerjaan. Ini adalah jantung operasional sistem.

**4 Jenis Item di Feed:**

**A. SURAT BARU** (khusus Pimpinan & Admin TU):
- Surat masuk yang belum ada disposisinya
- Tampil di feed Pimpinan atau Admin TU
- Aksi tersedia: [Disposisikan] atau [Tindaklanjuti Sendiri]
- Tindaklanjuti Sendiri = pimpinan menangani langsung, surat langsung Selesai

**B. SURAT DISPOSISI** (untuk Pelaksana):
- Disposisi yang masuk dari atasan
- Warna kartu: Kuning/Orange = belum diterima, Merah = overdue
- Aksi jika BELUM DITERIMA: hanya [Terima Disposisi]
- Aksi jika SUDAH DITERIMA: [Lapor Tindak Lanjut] + [Disposisi Lanjut] + [Eskalasi]

**C. TUGAS**:
- Tugas yang diberikan atasan di luar alur surat
- Aksi: [Mulai] → [Selesai], [Komentar]
- Menyelesaikan tugas otomatis membuat entri Logbook

**D. DRAF PERSETUJUAN** (khusus Pimpinan):
- Dokumen (Google Docs) dari bawahan yang menunggu persetujuan
- Aksi: [Setujui] atau [Revisi + catatan]

**Filter Tabs:**
- Semua (n) — semua item aktif
- Surat/Disposisi (n) — hanya surat dan disposisi
- Tugas (n) — hanya tugas
- Draf (n) — hanya draf persetujuan
- Agenda & Catatan — khusus mobile

**Urutan Prioritas Feed:**
1. Item Overdue (melewati deadline) — selalu di atas
2. Item terbaru — urutan dari yang paling baru

**Panel Samping Kanan (Desktop):**
- Quick Links Widget — link favorit pengguna
- Sticky Note — catatan tempel digital pribadi
- Agenda 7 Hari — jadwal kegiatan mendatang

**Widget Tambahan di Bagian Atas:**
- Quick Add Task — tambah tugas langsung tanpa masuk menu Tugas
- KPI Widget — statistik cepat hari ini

**Mekanisme Anti-Ghosting:**
Sistem menggunakan Optimistic UI — ketika user melakukan aksi (disposisi, laporan), item langsung hilang dari tampilan meskipun proses server masih berjalan. Ini mencegah item "menghantui" feed setelah diproses.

## 3.4 Alur Disposisi Lengkap (Step-by-Step)

### LANGKAH 1: Pimpinan Mendisposisikan Surat
1. Di Ruang Kerja, Pimpinan melihat kartu "SURAT BARU"
2. Klik [Disposisikan]
3. Form disposisi terbuka (inline atau modal)
4. Pilih penerima dari daftar bawahan (bisa lebih dari satu)
5. Tulis instruksi (atau pilih dari Templat Instruksi)
6. Set batas waktu/deadline (opsional)
7. Pilih jenis: Normal (perlu TL) atau Informasional (hanya untuk diketahui)
8. Klik [Kirim Disposisi]
9. Hasilnya: Notifikasi push ke semua penerima, status surat berubah "Didisposisikan", entri Logbook terbuat otomatis untuk pengirim

### LANGKAH 2: Pelaksana Menerima Disposisi
1. Di Ruang Kerja, Pelaksana melihat kartu "SURAT DISPOSISI" berwarna kuning/orange
2. Disposisi menampilkan: siapa yang mengirim, perihal surat, instruksi, deadline
3. Klik [Terima Disposisi]
4. Status kartu berubah (tidak lagi kuning)
5. Pengirim disposisi mendapat notifikasi "Disposisi sudah diterima"
6. Entri Logbook terbuat otomatis: "Menerima disposisi surat: [Perihal]"

### LANGKAH 3: Pelaksana Melaporkan Tindak Lanjut
1. Setelah mengerjakan pekerjaan dari disposisi, klik [Lapor Tindak Lanjut]
2. Form laporan muncul (inline atau modal)
3. Isi:
   - Judul Laporan (disarankan, mis. "Koordinasi dengan Bagian Hukum selesai")
   - Isi Laporan (deskripsi apa yang dikerjakan)
   - Warna Label (kode visual: default/merah/hijau/biru/kuning/ungu)
   - Checklist item-item yang sudah selesai (opsional)
   - Upload lampiran via Google Drive (opsional)
4. Pilih mode:
   - [Kirim Laporan - Proses] = laporan dikirim, disposisi masih terbuka (bisa lapor lagi)
   - [Selesaikan & Tutup] = laporan dikirim, disposisi ditutup, kartu hilang dari feed
5. Hasilnya: Notifikasi ke atasan, entri Logbook otomatis, Bukti Kinerja otomatis terbuat

### LANGKAH 4: Disposisi Lanjutan (Subdelegasi)
Jika pelaksana perlu meneruskan ke bawahannya sendiri:
1. Klik [Disposisi Lanjut]
2. Pilih bawahan sebagai penerima
3. Tulis instruksi baru
4. Kirim disposisi baru
5. Penerima baru mendapat notifikasi

### LANGKAH 5: Eskalasi ke Atasan
Jika pelaksana tidak bisa menangani:
1. Klik [Eskalasi ke Atasan]
2. Pilih jabatan atasan tujuan
3. Tulis alasan eskalasi
4. Kirim → Atasan mendapat notifikasi eskalasi

### LANGKAH 6: Surat Selesai & Diarsipkan
- Surat otomatis berstatus "Selesai" ketika semua disposisi sudah ditutup
- Pimpinan/Admin dapat mengarsipkan surat kapan saja
- Surat yang diarsipkan hanya dapat ditemukan di halaman Arsip

## 3.5 Logbook Harian
**Path:** `/dashboard/poros/logbook`

Logbook adalah buku catatan kegiatan digital pribadi setiap pegawai.

**Cara Navigasi Tanggal:**
- Tombol [<] dan [>] untuk mundur/maju hari
- Input tanggal langsung
- Tombol [Hari Ini] untuk kembali ke hari ini

**Jenis Kegiatan di Logbook:**

A. **Otomatis dari sistem** — terbuat tanpa perlu aksi user:
- Saat kirim disposisi → "Mendisposisikan surat: [Perihal]"
- Saat terima disposisi → "Menerima disposisi surat: [Perihal]"
- Saat kirim laporan TL → "Tindak Lanjut Surat: [Perihal] - [Judul Laporan]"
- Saat selesaikan surat → "Menyelesaikan surat: [Perihal]"
- Saat eskalasi → "Eskalasi surat ke pimpinan: [Perihal]"
- Saat arsipkan → "Mengarsipkan surat: [Perihal]"
- Saat selesaikan tugas → "Menyelesaikan tugas: [Judul Tugas]"

B. **Manual oleh user:**
- Klik [+ Tambah Kegiatan]
- Modal "Smart Add Kegiatan" terbuka
- Mode Umum: tulis deskripsi kegiatan bebas
- Mode Tindak Lanjut: kaitkan dengan surat/disposisi tertentu

**Kategori Kegiatan (dengan warna badge):**
- Surat (biru), Disposisi (amber), Tugas (hijau), Rapat (ungu), Laporan (indigo), Umum (abu-abu)

**Progress Bar Harian:**
Menampilkan persentase kegiatan yang sudah ditandai selesai hari ini.

**FITUR REKAP BULANAN (Paling Vital untuk E-Kinerja):**
1. Klik [Rekap Bulanan]
2. Pilih Bulan & Tahun
3. Klik [Generate Rekap] → sistem menarik semua data logbook bulan tersebut
4. Preview teks rekap ditampilkan
5. Tersedia 2 opsi ekspor:
   - [Download PDF] → file PDF format resmi langsung terunduh
   - [Upload ke Drive] → diunggah ke folder Google Drive E-Kinerja, dengan sub-folder otomatis format: "8. 2026 Agustus - Bukti E Kinerja"

**Syarat Upload ke Drive:**
Akun Google harus sudah dihubungkan di menu Profil dan link folder Google Drive E-Kinerja sudah diisi.

## 3.6 Laporan Tindak Lanjut
**Path:** `/dashboard/poros/laporan` (berbeda dengan halaman laporan OPD)

**Dua cara membuat Laporan TL:**
A. Dari Ruang Kerja: klik [Lapor Tindak Lanjut] di kartu disposisi
B. Dari Detail Surat: klik tab "Tindak Lanjut" → klik [+ Tambah Laporan]

**Isi Form Laporan TL:**
- Judul Laporan (opsional tapi disarankan)
- Isi Laporan (teks bebas, deskripsi pekerjaan)
- Warna Label (6 pilihan warna untuk kode visual)
- Checklist (daftar pekerjaan spesifik dengan centang selesai/belum)
- Upload Lampiran (file bukti via Google Drive)

**Warna Label dan Maknanya:**
- Default (putih) — laporan biasa
- Merah — ada masalah/kendala
- Hijau — pekerjaan berjalan lancar/selesai
- Biru — informasi penting
- Kuning — perlu perhatian
- Ungu — laporan khusus/istimewa

**Setelah laporan dikirim:**
- Atasan mendapat notifikasi push
- Entri Logbook dibuat otomatis
- Bukti Kinerja dibuat otomatis di halaman Bukti Kinerja

## 3.7 Bukti Kinerja (E-Kinerja)
**Path:** `/dashboard/poros/bukti-kinerja`

Portofolio digital kinerja individual dari 3 sumber:
1. Laporan Tindak Lanjut (otomatis)
2. Tugas yang Diselesaikan (otomatis)
3. Upload Manual (dokumen apapun)

**Tab Upload:** Form untuk upload bukti kerja manual
**Tab Riwayat:** Galeri semua bukti kinerja tersimpan

**Badge Sumber Bukti:**
- "Laporan TL" — dari laporan tindak lanjut surat
- "Penyelesaian Tugas" — dari tugas yang diselesaikan
- "Manual Upload" — diupload manual

**Download Laporan Kinerja PDF:**
Klik [Download Laporan PDF] → pilih periode → PDF dengan format profesional terunduh

## 3.8 Laporan Kinerja OPD
**Path:** `/dashboard/poros/laporan`

Statistik dan analitika kinerja OPD secara keseluruhan.

**Indikator yang ditampilkan:**
- Total Surat Masuk (periode tertentu)
- Surat Selesai
- Surat Terlambat
- Rata-rata Waktu Respons (dalam jam)

**Grafik Performa:** Tren volume surat dan tingkat penyelesaian

**Tabel Beban Kerja Per Jabatan:**
Menampilkan distribusi pekerjaan: jabatan mana yang paling banyak menangani surat dan tugas

**Tabel Kinerja Per Jabatan:**
- Total tugas selesai
- Tugas selesai tepat waktu
- Rata-rata waktu penyelesaian
- Total disposisi diterima

**Laporan Mingguan Otomatis:**
Sistem menghasilkan laporan mingguan otomatis yang tersimpan di database dan dapat diakses Super Admin untuk perbandingan antar OPD.

## 3.9 Agenda Harian
**Path:** `/dashboard/poros/agenda`

Kalender digital terintegrasi yang menampilkan kegiatan 7 hari ke depan.

**Sumber Data Agenda:**
1. Surat jenis "Undangan" yang diinput dengan detail agenda → otomatis muncul
2. Jadwal Internal yang dibuat melalui menu Jadwal Tempat

**Indikator Warna:**
- Biru/Indigo — agenda dari surat undangan
- Hijau — jadwal internal

**Informasi per kartu agenda:**
- Judul/perihal kegiatan
- Tanggal dan jam
- Lokasi (atau "Rapat Virtual" untuk online)
- Status disposisi: sudah/belum didisposisikan kepada siapa

**Fitur Notulensi Cepat:**
Dari kartu agenda, klik [Buat Notulensi] → modal notulensi terbuka dengan data rapat yang sudah terisi otomatis

**Agenda di Dashboard:**
Versi ringkas ada di dashboard — Mobile: Carousel, Desktop: Tabel

## 3.10 Arsip Digital
**Path:** `/dashboard/poros/arsip`

Tempat penyimpanan permanen semua surat yang sudah selesai atau diarsipkan.

**Cara Surat Masuk Arsip:**
A. Otomatis — saat semua disposisi ditutup, surat berstatus "Selesai"
B. Manual — Pimpinan/Admin klik Arsipkan Surat kapan saja

**Tampilan:**
- Desktop: Tabel dengan kolom Perihal, Nomor, Pengirim, Status, Tanggal
- Mobile: Kartu-kartu

**Filter:**
- Status: Semua / Selesai / Diarsipkan
- Jenis Surat: Semua / Undangan / Pemberitahuan / Permohonan / Lainnya
- Pencarian teks: real-time berdasarkan perihal, nomor, pengirim

**Pagination:** 10 surat per halaman dengan navigasi Awal/Sebelumnya/Selanjutnya/Akhir

**Mengklik surat di arsip:** Membuka detail lengkap termasuk file asli, riwayat disposisi, laporan TL, dan jejak audit

---

# BAGIAN 4 — FITUR-FITUR PENDUKUNG

## 4.1 Manajemen Tugas
**Path:** `/dashboard/poros/tugas`

Tugas adalah perintah kerja terstruktur di luar alur surat disposisi.

**Status Tugas:** Baru → Dikerjakan → Selesai / Dibatalkan

**Fitur Tugas:**
- Sub-tugas: pecah tugas besar ke poin kecil
- Komentar: komunikasi langsung antara pemberi & penerima
- Lampiran: file atau link terkait
- Delegasi: penerima bisa mendelegasikan ke pihak lain
- Prioritas: Tinggi / Sedang / Rendah
- Kategori: Penyusunan Laporan / Analisis Data / Koordinasi / dll

**Ketika Tugas Diselesaikan:**
→ Entri Logbook otomatis dibuat
→ Bukti Kinerja otomatis dibuat

## 4.2 Checklist Board (Kanban)
**Path:** `/dashboard/poros/checklist`

Papan kanban personal: Todo — In Progress — Done
Bisa ditautkan ke Tugas tertentu.

## 4.3 Bank Templat Instruksi
**Path:** `/dashboard/poros/bank-templat`

Repositori teks instruksi disposisi yang sering digunakan.
Cara pakai: saat form disposisi terbuka, klik ikon buku → pilih templat → instruksi terisi otomatis.
Dapat dibagikan ke OPD lain (fitur paket Pro/Enterprise).

## 4.4 Repositori Dokumen
**Path:** `/dashboard/poros/dokumen`

Sistem penyimpanan dokumen dengan struktur folder-subfolder.
Mendukung: folder, link URL, upload file (PDF/Excel/Word/gambar/video)
Dapat dibagikan ke OPD lain.

## 4.5 Jadwal Tempat / Booking Ruang
**Path:** `/dashboard/poros/jadwal`

Sistem booking ruang rapat dan jadwal kegiatan internal.
Status: Menunggu Persetujuan → Disetujui / Ditolak
Jadwal yang disetujui muncul di Agenda Harian peserta.
Mendukung mode Fisik (nama tempat) dan Virtual (tautan rapat/meeting).

## 4.6 Persetujuan Draf Dokumen
**Path:** `/dashboard/poros/persetujuan-draf`

Workflow review dan approval dokumen Google Docs sebelum dikirim/ditandatangani.
Rantai persetujuan bisa dikonfigurasi (siapa saja, urutan berapa).
Reviewer mendapat kartu di Ruang Kerja untuk menyetujui/merevisi.

## 4.7 Knowledge Base
**Path:** `/dashboard/poros/knowledge`

Repositori artikel pengetahuan, SOP, panduan internal OPD.
Dapat dikategorikan dan dibagikan ke OPD lain.

## 4.8 Notulensi Rapat
Cara membuat:
A. Dari menu Notulensi: manual
B. Dari Ruang Kerja/Agenda: klik [Buat Notulensi] → data otomatis terisi

Isi Notulensi: Judul Rapat, Tanggal, Pemimpin, Notulis, Peserta, Isi Notulensi.

## 4.9 Surat Keluar
**Path:** `/dashboard/poros/surat-keluar`

Manajemen surat keluar OPD terpisah dari surat masuk.
Pencatatan surat yang dikirim keluar oleh OPD.

---

# BAGIAN 5 — NOTIFIKASI & KOMUNIKASI

## 5.1 Push Notification (FCM)

Sistem mengirim notifikasi push ke browser/device ketika:
- Ada disposisi baru masuk ke pengguna
- Disposisi sudah diterima oleh penerima
- Ada laporan tindak lanjut baru dari bawahan
- Ada tugas baru yang ditugaskan
- Ada eskalasi masuk
- Ada pengumuman OPD

**Syarat Notifikasi Berjalan:**
Pengguna harus mengizinkan notifikasi browser ketika sistem meminta pop-up izin. Jika terlewat, atur ulang di: Pengaturan Browser → Situs → Notifikasi.

## 5.2 Notifikasi In-App

Bell icon di top bar menampilkan riwayat notifikasi yang belum dibaca. Klik notifikasi langsung membuka halaman terkait.

---

# BAGIAN 6 — INTEGRASI GOOGLE

## 6.1 Menghubungkan Akun Google

Di menu Profil → klik [Hubungkan Akun Google] → login → izinkan akses Drive.

**Setelah terhubung, pengguna bisa:**
- Upload laporan rekap Logbook langsung ke Google Drive
- Upload bukti kinerja ke folder Drive yang ditentukan
- (Opsional) Sinkronisasi agenda ke Google Calendar

## 6.2 Folder E-Kinerja

Setelah Google terhubung, isi link folder Google Drive E-Kinerja di Profil.
Sistem akan otomatis upload file ke sub-folder dengan nama:
**Format:** `[Nomor Bulan]. [Tahun] [Nama Bulan] - Bukti E Kinerja`
**Contoh:** `8. 2026 Agustus - Bukti E Kinerja`

---

# BAGIAN 7 — NAVIGASI & TAMPILAN

## 7.1 Navigasi Desktop

- **Sidebar Kiri:** Menu navigasi utama dengan ikon dan label
- **Mega Menu:** Hover pada grup menu untuk lihat sub-menu
- **Top Bar:** Search global, notifikasi (bell), profil pengguna, toggle tema (gelap/terang)
- **Breadcrumb:** Navigasi jejak halaman di bagian atas konten

## 7.2 Navigasi Mobile

- **Bottom Navigation Bar:** 5 ikon di bawah layar untuk menu paling sering diakses
- **Hamburger Menu:** Tombol 3 garis di kiri atas → drawer semua menu
- **Smart FAB:** Tombol aksi mengambang di sudut kanan bawah untuk aksi cepat
- **Swipe Gestures:** Beberapa halaman mendukung geser kiri-kanan

## 7.3 Tema (Gelap / Terang)

Tombol toggle tema tersedia di top bar. Sistem mendukung:
- Light Mode (terang)
- Dark Mode (gelap)
Preferensi tersimpan otomatis.

## 7.4 Dua Tema UI (Poros & Sigap)

RUANG SIGAP memiliki dua varian tampilan:
- **Poros** — Tema modern, clean, professional (default/utama)
- **Sigap** — Tema lama (sedang dalam fase transisi)

Admin dapat mengatur tema default OPD. User dapat memilih tema individual di Profil.

---

# BAGIAN 8 — OTOMASI SISTEM

## 8.1 Auto-Logbook

Setiap aksi penting secara OTOMATIS membuat entri di Logbook harian tanpa user perlu melakukan apapun:

| Aksi User | Entri Logbook Otomatis |
|-----------|------------------------|
| Kirim disposisi | "Mendisposisikan surat: [Perihal Surat]" |
| Terima disposisi | "Menerima disposisi surat: [Perihal Surat]" |
| Kirim laporan progres | "Tindak Lanjut Surat: [Perihal] - [Judul Laporan]" |
| Selesaikan surat | "Menyelesaikan surat: [Perihal Surat]" |
| Eskalasi surat | "Eskalasi surat ke pimpinan: [Perihal Surat]" |
| Arsipkan surat | "Mengarsipkan surat: [Perihal Surat]" |
| Selesaikan tugas | "Menyelesaikan tugas: [Judul Tugas]" |

## 8.2 Auto-Bukti Kinerja

Setiap laporan tindak lanjut yang dikirim otomatis membuat record di halaman Bukti Kinerja. Tidak perlu input ulang.

## 8.3 Auto-Agenda

Setiap surat jenis "Undangan" yang diinput dengan detail agenda (tanggal/jam/lokasi) otomatis muncul di halaman Agenda Harian seluruh pihak yang terlibat.

## 8.4 Auto-Notifikasi

Setiap perpindahan status surat (kirim disposisi, terima disposisi, laporan masuk) otomatis mengirim push notification ke pihak yang relevan.

## 8.5 Auto-Cleanup Self-Disposisi

Sistem secara otomatis membersihkan disposisi yang menunjuk diri sendiri (pimpinan mendisposisikan ke diri sendiri) — ini mencegah item tidak berguna mengotori feed Ruang Kerja.

---

# BAGIAN 9 — DATA & KEAMANAN

## 9.1 Database (Firestore)

Sistem menggunakan Firebase Firestore (NoSQL real-time database). Data disimpan dalam koleksi-koleksi:

| Koleksi | Isi |
|---------|-----|
| `surat` | Data semua surat masuk OPD |
| `disposisi` | Data semua disposisi |
| `tindakLanjut` | Laporan tindak lanjut per disposisi |
| `logbookHarian` | Logbook harian per pengguna per hari |
| `tugas` | Data tugas |
| `users` | Profil pengguna |
| `jabatan` | Struktur jabatan OPD |
| `opd` | Data OPD |
| `userSummaries` | Cache ringkasan per jabatan (untuk performa) |
| `notifications` | Riwayat notifikasi |
| `buktiKinerja` | Bukti kinerja digital |
| `jadwalTempat` | Booking jadwal ruang |

## 9.2 Isolasi Data Antar OPD

Setiap data di-tag dengan `opdId`. Pengguna hanya bisa melihat data OPD-nya sendiri. Tidak ada kebocoran data lintas OPD kecuali melalui fitur Surat Lintas OPD yang eksplisit.

## 9.3 Jejak Audit (Activity Log)

Setiap aksi pada surat tercatat di koleksi ActivityLog dengan detail:
- Siapa yang melakukan (nama + jabatan)
- Aksi apa yang dilakukan
- Kapan (timestamp)
- Detail/catatan aksi

Jejak audit ini tampil di halaman detail surat bagian bawah.

---

# BAGIAN 10 — PERTANYAAN YANG SERING DIAJUKAN

**Q: Kenapa surat saya tidak muncul di Ruang Kerja padahal sudah diinput?**
A: Periksa: 1) Apakah status surat sudah "Baru"? 2) Apakah Tujuan Jabatan sudah benar? 3) Refresh halaman. Jika pimpinan tidak melihat surat baru, cek apakah akun Anda memiliki level jabatan yang tepat (≤5).

**Q: Bagaimana cara mendisposisikan ke beberapa orang sekaligus?**
A: Di form disposisi, centang beberapa nama sekaligus dari daftar bawahan. Semua yang dipilih akan mendapat disposisi dan notifikasi bersamaan.

**Q: Apa beda "Disposisi" dan "Informasional"?**
A: Disposisi Normal = penerima wajib menindaklanjuti dan melaporkan. Informasional = penerima hanya perlu mengetahui surat ini, tidak perlu laporan tindak lanjut.

**Q: Apakah laporan tindak lanjut bisa diedit setelah dikirim?**
A: Ya. Buka detail surat → tab Tindak Lanjut → klik ikon pensil pada laporan. Hanya pemilik laporan yang bisa mengedit laporannya sendiri.

**Q: Kenapa upload ke Google Drive gagal?**
A: Pastikan: 1) Akun Google sudah dihubungkan di Profil, 2) Link folder Google Drive E-Kinerja sudah diisi di Profil, 3) Izin akses Drive masih aktif (belum expired).

**Q: Apa yang terjadi jika saya klik "Selesaikan & Tutup" pada laporan TL?**
A: Disposisi Anda akan ditandai selesai, kartu disposisi hilang dari Ruang Kerja Anda. Jika semua penerima disposisi untuk surat tersebut sudah selesai, status surat berubah menjadi "Selesai".

**Q: Bagaimana cara melihat siapa saja yang sudah menindaklanjuti surat?**
A: Buka Surat Masuk → klik surat → pilih tab "Pemantauan" (Pimpinan/Admin) atau lihat tab "Tindak Lanjut".

**Q: Apakah logbook saya bisa dilihat oleh atasan?**
A: Tidak secara langsung — logbook bersifat pribadi. Namun atasan dapat melihat laporan tindak lanjut yang Anda kirim dari detail surat.

**Q: Bagaimana cara membuat rekap bulanan untuk SKP?**
A: Buka Logbook → klik [Rekap Bulanan] → pilih bulan → [Generate Rekap] → [Download PDF] atau [Upload ke Drive].

**Q: Bisa tidak mendisposisikan surat ke seseorang di luar OPD saya?**
A: Ya, melalui fitur Surat Lintas OPD (untuk paket Enterprise). Pastikan OPD tujuan sudah terdaftar dalam sistem.

**Q: Bagaimana jika saya lupa mengakui terima (acknowledge) disposisi?**
A: Kartu disposisi akan tetap berwarna kuning/orange di Ruang Kerja Anda sampai Anda klik [Terima Disposisi]. Pengirim juga bisa melihat bahwa Anda belum menerima.

**Q: Apakah ada batas maksimal surat yang bisa diinput?**
A: Bergantung pada paket langganan OPD (Dasar/Profesional/Enterprise). Lihat detail di pengaturan OPD.

**Q: Bagaimana cara mencari surat lama yang sudah diarsipkan?**
A: Buka menu Arsip → gunakan kolom pencarian (ketik nomor surat atau perihal) → filter status jika perlu.

**Q: Apa itu PLT dan bagaimana cara mengaktifkannya?**
A: PLT (Pejabat Pelaksana Tugas) adalah fitur untuk mendelegasikan akses jabatan sementara. Admin OPD mengaturnya di menu Admin → Jabatan → pilih jabatan → tambahkan PLT.

---

# BAGIAN 11 — KAMUS ISTILAH

| Istilah | Definisi |
|---------|----------|
| **Disposisi** | Pendelegasian wewenang dan instruksi dari atasan ke bawahan terkait surat masuk |
| **Acknowledge** | Konfirmasi penerimaan disposisi oleh pelaksana — menandakan sudah membaca |
| **Tindak Lanjut (TL)** | Laporan progres pekerjaan yang dikirim pelaksana atas disposisi yang diterimanya |
| **Eskalasi** | Pengembalian surat ke atasan karena pelaksana tidak dapat menangani |
| **SSOT** | Single Source of Truth — sumber data tunggal untuk menghindari inkonsistensi |
| **OPD** | Organisasi Perangkat Daerah (Dinas, Badan, Kantor, Kecamatan, dll) |
| **E-Kinerja** | Bukti elektronik kinerja ASN yang dapat digunakan untuk penilaian SKP |
| **SKP** | Sasaran Kinerja Pegawai — dokumen penilaian kinerja resmi ASN |
| **FCM** | Firebase Cloud Messaging — teknologi push notification |
| **Klasifikasi Surat** | Tingkat urgensi surat: Biasa / Penting / Segera / Rahasia |
| **Overdue** | Item yang telah melewati batas waktu (deadline) |
| **Feed** | Daftar item yang muncul di Ruang Kerja |
| **PLT** | Pejabat Pelaksana Tugas — pengganti sementara pejabat yang berhalangan |
| **Draf Persetujuan** | Dokumen yang dikirim untuk di-review dan disetujui pimpinan |
| **Informasional** | Jenis disposisi yang hanya untuk diketahui, tidak perlu tindak lanjut |
| **Jejak Audit** | Riwayat lengkap semua aksi yang dilakukan pada sebuah surat |
| **Optimistic UI** | Teknik UI yang langsung menampilkan perubahan sebelum server konfirmasi |
| **Denormalisasi** | Teknik database menyimpan data yang sama di beberapa tempat untuk performa |

---

# BAGIAN 12 — ROADMAP & PENGEMBANGAN

## Kondisi Saat Ini (Fase 1)

Sistem sudah mampu menghasilkan 5 output dari 1 input surat:
1. Agenda Harian Otomatis
2. Rantai Disposisi Digital
3. Laporan Tindak Lanjut Real-time
4. Bukti E-Kinerja (PDF + Google Drive)
5. Arsip Digital Searchable

## Pengembangan Visioner (Fase 2-4)

**QR Code Absensi Rapat Digital:**
Surat undangan menghasilkan QR Code unik → peserta scan saat rapat → absensi tercatat otomatis → laporan kehadiran per ASN tersedia

**Indeks Kinerja ASN Berbasis Data:**
Dari data disposisi, TL, dan logbook, sistem membangun indeks kinerja objektif: kecepatan respons, tingkat penyelesaian tepat waktu, volume aktivitas

**Integrasi SKP Otomatis:**
Data logbook dapat diekspor langsung ke format yang kompatibel dengan aplikasi SKP ASN nasional

**Portal Layanan Publik Online (G2C):**
Masyarakat mengajukan permohonan online → otomatis masuk sebagai surat masuk di RUANG SIGAP → status dapat dilacak masyarakat secara real-time

**Dashboard Eksekutif:**
Kepala Daerah (Bupati/Walikota) dapat melihat kinerja seluruh OPD dalam satu tampilan konsolidasi

**Tanda Tangan Elektronik:**
Integrasi dengan BSrE Kominfo atau PERURI untuk tanda tangan digital resmi pada dokumen yang dihasilkan sistem

**Interoperabilitas:**
Koneksi API dengan SIASN (data ASN), SIPD (perencanaan), e-Monev (monitoring), JDIH (peraturan), Satu Data Indonesia

**Sistem Notifikasi Eskalasi Otomatis:**
Jika disposisi tidak ditindaklanjuti dalam SLA tertentu, sistem otomatis mengirim pengingat dan auto-eskalasi ke atasan

---

*Dokumen ini adalah pengetahuan lengkap sistem RUANG SIGAP versi produksi Agustus 2026.*
*Dihasilkan dari audit mendalam kode sumber: 29 custom hooks, 30+ halaman, seluruh alur bisnis.*
