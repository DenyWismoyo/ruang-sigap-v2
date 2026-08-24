---
name: sigap-cloud-functions
description: Template dan pola standar untuk membuat atau memodifikasi Firebase Cloud Functions v2 (Cloud Run) pada platform RUANG SIGAP. Gunakan saat membuat HTTP Callable Function baru, Firestore Trigger baru, atau Cron Job baru.
---

# Cloud Functions v2 — Template & Pola Standar RUANG SIGAP

```
Runtime    : Firebase Functions v2 (Cloud Run)
Region     : asia-southeast2 (Jakarta)
Database   : database-siyap
```

---

## 📁 Struktur File Backend

```
functions/src/
├── index.ts                    # Entry point: ekspor semua fungsi
├── api/index.ts                # HTTP Callable: Auth, User, OPD management
├── aiFunctions.ts              # HTTP Callable: Gemini AI scan surat
├── triggers/
│   ├── index.ts                # Semua Firestore triggers utama
│   ├── logbookTriggers.ts      # Auto-logbook entry triggers
│   ├── doubleWrite.ts          # Data sync/denormalisasi triggers
│   └── sessionTriggers.ts      # Session cleanup triggers
├── cron/index.ts               # Cloud Scheduler (cron jobs)
├── utils/                      # Helper functions bersama
├── types/index.ts              # Tipe data backend
├── config/                     # Konfigurasi region, dll.
├── autoHeal.ts                 # Auto-repair data
├── backupFunction.ts           # Backup Firestore
├── compressPdf.ts              # Kompresi PDF
├── lintasOpd.ts                # Surat lintas instansi
└── agregasiSummaries.ts        # Manual trigger agregasi KPI
```

---

## 🔧 Template 1: HTTP Callable Function

Gunakan pola ini untuk membuat fungsi yang dipanggil langsung dari frontend.

```typescript
// functions/src/api/index.ts (atau file tematik)
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { checkPermission } from '../utils/helpers';

const db = getFirestore('database-siyap');

export const namaFungsiBaru = onCall(
  {
    region: 'asia-southeast2',      // ✅ WAJIB region jakarta
    timeoutSeconds: 60,              // Sesuaikan (max 540 untuk task berat)
    memory: '256MiB',                // '256MiB' | '512MiB' | '1GiB'
    // secrets: ['NAMA_SECRET'],     // Tambahkan jika perlu Secret Manager
  },
  async (request) => {
    // ─── 1. Validasi Autentikasi ───
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Anda harus login terlebih dahulu.');
    }

    // ─── 2. Ekstrak Data Pengguna dari JWT Claims ───
    const { uid, token } = request.auth;
    const opdId = token.opdId as string;
    const jabatanId = token.jabatanId as string;
    const role = token.role as string;

    // ─── 3. Validasi Permission (jika diperlukan) ───
    await checkPermission(uid, 'admin_opd'); // Opsional, throw jika gagal

    // ─── 4. Validasi Input ───
    const { targetId, namaField } = request.data;
    if (!targetId) {
      throw new HttpsError('invalid-argument', 'Parameter `targetId` wajib diisi.');
    }

    // ─── 5. Logika Bisnis ───
    try {
      const docRef = db.collection('koleksi').doc(targetId);
      const docSnap = await docRef.get();

      if (!docSnap.exists) {
        throw new HttpsError('not-found', `Dokumen ${targetId} tidak ditemukan.`);
      }

      // Pastikan dokumen milik OPD yang sama (isolasi data)
      if (docSnap.data()?.opdId !== opdId) {
        throw new HttpsError('permission-denied', 'Akses ke data OPD lain tidak diizinkan.');
      }

      // Gunakan batch untuk operasi multi-dokumen atomik
      const batch = db.batch();
      batch.update(docRef, {
        namaField: namaField,
        updatedAt: FieldValue.serverTimestamp(),
      });
      // Tambahkan operasi batch lain jika diperlukan...
      await batch.commit();

      // ─── 6. Return Response ───
      return { success: true, message: 'Berhasil diproses.' };

    } catch (error) {
      // Re-throw HttpsError agar pesan sampai ke client
      if (error instanceof HttpsError) throw error;
      // Wrap error umum menjadi HttpsError
      console.error('[namaFungsiBaru] Error:', error);
      throw new HttpsError('internal', 'Terjadi kesalahan internal server.');
    }
  }
);
```

**Daftarkan di `functions/src/index.ts`:**
```typescript
export { namaFungsiBaru } from './api/index'; // atau file yang tepat
```

---

## 🔧 Template 2: Firestore Trigger (onCreate)

```typescript
// functions/src/triggers/index.ts
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { sendFcmMessageByUid, updateUserSummary, createLogbookEntry } from '../utils/helpers';

const db = getFirestore('database-siyap');

export const onNamaKoleksiCreated = onDocumentCreated(
  {
    document: 'nama_koleksi/{docId}',
    region: 'asia-southeast2',   // ✅ WAJIB
    timeoutSeconds: 120,
    memory: '256MiB',
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data();
    const docId = event.params.docId;
    const { opdId, targetUserId } = data;

    try {
      const batch = db.batch();

      // 1. Kirim push notification FCM ke target
      if (targetUserId) {
        await sendFcmMessageByUid(targetUserId, {
          title: 'Notifikasi Baru',
          body: `Ada item baru: ${data.perihal || docId}`,
          data: { type: 'nama_koleksi', docId },
        });
      }

      // 2. Buat in-app notification
      const notifRef = db.collection('notifications').doc();
      batch.set(notifRef, {
        userId: targetUserId,
        opdId,
        type: 'NAMA_KOLEKSI_BARU',
        title: 'Ada Item Baru',
        message: data.perihal,
        referensiId: docId,
        isRead: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      // 3. Update counter KPI (userSummaries)
      await updateUserSummary(data.targetJabatanId, 'suratBaruCount', 1);

      // 4. Buat entri logbook otomatis
      await createLogbookEntry({
        userId: data.pembuatUid,
        opdId,
        deskripsi: `Membuat item baru: ${data.perihal}`,
        kategori: 'Umum',
        referensiId: docId,
      });

      await batch.commit();
    } catch (error) {
      console.error(`[onNamaKoleksiCreated] Error pada docId ${docId}:`, error);
      // Lempar error agar Cloud Run mencatat dan bisa retry
      throw error;
    }
  }
);
```

