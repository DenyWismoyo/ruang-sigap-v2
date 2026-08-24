---
name: sigap-poros-component-catalog
description: Katalog komponen shared (src/components/ui/) yang aman digunakan di kedua tenant SIGAP dan POROS tanpa konflik token CSS. Mendefinisikan aturan komponen shared vs komponen tenant-spesifik, dan pola penggunaan yang benar.
---

# Katalog Komponen Bersama — SIGAP & POROS

Dokumen ini mendefinisikan **mana komponen yang aman digunakan di kedua tenant**, cara menggunakannya tanpa konflik CSS token, dan komponen mana yang HANYA boleh digunakan di tenant tertentu.

---

## 🏗️ Arsitektur Lapisan Komponen

```
src/components/
├── ui/                     ← Layer 1: Primitif Shadcn (AMAN di kedua tenant)
│   ├── button.tsx
│   ├── badge.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── table.tsx
│   ├── card.tsx
│   ├── tabs.tsx
│   ├── sheet.tsx
│   └── ...
│
├── AnimatedCounter.tsx     ← Layer 2: Komponen Global (Boleh multi-tenant)
├── AreaChart.tsx
├── DomainBanner.tsx
├── GlassPanel.tsx
├── InstallPwaButton.tsx
├── MarketingCarousel.tsx
├── OfflineSyncManager.tsx
├── ServiceWorkerReset.tsx
├── SpotlightCard.tsx
├── StatCard.tsx
├── StatusBadge.tsx
└── ToastContainer.tsx

src/app/dashboard/sigap/components/  ← Layer 3: Komponen SIGAP-ONLY
src/app/dashboard/poros/components/  ← Layer 3: Komponen POROS-ONLY
```

---

## ✅ Layer 1: Komponen Shadcn UI (AMAN di Kedua Tenant)

Komponen di `src/components/ui/` menggunakan **CSS variables Shadcn standard** (`bg-card`, `text-foreground`, `border-border`, dll.) yang nilainya otomatis beradaptasi dengan tenant aktif via `data-tenant="sigap"` atau `data-tenant="poros"`.

### Aturan WAJIB untuk Komponen Shared
```
✅ BOLEH: bg-card, text-foreground, text-muted-foreground, border-border, 
          bg-background, bg-muted, bg-primary, text-primary-foreground,
          bg-secondary, text-secondary-foreground, bg-accent, text-accent-foreground,
          bg-destructive, text-destructive-foreground, ring-ring
          
❌ DILARANG: --sg-blue, --sg-surface-*, --sg-shadow-*, --sg-glass
❌ DILARANG: --nk-gradient-start, --nk-teal-*, --nk-gold, --nk-shadow-*, --nk-glass
```

### Komponen Primitif & Cara Penggunaannya

#### `<Button>` — Multi-tenant Safe
```tsx
import { Button } from '@/components/ui/button';

// ✅ Semua variant sudah adapt ke tema tenant
<Button variant="default">Simpan</Button>         // bg-primary (biru di SIGAP, teal di POROS)
<Button variant="outline">Batal</Button>           // border-border, text-foreground
<Button variant="destructive">Hapus</Button>       // bg-destructive
<Button variant="ghost">Lebih Lanjut</Button>      // hover:bg-accent
<Button variant="secondary">Filter</Button>        // bg-secondary

// ✅ Size
<Button size="sm">Aksi</Button>    // h-9 px-3
<Button size="default">Aksi</Button>   // h-10 px-4
<Button size="lg">Aksi</Button>    // h-11 px-8
<Button size="icon"><Icon /></Button>  // h-10 w-10

// ⚠️ Jika perlu warna brand spesifik tenant, gunakan className override:
// SIGAP → tambahkan className="bg-blue-600 hover:bg-blue-700 text-white"
// POROS → tambahkan className="bg-[var(--nk-teal-mid)] hover:bg-[var(--nk-deep)] text-white"
```

#### `<Badge>` — Multi-tenant Safe
```tsx
import { Badge } from '@/components/ui/badge';

<Badge variant="default">Status</Badge>       // bg-primary
<Badge variant="secondary">Info</Badge>       // bg-secondary
<Badge variant="outline">Label</Badge>        // border-border
<Badge variant="destructive">Error</Badge>    // bg-destructive

// Status surat — gunakan class dari tenant CSS untuk warna yang tepat
// SIGAP: <Badge className="sg-badge-new">Baru</Badge>
// POROS: <Badge className="bg-amber-500/10 text-amber-600 border border-amber-500/20">Baru</Badge>
```

#### `<Dialog>` & `<Sheet>` — Multi-tenant Safe
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

