# PETA FUNGSI BACKEND - RUANG SIGAP

> Dokumen ini memetakan secara teknis seluruh fungsi backend yang berjalan di Firebase Cloud Functions.
> Region: asia-southeast2 (Jakarta) | Database: database-siyap

---

## KATEGORI FUNGSI BACKEND

Backend RUANG SIGAP terdiri dari 6 kategori utama fungsi:

```
1. HTTP Callable Functions  -> Dipanggil langsung dari frontend
2. Firestore Triggers       -> Bereaksi terhadap perubahan database
3. Cron Jobs (Scheduler)    -> Berjalan otomatis terjadwal
4. Utility Functions        -> Helper, migration, maintenance
5. AI Functions             -> Integrasi Gemini AI
6. Integration Functions    -> Google Drive, FCM, dll
```

---

## BAGIAN 1: HTTP CALLABLE FUNCTIONS

### 1.1 Authentication & User Management (`api/index.ts`)

| Nama Fungsi | Deskripsi | Input | Output |
|------------|-----------|-------|--------|
| `checkAdminEmail` | Validasi apakah email terdaftar sebagai Admin/Staf TU | `email: string` | `{ nip: string }` |
| `getEmailFromNip` | Konversi NIP ke email Firebase Auth untuk user biasa | `nip: string` | `{ email: string }` |
| `setNipClaim` | Set custom JWT claims (level, opdId, role, theme) | `nip: string` | success/error |
| `createUser` | Buat user baru oleh Admin OPD | UserProfile data | success/error |
| `updateUser` | Update data user (role, jabatan, status) | UserProfile data | success/error |
| `deactivateUser` | Non-aktifkan akun user | `uid: string` | success/error |
| `assignPlt` | Tunjuk PLT untuk jabatan tertentu | `jabatanId, userId, dates` | success/error |
| `revokeGoogleAccess` | Cabut akses Google OAuth user | `userId: string` | success/error |

### 1.2 OPD Management (`api/index.ts`)

| Nama Fungsi | Deskripsi |
|------------|-----------|
| `createOpd` | Buat instansi OPD baru (Super Admin) |
| `updateOpdConfig` | Update konfigurasi paket & fitur OPD |
| `activateOpdFeature` | Aktifkan/nonaktifkan fitur per OPD |
| `generateTagihan` | Generate tagihan bulanan per OPD |

### 1.3 AI Functions (`aiFunctions.ts`)

```typescript
// Fungsi utama AI Scan Surat
export const extractSuratDataAIV2 = onCall({
    region: "asia-southeast2",
    timeoutSeconds: 60,
    memory: "512MiB",
    secrets: ["GEMINI_API_KEY"]
}, async (request) => {
    // 1. Validasi autentikasi
    // 2. Rate limiting via Firestore transaction (cooldown 30 detik)
    // 3. Kirim base64 image ke Gemini 2.5 Flash Lite API
    // 4. Parse response JSON dengan schema:
    //    { nomorSurat, perihal, pengirim, tanggalSurat, jenisSurat,
    //      detailAgenda: { tanggal, jam, lokasi } }
    // 5. Return data terstruktur ke frontend
});
```

**Prompt Engineering yang digunakan:**
- Extract nomor surat, perihal (dengan enrichment jika terlalu singkat)
- Identifikasi nama instansi pengirim (bukan nama pejabat)
- Deteksi jenis surat (Undangan/Pemberitahuan/Permohonan/Lainnya)
- Ekstrak detail agenda (tanggal, jam, lokasi) jika surat undangan
- Output dalam format JSON terstruktur

### 1.4 Google Drive Integration (`src/app/api/google/`)

| Endpoint | Fungsi |
|---------|--------|
| `POST /api/google/upload` | Upload file ke Google Drive user |
| `GET /api/google/auth` | Initiate Google OAuth flow |
| `GET /api/google/callback` | Handle OAuth callback, simpan tokens |
| `POST /api/google/refresh` | Refresh Google access token |

### 1.5 Utility Functions

| Nama Fungsi | File | Deskripsi |
|------------|------|-----------|
| `triggerAgregatSummaries` | `agregasiSummaries.ts` | Manual trigger agregasi KPI per OPD |
| `rebuildMasterData` | `masterDataAggregator.ts` | Rebuild master data jabatan/user |
| `runAutoHeal` | `autoHeal.ts` | Perbaiki inkonsistensi data (missing jabatan, counter salah) |
| `backupFirestore` | `backupFunction.ts` | Export Firestore ke Cloud Storage |
| `sendSuratLintasOpd` | `lintasOpd.ts` | Kirim surat ke OPD lain |
| `compressAndUploadPdf` | `compressPdf.ts` | Kompresi PDF sebelum disimpan |
| `manualMigrateOpd` | `manualMigrateOpd.ts` | Migrasi data satu OPD ke schema baru |
| `migrateSubcollections` | `migrateSubcollections.ts` | Migrasi struktur subcollection Firestore |
| `runTaskWorker` | `taskWorkers.ts` | Proses background tasks antrian |

