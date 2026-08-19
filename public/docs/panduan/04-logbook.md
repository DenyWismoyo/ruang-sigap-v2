# Panduan 04 — Logbook Harian

> Menu: **Logbook Harian** | Path: `/dashboard/poros/logbook`

---

## Apa Itu Logbook Harian?

Logbook Harian adalah **buku catatan digital pribadi** Anda di RUANG SIGAP. Di sinilah semua kegiatan yang Anda lakukan setiap hari dicatat — baik secara otomatis oleh sistem maupun secara manual oleh Anda sendiri.

Logbook bukan hanya catatan biasa. Ia berfungsi sebagai **sumber data** untuk menghasilkan:
- Laporan Kegiatan Harian (PDF)
- Bukti E-Kinerja (upload ke Google Drive)
- Data analitika kinerja personal

---

## Navigasi Logbook

### Memilih Tanggal

Di bagian atas halaman terdapat navigasi tanggal:

```
[<]  Senin, 19 Agustus 2026  [>]  [Hari Ini]
     atau
[<]  [Input tanggal manual]  [>]  [Hari Ini]
```

- Klik **[<]** untuk mundur ke hari sebelumnya
- Klik **[>]** untuk maju ke hari berikutnya
- Klik **[Hari Ini]** untuk kembali ke tanggal hari ini

---

## Cara Menambahkan Kegiatan

### A. Tambah Kegiatan Manual

1. Klik tombol **"+ Tambah Kegiatan"** (tombol hijau/teal di bagian atas)
2. Modal "Smart Add Kegiatan" akan terbuka
3. Ada dua mode penambahan:

**Mode Umum:**
- Tulis deskripsi kegiatan (contoh: "Menyusun laporan bulanan bidang pendidikan")
- Klik "Simpan"

**Mode Tindak Lanjut Surat:**
- Cocokkan kegiatan dengan surat tertentu yang sedang ditindaklanjuti
- Sistem akan menautkan kegiatan ke surat & disposisi terkait

### B. Kegiatan Otomatis dari Sistem

Sistem RUANG SIGAP secara otomatis menambahkan entri ke Logbook Anda ketika:

| Aksi | Entri Logbook yang Dibuat |
|------|--------------------------|
| Kirim Disposisi | "Mendisposisikan surat: [Perihal]" |
| Terima Disposisi | "Menerima disposisi surat: [Perihal]" |
| Kirim Laporan TL | "Tindak Lanjut Surat: [Perihal] - [Judul Laporan]" |
| Selesaikan Surat | "Menyelesaikan surat: [Perihal]" |
| Eskalasi Surat | "Eskalasi surat ke pimpinan: [Perihal]" |
| Arsipkan Surat | "Mengarsipkan surat: [Perihal]" |
| Selesaikan Tugas | "Menyelesaikan tugas: [Judul Tugas]" |
| Menggunakan Copilot AI | Auto-generate (ditandai label "Copilot") |

---

## Tampilan Daftar Kegiatan

Setiap kegiatan ditampilkan sebagai kartu dengan informasi:

```
[x] [ DISPOSISI ]  [Copilot]  [09:00 - 10:30]
    Mendisposisikan surat: "Undangan Rapat Koordinasi Antar OPD"
    -> Surat: Lihat Detail Surat [link]
    [Tiga titik ...]
```

**Keterangan elemen:**
- **Checkbox** (kiri): Klik untuk tandai selesai/belum selesai
- **Label Kategori:** Warna berbeda untuk setiap kategori (Surat/Disposisi/Tugas/Rapat/Laporan/Umum)
- **Label Copilot:** Jika kegiatan dihasilkan oleh AI Copilot
- **Waktu:** Jam mulai dan selesai (jika diisi)
- **Deskripsi:** Isi kegiatan
- **Tautan:** Link ke surat atau tugas yang terkait
- **Tiga Titik:** Menu edit/hapus

---

## Edit dan Hapus Kegiatan

**Untuk mengedit kegiatan:**
1. Klik ikon tiga titik (**...**) di sudut kanan kartu kegiatan
2. Pilih **"Edit"**
3. Modal edit terbuka — Anda dapat mengubah deskripsi dan menautkan ke tugas
4. Klik **"Simpan"**

**Untuk menghapus kegiatan:**
1. Klik ikon tiga titik di kartu kegiatan
2. Pilih **"Hapus"**
3. Konfirmasi penghapusan

---

## Progress Bar Harian

Di atas daftar kegiatan terdapat **progress bar** yang menunjukkan:

```
Progress: 7/10 Selesai
[=========>    ] 70%
```

Ini menghitung persentase kegiatan hari ini yang sudah ditandai "Selesai" dibandingkan total kegiatan.

