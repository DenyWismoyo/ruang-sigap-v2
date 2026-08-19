# Panduan 02 — Kotak Masuk & Manajemen Surat

> Menu: **Surat / Kotak Masuk** | Path: `/dashboard/poros/surat`

---

## Apa Itu Menu Surat?

Menu Surat adalah **pusat manajemen seluruh surat masuk** yang diterima oleh OPD Anda. Di sinilah Staf TU menginput surat, dan di sinilah seluruh riwayat surat dapat dilihat, difilter, dan dipantau progresnya.

---

## Tampilan Halaman Surat

Halaman ini memiliki dua panel yang bekerja berdampingan (Split View):

```
+----------------------------------+----------------------------------+
|  PANEL KIRI: DAFTAR SURAT        |  PANEL KANAN: PREVIEW SURAT     |
|                                  |                                  |
|  [Filter & Pencarian]            |  (Tampil setelah klik surat)     |
|                                  |                                  |
|  > Surat A — Baru                |  Nomor: 001/PD/2026              |
|  > Surat B — Proses TL           |  Perihal: ...                    |
|  > Surat C — Selesai             |  [Preview PDF]                   |
|  > Surat D — Didisposisikan      |  [Tab: Detail | Tindak Lanjut]  |
|  ...                             |                                  |
+----------------------------------+----------------------------------+
```

Di tampilan mobile, tampilan berubah menjadi full-screen list dan detail bergantian.

---

## Filter & Pencarian Surat

### Tab Filter Status

| Tab | Surat yang Ditampilkan |
|-----|------------------------|
| **Semua** | Seluruh surat (kecuali yang Diarsipkan) |
| **Baru** | Surat yang baru masuk, belum ada disposisi |
| **Proses Tindak Lanjut** | Sedang dikerjakan oleh pelaksana |
| **Selesai** | Surat yang telah selesai diproses |
| **Pemantauan** | Tab khusus untuk memantau disposisi & progres |

### Kolom Pencarian & Filter Lanjutan

- **Cari:** Pencarian teks bebas berdasarkan perihal, nomor surat, atau pengirim (dengan debounce agar tidak memberatkan sistem)
- **Jenis Surat:** Filter berdasarkan Undangan / Pemberitahuan / Permohonan / Lainnya
- **Klasifikasi:** Filter berdasarkan Biasa / Penting / Segera / Rahasia
- **Status:** Filter berdasarkan status penyelesaian

---

## Cara Menginput Surat Baru

> **Hak Akses:** Staf TU, Admin OPD, atau Pimpinan

### Langkah-langkah:

1. Klik tombol **"+ Input Surat"** atau ikon tambah di kanan atas
2. Dialog input surat akan terbuka
3. Isi formulir surat:

| Field | Keterangan | Wajib? |
|-------|------------|--------|
| **Nomor Surat** | Nomor resmi surat dari pengirim | Ya |
| **Perihal** | Pokok/isi singkat surat | Ya |
| **Pengirim** | Instansi/nama pengirim surat | Ya |
| **Tanggal Surat** | Tanggal yang tertera di surat | Ya |
| **Tanggal Diterima** | Tanggal surat diterima OPD | Ya |
| **Klasifikasi** | Biasa / Penting / Segera / Rahasia | Ya |
| **Jenis Surat** | Undangan / Pemberitahuan / Permohonan / Lainnya | Ya |
| **Tujuan Jabatan** | Jabatan yang dituju (opsional, untuk surat khusus) | Tidak |
| **Upload File** | Scan/foto surat (PDF, JPG, PNG) | Disarankan |

4. **Jika Jenis Surat = Undangan**, isi detail agenda:
   - Tanggal & Waktu Kegiatan
   - Lokasi Kegiatan

5. Klik **"Simpan"** untuk menyimpan surat

> **Otomasi Setelah Simpan:**
> - Surat langsung muncul di Ruang Kerja pimpinan (status: Baru)
> - Jika ada detail agenda, otomatis muncul di halaman Agenda Harian
> - Push notification dikirim ke pimpinan yang relevan

---

## Detail Surat & Riwayat Disposisi

Setelah mengklik surat dari daftar, panel kanan akan menampilkan:

