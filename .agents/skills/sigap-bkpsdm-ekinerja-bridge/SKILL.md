---
name: sigap-bkpsdm-ekinerja-bridge
description: Standar integrasi jembatan e-Kinerja BKPSDM Surakarta (Kepwal 786/154/2020), master 152 aktivitas ASN, dan bookmarklet browser 1-klik untuk pengisian otomatis form kegiatan harian.
---

# BKPSDM Surakarta e-Kinerja Bridge Pipeline

```
Dasar Hukum   : Keputusan Walikota Surakarta Nomor 786/154 Tahun 2020
Master Data   : src/data/masterAktivitasSolo.ts (152 Aktivitas Resmi)
Bridge Lib    : src/lib/ekinerjaBookmarklet.ts
UI Components : src/components/ekinerja/AktivitasCombobox.tsx, src/components/ekinerja/EkinerjaBridgeModal.tsx
Target Portal : e-Kinerja v4 BKPSDM Surakarta (http://103.115.227.196/e-kinerja/v4/)
```

---

## 🏛️ Latar Belakang & Kebutuhan

Aparatur Sipil Negara (ASN) di lingkungan Pemerintah Kota Surakarta diwajibkan mencatatkan aktivitas kinerja harian ke portal **e-Kinerja v4 BKPSDM**.
Agar pengguna tidak perlu mengetik ulang uraian pekerjaan dan mencari tautan Google Drive secara manual:
1. Setiap bukti kinerja di **RUANG SIGAP** dan **POROS** ditautkan ke salah satu dari **152 Master Aktivitas Resmi Kepwal 786/154/2020**.
2. File bukti yang sudah tersimpan di Google Drive pengguna langsung terhubung sebagai **URL Bukti Dukung**.
3. Tombol **"⚡ Siapkan e-Kinerja"** memetakan seluruh data ke 8 kolom formulir BKPSDM.
4. **Chrome Bookmarklet** mengisi seluruh 8 kolom dalam 1-klik tanpa perlu ekstensi browser yang rumit.

---

## 📋 Struktur Form 8 Kolom Kegiatan Harian BKPSDM Solo

| No | Kolom di Portal BKPSDM | Tipe Input | Sumber Data RUANG SIGAP | Format / Aturan |
|:---|:---|:---|:---|:---|
| 1 | **Tgl Pelaksanaan** | Text (Datepicker) | `item.createdAt` | Format `DD/MM/YYYY` |
| 2 | **Kode Kegiatan** | Text (Readonly) | Auto / F2 | Dikelola internal portal BKPSDM |
| 3 | **Aktivitas** | Select2 Dropdown | `item.aktivitasNama` | Wajib cocok persis dengan kamus 152 aktivitas |
| 4 | **Nama Kegiatan Harian** | Input / Textarea | `item.judul` | Uraian kegiatan tugas |
| 5 | **Jam Mulai** | Time Input | `item.waktuMulai` atau jam dari `item.createdAt` (fallback: `08:00`) | Format `HH:mm` |
| 6 | **Jam Selesai** | Time Input | `item.waktuSelesai` atau `createdAt + 60m` (fallback: `09:30`) | Format `HH:mm` |
| 7 | **Kuantitas** | Number Input | Default `1` | Sesuai satuan aktivitas (Dokumen/Kegiatan/Laporan) |
| 8 | **URL Bukti Dukung** | Textarea/Input | `item.googleDriveLink` | Link sharing Google Drive dari uploader |
| - | **Catatan** | Textarea | `item.deskripsi` | Keterangan tambahan pelaksanaan tugas |

---

## ⚡ Arsitektur Bookmarklet 1-Klik

Bookmarklet menggunakan vanilla JavaScript yang berjalan di context halaman e-Kinerja BKPSDM:

