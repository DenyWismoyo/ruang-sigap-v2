# 📊 Analisis Mendalam: Ruang Sigap V2 — Dashboard Poros

## 1. Gambaran Arsitektur Sistem

Aplikasi ini adalah platform **e-Government** berbasis web untuk manajemen administrasi pemerintahan (ASN/OPD). Terdapat dua "tema" dashboard:
- **Poros** — Fokus ke administrasi kepegawaian & produktivitas ASN
- **Sigap** — Fokus ke pelayanan publik dan surat-menyurat

**Stack Teknologi:**
| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadcnUI, Framer Motion |
| Backend | Firebase Cloud Functions (v1 & v2), TypeScript |
| Database | Firestore (database: `database-siyap`) |
| Auth | Firebase Auth + Custom Claims |
| AI | Google Gemini 2.5 Flash Lite via REST API |
| Storage | Firebase Storage |
| Push Notif | Firebase Cloud Messaging (FCM) |
| Scheduler | Cloud Scheduler + Cloud Tasks |

---

## 2. Analisis Backend (Firebase Functions)

### 2.1 Modul yang Ada

| Modul | File | Fungsi Utama |
|---|---|---|
| **API** | `api/index.ts` (456 baris) | Auth, NIP lookup, delegasi, reset password, global OPD data |
| **Triggers** | `triggers/index.ts` (1403 baris!) | Firestore triggers: disposisi, surat, notifikasi, kalender Google |
| **Cron** | `cron/index.ts` (721 baris) | Pengingat agenda, arsip undangan, statistik kinerja harian, billing |
| **AI** | `aiFunctions.ts` | Ekstraksi data surat via Gemini Vision (OCR + parsing) |
| **Agregasi** | `agregasiSummaries.ts` | Sinkronisasi disposisi & tugas ke `userSummaries` |
| **Master Data** | `masterDataAggregator.ts` | Rebuild `opdMasterData` jika user/jabatan berubah |
| **Task Workers** | `taskWorkers.ts` | Cloud Tasks handler untuk reminder |
| **Auto Heal** | `autoHeal.ts` | Self-healing untuk konsistensi data |
| **Backup** | `backupFunction.ts` | Backup Firestore ke Storage |

### 2.2 Pola Arsitektur yang Baik (✅)
- **Master Document Pattern**: `opdMasterData` → 1 read per OPD, bukan N query
- **UserSummaries Pattern**: Agregasi counter disposisi/tugas per jabatan → sangat hemat reads
- **Denormalisasi `infoTampilan`**: Menghilangkan N+1 query pada tampilan agenda
- **Rate Limiting**: Per-user dengan Firestore transaction untuk AI feature
- **Custom Claims**: Role, jabatanId, level, opdId semuanya ada di JWT token → tidak perlu Firestore untuk otorisasi

### 2.3 Kelemahan & Risiko Backend (⚠️)

1. **Mixed Firebase v1 & v2**: `agregasiSummaries.ts` dan `masterDataAggregator.ts` masih pakai v1, sementara `triggers/index.ts` sudah v2. Ini menyulitkan migrasi dan bisa jadi penyebab deploy warning.

2. **`triggers/index.ts` terlalu monolitik** (1403 baris): Susah maintain, Cold Start bisa lambat karena semua trigger di satu file.

3. **Cloud Tasks rate limit** tidak di-handle dengan baik — jika ada ribuan disposisi sekaligus, bisa overflow queue.

4. **Tidak ada retry logic** pada `sendReminderTask` — jika FCM gagal, notifikasi hilang.

5. **`bebanKerjaPerJabatan: []`** dikirim kosong di `generateDailyPerformanceStats` — artinya fitur beban kerja per jabatan **belum fungsional**.

6. **`autoHeal.ts`** — belum terlihat logikanya secara penuh, perlu review apakah sudah berjalan.

---

## 3. Analisis Frontend (Next.js — Dashboard Poros)

### 3.1 Struktur Route Poros

