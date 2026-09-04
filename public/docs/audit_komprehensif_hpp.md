# 🔍 AUDIT KOMPREHENSIF RUANG SIGAP & POROS
## Analisis Kode, Valuasi HPP, & Estimasi Biaya Pengembangan
> Berdasarkan audit langsung dari source code — September 2026

---

## 📊 STATISTIK KODE (GROUND TRUTH)

| Metrik | Nilai |
|---|---|
| **Total File Frontend** (`.tsx/.ts/.css`) | **666 file** |
| **Total File Backend** (Cloud Functions `.ts`) | **27 file** |
| **Frontend LOC** | **136,555 baris** |
| **Backend LOC** | **6,629 baris** |
| **Total Lines of Code** | **~143,200 baris** |
| **Ukuran Source Frontend** | **6.78 MB** |
| **Ukuran Source Backend** | **295 KB** |
| **Firestore Composite Indexes** | **81 index** |
| **Halaman SIGAP (main)** | **29 modul** |
| **Halaman POROS (main)** | **31 modul** |
| **Halaman Admin SIGAP** | **13 modul** |
| **Halaman Admin POROS** | **14 modul** |
| **UI Components Shared** | **44 komponen** |

---

## 🏗️ ARSITEKTUR SISTEM

### Stack Teknologi (dari `package.json`)
- **Frontend**: Next.js 16 + React 18 + TypeScript 5
- **Styling**: TailwindCSS 3 + Radix UI (22 primitif)
- **State**: TanStack Query v5 + IndexedDB (offline)
- **Backend**: Firebase Cloud Functions v2 (Cloud Run)
- **Database**: Firestore (named DB: `database-siyap`)
- **Auth**: Firebase Auth + Custom JWT Claims
- **AI**: Google Gemini API (via Secret Manager)
- **Push Notif**: Firebase Cloud Messaging (FCM)
- **Storage**: Firebase Storage
- **Hosting**: Firebase App Hosting
- **3D/Chart**: Three.js, Recharts, Chart.js, Lightweight-charts
- **PDF**: jsPDF, @react-pdf/renderer, pdfjs-dist
- **Export**: xlsx, docx, file-saver, papaparse
- **Maps**: Leaflet
- **Integration**: Google OAuth2, Google Calendar API, Google Drive API, WhatsApp API

---

## 📦 INVENTARIS FITUR BACKEND

### A. Firebase Cloud Functions (27 file, ~6,629 LOC)

#### 🤖 AI Functions (`aiFunctions.ts` — 813 LOC)
| No | Fungsi | Deskripsi |
|---|---|---|
| 1 | `extractSuratDataAIV2` | OCR + ekstrak metadata surat via Gemini Vision + rate limiting |
| 2 | `extractVoiceDisposisiAIV2` | Voice-to-disposisi: transkripsi suara + intent extraction |
| 3 | `getStrategicDisposisiAIV2` | On-demand rekomendasi instruksi disposisi strategis |
| 4 | `agentStrategicDisposition` | Firestore trigger: mini multi-agent AI paralel saat surat dibuat (Agent 1: Instructor + Agent 2: Org Mapper) |
| 5 | `extractAgendaInternalAIV2` | OCR surat internal multi-halaman + ekstrak jadwal + daftar peserta |

#### 📡 API Functions (`api/index.ts` — 511 LOC)
| No | Fungsi | Deskripsi |
|---|---|---|
| 6 | `checkAdminEmail` | Validasi email admin saat login |
| 7 | `getEmailFromNip` | Lookup email dari NIP (login pegawai) |
| 8 | `setNipClaim` | Set custom JWT claims (role, opdId, jabatanId, level) |
| 9 | `getGlobalOpdData` | Fetch jabatan + OPD data global untuk AuthContext |
| 10 | `getGlobalUserCache` | Cache global untuk Pimpinan Pusat (level <= 2) |
| 11 | `aturDelegasiSementara` | Delegasi disposisi sementara (2h/4h/EOD/manual) |
| 12 | `batalkanDelegasiSementara` | Batalkan delegasi aktif |
| 13 | `resetPassword` | Reset password via email link / temporary password |
| 14 | `bulkUpdateUserStatus` | Bulk aktif/nonaktif pengguna |
| 15 | `importUsers` | Import massal user dari CSV (paralel batch 10) |
| 16 | `getImpersonationToken` | Token impersonasi admin + audit log |
| 17 | `resetUserSummaryCount` | Reset badge counter (surat/tugas baru) |

