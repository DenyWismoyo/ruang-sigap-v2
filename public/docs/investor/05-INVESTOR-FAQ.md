# INVESTOR FAQ — RUANG SIGAP
## Pertanyaan yang Paling Sering Diajukan oleh Investor

> Dokumen ini adalah panduan jawaban untuk pertanyaan investor.
> Gunakan sebagai referensi persiapan Q&A session, bukan dibaca kata per kata.

---

## BAGIAN 1: PERTANYAAN TENTANG PRODUK & TEKNOLOGI

---

### Q1: Apa yang membuat RUANG SIGAP berbeda dari aplikasi surat biasa atau SRIKANDI?

**Jawaban Singkat:**
> "Kami bukan aplikasi surat. Kami adalah platform manajemen alur kerja yang terintegrasi,
> dengan AI, real-time notification, dan E-Kinerja otomatis."

**Jawaban Detail:**
Ada tiga hal yang fundamental berbeda:

**Pertama: Filosofi "1 Input → 5 Output"**
Aplikasi surat biasa berhenti setelah surat diinput. RUANG SIGAP menggunakannya
sebagai trigger untuk 5 hal otomatis: agenda, disposisi, logbook, E-kinerja, arsip.
Ini bukan fitur tambahan — ini arsitektur yang didesain dari awal.

**Kedua: AI yang Dikontekstualisasi**
AI scan kami bukan OCR generik. Kami membangun prompt engineering khusus untuk
format surat dinas pemerintah Indonesia: cara penulisan perihal, identifikasi instansi
pengirim (bukan nama pejabat), deteksi detail agenda. Hasilnya: akurasi jauh lebih tinggi
dari solusi OCR umum.

**Ketiga: E-Kinerja yang Benar-benar Otomatis**
SRIKANDI dan aplikasi surat lain tidak menghasilkan bukti kinerja.
RUANG SIGAP otomatis membuat logbook harian dari setiap aksi, dan mengkompilasinya
menjadi rekap kinerja bulanan yang bisa diunduh atau diupload ke Google Drive.
Ini adalah fitur yang paling membuat user tidak mau pindah.

---

### Q2: Seberapa akurat AI scan suratnya?

**Jawaban:**
Dalam pengujian kami dengan surat dinas pemerintah standar Indonesia:
- Nomor surat: >98% akurasi
- Perihal surat: >92% akurasi (dengan enrichment jika terlalu singkat)
- Pengirim (nama instansi): >95% akurasi
- Tanggal surat: >99% akurasi
- Detail agenda (untuk surat undangan): >88% akurasi

Kasus yang menurunkan akurasi: surat dengan tulisan tangan, cap yang overlap dengan teks,
atau format surat yang sangat non-standar. Untuk kasus ini, staf tetap bisa edit manual
dengan waktu yang jauh lebih singkat dari input manual penuh.

Model yang digunakan: Google Gemini 2.5 Flash Lite — dipilih karena balance antara
akurasi, kecepatan (3-5 detik), dan biaya per call yang efisien.

---

### Q3: Bagaimana dengan keamanan data pemerintah?

**Jawaban:**
Ini adalah pertanyaan yang selalu kami antisipasi, dan jawabannya adalah prioritas nomor satu kami.

Arsitektur keamanan kami:
1. **Isolasi data penuh** — Setiap OPD hanya bisa mengakses datanya sendiri, dijamin di level query (Firestore Security Rules), bukan hanya policy
2. **Enkripsi** — Data terenkripsi saat transit (TLS 1.3) dan saat disimpan (AES-256 by Google)
3. **Infrastruktur Google Cloud** — Data center region asia-southeast2 (Jakarta), standar keamanan Google
4. **Firebase Auth + JWT** — Custom claims dengan level akses yang sangat granular
5. **Audit trail** — Setiap akses dan perubahan data tercatat

Roadmap compliance: ISO 27001, PDPA Indonesia, dan integrasi dengan BSSN jika diperlukan untuk enterprise deal.

---

### Q4: Apa tech stack-nya dan apakah bisa scale?

**Jawaban:**
Stack yang kami gunakan dipilih secara spesifik untuk scale:

**Frontend:** Next.js 15 (App Router) + React 18 + TypeScript
- Server-side rendering untuk SEO dan performance
- PWA untuk offline support

**Backend:** Firebase Cloud Functions v2 (di atas Google Cloud Run)
- Serverless: scale otomatis dari 0 ke ribuan concurrent users
- Tidak perlu manage server, cost hanya saat ada traffic

