# Panduan Manajemen Role & Jabatan (Struktur Multi-OPD)

Dokumen ini menjelaskan bagaimana mekanisme Hierarki Jabatan berjenjang berfungsi di SIGAP v2, khususnya untuk memfasilitasi komunikasi vertikal dari **Kepala Daerah** hingga ke level **Sub-OPD (UPTD/Kelurahan)** tanpa merusak struktur administratif OPD.

## 1. Konsep Dasar "Level Jabatan"
Pondasi utama pergerakan _Disposisi_ lintas OPD berada pada nilai **Level** yang disematkan pada setiap _Jabatan_.
Semakin KECIL angkanya, semakin TINGGI kedudukannya.
- **Level 1**: Pimpinan Puncak Daerah (Bupati, Walikota, Gubernur)
- **Level 2**: Sekretaris Daerah (Sekda)
- **Level 3**: Kepala Instansi / Eselon II (Kepala Dinas, Kepala Badan, Inspektur, Kasatpol PP, Camat)
- **Level 4**: Eselon III (Sekretaris Dinas, Kepala Bidang, Camat (jika di-set 4), Lurah)
- **Level 5**: Eselon IV (Kepala Seksi, Kasubbag)
- **Level 9 (Default)**: Staf Pelaksana

> [!TIP]
> **Aturan Emas:** Sistem akan secara otomatis mengizinkan seorang Pimpinan mendisposisikan surat ke pejabat lain asalkan pejabat tujuan tersebut **berada di bawahnya (Levelnya lebih besar)**, sesuai aturan relasi OPD-nya.

---

## 2. Relasi Global vs Relasi OPD Induk-Sub
SIGAP v2 menggunakan 2 lapis kecerdasan (_fetcher_) untuk mengambil daftar bawahan saat Pimpinan menekan tombol "Disposisi":

### A. Kecerdasan Global (Lintas OPD)
Ini adalah "Hak Istimewa" yang **HANYA** dimiliki oleh **Level 1** dan **Level 2**.
- Jika Anda adalah **Bupati (Level 1)**, sistem otomatis menarik seluruh pejabat **Level 2** dan **Level 3** se-kabupaten/kota tanpa mempedulikan mereka berada di OPD mana. Bupati bisa langsung disposisi ke Sekda atau ke Kadis Kesehatan.
- Jika Anda adalah **Sekda (Level 2)**, sistem otomatis menarik seluruh pejabat **Level 3** (Kepala Dinas, Kaban, Camat) di seluruh Kabupaten/Kota. Sekda bisa langsung disposisi ke Kadis, meskipun Dinas Kesehatan BUKAN merupakan "Sub-OPD" dari Setda secara administratif.
- Kepala Bagian (Kabag) di lingkungan Setda akan tetap muncul sebagai bawahan Sekda, karena berada di dalam satu OPD (Setda) dengan level lebih rendah dari Sekda.

### B. Kecerdasan OPD Induk-Sub (Struktural)
Ini berlaku untuk seluruh Pimpinan (Mulai dari Level 3 ke bawah).
- Jika Anda adalah **Camat (Level 3)**, Anda HANYA akan melihat bawahan di dalam struktur Anda sendiri, yaitu:
  1. Bawahan di OPD Kecamatan yang sama (misal: Sekcam, Kasi).
  2. Pimpinan tertinggi dari Sub-OPD yang terkait langsung (misal: Kepala Kelurahan, jika Kelurahan di-setting dengan `idOpdInduk = ID_Kecamatan`).
- Jika Anda adalah **Kadis (Level 3)**, Anda HANYA melihat bawahan di Dinas Anda (Sekdis, Kabid) dan pimpinan Sub-OPD Anda (misal: Kepala UPTD Puskesmas, jika `idOpdInduk` UPTD mengarah ke Dinas).

> [!CAUTION]
> Jangan mengatur Dinas Kesehatan sebagai "Sub-OPD" dari Setda. Dinas Kesehatan harus menjadi "OPD Induk" mandiri. Komunikasi Sekda -> Kadis sudah dijamin oleh Kecerdasan Global (Level 2 -> Level 3), bukan relasi Induk-Sub.

---

## 3. Cara Konfigurasi (Best Practice)

### Skenario 1: Sekretariat Daerah (Setda)
1. **OPD**: Buat "Sekretariat Daerah" sebagai OPD Induk.
2. **Jabatan Pimpinan**: Buat jabatan "Sekretaris Daerah" dan set **Level 2**.
3. **Jabatan Bawahan**: Buat jabatan "Kepala Bagian Hukum", "Kepala Bagian Umum", dsb di dalam OPD Setda, dan set **Level 3**.
4. _Hasil:_ Sekda (Level 2) otomatis melihat Kabag Hukum (Level 3) sebagai bawahan internalnya, DAN melihat seluruh Kadis (Level 3) se-kabupaten sebagai bawahan lintas-OPD nya.

### Skenario 2: Dinas & UPTD
1. **OPD Dinas**: Buat "Dinas Kesehatan" sebagai **OPD Induk**.
2. **OPD UPTD**: Buat "Puskesmas Maju Jaya" sebagai **Sub-OPD**, lalu pilih "Dinas Kesehatan" sebagai OPD Induknya.
3. **Jabatan Dinas**: Buat "Kepala Dinas Kesehatan" di Dinas Kesehatan, set **Level 3**.
4. **Jabatan UPTD**: Buat "Kepala Puskesmas" di OPD Puskesmas, set **Level 4**.
5. _Hasil:_ Kepala Dinas (Level 3) dapat mendisposisi ke Kepala Puskesmas (Level 4) berkat relasi struktural Induk-Sub.

### Skenario 3: Kecamatan & Kelurahan
1. **OPD Camat**: Buat "Kecamatan A" sebagai **OPD Induk**.
2. **OPD Lurah**: Buat "Kelurahan B" sebagai **Sub-OPD**, pilih "Kecamatan A" sebagai OPD Induk.
3. **Jabatan**: Camat = Level 3. Lurah = Level 4.
4. _Hasil:_ Camat dapat mendisposisi ke Lurah. Lurah dapat meneruskan ke Kasi Kelurahan (Level 5).

---

## 4. Kesimpulan
Dengan arsitektur hybrid ini (Global Level Fetching + Structural Sub-OPD Fetching), SIGAP v2 berhasil mereplikasi alur birokrasi Pemerintahan Daerah secara sempurna, di mana koordinasi lintas instansi (Bupati -> Kadis, Sekda -> Kadis) dimungkinkan, sekaligus menjaga batas administratif masing-masing instansi tetap independen dan modular.