#### ⏰ Cron Jobs (`cron/index.ts` — 725 LOC)
| No | Fungsi | Jadwal | Deskripsi |
|---|---|---|---|
| 18 | `sendAgendaReminders` | Setiap 15 menit | Kirim FCM reminder undangan 1 jam sebelumnya |
| 19 | `archiveOldInvitations` | 01:00 WIB daily | Auto-archive undangan yang sudah lewat |
| 20 | `generateDailyPerformanceStats` | 02:00 WIB daily | Agregasi statistik kinerja harian per OPD |
| 21 | `generateMonthlyInvoices` | 1 setiap bulan | Generate tagihan otomatis (per user aktif x tarif paket) |
| 22 | `aggregateKinerjaPenggunaHarian` | 04:00 WIB daily | Agregasi kinerja per pengguna (Super Admin analytics) |
| 23 | `periodicPendingCheck` | 2 jam (08-16 WIB) | Kirim FCM reminder disposisi/tugas yang belum diproses |
| 24 | `dailyKinerjaAggregator` | Daily | Aggregator kinerja harian (file terpisah) |
| 25 | `aggregateHealthScore` | Scheduled | Agregasi health score per OPD |

#### 🔁 Firestore Triggers (`triggers/index.ts` — 1,444 LOC + 6 file lain)
| No | Trigger | Koleksi | Aksi |
|---|---|---|---|
| 26 | `onDisposisiSummaryUpdate` | `disposisi` | Update counter summary (disposisiBaru, tindakLanjutMenunggu) |
| 27 | `onSuratCreated` | `surat` | Kirim FCM + buat notifikasi + update summary |
| 28 | `onDisposisiCreated` | `disposisi` | Kirim notif ke penerima |
| 29 | `onTugasCreated` | `tugas` | Notif tugas baru |
| 30 | `onTugasDeadlineApproach` | `tugas` | Warning mendekati deadline |
| 31 | `doubleWrite` | Various | Double-write untuk backward compatibility |
| 32 | `logbookTriggers` | `logbookHarian` | Auto-trigger log kegiatan |
| 33 | `sessionTriggers.recordUserSession` | Auth | Rekam sesi login user |
| 34 | `repositoryTriggers` | `repository` | Auto-archive dokumen repository |
| 35 | `aiRepository` | `repository` | AI Smart Folder kategorisasi otomatis |
| 36 | `repositoryRecycleBin` | `repositoryRecycleBin` | Auto-purge tong sampah |

#### 🔧 Utilitas Backend
| No | File | Deskripsi |
|---|---|---|
| 37 | `autoHeal.ts` | Auto-repair data anomali Firestore |
| 38 | `backupFunction.ts` | Backup otomatis ke Cloud Storage |
| 39 | `compressPdf.ts` | Kompresi PDF di server |
| 40 | `validasiDisposisi.ts` | Validasi konsistensi data disposisi |
| 41 | `masterDataAggregator.ts` | Agregasi master data |
| 42 | `agregasiSummaries.ts` | Agregasi ringkasan bulanan |
| 43 | `lintasOpd.ts` | Fungsi lintas-OPD |
| 44 | `manualMigrateOpd.ts` | Script migrasi data OPD |
| 45 | `backfillKinerjaAgregat.ts` | Backfill data historis kinerja |
| 46 | `taskWorkers.ts` | Background task workers |

### B. Next.js API Routes (`src/app/api/`)