```typescript
import { copyEkinerjaPayloadToClipboard, getEkinerjaBookmarkletHref } from '@/lib/ekinerjaBookmarklet';

// 1. User menekan tombol "Salin Data Form (1-Klik)" di Modal SIGAP
await copyEkinerjaPayloadToClipboard(payload);

// 2. User membuka formulir Tambah Kegiatan di e-Kinerja BKPSDM
// 3. User mengklik Bookmarklet "⚡ Isi e-Kinerja Solo" di browser
// Bookmarklet mengeksekusi:
// - Membaca JSON payload dari clipboard (atau prompt fallback jika clipboard API diblokir)
// - Mencocokkan nilai Select2 aktivitas dan memicu trigger('change')
// - Mengisi tanggal, jam, kuantitas, URL Google Drive, catatan
// - Menyorot field yang berhasil diisi dengan warna hijau (#ecfdf5)
// - Memunculkan toast sukses di pojok kanan atas layar
```

---

## 🗃️ Skema Data Firestore (`buktiKinerja`)

Saat bukti kinerja disimpan (baik manual via `bukti-kinerja/page.tsx` maupun otomatis dari tindak lanjut surat/tugas), simpan field berikut jika tersedia:

```typescript
{
  userId: string;
  opdId: string;
  judul: string;
  googleDriveLink: string;
  fileName: string;
  fileType: string;
  aktivitasId?: number;     // 1 s/d 152 sesuai masterAktivitasSolo.ts
  aktivitasNama?: string;   // Nama resmi aktivitas (contoh: "Membuat laporan")
  sumber?: 'manual' | 'laporan' | 'tugas_selesai';
  createdAt: Timestamp;
}
```

---

## 🚀 Arsitektur Visioner: SIGAP Bridge Chrome Extension (Manifest V3)

Tersedia ekstensi Chrome resmi di direktori `tools/sigap-chrome-bridge/` untuk menghubungkan tab SIGAP dan tab e-Kinerja secara **real-time cross-tab (Zero-Click)** tanpa perlu perantara clipboard atau klik tombol bookmarklet:

```
[Tab RUANG SIGAP]
      │
      │ window.postMessage({ type: 'SIGAP_BRIDGE_SEND', payload })
      ▼
[content-sigap.js]
      │
      │ chrome.runtime.sendMessage({ action: 'SEND_TO_EKINERJA', payload })
      ▼
[background.js (Service Worker)]
      │
      │ chrome.tabs.sendMessage(targetTabId, { action: 'FILL_FORM', payload, settings })
      ▼
[content-ekinerja.js (di Tab e-Kinerja BKPSDM)]
      │
      ├─ Mengisi 8 kolom form secara presisi
      ├─ Auto-Trigger [F2: Buat Kode Baru] jika kode kosong
      ├─ Auto-Select2 152 Kamus Aktivitas Solo & trigger('change')
      ├─ Animasi Glow Hijau (#ecfdf5) & Floating Toast Notifikasi
      └─ Auto-Focus ke tab e-Kinerja
```

### Cara Pemasangan:
1. Buka `chrome://extensions` di browser Chrome.
2. Aktifkan **Developer mode** di pojok kanan atas.
3. Klik **Load unpacked** dan arahkan ke folder `tools/sigap-chrome-bridge`.

---

## 🎨 Dual Tenant UI Guidelines (SIGAP vs POROS)

- **SIGAP**: Menggunakan token warna Royal Blue (`text-blue-600`, `bg-blue-600 hover:bg-blue-700`, badge `bg-blue-50 text-blue-700`).
- **POROS**: Menggunakan token warna Sovereign Teal (`text-teal-600`, `bg-teal-600 hover:bg-teal-700`, badge `bg-teal-50 text-teal-700`).
- Gunakan prop `tenant="sigap" | "poros"` pada `AktivitasCombobox` dan `EkinerjaBridgeModal` untuk konsistensi visual.

---

## 📖 Integrasi Logbook Harian Otomatis (`/dashboard/logbook`)

