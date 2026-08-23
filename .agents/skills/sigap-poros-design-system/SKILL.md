---
name: sigap-poros-design-system
description: Standarisasi arsitektur UI, Design Tokens, dan Aturan Styling terpisah antara SIGAP CSS (Royal Blue / Solid Editorial) dan POROS CSS (Sovereign Teal & Gold / Glassmorphism), termasuk standar antarmuka Mobile Elegan & Borderless.
---

# Standarisasi Desain UI: SIGAP vs. POROS

Dokumen ini mendefinisikan sistem desain, aturan isolasi tema multi-tenant, panduan styling, checklist audit UI, serta standarisasi **Mobile-First Borderless & Compact UI** yang membedakan antarmuka pengguna **RUANG SIGAP** dan **POROS**.

---

## 📐 1. Arsitektur Isolasi Multi-Tenant

Aplikasi menggunakan atribut data HTML `[data-tenant="..."]` pada root container dashboard untuk menerapkan isolasi CSS tingkat tinggi (*zero style leak*):

- **SIGAP**: `<div data-tenant="sigap">` dengan import `@/app/dashboard/sigap/sigap.css`
- **POROS**: `<div data-tenant="poros">` dengan import `@/app/dashboard/poros/poros.css`

Komponen global (`src/components/ui/`) menggunakan CSS variables (`bg-card`, `text-foreground`, `border-border`, `bg-primary`) yang nilainya secara otomatis beradaptasi dengan tenant aktif.

---

## 🔷 2. Standar Desain SIGAP (Royal Blue & Solid Slate)

### Filosofi & Karakter Visual
- **Nuansa**: Tegas, Institusional, Minimalis Modern, *Clean Canvas*.
- **Karakter Bentuk**: Sudut kotak yang rapi dan tegas (`--radius: 0.15rem` ~ `rounded-sm` / `rounded-md`).
- **Gaya Permukaan**: Flat solid surface dengan garis pembatas kontras tipis (*editorial line*).

### Token & Nilai Warna SIGAP
```css
/* Light Mode */
--background: 0 0% 100%;         /* Putih Murni */
--foreground: 222.2 84% 4.9%;     /* Slate Hitam */
--card: 0 0% 100%;
--border: 214.3 31.8% 91.4%;     /* Slate-100 */
--radius: 0.15rem;

/* Signature Tokens */
--sg-blue: 221 83% 53%;          /* Royal Blue Identity */
--sg-blue-light: 221 83% 96%;    /* Badge Tint */
--sg-surface-1: 220 14% 96%;     /* Page Canvas */
--sg-surface-2: 0 0% 100%;       /* Card Canvas */
--sg-surface-3: 220 13% 91%;     /* Hover Row */
--sg-shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.06);

/* Dark Mode */
--background: 222.2 47.4% 11.2%; /* Slate 900 */
--card: 222.2 47.4% 11.2%;
--popover: 217.2 32.6% 17.5%;    /* Slate 800 */
--border: 217.2 32.6% 17.5%;
--sg-surface-1: 222 47% 8%;
--sg-surface-2: 222 47% 11%;
```

### Panduan Komponen SIGAP
1. **Page Header**: Gunakan `<SigapPageHeader title="..." icon={Icon} description="..." actions={...} />`.
2. **Cards**: `bg-card text-card-foreground border border-border/80 shadow-sm rounded-md` atau class `.sg-card`.
3. **Buttons**: `bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-sm` atau class `.sg-btn-primary`.
4. **Tables**: Gunakan class `.sg-table-wrapper`, `.sg-table`, `.sg-table-head`, `.sg-table-row`.
5. **Badges**: Gunakan `.sg-badge-new`, `.sg-badge-process`, `.sg-badge-done` atau utility slate/blue solid.

---

## 🟢 3. Standar Desain POROS (Sovereign Teal & Warm Gold)

### Filosofi & Karakter Visual
- **Nuansa**: Elegan, Prestige, Transparan, *Glassmorphism*.
- **Karakter Bentuk**: Sudut melengkung halus dan mewah (`--radius: 0.75rem` ~ `rounded-xl` / `rounded-2xl`).
- **Gaya Permukaan**: *Glass backdrop blur*, depth shadow berlapis, dan gradien teal-to-emerald halus.