---

## Rekap Bulanan & Ekspor E-Kinerja

Fitur paling powerful di Logbook adalah kemampuan **menghasilkan rekap bulanan** secara otomatis dan mengunggahnya langsung ke Google Drive sebagai bukti E-Kinerja.

### Cara Membuat Rekap Bulanan

1. Klik tombol **"Rekap Bulanan"** (tombol hijau)
2. Modal Rekap Bulanan terbuka
3. Pilih **Bulan** dan **Tahun** yang ingin direkap
4. Klik **"Generate Rekap"**
5. Sistem akan mengambil semua data logbook bulan tersebut dan menampilkan preview teks:

```
LAPORAN KEGIATAN HARIAN (LOGBOOK)
NAMA      : BUDI SANTOSO
PERIODE   : Agustus 2026
===================================================

HARI/TANGGAL: Senin, 1 Agustus
- [SELESAI] Mendisposisikan surat: "Undangan Rapat"
- [SELESAI] Tindak Lanjut Surat: "Permohonan Anggaran"

HARI/TANGGAL: Selasa, 2 Agustus
- [PROSES] Menyusun Laporan Bulanan Bidang
...
```

### Opsi Ekspor

Setelah rekap di-generate, Anda memiliki dua opsi:

**A. Download PDF**
- Klik **"Download PDF"**
- File PDF dengan format profesional akan diunduh langsung
- PDF ini bisa dicetak atau dilampirkan sebagai bukti fisik

**B. Upload ke Google Drive (E-Kinerja)**
- Klik **"Upload ke Drive"**
- File otomatis diunggah ke folder Google Drive E-Kinerja Anda
- Sistem membuat sub-folder otomatis dengan format: `[Bulan]. [Tahun] [NamaBulan] - Bukti E Kinerja`
  
  Contoh: `8. 2026 Agustus - Bukti E Kinerja`
- Setelah sukses, muncul pesan konfirmasi dengan nama folder tujuan

> **Perhatian:** Fitur upload ke Google Drive memerlukan koneksi akun Google Anda di menu **Profil** > **Integrasi Google**. Pastikan akun sudah terhubung sebelum menggunakan fitur ini.

---

## Kategori Kegiatan

| Kategori | Warna | Keterangan |
|----------|-------|------------|
| **Surat** | Biru | Kegiatan terkait pengelolaan surat |
| **Disposisi** | Amber | Kegiatan terkait proses disposisi |
| **Tugas** | Hijau | Kegiatan terkait penyelesaian tugas |
| **Rapat** | Ungu | Kegiatan rapat dan pertemuan |
| **Laporan** | Indigo | Kegiatan pembuatan laporan |
| **Umum** | Abu-abu | Kegiatan lain-lain |

---

## Tautan Cepat di Logbook

Di bagian atas halaman terdapat tombol akses cepat ke:
- **Tugas** — Langsung ke halaman manajemen tugas
- **Checklist** — Ke halaman papan checklist/kanban

---

## Tips Penggunaan Logbook

> **Tips 1:** Tandai kegiatan sebagai "Selesai" di akhir hari sebelum pulang. Ini akan membuat laporan bulanan Anda lebih akurat.

> **Tips 2:** Manfaatkan fitur "Auto Logbook" — setiap kali Anda mendisposisikan surat atau menyelesaikan tugas, entri logbook dibuat otomatis. Anda hanya perlu menambahkan kegiatan yang TIDAK terkait surat/disposisi.

> **Tips 3:** Buat rekap bulanan di akhir bulan (30/31) sebelum tanggal 5 bulan berikutnya untuk memastikan semua data terrekap dengan benar.

> **Tips 4:** Gunakan waktu mulai dan selesai saat menambah kegiatan manual untuk dokumentasi yang lebih akurat.

---

## Contoh Penggunaan Sehari-hari

**Pagi (masuk kantor):**
1. Buka Logbook untuk tanggal hari ini
2. Lihat progress bar — pasti sudah ada beberapa entri dari sistem (dari kemarin atau pagi ini)
3. Tambahkan kegiatan manual yang belum tercatat (mis. rapat yang Anda hadiri)

**Sore (menjelang pulang):**
1. Tandai semua kegiatan yang sudah selesai
2. Tambahkan catatan tambahan jika perlu
3. Cek progress bar — idealnya >80% selesai

**Akhir Bulan:**
1. Klik "Rekap Bulanan"
2. Generate rekap untuk bulan tersebut
3. Download PDF dan/atau upload ke Google Drive E-Kinerja
4. Rekap siap dilaporkan ke atasan

---

*Dokumen selanjutnya: [Panduan 05 — Laporan Tindak Lanjut](./05-laporan-tindak-lanjut.md)*