Setiap item aktivitas di Logbook (disposisi surat, sebar pemberitahuan, tindak lanjut, pembuatan laporan, tugas harian) kini dilengkapi tombol **"⚡ e-Kinerja"**:
1. **Auto-Mapping Tanggal**: Mengikuti tanggal kalender yang sedang aktif dipilih di Logbook.
2. **Auto-Detection Cerdas**: Fungsi `detectAktivitasFromLogbookText()` menganalisis uraian kegiatan untuk mencocokkan kode aktivitas BKPSDM secara otomatis:
   - `disposisi` → ID 79: *Mendisposisi*
   - `mengagenda` → ID 89: *Mengagenda surat masuk / keluar*
   - `konsep / telaah` → ID 123 / 92
   - `sebar / distribusi` → ID 119: *Menyampaikan / mendistribusikan surat*
   - `tindak lanjut / laporan` → ID 41: *Membuat laporan pelaksanaan tugas kedinasan lainnya*
   - `rekap / menyiapkan` → ID 150 / 142
3. **Multi-Domain Ready**: Mendukung environment `http://localhost:*`, portal web Firebase `*.web.app`, serta custom domain production `https://sgp.omnifit.cloud`.

---

## 💎 Model Lisensi & Monetisasi Fitur e-Kinerja (Mayar.id Gateway)

Fitur otomasi integrasi e-Kinerja dikelola dengan model **Add-on Personal Premium (B2C)** untuk masing-masing pegawai ASN:

### 1. Tarif & Ketentuan Layanan
- **Tarif Resmi:** **Rp 50.000,- / bulan** (atau kelipatan paket bulanan).
- **Cakupan Akses Premium:**
  - ⚡ Ekstensi Chrome SIGAP Bridge (*Zero-Click* lintas tab).
  - ⚡ Bookmarklet JavaScript 1-Klik.
  - ⚡ Auto-mapping 152 Kamus Aktivitas Kepwal 786/154/2020.
- **Fitur Tetap Gratis (Core Logbook):** Pencatatan aktivitas kerja harian, cetak laporan bulanan PDF tanda tangan basah/elektronik, penarikan histori surat disposisi & tugas, serta notulensi rapat.

### 2. Skema Data Firestore

#### A. Dokumen Pengguna (`users/{userId}`)
```typescript
interface EkinerjaSubscription {
  isActive: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  planId: 'EKINERJA_PREMIUM_MONTHLY';
  activeUntil: Timestamp;         // Tanggal kedaluwarsa akses
  lastPaidAt: Timestamp;
  lastTransactionId: string;
  amount: number;                 // 50000
}
```

#### B. Dokumen Transaksi (`transactions/{transactionId}`)
```typescript
interface EkinerjaTransaction {
  transactionId: string;          // Format: EKIN-{timestamp}-{random}
  userId: string;
  userEmail: string;
  userName: string;
  packageId: 'EKINERJA_PREMIUM_MONTHLY';
  packageName: string;
  amount: 50000;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  paymentMethod?: string;         // 'QRIS' | 'VA' | dll
  mayarTransactionId?: string;
  paymentLink?: string;
  qrCodeUrl?: string;
  quotaGranted: boolean;          // Idempotency flag
  createdAt: Timestamp;
  paidAt?: Timestamp;
}
```

### 3. Arsitektur Cloud Functions (Mayar.id)
- **`createEkinerjaPaymentInvoice` / `createDynamicQris` (Callable v2):**
  - Menggunakan secret `MAYAR_API_KEY`.
  - Menerbitkan invoice / QRIS dinamis Mayar dengan nominal Rp 50.000.
  - Menyimpan record `PENDING` di koleksi `transactions`.
- **`mayarWebhook` (HTTP onRequest v2):**
  - Menggunakan secret `MAYAR_WEBHOOK_SECRET` untuk verifikasi HMAC SHA-256 (`x-mayar-signature`).
  - Bypass event `testing` atau `ping` untuk verifikasi webhook dashboard Mayar.
  - **Atomic Transaction & Idempotency Guard:**
    - Cek status transaksi: jika sudah `PAID` atau `quotaGranted === true`, langsung abaikan (mencegah duplikasi masa aktif).
    - **Logika Perpanjangan Akumulatif (*Rollover*):**
      Jika user membayar sebelum masa aktif habis, tambahkan 30 hari dari tanggal kedaluwarsa lama (`existingExpiry + 30 days`), bukan dari tanggal transaksi, sehingga pengguna tidak rugi durasi.

