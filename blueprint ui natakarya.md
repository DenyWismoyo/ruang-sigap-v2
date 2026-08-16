# Natakarya UI Premium Rebrand — Rencana Implementasi

## Latar Belakang

Saat ini Natakarya menggunakan sistem CSS yang masih **terlalu mirip** dengan Sigap — keduanya berbagi pola komponen yang sama, spacing yang hampir identik, dan pendekatan visual "bersih tapi generik". Tujuan refaktor ini adalah menjadikan Natakarya terasa **corporate-luxury**, elegan, dan punya identitas visual yang kuat secara independen, tanpa mengubah satu pun alur UX.

---

## Audit: Kondisi Saat Ini

### Sigap vs Natakarya — Perbedaan yang ada:
| Aspek | SIGAP | NATAKARYA (sekarang) |
|---|---|---|
| Palet Warna | Monokrom (Navy/Slate) | Teal + Amber (ada, tapi kurang tegas) |
| Border Radius | `0.5rem` (tajam, linear) | `1rem` (lebih bulat) |
| Font | Default sans-serif | Plus Jakarta Sans |
| Glassmorphism | Tidak ada | Ada, tapi minimal |
| Shadow | Tidak ada (flat) | Ada, tapi sangat ringan |
| Sidebar | Full label, text-heavy | Icon-only + mega menu |
| Animasi | Minimal | Ada Framer Motion, tapi belum konsisten |

### Kelemahan yang Ditemukan di Natakarya:
1. **CSS variables teal sudah bagus tapi belum dieksploitasi** — banyak komponen masih menggunakan warna hardcoded Tailwind (`text-cyan-600`, `text-green-600`) yang inkonsisten.
2. **`natakarya.css` terlalu tipis (160 baris)** — belum ada token desain untuk card premium, gradient accent, dll.
3. **SmartGreeting** memakai icon warna-warni yang tidak kohesif dengan palet teal.
4. **QuickAccessCard** menggunakan `SpotlightCard` generic yang sama dengan Sigap.
5. **MegaMenuPanel** dan **Sidebar** sudah baik, tapi belum punya "signature visual" Natakarya yang kuat.
6. **Header (layout.tsx)** — bell, search, avatar button masih sangat generic/polos.
7. **Page transitions** sudah ada tapi loading overlay belum memakai identitas Natakarya.
8. **Halaman-halaman turunan** (surat, tugas, dsb) hampir tidak punya sentuhan brand Natakarya — styling sepenuhnya bergantung pada Shadcn defaults.

---

## Filosofi Desain Natakarya Premium

> **"Sovereign Teal" — Elegan, Institutional, Trustworthy**

Inspirasi: Bloomberg Terminal × Linear App × Notion Enterprise

- **Warna Primär**: Deep Teal (`#0D4F4A`) + Muted Gold/Khaki accent
- **Dark Mode**: Deep Ocean Teal `#060F10` — hampir hitam dengan nuansa teal
- **Typography**: Plus Jakarta Sans — tegas, modern, terbaca
- **Radius**: Konsisten `0.75rem` untuk card kecil, `1.25rem` untuk card besar
- **Shadow**: Bukan drop-shadow biasa — pakai `shadow-teal` yang subtle dan directional
- **Glassmorphism**: Dipakai di header, sidebar, dan modal — bukan di card utama
- **Accent line**: Setiap card/section punya "teal line" tipis di sisi kiri (editorial feeling)

---

## Usulan Perubahan Token Warna (CSS Variables)