```
/dashboard/poros/
├── page.tsx              ← Halaman utama dashboard (Home)
├── layout.tsx            ← Layout dengan Sidebar, FCM, Copilot
├── (main)/               ← Fitur inti ASN (29 modul!)
│   ├── agenda/           ← Agenda undangan dari surat masuk
│   ├── arsip/            ← Arsip surat
│   ├── bank-templat/     ← Template surat
│   ├── bukti-kinerja/    ← Upload bukti e-Kinerja
│   ├── checklist/        ← Checklist tugas
│   ├── dokumen/          ← Repository dokumen
│   ├── evaluasi/         ← Evaluasi kinerja
│   ├── feedback/         ← Feedback user
│   ├── formulir/         ← Form builder
│   ├── jadwal/           ← Jadwal internal OPD
│   ├── knowledge/        ← Knowledge base
│   ├── kompetensi/       ← Profil kompetensi ASN
│   ├── laporan/          ← Laporan kinerja
│   ├── logbook/          ← Logbook harian
│   ├── perencanaan/      ← Perencanaan kerja
│   ├── persetujuan-draf/ ← Persetujuan draft surat
│   ├── portal-integrasi/ ← Link ke aplikasi eksternal
│   ├── profil/           ← Profil pengguna
│   ├── rapat-virtual/    ← Rapat online
│   ├── rekap-surat/      ← Rekap surat masuk/keluar
│   ├── ruang-kerja/      ← Inbox disposisi utama
│   ├── search/           ← Pencarian global
│   ├── surat/            ← Manajemen surat masuk
│   ├── surat-keluar/     ← Surat keluar
│   ├── talenta/          ← Talent management ASN
│   ├── templat/          ← Template dokumen
│   ├── tugas/            ← Manajemen tugas
│   └── tutorial/         ← Tutorial aplikasi
├── (admin)/              ← Admin OPD (10 modul)
│   ├── admin/            ← Panel admin
│   ├── app-settings/     ← Pengaturan aplikasi
│   ├── form-builder/     ← Pembuat formulir
│   ├── jabatan/          ← Manajemen jabatan
│   ├── laporan-langganan/← Laporan untuk admin
│   ├── opd/              ← Manajemen OPD
│   ├── pengaturan-ui/    ← Kustomisasi UI
│   ├── pengumuman/       ← Manajemen pengumuman
│   └── users/            ← Manajemen pengguna
└── (fungsional)/         ← Peran fungsional khusus (6 modul)
    ├── aset/             ← Pengelolaan aset (pengurus barang)
    ├── keuangan/         ← Laporan keuangan (bendahara)
    ├── notulensi/        ← Notulensi rapat
    ├── pelayanan/        ← Pelayanan publik
    ├── skw/              ← Surat Keterangan Waris (SKW)
    └── tapem/            ← Tata pemerintahan
```

### 3.2 Komponen Unggulan yang Sudah Ada (✅)

| Komponen | Kualitas | Catatan |
|---|---|---|
| `PorosCopilot.tsx` | ⭐⭐⭐⭐ | AI Chat, draggable, dynamic prompts dari data real |
| `DelegasiWidget.tsx` | ⭐⭐⭐⭐ | Delegasi wewenang dengan Popover + Command search |
| `SmartGreeting.tsx` | ⭐⭐⭐ | Sapaan berdasarkan waktu |
| `useMasterData.ts` | ⭐⭐⭐⭐⭐ | 1-Read pattern sangat efisien |
| `useAgendaData.ts` | ⭐⭐⭐⭐ | Tanpa N+1 query, cache 10 menit |
| `TaskSummaryWidget.tsx` | ⭐⭐⭐⭐ | Interactive task management |
| FCM Setup | ⭐⭐⭐ | Push notification via layout |

### 3.3 Kelemahan Frontend (⚠️)

1. **Dashboard `page.tsx` terlalu besar** (492 baris) — bisa dipecah jadi subkomponen.
2. **Quick Access hanya 9 link statis** — tidak personalisasi per role.
3. **Tidak ada widget statistik ringkas** di Home (surat masuk hari ini, tugas menunggu, dll).
4. **`bebanKerjaPerJabatan`** di backend kosong → laporan kinerja mungkin tidak akurat.
5. **Tidak ada fitur kalender terintegrasi** di halaman utama — hanya list agenda.
6. **Mobile experience** sudah ada carousel tapi minimal.

---

## 4. Rekomendasi Pengembangan Fitur Dashboard Poros

### 🔴 Prioritas TINGGI (Berdampak Besar, Relatif Mudah)

---

#### 📌 RK-01: Widget KPI / Stats Bar di Halaman Utama
**Masalah**: Halaman utama tidak menampilkan ringkasan statistik kinerja secara sekilas.  
**Solusi**: Tambahkan row stats di atas agenda:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 📬 Surat Baru│ 📋 Disposisi │ ✅ Tugas Done│ 📅 Agenda    │
│     3        │  Perlu Dipr. │  Hari ini    │  Mendatang   │
│              │     5        │     2        │     4        │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