// ✅ Dialog content menggunakan bg-card yang otomatis adapt
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Judul Dialog</DialogTitle>
    </DialogHeader>
    {/* Konten */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
      <Button onClick={handleSave}>Simpan</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### `<Table>` — Multi-tenant Safe (Gunakan wrapper tenant)
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// ✅ Bungkus dengan wrapper tenant yang sesuai
// SIGAP:
<div className="sg-table-wrapper">
  <Table>
    <TableHeader className="sg-table-head">
      <TableRow><TableHead>Kolom</TableHead></TableRow>
    </TableHeader>
    <TableBody>
      <TableRow className="sg-table-row">
        <TableCell className="sg-table-cell">Data</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>

// POROS:
<div className="nk-table-wrapper">
  <table className="nk-table">
    <thead><tr><th>Kolom</th></tr></thead>
    <tbody><tr><td>Data</td></tr></tbody>
  </table>
</div>
```

#### `<Input>` & `<Select>` — Multi-tenant Safe
```tsx
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ✅ Menggunakan border-input dan bg-background — adapt otomatis
<Input placeholder="Cari surat..." className="h-9 text-sm" />

<Select>
  <SelectTrigger className="h-9 text-sm">
    <SelectValue placeholder="Pilih status" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="baru">Baru</SelectItem>
    <SelectItem value="selesai">Selesai</SelectItem>
  </SelectContent>
</Select>
```

---

## ✅ Layer 2: Komponen Global (`src/components/`)

Komponen-komponen ini sudah didesain multi-tenant dan AMAN digunakan di kedua dashboard:

| Komponen | Kegunaan | Import |
|----------|----------|--------|
| `StatCard` | Kartu statistik KPI (angka besar + label) | `@/components/StatCard` |
| `StatusBadge` | Badge status surat/tugas yang adapt tenant | `@/components/StatusBadge` |
| `AnimatedCounter` | Angka yang animasi saat masuk viewport | `@/components/AnimatedCounter` |
| `AreaChart` | Grafik area untuk laporan | `@/components/AreaChart` |
| `GlassPanel` | Panel glass yang adapt tenant | `@/components/GlassPanel` |
| `ToastContainer` | Container notifikasi toast | `@/components/ToastContainer` |
| `InstallPwaButton` | Tombol install PWA | `@/components/InstallPwaButton` |
| `OfflineSyncManager` | Banner offline + sync queue | `@/components/OfflineSyncManager` |

---

## 🚫 Layer 3: Komponen Tenant-Spesifik (DILARANG Cross-Use)

Komponen di folder tenant **DILARANG** diimpor oleh tenant lain:

```
❌ DILARANG: import komponen dari sigap/components/ ke dalam poros/
❌ DILARANG: import komponen dari poros/components/ ke dalam sigap/
❌ DILARANG: menaruh komponen tenant-spesifik di src/components/ui/
```

### Komponen SIGAP-Only (`src/app/dashboard/sigap/components/`)
- `SigapPageHeader` — Header dengan sg-editorial-title (blue left line)
- `SigapNavbar` / Bottom Navigation SIGAP
- Komponen layout sigap lainnya

### Komponen POROS-Only (`src/app/dashboard/poros/components/`)
- `PorosPageHeader` — Header dengan nk-section-title (gold left line)
- `PorosNavbar` / Bottom Navigation POROS
- Komponen layout poros lainnya

---

## 🎨 Pola Header Halaman Per Tenant

### SIGAP — `SigapPageHeader`
```tsx
import SigapPageHeader from '@/app/dashboard/sigap/components/SigapPageHeader';
import { FileText } from 'lucide-react';

<SigapPageHeader
  title="Surat Masuk"
  icon={FileText}
  description="Kelola surat masuk dan disposisi."
  actions={
    <Button size="sm" className="sg-btn sg-btn-primary">
      <Plus className="mr-1.5 size-3.5" /> Tambah
    </Button>
  }
/>
```

### POROS — Pola Manual (pakai nk-section-title)
```tsx
// Gunakan pola langsung karena POROS header lebih fleksibel
<div className="px-4 md:px-0 mb-6">
  <h1 className="nk-section-title">Surat Masuk</h1>
  <p className="text-xs md:text-sm text-muted-foreground mt-1 pl-4">
    Kelola surat masuk dan disposisi.
  </p>
</div>
```

---

## 📋 Quick Reference: Mana yang Digunakan?

| Kebutuhan | Komponen/Class | Tenant |
|-----------|---------------|--------|
| Tombol aksi utama | `<Button>` + `className="sg-btn sg-btn-primary"` | SIGAP |
| Tombol aksi utama | `<Button>` + `className="bg-[var(--nk-teal-mid)] text-white"` | POROS |
| Card konten | `<div className="sg-card">` | SIGAP |
| Card konten | `<div className="nk-card">` | POROS |
| Card borderless mobile | `<div className="sg-mobile-borderless">` | SIGAP |
| Card borderless mobile | `<div className="border-x-0 border-t-0 rounded-none shadow-none md:nk-card">` | POROS |
| Header halaman | `<SigapPageHeader>` | SIGAP |
| Header halaman | `<h1 className="nk-section-title">` | POROS |
| Badge status | `<Badge className="sg-badge-new">` | SIGAP |
| Badge status | `<Badge className="bg-amber-500/10 text-amber-600">` | POROS |
| Loading skeleton | `<div className="sg-shimmer">` | SIGAP |
| Loading skeleton | `<div className="animate-nk-shimmer">` | POROS |
| Empty state | `<div className="sg-empty-state">` | SIGAP |
| Tabel data | `.sg-table-wrapper` + `.sg-table-row` | SIGAP |
| Tabel data | `.nk-table-wrapper` + `.nk-table` | POROS |