```css
/* BARU — Palet Premium "Sovereign Teal" */

/* Light Mode */
--background: 150 12% 97%;     /* Warm white, sedikit kehijauan */
--foreground: 195 60% 8%;      /* Deep ocean text */
--card: 0 0% 100%;
--primary: 172 80% 26%;        /* Deep Teal #0D6B62 — lebih gelap & prestige */
--primary-foreground: 0 0% 100%;
--secondary: 170 30% 92%;      /* Teal mist */
--muted: 160 12% 93%;
--accent: 38 85% 90%;          /* Warm gold accent (amber tint) */
--accent-foreground: 30 70% 35%;
--border: 160 18% 88%;
--ring: 172 80% 26%;

/* NEW Signature Tokens */
--nk-deep: hsl(172 80% 18%);          /* Header, sidebar active indicator */
--nk-teal-mid: hsl(172 72% 38%);      /* Primary button, active state */
--nk-teal-light: hsl(172 60% 55%);    /* Icon accent, hover glow */
--nk-gold: hsl(38 85% 52%);           /* Gold accent untuk badge/highlight */
--nk-surface-1: hsl(160 15% 96%);     /* Page background */
--nk-surface-2: hsl(0 0% 100%);       /* Card background */
--nk-surface-3: hsl(160 12% 93%);     /* Muted / table row hover */
--nk-glass: rgba(255, 255, 255, 0.75);
--nk-glass-border: rgba(13, 107, 98, 0.12);
--nk-shadow-sm: 0 2px 8px -2px rgba(13, 107, 98, 0.08);
--nk-shadow-md: 0 8px 32px -8px rgba(13, 107, 98, 0.14);
--nk-shadow-lg: 0 20px 60px -15px rgba(13, 107, 98, 0.2);
--nk-editorial-line: 3px;             /* Lebar "teal line" identitas */

/* Dark Mode */
--background: 192 60% 4%;      /* Deep ocean — lebih premium dari sebelumnya */
--card: 192 50% 7%;
--primary: 172 60% 50%;        /* Lebih terang di dark mode */
--nk-glass: rgba(5, 20, 22, 0.8);
--nk-glass-border: rgba(255, 255, 255, 0.06);
```

---

## Rencana Implementasi per Fase

---

### FASE 1 — Fondasi: CSS Tokens & Global Styles
**File: [`natakarya.css`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/natakarya.css)**

**Perubahan:**
- Ganti seluruh CSS variable dengan palet "Sovereign Teal" baru
- Tambah signature tokens: `--nk-deep`, `--nk-gold`, `--nk-surface-*`, `--nk-shadow-*`
- Tambah utility classes: `.nk-card`, `.nk-editorial-line`, `.nk-glass-card`, `.nk-badge-gold`, `.nk-section-title`
- Tambah `@keyframes` premium: `nk-shimmer`, `nk-glow-pulse`, `nk-float`
- Perbarui scrollbar lebih refined
- Tambah `::selection` color branded

**Dampak**: Seluruh tampilan Natakarya langsung berubah secara pasif karena CSS variables ter-inherit.

---

### FASE 2 — Shell: Layout, Header & Navigation

#### [MODIFY] [`layout.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/layout.tsx)
- **Header**: Tinggi dari `h-16` ke `h-[60px]`, tambah subtle left-border teal, glassmorphism lebih kuat
- **Bell icon**: Ganti dengan animasi `nk-glow-pulse` saat ada notif
- **Avatar button**: Upgrade ke pill-shaped dengan ring teal + nama jabatan mini
- **Breadcrumb**: Gaya lebih editorial, separator berupa titik teal
- **Footer**: Tambah ornamental line gradient

#### [MODIFY] [`Sidebar.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/components/Sidebar.tsx)
- **Active indicator**: Dari `bg-accent rounded-xl` → solid teal left-border `w-1 h-8 bg-nk-deep rounded-r-full`  
- **Icon active state**: Dari `text-primary` → icon dalam lingkaran teal solid kecil
- **Bottom avatar**: Upgrade dengan `ring-2 ring-nk-teal-mid` + subtle glow saat hover
- **Sidebar width**: Tetap `w-20` (UX tidak berubah)
- **Animasi**: Tambah `whileHover` lebih responsif pada setiap icon

