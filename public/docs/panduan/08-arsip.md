# Panduan 08 — Arsip Digital

> Menu: **Arsip** | Path: `/dashboard/poros/arsip`

---

## Apa Itu Arsip Digital?

Arsip Digital adalah **tempat penyimpanan permanen** semua surat yang telah selesai diproses atau secara manual diarsipkan oleh Pimpinan/Admin. Arsip berfungsi sebagai **memori institusional digital** yang dapat diakses, dicari, dan difilter kapan saja.

---

## Surat Masuk ke Arsip

Surat berpindah ke Arsip melalui dua cara:

### 1. Otomatis: Saat Surat Diselesaikan

Ketika semua pelaksana yang menerima disposisi sudah mengirim laporan final ("Selesaikan & Tutup"), sistem secara otomatis menandai surat sebagai "Selesai". Surat dengan status Selesai dapat ditemukan di tab Selesai, dan dapat diarsipkan secara manual.

### 2. Manual: Arsip oleh Pimpinan/Admin

Pimpinan atau Admin dapat mengarsipkan surat kapan saja:

1. Buka detail surat (dari halaman Surat Masuk atau klik dari daftar)
2. Klik menu tiga titik (**...**) atau ikon Arsip
3. Pilih **"Arsipkan Surat"**
4. Masukkan alasan pengarsipan (opsional)
5. Konfirmasi

Setelah diarsipkan:
- Status surat berubah menjadi "Diarsipkan"
- Surat tidak lagi muncul di halaman Surat Masuk aktif
- Surat hanya dapat ditemukan di halaman Arsip

---

## Tampilan Halaman Arsip

Halaman Arsip menampilkan daftar semua surat yang sudah diarsipkan/selesai:

### Desktop (Tampilan Tabel)

```
+--------+----------------------+-------------+----------+-----------+------+
| No     | Perihal              | No. Surat   | Pengirim | Status    | Tgl  |
+--------+----------------------+-------------+----------+-----------+------+
| 001    | Undangan Rapat...    | 001/PD/2026 | Sekda    | Selesai   | 5/8  |
| 002    | Permohonan Dana...   | 045/BD/2026 | Bid.Keu  | Diarsipkan| 3/8  |
| 003    | Pemberitahuan...     | 120/KM/2026 | Kemendag | Selesai   | 1/8  |
+--------+----------------------+-------------+----------+-----------+------+
                                        [< Sebelumnya]  Halaman 1/5  [Selanjutnya >]
```

### Mobile (Tampilan Kartu)

Setiap surat ditampilkan sebagai kartu yang memuat:
- Perihal (judul surat)
- Status (badge warna)
- Nomor surat
- Nama pengirim
- Tanggal diterima

---

## Pencarian dan Filter di Arsip

### Kolom Pencarian

Ketik di kolom pencarian untuk mencari berdasarkan:
- Perihal surat
- Nomor surat
- Nama pengirim

Pencarian bersifat **real-time** (langsung menyaring tanpa perlu klik tombol).

### Filter Status

| Filter | Surat yang Ditampilkan |
|--------|------------------------|
| **Semua** | Semua surat (Selesai + Diarsipkan) |
| **Selesai** | Hanya surat dengan status Selesai |
| **Diarsipkan** | Hanya surat yang diarsipkan secara manual |

### Filter Jenis Surat

Filter tambahan berdasarkan jenis surat:
- Semua Jenis
- Undangan
- Pemberitahuan
- Permohonan
- Lainnya

---

## Pagination (Halaman Berikutnya)

Arsip mendukung **pagination** untuk menampilkan surat dalam jumlah besar:
- 10 surat per halaman (default)
- Tombol navigasi: Awal, Sebelumnya, [Nomor Halaman], Selanjutnya, Akhir

---

## Membuka Detail Surat Arsip

Klik pada baris tabel (desktop) atau kartu (mobile) untuk membuka detail lengkap surat yang diarsipkan. Anda dapat:
- Melihat file surat asli
- Melihat riwayat disposisi lengkap
- Melihat semua laporan tindak lanjut
- Melihat riwayat aktivitas (jejak audit)

---

## Kegunaan Arsip Digital

### Referensi Historis

Ketika ada surat baru yang serupa dengan surat lama, cari di arsip untuk melihat bagaimana surat serupa ditangani sebelumnya.

### Pembuktian Pertanggungjawaban

Setiap surat di arsip memiliki **jejak audit lengkap** yang menunjukkan:
- Siapa yang menginput surat
- Siapa yang mendisposisikan ke siapa
- Apa instruksinya
- Kapan setiap tindakan dilakukan
- Apa hasil tindak lanjutnya

### Evaluasi Kinerja

Data arsip dapat digunakan untuk menghitung:
- Berapa surat yang diselesaikan dalam periode tertentu
- Rata-rata waktu penyelesaian surat
- Siapa yang paling produktif menyelesaikan disposisi

### Persiapan Audit

Ketika ada pemeriksaan dari inspektorat atau BPK, arsip digital menyediakan semua dokumen dan jejak audit dalam format yang mudah diakses dan dicetak.

---

## Tips Pengelolaan Arsip

> **Tips 1:** Arsipkan surat yang sudah selesai secara berkala (minimal sebulan sekali) untuk menjaga daftar surat aktif tetap bersih dan fokus.

> **Tips 2:** Gunakan pencarian arsip ketika menerima surat yang berulang atau terkait dengan surat sebelumnya. Ini membantu memahami konteks dan membuat disposisi yang lebih tepat.

> **Tips 3:** Sebelum akhir tahun, pastikan semua surat tahun berjalan sudah memiliki status Selesai atau Diarsipkan untuk keperluan pelaporan tahunan.

> **Tips 4:** Untuk surat rahasia, pastikan hanya pihak yang berwenang yang memiliki akses ke detail surat tersebut.

---

## Perbedaan Status Selesai vs Diarsipkan

| Aspek | Selesai | Diarsipkan |
|-------|---------|------------|
| **Cara masuk** | Otomatis ketika semua TL selesai | Manual oleh Pimpinan/Admin |
| **Semua disposisi selesai?** | Ya | Belum tentu |
| **Masih bisa diproses?** | Tidak | Tidak |
| **Tampil di Surat Aktif?** | Tidak | Tidak |
| **Tersedia di Arsip?** | Ya | Ya |

---

*Dokumen selanjutnya: [Panduan 09 — Fitur Pendukung](./09-fitur-pendukung.md)*
