# UI Upgrade Plan: Maksimalkan Framer Motion & Global CSS

## Ringkasan Hasil Analisis

Setelah analisis mendalam seluruh frontend **SIGAP v2**, ditemukan kondisi berikut:

### ✅ Kekuatan yang Sudah Ada
- **Global CSS yang kaya**: `globals.css` sudah memiliki design system omnifit yang sangat lengkap: `card-solid/glass/interactive`, `glass-card`, `glow-*`, `text-gradient-*`, `btn-primary-rich`, dan 10+ keyframe animasi CSS.
- **Framer Motion tersedia**: `framer-motion ^11.3.2` sudah terinstall; digunakan di beberapa komponen (SmartGreeting, PageTransition, MegaMenu, SpotlightCard, FloatingCard, GlassPanel, AnimatedCounter).
- **Library omnifit-ui lokal**: 60+ komponen premium di `src/components/` — FloatingCard, SpotlightCard, PulseStatCard, GlassPanel, SkeletonLoader, dll.
- **Tailwind animate plugin** sudah terpasang dengan keyframes custom.
- **Dark mode** dengan tema OLED sudah berjalan via `next-themes`.

### ❌ Gap yang Harus Diisi (Prioritas Tinggi)

| Area | Masalah | Dampak |
|---|---|---|
| **Halaman Login** | Tidak ada animasi sama sekali. Static Card biasa | Tidak berkesan saat first impression |
| **Sidebar** | Tidak ada Framer Motion sama sekali, hover & state manual CSS | Terasa kaku |
| **Dashboard Header (Navbar)** | Glassmorphism ada, tapi belum pakai `glass-card` class secara optimal | Inkonsisten |
| **Dashboard Main Page** | Cards agenda pakai `rounded-none` dan `card-solid` tapi tidak animate on-enter | Statis, kurang hidup |
| **Dashboard page.tsx AgendaItem** | Tidak ada animasi list entry, tidak pakai komponen omnifit yang sudah tersedia | Terbuang percuma |
| **BottomNavBar** | Tab indicator static, tidak ada Framer Motion `layoutId` spring animation | Terasa murahan |
| **SmartGreeting** | Hanya `opacity: 0 → 1, y: -20 → 0`. Nama dan ikon tidak animasi tersendiri | Bisa jauh lebih dramatis |
| **QuickAccessCard** | `fade-in` pakai CSS manual `animationDelay`, bukan Framer Motion `staggerChildren` | Tidak optimal |
| **PageTransition** | Durasi `0.15s` terlalu cepat, `y: 5` terlalu kecil, tidak ada exit animation | Transisi kurang berasa |
| **globals.css** | Tidak ada font premium (Google Fonts), CSS variable `--page-background` tidak dipakai, tidak ada `will-change` optimization | Potensi performance loss |
| **Root layout** | Google Fonts tidak di-load (di-comment), `font-sans` fallback ke system font | Tipografi tidak premium |

---

## Rencana Upgrade (4 Fase)

### Fase 1 — Fondasi Global (globals.css + layout.tsx + tailwind.config.js)
**Target**: Memperkuat design system agar semua komponen bisa memanfaatkan.

**Perubahan:**
1. **`src/app/layout.tsx`** — Load Google Fonts `Inter` (body) + `Sora` (heading) via `next/font/google`. Aktifkan font variable ke body.
2. **`globals.css`** — Tambahkan:
   - CSS `@keyframes` baru: `gradient-shift` (background animated gradient), `slide-up-fade` (lebih dramatik dari slide-in-up yang ada), `scale-in` (zoom pop masuk).
   - Utility class: `.animate-gradient-shift`, `.page-enter-animation`, `.list-item-hover`, `.nav-indicator` (untuk bottom nav spring).
   - `will-change: transform, opacity` pada elemen animasi utama.
   - Perbaiki duplikasi `--background` (saat ini ada definisi ganda di `:root`).
3. **`tailwind.config.js`** — Tambah keyframes: `gradient-shift`, `scale-in`, `slide-right`.

---

### Fase 2 — Core Layout Animation (Sidebar + Navbar + BottomNavBar)
**Target**: Setiap klik terasa responsif dan "alive".

**Perubahan:**

