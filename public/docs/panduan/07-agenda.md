# Panduan 07 — Agenda Harian

> Menu: **Agenda** | Path: `/dashboard/poros/agenda`

---

## Apa Itu Menu Agenda?

Menu Agenda adalah **kalender digital terintegrasi** yang menampilkan seluruh kegiatan dalam 7 hari ke depan. Agenda ini bersumber dari dua sumber:

1. **Surat Undangan** — Surat yang jenis suratnya "Undangan" dan memiliki detail agenda (tanggal, jam, lokasi) akan otomatis muncul di sini
2. **Jadwal Internal** — Kegiatan internal yang dibuat langsung di sistem (rapat, penggunaan ruangan, dll.)

---

## Sumber Data Agenda

### Agenda dari Surat Undangan

Ketika Staf TU menginput surat dengan jenis "Undangan" dan mengisi:
- Tanggal kegiatan
- Jam kegiatan
- Lokasi kegiatan

Maka surat tersebut **secara otomatis** muncul di halaman Agenda semua pihak yang terlibat (penerima disposisi).

**Informasi yang ditampilkan:**
- Judul/perihal undangan
- Jam dan tanggal kegiatan
- Lokasi
- Status disposisi (sudah/belum didisposisikan kepada siapa)

### Agenda dari Jadwal Internal

Jadwal yang dibuat melalui menu **Jadwal Tempat** akan muncul di agenda orang yang bertanggung jawab atau yang membuatnya.

**Informasi yang ditampilkan:**
- Nama kegiatan
- Lokasi (nama tempat atau "Rapat Virtual")
- Jam mulai dan selesai
- Penanggung jawab

---

## Tampilan Halaman Agenda

Halaman Agenda menampilkan kegiatan dalam **tampilan list berurutan** berdasarkan tanggal dan jam:

```
AGENDA 7 HARI KE DEPAN
================================================================

SENIN, 19 AGUSTUS 2026

  09:00  [Undangan]  Rapat Koordinasi Percepatan Program
                     Dari: Sekretariat Daerah
                     Lokasi: Ruang Rapat Lt. 3
                     Disposisi Kepada: Budi Santoso
                     [Klik untuk detail surat]

  13:00  [Internal]  Rapat Tim Evaluasi Q3
                     Lokasi: Ruang Multimedia
                     PJ: Kepala Bidang
                     [Klik untuk detail jadwal]

SELASA, 20 AGUSTUS 2026

  08:30  [Undangan]  Seminar Nasional E-Government
                     Dari: Kemendagri
                     Lokasi: Hotel Aston, Jakarta
                     Belum Didisposisikan
```

---

## Cara Berinteraksi dengan Agenda

### Melihat Detail Surat Undangan

Klik kartu agenda jenis **Undangan** untuk membuka detail surat lengkap, termasuk:
- File PDF surat asli
- Riwayat disposisi
- Laporan tindak lanjut

### Melihat Detail Jadwal Internal

Klik kartu agenda jenis **Internal** untuk membuka modal detail jadwal yang menampilkan:
- Informasi kegiatan lengkap
- Daftar peserta
- Tautan rapat virtual (jika online)
- Status persetujuan

---

## Indikator Warna Agenda

| Warna | Jenis |
|-------|-------|
| **Biru/Indigo** | Undangan surat |
| **Hijau** | Jadwal internal |

---

## Status Disposisi di Agenda

Pada setiap kartu undangan, terdapat informasi status disposisi:

| Status | Tampilan |
|--------|----------|
| **Belum Didisposisikan** | Teks kuning "Belum Didisposisikan" |
| **Sudah Didisposisi kepada...** | Nama penerima disposisi |

Ini membantu pimpinan memastikan semua undangan penting sudah terdelegasikan.

---

## Fitur Notulensi Cepat

Di halaman Ruang Kerja (panel agenda), tersedia tombol cepat untuk **membuat notulensi rapat** langsung dari kartu agenda:

1. Klik tombol **"Buat Notulensi"** pada kartu agenda
2. Modal notulensi terbuka dengan data yang sudah terisi otomatis:
   - Judul rapat (dari perihal surat/kegiatan)
   - Tanggal rapat (dari agenda)
   - Pemimpin rapat (dari pengirim surat/penanggung jawab)
   - Peserta (dari penerima disposisi)
3. Lengkapi isi notulensi
4. Klik "Simpan"
5. Notulensi tersimpan dan dapat diakses dari menu Notulensi

---

## Filter dan Pencarian Agenda

Di halaman Agenda penuh, Anda dapat:
- Melihat agenda **7 hari ke depan** dari hari ini
- Filter berdasarkan jenis agenda (Undangan/Internal)
- Cari berdasarkan judul/perihal

---

## Agenda di Dashboard (Versi Ringkas)

Di halaman Dashboard, terdapat **versi ringkas agenda** yang menampilkan kegiatan hari ini dan beberapa hari ke depan:

- **Mobile:** Carousel horizontal yang bisa digeser
- **Desktop:** Tabel ringkas di panel kanan

---

## Tips Manajemen Agenda

> **Tips 1:** Pastikan setiap surat undangan yang masuk langsung diisi detail agendanya (tanggal, jam, lokasi) saat input. Jangan ditunda agar agenda tidak terlewat.

> **Tips 2:** Cek halaman Agenda setiap pagi sebelum memulai kerja untuk memastikan tidak ada rapat yang terlupa.

> **Tips 3:** Untuk undangan yang belum ada disposisinya, segera buka surat tersebut dan tentukan siapa yang akan mewakili/menghadiri rapat.

> **Tips 4:** Gunakan fitur Notulensi Cepat langsung dari kartu agenda untuk mendokumentasikan hasil rapat secara real-time.

---

## Integrasi Agenda dengan Fitur Lain

| Agenda | Terhubung dengan |
|--------|-----------------|
| Surat Undangan | Detail Surat, Disposisi, Tindak Lanjut |
| Jadwal Internal | Pemesanan Ruang, Notifikasi Peserta |
| Notulensi | Menu Notulensi Rapat |
| Dashboard | Widget Agenda di Beranda |

---

*Dokumen selanjutnya: [Panduan 08 — Arsip Digital](./08-arsip.md)*