#### AI Routes (10 endpoint)
| Endpoint | Fungsi |
|---|---|
| `/api/ai/copilot` | SIGAP Copilot chat AI |
| `/api/ai/copywriter` | AI copywriter konten surat |
| `/api/ai/draft-form` | AI draft formulir otomatis |
| `/api/ai/extract-skw` | OCR SKW (Surat Keterangan Waris) |
| `/api/ai/generate-job-profile` | Generate profil jabatan AI |
| `/api/ai/generate-laporan` | Generate laporan AI |
| `/api/ai/grammar` | Grammar checker AI |
| `/api/ai/smart-template` | AI smart template surat |
| `/api/ai/suggest-disposition` | Saran disposisi |
| `/api/ai/suggest-eskalasi` | Deteksi eskalasi urgensi |

#### Google Integration Routes (6 endpoint)
| Endpoint | Fungsi |
|---|---|
| `/api/google/auth` | OAuth2 Google flow |
| `/api/google/callback` | OAuth2 callback handler |
| `/api/google/disconnect` | Disconnect Google account |
| `/api/google/generate-surat` | Generate surat via Google Docs |
| `/api/google/sync-event` | Sync ke Google Calendar |
| `/api/google/upload-bukti` | Upload bukti kinerja ke Google Drive |

---

## 📱 INVENTARIS FITUR FRONTEND

### SIGAP (E-Office — Tema Royal Blue)
**29 Modul Utama + 13 Modul Admin + 6 Modul Fungsional**

#### Core Modules (29 halaman)
| Modul | Fitur Utama |
|---|---|
| **Surat Masuk** | Upload surat, OCR AI, disposisi, tracking status, PDF viewer |
| **Surat Keluar** | Pembuatan surat, rich text editor, template, tanda tangan digital |
| **Rekap Surat** | Filter, export Excel/PDF, analitik surat per periode |
| **Disposisi** | Chain disposisi multi-level, voice input, AI rekomendasi |
| **Tugas** | Kanban board, deadline, attachment, komentar |
| **Logbook** | Catatan harian kegiatan, export ke PDF |
| **Presensi** | GPS check-in/check-out, anti-fraud detection (fake GPS, bot, clock drift) |
| **Agenda** | Kalender terintegrasi, scan undangan AI, sync Google Calendar |
| **Jadwal** | Manajemen jadwal dan tempat, booking ruang |
| **Arsip** | Repositori dokumen dengan search, tagging |
| **Bukti Kinerja** | Upload bukti dengan Google Drive integration |
| **Knowledge Base** | Artikel panduan, markdown editor |
| **Laporan** | Laporan komprehensif + AI-generated summary |
| **Perencanaan** | Target kinerja, SKP, rencana kerja |
| **Evaluasi** | Penilaian kinerja, scoring |
| **Kompetensi** | Pemetaan kompetensi jabatan |
| **Talenta** | Manajemen talenta pegawai |
| **Templat** | Bank templat surat/dokumen |
| **Formulir** | Form builder + response collection |
| **Checklist** | Checklist kegiatan |
| **Ruang Kerja** | Dashboard utama + quick actions |
| **Search** | Full-text search dengan searchKeywords array |
| **Profil** | Pengaturan profil, notifikasi, Google link |
| **Feedback** | Umpan balik pengguna |
| **Tutorial** | Video/panduan penggunaan |
| **Apps External** | Integrasi aplikasi eksternal |
| **Rapat Virtual** | Manajemen rapat video |
| **Portal Integrasi** | SIASN, sistem eksternal |
| **Heal** | Auto-heal data anomali (user-facing) |

#### Modul Fungsional Khusus (6 sub-modul)
- **SKW** (Surat Keterangan Waris) — OCR + form ahli waris + saksi
- **Keuangan** — Pengelolaan keuangan dinas
- **Aset** — Inventaris aset OPD
- **Notulensi** — Notulen rapat
- **Tapem** — Tata pemerintahan
- **Pelayanan** — Pelayanan publik