#### [MODIFY] `src/app/dashboard/components/Sidebar.tsx`
- Wrap section buttons dengan `motion.button` (Framer Motion).
- Tambahkan `layoutId="sidebar-active-bg"` ke active state background → spring animation saat user pindah section.
- Active icon: `motion.div` dengan `scale: [1, 1.2, 1]` saat `isActive` berubah.
- Tooltip hover: animasi `initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}`.
- Bottom user avatar: `whileHover={{ scale: 1.1 }}`.

#### [MODIFY] `src/app/dashboard/layout.tsx` (Navbar header)
- Header `<header>`: Pastikan pakai class `glass-card` (sudah ada), tambahkan `sticky` dengan framer-motion scroll-driven opacity.
- Profile avatar button: Ganti dengan `motion.button` + `whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}`.
- Notification badge ping: Sudah pakai `animate-ping`, pertimbangkan ganti ke Framer Motion untuk kontrol lebih presisi.
- Bell icon button: `motion.div whileHover={{ rotate: 15 }}`.

#### [MODIFY] `src/app/dashboard/components/BottomNavBar.tsx`
- **Teknik `layoutId`**: Pindahkan active indicator dari `<span className="absolute bottom-0 w-8 h-1 bg-primary">` ke `<motion.span layoutId="bottom-nav-indicator">`. Ini akan membuat indicator "mengalir" dengan spring animation saat pindah tab — teknik paling populer di React Navigation modern.
- Active icon: `motion.div animate={{ scale: isActive ? 1.15 : 1 }}`.
- `whileTap={{ scale: 0.9 }}` di setiap link button.

---

### Fase 3 — Page-Level Animation (Dashboard Home + Login)
**Target**: Halaman utama berasa premium, login memiliki first impression kuat.

**Perubahan:**

#### [MODIFY] `src/app/login/page.tsx`
- Wrap seluruh login card dengan `motion.div` `initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}`.
- Kolom kiri informatif: Stagger animasi ke setiap list item fitur dengan `variants` + `staggerChildren: 0.12s`.
- Logo: `motion.div` dengan `initial={{ opacity: 0, y: -20 }}` + `transition={{ type: "spring", bounce: 0.3 }}`.
- Input fields: `whileFocus={{ scale: 1.01 }}` + border animate.
- Submit button: Wrap dengan `motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}`.
- Background: Tambah `ParticleBackground` atau animated gradient blob (pakai CSS `animate-gradient-shift`) di balik card.

#### [MODIFY] `src/app/dashboard/page.tsx`
- **SmartGreeting**: Pisahkan animasi icon, text sapaan, dan nama user menjadi `staggerChildren` terpisah → efek "kata demi kata" muncul.
- **Quick Access Grid**: Ganti `animationDelay` CSS manual dengan Framer Motion `staggerChildren: 0.04s` per card.
- **Agenda Cards** (`AgendaItem`): Wrap setiap item dengan `motion.div` `initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}` + `whileHover={{ x: 2, boxShadow: "..." }}`.
- **Filter buttons** (Hari Ini / Akan Datang): Ganti dengan animated toggle pakai `motion.span layoutId="agenda-filter-bg"`.
- **Agenda card wrapper**: Pakai `AnimatePresence mode="wait"` saat filter berganti sehingga konten masuk-keluar secara smooth.
- Tambahkan `motion.div` wrapper ke seluruh section dengan `initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}` → animasi hanya saat masuk viewport.

#### [MODIFY] `src/app/dashboard/components/home/SmartGreeting.tsx`
- Tambahkan `variants` untuk container dan children.
- Icon: `initial={{ rotate: -10, scale: 0 }} animate={{ rotate: 0, scale: 1 }}` dengan spring bounce.
- Greeting text: `initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}`.
- Username: Highlight span dengan `initial={{ opacity: 0 }} animate={{ opacity: 1 }}` delay 0.3s.

---

### Fase 4 — PageTransition & Micro-interactions Polish
**Target**: Setiap navigasi dan interaksi terasa halus dan konsisten.

**Perubahan:**

#### [MODIFY] `src/app/dashboard/components/PageTransition.tsx`
- Tingkatkan animasi: `initial={{ opacity: 0, y: 12 }}` (naik dari 5).
- Tambahkan `exit={{ opacity: 0, y: -8 }}` yang selama ini di-comment.
- Durasi menjadi `0.25s` (dari 0.15s) — cukup terasa tanpa lambat.
- Tambahkan `transition={{ ease: [0.22, 1, 0.36, 1] }}` (cubic bezier premium "ease out expo").