### 4. Gatekeeper UX & Arsitektur Paywall Modal (`EkinerjaPaywallModal`)
- **Trigger Gatekeeper:**
  - Tombol `⚡ e-Kinerja` di Logbook (`logbook/page.tsx`) dan Bukti Kinerja (`bukti-kinerja/page.tsx`).
  - Jika `user.ekinerjaSubscription?.isActive && activeUntil > now`:
    Langsung buka `EkinerjaBridgeModal` dengan status premium aktif.
  - Jika belum aktif atau kedaluwarsa:
    Buka `EkinerjaPaywallModal` yang menyajikan proposisi nilai terstruktur, opsi pembayaran instan QRIS / Invoice Mayar (Rp 50.000/30 hari), dan listener status transaksi realtime.

- **Prinsip Copywriting Berorientasi ROI (ASN Value Framing):**
  1. *Headline Emosional & Relevan*: "⚡ Akselerator e-Kinerja & AI Logbook Solo" dengan tagline "Tuntaskan kewajiban e-Kinerja BKPSDM dalam 1-Klik, maksimalkan capaian SKP, dan pastikan pencairan TPP 100% aman tanpa lembur."
  2. *Benefit Pills Cepat*: `⏱️ Hemat 2 Jam/Hari`, `🎯 Target TPP 100% Aman`, `🤖 AI Multi-Activity`, `🚀 Zero-Click Sync`.
  3. *Framing Investasi Harian*: Menyorot biaya `Rp 50.000 / 30 Hari` sebagai `~Rp 1.660 / hari` (setara biaya parkir harian motor) untuk memproteksi penerimaan TPP bulanan bernilai jutaan rupiah.

- **Arsitektur Tampilan Tab Interaktif:**
  Modal menggunakan Tabs Radix UI (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) dengan 2 tab:
  - **Tab 1 ("Keunggulan Fitur")**: 4 kartu fitur visual:
    1. *AI Multi-Activity Decomposer*: Otomatis mengurai catatan narasi bebas menjadi 2–6 kegiatan Kepwal non-overlapping tanpa merangkum.
    2. *Realtime SKP/TPP Point Tracker*: Monitor target resmi 8.400 Menit Kerja Efektif (MKE) / 140 jam kerja bulanan secara presisi.
    3. *Chrome Bridge & Bookmarklet 1-Klik*: Kirim data 8 kolom form BKPSDM instan tanpa copas satu per satu.
    4. *Google Drive & Time Sync*: Integrasi URL bukti dukung cloud drive otomatis & sinkronisasi jam kerja.
  - **Tab 2 ("Perbandingan Free vs PRO")**: Matriks perbandingan 8 baris fitur kontras:
    - *Pencatatan Logbook Harian Mandiri*: Free (Ya) vs PRO (Ya)
    - *Cetak Rekap Bulanan PDF ASN*: Free (Ya) vs PRO (Ya)
    - *Kamus 152 Aktivitas Kepwal Solo*: Free (Manual) vs PRO (Smart Select Otomatis)
    - *AI Smart Entry (Multi-Activity Decomposer)*: Free (Tidak) vs PRO (Unlimited)
    - *Tracker Poin SKP & Target Jam TPP*: Free (Tidak) vs PRO (Aktif Penuh - Target 8.400 MKE)
    - *Jembatan 1-Klik e-Kinerja BKPSDM*: Free (Tidak) vs PRO (Aktif Penuh)
    - *Ekstensi Chrome Bridge (Zero-Click)*: Free (Tidak) vs PRO (Aktif Penuh)
    - *Penyematan Google Drive Otomatis*: Free (Manual) vs PRO (Otomatis Terhubung)