#### Modul Admin (13 halaman)
| Modul | Fungsi |
|---|---|
| **Users** | CRUD pengguna, import CSV, reset password, impersonasi |
| **OPD** | Manajemen organisasi |
| **Jabatan** | Hierarki jabatan, level struktural |
| **Pengumuman** | Broadcast ke semua pegawai |
| **Form Builder** | Drag-and-drop form builder |
| **Admin Panel** | Dashboard admin komprehensif |
| **Affiliates** | Program afiliasi / referral |
| **Dokumen Penagihan** | Invoice management |
| **Laporan Langganan** | Laporan subscription SaaS |
| **Feedback Admin** | Review feedback pengguna |
| **Pengaturan UI** | Kustomisasi tema per OPD |
| **Super Admin** | Panel super admin lintas OPD |
| **Permintaan Replikasi** | White-label deployment |

### POROS (ASN Platform — Tema Teal/Gold Glassmorphism)
**31 Modul Utama + 14 Modul Admin**

Semua modul SIGAP + tambahan:
- **Bank Templat** — Repositori templat terpusat
- **Pengaturan** — Pengaturan khusus POROS
- **Persetujuan Draf** — Workflow persetujuan draf surat
- **Kesehatan OPD** — Dashboard health score OPD
- **Monitoring** — Real-time monitoring sistem
- **SIASN Integration** — Koneksi ke SIASN Nasional

---

## 🧩 FITUR TEKNIS UNGGULAN (dari kode langsung)

### 1. Multi-Tenant SaaS Architecture
- Sistem multi-OPD dengan isolasi data per `opdId`
- Custom JWT Claims: `role`, `opdId`, `jabatanId`, `level`, `nip`
- Dual-theme system: SIGAP (Royal Blue) ↔ POROS (Teal/Gold)
- `app_theme` per user/OPD di Firestore + cookie

### 2. AI Integration (Gemini Flash — 15 endpoint)
- **5 Cloud Functions AI**: OCR, Voice, Strategic Disposisi, Agenda, Multi-Agent
- **10 Next.js AI Routes**: Copilot, Copywriter, Grammar, Laporan, SKW, dll
- Rate limiting via Firestore transaction (anti-spam per user, 30 detik cooldown)
- Structured output via Gemini response schema
- Mini Multi-Agent: Agent 1 (Instructor) + Agent 2 (Org Mapper) paralel

### 3. PWA Capabilities
- Service Worker dengan offline queue (IndexedDB: `SIGAP_OFFLINE_DB`)
- Install prompt (`usePwaInstall.ts`)
- Push notification via FCM
- Background sync untuk upload surat offline

### 4. Anti-Fraud Presensi (dari `antiFraudUtils.ts`)
- **Fake GPS Detection**: Haversine formula + GPS history consistency
- **Mock Location Detection**: Speed anomaly (>200km/h), altitude check
- **Clock Tampering**: Server vs client timestamp drift (>5 menit = suspicious)
- **Bot Detection**: Headless browser + WebDriver detection
- Multi-layer fraud score system

### 5. Real-time & Performance
- TanStack Query v5 dengan persistence ke localStorage
- **81 Composite Firestore Indexes** (query efisien multi-field)
- `searchKeywords[]` array untuk full-text search
- Cursor-based pagination dengan `startAfter()`
- Debounced queries + optimistic updates

### 6. Google Workspace Integration
- OAuth2 Google complete flow (auth → callback → disconnect)
- Google Calendar sync (jadwal agenda)
- Google Drive upload (bukti kinerja)
- Google Docs generation (surat otomatis)

### 7. SaaS Billing System (built-in)
- `pricingPackages` Firestore collection
- Auto-generate tagihan bulanan (per user aktif × tarif)
- Invoice management (`tagihan` collection)
- Paket: Dasar, Standar, Premium, Custom
- Modul Laporan Langganan untuk Super Admin

### 8. Hierarchical Role System
```
super_admin → admin_opd / staf_tu → user
+ additionalRoles: FunctionalRole[]
  (hrd, bendahara, notulis_rapat, pengurus_barang,
   petugas_pelayanan, pengelola_tapem, operator_surat,
   petugas_kelurahan, petugas_kecamatan)
```

### 9. Executive Analytics (dari `cron/aggregateHealthScore.ts`)
- `kinerjaAgregat` — Aggregated performance per OPD
- `aggregateHealthScore` — OPD Health Score (Sangat Sehat → Buruk → Tidak Aktif)
- `kinerjaPerPenggunaHarian` — Daily per-user performance tracking
- `userSummaries` — Denormalized counter untuk badge notifikasi