### Token & Nilai Warna POROS
```css
/* Light Mode */
--background: 150 12% 97%;       /* Warm White Teal Mist */
--foreground: 195 60% 8%;        /* Deep Ocean Text */
--card: 0 0% 100%;
--border: 160 18% 88%;
--radius: 0.75rem;

/* Signature Tokens */
--nk-gradient-start: hsl(172 80% 26%); /* Deep Teal #0D6B62 */
--nk-gradient-end: hsl(190 70% 30%);
--nk-deep: hsl(172 80% 18%);
--nk-teal-mid: hsl(172 72% 38%);
--nk-teal-light: hsl(172 60% 55%);
--nk-gold: hsl(38 85% 52%);            /* Warm Gold Accent */

--nk-surface-1: hsl(160 15% 96%);      /* Page Canvas */
--nk-surface-2: hsl(0 0% 100%);        /* Card Canvas */
--nk-surface-3: hsl(160 12% 93%);
--nk-glass: rgba(255, 255, 255, 0.75);
--nk-glass-border: rgba(13, 107, 98, 0.12);
--nk-shadow-md: 0 8px 32px -8px rgba(13, 107, 98, 0.14);

/* Dark Mode */
--background: 192 60% 4%;        /* Deep Ocean Black */
--card: 192 50% 7%;
--primary: 172 60% 50%;
--border: 192 30% 15%;
```

### Panduan Komponen POROS
1. **Cards**: `bg-card/80 backdrop-blur-xl border border-[var(--nk-gradient-start)]/10 shadow-sm rounded-2xl`.
2. **Buttons**: `bg-[var(--nk-teal-mid)] hover:bg-[var(--nk-deep)] text-white shadow-lg shadow-[var(--nk-gradient-start)]/20 rounded-xl`.
3. **Badges / Highlights**: `bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400`.

---

## 📱 4. Standarisasi UI Mobile Elegan & Borderless

Pada layar smartphone (`viewport < 768px`), layout harus dioptimalkan untuk meminimalkan *visual clutter* ("kotak di dalam kotak") dan memberikan ruang lapang bagi konten:

### A. Pola Borderless Card
Gunakan pola responsive:
- **Mobile (`< 768px`)**: `border-x-0 border-t-0 rounded-none shadow-none`
- **Desktop (`>= 768px`)**: `md:border md:rounded-[var(--radius)] md:shadow-sm`

```tsx
<div className="bg-card border-b border-border/50 border-x-0 md:border md:border-border/80 rounded-none md:rounded-md p-4 md:p-5 shadow-none md:shadow-sm">
  {/* Konten Kartu */}
</div>
```

### B. Matriks Skala Tipografi Responsif
Hindari font desktop yang terlalu besar di layar ponsel. Gunakan skala berikut:

| Elemen Antarmuka | Mobile (`< 768px`) | Desktop (`>= 768px`) | Class Tailwind Standar |
|---|---|---|---|
| **Judul Halaman Utama** | 20px / 1.25rem | 30px / 1.875rem | `text-xl md:text-3xl font-bold` |
| **Judul Seksi / Tab** | 16px / 1rem | 20px / 1.25rem | `text-base md:text-xl font-bold` |
| **Judul Kartu / Surat** | 14px / 0.875rem | 16px / 1rem | `text-sm md:text-base font-semibold leading-snug` |
| **Teks Body / Uraian** | 12px / 0.75rem | 14px / 0.875rem | `text-xs md:text-sm text-muted-foreground` |
| **Label / Tag / Timestamp** | 10px / 0.625rem | 12px / 0.75rem | `text-[10px] md:text-xs tracking-wider uppercase font-medium` |

### C. Touch-Target & Spacing
- **Tombol Aksi Mobile**: `h-9 px-3 text-xs md:h-10 md:px-4 md:text-sm font-semibold`.
- **Ikon Inline Metadata**: `size-3.5` (14px) atau `size-4` (16px).
- **Padding Halaman Mobile**: `pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-6` agar tidak tertutup Bottom Navigation Bar.

---

## 🔍 5. Panduan & Checklist Audit Menu SIGAP

| No | Komponen / Bagian | Kriteria Audit Standar SIGAP | Status Kepatuhan |
|---|---|---|---|
| 1 | **Header Halaman** | Wajib menggunakan `SigapPageHeader` dengan icon, judul, deskripsi sub-header, dan slot `actions`. | ✅ Terintegrasi di seluruh modul utama |
| 2 | **Palet & Aksen Utama** | Menggunakan Royal Blue (`bg-blue-600`, `--sg-blue`), bebas dari `--nk-*` token. | ✅ 100% Bebas Token Asing |
| 3 | **Filter & Search Bar** | Menggunakan `.sg-filter-bar`, input debounce dengan icon pencarian kiri. | ✅ Terintegrasi |
| 4 | **Responsivitas Mobile** | Card borderless di mobile, font proporsional, clearance safe-area bottom nav. | ✅ Memenuhi Standar Mobile |
| 5 | **Tabel Data** | Kontainer `.sg-table-wrapper`, header `.sg-table-head`, baris `.sg-table-row`. | ✅ Terintegrasi |
| 6 | **Modal & Dialog** | Latar dialog `bg-card border-border`, tombol simpan `bg-blue-600 hover:bg-blue-700`. | ✅ Standar Shadcn Dialog |