**Database:** Firestore (Google Cloud)
- Real-time sync built-in
- Scale horizontal otomatis
- Digunakan oleh Duolingo, NYT, dan ratusan startup dengan jutaan user

**AI:** Google Generative AI (Gemini 2.5 Flash Lite)
- API-based, scale dengan usage
- Rate limiting yang bisa dikonfigurasi per OPD

Arsitektur ini bisa melayani 100.000 concurrent users dengan perubahan konfigurasi minimal.
Biaya infrastruktur scale secara linear, bukan eksponensial.

---

### Q5: Apa risikonya jika Google/Firebase menaikkan harga atau tutup layanan?

**Jawaban:**
Risiko vendor lock-in ini adalah pertanyaan yang valid. Strategi mitigasi kami:

1. **Firestore → PostgreSQL migration layer** sudah didesain. Semua query abstracted melalui service layer yang bisa di-swap
2. **Cloud Functions → Container** mudah dimigrasikan ke Cloud Run langsung atau Kubernetes
3. **Next.js** adalah open source dan bisa di-deploy di hosting manapun (Vercel, AWS, self-hosted)
4. **Google AI API** bisa diganti dengan OpenAI atau model self-hosted jika diperlukan

Timeline migrasi penuh jika diperlukan: estimasi 3-6 bulan dengan tim yang ada.

---

## BAGIAN 2: PERTANYAAN TENTANG BISNIS & PASAR

---

### Q6: Kenapa baru sekarang? Apakah ini masalah yang baru muncul?

**Jawaban:**
Masalahnya sudah ada puluhan tahun. Yang baru adalah:

**1. Regulasi yang memaksa** — SPBE (PP 95/2018) baru benar-benar dieksekusi secara serius sejak 2022-2023, dengan evaluasi formal dari KemenPAN-RB

**2. Ketersediaan teknologi yang terjangkau** — AI seperti Gemini yang bisa baca surat baru available secara komersial dengan harga yang masuk akal sejak 2023

**3. Momentum digital post-COVID** — Birokrasi sudah terbiasa dengan tools digital setelah WFH 2020-2021

**4. Generasi baru ASN** — Milenial yang masuk birokrasi menuntut tools yang lebih baik dan menjadi champion internal

Jadi timing ini bukan kebetulan — ini adalah intersection dari regulatory push, tech readiness, dan cultural shift.

---

### Q7: Bagaimana cara menjual ke pemerintah? Bukankah prosesnya sangat lambat?

**Jawaban:**
Benar bahwa pengadaan formal pemerintah bisa memakan 6-18 bulan. Tapi ada workaround yang kami gunakan:

**Strategi Hibrid yang Sudah Terbukti:**

**Track 1: Bottom-Up (Cepat, 1-3 bulan)**
Mulai dari satu unit kerja atau Kepala Dinas yang merasakan pain langsung.
Mereka bisa approve penggunaan dari anggaran operasional mereka sendiri (bukan APBD formal).
Trial gratis → paid subscription dalam hitungan bulan.

**Track 2: SKPD-Level (Menengah, 3-6 bulan)**
Setelah 1 OPD berhasil, mereka present ke Sekda atau Bupati.
Pengadaan via mekanisme pengadaan langsung (dibawah 200 juta tidak perlu tender).

**Track 3: e-Katalog LKPP (Lambat tapi masif, 12-24 bulan setup)**
Setelah terdaftar, setiap OPD di Indonesia bisa langsung membeli tanpa proses tender.
Ini adalah cheat code distribusi GovTech.

**Insight penting:** Setelah 1 OPD berhasil di satu kabupaten, pipeline ke OPD lain jauh lebih mudah karena referensi internal sangat kuat di birokrasi.

---

### Q8: Bagaimana kalau pemerintah membangun sistem sendiri?

**Jawaban:**
Ini sudah pernah terjadi dan justru menguntungkan kami.

SRIKANDI adalah contoh: dibangun pemerintah pusat selama bertahun-tahun, dibagikan gratis, tapi **adopsinya sangat rendah** karena UI buruk, tidak ada mobile support, dan tidak ada AI.

**Kenapa pemerintah tidak bisa membangun sendiri yang setara?**
1. **Kecepatan iterasi** — Pemerintah butuh 2-3 tahun untuk satu siklus pengembangan. Kami release fitur setiap sprint.
2. **Talent gap** — Developer yang bisa build AI + real-time + PWA tidak banyak yang mau kerja di pemerintah
3. **Biaya maintenance** — Setelah dibangun, siapa yang maintain? Kontraktor berubah setiap tahun.
4. **Kontekstualisasi AI** — Prompt engineering yang baik butuh iterasi dengan domain expert, tidak bisa "selesai sekali buat selamanya"

