---
name: sigap-mobile-ux-standards
description: Panduan teknis lengkap standarisasi tampilan mobile pada platform RUANG SIGAP & POROS: borderless feed, safe-area padding, tipografi responsif, animasi page transition, dan pola layout tanpa nested card. Gunakan saat membuat atau merefactor tampilan halaman yang perlu optimal di ponsel.
---

# Mobile UX Standards — RUANG SIGAP & POROS

Panduan ini mendefinisikan **template dan class CSS nyata** untuk membuat tampilan mobile yang elegan, konsisten, dan tidak memiliki visual clutter "kotak dalam kotak".

---

## 🎯 Filosofi Inti

> **"Flat content, rich context."**
> Di mobile, konten berbicara langsung — tanpa pembungkus yang menumpuk. Gunakan separator tipis (border-b 1px) dan left accent line sebagai pembeda visual, bukan card berlapis.

---

## 📐 Template Halaman Lengkap

### Template SIGAP Mobile-First Page

```tsx
// ✅ Template standar halaman SIGAP yang benar
'use client';

export default function HalamanContoh() {
  return (
    // sg-page: animate-in + pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-6
    <div className="sg-page space-y-0 md:space-y-4">
      
      {/* Header — sg-page-header: flex-col di mobile, flex-row di desktop */}
      <div className="sg-page-header">
        <div>
          {/* sg-page-title: text-xl md:text-3xl + sg-editorial-title (left blue line) */}
          <h1 className="sg-page-title">
            <Icon className="mr-2 size-5 text-blue-600 hidden md:inline" />
            Judul Halaman
          </h1>
          {/* sg-page-subtitle: text-xs md:text-sm text-muted-foreground */}
          <p className="sg-page-subtitle">Deskripsi singkat modul ini.</p>
        </div>
        {/* sg-page-actions: flex + space-x, full width di mobile */}
        <div className="sg-page-actions">
          <Button size="sm" className="sg-btn sg-btn-primary h-9 md:h-10">
            <Plus className="mr-1.5 size-3.5" /> Tambah
          </Button>
        </div>
      </div>

      {/* Filter Bar — sg-filter-bar: bg-card, borderless di mobile */}
      <div className="sg-filter-bar">
        <div className="sg-search-input">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input className="w-full pl-9 h-9 bg-muted/50 rounded-[var(--radius)] text-sm" placeholder="Cari..." />
        </div>
      </div>

      {/* Feed List — BUKAN Card, tapi flat borderless items */}
      <div className="divide-y divide-border/30 md:divide-y-0 md:space-y-3">
        {items.map((item, i) => (
          // sg-list-card: borderless di mobile, card di desktop
          <div key={item.id} className={`sg-list-card sg-animate-in sg-stagger-${Math.min(i + 1, 4)} p-3 md:p-4`}>
            <p className="text-sm md:text-base font-semibold">{item.judul}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{item.tanggal}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
```

### Template POROS Mobile-First Page

```tsx
// ✅ Template standar halaman POROS yang benar
'use client';

export default function HalamanPorosContoh() {
  return (
    // poros-scrollable: overflow-y auto + padding-bottom var(--bottom-nav-height)
    <div className="poros-scrollable space-y-0 md:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header POROS */}
      <div className="px-4 md:px-0 py-4 md:py-6">
        <h1 className="nk-section-title text-xl md:text-3xl">
          {/* nk-section-title: pl-4 + ::before gold line */}
          Judul Halaman
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1 pl-4">Deskripsi modul.</p>
      </div>

      {/* Feed List POROS — flat borderless di mobile */}
      <div className="divide-y divide-border/20 md:divide-y-0 md:space-y-3 px-0 md:px-0">
        {items.map((item) => (
          // nk-card sudah ada shadow teal dan hover lift
          // Di mobile: gunakan pola borderless langsung
          <div
            key={item.id}
            className="
              border-x-0 border-t-0 rounded-none shadow-none bg-card
              md:nk-card md:rounded-[var(--radius)]
              p-3 md:p-4 border-b border-border/20
            "
          >
            <p className="text-sm md:text-base font-semibold text-foreground">{item.judul}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{item.tanggal}</p>
          </div>
        ))}
      </div>

    </div>
  );
}
```

---

## 🎨 Referensi Class CSS Lengkap

### SIGAP (`[data-tenant="sigap"]`)

**Layout & Wrapper:**
| Class | Efek |
|-------|------|
| `.sg-page` | `animate-in fade-in slide-in-from-bottom-4 duration-500 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-6` |
| `.sg-page-header` | `mb-4 md:mb-6 px-4 md:px-0 flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4` |
| `.sg-page-title` | `text-xl md:text-3xl font-bold text-foreground` + left blue editorial line |
| `.sg-page-subtitle` | `text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1` |
| `.sg-page-actions` | `flex items-center space-x-2 md:space-x-4 flex-shrink-0 w-full md:w-auto` |