- **4.1 Sakelar Sentral Feature Flag & Evaluation Sandbox Mode (`IS_EKINERJA_PAYMENT_ENABLED`):**
  - **Lokasi Sentral:** `src/hooks/useEkinerjaSubscription.ts` $\rightarrow$ `export const IS_EKINERJA_PAYMENT_ENABLED = false;`.
  - **Tujuan Arsitektur:** Membuka seluruh fitur premium (*AI Smart Entry*, *e-Kinerja Bridge*, *Poin Tracker*) secara gratis dan tanpa batas selama fase evaluasi & pemaksimalan fitur (*product-led adoption*).
  - **Perilaku saat Dinonaktifkan (`false`):**
    - `useEkinerjaSubscription()` mengembalikan `isSubscribed: true`, `status: 'ACTIVE'`, `isPaymentDisabled: true`, dan `formattedExpiry: 'Akses Penuh Terbuka (Mode Evaluasi)'`.
    - Tidak ada modal pembayaran Mayar / invoice / QRIS yang muncul saat pengguna mengklik fitur-fitur premium.
    - Pada modal e-Kinerja Bridge, tombol tagihan `+ Perpanjang (Rp 50.000)` disembunyikan dan digantikan badge informatif `⭐ Akses Seluruh Fitur Terbuka (Mode Evaluasi)`.
  - **Re-Aktivasi Monetisasi:** Ketika seluruh fitur sudah matang dan disetujui untuk dimonetisasi, cukup ubah variabel menjadi `true`. Seluruh infrastruktur pembayaran Mayar, webhook Cloud Functions, dan Paywall Modal akan langsung aktif kembali secara mulus tanpa perlu merombak kode.

---

### 5. Standar Simetri Form Logbook (Tambah & Edit)
Setiap formulir logbook, baik `SmartAddKegiatanModal` (Tambah) maupun `EditKegiatanModal` (Edit), **WAJIB** menerapkan kapabilitas yang simetris dan konsisten:
1. **Smart Select Aktivitas (`AktivitasCombobox`):**
   - Tampil jika `userProfile.useKamusAktivitasKepwal !== false`.
   - Mengambil data resmi dari `masterAktivitasSolo.ts` (152 aktivitas Kepwal 786/154/2020).
   - Menyimpan `aktivitasId` dan `aktivitasNama` secara persisten pada objek `LogbookKegiatan`.
2. **Real-Time Match Suggestion & AI Bureaucratic Tone Polisher:**
   - Jika pengguna mengetik teks uraian bebas tanpa memilih dropdown, sistem otomatis mendeteksi kata kunci Kepwal dan menawarkan banner saran `+ Terapkan`.
   - Tombol **"✨ Poles Bahasa Birokrasi"** (`/api/ai/polish-kegiatan`) untuk memoles kalimat santai menjadi tata naskah dinas formal baku ASN secara instan.
3. **Kamus Rutinitas Pribadi:**
   - Menampilkan quick pills dari `userProfile.customAktivitasList` untuk input cepat 1-klik.
4. **Preservasi Metadata e-Kinerja:**
   - Saat entri diedit, `aktivitasId` dan `aktivitasNama` yang sudah ada tidak boleh hilang secara tidak sengaja, dan harus diteruskan langsung ke `virtualBukti` saat dikirim ke portal e-Kinerja.

---

### 6. Prinsip AI Logbook: "Decomposition Over Summarization" & Poin Tracker
- **Larangan Merangkum (No Summarization):** Pada sistem e-Kinerja ASN, poin dihitung per kegiatan mandiri. Asisten AI (`/api/ai/parse-kegiatan`) **dilarang menggabungkan** banyak aktivitas menjadi satu kalimat rangkuman. AI wajib memecah (*decompose*) catatan bebas atau jejak digital menjadi 2–6 butir kegiatan terpisah dengan alokasi jam kerja yang runtut dan tidak saling bertabrakan (*non-overlapping*).
- **Kalkulator & Tracker Poin Realtime (`KinerjaTrackerCard`):** Menampilkan akumulasi poin Kepwal Solo (target: 8.400 Menit Kerja Efektif / 140 jam kerja bulanan) untuk menjamin kepastian 100% TPP pegawai sebelum tutup buku portal e-Kinerja BKPSDM. Dilengkapi Audit Gap Finder (deteksi hari kerja bolong) dan Anti-Overlapping Time Inspector.