**Fakta:** SRIKANDI yang gratis pun tidak menggantikan kebutuhan akan solusi yang lebih baik. Pengguna tetap memilih tools yang benar-benar bekerja.

---

### Q9: Apa yang terjadi jika BUMN atau pemain besar membangun solusi serupa?

**Jawaban:**
Ini adalah risiko yang nyata dan kami persiapkan dengan serius.

**Moat yang melindungi kami:**

1. **Data flywheel** — Setiap OPD yang sudah 1 tahun di platform punya histori logbook dan E-Kinerja yang tidak bisa dipindahkan. Switching cost sangat tinggi.

2. **Domain expertise** — Membangun prompt AI yang akurat untuk surat pemerintah Indonesia butuh **ratusan iterasi dengan domain expert**. Tidak bisa dibeli begitu saja.

3. **Relationship capital** — Kepercayaan birokrat tidak dibangun oleh brand besar, tapi oleh referensi sesama. Jaringan yang sudah kami bangun tidak bisa di-replicate dengan uang.

4. **Speed of iteration** — Kami bisa pivot dan release dalam minggu. BUMN butuh berbulan-bulan untuk approval internal.

**Strategi menghadapi Big Player:**
Justru menjadi acquisition target bagi mereka adalah salah satu exit scenario yang kami targetkan. Mereka lebih efisien mengakuisisi kami daripada membangun dari nol.

---

### Q10: Bagaimana kalau pemerintah membuat regulasi yang mewajibkan pakai sistem tertentu?

**Jawaban:**
Ini justru skenario yang paling kami inginkan — asalkan RUANG SIGAP ada di dalam sistem yang diwajibkan.

Strategi kami untuk posisi ini:
1. **Masuk e-Katalog LKPP** — Menjadi vendor resmi pemerintah
2. **Compliance dengan semua standar SPBE** — Integrasi dengan portal nasional jika diminta
3. **Aktif di forum GovTech** — Bangun hubungan dengan pembuat regulasi sebelum regulasi keluar
4. **White-label offering** — Jika Kementerian ingin sistem nasional dengan nama mereka, kami bisa provide teknologinya

**Best case:** Kementerian memilih RUANG SIGAP sebagai platform standar nasional → distribusi ke 18.000+ OPD tanpa biaya sales.

---

## BAGIAN 3: PERTANYAAN TENTANG FINANSIAL & INVESTASI

---

### Q11: Berapa burn rate-nya sekarang dan kapan break-even?

**Jawaban:**
[ISI DENGAN DATA AKTUAL]

**Framework jawaban:**
> "Burn rate saat ini adalah Rp [X] juta/bulan, di mana [X]% untuk salary tim dan [Y]% untuk infrastruktur.
> Dengan funding yang kami cari, runway kami adalah [18/24] bulan.
> Break-even target di bulan ke-[X] setelah funding, bersamaan dengan target [X] OPD aktif.
> Pada titik itu, revenue dari subscription cukup untuk cover operational cost."

---

### Q12: Apa metrik utama yang Anda track?

**Jawaban:**
Kami focus pada 5 North Star Metrics:

1. **ARR (Annual Recurring Revenue)** — Revenue yang berulang dan predictable
2. **Net Revenue Retention (NRR)** — Apakah customer yang ada spend lebih dari tahun ke tahun? (Target: >110%)
3. **Churn Rate** — Berapa persen OPD yang berhenti berlangganan per tahun? (Target: <5%)
4. **DAU/MAU Ratio** — Seberapa aktif pengguna dalam OPD yang berlangganan? (Target: >60%)
5. **Gross Margin** — Profitabilitas setelah cost infrastruktur (Target: >75%)

**Leading indicators:**
- Jumlah surat yang diproses per bulan (product usage)
- Jumlah disposisi yang dikirim (core workflow adoption)
- % pengguna yang generate rekap logbook bulanan (E-Kinerja adoption = stickiness)

---

### Q13: Apa exit strategy-nya?

**Jawaban:**
Kami melihat 3 jalur exit yang realistis, berurutan dari yang paling mungkin:

**1. Akuisisi oleh BUMN Teknologi (Most Likely, 3-5 tahun)**
Telkom Group (melalui TelkomSigma atau PT Metra Digital), Indosat IDA, atau BUMN lain
yang sedang membangun portofolio GovTech. Mereka memiliki distribusi tapi tidak punya product.
Kami memiliki product tapi butuh distribusi. Fit sempurna.
Expected multiple: 8-15x ARR