#### [MODIFY] [`MegaMenuPanel.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/components/MegaMenuPanel.tsx)
- **Header panel**: Tambah gradient sweep dari teal ke transparent
- **Item hover**: Tambah left teal border pada hover state (editorial style)
- **Active item**: Background dari `primary/10` → solid teal fill dengan teks putih
- **Section icon**: Animasi bounce saat panel pertama terbuka

#### [MODIFY] [`BottomNavBar.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/components/BottomNavBar.tsx)
- **Active indicator**: Bottom indicator `h-1` menjadi `h-0.5` dengan shadow glow lebih kuat
- **Background**: Glassmorphism lebih pekat, border-top dengan warna teal
- **Badge notif**: Ganti amber ke gold teal yang lebih on-brand

---

### FASE 3 — Dashboard Home (page.tsx)

#### [MODIFY] [`page.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/page.tsx)
- **Card wrapper**: Ganti `rounded-2xl` → tambah class `.nk-card` yang punya editorial left-line
- **Tabel agenda**: Tambah header teal solid, row hover dengan left border teal
- **Empty state**: Upgrade ilustrasi empty state menjadi lebih premium

#### [MODIFY] [`SmartGreeting.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/components/home/SmartGreeting.tsx)
- **Background greeting**: Dari icon polos → gradient pill container
- **Nama user**: Tetap gradient, tapi pakai `--nk-teal-mid` → `--nk-gold`
- **Animasi**: Tambah `nk-float` subtle pada icon

#### [MODIFY] [`QuickAccessCard.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/components/home/QuickAccessCard.tsx)
- **Desain ulang total**: Hapus `SpotlightCard` generic → gunakan custom card dengan:
  - Top border teal tipis
  - Icon dalam container square teal-tinted
  - Hover: card naik + teal shadow glow
  - Tidak lagi bergantung pada `colorClass` generic Tailwind

---

### FASE 4 — Halaman Turunan (Pages)

> **Strategi**: Buat utility CSS classes di `natakarya.css` yang cukup deklaratif, lalu update komponen-komponen berulang di setiap halaman secara batch.

Halaman yang perlu refactor (prioritas):

#### 🔴 Prioritas Tinggi (sering diakses):
| Halaman | File | Komponen Target |
|---|---|---|
| Kotak Masuk Surat | [`(main)/surat/page.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/(main)/surat/page.tsx) | Tabel surat, badge status, tab filter |
| Tugas Saya | [`(main)/tugas/page.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/(main)/tugas) | Card tugas, progress bar, badge prioritas |
| Logbook Harian | [`(main)/logbook/page.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/(main)/logbook) | Card logbook, timeline entry |
| Ruang Kerja | [`(main)/ruang-kerja/page.tsx`](file:///d:/DENY/project/ruang-sigap-v2/src/app/dashboard/natakarya/(main)/ruang-kerja) | Widget statistik, panel kerja |

#### 🟡 Prioritas Menengah:
| Halaman | File |
|---|---|
| Arsip Surat | `(main)/arsip` |
| Jadwal Internal | `(main)/jadwal` |
| Notulensi | `(fungsional)/notulensi` |
| Bukti E-Kinerja | `(main)/bukti-kinerja` |
| Profil | `(main)/profil` |

#### 🟢 Prioritas Rendah (jarang diakses):
- Admin pages: `(admin)/users`, `(admin)/opd`, dll
- `(fungsional)/aset`, `(fungsional)/keuangan`

**Perubahan umum yang diterapkan di setiap halaman:**
1. **Page header** (`<h1>` + subtitle) → gunakan class `.nk-section-title` dengan teal accent line
2. **Cards** → tambah `.nk-card` class (left border teal 3px, shadow-sm)
3. **Badge status** → override warna dengan token natakarya, bukan Tailwind random
4. **Table headers** → uppercase tracking-wider + teal bottom border
5. **Empty states** → ilustrasi dengan nk-gradient circle
6. **Buttons** → primary button lebih bold, gradient teal
7. **Tabs** → active tab dengan teal underline bukan background fill

---

### FASE 5 — Micro-Animations & Motion System

**Filosofi**: Animasi harus terasa **intentional dan restraint** — bukan mencolok, tapi terasa "alive".

#### Motion Tokens yang Diterapkan Konsisten:
```typescript
// src/lib/nk-motion.ts (baru)
export const nkTransition = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  normal: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
  slow: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  spring: { type: "spring", stiffness: 350, damping: 30 },
  springBounce: { type: "spring", stiffness: 300, damping: 20 },
}