---

## 🔧 Template 3: Cron Job (Cloud Scheduler)

```typescript
// functions/src/cron/index.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore('database-siyap');

export const namaJobTerjadwal = onSchedule(
  {
    schedule: '0 7 * * *',          // Cron expression: Setiap hari 07:00 WIB
    timeZone: 'Asia/Jakarta',        // ✅ WAJIB timezone
    region: 'asia-southeast2',       // ✅ WAJIB region
    timeoutSeconds: 540,             // Max untuk cron job berat
    memory: '1GiB',
  },
  async (_event) => {
    console.log('[namaJobTerjadwal] Mulai eksekusi...');
    const startTime = Date.now();

    try {
      // Kueri semua OPD aktif
      const opdSnap = await db.collection('opd_config')
        .where('status', '==', 'aktif')
        .get();

      // Proses paralel dengan Promise.allSettled (agar 1 OPD gagal tidak menghentikan yang lain)
      const results = await Promise.allSettled(
        opdSnap.docs.map(async (opdDoc) => {
          const opdId = opdDoc.id;
          try {
            // ── Logika per OPD ──
            console.log(`[namaJobTerjadwal] Memproses OPD: ${opdId}`);
            // ...
          } catch (opdError) {
            console.error(`[namaJobTerjadwal] Gagal untuk OPD ${opdId}:`, opdError);
          }
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      console.log(`[namaJobTerjadwal] Selesai. Berhasil: ${successCount}/${opdSnap.size}. Durasi: ${Date.now() - startTime}ms`);

    } catch (error) {
      console.error('[namaJobTerjadwal] Error fatal:', error);
      throw error;
    }
  }
);
```

---

## 🔑 Jadwal Cron yang Sudah Ada (Jangan Duplikasi)

| Fungsi | Cron | Waktu WIB |
|--------|------|-----------|
| `sendAgendaReminders` | `every 15 minutes` | Setiap 15 menit |
| `archiveOldInvitations` | `0 1 * * *` | 01:00 |
| `generateDailyPerformanceStats` | `0 2 * * *` | 02:00 |
| `cleanupRateLimits` | `0 3 * * *` | 03:00 |
| `checkOverdueTasks` | `0 7 * * *` | 07:00 |
| `generateWeeklyReport` | `0 16 * * 5` | Jumat 16:00 |
| `generateMonthlyTagihan` | `0 0 1 * *` | Tanggal 1, 00:00 |

---

## ⚡ Helper Functions Tersedia (`functions/src/utils/`)

```typescript
// Impor dari utils/helpers.ts
import {
  getUserNameFromJabatanId,  // Cari nama user dari jabatanId
  getUserIdFromJabatanId,    // Cari UID user dari jabatanId
  getUserNameFromUid,         // Cari nama dari UID
  generateSearchKeywords,     // Generate keywords full-text search
  sendFcmMessageByUid,        // Kirim FCM push notif ke user
  updateUserSummary,          // Increment/decrement counter KPI
  checkPermission,            // Validasi role user
  createLogbookEntry,         // Buat entri logbook otomatis
  createCalendarEvent,        // Buat event Google Calendar
} from '../utils/helpers';

// Contoh penggunaan
await sendFcmMessageByUid(uid, {
  title: 'Disposisi Baru',
  body: 'Anda mendapat disposisi surat: ...',
  data: { type: 'DISPOSISI', disposisiId: 'xxx' },
});

await updateUserSummary(jabatanId, 'disposisiBaru', +1); // Increment
await updateUserSummary(jabatanId, 'disposisiBaru', -1); // Decrement
```

---

## 🔐 Akses Secret Manager

Untuk fungsi yang membutuhkan API key (Gemini, dll.):

```typescript
export const fungsiDenganSecret = onCall(
  {
    region: 'asia-southeast2',
    secrets: ['GEMINI_API_KEY'],  // Daftarkan nama secret di sini
  },
  async (request) => {
    // Akses secret via process.env
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new HttpsError('internal', 'Konfigurasi API key tidak valid.');
    // ...
  }
);
```

---

## 📦 Deploy & Testing

```bash
# Deploy semua functions
cd functions && firebase deploy --only functions

# Deploy 1 fungsi tertentu saja
firebase deploy --only functions:namaFungsiBaru

# Emulator lokal (testing tanpa deploy)
firebase emulators:start --only functions,firestore

# TypeScript check sebelum deploy
cd functions && npx tsc --noEmit
```

---

## 🚫 Anti-Pattern Backend yang Dilarang

| Anti-Pattern | Aturan |
|-------------|--------|
| `region: 'us-central1'` | Selalu gunakan `'asia-southeast2'` |
| `getFirestore()` tanpa database ID | Gunakan `getFirestore('database-siyap')` |
| Nested `await` dalam loop `for` | Gunakan `Promise.all()` atau `Promise.allSettled()` |
| `throw new Error()` di callable | Gunakan `HttpsError` dengan kode yang tepat |
| Update banyak dokumen satu per satu | Gunakan `db.batch()` |
| Mengakses Firestore tanpa cek `opdId` | Selalu validasi isolasi data OPD |
