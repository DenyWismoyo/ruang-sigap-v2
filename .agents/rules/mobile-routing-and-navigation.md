# Standarisasi Routing & Navigasi Mobile (Swipe-Back, History Stack) — RUANG SIGAP

Dokumen ini mendefinisikan guardrail mutlak untuk navigasi programatik di Next.js App Router agar aplikasi terasa seperti native app enterprise — terutama swipe-back pada ponsel yang selalu kembali ke halaman sebelumnya.

---

## 1. ⚠️ Masalah yang Dipecahkan

Di Next.js App Router, penggunaan `router.replace()` yang salah akan **menghapus history stack** — sehingga gesture swipe-back di iOS/Android tidak membawa user ke halaman sebelumnya. Ini membuat aplikasi terasa tidak native.

---

## 2. 🔑 Hook WAJIB: `useInstantNav`

**Semua navigasi programatik** (klik link, klik item, navigasi dari aksi) **WAJIB** menggunakan hook `useInstantNav` yang sudah tersedia di:

```
src/app/dashboard/sigap/hooks/use-instant-nav.ts
```

Hook ini menggunakan `useTransition` dari React untuk mencegah UI freeze saat berpindah halaman, dan memicu NProgress loading bar secara otomatis.

```tsx
import { useInstantNav } from '@/app/dashboard/sigap/hooks/use-instant-nav';

function MyComponent() {
  const { navigate, prefetch, isPending } = useInstantNav();

  return (
    <button
      onClick={() => navigate('/dashboard/surat/detail/abc123')}
      onMouseEnter={() => prefetch('/dashboard/surat/detail/abc123')} // Prefetch on hover
      disabled={isPending}
    >
      Lihat Detail
    </button>
  );
}
```

---

## 3. 📋 Kapan Gunakan `push` vs `replace` vs `back`

| Skenario | Yang Harus Digunakan | Alasan |
|----------|---------------------|--------|
| Navigasi ke halaman detail (item surat, detail tugas) | `navigate(href)` → `router.push` | Harus bisa di-swipe-back |
| Navigasi antar menu utama (sidebar/bottom nav) | `navigate(href)` → `router.push` | Tetap jaga history stack |
| Setelah berhasil submit form (tambah data baru) | `router.replace(href)` | Cegah re-submit saat back |
| Setelah logout atau expired session | `router.replace('/login')` | Hapus halaman dashboard dari history |
| Tombol "Kembali" / close sheet/modal halaman | `router.back()` | Kembali ke state sebelumnya |
| Redirect dari middleware (auth guard) | `NextResponse.redirect()` | Server-side, tidak masuk history client |

---

## 4. 🚫 DILARANG: Penggunaan `router.replace()` untuk Navigasi Normal

**❌ DILARANG — Merusak swipe-back:**
```tsx
// ❌ Ini menghapus halaman sebelumnya dari history!
// Swipe-back setelah ini tidak akan berfungsi dengan benar
const router = useRouter();
router.replace('/dashboard/ruang-kerja'); // ❌
```

**✅ WAJIB — Selalu gunakan push untuk navigasi normal:**
```tsx
const { navigate } = useInstantNav();
navigate('/dashboard/ruang-kerja'); // ✅ History stack terjaga
```

**Pengecualian sah untuk `router.replace()`:**
```tsx
// ✅ Boleh setelah form submit (cegah double-submit)
router.replace(`/dashboard/surat/${newDocId}`);

// ✅ Boleh setelah logout
router.replace('/login');

// ✅ Boleh untuk redirect error/not-found
router.replace('/dashboard');
```

---

## 5. 🔙 Tombol Back & Swipe-Back Pattern

Setiap halaman detail atau sub-halaman yang dibuka via navigasi **WAJIB** memiliki tombol back yang menggunakan `router.back()`:

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

// ✅ Pola standar tombol back
function BackButton({ fallbackHref = '/dashboard' }: { fallbackHref?: string }) {
  const router = useRouter();

  const handleBack = () => {
    // Cek apakah ada history untuk di-back
    if (window.history.length > 1) {
      router.back();
    } else {
      // Fallback jika langsung akses URL (misal dari notifikasi)
      router.replace(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
    >
      <ArrowLeft className="size-4" />
      <span>Kembali</span>
    </button>
  );
}
```

---

## 6. 📲 Animasi Page Transition (Native Feel)

Untuk memberikan feel "slide" seperti native app, setiap halaman detail/sub-halaman **WAJIB** menggunakan animasi masuk dari arah kanan:

### SIGAP
```tsx
// Gunakan class sg-slide-in-right yang sudah ada di sigap.css
// @keyframes sg-slide-in-right: from translateX(30px) → translateX(0)
<div className="sg-slide-in-right sg-page">
  {/* Konten halaman detail */}
</div>
```

### POROS / Universal
```tsx
// Gunakan Tailwind animate-in dari shadcn/tailwind-animate
<div className="animate-in slide-in-from-right-8 duration-300 ease-out">
  {/* Konten halaman detail */}
</div>
```

---

## 7. 📌 Deep Link dari Notifikasi

Saat pengguna tap notifikasi FCM dan membuka halaman tertentu langsung, **History Stack mungkin kosong**. Pastikan setiap halaman detail menangani kasus ini:

```tsx
// ✅ Pattern: Deteksi referrer untuk handle direct access
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DetailSuratPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // Tidak perlu useEffect khusus — cukup gunakan BackButton dengan fallbackHref
  // BackButton akan otomatis fallback ke halaman parent jika history kosong

  return (
    <div className="sg-page">
      <BackButton fallbackHref="/dashboard/surat" />
      {/* Konten */}
    </div>
  );
}
```

---

## 8. ⚡ Prefetch on Hover (Performa)

Gunakan `prefetch()` dari `useInstantNav` pada elemen yang kemungkinan besar akan diklik:

```tsx
const { navigate, prefetch } = useInstantNav();

// ✅ Prefetch saat hover untuk navigasi terasa instant
<div
  onClick={() => navigate(`/dashboard/surat/${suratId}`)}
  onMouseEnter={() => prefetch(`/dashboard/surat/${suratId}`)}
  className="sg-list-card cursor-pointer"
>
  {/* Kartu surat */}
</div>
```

---

## 9. 🚫 Anti-Pattern Routing yang Dilarang

| Anti-Pattern | Dampak | Solusi |
|-------------|--------|--------|
| `router.replace()` untuk navigasi menu | Swipe-back rusak | Gunakan `navigate()` dari `useInstantNav` |
| `<a href="...">` untuk navigasi internal | Full page reload | Gunakan `navigate()` atau `<Link href="...">` |
| `router.push()` langsung tanpa `useTransition` | UI freeze di halaman berat | Gunakan `useInstantNav` yang sudah ada |
| Tidak ada tombol back di halaman detail | UX buruk di mobile | Wajib ada `<BackButton>` |
| `window.location.href = "..."` | Full reload + hilang history | DILARANG untuk navigasi internal |
