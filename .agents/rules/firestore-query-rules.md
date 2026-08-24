# Aturan Firestore: Query, Index, Batch Write & Keamanan (RUANG SIGAP)

Dokumen ini mendefinisikan guardrail mutlak untuk berinteraksi dengan Firestore secara aman, efisien, dan konsisten di seluruh proyek RUANG SIGAP / POROS.

```
Database ID : database-siyap
Region      : asia-southeast2 (Jakarta)
```

---

## 1. 🔒 Isolasi Data per-OPD (KRITIS)

**Setiap query** ke koleksi yang memiliki field `opdId` **WAJIB** menyertakan filter `where('opdId', '==', userProfile.opdId)`. Ini adalah aturan keamanan paling fundamental.

**❌ DILARANG KERAS — Bocor Data Lintas OPD:**
```tsx
// Mengambil SEMUA surat dari semua OPD — BERBAHAYA!
const q = query(collection(db, 'surat'));
```

**✅ WAJIB — Selalu Filter opdId:**
```tsx
// Hanya surat dari OPD pengguna yang sedang login
const q = query(
  collection(db, 'surat'),
  where('opdId', '==', userProfile.opdId),
  orderBy('tanggalDiterima', 'desc'),
  limit(20)
);
```

---

## 2. 🚦 Wajib: Gunakan `limit()` pada Setiap Query

- **Dilarang** membuat query tanpa `limit()` kecuali ada justifikasi yang sangat kuat (misal: export data atau cron job backend).
- Default limit yang direkomendasikan:
  - Daftar surat / disposisi: `limit(20)` atau `limit(10)` dengan paginasi.
  - Notifikasi: `limit(50)`.
  - Jabatan dalam OPD: `limit(200)` (jabatan tidak terlalu banyak).

```tsx
const q = query(
  collection(db, 'surat'),
  where('opdId', '==', opdId),
  where('statusPenyelesaian', '==', 'Baru'),
  orderBy('tanggalDiterima', 'desc'),
  limit(20)  // ✅ Wajib ada
);
```

---

## 3. ⏱️ Timestamp: Selalu `serverTimestamp()`

- **Dilarang** menggunakan `new Date()` atau `Date.now()` untuk menyimpan timestamp ke Firestore.
- **Wajib** gunakan `serverTimestamp()` dari `firebase/firestore` agar konsisten dengan waktu server dan tidak terpengaruh clock skew perangkat klien.

```tsx
import { serverTimestamp } from 'firebase/firestore';

// ✅ Benar
await addDoc(collection(db, 'surat'), {
  perihal: 'Contoh Surat',
  tanggalDiterima: serverTimestamp(),  // ✅
  createdAt: serverTimestamp(),         // ✅
});

// ❌ Salah
await addDoc(collection(db, 'surat'), {
  tanggalDiterima: new Date(),  // ❌ Rawan clock skew
});
```

---

## 4. 📦 Batch Write & Transaksi Atomik

Setiap operasi yang **memutasi lebih dari satu dokumen** secara bersamaan **WAJIB** menggunakan `db.batch()` atau `runTransaction()` agar operasi bersifat atomik (semua berhasil atau semua gagal).

```tsx
import { writeBatch, doc, runTransaction } from 'firebase/firestore';

// ✅ Pola Batch Write (operasi yang tidak saling bergantung)
const batch = writeBatch(db);
batch.update(doc(db, 'surat', suratId), { statusPenyelesaian: 'Didisposisikan' });
batch.set(doc(db, 'disposisi', disposisiId), disposisiData);
batch.set(doc(db, 'notifications', notifId), notifData);
await batch.commit();

// ✅ Pola Transaction (operasi yang saling bergantung / perlu baca-tulis)
await runTransaction(db, async (transaction) => {
  const suratSnap = await transaction.get(suratRef);
  const currentCount = suratSnap.data()?.disposisiCount || 0;
  transaction.update(suratRef, { disposisiCount: currentCount + 1 });
});
```

**Batas Batch:** Maksimum 500 operasi per batch. Jika melebihi, gunakan chunking.

---

## 5. 🗂️ Composite Index

Setiap query yang menggunakan **lebih dari satu filter berbeda** atau **kombinasi filter + orderBy** **WAJIB** memiliki composite index yang terdefinisi di `firestore.indexes.json`.