#### [MODIFY] `src/components/ui/button.tsx`
- Semua Button variant: Tambahkan `whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}` via Framer Motion (atau ubah Button menjadi `motion.button`).

#### Global Micro-interactions via CSS (globals.css additions):
- `.interactive-card` class: `hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:shadow-md transition-all duration-200`.
- `.nav-link-hover`: pseudo-element underline animation dengan `scaleX` dari 0 ke 1.
- Input focus ring: Perkuat dengan `transition: box-shadow 0.2s, border-color 0.2s`.

---

## File yang Akan Diubah

### Fase 1 — Fondasi
#### [MODIFY] [layout.tsx](file:///d:/DENY/project/ruang-sigap-v2/src/app/layout.tsx)
#### [MODIFY] [globals.css](file:///d:/DENY/project/ruang-sigap-v2/src/app/globals.css)
#### [MODIFY] [tailwind.config.js](file:///d:/DENY/project/ruang-sigap-v2/tailwind.config.js)

---

### Fase 2 — Core Layout
#### [MODIFY] [Sidebar.tsx](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/components/Sidebar.tsx)
#### [MODIFY] [BottomNavBar.tsx](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/components/BottomNavBar.tsx)
#### [MODIFY] [layout.tsx (dashboard)](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/layout.tsx)

---

### Fase 3 — Page-Level
#### [MODIFY] [login/page.tsx](file:///d:/DENY/project/ruang-sigap-v2/src/app/login/page.tsx)
#### [MODIFY] [dashboard/page.tsx](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/page.tsx)
#### [MODIFY] [SmartGreeting.tsx](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/components/home/SmartGreeting.tsx)

---

### Fase 4 — Polish
#### [MODIFY] [PageTransition.tsx](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/components/PageTransition.tsx)
#### [MODIFY] [button.tsx](file:///d:/DENY/project/ruang-sigap-v2/src/components/ui/button.tsx)

---

## Teknik Framer Motion yang Akan Digunakan

| Teknik | Digunakan Pada | Efek |
|---|---|---|
| `layoutId` spring | Sidebar active bg, BottomNav indicator, Filter toggle | Elemen "mengalir" saat active state berpindah |
| `staggerChildren` + `variants` | Login fitur list, Quick Access grid, Agenda list | Items muncul berurutan dengan delay elegan |
| `whileInView` + `viewport.once` | Section cards di dashboard | Animasi muncul saat scroll masuk viewport |
| `whileHover` + `whileTap` | Semua button, card, nav item | Micro-feedback saat interaksi |
| `AnimatePresence mode="wait"` | Filter konten agenda, page transitions | Konten lama exit, baru masuk secara smooth |
| `useMotionValue` + `useSpring` | Sudah ada di FloatingCard & AnimatedCounter — akan diperluas | Physics-based animation |
| `useTransform` | Parallax subtle pada greeting section | Depth effect |

---

## Open Questions

> [!IMPORTANT]
> **Q1: Apakah animasi exit di PageTransition disetujui?**
> Saat ini exit animation dinonaktifkan dengan komentar "agar pergerakan lebih cepat". Rencananya akan diaktifkan kembali dengan durasi pendek (0.15s). Apakah ini diinginkan?

> [!IMPORTANT]  
> **Q2: Apakah Button shadcn boleh dikonversi ke `motion.button`?**
> Ini membutuhkan perubahan pada `button.tsx` — komponen yang dipakai di seluruh aplikasi. Risikonya rendah tapi berdampak luas. Alternatif: buat wrapper `AnimatedButton` yang lebih aman.

> [!NOTE]
> **Q3: Font Premium**
> Font saat ini di-comment di layout.tsx (Inter disabled). Rencana: aktifkan `Inter` + tambahkan `Sora` untuk heading. Apakah perlu Google Fonts atau cukup dengan `font-sans` system font?

## Verification Plan

### Automated Tests
- Pastikan `npm run build` berhasil setelah setiap fase.
- Cek tidak ada error TypeScript via `npx tsc --noEmit`.

### Manual Verification
- Uji animasi di **Chrome DevTools** dengan CPU throttle 4x untuk memastikan performa.
- Uji di **mobile viewport** untuk animasi BottomNavBar `layoutId`.
- Verifikasi dark/light mode switch tidak merusak animasi.
- Cek tidak ada layout shift (CLS) akibat animasi.