Data sudah tersedia di `welcomeSummary` (dari `NotificationContext`). Tinggal render widget.

**File yang diubah**: [`page.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/page.tsx), buat komponen baru `StatsBar.tsx`

---

#### 📌 RK-02: Personalisasi Quick Access per Role
**Masalah**: 9 link statis, semua user melihat hal yang sama.  
**Solusi**: Filter `quickAccessLinks` berdasarkan `userProfile.role` dan `userProfile.additionalRoles`:

```typescript
// Contoh logika
const quickAccessLinks = useMemo(() => {
  const base = [...baseLinks];
  if (userProfile?.role === 'admin_opd') base.push(adminLinks);
  if (userProfile?.additionalRoles?.includes('bendahara')) base.push(keuanganLink);
  return base;
}, [userProfile]);
```

**Dampak**: UX lebih relevan per pengguna.

---

#### 📌 RK-03: Mini Kalender Interaktif di Dashboard
**Masalah**: Agenda hanya tampil sebagai list tanpa konteks waktu.  
**Solusi**: Tambahkan mini calendar di sidebar kanan (ganti/tambah di bawah Quick Access):

```
Oktober 2026
Mo Tu We Th Fr Sa Su
                1  2
 3  4  5  6  7  8  9
10 11 [12]14  ●  16 17  ← ● = ada agenda
```

Klik tanggal → filter agenda di panel kiri.  
Library: gunakan `react-day-picker` atau buat custom (sederhana).

---

#### 📌 RK-04: Timeline Aktivitas Hari Ini (Activity Feed)
**Masalah**: Tidak ada feed real-time aktivitas harian untuk pimpinan.  
**Solusi**: Buat widget "Aktivitas Terkini" yang menampilkan log aktivitas (dari koleksi `activityLogs` yang sudah ada):

```
🕐 10:32 | Anda menyelesaikan tugas "Laporan Bulanan"
🕐 09:15 | Disposisi diterima dari Budi S.
🕐 08:30 | Surat masuk: "Undangan Rapat BKD"
```

Fungsi: memberikan pimpinan visibilitas atas tim dan dirinya sendiri.

---

### 🟡 Prioritas MENENGAH (Nilai Tinggi, Perlu Lebih Banyak Effort)

---

#### 📌 RK-05: Dashboard Kinerja Real-Time per OPD (Admin)
**Masalah**: `bebanKerjaPerJabatan` selalu `[]` di backend — laporan kinerja Admin tidak lengkap.  
**Solusi**:
1. **Backend**: Fix `generateDailyPerformanceStats` untuk menghitung beban kerja aktif dari `userSummaries`.
2. **Frontend**: Buat halaman `/admin/laporan-kinerja` dengan grafik:
   - Bar chart: Volume surat per hari (7 hari terakhir)
   - Radar chart: Kinerja per jabatan (tugas selesai, rata-rata waktu respon)
   - Leaderboard ASN paling responsif

Library: Gunakan `recharts` (sudah sering dipakai di Next.js).

---

#### 📌 RK-06: Workflow Pengingat Tugas yang Cerdas
**Masalah**: Reminder Cloud Tasks dikirim 2 jam setelah tugas dibuat — tidak kontekstual.  
**Solusi**: Tambahkan logika reminder berbasis `batasWaktu`:
- H-1 sebelum deadline → kirim notifikasi FCM + in-app
- H+0 (hari-H jika belum selesai) → eskalasi ke atasan
- Tambahkan tombol "Snooze Reminder" di UI

**Backend**: Modifikasi `taskWorkers.ts` + tambahkan Cloud Scheduler.  
**Frontend**: Tambahkan badge "Due Today" / "Overdue" di `TaskSummaryWidget`.

---

#### 📌 RK-07: Fitur "Ruang Kerja Pimpinan" — Eksekusi 1 Klik
**Masalah**: Pimpinan harus navigate ke beberapa halaman untuk menyelesaikan satu surat.  
**Solusi**: Halaman khusus pimpinan yang menggabungkan:
1. Surat perlu disposisi → langsung disposisi dari panel
2. Tugas menunggu persetujuan → approve/reject inline
3. Draft perlu TTD digital → tanda tangan di modal

**Target User**: `jabatan.level <= 3` (Pimpinan level tinggi).

---

#### 📌 RK-08: Export & Print Laporan Agenda (Upgrade)
**Masalah**: Export saat ini hanya JPEG screenshot — kualitas rendah, tidak profesional.  
**Solusi**: Ganti `html-to-image` dengan PDF generation:
- Gunakan `@react-pdf/renderer` untuk PDF agenda yang terformat rapi
- Format: Header OPD, tabel agenda, tanda tangan pimpinan
- Bisa langsung dikirim via WhatsApp / Email dari dalam app

---

### 🟢 Prioritas RENDAH / Inovasi Jangka Panjang

---

#### 📌 RK-09: AI Copilot — Upgrade Kemampuan
**Status**: Copilot sudah ada dan cukup baik.  
**Upgrade yang bisa dilakukan**:
- **RAG (Retrieval Augmented Generation)**: Copilot bisa menjawab pertanyaan tentang isi dokumen/regulasi yang diupload ke sistem
- **Drafting Surat Otomatis**: User ketik intent → AI buat draft surat formal
- **Analisis Kinerja**: "Bandingkan kinerja tim saya bulan ini vs bulan lalu"
- **Voice Input**: Integrasi Web Speech API untuk input suara

---

#### 📌 RK-10: Modul Perencanaan Kerja Terintegrasi (OKR/SKP)
**Masalah**: Modul `perencanaan` ada tapi belum terlihat integrasi dengan `evaluasi` dan `bukti-kinerja`.  
**Solusi**: Buat siklus tertutup:
```
Perencanaan SKP → Pelaksanaan (Logbook + Tugas) → Bukti E-Kinerja → Evaluasi Otomatis
```
Ini adalah fitur yang sangat bernilai untuk kepatuhan ASN.

---

#### 📌 RK-11: Notifikasi Multi-Channel
**Masalah**: Notifikasi hanya via FCM (browser push).  
**Solusi**: Tambahkan opsi:
- **WhatsApp** via Fonnte/Wa.me API — populer di kalangan ASN Indonesia
- **Email ringkasan harian** (digest) jam 07:00 pagi
- **Telegram Bot** (opsional)

---

#### 📌 RK-12: Refaktor Backend — Modularisasi Triggers
**Masalah Teknis**: `triggers/index.ts` 1403 baris — bottleneck cold start & maintainability.  
**Solusi**:
```
triggers/
├── disposisi.trigger.ts
├── surat.trigger.ts
├── tugas.trigger.ts
├── notification.trigger.ts
├── calendar.trigger.ts
└── index.ts  (re-export semua)
```

---

## 5. Ringkasan Prioritas

| No | Fitur | Dampak UX | Effort | Prioritas |
|---|---|---|---|---|
| RK-01 | Widget KPI Stats Bar | ⭐⭐⭐⭐⭐ | 🔧 Rendah | 🔴 TINGGI |
| RK-02 | Quick Access per Role | ⭐⭐⭐⭐ | 🔧 Rendah | 🔴 TINGGI |
| RK-03 | Mini Kalender | ⭐⭐⭐⭐ | 🔧🔧 Menengah | 🔴 TINGGI |
| RK-04 | Activity Feed | ⭐⭐⭐⭐ | 🔧 Rendah | 🔴 TINGGI |
| RK-05 | Dashboard Kinerja Admin | ⭐⭐⭐⭐⭐ | 🔧🔧🔧 Tinggi | 🟡 MENENGAH |
| RK-06 | Smart Task Reminder | ⭐⭐⭐⭐ | 🔧🔧 Menengah | 🟡 MENENGAH |
| RK-07 | Ruang Kerja Pimpinan | ⭐⭐⭐⭐⭐ | 🔧🔧🔧 Tinggi | 🟡 MENENGAH |
| RK-08 | Export PDF Agenda | ⭐⭐⭐ | 🔧🔧 Menengah | 🟡 MENENGAH |
| RK-09 | AI Copilot Upgrade | ⭐⭐⭐⭐ | 🔧🔧🔧 Tinggi | 🟢 RENDAH |
| RK-10 | Siklus SKP-Kinerja | ⭐⭐⭐⭐⭐ | 🔧🔧🔧🔧 Sangat Tinggi | 🟢 RENDAH |
| RK-11 | Notif WhatsApp/Email | ⭐⭐⭐⭐ | 🔧🔧 Menengah | 🟢 RENDAH |
| RK-12 | Refaktor Triggers | N/A (teknis) | 🔧🔧 Menengah | 🟡 MENENGAH |

---

> **Rekomendasi Mulai**: Implementasikan **RK-01** (Stats Bar) dan **RK-04** (Activity Feed) terlebih dahulu — keduanya menggunakan data yang sudah ada (`welcomeSummary`), effort minimal, namun dampak visual dan UX sangat signifikan.
