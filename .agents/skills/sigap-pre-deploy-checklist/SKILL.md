---
name: sigap-pre-deploy-checklist
description: Urutan wajib verifikasi sebelum deploy ke production — TypeScript check, lint, emulator test, deploy functions, deploy hosting. Termasuk cara rollback, env variables checklist, dan perintah deploy yang tepat.
---

# Pre-Deploy Checklist — RUANG SIGAP

Ikuti urutan ini **tanpa melewati langkah apapun** sebelum deploy ke production.

---

## ✅ Urutan Wajib Sebelum Deploy

### STEP 1: TypeScript Check (Wajib Bersih)

```bash
# Frontend
cd "d:\Project\RUANG SIGAP"
npx tsc --noEmit

# Backend (Cloud Functions)
cd functions
npx tsc --noEmit
```

**Jika ada error:** Perbaiki SEMUA error TypeScript sebelum melanjutkan. Jangan gunakan `// @ts-ignore` sebagai solusi permanen.

---

### STEP 2: Lint Check

```bash
cd "d:\Project\RUANG SIGAP"
npm run lint -- --quiet
```

**Jika ada error/warning kritis:** Perbaiki sebelum deploy. Warning yang acceptable: `no-unused-vars` untuk placeholder.

---

### STEP 3: Verifikasi Environment Variables

Pastikan semua env variable sudah tersedia di `.env.local` (development) atau Firebase Environment Config (production):

```bash
# Variabel WAJIB ada
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=       # Untuk FCM Push Notification
NEXT_PUBLIC_SENTRY_DSN=               # Untuk error tracking

# Secret Manager (untuk Cloud Functions — verifikasi via Firebase Console)
GEMINI_API_KEY                        # Untuk AI Scan
```

---

### STEP 4: Test Emulator Lokal (Opsional tapi Dianjurkan untuk Perubahan Besar)

```bash
cd "d:\Project\RUANG SIGAP"
firebase emulators:start --only functions,firestore

# Di terminal terpisah:
npm run dev
```

---

### STEP 5: Deploy Cloud Functions

Deploy functions **sebelum** hosting agar perubahan backend sudah aktif saat frontend baru di-deploy:

```bash
cd "d:\Project\RUANG SIGAP"

# Deploy semua functions
firebase deploy --only functions

# Atau deploy 1 fungsi tertentu (lebih cepat)
firebase deploy --only functions:namaFungsiSpesifik

# Verifikasi: cek log setelah deploy
firebase functions:log --limit 20
```

---

### STEP 6: Build & Deploy Hosting (Next.js)

```bash
cd "d:\Project\RUANG SIGAP"

# Build production
npm run build

# Jika tidak ada error build, deploy ke Firebase Hosting
firebase deploy --only hosting

# Atau deploy semuanya sekaligus (functions + hosting)
firebase deploy
```

---

### STEP 7: Smoke Test Setelah Deploy

Buka URL production dan verifikasi:

```
☐ Halaman login dapat dimuat
☐ Login dengan akun test berhasil
☐ Dashboard dapat dimuat (tidak ada error 500)
☐ Firestore connection berfungsi (data muncul)
☐ Tidak ada error di browser console
☐ Service Worker terdaftar (PWA berfungsi)
☐ Push notification permission prompt muncul
```

---

## 🔙 Rollback Jika Deploy Gagal

### Rollback Hosting

```bash
# Lihat daftar deploy sebelumnya
firebase hosting:releases:list

# Rollback ke versi sebelumnya
firebase hosting:rollback
```

### Rollback Cloud Functions

```bash
# Functions tidak bisa di-rollback otomatis
# Harus re-deploy versi sebelumnya dari git

git log --oneline -10  # Cari commit yang stabil
git checkout <commit-hash> -- functions/src/
firebase deploy --only functions
git checkout HEAD -- functions/src/  # Kembalikan ke branch aktif
```

---

## 📋 Checklist Kode Sebelum Commit

Sebelum `git commit`, pastikan:

```
☐ Tidak ada console.log dengan data sensitif (PII, token)
☐ Tidak ada `any` type baru yang ditambahkan
☐ Semua error di try/catch memiliki toast feedback
☐ Komponen berat menggunakan next/dynamic
☐ Tidak ada API key yang hardcode di kode
☐ Import diurutkan (tidak ada unused import)
☐ Pesan error validasi dalam Bahasa Indonesia
☐ logActivity() atau writeLogbookEntry() dipanggil untuk aksi penting
☐ Feature gate opdConfig.features diperiksa untuk fitur premium
```

---

## 🚑 Perintah Darurat

```bash
# Lihat error terbaru di production Functions
firebase functions:log --limit 50

# Cek status deploy
firebase hosting:releases:list

# Disable 1 function secara darurat (jika ada loop/error)
firebase deploy --only functions:namaFungsi  # Deploy versi kosong/disabled
```