---

### 7. 🌐 Prinsip Client-Side Assistive Automation: Keharusan Membuka Halaman Portal e-Kinerja
Otomasi integrasi RUANG SIGAP **BUKAN bot server-side liar** yang menembak database secara sembunyi-sembunyi, melainkan **Asisten Otomasi Pengisian Formulir (Client-Side Assistive Copilot)**.
- **Mengapa Halaman Formulir e-Kinerja BKPSDM Tetap Wajib Dibuka di Browser?**
  1. **Keamanan Sesi Resmi Pegawai (Session & Cookie Isolation):** Portal e-Kinerja BKPSDM (`http://103.115.227.196/e-kinerja/v4/`) memvalidasi sesi login aktif dan token anti-CSRF per sesi browser. Cloud Functions eksternal tidak memiliki akses sesi resmi pegawai.
  2. **Penomoran Kode Kegiatan Otomatis (F2 / Internal AJAX):** Tombol F2 dan generator kode kegiatan internal portal BKPSDM hanya berjalan di dalam lingkungan DOM halaman web e-Kinerja.
  3. **Keabsahan & Legalitas Verifikasi ASN:** Secara regulasi birokrasi, ASN wajib melihat formulir yang telah terisi otomatis untuk melakukan verifikasi akhir sebelum menekan tombol **Simpan** secara sadar dan sah.

---

### 8. 📱 Kompatibilitas Mobile (Ponsel) & Strategi Eksekusi Multi-Platform
- **Batasan Browser Mobile:**
  Google Chrome Mobile (Android & iOS) dan Apple Safari iOS secara default **TIDAK MENDUKUNG Chrome Extension (Manifest V3)** karena pembatasan sistem operasi oleh vendor.
- **Strategi Resmi di Ponsel: Bookmarklet 1-Klik (`src/lib/ekinerjaBookmarklet.ts`):**
  Menggunakan standar web universal Bookmarklet (`javascript:...`) yang didukung penuh oleh semua browser smartphone tanpa perlu menginstal aplikasi pihak ketiga apa pun.

#### A. Prosedur Pemasangan Sekali Saja di Ponsel (Durasi: ~1 Menit):
1. **Salin Skrip Bookmarklet:** Di RUANG SIGAP HP (menu Logbook/Bukti Kinerja $\rightarrow$ modal `⚡ e-Kinerja` $\rightarrow$ tab Bookmarklet), ketuk tombol **"Salin Skrip URL"** (kode `javascript:...` otomatis tersalin ke clipboard HP).
2. **Buat Bookmark Baru:** Di Chrome/Safari HP, buat bookmark halaman apa saja sembarang (misal ketuk tanda bintang ⭐).
3. **Edit Bookmark:** Buka menu Bookmark $\rightarrow$ Edit bookmark yang baru dibuat:
   - Ganti nama menjadi: `⚡ Isi e-Kinerja Solo` (atau `Isi Kinerja`).
   - Pada kolom URL: Hapus URL lama, lalu **Tempel / Paste** skrip `javascript:...` yang tadi disalin.
   - Ketuk **Simpan / Selesai**.

#### B. Prosedur Pengisian Harian di Ponsel (Durasi: ~10 Detik per Kegiatan):
1. **Salin Form di SIGAP HP:** Pada kegiatan yang dipilih, ketuk `⚡ e-Kinerja` $\rightarrow$ ketuk **"Salin Form"** (data form masuk ke clipboard HP).
2. **Buka Tab e-Kinerja BKPSDM:** Buka portal e-Kinerja Solo (`http://103.115.227.196/e-kinerja/v4/d_kegiatan_harian`) $\rightarrow$ ketuk **Tambah Kegiatan**.
3. **Eksekusi dari Address Bar:** Ketuk kolom URL (address bar) di bagian atas browser ponsel $\rightarrow$ ketik `Isi Kinerja` (atau `⚡`) $\rightarrow$ ketuk rekomendasi bookmark `⭐ ⚡ Isi e-Kinerja Solo`.
4. **Otomatis Terisi & Sorot Hijau:** Seluruh 8 kolom form langsung terisi otomatis dan tersorot warna hijau dengan notifikasi sukses.
5. **Simpan:** Pegawai menekan tombol resmi **Simpan** di portal e-Kinerja.