**2. Akuisisi oleh GovTech Regional (ASEAN, 4-6 tahun)**
Setelah membuktikan model di Indonesia, menjadi menarik untuk pemain regional seperti
Govtech Edu (Singapore), atau investor PE yang fokus di GovTech ASEAN.
Expected multiple: 12-20x ARR

**3. IPO di BEI (Long-term, 7-10 tahun)**
Jika pertumbuhan organik terus kuat dan market leadership terbukti.
Contoh analog: tidak ada pure-play GovTech SaaS yang IPO di BEI, tapi ini adalah
first mover opportunity.

**Catatan untuk investor:**
Timeline exit bisa dipercepat signifikan jika ada provincial/national deal yang besar
karena itu akan mendorong valuasi naik drastis.

---

### Q14: Bagaimana struktur cap table saat ini?

**Jawaban:**
[ISI DENGAN DATA AKTUAL — sesuai situasi real]

**Template jawaban:**
> "Saat ini [X]% dimiliki oleh founder team dan [Y]% sudah dialokasikan untuk ESOP.
> Tidak ada hutang signifikan dan tidak ada investor sebelumnya.
> Raise ini akan mendilusi [Z]% dari total saham.
> Detail cap table tersedia setelah penandatanganan NDA."

---

### Q15: Kenapa tidak bootstrapped saja?

**Jawaban:**
Bootstrapping adalah pilihan yang valid untuk SaaS yang bisa tumbuh organik.
Tapi GovTech memiliki karakteristik yang membutuhkan kapital:

1. **Sales cycle yang panjang** — 1-6 bulan tanpa revenue dari pipeline yang sedang diproses
2. **Onboarding yang intensive** — Setiap OPD baru butuh training dan pendampingan
3. **Enterprise deal yang membutuhkan credibility** — Untuk masuk Provinsi atau Kementerian, ada ekspektasi tentang ukuran dan kapasitas company
4. **Window of opportunity yang terbatas** — Momentum regulasi dan market awareness tidak menunggu
5. **Talent yang kompetitif** — Untuk merekrut senior developer dan sales yang berpengalaman di GovTech, gaji harus kompetitif

**Bootstrapping** membuat kami tumbuh 2-5x lebih lambat di market yang memiliki first-mover advantage besar.

---

## BAGIAN 4: PERTANYAAN TENTANG TIM & VISI

---

### Q16: Apa yang membuat tim ini yang tepat untuk menyelesaikan masalah ini?

**Jawaban (sesuaikan dengan latar belakang aktual tim):**

Template:
> "Kami memahami masalah ini bukan dari luar, tapi dari dalam.
>
> [Founder 1] pernah [pengalaman relevan di pemerintahan atau bekerja dengan pemerintah]
> sehingga memahami secara mendalam pain point yang kami coba selesaikan.
>
> [Founder 2] memiliki background [X tahun] di software engineering dengan
> track record membangun sistem yang scale.
>
> Yang membuat kami uniquely positioned adalah kombinasi:
> - Domain expertise birokrasi Indonesia (bukan asumsi — pengalaman langsung)
> - Technical capability untuk build AI-powered platform
> - Network di ekosistem pemerintahan untuk distribusi
>
> Masalah ini tidak bisa diselesaikan oleh developer yang pintar tapi tidak paham birokrasi,
> atau birokrat yang paham masalah tapi tidak bisa build product."

---

### Q17: Apa visi jangka panjangnya?

**Jawaban:**
> "Visi kami: menjadi operating system untuk pemerintah daerah Indonesia.
>
> Dalam 5 tahun pertama, kami fokus pada administrasi persuratan dan kinerja ASN —
> karena ini adalah entry point yang paling universal dan paling menyakitkan.
>
> Tapi platform ini adalah fondasi untuk layer yang lebih besar:
>
> **Layer 1 (sekarang):** Administrasi & workflow internal OPD
> **Layer 2 (2-3 tahun):** Keuangan, aset, pelayanan publik — semua modul terintegrasi
> **Layer 3 (3-5 tahun):** Data layer antar OPD, analitika kinerja lintas instansi untuk gubernur
> **Layer 4 (5+ tahun):** Citizen-facing services — satu platform untuk warga berinteraksi dengan pemerintah daerah mereka
>
> Kalau visi ini tercapai, kita bicara tentang platform yang menyentuh kehidupan sehari-hari
> 270 juta orang Indonesia melalui pemerintah daerah mereka."

---

*CONFIDENTIAL — Dokumen ini untuk keperluan investor due diligence saja.*
*Jawaban-jawaban di atas perlu disesuaikan dengan data aktual sebelum digunakan dalam pertemuan investor.*
