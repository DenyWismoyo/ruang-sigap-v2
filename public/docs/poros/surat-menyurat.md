# Modul Surat Menyurat Poros

Modul ini bertanggung jawab atas aliran persuratan dari masuk hingga keluar, serta pengarsipannya.

## 1. Surat Masuk & Disposisi
- **Fungsi Utama**: Mengelola surat yang masuk ke institusi dan mendistribusikannya (Disposisi) dari pimpinan ke bawahan.
- **Alur**:
  1. Staf TU / Admin meregistrasi surat baru.
  2. Surat masuk ke akun pimpinan (Ruang Kerja).
  3. Pimpinan memberikan *Instruksi Disposisi* (bisa diketik manual atau menggunakan templat cepat) kepada satu atau beberapa bawahan.
  4. Bawahan menerima, mengonfirmasi, dan menindaklanjuti.
- **Tindak Lanjut Mandiri**: Pimpinan dapat menekan fitur "Tindak Lanjuti Sendiri" (*Self-Action*) jika surat tidak perlu didisposisikan ke bawah.

## 2. Surat Keluar & Persetujuan Draf
- **Fungsi Utama**: Proses penyusunan surat dari institusi ke pihak luar.
- **Alur**:
  1. Staf mengajukan *Draf Surat Keluar*.
  2. Surat naik secara berjenjang untuk *Review* (Tinjauan). Jika salah, draf bisa dikembalikan dengan catatan revisi.
  3. Setelah draf final, pimpinan membubuhkan TTE (Tanda Tangan Elektronik) jika diperlukan.
  4. Surat Keluar siap dikirim / diterbitkan.

## 3. Arsip & Rekapitulasi
- **Fungsi Utama**: Penyimpanan jangka panjang dan pencarian surat.
- **Fitur**:
  - Rekapitulasi jumlah surat masuk dan keluar per bulan/tahun (Dashboard Statistik).
  - Pencarian cepat menggunakan filter nomor surat, perihal, atau tanggal.
  - Surat yang "Diarsipkan" tidak akan mengganggu feed utama.