---

## BAGIAN 2: FIRESTORE TRIGGERS

### 2.1 Triggers Utama (`triggers/index.ts`)

#### onDisposisiCreate
```
Trigger: disposisi/{disposisiId} - onCreate
Aksi:
  1. Kirim push notification FCM ke semua penerima disposisi
  2. Buat in-app notification di koleksi `notifications`
  3. Update status surat menjadi "Didisposisikan"
  4. Increment counter `disposisiBaru` untuk penerima
  5. Trigger buat logbook entry untuk pengirim
  6. Auto-cleanup jika pengirim = penerima (self-disposition)
```

#### onDisposisiSummaryUpdate
```
Trigger: disposisi/{disposisiId} - onWrite
Kasus 1 - Disposisi BARU:
  - Log untuk future reference

Kasus 2 - Disposisi DIUPDATE (penerima terima):
  - Decrement `disposisiBaru` untuk penerima yang baru terima
  - Decrement `suratBaruCount` untuk penerima
  - Increment `tindakLanjutMenunggu` jika surat belum selesai

Kasus 3 - Disposisi DIHAPUS:
  - Decrement counter yang relevan untuk semua penerima
```

#### onSuratSummaryUpdate
```
Trigger: surat/{suratId} - onUpdate
Aksi ketika status berubah ke Selesai/Diarsipkan:
  1. Cari semua disposisi terkait surat ini
  2. Decrement `tindakLanjutMenunggu` untuk semua penerima
  3. Update counter pimpinan (suratBaruCount)
```

#### onTindakLanjutCreate
```
Trigger: tindak_lanjut/{tlId} - onCreate
Aksi:
  1. Kirim push notification ke pengirim disposisi
  2. Buat in-app notification
  3. Jika mode "Selesaikan & Tutup": tandai penerimaSelesai[]
  4. Cek apakah semua penerima disposisi sudah selesai
  5. Jika semua selesai: update status surat ke "Selesai"
  6. Buat entri bukti kinerja otomatis
```

#### onTugasCreate
```
Trigger: tugas/{tugasId} - onCreate
Aksi:
  1. Kirim push notification FCM ke penerima tugas
  2. Buat in-app notification
  3. Increment counter `tugasBaruCount` untuk penerima
```

#### onTugasUpdate (status selesai)
```
Trigger: tugas/{tugasId} - onUpdate (status: Baru->Selesai)
Aksi:
  1. Decrement counter `tugasAktif` untuk penerima
  2. Buat entri logbook "Menyelesaikan tugas: [Judul]"
  3. Buat entri bukti kinerja otomatis
  4. Increment `tanggalSelesai` pada dokumen tugas
```

#### onDrafPersetujuanCreate
```
Trigger: draf_persetujuan/{drafId} - onCreate
Aksi:
  1. Kirim push notification ke reviewer pertama dalam rantai
  2. Buat in-app notification di Ruang Kerja reviewer
```

#### onDrafPersetujuanUpdate (disetujui/direvisi)
```
Trigger: draf_persetujuan/{drafId} - onUpdate
Aksi ketika step disetujui:
  1. Advance ke reviewer berikutnya dalam rantai
  2. Kirim notifikasi ke reviewer berikutnya
  3. Jika semua step selesai: update status ke "Selesai"
Aksi ketika direvisi:
  1. Kirim notifikasi ke pembuat draf
  2. Update status ke "Revisi"
```

#### onPengumumanCreate
```
Trigger: pengumuman/{pengumumanId} - onCreate
Aksi:
  1. Query semua user dalam target OPD
  2. Kirim push notification FCM batch ke semua user
  3. Buat in-app notification untuk masing-masing user
```

#### onJadwalTempatCreate/Update
```
Trigger: jadwal_tempat/{jadwalId} - onCreate/onUpdate (status: Disetujui)
Aksi ketika jadwal disetujui:
  1. Query semua peserta yang terdaftar
  2. Kirim push notification ke semua peserta
  3. Jadwal otomatis muncul di Agenda Harian peserta
```

### 2.2 Logbook Triggers (`triggers/logbookTriggers.ts`)