**Card & List:**
| Class | Efek |
|-------|------|
| `.sg-mobile-borderless` | `border-x-0 border-t-0 rounded-none shadow-none` → desktop: `border rounded shadow-sm` |
| `.sg-list-card` | Borderless feed + left accent line 3px di mobile, card penuh di desktop |
| `.sg-card` | Card standard: `bg-card border border-border/80 shadow-sm rounded-[var(--radius)]` |
| `.sg-glass-panel` | `bg-background/80 backdrop-blur-2xl border border-border/30 shadow-sm md:shadow-md` |

**Filter & Table:**
| Class | Efek |
|-------|------|
| `.sg-filter-bar` | `mb-4 flex flex-col sm:flex-row gap-2.5 p-3 bg-card` + `.sg-mobile-borderless` |
| `.sg-table-wrapper` | `overflow-hidden rounded-[var(--radius)] border border-border/40 bg-card shadow-sm` |
| `.sg-table-row` | `bg-card border-b border-border/50 hover:bg-muted/30 transition-colors` |

**Animasi:**
| Class | Efek |
|-------|------|
| `.sg-animate-in` | `animation: sg-slide-up 0.35s ease-out forwards` (fade + translateY dari +12px) |
| `.sg-stagger-1/2/3/4` | Delay 50ms / 100ms / 150ms / 200ms |
| `.sg-slide-in-right` | `animation: sg-slide-in-right 0.4s cubic-bezier(0.16,1,0.3,1)` (dari +30px kanan) |
| `.sg-zoom-in` | `animation: sg-zoom-in 0.3s` (scale 0.95 → 1) |
| `.sg-hover-lift` | `transform: translateY(-2px) scale(1.005)` + shadow saat hover |
| `.sg-active-scale` | `active:scale-95 transition-transform duration-150` |

**Status Badge:**
| Class | Status |
|-------|--------|
| `.sg-badge-new` | Merah — Baru/Belum Dibaca |
| `.sg-badge-process` | Orange — Sedang Diproses |
| `.sg-badge-done` | Hijau — Selesai |
| `.sg-badge-archived` | Abu — Diarsipkan |

---

### POROS (`[data-tenant="poros"]`)

**Layout & Wrapper:**
| Class | Efek |
|-------|------|
| `.poros-scrollable` | `overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: var(--bottom-nav-height)` |
| `.poros-full-bleed-mobile` | `-mx-4 px-4 md:mx-0 md:px-0` |
| `.nk-section-title` | `relative pl-4 font-semibold text-2xl` + `::before` gold line kiri |

**Card & Glass:**
| Class | Efek |
|-------|------|
| `.nk-card` | `bg-card rounded-[var(--radius)] border border-border shadow-[var(--nk-shadow-sm)]` + hover lift + left teal line on hover |
| `.nk-glass-panel` | `bg-[var(--nk-glass)] backdrop-blur-[12px] border border-[var(--nk-glass-border)]` |
| `.nk-glass-button` | Glass effect button dengan hover subtle |

**Table:**
| Class | Efek |
|-------|------|
| `.nk-table-wrapper` | `overflow-hidden rounded-lg border border-[var(--nk-glass-border)] bg-[var(--nk-surface-2)] shadow-sm` |
| `.nk-table th` | `bg-[var(--nk-surface-1)] text-xs uppercase tracking-wider` |

**Animasi:**
| Class | Efek |
|-------|------|
| `.animate-nk-shimmer` | Shimmer loading 8s loop |
| `.animate-nk-glow-pulse` | Glow pulse teal 2s |
| `.animate-nk-float` | Float up-down 4s |

---

## 📏 Spacing & Safe Area Reference

```css
/* Dari sigap.css dan poros.css */
--header-height: 56px;
--bottom-nav-height: calc(60px + env(safe-area-inset-bottom, 0px));

/* Padding bottom wajib untuk clearance bottom navigation */
pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-6

/* Atau gunakan CSS variable */
padding-bottom: var(--bottom-nav-height);
```

---

## 🚦 Kapan Gunakan Apa

| Kebutuhan | SIGAP | POROS |
|-----------|-------|-------|
| Daftar item feed | `.sg-list-card` | `border-x-0 border-t-0 rounded-none md:nk-card` |
| Card konten biasa | `.sg-card` | `.nk-card` |
| Card borderless mobile | `.sg-mobile-borderless` | `border-x-0 border-t-0 rounded-none shadow-none md:...` |
| Glass overlay/header | `.sg-glass` | `.nk-glass-panel` |
| Loading skeleton | `.sg-shimmer` | `.animate-nk-shimmer` |
| Judul halaman | `.sg-page-title` (blue left line) | `.nk-section-title` (gold left line) |
| Tabel data | `.sg-table-wrapper` + `.sg-table-row` | `.nk-table-wrapper` + `.nk-table` |