- **Alternatif Full Extension di Android:**
  Bagi pengguna Android yang menginginkan fitur otomatisasi *Zero-Click Cross-Tab* yang sama persis seperti di laptop tanpa perlu mengetik di address bar, dapat menggunakan **Kiwi Browser** (tersedia gratis di Play Store), mengaktifkan Developer Mode, dan memuat file `sigap-chrome-bridge.zip`.

---

### 9. 📚 Standar Dokumentasi Pengguna & Self-Service Onboarding In-App (`.md` & Tutorial Modal)
Fitur-fitur kompleks dan multi-platform (seperti Logbook Kepwal 786/154/2020, AI Decomposer, Tracker 8.400 MKE, Google Drive Sync, Ekstensi Chrome PC, dan Bookmarklet Ponsel) **WAJIB** dilengkapi dengan dokumentasi operasional mandiri (*self-service guide*) yang dapat diakses langsung oleh ASN tanpa hambatan:
1. **Master Markdown Document (`public/docs/PANDUAN_LOGBOOK_DAN_EKINERJA.md`):**
   - Disimpan di folder publik agar dapat diunduh langsung oleh klien atau diakses via path URL statis (`/docs/PANDUAN_LOGBOOK_DAN_EKINERJA.md`).
   - Berisi 8 bab komprehensif: Pengenalan, Kamus Kepwal 152, AI Smart Entry, Target 8.400 MKE, Rekap PDF, e-Kinerja Bridge (PC Ekstensi vs HP Bookmarklet), Google Drive, dan FAQ.
2. **Interactive In-App Guidebook Modal (`LogbookTutorialModal.tsx`):**
   - Modal responsif berbasis `react-markdown` dan `remark-gfm` dengan navigasi bab cepat (*quick chapter pills*), live search filter, highlight badges platform, tombol **"📥 Unduh .MD"**, dan tombol **"📋 Salin .MD"**.
   - Tersemat langsung pada header utama dan shortcut nav Logbook di kedua tenant (SIGAP dan POROS) melalui tombol **"📖 Buku Panduan"**.

---

## 🌐 10. Sinergi Dual-Compliance: Integrasi dengan e-Kinerja BKN Nasional
Selain pemenuhan TPP harian BKPSDM Surakarta (Kepwal 786/154/2020), ASN juga diwajibkan memenuhi pelaporan SKP periodik ke **e-Kinerja BKN Nasional (`kinerja.bkn.go.id`)** untuk Kenaikan Pangkat di SIASN.

RUANG SIGAP menerapkan paradigma **"One Logbook, Dual-Compliance"**:
1. **Tagging RHK BKN:** Entri logbook harian selain memiliki `aktivitasId` (152 Kepwal Solo) juga dapat memiliki `rhkId` dan `rhkNama` (RHK Tahunan BKN).
2. **Jalur Harian (BKPSDM):** Dikirim via Ekstensi/Bookmarklet untuk mengamankan 8.400 MKE dan TPP bulanan.
3. **Jalur Periodik (BKN):** Seluruh dokumen dan aktivitas dalam rentang triwulan otomatis diorganisasi ke Google Drive per RHK dan disintesis oleh Gemini AI untuk mengisi Rencana Aksi & Realisasi BKN.
4. **Rujukan Panduan BKN:** Lihat skill resmi [sigap-bkn-ekinerja-pipeline](file:///d:/DENY/project/ruang-sigap-v2/.agents/skills/sigap-bkn-ekinerja-pipeline/SKILL.md) untuk arsitektur lengkap BKN Nasional.