### 10. Fitur Advanced Lain
- **Delegasi Sementara**: Disposisi dapat didelegasikan (2h/4h/EOD/manual)
- **Impersonasi**: Admin dapat login sebagai user lain + audit log ke `impersonationLogs`
- **Auto-heal**: Deteksi dan repair data anomali Firestore otomatis
- **Backup otomatis**: ke Firebase Storage
- **WhatsApp integration**: via API WhatsApp
- **SIGAP Copilot**: Chat AI kontekstual dalam aplikasi
- **Voice Disposisi**: Pimpinan bicara → AI parsing penerima + instruksi

---

## 💰 KALKULASI HPP (HARGA POKOK PRODUKSI)

### Metodologi
HPP dihitung berdasarkan:
1. Man-hours riil (estimasi dari LOC + kompleksitas fitur)
2. Rate developer Indonesia (market 2025-2026)
3. Overhead & infrastruktur

### Asumsi Rate Senior Developer Indonesia 2026
| Role | Rate/Hari |
|---|---|
| Tech Lead / Arsitek | Rp 2.000.000 |
| Senior Full-stack Dev | Rp 1.400.000 |
| Senior Frontend Dev | Rp 1.200.000 |
| UI/UX Designer | Rp 1.000.000 |
| QA Engineer | Rp 800.000 |
| Project Manager | Rp 1.600.000 |

### Rekap Per Komponen
| Komponen | Hari Kerja | Biaya |
|---|---|---|
| **Backend** (46 functions + 81 indexes + integrations) | 128 hari | **Rp 182.200.000** |
| **Frontend SIGAP** (29 modul + 13 admin + 6 fungsional) | 242 hari | **Rp 290.400.000** |
| **Frontend POROS** (31 modul + 14 admin + dual theme) | 98 hari | **Rp 117.600.000** |
| **UI/UX Design** (wireframe, design system, mobile UX) | 55 hari | **Rp 55.000.000** |
| **QA & Testing** (manual, regression, UAT) | 40 hari | **Rp 32.000.000** |
| **Project Management** (sprint, koordinasi, dok) | 40 hari | **Rp 58.000.000** |
| **Total Man-days** | **603 hari** | |
| **Subtotal Jasa** | | **Rp 735.200.000** |

### Overhead & Infrastruktur (12 bulan development)
| Item | Biaya |
|---|---|
| Firebase Blaze Plan (dev + staging) | Rp 12.000.000 |
| Domain + SSL | Rp 3.000.000 |
| Google Workspace (email dev team) | Rp 6.000.000 |
| Gemini API quota (development & testing) | Rp 15.000.000 |
| Software & tools (Figma, dll) | Rp 8.000.000 |
| **Total Overhead** | **Rp 44.000.000** |

---

## 🏷️ TOTAL HPP FINAL

| Skenario | Kisaran |
|---|---|
| **HPP Minimum** (rate junior-mid developer) | **Rp 520.000.000** |
| **HPP Riil** (rate senior, asumsi di atas) | **Rp 779.200.000** |
| **HPP Maximum** (rate senior + profit dev house 30%) | **Rp 1.013.000.000** |

> **HPP Riil yang paling mendekati realita: ~Rp 750 juta – Rp 800 juta**

---

## 🏷️ VALUASI WHITE LABEL

### Faktor Nilai Tambah
- Sudah production-ready, bukan MVP
- Dua tenant (SIGAP + POROS) dengan design system berbeda
- AI terintegrasi dalam (bukan sekadar wrapper GPT)
- SaaS billing system sudah built-in
- 143.000+ baris kode, 666 file frontend
- Anti-fraud presensi (fitur premium langka di pasar)
- Google Workspace full integration
- Multi-OPD (multi-tenant) by design
- PWA dengan offline support

### Paket White Label yang Bisa Ditawarkan

