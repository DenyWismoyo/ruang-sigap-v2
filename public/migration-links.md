# Daftar Tautan Migrasi Sub-Collections per OPD

Dokumen ini berisi daftar tautan (URL) untuk memicu fungsi migrasi data lama ke arsitektur `sub-collections` per-OPD. Pastikan Anda menjalankan tautan-tautan ini secara berurutan dan menunggu proses sebelumnya selesai sebelum melanjutkan ke yang berikutnya.

## Tautan Migrasi:

1. **Migrasi Surat:**
   [Eksekusi Migrasi Surat](https://manualmigratetosubcollections-uxpbzzw5iq-et.a.run.app?key=MIGRASI_AMAN_123&collection=surat)

2. **Migrasi Disposisi:**
   [Eksekusi Migrasi Disposisi](https://manualmigratetosubcollections-uxpbzzw5iq-et.a.run.app?key=MIGRASI_AMAN_123&collection=disposisi)

3. **Migrasi Tugas:**
   [Eksekusi Migrasi Tugas](https://manualmigratetosubcollections-uxpbzzw5iq-et.a.run.app?key=MIGRASI_AMAN_123&collection=tugas)

4. **Migrasi Jadwal Rapat:**
   [Eksekusi Migrasi Jadwal Rapat](https://manualmigratetosubcollections-uxpbzzw5iq-et.a.run.app?key=MIGRASI_AMAN_123&collection=jadwalTempat)

5. **Migrasi Draf Persetujuan:**
   [Eksekusi Migrasi Draf Persetujuan](https://manualmigratetosubcollections-uxpbzzw5iq-et.a.run.app?key=MIGRASI_AMAN_123&collection=drafPersetujuan)

6. **Migrasi Tindak Lanjut:**
   [Eksekusi Migrasi Tindak Lanjut](https://manualmigratetosubcollections-uxpbzzw5iq-et.a.run.app?key=MIGRASI_AMAN_123&collection=tindakLanjut)

## Parameter Opsional:
Anda juga dapat menambahkan parameter tambahan pada URL di atas:
- `&dryRun=true` : Melakukan simulasi tanpa benar-benar menulis ke database.
- `&limit=500&offset=0` : Melakukan migrasi secara parsial (paginasi) jika dokumen sangat besar.