export const nkVariants = {
  fadeInUp: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 }
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -12 },
    visible: { opacity: 1, x: 0 }
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  },
  stagger: {
    visible: { transition: { staggerChildren: 0.05 } }
  }
}
```

#### Target Animasi Baru:
- **Card hover**: `y: -2` + teal shadow glow (lebih subtle dari sebelumnya `-4`)
- **Page enter**: `fadeInUp` konsisten di semua halaman
- **Tab switch**: `AnimatePresence` mode="wait" + slide horizontal
- **Sidebar icon hover**: Scale 1.1 + teal glow behind icon
- **Notification badge**: Lebih subtle ping, warna gold
- **Button press**: Scale 0.97 (micro-press feedback)

---

### FASE 6 — Komponen Shared Premium (opsional tapi impactful)

#### [NEW] `NkPageHeader` component
Komponen standar untuk header semua halaman:
```tsx
<NkPageHeader 
  title="Kotak Masuk Surat"
  subtitle="X surat belum dibaca"
  icon={Inbox}
  actions={<Button>...</Button>}
/>
```
Dengan visual: teal editorial line di kiri, icon dalam container teal, typografi konsisten.

#### [NEW] `NkStatCard` component  
Upgrade dari `StatCard.tsx` generic:
- Angka besar dengan `tabular-nums` font
- Subtle trend arrow
- Teal accent line di atas
- Glassmorphism ringan

#### [MODIFY] `PageTransition.tsx`
- Loading overlay: Ganti `Loader2` generic → animasi logo/orb custom berbentuk lingkaran teal pulsating

---

## Verifikasi Plan

> [!IMPORTANT]
> Semua perubahan adalah **CSS/Styling only**. Tidak ada perubahan pada:
> - Logic data fetching / hooks
> - Routing atau navigasi
> - Form validation / action handlers
> - Firestore calls atau API
> - Props atau interface TypeScript

### Urutan Eksekusi yang Aman:
1. **Fase 1 dulu** → langsung bisa dilihat dampaknya secara global
2. **Fase 2** → Shell components (layout, sidebar, mega menu)
3. **Fase 3** → Dashboard home
4. **Fase 4** → Halaman per halaman, mulai prioritas tinggi
5. **Fase 5 & 6** → Polish dan motion system

### Manual Verification:
- Buka `localhost:3000/dashboard` (natakarya tenant)
- Cek light & dark mode
- Cek mobile (BottomNavBar, MobileMenuSheet)
- Bandingkan tampilan dengan Sigap — harus terasa berbeda secara karakter

---

## Open Questions

> [!IMPORTANT]
> Sebelum eksekusi, mohon konfirmasi poin-poin berikut:

1. **Scope fase awal**: Apakah mulai dari **Fase 1+2+3** dulu (CSS global + Shell + Home), lalu lanjut ke halaman-halaman? Atau langsung semua fase sekaligus?

2. **Gold accent**: Apakah Anda setuju dengan penambahan **gold/khaki accent** sebagai warna secondary yang membedakan Natakarya? Ini yang paling membedakan dari Sigap yang monokrom.

3. **Editorial left-line**: Apakah konsep "setiap card punya garis tipis teal di kiri" disetujui? Ini signature Natakarya yang akan sangat konsisten.

4. **`nk-motion.ts`**: Apakah perlu dibuat file constants motion terpisah, atau langsung inline di setiap komponen?

5. **Halaman Admin** `(admin)/`: Apakah halaman admin juga perlu di-rebrand, atau hanya halaman user-facing `(main)` dan `(fungsional)` saja?

