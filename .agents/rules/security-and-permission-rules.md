# Standarisasi Keamanan & Permission Check (RUANG SIGAP)

Dokumen ini mendefinisikan guardrail keamanan wajib di seluruh lapisan aplikasi — frontend (cek sebelum render), backend (cek sebelum eksekusi), dan Firestore (rules per koleksi).

---

## 1. 🔐 Frontend: Selalu Verifikasi OPD sebelum Render Data Sensitif

**Dilarang** merender data tanpa memverifikasi bahwa data tersebut milik OPD pengguna yang sedang login.

```tsx
const { userProfile } = useUserAuth();

// ❌ DILARANG — merender tanpa cek ownership
{suratList.map(s => <SuratCard surat={s} />)}

// ✅ WAJIB — pastikan data dari OPD yang benar
{suratList
  .filter(s => s.opdId === userProfile?.opdId) // Defensive filter di frontend
  .map(s => <SuratCard key={s.id} surat={s} />)
}
```

---

## 2. 🔑 Role-Based UI Rendering

Tampilkan elemen sensitif hanya untuk role yang berwenang. Gunakan field dari `useUserAuth()`:

```tsx
const { userProfile, actingJabatanProfile } = useUserAuth();

// Akses admin
const isAdmin = ['admin_opd', 'super_admin'].includes(userProfile?.role ?? '');
const isSuperAdmin = userProfile?.role === 'super_admin';
const isStafTU = userProfile?.role === 'staf_tu';
const isPimpinan = (actingJabatanProfile?.level ?? 99) <= 5;

// ✅ Sembunyikan tombol destructive untuk non-admin
{isAdmin && (
  <Button variant="destructive" onClick={handleHapus}>Hapus User</Button>
)}

// ✅ Feature fungsional berdasarkan additionalRoles
const isPengurusBarang = userProfile?.additionalRoles?.includes('pengurus_barang');
{isPengurusBarang && <NavItem href="/dashboard/aset" label="Manajemen Aset" />}
```

---

## 3. 🚫 Dilarang: PII di Console / Log Frontend

Jangan pernah log data pribadi (NIP, email, nama, token) ke `console.log` di production:

```tsx
// ❌ DILARANG — PII di console
console.log('User data:', userProfile); // Mengekspos NIP, email, jabatan
console.log('Token:', idToken);         // Token bisa dicuri dari DevTools
console.log('FCM tokens:', fcmTokens);

// ✅ Log hanya identifier non-sensitif
console.log('[Auth] User berhasil login, opdId:', userProfile?.opdId);
console.log('[FCM] Token berhasil didaftarkan untuk jabatanId:', jabatanId);
```

---

## 4. 🛡️ Backend: Validasi Wajib di Setiap Cloud Function

Urutan validasi yang WAJIB ada di setiap Cloud Function:

```typescript
export const namaFungsi = onCall({ region: 'asia-southeast2' }, async (request) => {
  // STEP 1: Cek autentikasi
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Anda harus login untuk aksi ini.');
  }
  
  const { uid, token } = request.auth;
  const opdId = token.opdId as string;
  const role = token.role as string;
  const level = token.level as number;

  // STEP 2: Cek role jika diperlukan
  if (!['admin_opd', 'super_admin'].includes(role)) {
    throw new HttpsError('permission-denied', 'Aksi ini hanya untuk Admin.');
  }
  
  // STEP 3: Validasi input
  const { targetId } = request.data;
  if (!targetId || typeof targetId !== 'string') {
    throw new HttpsError('invalid-argument', 'Parameter targetId tidak valid.');
  }
  
  // STEP 4: Verifikasi ownership — data harus dari OPD yang sama
  const docSnap = await db.collection('koleksi').doc(targetId).get();
  if (!docSnap.exists) {
    throw new HttpsError('not-found', 'Data tidak ditemukan.');
  }
  if (docSnap.data()?.opdId !== opdId) {
    throw new HttpsError('permission-denied', 'Akses ke data OPD lain tidak diizinkan.');
  }
  
  // STEP 5: Logika bisnis
  // ...
});
```

---

## 5. 🔒 Firestore Security Rules — Pattern Per Koleksi

Setiap koleksi yang berisi data sensitif **WAJIB** memiliki rules yang memvalidasi `opdId`:

```javascript
// Pattern dasar untuk koleksi yang ber-OPD
match /surat/{suratId} {
  // Baca: hanya OPD yang sama
  allow read: if request.auth.token.opdId == resource.data.opdId;
  
  // Buat: hanya staf_tu atau admin
  allow create: if request.auth.token.role in ['staf_tu', 'admin_opd', 'super_admin']
                && request.auth.token.opdId == request.resource.data.opdId;
  
  // Update: OPD yang sama
  allow update: if request.auth.token.opdId == resource.data.opdId;
  
  // Hapus: hanya super_admin
  allow delete: if request.auth.token.role == 'super_admin';
}

// Pattern untuk users — hanya baca data sendiri
match /users/{nip} {
  allow read: if request.auth.token.nip == nip
              || request.auth.token.role in ['admin_opd', 'super_admin'];
  allow write: if request.auth.token.role in ['admin_opd', 'super_admin'];
}
```

---

## 6. 🌐 Feature Gate: OpdConfig sebelum Aksi Premium

Sebelum memanggil fungsi premium (AI, Drive, dll.), **WAJIB** periksa `opdConfig.features`:

```tsx
const { opdConfig } = useUserAuth();

const handleAIScan = async () => {
  // ✅ Cek feature gate sebelum memanggil Cloud Function berbayar
  if (!opdConfig?.features?.aiSuratReader) {
    addToast({
      type: 'warning',
      title: 'Fitur Tidak Aktif',
      message: 'AI Scan Surat tidak termasuk dalam paket langganan Anda.',
    });
    return;
  }
  
  // Lanjutkan pemanggilan AI...
  await callCloudFunction('extractSuratDataAIV2', { ... });
};
```

---

## 7. 🚫 Anti-Pattern Keamanan yang Dilarang

| Anti-Pattern | Risiko | Solusi |
|-------------|--------|--------|
| Hardcode API Key di kode | Ekspos ke publik via bundle | Gunakan `.env.local` + Secret Manager |
| `allow read, write: if true;` di Firestore Rules | Semua data terbuka publik | Selalu tambahkan auth check |
| Console.log userProfile/token | PII bocor di DevTools | Hapus sebelum commit |
| Tidak cek opdId di Cloud Function | Data lintas OPD bisa diakses | Selalu validasi ownership |
| Simpan token/secret di localStorage | Rentan XSS | Gunakan httpOnly cookie atau memory |
| Render admin UI tanpa role check | User biasa bisa akses admin | Selalu wrap dengan `{isAdmin && ...}` |