**A. LISENSI SOURCE CODE (One-time)**
Pembeli mendapat full akses kode, bisa modifikasi bebas:
- Satu tenant (hanya SIGAP atau POROS): **Rp 400 – 600 juta**
- Dual tenant (SIGAP + POROS): **Rp 700 juta – 1 Miliar**
- Dengan dukungan implementasi 6 bulan: **+Rp 150 – 200 juta**

**B. WHITE LABEL SaaS (Recurring + Revenue Share)**
Pembeli tidak punya kode, hanya dapat akses rebrand + deploy instance:
- Setup fee: **Rp 50 – 100 juta** (kustomisasi logo, domain, warna)
- Revenue share: **20-30%** dari pendapatan langganan klien mereka

**C. DEPLOYMENT PER KABUPATEN/KOTA**
Pemerintah daerah beli lisensi per instance untuk 1 Pemda:
- Harga per Pemda: **Rp 150 – 300 juta** (one-time license + setup)
- Subscription tahunan maintenance: **Rp 30 – 60 juta/tahun**

### Valuasi Bisnis (Jika Dijual sebagai Startup/Produk)
| Metrik | Nilai |
|---|---|
| Potensi klien (Pemda Indonesia) | 514 Kabupaten/Kota |
| Potensi ARR jika 50 Pemda × Rp 50 juta | Rp 2,5 Miliar/tahun |
| Valuasi startup SaaS (5× ARR) | Rp 12,5 Miliar |
| Valuasi konservatif (3× ARR) | Rp 7,5 Miliar |

---

## ⏱️ ESTIMASI TIMELINE PENGEMBANGAN DARI NOL

| Fase | Durasi | Deliverable |
|---|---|---|
| **Fase 0**: Setup & Arsitektur | 2 minggu | Firebase setup, design system, CI/CD |
| **Fase 1**: Auth + Admin | 4 minggu | Login, user management, OPD/jabatan |
| **Fase 2**: Core Surat + Disposisi | 8 minggu | Upload surat, disposisi chain, notifikasi |
| **Fase 3**: Tugas + Logbook + Presensi | 6 minggu | Task management, presensi GPS, logbook |
| **Fase 4**: AI Integration | 4 minggu | OCR, voice, copilot, strategic AI |
| **Fase 5**: Agenda + Integrasi Google | 4 minggu | Kalender, Google Drive, Calendar sync |
| **Fase 6**: Analytics + Billing | 4 minggu | Health score, kinerja, invoice SaaS |
| **Fase 7**: POROS tenant | 6 minggu | Clone + rebrand + POROS-specific modules |
| **Fase 8**: PWA + Advanced | 4 minggu | Offline, anti-fraud, push notif |
| **Fase 9**: QA + UAT + Deploy | 4 minggu | Full testing, staging, production |
| **TOTAL** | **~46 minggu (~12 bulan)** | |

> Tim ideal: **1 Tech Lead + 2 Senior Full-stack + 1 UI/UX + 1 QA + 1 PM** = ~6 orang x 12 bulan = **~72 person-months**

---

## 📋 RINGKASAN EKSEKUTIF

| Dimensi | Data |
|---|---|
| **Total LOC** | 143.200 baris |
| **Total Modul Frontend** | 60+ modul (SIGAP + POROS) |
| **AI Functions** | 15 (5 CF + 10 API routes) |
| **Backend Functions** | 46 exported functions |
| **Cron Jobs** | 8 jadwal otomatis |
| **Firestore Triggers** | 11+ event triggers |
| **Firestore Indexes** | 81 composite indexes |
| **Integrasi Eksternal** | Google, FCM, WhatsApp, Gemini |
| **Timeline Pembangunan** | ~12 bulan (tim 6 orang) |
| **HPP Riil** | **Rp 750 – 800 juta** |
| **Harga White Label (source code)** | **Rp 400 juta – 1 Miliar** |
| **Harga Lisensi per Pemda** | **Rp 150 – 300 juta** |
| **Valuasi Bisnis** | **Rp 7,5 – 12,5 Miliar** |

---

*Audit ini dilakukan langsung dari source code tanpa mengacu pada dokumen eksternal.*  
*Tanggal audit: 4 September 2026*
