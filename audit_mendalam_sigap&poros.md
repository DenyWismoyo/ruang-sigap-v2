# 🔍 Laporan Audit Mendalam — Ruang SIGAP v2
**Tanggal Audit**: 16 Agustus 2026 | **Model**: Claude Sonnet 4.6 (Thinking)

---

## 📋 Ringkasan Eksekutif

Audit ini mencakup:
- **Frontend Poros**: Modul Surat, Disposisi, Tindak Lanjut, Copilot
- **Frontend Sigap**: Modul paralel Poros (shared architecture)
- **Backend API**: Copilot, Suggest Disposition, Firestore Queries
- **Database Reads**: Seluruh hook data-fetching & indexing

**Kesimpulan Umum**: Arsitektur secara keseluruhan **sangat baik** dengan pola SSOT, React Query, dan Optimistic Updates yang sudah diterapkan. Ada beberapa bug kritis dan area optimasi yang perlu dibenahi segera.

---

## 🚨 TEMUAN KRITIS (Harus Diperbaiki Segera)

### ❌ KRITIS-1: `updateTaskDetail` — Double Write Bug
**File**: [`useTugasActions.ts` L150-L183](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useTugasActions.ts#L150-L183)

```typescript
// BUG: Tugas dokumen di-update DUA KALI dalam batch yang berbeda
const batch = writeBatch(db);
batch.update(doc(db, 'tugas', taskId), updates); // ← Write #1 (batch ini tidak di-commit!)

const usersSnap = await getDocs(query(...));

let currentBatch = writeBatch(db);
let count = 0;
currentBatch.update(doc(db, 'tugas', taskId), updates); // ← Write #2 (duplikat!)
count++;
```

**Dampak**: Batch pertama tidak pernah di-`commit()`. Dokumen `tugas` utama hanya diupdate oleh `currentBatch` saja. Batch pertama (`batch`) menjadi "ghost" — sudah dibuat tapi tak pernah dikirim ke Firestore.

**Perbaikan**:
```typescript
// Hapus batch pertama yang tidak dipakai:
// const batch = writeBatch(db);  ← HAPUS ini
// batch.update(doc(db, 'tugas', taskId), updates); ← HAPUS ini

let currentBatch = writeBatch(db);
let count = 0;
currentBatch.update(doc(db, 'tugas', taskId), updates); // ← Satu-satunya write untuk tugas
count++;
```

---

### ❌ KRITIS-2: `useTugasData` — Realtime Listener Tanpa Index
**File**: [`useTugasData.ts` L41-L44](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useTugasData.ts#L41-L44)

```typescript
const q = query(
    collection(db, 'tugasPerPengguna', userProfile.uid, 'tugas'),
    orderBy('tanggalDibuat', 'desc')
);
```

Sub-koleksi `tugasPerPengguna/{uid}/tugas` dengan `orderBy('tanggalDibuat', 'desc')` **tidak memiliki Composite Index** di `firestore.indexes.json`. Index hanya mencakup koleksi level atas (`tugas`).

**Dampak**: Query ini berpotensi gagal di production dengan error `FirebaseError: The query requires an index`.

**Perbaikan**: Tambahkan index di `firestore.indexes.json`:
```json
{
  "collectionGroup": "tugas",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "tanggalDibuat", "order": "DESCENDING" }
  ]
}
```
Atau gunakan Single-Field index auto-generated dengan menambahkan `orderBy` di console Firebase.

---

### ❌ KRITIS-3: `kembalikanDisposisi` — Notifikasi Dalam Batch Setelah `optimisticRemoveDisposisi`
**File**: [`useSuratActions.ts` L430-L466](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useSuratActions.ts#L430-L466)

```typescript
const kembalikanDisposisi = async (...) => {
    const batch = writeBatch(db);
    batch.update(disposisiRef, { ... });
    batch.update(suratRef, { ... });
    
    // [MASALAH]: optimisticRemoveDisposisi dipanggil SEBELUM batch.commit()!
    optimisticRemoveDisposisi(disposisi.id); // ← UI hilang dulu
    
    if (senderProfile?.uid) {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, { ... }); // ← Notifikasi ditambahkan SETELAH optimistic update
    }
    
    await batch.commit(); // ← Baru commit, tapi UI sudah update
```

**Dampak**: Jika `batch.commit()` gagal, UI sudah menghapus item dari cache (optimistic) tapi data Firestore tidak berubah. User melihat item hilang padahal server masih menyimpannya.

**Perbaikan**: Pindahkan `optimisticRemoveDisposisi` ke SETELAH `batch.commit()`:
```typescript
await batch.commit();
optimisticRemoveDisposisi(disposisi.id); // ← Setelah berhasil commit
```

---

### ⚠️ KRITIS-4: Copilot `tindakLanjut` — Koleksi Tidak Konsisten
**File**: [`copilot/route.ts` L109](file:///d:/DENY/project/ruang-sigap-v2/src/app/api/ai/copilot/route.ts#L109) vs [`useSuratActions.ts` L298](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useSuratActions.ts#L298)

```
Backend Copilot → collection: "laporanTindakLanjut"
Frontend kirimTindakLanjut → collection: "tindakLanjut"
tindakLanjutUtils.ts → collection: "laporanTindakLanjut"
```

**Terdapat 2 koleksi berbeda** untuk data yang secara konseptual sama:
- `tindakLanjut` — dipakai `useSuratActions.kirimTindakLanjut()`
- `laporanTindakLanjut` — dipakai `tindakLanjutUtils.createLaporanTindakLanjut()` dan `useLaporanTindakLanjut`

**Dampak**: AI Copilot yang membaca `laporanTindakLanjut` **tidak bisa melihat** laporan yang dibuat via form UI (`tindakLanjut`). Context RAG copilot menjadi tidak akurat.

---

## 🟡 MASALAH SEDANG (Perlu Diperbaiki)

### ⚠️ SEDANG-1: Ghosting Bug — 2.5 Detik Hardcoded Delay
**File**: [`useSuratActions.ts` L63-L67](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useSuratActions.ts#L63-L67) & [`useRuangKerjaFeed.ts` L256-L261](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useRuangKerjaFeed.ts#L256-L261)

```typescript
setTimeout(() => {
    queryClient.invalidateQueries({ queryKey: ['feed'] });
}, 2500); // ← Hardcoded 2.5 detik
```

**Masalah**: Delay ini mengandalkan asumsi Cloud Function selesai dalam 2.5 detik. Jika server lambat atau ada cold start, feed bisa ghosting lebih lama. Tidak ada mekanisme retry.

**Solusi yang Lebih Baik**: Gunakan `onSnapshot` pada `userSummaries/{jabatanId}` untuk reactive update daripada polling dengan delay.

---

### ⚠️ SEDANG-2: `useSuratData` — Filter Status di Client-Side (Inefficient)
**File**: [`useSuratData.ts` L121-L128](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useSuratData.ts#L121-L128)

```typescript
if (props.filterStatus && props.filterStatus !== 'Semua') {
    list = list.filter(s => s.statusPenyelesaian === props.filterStatus);
} else if (!props.isArchive) {
    // Client-side filter dari semua 25 docs yang sudah di-fetch
    list = list.filter(s => visibleStatuses.includes(s.statusPenyelesaian));
}
```

**Masalah**: Query ke Firestore mengambil **semua surat** (limit 25), kemudian filter di client. Jika user memilih filter "Baru", tetap diambil 25 surat campuran baru difilter di memori.

**Dampak**: Untuk OPD dengan banyak surat "Selesai/Diarsipkan", data surat aktif per halaman bisa jauh kurang dari 25.

**Solusi**: Tambahkan filter `where('statusPenyelesaian', 'in', [...])` ke Firestore query untuk TU/Admin. Untuk user biasa (filter per `terlibatJabatanIds`), client-side filtering masih acceptable.

---

### ⚠️ SEDANG-3: `fetchSubOpdLeaders` — Multiple Sequential Reads
**File**: [`useBawahanList.ts` L18-L67](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useBawahanList.ts#L18-L67)

```typescript
// 1. getDocs collection 'opd') → full scan semua OPD
// 2. for each chunk: getDocs('jabatan') → chunked query
// 3. for each chunk: getDocs('users') → chunked query
```

**Masalah**: Untuk setiap load `FormDisposisi`, dilakukan 3 layer query nested. Meski di-cache dengan `staleTime: 1 jam`, initial load untuk pimpinan level tinggi bisa lambat.

**Solusi**: Denormalisasi — simpan `subOpdPimpinanIds` di dokumen `opdMasterData` agar cukup dengan 1 read.

---

### ⚠️ SEDANG-4: Copilot RAG — Query `surat` Menggunakan `createdAt` Bukan `tanggalDiterima`
**File**: [`copilot/route.ts` L64](file:///d:/DENY/project/ruang-sigap-v2/src/app/api/ai/copilot/route.ts#L64)

```typescript
const suratPromise = getRecentDocs("surat", "createdAt", 30);
// ...
// Di fallback sorting: a.data()[orderByField]?.toDate?.()?.getTime()
// orderByField = "createdAt", tapi di frontend pakai "tanggalDiterima"
```

**Masalah**: Koleksi `surat` menggunakan `tanggalDiterima` sebagai field utama (ada index), bukan `createdAt`. Ada index `(opdId, tanggalDiterima DESC)` tapi tidak ada `(opdId, createdAt DESC)`.

**Dampak**: Query ini akan selalu jatuh ke fallback `in-memory sort` karena index tidak cocok, memperlambat respons Copilot.

**Perbaikan**: Ganti ke `getRecentDocs("surat", "tanggalDiterima", 30)`.

---

### ⚠️ SEDANG-5: `RiwayatDisposisi` — `userCache.get(dariJabatanId)` untuk Notifikasi
**File**: [`RiwayatDisposisi.tsx` L57](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useSuratActions.ts#L57)

```typescript
const senderProfile = userCache?.get(selectedDisposisi.dariJabatanId);
const success = await kembalikanDisposisi(selectedDisposisi, alasan, senderProfile);
```

**Masalah**: `userCache` diindeks oleh `jabatanId` di `useMasterData`:
```typescript
users.forEach(u => { if (u.jabatanId) map.set(u.jabatanId, u); });
```
Tapi di sini `dariJabatanId` dipakai sebagai key. Ini sama saja (jabatanId = jabatanId), **tapi** jika user tersebut tidak ada di `userMap` (misal dari OPD lain), `senderProfile` akan `undefined` dan notifikasi tidak terkirim tanpa error. Silent failure.

---

## 🟢 KEKUATAN ARSITEKTUR (Yang Sudah Baik)

### ✅ BAIK-1: Master Data Pattern — 1 Read Per OPD
**File**: [`useMasterData.ts`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useMasterData.ts)

Pattern `opdMasterData/{opdId}` yang menyimpan seluruh `users + jabatans` dalam 1 dokumen sangat efisien. Cache `staleTime: 1 jam` sangat tepat untuk data yang jarang berubah.

```
✅ 1 Firestore read = semua data kepegawaian OPD
✅ React Query cache 1 jam
✅ Fallback query jika master doc belum ada
```

---

### ✅ BAIK-2: userSummaries SSOT — Anti-N+1 Pattern
**File**: [`useUserSummaries.ts`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useUserSummaries.ts)

```
✅ onSnapshot pada 1 dokumen → reaktif real-time
✅ Cross-reference dengan cache surat in-memory (zero additional reads)
✅ Hanya fetch surat yang benar-benar belum di-cache
✅ Chunked query max 30 per batch (Firestore 'in' limit)
```

---

### ✅ BAIK-3: `useSuratDetail` — Parallel Promise.all
**File**: [`useSuratDetail.ts`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useSuratDetail.ts)

```typescript
const [suratSnap, disposisiSnap, tindakLanjutSnap] = await Promise.all([
    suratPromise, disposisiPromise, tindakLanjutPromise
]);
```

```
✅ 3 query berjalan paralel (bukan waterfall)
✅ staleTime 5 menit = tidak refetch tiap render
✅ gcTime 30 menit = data tetap di memori setelah tab ditutup
```

---

### ✅ BAIK-4: `kirimDisposisi` — Batch Write Atomik
**File**: [`useSuratActions.ts`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useSuratActions.ts)

```
✅ Batch write: disposisi + update surat + notifikasi = 1 atomik commit
✅ Optimistic UI update sebelum server confirm
✅ Auto-rollback jika batch.commit() gagal (nilai Firestore tidak berubah)
✅ arrayUnion untuk terlibatJabatanIds (aman dari race condition)
```

---

### ✅ BAIK-5: `kirimTindakLanjut` — Triple Integration
**File**: [`useSuratActions.ts` L284-L365](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useSuratActions.ts#L284-L365)

```
✅ Create tindakLanjut doc
✅ Update statusPenyelesaian surat
✅ Auto-logbook via updateLogbook()
✅ Optimistic remove disposisi jika isFinal
✅ Cascade status: Proses TL → Selesai
```

---

### ✅ BAIK-6: `usePemantauanTindakLanjut` — DB-Level Filtering
**File**: [`usePemantauanTindakLanjut.ts`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/usePemantauanTindakLanjut.ts)

```
✅ Filter opdId + terlibatJabatanIds di Firestore (bukan client)
✅ Pagination dengan startAfter cursor
✅ Fetch surat hanya untuk batch yang ditampilkan
✅ Index tersedia di firestore.indexes.json
```

---

## 📊 AUDIT ALUR PERSURATAN LENGKAP

### Alur Status Surat

```
[Upload Surat] → Baru
       ↓
[Disposisi Terkirim] → Didisposisikan
       ↓
[Terima Disposisi] → (tidak ubah status)
       ↓
[Kirim Tindak Lanjut] → Proses Tindak Lanjut
       ↓
[isFinal=true] → Selesai
       ↓ (manual / auto)
[Archive] → Diarsipkan

[Kembalikan Disposisi] → Revisi Disposisi
[Eskalasi] → Didisposisikan (ke atasan)
```

### Matriks Integrasi Fungsi Inti

| Fungsi | Backend | Frontend | Notifikasi | Logbook | Status Update | Optimistic UI |
|--------|---------|----------|------------|---------|---------------|---------------|
| `kirimDisposisi` | ✅ Batch | ✅ FormDisposisi | ✅ | ❌ | ✅ | ✅ |
| `eskalasiSurat` | ✅ Batch | ✅ Detail Page | ✅ | ❌ | ✅ | ✅ |
| `terimaDisposisi` | ✅ Batch | ✅ PenerimaanModal | ❌ | ❌ | ❌ | ✅ |
| `kirimTindakLanjut` | ✅ Batch | ✅ TindakLanjutSection | ❌ | ✅ | ✅ | ✅ |
| `editTindakLanjut` | ✅ Batch | ✅ TindakLanjutSection | ❌ | ❌ | ❌ | ❌ |
| `kembalikanDisposisi` | ✅ Batch | ✅ RiwayatDisposisi | ✅ | ❌ | ✅ | ⚠️ Premature |
| `archiveSurat` | ✅ Batch | ✅ Detail Page | ❌ | ❌ | ✅ | ❌ |
| `deleteSurat` | ✅ Chunked | ✅ Detail Page | ❌ | ❌ | ✅ | ❌ |
| `distribusikanArsip` | ✅ Batch | ❌ (tidak ada UI) | ❌ | ❌ | ❌ | ❌ |
| `createNewTask` | ✅ Batch+Fan-out | ✅ FormTugas | ✅ WA | ✅ | ✅ | ❌ |
| `updateTaskStatus` | ✅ Batch | ✅ Tugas Page | ❌ | ❌ | ✅ | ❌ |
| `updateTaskDetail` | ⚠️ Double Write Bug | ✅ | ❌ | ❌ | ❌ | ❌ |

**Legend**: ✅ Terimplementasi | ❌ Belum/Tidak Ada | ⚠️ Bug/Issue

---

## 📊 AUDIT DATABASE READS

### Pola Reads Saat Ini

| Hook | Query Type | Reads per Load | Cache | Optimal? |
|------|-----------|----------------|-------|---------|
| `useMasterData` | getDoc (1 doc) | **1 read** | 1 jam | ✅ Sangat Optimal |
| `useSuratData` | getDocs paginated | 25/page | 2 menit | ✅ Baik |
| `useUserSummaries` | onSnapshot (1 doc) | Real-time | Native | ✅ Sangat Baik |
| `useSuratDetail` | Promise.all (3 parallel) | ~3 reads | 5 menit | ✅ Sangat Baik |
| `usePemantauanTindakLanjut` | getDocs (20 + surat lookup) | 20-40 reads | Manual | ✅ Baik |
| `useRuangKerjaFeed` | userSummaries + surat_baru + draf | 3-5 reads | 2 menit | ✅ Baik |
| `useTugasData` | onSnapshot (sub-collection) | Real-time | Native | ⚠️ Index Missing |
| `useBawahanList` | 3-layer nested queries | 5-20 reads | 1 jam | ⚠️ Bisa Dioptimasi |
| `fetchSubOpdLeaders` | 3 queries + mapping | 10-30 reads | 1 jam | ⚠️ Bisa Dioptimasi |

### Index yang Tersedia vs Kebutuhan

| Query | Index Tersedia | Status |
|-------|---------------|--------|
| `surat WHERE terlibatJabatanIds CONTAINS ORDER BY tanggalDiterima DESC` | ✅ | OK |
| `surat WHERE opdId ORDER BY tanggalDiterima DESC` | ✅ | OK |
| `surat WHERE opdId, statusPenyelesaian` | ✅ | OK |
| `disposisi WHERE suratId ORDER BY tanggalDisposisi DESC` | ✅ | OK |
| `tindakLanjut WHERE opdId, terlibatJabatanIds CONTAINS` | ✅ | OK |
| `notifications WHERE userId ORDER BY timestamp DESC` | ✅ | OK |
| `tugasPerPengguna/{uid}/tugas ORDER BY tanggalDibuat DESC` | ❌ **MISSING** | Bug |
| `tugas WHERE pelaksanaJabatanId ORDER BY createdAt DESC` | ❌ Copilot pakai field berbeda | Bug |

---

## 🔧 TEMUAN KHUSUS SIGAP vs POROS

Setelah audit struktur direktori, **Sigap menggunakan arsitektur paralel dengan Poros**. Kedua app memiliki:
- `(main)/surat/` — ✅ Identik
- `(fungsional)/` — ✅ Identik (29 sub-direktori sama)
- `components/` — ⚠️ Sigap memiliki beberapa komponen stub kosong

### Komponen Stub di Sigap yang Belum Diimplementasi

```
src/app/dashboard/sigap/components/KebijakanModal.tsx     → 59 bytes (stub)
src/app/dashboard/sigap/components/KerjaSamaModal.tsx     → 59 bytes (stub)
src/app/dashboard/sigap/components/LppdModal.tsx          → 82 bytes (stub)
src/app/dashboard/sigap/components/MatrixBox.tsx          → 56 bytes (stub)
src/app/dashboard/sigap/components/PlanCreationModal.tsx  → 72 bytes (stub)
src/app/dashboard/sigap/components/QrAuditModal.tsx       → 57 bytes (stub)
src/app/dashboard/sigap/components/TandaTerimaLayananPdf.tsx → 58 bytes (stub)
src/app/dashboard/sigap/components/TupoksiWilayahManager.tsx → 66 bytes (stub)
src/app/dashboard/sigap/components/WilayahModal.tsx       → 57 bytes (stub)
```

Semua 9 komponen ini adalah stub kosong. Jika ada halaman yang me-render komponen ini, akan muncul blank space atau error.

---

## 📊 AUDIT COPILOT AI

### Backend RAG (`/api/ai/copilot/route.ts`)

| Data Layer | Status | Issue |
|-----------|--------|-------|
| Surat 30 terbaru | ⚠️ | Query pakai `createdAt` bukan `tanggalDiterima` (SEDANG-4) |
| Disposisi user | ✅ | Sudah filter per jabatanId |
| Tugas aktif | ⚠️ | Query pakai `pelaksanaJabatanId` tapi tidak ada di `pelaksanaJabatanId` collection |
| Draf Persetujuan | ✅ | OK |
| Logbook hari ini | ✅ | Satu read dokumen |
| Tindak Lanjut | ❌ | Koleksi `laporanTindakLanjut` berbeda dari `tindakLanjut` yang dipakai UI |

### Tool Calling Status

```
search_surat → ✅ Tersedia
calculate_deadline_urgency → ✅ Tersedia
Tindak Lanjut (SHOW_BATCH_TINDAK_LANJUT_FORM) → ✅ Frontend terimplementasi
NAVIGATE → ✅ Frontend terimplementasi
BUAT_TUGAS → ✅ Frontend terimplementasi
WRITE_LOGBOOK_RICH → ✅ Frontend terimplementasi
```

---

## 📋 PRIORITAS PERBAIKAN

### 🚨 Segera (Sprint ini)

1. **KRITIS-1**: Fix double write bug di `updateTaskDetail` → 5 menit fix
2. **KRITIS-3**: Pindahkan `optimisticRemoveDisposisi` ke setelah `batch.commit()` di `kembalikanDisposisi` → 2 menit fix
3. **SEDANG-4**: Ganti `"createdAt"` → `"tanggalDiterima"` di copilot route → 1 menit fix
4. **KRITIS-2**: Tambahkan index Firestore untuk `tugasPerPengguna` sub-collection → 5 menit

### ⚠️ Sprint Berikutnya

5. **KRITIS-4**: Unifikasi koleksi `tindakLanjut` vs `laporanTindakLanjut` — perlu analisis dan migrasi data
6. **SEDANG-1**: Ganti setTimeout delay dengan `onSnapshot` untuk refresh feed yang lebih reliable
7. **SEDANG-2**: Tambah filter `statusPenyelesaian` di query Firestore untuk TU/Admin
8. **SEDANG-3**: Denormalisasi `subOpdPimpinan` ke `opdMasterData`
9. Implementasi stub komponen Sigap yang kosong

### 🟢 Backlog

10. Tambahkan notifikasi ke `kirimTindakLanjut` (pengirim disposisi tidak mendapat konfirmasi progres)
11. Tambahkan logbook otomatis ke `eskalasiSurat` dan `kembalikanDisposisi`
12. Implementasi `distribusikanArsip` UI (fungsi sudah ada, UI tidak ada)

---

## 📁 File Paling Kritis dalam Sistem Persuratan

| File | Peran | Lines |
|------|-------|-------|
| [`useSuratActions.ts`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useSuratActions.ts) | SSOT Mutasi Surat | 567 |
| [`TindakLanjutSection.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/(main)/surat/[id]/components/TindakLanjutSection.tsx) | UI Tindak Lanjut | 832 |
| [`useSuratData.ts`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useSuratData.ts) | Data Fetching Surat | 155 |
| [`useSuratDetail.ts`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useSuratDetail.ts) | Aggregated Detail Query | 86 |
| [`useRuangKerjaFeed.ts`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/hooks/useRuangKerjaFeed.ts) | Feed Dashboard | 265 |
| [`PorosCopilot.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/poros/components/PorosCopilot.tsx) | AI Copilot Frontend | 988 |
| [`copilot/route.ts`](file:///d:/DENY/project/ruang-sigap-v2/src/app/api/ai/copilot/route.ts) | AI Copilot Backend | 582 |