---

## ⚠️ 6. Aturan Pengkodean (Coding Rules & Constraints)

1. **Isolasi Token**:
   - Dilarang keras menggunakan variabel `--nk-*` di dalam direktori `src/app/dashboard/sigap/`.
   - Dilarang keras menggunakan variabel `--sg-*` di dalam direktori `src/app/dashboard/poros/`.
2. **Komponen UI Bersama**:
   - Komponen di `src/components/ui/` harus selalu mengonsumsi utility tailwind standar (`bg-card`, `text-foreground`, `border-border`) agar kompatibel multi-tenant tanpa hardcode warna spesifik.
3. **Animasi & Transisi**:
   - SIGAP menggunakan micro-animation cepat (`duration-150`, snappy transition).
   - POROS menggunakan spring animation yang lebih lembut (`framer-motion` spring transition, blur-in, dan glow effect).

---

## ⚡ 7. Arsitektur Homepage & Dashboard Builder (Desktop & Mobile Elegan Anti-Lag)

### A. Pilar Performa Anti-Lag (60 FPS & Zero TBT)
1. **Lazy Widget Loading & Code-Splitting**:
   - Widget berat (Recharts/Chart.js, Full Calendar, Rich Text Editor, Batch Export Modals) WAJIB dimuat menggunakan `next/dynamic` dengan skeleton fallback:
     ```tsx
     const AnalyticsChart = dynamic(() => import('./widgets/AnalyticsChart'), {
       ssr: false,
       loading: () => <SkeletonCard className="h-64" />
     });
     ```
2. **Zero Layout Shift (CLS = 0)**:
   - Setiap placeholder/skeleton harus memiliki tinggi eksplisit (`min-h-[...]` atau rasio aspect yang identik dengan komponen aslinya).
3. **Content Visibility & CSS Containment**:
   - Terapkan `content-visibility: auto` dan `contain-intrinsic-size` pada feed bawah yang panjang agar browser tidak merender elemen sebelum di-scroll.
4. **GPU-Accelerated Micro-Animations**:
   - Gunakan `transform: translate3d(0,0,0)` dan `opacity` untuk animasi (hindari menganimasikan `width`, `height`, `margin`, atau `top/left` yang memicu browser reflow).
5. **Debounce & React 19 / 18 Transitions**:
   - Gunakan `useDeferredValue` atau `useTransition` pada filter/pencarian real-time agar input pengguna tidak pernah terhambat (*input lag = 0ms*).

---

### B. Blueprint Komposisi Blok / Widget Homepage

| Tipe Widget | Karakter Desktop (`>= 768px`) | Karakter Mobile (`< 768px`) | Standar Performa |
|---|---|---|---|
| **1. Hero Smart Greeting** | Banner lebar dengan metrik ringkas & cuaca/waktu real-time | Tipografi kompak (`text-2xl`), avatar rounded, sub-text 1 baris | Static prerendered text |
| **2. Metric Counters (Stat Cards)** | Grid 4 kolom dengan hover lift effect | Grid 2 kolom atau horizontal swipeable pills | Memoized aggregation |
| **3. Priority Action Stream** | Tabel / split panel dengan multi-aksi | Borderless feed cards dengan swipe action / bottom sheet | Virtualized jika > 20 item |
| **4. Quick Navigation Grid** | Floating pill bar atau toolbar atas | 4x2 App Launcher Grid (icon 24px + label 10px) | Pure SVG icons (lucide-react) |
| **5. Agenda & Schedule** | Split calendar view + time slots | Horizontal timeline snap carousel (`snap-x snap-mandatory`) | Lightweight date-fns/dayjs |

---

### C. Blueprint Layout Responsif

- **Desktop Layout (12-Col Grid)**:
  ```tsx
  <div className="sg-page grid grid-cols-12 gap-6">
    <div className="col-span-12">{/* Smart Greeting */}</div>
    <div className="col-span-12">{/* Stat Cards 4-Col */}</div>
    <div className="col-span-8 space-y-6">{/* Primary Feed / Surat Masuk */}</div>
    <div className="col-span-4 space-y-6">{/* Agenda, Kalender, Shortcuts */}</div>
  </div>
  ```