```typescript
// Auto-buat entri logbook untuk setiap aksi penting

onDisposisiSent: {
    entri: "Mendisposisikan surat: [perihal]",
    kategori: "Disposisi",
    userId: pengirim
}

onDisposisiAcknowledged: {
    entri: "Menerima disposisi surat: [perihal]",
    kategori: "Disposisi",
    userId: penerima
}

onTindakLanjutSent: {
    entri: "Tindak Lanjut Surat: [perihal] - [judul laporan]",
    kategori: "Laporan",
    userId: pelapor
}

onSuratSelesai: {
    entri: "Menyelesaikan surat: [perihal]",
    kategori: "Surat",
    userId: yang_menyelesaikan
}

onSuratDiarsipkan: {
    entri: "Mengarsipkan surat: [perihal]",
    kategori: "Surat",
    userId: yang_mengarsipkan
}

onTugasSelesai: {
    entri: "Menyelesaikan tugas: [judulTugas]",
    kategori: "Tugas",
    userId: penerima_tugas
}
```

Semua entri logbook disimpan ke koleksi `logbook/{userId_YYYY-MM-DD}` dengan struktur array `kegiatan[]`.

### 2.3 Double Write Triggers (`triggers/doubleWrite.ts`)

Fungsi sinkronisasi untuk menjaga konsistensi data denormalisasi:

```
Ketika jabatan diupdate:
  -> Update field namaJabatan, level di semua user yang punya jabatanId tersebut

Ketika user diupdate:
  -> Update nama user di disposisi yang pending terkait user ini

Ketika OPD diupdate:
  -> Update nama OPD di semua dokumen yang menyimpan namaOpd
```

---

## BAGIAN 3: CRON JOBS (SCHEDULED FUNCTIONS)

### Jadwal Lengkap

| Fungsi | Cron Expression | Waktu | Deskripsi |
|--------|----------------|-------|-----------|
| `sendAgendaReminders` | `every 15 minutes` | Setiap 15 menit | Cek agenda 1 jam ke depan, kirim reminder |
| `archiveOldInvitations` | `0 1 * * *` | 01:00 WIB | Auto-arsip undangan yang sudah lewat tanggal |
| `generateDailyPerformanceStats` | `0 2 * * *` | 02:00 WIB | Agregasi KPI kinerja semua OPD |
| `generateWeeklyReport` | `0 16 * * 5` | Jumat 16:00 WIB | Kirim laporan mingguan ke pimpinan |
| `checkOverdueTasks` | `0 7 * * *` | 07:00 WIB | Tandai tugas lewat deadline, kirim reminder |
| `generateMonthlyTagihan` | `0 0 1 * *` | 00:00 tgl 1 | Generate tagihan bulanan per OPD |
| `cleanupRateLimits` | `0 3 * * *` | 03:00 WIB | Hapus dokumen rate_limit kadaluwarsa |

### Detail: `sendAgendaReminders`

```
Input: Query surat jenis Undangan, reminderSent=false, tanggal >= now
Logic:
  1. Filter surat dengan agenda dalam window 60-75 menit dari sekarang
  2. Gunakan Firestore Transaction untuk idempotency (cegah double reminder)
  3. Query penerima disposisi terakhir untuk surat tersebut
  4. Kirim push notification FCM ke semua penerima
  5. Set reminderSent=true pada surat (mencegah pengiriman ulang)
```

### Detail: `generateDailyPerformanceStats`

```
Resource: memory 1GiB, timeout 540 detik
Input: Data kemarin (00:00 - 23:59)
Output: Dokumen kinerja_agregat/{opdId_YYYY-MM-DD}

Metrics yang dihitung per OPD:
- totalSuratMasuk (count surat tanggalDiterima kemarin)
- totalDisposisi (count disposisi tanggalDisposisi kemarin)
- totalTugas (count tugas tanggalDibuat kemarin)
- rataRataWaktuResponsDisposisi (rata-rata menit dari surat masuk ke disposisi)
- persentasePenyelesaianTepatWaktu (% tugas selesai sebelum deadline)
- bebanKerjaPerJabatan (count disposisi aktif + tugas aktif per jabatan)
- kinerjaPerJabatan (jumlah selesai, rata-rata waktu, dll per jabatan)
```

---

## BAGIAN 4: HELPER FUNCTIONS (`utils/helpers.ts`)