```tsx
// Query ini membutuhkan composite index:
// [opdId ASC] + [statusPenyelesaian ASC] + [tanggalDiterima DESC]
const q = query(
  collection(db, 'surat'),
  where('opdId', '==', opdId),
  where('statusPenyelesaian', '==', 'Baru'),
  orderBy('tanggalDiterima', 'desc')
);
```

Tambahkan ke `firestore.indexes.json`:
```json
{
  "collectionGroup": "surat",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "opdId", "order": "ASCENDING" },
    { "fieldPath": "statusPenyelesaian", "order": "ASCENDING" },
    { "fieldPath": "tanggalDiterima", "order": "DESCENDING" }
  ]
}
```

Jika Firestore melempar error "Missing index", selalu deploy indexnya terlebih dahulu sebelum melanjutkan.

---

## 6. 💾 File Besar: Gunakan Firebase Storage

- **Dilarang** menyimpan konten file (PDF, gambar, video) langsung di Firestore.
- File besar (> 1 MB) **WAJIB** diunggah ke Firebase Storage, lalu simpan URL-nya di Firestore.
- Ukuran dokumen Firestore dibatasi **1 MB**; menyimpan blob akan menyebabkan error.

```tsx
// ✅ Benar: Simpan URL, bukan file
await updateDoc(suratRef, {
  fileUrl: 'https://firebasestorage.googleapis.com/...',  // ✅
  fileName: 'surat-undangan.pdf',
  fileSize: 245000,
});

// ❌ Salah: Jangan simpan base64 atau blob di Firestore
await updateDoc(suratRef, {
  fileContent: base64String,  // ❌ Bisa melebihi 1MB!
});
```

---

## 7. 🔄 Double-Write & Denormalisasi

- Setiap data yang **didenormalisasi** (disalin ke beberapa koleksi) **HARUS** memiliki Firestore Trigger yang menjaga konsistensinya.
- Semua trigger sinkronisasi diletakkan di `functions/src/triggers/doubleWrite.ts`.
- Jangan melakukan double-write dari frontend; selalu andalkan trigger backend.

Contoh denormalisasi yang sudah ada:
- `namaJabatan` di `users/{nip}` ← sync dari `jabatan/{jabatanId}`
- `namaOpd` di semua dokumen surat ← sync dari `opd/{opdId}`
- `penerimaSnapshot` di `disposisi/{id}` ← snapshot saat disposisi dibuat

---

## 8. 🔑 Pola Penomoran & ID Dokumen

| Koleksi | ID Dokumen | Contoh |
|---------|-----------|--------|
| `surat` | Auto-ID Firestore | `xK8mN2pQrT...` |
| `disposisi` | Auto-ID Firestore | `yL9nO3qSuV...` |
| `logbook` | `{userId}_{YYYY-MM-DD}` | `abc123_2026-08-24` |
| `users` | NIP pengguna | `197001012000011001` |
| `jabatan` | Manual (slug) | `kadis-pendidikan` |
| `kinerja_agregat` | `{opdId}_{YYYY-MM-DD}` | `dinas-pendidikan_2026-08-24` |

---

## 9. 📡 Realtime Listener: Selalu Unsubscribe

Setiap `onSnapshot` listener **WAJIB** di-cleanup saat komponen unmount:

```tsx
useEffect(() => {
  const q = query(collection(db, 'notifications'), where('userId', '==', uid));
  
  // Simpan fungsi unsubscribe
  const unsubscribe = onSnapshot(q, (snapshot) => {
    setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
  
  // ✅ Wajib: Cleanup saat unmount
  return () => unsubscribe();
}, [uid]);
```

---

## 10. 🚫 Anti-Pattern yang Dilarang

| Anti-Pattern | Penjelasan |
|-------------|-----------|
| `getDocs(collection(db, 'surat'))` tanpa filter | Bocor data lintas OPD |
| `Timestamp.now()` di client | Gunakan `serverTimestamp()` |
| Update dokumen dalam loop `for` | Gunakan `batch.update()` |
| Nested subcollection terlalu dalam | Maksimum 1 level subcollection |
| Delete koleksi dari client | Gunakan Cloud Function |
| Query tanpa index yang tepat | Buat composite index terlebih dahulu |