### Tab "Detail Surat"

- **Informasi Umum:** Nomor, perihal, pengirim, tanggal, klasifikasi
- **Preview File:** Tampilan langsung dokumen PDF/gambar surat
- **Ringkasan Eksekutif AI:** Ringkasan otomatis oleh AI (jika fitur diaktifkan)
- **Riwayat Aktivitas:** Timeline setiap tindakan yang dilakukan pada surat ini
- **Informasi Disposisi:** Dikirim dari siapa, kepada siapa, instruksi apa

### Tab "Tindak Lanjut"

Menampilkan semua laporan tindak lanjut yang sudah dikirim oleh pelaksana untuk surat ini, termasuk:
- Judul laporan
- Isi laporan
- Tanggal laporan
- Warna label (kode prioritas)
- Checklist yang telah diselesaikan
- File lampiran (link Google Drive)

---

## Status Surat dan Artinya

| Status | Warna | Artinya |
|--------|-------|---------|
| **Baru** | Kuning | Surat baru masuk, belum ada disposisi |
| **Didisposisikan** | Biru | Pimpinan sudah mendisposisikan, pelaksana belum mengakui terima |
| **Proses Tindak Lanjut** | Oranye | Pelaksana sudah menerima dan sedang mengerjakan |
| **Selesai** | Hijau | Semua pihak sudah menyelesaikan tindak lanjut |
| **Diarsipkan** | Abu-abu | Surat telah diarsipkan (tidak muncul di daftar aktif) |
| **Revisi Disposisi** | Merah muda | Disposisi dikembalikan dan perlu direvisi |

---

## Klasifikasi Surat

| Klasifikasi | Keterangan |
|-------------|------------|
| **Biasa** | Surat rutin tanpa urgency khusus |
| **Penting** | Memerlukan perhatian khusus pimpinan |
| **Segera** | Harus ditindaklanjuti dalam waktu singkat |
| **Rahasia** | Dokumen sensitif, akses terbatas |

---

## Aksi Lain pada Surat

Klik ikon tiga titik (**...**) pada surat untuk opsi tambahan:

| Aksi | Keterangan | Siapa yang bisa |
|------|------------|-----------------|
| **Lihat Detail** | Buka detail surat di halaman penuh | Semua |
| **Salin Nomor Surat** | Menyalin nomor surat ke clipboard | Semua |
| **Arsipkan** | Memindahkan surat ke arsip | Pimpinan, Admin |
| **Buka di Tab Baru** | Membuka file asli surat | Semua |
| **Tandai Warna** | Memberi warna label prioritas | Semua |

---

## Tab Pemantauan (Khusus Pimpinan/Admin)

Tab ini menampilkan **status disposisi real-time** untuk setiap surat:

- Daftar siapa yang sudah/belum menerima disposisi
- Status "Diterima" vs "Menunggu Acknowledge"
- Laporan tindak lanjut per pelaksana
- Indikator keterlambatan (overdue)

---

## Tips Penggunaan Optimal

> **Tips 1:** Gunakan kolom pencarian untuk menemukan surat dengan cepat. Sistem mendukung pencarian berdasarkan nomor surat, perihal, atau nama pengirim.

> **Tips 2:** Gunakan filter "Klasifikasi: Segera" di hari kerja untuk memprioritaskan surat yang butuh respons cepat.

> **Tips 3:** Pastikan surat undangan diinput dengan mengisi detail agenda (tanggal, jam, lokasi) agar otomatis muncul di Agenda Harian seluruh penerima disposisi.

> **Tips 4:** Klik ikon bintang/warna pada surat untuk menandai surat penting agar mudah ditemukan kembali.

---

## Integrasi dengan Fitur Lain

| Dari Surat | Menghasilkan |
|------------|-------------|
| Input surat jenis Undangan | Agenda Harian otomatis |
| Kirim disposisi | Item di Ruang Kerja penerima |
| Laporan tindak lanjut | Entri Logbook + Bukti Kinerja |
| Selesaikan surat | Masuk ke Arsip |

---

*Dokumen selanjutnya: [Panduan 03 — Ruang Kerja & Disposisi](./03-ruang-kerja-disposisi.md)*