| Helper | Deskripsi |
|--------|-----------|
| `getUserNameFromJabatanId(jabatanId)` | Cari nama user dari ID jabatan |
| `getUserIdFromJabatanId(jabatanId)` | Cari UID user dari ID jabatan |
| `getUserNameFromUid(uid)` | Cari nama user dari UID |
| `generateSearchKeywords(text)` | Generate keywords untuk full-text search Firestore |
| `createRfc3339DateTimeWIB(timestamp)` | Format timestamp ke RFC3339 WIB |
| `createCalendarEvent(data)` | Buat event Google Calendar via API |
| `sendFcmMessageByUid(uid, message)` | Kirim FCM push notification ke user |
| `updateUserSummary(userId, field, delta)` | Increment/decrement counter KPI user |
| `checkPermission(uid, requiredRole)` | Validasi role user untuk aksi admin |

---

## BAGIAN 5: DATA FLOW DIAGRAM

### Alur Lengkap Surat Masuk

```
[Staf TU] 
    |
    v
[Upload PDF] -> [AI Scan: Gemini API] -> [Form Auto-filled]
    |
    v
[Simpan ke Firestore: surat/]
    |
    v
[Trigger: onSuratCreate]
    |-> Generate searchKeywords[]
    |-> Set tujuanJabatanId (pimpinan teratas OPD)
    |-> Update suratBaruCount pimpinan
    |
    v
[Pimpinan melihat SURAT_BARU di Ruang Kerja]
    |
    v
[Pimpinan klik Disposisikan]
    |
    v
[Simpan ke Firestore: disposisi/]
    |
    v
[Trigger: onDisposisiCreate]
    |-> FCM Push Notification ke penerima
    |-> In-App Notification
    |-> Update status surat: Didisposisikan
    |-> Logbook entry untuk pengirim
    |
    v
[Penerima melihat SURAT_DISPOSISI di Ruang Kerja]
    |
    v
[Penerima klik Terima Disposisi]
    |
    v
[Update Firestore: disposisi.penerimaDiterima[]]
    |
    v
[Trigger: onDisposisiSummaryUpdate]
    |-> FCM Push Notification ke pengirim "disposisi diterima"
    |-> Decrement disposisiBaru
    |-> Increment tindakLanjutMenunggu
    |-> Logbook entry untuk penerima
    |
    v
[Penerima klik Lapor Tindak Lanjut / Selesaikan & Tutup]
    |
    v
[Simpan ke Firestore: tindak_lanjut/]
    |
    v
[Trigger: onTindakLanjutCreate]
    |-> FCM Push Notification ke pengirim disposisi
    |-> Buat Bukti Kinerja otomatis
    |-> Logbook entry untuk pelapor
    |-> Jika "Selesaikan & Tutup": update penerimaSelesai[]
    |-> Cek: semua selesai? -> Update surat status: Selesai
```

---

## BAGIAN 6: KEAMANAN BACKEND

### Firebase Auth Custom Claims Structure

```json
{
  "nip": "197001012000011001",
  "role": "user",
  "opdId": "dinas-pendidikan",
  "level": 3,
  "jabatanId": "jabatan_001",
  "appTheme": "sigap"
}
```

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users hanya bisa baca data mereka sendiri
    match /users/{nip} {
      allow read: if request.auth.token.nip == nip
                  || request.auth.token.role == 'admin_opd'
                  || request.auth.token.role == 'super_admin';
      allow write: if request.auth.token.role == 'admin_opd'
                   || request.auth.token.role == 'super_admin';
    }
    
    // Surat: hanya bisa akses surat dari OPD sendiri
    match /surat/{suratId} {
      allow read: if request.auth.token.opdId == resource.data.opdId;
      allow create: if request.auth.token.role == 'staf_tu'
                    || request.auth.token.role == 'admin_opd';
      allow update: if request.auth.token.opdId == resource.data.opdId;
    }
    
    // Dan seterusnya untuk setiap koleksi...
  }
}
```

### Rate Limiting AI

```typescript
// Mekanisme rate limiting berbasis Firestore Transaction
// Mencegah race condition (idempotent)

await db.runTransaction(async (transaction) => {
    const rateLimitDoc = await transaction.get(rateLimitRef);
    const timeDiff = now - rateLimitDoc.data()?.lastCallTime;
    
    if (timeDiff < 30_000) { // 30 detik cooldown
        throw new HttpsError("resource-exhausted", 
            `Tunggu ${remainingTime} detik`);
    }
    
    transaction.set(rateLimitRef, { lastCallTime: now });
});
```

---

*Dokumen ini adalah bagian dari seri audit. Lihat juga `01-PETA-FITUR-LENGKAP.md` dan `03-ESTIMASI-BIAYA.md`.*
