# 🔍 Laporan Audit Mendalam — Aplikasi RUANG SIGAP

> **Tanggal Audit**: 13 Agustus 2026  
> **Auditor**: Antigravity AI  
> **Cakupan**: Frontend (Next.js 14 + TypeScript) & Backend (Firebase Functions v1/v2)

---

## 📊 Ringkasan Eksekutif

Aplikasi RUANG SIGAP adalah platform manajemen administrasi pemerintahan yang komprehensif dengan arsitektur Firebase (Firestore, Functions, Storage, FCM). Setelah audit menyeluruh terhadap **~45 modul halaman**, **28 custom hooks**, **7 backend functions**, dan seluruh sistem context/state management, berikut ini adalah temuan lengkap yang perlu ditindaklanjuti.

| Kategori | Jumlah Temuan |
|----------|--------------|
| 🔴 Isu Kritis (Harus Segera Diperbaiki) | 8 |
| 🟠 Fitur Belum Terintegrasi Penuh | 12 |
| 🟡 Potensi Bug / Race Condition | 9 |
| 🔵 Optimasi Performa & Skalabilitas | 10 |
| 🟢 Kode Mati / Technical Debt | 8 |

---

## 🔴 A. ISU KRITIS (Harus Segera Diperbaiki)

### A1. Cloud Tasks FCM Reminder — Fungsi Dikomen, Tidak Aktif
**File**: [`functions/src/taskWorkers.ts`](file:///d:/Project/RUANG%20SIGAP/functions/src/taskWorkers.ts#L37-L63)  
**Masalah**: Fungsi `sendReminderTask` adalah Cloud Task worker yang dijadwalkan untuk mengirim pengingat disposisi dan tugas via FCM setelah 2 jam. Namun, kode pengiriman FCM **seluruhnya dikomen** (baris 37-63). Akibatnya, Cloud Tasks terdaftar dan antrian dibuat (`enqueue` dijalankan di `agregasiSummaries.ts`), tetapi **notifikasi pengingat tidak pernah terkirim** — membebani Cloud Tasks quota tanpa efek.

```typescript
// MASALAH: Kode pengiriman FCM ini masih dikomen!
/*
await sendFcmMessageByUid(uid, "⏰ Pengingat...", ...);
*/
```

**Solusi**: Implementasikan fungsi `sendFcmMessageByUid` atau gunakan langsung Admin SDK untuk mengirim push notification.

---

### A2. Notifikasi di Ruang Kerja — `userSummaries` Memakai UID bukan JabatanId
**File**: [`src/context/NotificationContext.tsx`](file:///d:/Project/RUANG%20SIGAP/src/context/NotificationContext.tsx#L71)  
**File**: [`src/app/dashboard/hooks/useRuangKerjaFeed.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useRuangKerjaFeed.ts#L71)

**Masalah**: `NotificationContext` membaca `userSummaries/{user.uid}` (menggunakan UID), sementara `useRuangKerjaFeed` membaca `userSummaries/{effectiveJabatan.id}` (menggunakan jabatan ID). `agregasiSummaries.ts` menulis ke `userSummaries/{jabId}` (jabatan ID).  

Akibatnya: `welcomeSummary.suratBaruCount` dan `tugasBaruCount` di header **tidak sinkron** dengan data aktual feed. Badge lonceng bisa menunjukkan angka yang salah atau nol.

```
NotificationContext → reads: userSummaries/{uid}      ← SALAH (dokumen bisa kosong)
useRuangKerjaFeed  → reads: userSummaries/{jabId}     ← BENAR
agregasiSummaries  → writes: userSummaries/{jabId}    ← BENAR
```

**Solusi**: Pastikan `NotificationContext` menggunakan `effectiveJabatan.id` atau gabungkan counter di dokumen UID juga menggunakan backend trigger.

---

### A3. `updateTaskDetail` Tidak Update `tugasPerPengguna` untuk Semua Peserta
**File**: [`src/app/dashboard/hooks/useTugasActions.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useTugasActions.ts#L150-L165)  
**Masalah**: Fungsi `updateTaskDetail` hanya memperbarui `tugasPerPengguna/{userProfile.uid}/tugas/{taskId}` — hanya milik pembuat task saja. Sub-koleksi milik penerima tugas dan kolaborator **tidak diperbarui**, sehingga data mereka stale.

```typescript
// MASALAH: Hanya update copy milik sendiri
await updateDoc(doc(db, 'tugasPerPengguna', userProfile.uid, 'tugas', taskId), updates);
// HILANG: update untuk kepadaJabatan user dan collaborators
```

**Solusi**: Lakukan fan-out update ke seluruh peserta tugas seperti yang sudah dilakukan di `createNewTask`.

---

### A4. `deleteTask` Tidak Menghapus dari `tugasPerPengguna` Penerima & Kolaborator
**File**: [`src/app/dashboard/hooks/useTugasActions.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useTugasActions.ts#L167-L182)  
**Masalah**: Saat tugas dihapus, hanya dokumen utama di `tugas/` dan copy milik creator yang dihapus. Sub-koleksi milik penerima dan kolaborator **dibiarkan orphan** di Firestore.

**Solusi**: Gunakan batch delete untuk menghapus semua copy atau gunakan Cloud Function `onDelete` trigger untuk fan-out pembersihan.

---

### A5. `deleteSurat` Tidak Menghapus Disposisi, Tindak Lanjut, dan Notifikasi Terkait
**File**: [`src/app/dashboard/hooks/useSuratActions.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useSuratActions.ts#L453-L467)  
**Masalah**: Fungsi `deleteSurat` hanya menghapus dokumen surat utama. Semua sub-dokumen terkait — disposisi, tindak lanjut, notifikasi, dan `userSummaries` yang masih menyimpan referensi surat tersebut — **tidak dibersihkan**. Ini menyebabkan data orphan dan ghost items di feed.

**Solusi**: Gunakan Cloud Function trigger `onSuratDelete` untuk cascade delete semua dokumen terkait, atau implementasikan batch cleanup sebelum delete.

---

### A6. AutoHeal TAHAP 3 — Query `infoTampilan == null` Tidak Valid di Firestore
**File**: [`functions/src/autoHeal.ts`](file:///d:/Project/RUANG%20SIGAP/functions/src/autoHeal.ts#L48-L51)  
**Masalah**: Query `where('infoTampilan', '==', null)` di Firestore tidak akan menangkap dokumen di mana field `infoTampilan` **tidak ada sama sekali** (missing field). Firestore membedakan antara `field == null` dan `field tidak ada`. Akibatnya, Auto-Heal Tahap 3 tidak berfungsi untuk surat lama yang tidak memiliki field `infoTampilan`.

```typescript
// MASALAH: Tidak menangkap dokumen tanpa field infoTampilan
.where('infoTampilan', '==', null)
```

**Solusi**: Ganti dengan dua query terpisah atau gunakan pendekatan berbeda untuk mendeteksi surat tanpa metadata.

---

### A7. Google Calendar Sync — Token Refresh Tidak Diimplementasikan
**File**: [`src/types/index.ts`](file:///d:/Project/RUANG%20SIGAP/src/types/index.ts#L93-L97) — terdapat field `googleRefreshToken`, `googleAccessToken`, `googleTokenExpiry`  
**Masalah**: Interface `UserProfile` menyimpan Google OAuth tokens, namun tidak ada mekanisme refresh token yang terlihat di frontend. Access token Google biasanya kadaluarsa dalam 1 jam. Jika tidak ada auto-refresh, sinkronisasi Google Calendar akan gagal diam-diam setelah 1 jam pertama.

**Solusi**: Implementasikan backend Cloud Function untuk refresh token secara otomatis sebelum expired, atau gunakan googleapis dengan credentials yang sudah dikonfigurasi untuk auto-refresh.

---

### A8. WhatsApp Notification — Masih Simulasi (Console.log Only)
**File**: [`src/lib/whatsapp.ts`](file:///d:/Project/RUANG%20SIGAP/src/lib/whatsapp.ts)  
**Masalah**: Fungsi `sendWhatsAppNotification` dipanggil dari `useTugasActions.ts` setiap kali ada tugas baru. Namun fungsi ini hanya mencetak ke console — **tidak ada integrasi API WhatsApp sesungguhnya**. Ini menipu karena kode terlihat seperti sudah bekerja.

**Solusi**: Integrasikan dengan WhatsApp Business API (misalnya Twilio, Wablas, atau Meta WABA) atau hilangkan pemanggilan jika belum siap.

---

## 🟠 B. FITUR BELUM TERINTEGRASI PENUH

### B1. Offline Upload Sync — IndexedDB Ada Tapi Service Worker Tidak Memproses
**File**: [`src/lib/offlineSync.ts`](file:///d:/Project/RUANG%20SIGAP/src/lib/offlineSync.ts)  
**Masalah**: Terdapat `offlineSync.ts` dengan fungsi `savePendingSurat`, `getPendingSuratUploads`, `deletePendingSuratUpload` yang menyimpan upload ke IndexedDB. Namun komentar di kode menyebutkan "_yang akan dipanggil oleh Service Worker_". Tidak ada bukti Service Worker yang mengimplementasikan sync queue ini. Data yang tersimpan di IndexedDB **tidak pernah diproses**.

**Solusi**: Implementasikan Background Sync di Service Worker (`firebase-messaging-sw.js`) untuk memproses antrian upload saat koneksi kembali.

---

### B2. `WelcomeSummaryModal.tsx` — Komponen Dibuat tapi Tidak Dipakai
**File**: [`src/app/dashboard/components/WelcomeSummaryModal.tsx`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/components/WelcomeSummaryModal.tsx)  
**Masalah**: Komponen ini ada di direktori komponen tetapi sudah dihapus dari `layout.tsx` (ada komentar `// [UPDATE] Menghapus pemanggilan komponen WelcomeSummaryModal`). Komponen menjadi dead code.

**Solusi**: Hapus file atau re-integrasi jika memang diperlukan.

---

### B3. `useUserSummaries.ts` vs `NotificationContext.tsx` — Duplikasi Logika
**File**: [`src/app/dashboard/hooks/useUserSummaries.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useUserSummaries.ts)  
**Masalah**: Hook `useUserSummaries` melakukan `onSnapshot` ke `userSummaries/{jabatanId}` dan memiliki logika lengkap untuk mengolah actionable items. Sementara `NotificationContext` juga melakukan `onSnapshot` ke `userSummaries/{uid}`. Terdapat duplikasi logika subscription yang tidak perlu dan berpotensi menyebabkan multiple Firestore listeners aktif secara bersamaan.

**Solusi**: Konsolidasikan sumber data ke satu tempat; gunakan `effectiveJabatan.id` secara konsisten di `NotificationContext`.

---

### B4. `JadwalDetailModal` di Dashboard — Tombol Approve/Reject/Edit/Delete Kosong
**File**: [`src/app/dashboard/page.tsx`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/page.tsx#L437-L446)  
**Masalah**: `JadwalDetailModal` dipanggil dengan handler `onApprove`, `onReject`, `onEdit`, `onDelete` yang semuanya hanya `() => {}` (fungsi kosong). Admin OPD tidak dapat menyetujui atau menolak jadwal langsung dari halaman dashboard utama.

```tsx
onApprove={() => {}}   // ← Tidak fungsional
onReject={() => {}}    // ← Tidak fungsional
onEdit={() => {}}      // ← Tidak fungsional
onDelete={() => {}}    // ← Tidak fungsional
```

**Solusi**: Implementasikan handler yang sesuai atau redirect ke halaman `/dashboard/jadwal` untuk pengelolaan penuh.

---

### B5. `distribusikanArsip` — Menulis ke `suratPerPengguna` yang Tidak Digunakan
**File**: [`src/app/dashboard/hooks/useSuratActions.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useSuratActions.ts#L469-L487)  
**Masalah**: Fungsi `distribusikanArsip` menulis ke `suratPerPengguna/{uid}/arsip/{suratId}`. Tidak ada hook atau halaman yang **membaca dari koleksi ini**. Data arsip yang didistribusikan tidak pernah ditampilkan ke pengguna.

**Solusi**: Buat halaman/hook pembaca arsip yang mengkonsumsi `suratPerPengguna`, atau ubah pendekatan distribusi arsip.

---

### B6. `AutoHealButton.tsx` — Hanya Ada di Komponen Tapi Tidak Ada di Halaman Admin
**File**: [`src/app/dashboard/components/AutoHealButton.tsx`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/components/AutoHealButton.tsx)  
**Masalah**: Komponen `AutoHealButton` ada di direktori komponen tetapi tidak ada bukti bahwa ia dirender di halaman admin manapun dalam `src/app/dashboard/admin/`.

**Solusi**: Pastikan `AutoHealButton` diintegrasikan ke panel admin (`/dashboard/admin`) agar super admin bisa menjalankannya.

---

### B7. `cacheUtils.ts` — Cache Utility Terdefinisi Tapi Tidak Digunakan
**File**: [`src/lib/cacheUtils.ts`](file:///d:/Project/RUANG%20SIGAP/src/lib/cacheUtils.ts)  
**Masalah**: File `cacheUtils.ts` berukuran 2.7KB dan tampaknya berisi helper untuk manajemen cache, namun tidak ada impor yang jelas ke file ini dari hooks atau komponen yang ada.

**Solusi**: Audit penggunaan file ini; jika tidak dipakai, hapus untuk mengurangi technical debt.

---

### B8. Quota Pengguna — Penegakan Dilakukan di Backend Tapi Tidak Ada Feedback UI
**File**: [`src/context/AuthContext.tsx`](file:///d:/Project/RUANG%20SIGAP/src/context/AuthContext.tsx#L204)  
**Masalah**: Backend (`calculateActiveUsers`) menegakkan kuota dengan mengatur `kuotaPengguna: 0`. Namun di `AuthContext`, hanya ada pemeriksaan `status === 'nonaktif'` untuk logout otomatis. Tidak ada pesan UI yang jelas yang menginformasikan admin bahwa kuota pengguna telah tercapai atau akun dinonaktifkan karena kuota.

**Solusi**: Tambahkan deteksi `opdConfig.kuotaPengguna === 0` dan tampilkan modal/banner informatif.

---

### B9. `useMonitoringData.ts` — Tidak Ada Integrasi di Halaman Laporan
**File**: [`src/app/dashboard/hooks/useMonitoringData.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useMonitoringData.ts)  
**Masalah**: Hook `useMonitoringData` (3.6KB) tampaknya berisi logika pemantauan yang belum terintegrasi penuh dengan halaman laporan atau evaluasi.

**Solusi**: Verifikasi dan pastikan hook ini terhubung dengan halaman `/dashboard/laporan` atau `/dashboard/evaluasi`.

---

### B10. `aggregateKinerjaPenggunaHarian` — Dijadwalkan Tapi Tidak Ada Dashboard Analitik yang Mengkonsumsi
**Masalah**: Backend memiliki fungsi terjadwal `aggregateKinerjaPenggunaHarian` yang menghasilkan data kinerja harian (`KinerjaPerPenggunaHarian`). Berdasarkan analisis tipe data, koleksi `kinerjaPerPengguna` diisi secara rutin. Namun perlu dipastikan apakah halaman analitik (`/dashboard/analitika`) benar-benar mengkonsumsi data ini secara real-time.

**Solusi**: Audit halaman `/dashboard/analitika` dan pastikan chart/tabel terhubung dengan data agregat kinerja.

---

### B11. `kembalikanDisposisi` — Tidak Mengirim Notifikasi ke Pengirim
**File**: [`src/app/dashboard/hooks/useSuratActions.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useSuratActions.ts#L411-L434)  
**Masalah**: Saat disposisi dikembalikan, tidak ada notifikasi yang dikirim ke jabatan pengirim asli (`disposisi.dariJabatanId`). Pengirim disposisi tidak mengetahui bahwa disposisinya dikembalikan kecuali secara aktif membuka feed.

**Solusi**: Tambahkan `batch.set(notifRef, {...})` untuk mengirim notifikasi ke pengirim disposisi setelah pengembalian.

---

### B12. Delegasi Widget — Fitur Ada Tapi Tidak Jelas Terintegrasi ke Ruang Kerja
**File**: [`src/app/dashboard/components/DelegasiWidget.tsx`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/components/DelegasiWidget.tsx) (15.5KB)  
**Masalah**: `DelegasiWidget.tsx` adalah komponen besar (15.5KB) untuk delegasi sementara. Perlu diaudit apakah delegasi yang disimpan di `jabatan.delegasiSementara` benar-benar mempengaruhi routing disposisi di backend (`onDisposisiCreate`).

---

## 🟡 C. POTENSI BUG / RACE CONDITION

### C1. Race Condition Feed — `setTimeout` 2.5 Detik adalah Workaround, Bukan Solusi
**File**: [`src/app/dashboard/hooks/useRuangKerjaFeed.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useRuangKerjaFeed.ts#L256-L261)  
**File**: [`src/app/dashboard/hooks/useSuratActions.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useSuratActions.ts#L63-L66)  
**Masalah**: Untuk menghindari "ghosting bug" (item feed tidak hilang setelah aksi), implementasi menggunakan `setTimeout 2500ms` sebelum invalidasi query. Ini adalah workaround yang rapuh — jika Cloud Function lebih lambat dari 2.5 detik (misal saat cold start), bug akan muncul kembali.

**Solusi Jangka Panjang**: Gunakan Optimistic Updates secara lebih agresif (sudah sebagian diimplementasikan) + Firestore `onSnapshot` realtime untuk `userSummaries` di dalam `useRuangKerjaFeed` (bukan `useQuery` yang polling).

---

### C2. Fallback `useMasterData` — Bisa Menyebabkan Double Read pada OPD Besar
**File**: [`src/app/dashboard/hooks/useMasterData.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useMasterData.ts#L33-L44)  
**Masalah**: Jika `opdMasterData/{opdId}` belum tersedia (pertama kali setup atau error backend), hook langsung fallback ke query ganda `users` + `jabatan` per OPD. Untuk OPD besar, ini bisa memakan banyak reads. Lebih kritis: jika `masterDataAggregator` gagal men-trigger update, seluruh aplikasi akan terus melakukan query berat tanpa pemberitahuan.

**Solusi**: Tambahkan monitoring/alerting jika backend aggregator gagal + log ke sistem admin.

---

### C3. `logActivity` — Fire-and-Forget Tanpa Error Handling yang Konsisten
**File**: Dipanggil di banyak tempat di [`useSuratActions.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useSuratActions.ts) dan [`useTugasActions.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useTugasActions.ts)  
**Masalah**: `logActivity` di beberapa tempat dipanggil dengan `await` (di luar batch), artinya jika `logActivity` gagal, aksi utama (kirim disposisi, terima tugas) **tidak akan error** tapi activity log hilang. Di beberapa tempat lain, kegagalan `logActivity` mungkin menyebabkan fungsi mengembalikan `false` padahal aksi utama sudah berhasil.

---

### C4. `updateSurat` — File Baru Tidak Diupload ke Storage
**File**: [`src/app/dashboard/hooks/useSuratActions.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useSuratActions.ts#L436-L451)  
**Masalah**: Fungsi `updateSurat` menerima parameter `newFile?: File` tapi **tidak ada kode yang mengupload file ke Firebase Storage**. Parameter `newFile` sepenuhnya diabaikan.

```typescript
const updateSurat = async (originalSurat: Surat, updatedData: Partial<Surat>, newFile?: File) => {
    // newFile diterima tapi tidak diproses sama sekali!
    await updateDoc(suratRef, updatedData);
```

**Solusi**: Implementasikan upload ke Storage dan update `fileUrl`/`fileName` di Firestore.

---

### C5. `useTugasData` — `tugasPerPengguna` Tidak Sinkron dengan `tugas` Utama
**File**: [`src/app/dashboard/hooks/useTugasData.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useTugasData.ts#L41-L44)  
**Masalah**: `useTugasData` membaca dari `tugasPerPengguna/{uid}/tugas` (per-user subcollection) sedangkan `useTugasActions.updateTaskDetail` tidak selalu mengupdate semua copy secara konsisten. Ini bisa menyebabkan UI menampilkan data stale.

---

### C6. AI Rate Limiter — Menggunakan `default` Firestore bukan `database-siyap`
**File**: [`functions/src/aiFunctions.ts`](file:///d:/Project/RUANG%20SIGAP/functions/src/aiFunctions.ts#L32-L33)  
**Masalah**: Dalam `extractSuratDataAIV2`, rate limiter menggunakan `admin.firestore()` (default database), bukan `getFirestore("database-siyap")`. Ini berarti rate limit ditulis ke database default, bukan ke `database-siyap` tempat data aplikasi berada. Meskipun secara fungsional ini masih bisa bekerja, inkonsistensi ini membingungkan dan bisa menyebabkan masalah jika default database tidak diizinkan.

```typescript
const db = admin.firestore(); // ← Menggunakan default DB, bukan database-siyap
const rateLimitRef = db.collection('rate_limits').doc(`ai_ocr_${uid}`);
```

---

### C7. `aiFunctions.ts` — Double Initialization Admin SDK
**File**: [`functions/src/aiFunctions.ts`](file:///d:/Project/RUANG%20SIGAP/functions/src/aiFunctions.ts#L6-L9)  
**Masalah**: File `aiFunctions.ts` memiliki inisialisasi `admin.initializeApp()` sendiri, sementara `index.ts` juga melakukan inisialisasi. Walaupun ada guard `if (!admin.apps.length)`, pola ini rentan terhadap masalah jika direfactor.

---

### C8. `autoHeal.ts` — Menggunakan `batch.commit()` tapi Batch Terbatas 500 Dokumen
**File**: [`functions/src/autoHeal.ts`](file:///d:/Project/RUANG%20SIGAP/functions/src/autoHeal.ts#L73-L75)  
**Masalah**: Jika ada lebih dari 500 dokumen yang perlu diperbaiki (misalnya banyak surat stale), satu batch commit akan gagal karena Firestore membatasi 500 operasi per batch.

**Solusi**: Implementasikan batching dengan chunk 450-498 operasi.

---

### C9. `Notification.requestPermission()` Dipanggil Langsung di Layout
**File**: [`src/app/dashboard/layout.tsx`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/layout.tsx#L89)  
**Masalah**: `getFCMToken()` dipanggil saat layout mount, yang langsung memanggil `Notification.requestPermission()`. Browser modern (Chrome, Firefox) mensyaratkan izin diminta hanya sebagai respons terhadap interaksi pengguna (`user gesture`). Memanggil langsung saat load bisa menyebabkan dialog izin ditolak secara diam-diam atau tidak muncul sama sekali.

**Solusi**: Pindahkan permintaan izin notifikasi ke interaksi pengguna yang eksplisit (misalnya tombol "Aktifkan Notifikasi") dengan UX yang jelas.

---

## 🔵 D. OPTIMASI PERFORMA & SKALABILITAS

### D1. `userNameCache` di Backend — In-Memory Cache Hilang saat Cold Start
**File**: [`functions/src/index.ts`](file:///d:/Project/RUANG%20SIGAP/src/index.ts#L304-L320)  
**Masalah**: `userNameCache` (Map) didefinisikan di level modul. Saat Cloud Function mengalami cold start, cache ini kosong dan setiap lookup nama harus melakukan Firestore query. Dengan banyak concurrent requests, ini bisa menyebabkan banyak duplikasi query.

**Solusi**: Pertimbangkan menggunakan Firestore dengan TTL atau caching layer (Redis via Memorystore) untuk cache yang lebih persisten.

---

### D2. `useSuratData` — Filter Status Dilakukan di Client-Side untuk Dataset Besar
**File**: [`src/app/dashboard/hooks/useSuratData.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useSuratData.ts#L101-L144)  
**Masalah**: Filter status (`filterStatus`, `filterJenis`, `searchTerm`) dilakukan di client-side setelah semua halaman di-load. Dengan dataset besar (ratusan surat), ini memperberat rendering. Infinite query dengan 25 item per halaman membantu, tetapi filter tetap diaplikasikan ke **semua data yang sudah diload**, bukan hanya halaman aktif.

---

### D3. `useAgendaData` — Hardcoded 30-Hari Window
**File**: [`src/app/dashboard/hooks/useAgendaData.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useAgendaData.ts#L17-L18)  
**Masalah**: Window 30 hari hardcoded. Untuk OPD aktif dengan banyak undangan, ini bisa mengambil puluhan dokumen sekaligus setiap kali halaman dashboard dibuka. Tidak ada pagination untuk agenda.

---

### D4. `NotificationContext` — Limit Notifikasi Hanya 5 Item
**File**: [`src/context/NotificationContext.tsx`](file:///d:/Project/RUANG%20SIGAP/src/context/NotificationContext.tsx#L85-L90)  
**Masalah**: Hanya 5 notifikasi terbaru yang diambil. Tidak ada mekanisme "load more" atau tanda "N notifikasi belum dibaca lainnya". Pengguna tidak bisa melihat semua notifikasi mereka.

**Solusi**: Tambahkan halaman notifikasi lengkap atau mekanisme "lihat semua" dengan pagination.

---

### D5. Tidak Ada Error Boundary Global Selain `global-error.tsx`
**File**: [`src/app/global-error.tsx`](file:///d:/Project/RUANG%20SIGAP/src/app/global-error.tsx)  
**Masalah**: Hanya ada satu error boundary di level root aplikasi. Modul-modul individual (surat, tugas, jadwal, dll) tidak memiliki error boundary sendiri. Jika satu modul crash, seluruh dashboard bisa ikut down.

**Solusi**: Tambahkan error boundary per halaman dashboard atau per modul kritis.

---

### D6. `generateSearchKeywords` — N-Gram untuk Nama Panjang Bisa Menghasilkan Array Besar
**File**: [`functions/src/index.ts`](file:///d:/Project/RUANG%20SIGAP/functions/src/index.ts#L338-L350)  
**Masalah**: Fungsi membuat prefix untuk setiap kata dalam nama pengguna. Untuk nama panjang seperti "Dr. H. Muhammad Abdullah Fadlurrahman, S.H., M.H.", ini bisa menghasilkan puluhan token pencarian. Firestore `array-contains` efisien, tetapi array sangat besar bisa mempengaruhi performa write.

---

### D7. `rebuildOpdMasterData` — Dipanggil untuk Setiap Write User/Jabatan
**File**: [`functions/src/masterDataAggregator.ts`](file:///d:/Project/RUANG%20SIGAP/functions/src/masterDataAggregator.ts#L18-L53)  
**Masalah**: Setiap kali ada perubahan pada koleksi `users` atau `jabatan`, `rebuildOpdMasterData` mengambil **semua** user dan jabatan OPD tersebut dan menulis ulang dokumen agregasi. Untuk OPD dengan 100+ pegawai, ini adalah operasi mahal (100+ reads) yang dipicu setiap kali ada edit profil.

**Solusi**: Pertimbangkan debouncing (min-instansi 60 detik) atau hanya update field yang berubah (incremental update).

---

### D8. Firebase Storage CORS — `cors.json` Ada Tapi Verifikasi Diperlukan
**File**: [`cors.json`](file:///d:/Project/RUANG%20SIGAP/cors.json)  
**Masalah**: Terdapat konfigurasi CORS untuk Firebase Storage. Perlu diverifikasi bahwa CORS sudah diterapkan (`gsutil cors set cors.json gs://...`) di environment production, bukan hanya tersimpan sebagai file.

---

### D9. `react-query-provider.tsx` — Tidak Ada Error Global Handler
**File**: [`src/lib/react-query-provider.tsx`](file:///d:/Project/RUANG%20SIGAP/src/lib/react-query-provider.tsx)  
**Masalah**: Tidak ada `onError` global handler di QueryClient config. Error dari Firestore queries (misalnya permission denied) akan gagal diam-diam tanpa feedback ke pengguna.

**Solusi**: Tambahkan global query error handler yang menampilkan toast atau dialog.

---

### D10. `src/index.ts` (Frontend Root) dan `functions/src/index.ts` (Backend) — Tidak Sinkron
**Masalah**: `src/index.ts` (151KB, 3123 baris) adalah salinan dari `functions/src/index.ts` (151KB, 3129 baris) yang sedikit berbeda. File `src/index.ts` di dalam direktori `src/` (frontend) seharusnya tidak ada di sana — ini tampaknya salinan backend yang tidak disengaja. Perbedaan 6 baris antara keduanya berpotensi menyebabkan konfusi.

**Solusi**: Hapus `src/index.ts` yang duplikat atau klarifikasi perannya.

---

## 🟢 E. KODE MATI / TECHNICAL DEBT

### E1. `src/index.ts` di Direktori Frontend — File yang Salah Tempat
**File**: [`src/index.ts`](file:///d:/Project/RUANG%20SIGAP/src/index.ts) (151KB)  
Ini adalah file backend Functions yang tersasar ke direktori frontend. **Harus dihapus.**

---

### E2. `src/agregasiSummaries.ts`, `src/aiFunctions.ts`, dll. — Duplikasi di Root `src/`
**Files**: Di [`src/`](file:///d:/Project/RUANG%20SIGAP/src/) terdapat `agregasiSummaries.ts`, `aiFunctions.ts`, `backupFunction.ts`, `masterDataAggregator.ts`, `taskWorkers.ts` — semua adalah duplikat dari `functions/src/`.

Ini adalah **sisa file yang terlupakan** dan berpotensi membingungkan developer. Harus dibersihkan.

---

### E3. Komentar Historis Berlebihan di Setiap File
Hampir setiap file memiliki puluhan baris komentar historis seperti `[MODIFIKASI GOOGLE CALENDAR]`, `[PERBAIKAN 05/11/2025]`, dll. Ini membuat kode sulit dibaca. Gunakan Git history untuk riwayat perubahan, bukan komentar inline.

---

### E4. `console.log` Debug di Production Code
Ditemukan banyak `console.log` di kode yang akan berjalan di production:
- `console.log("✅ FCM Token berhasil di-generate...")` — `layout.tsx`
- `console.log("Kompresi: ${file.size} -> ${newFile.size} bytes")` — `utils.ts`
- `console.log("Auto-logbook pemberian tugas berhasil.")` — `useTugasActions.ts`

**Solusi**: Gunakan logging library dengan level (debug/info/warn/error) dan disable di production.

---

### E5. `useToast` Diimpor dari Dua Tempat
Di beberapa file, `useToast` diimpor dari `@/context/ToastContext`, di file lain dari sintaksis berbeda. Perlu konsistensi.

---

### E6. `useUserSummaries.ts` — Hook Tidak Digunakan di Ruang Kerja Baru
**File**: [`src/app/dashboard/hooks/useUserSummaries.ts`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/hooks/useUserSummaries.ts)  
Hook ini tampaknya adalah implementasi lama yang sudah digantikan oleh `useRuangKerjaFeed.ts`. Perlu diaudit apakah masih digunakan.

---

### E7. `DelegasiWidget.tsx` — Integrasi dengan Backend Belum Dikonfirmasi
**File**: [`src/app/dashboard/components/DelegasiWidget.tsx`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/components/DelegasiWidget.tsx) (15.5KB)  
Perlu verifikasi apakah field `jabatan.delegasiSementara` benar-benar diproses di backend saat routing disposisi.

---

### E8. `SmartFab.tsx` — Fungsi FAB Belum Jelas
**File**: [`src/app/dashboard/components/SmartFab.tsx`](file:///d:/Project/RUANG%20SIGAP/src/app/dashboard/components/SmartFab.tsx)  
Komponen Floating Action Button (SmartFab) sudah diintegrasikan ke layout tapi perlu dipastikan aksi-aksinya (shortcut menu) sudah optimal dan sesuai konteks halaman.

---

## 📋 F. PRIORITAS PERBAIKAN (Quick Wins → Long Term)

### 🚨 Perbaikan Segera (Sprint 1 — 1-3 Hari)
| No | Item | File | Effort |
|----|------|------|--------|
| 1 | Aktifkan FCM di Cloud Tasks Worker | `functions/src/taskWorkers.ts` | S |
| 2 | Perbaiki `updateSurat` — upload file | `useSuratActions.ts` | S |
| 3 | Tambah notifikasi ke pengirim saat kembalikan disposisi | `useSuratActions.ts` | S |
| 4 | Hapus file duplikat di `src/` (backend code) | Root cleanup | S |
| 5 | Fix `JadwalDetailModal` handlers di dashboard | `page.tsx` | S |
| 6 | Fix notifikasi `updateTaskDetail` fan-out | `useTugasActions.ts` | M |

### ⚠️ Perbaikan Penting (Sprint 2 — 1 Minggu)
| No | Item | File | Effort |
|----|------|------|--------|
| 7 | Selaraskan `NotificationContext` ke jabatan ID | `NotificationContext.tsx` | M |
| 8 | Perbaiki fan-out `deleteTask` untuk semua peserta | `useTugasActions.ts` | M |
| 9 | Tambah cascade delete di `deleteSurat` | Backend + Frontend | L |
| 10 | Perbaiki AI rate limiter ke `database-siyap` | `aiFunctions.ts` | S |
| 11 | Fix `autoHeal` query untuk missing fields | `autoHeal.ts` | S |
| 12 | Ganti `Notification.requestPermission()` ke user gesture | `layout.tsx` | M |

### 📈 Optimasi Jangka Menengah (Sprint 3 — 2-4 Minggu)
| No | Item | Effort |
|----|------|--------|
| 13 | Implementasi Background Sync di Service Worker | L |
| 14 | Integrasi WhatsApp API sesungguhnya | L |
| 15 | Error boundary per modul | M |
| 16 | Halaman notifikasi lengkap (load more) | M |
| 17 | Debouncing `rebuildOpdMasterData` | M |
| 18 | Implementasi Google OAuth token refresh | L |
| 19 | Hapus komentar historis, gunakan Git log | S |

---

## ✅ G. YANG SUDAH BERJALAN BAIK

Meskipun banyak yang perlu diperbaiki, berikut aspek yang sudah terimplementasi dengan baik:

1. **Optimistic Updates** — Sudah terimplementasi di `useSuratActions.ts` untuk menghindari ghost items
2. **1-Read Master Document Pattern** — `useMasterData.ts` sangat efisien dengan agregasi OPD
3. **Infinite Pagination** — `useSuratData.ts` menggunakan `useInfiniteQuery` dengan benar
4. **SSOT (Single Source of Truth)** — Arsitektur hook sudah terpusat dan modular
5. **Named Database** — Migrasi ke `database-siyap` sudah konsisten di backend
6. **Firestore Persistent Cache** — Multi-tab cache diaktifkan untuk offline capability
7. **Role-Based Access Control** — Sudah ada validasi level jabatan dan role di berbagai hook
8. **AI Rate Limiting** — Backend rate limiter dengan transaction mencegah spam
9. **Search Keywords (N-gram)** — Implementasi prefix search yang efisien
10. **Auto-Logbook** — Pencatatan otomatis ke logbook saat membuat tugas sudah berjalan

---

> **Catatan**: Laporan ini didasarkan pada analisis statis kode. Beberapa temuan mungkin sudah diperbaiki di modul-modul yang tidak sempat diaudit (45 modul halaman tidak semuanya dianalisis secara detail). Disarankan untuk melakukan verifikasi langsung di browser dan database production sebelum implementasi perbaikan.