- **Mobile Layout (Single Stream Borderless)**:
  ```tsx
  <div className="sg-page flex flex-col space-y-3 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]">
    <SmartGreeting />
    <QuickShortcutsMobileGrid />
    <MobileAgendaCarousel />
    <div className="sg-mobile-borderless bg-card">
      <PriorityActionFeed />
    </div>
  </div>
  ```

---

## 🌐 8. Standarisasi `src/app/page.tsx` (Public Landing Page & Showcase Portal)

### A. Perbedaan Esensial: Landing Page vs Dashboard Homepage

| Aspek | Public Landing Page (`src/app/page.tsx`) | Dashboard Homepage (`src/app/dashboard/sigap/page.tsx`) |
|---|---|---|
| **Akses** | Publik (Tanpa Autentikasi) | Terproteksi (Wajib Login & Cek Sesi) |
| **Audiens** | Publik, Pimpinan Instansi, Calon Pengguna | Pegawai, Pejabat, Operator Internal |
| **Fokus Konten** | Narasi Solusi, Showcase Alur Kerja, ROI, Keamanan | Tugas Harian, Agenda Hari Ini, Shortcut Cepat |
| **Pola Layout** | Multi-Section Linear Scroll (Storytelling) | Multi-Widget Grid / Single-Stream Mobile Feed |
| **Styling Root** | `<div data-tenant="sigap">` + `@/app/dashboard/sigap/sigap.css` | Scoped by Dashboard Tenant Layout |

---

### B. Blueprint Seksi & Komposisi Landing Page

1. **Header & Branding**:
   - `DomainBanner`: Informasi instansi & status domain.
   - `Navbar`: Logo `Layers`, tema switcher `ThemeToggleCompact`, dan CTA `Log In`.
2. **Workflow Visualizer (1-to-5 Output)**:
   - Visualisasi grafis input surat tunggal yang otomatis memicu: Lembar Disposisi, Logbook Kinerja, Notulensi, Agenda Kalender, dan Arsip Digital.
3. **Lifecycle Visualizer**:
   - Menampilkan siklus 5 status: Baru -> Disposisi -> Tindak Lanjut -> Selesai -> Arsip.
4. **Interactive Showcase & Bento Features**:
   - Tampilan demo interaktif kartu surat dan widget cerdas.
5. **Impact Statistics & Infrastructure**:
   - Metrik penghematan waktu/kertas dan kesiapan arsitektur SPBE.
6. **Enterprise Footer**:
   - Standard kepatuhan keamanan: *SOC2 Ready, AES-256 Encryption, 99.99% Uptime SLA*.

---

## 📱 9. Standarisasi PWA, FCP & Push Notification (FCM)

### A. Alur Registrasi & Pengiriman FCM Token
1. **Request Permission & Token Generation**:
   - Komponen `layout.tsx` memanggil `getFCMToken()` dari `@/lib/firebase-messaging`.
   - Browser meminta izin pop-up `Notification.requestPermission()`.
   - Token VAPID disimpan ke dokumen Firestore `users/{nip}` dengan `arrayUnion(token)`.
2. **Sinkronisasi Service Worker**:
   - `public/firebase-config.js` di-generate otomatis via script `node scripts/generate-sw-config.js`.
   - `public/firebase-messaging-sw.js` mengimpor `firebase-config.js` untuk menjalankan background listener, pola getar `[100, 50, 100]`, dan *App Icon Badging* (`navigator.setAppBadge`).

---

### B. Mekanisme Tombol Install PWA (Cross-Platform)

| Platform | Deteksi | Perilaku Saat Tombol Diklik |
|---|---|---|
| **Android / Chrome / Edge** | `beforeinstallprompt` event tertangkap | Memanggil `promptEvent.prompt()` untuk membuka dialog instalasi native PWA |
| **iOS Safari** | Regex `/iphone|ipad|ipod/.test(navigator.userAgent)` | Membuka modal panduan 2 langkah (*Bagikan -> Tambah ke Layar Utama*) |
| **PWA Standalone (Sudah Terinstal)** | `window.matchMedia('(display-mode: standalone)').matches` | Tombol instal otomatis disembunyikan |

---

### C. Optimasi First Contentful Paint (FCP)
- Gunakan skeleton loaders berketinggian tetap (`RuangKerjaSkeleton`, `SkeletonCard`) agar CLS = 0.
- Hindari memuat modul grafis berat secara sinkron; gunakan `next/dynamic` dengan `ssr: false`.
- Jalankan verifikasi linting (`npm run lint -- --quiet`) dan type-checking (`npx tsc --noEmit`) secara rutin.



