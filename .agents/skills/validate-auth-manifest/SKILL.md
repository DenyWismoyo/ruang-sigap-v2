---
name: validate-auth-manifest
description: Agent diagnostik untuk memeriksa validitas sistem Login, AuthContext, Proxy (Middleware), dan Manifest PWA (Desktop/Mobile) terutama saat terjadi stuck "Memuat sesi..." di production.
---

# Validate Auth & Manifest Setup

Gunakan skill ini ketika pengguna meminta bantuan untuk "cek kevalidan auth", "cek proxy", atau jika aplikasi mengalami stuck pada "Memuat sesi..." di halaman login pada mode production.

## 1. Verifikasi Middleware (`proxy.ts` / `middleware.ts`)
- **Tugas Agent**: Periksa file `src/proxy.ts`.
- **Kriteria Valid**:
  - `matcher` harus mengabaikan static files, `_next`, `api`, dan idealnya `manifest.json` serta file PWA lainnya (seperti ikon dan service worker).
  - Pastikan akses ke path `/login` dan request internal Firebase tidak dialihkan (redirect loop).

## 2. Verifikasi `AuthContext.tsx` & Initialization
- **Tugas Agent**: Periksa state `initializing` di `src/context/AuthContext.tsx`.
- **Kriteria Valid**:
  - `onIdTokenChanged` harus dipanggil dan HANYA bergantung pada Firebase auth.
  - Periksa apakah ada potensi *Uncaught Promise Rejection* yang menyebabkan `setInitializing(false)` tidak pernah tereksekusi.
  - **Saran Solusi**: Tambahkan timeout darurat (misal 5-10 detik) menggunakan `setTimeout` di dalam `useEffect` AuthContext. Jika setelah 10 detik Firebase belum merespons, paksa `setInitializing(false)` dan tampilkan error ke user, daripada membiarkan user terjebak di layar "Memuat sesi...".

## 3. Verifikasi PWA Manifest & Service Worker
- **Tugas Agent**: Periksa `public/manifest.json`, file Service Worker (jika ada), dan `src/app/layout.tsx`.
- **Kriteria Valid**:
  - PWA di mobile dan desktop akan menggunakan *Service Worker* jika didukung. Pastikan tidak ada *aggressive caching* pada URL Firebase Auth (`identitytoolkit.googleapis.com` atau sejenisnya).
  - Pastikan `ServiceWorkerReset` (jika ada) benar-benar membersihkan cache/worker lama yang corrupt sebelum login form dirender.
  
## 4. Langkah Perbaikan Langsung (Actionable Fixes)
Jika dipanggil untuk memperbaiki stuck "Memuat sesi...", agent harus:
1. Menambahkan "Safety Timeout" di `AuthContext.tsx` untuk memaksa `setInitializing(false)` maksimal 10 detik.
2. Memastikan `matcher` di `proxy.ts` mengecualikan `/manifest.json` dan `sw.js`.
