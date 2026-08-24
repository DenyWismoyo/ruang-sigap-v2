# Standarisasi UI Mobile: Zero Nested Box & Borderless Elegant (RUANG SIGAP)

Dokumen ini mendefinisikan guardrail mutlak untuk tampilan mobile di seluruh halaman SIGAP dan POROS. Tujuan: tampilan **bersih, lapang, konsisten seperti aplikasi enterprise kelas dunia** — tanpa visual clutter "kotak di dalam kotak".

---

## 1. 🚫 DILARANG KERAS: Nested Card di Mobile

**Aturan terpenting:** Pada viewport `< 768px`, **dilarang keras** menempatkan komponen `Card` / `.sg-card` / `.nk-card` di dalam komponen `Card` lainnya.

Ini adalah penyebab utama tampilan ponsel terasa berat, berlapis, dan tidak elegan.

**❌ DILARANG — Card di dalam Card (Mobile Clutter):**
```tsx
// Tampilan akan terasa menumpuk dan berat di mobile!
<div className="sg-card p-4">
  <h2>Daftar Surat</h2>
  {suratList.map(s => (
    <div key={s.id} className="sg-card mt-2 p-3"> {/* ❌ Card dalam Card! */}
      <p>{s.perihal}</p>
    </div>
  ))}
</div>
```

**✅ WAJIB — Feed Borderless di Mobile, Card di Desktop:**
```tsx
// Mobile: flat borderless list. Desktop: card dengan shadow
<div className="space-y-0 md:space-y-3">
  {suratList.map(s => (
    <div key={s.id} className="sg-list-card p-3 md:p-4">
      {/* ✅ sg-list-card sudah borderless di mobile, card di desktop */}
      <p>{s.perihal}</p>
    </div>
  ))}
</div>
```

---

## 2. 📐 Kelas Standar Borderless Per Tenant

### SIGAP — Kelas yang Sudah Ada di `sigap.css`

| Kelas | Perilaku Mobile (`< 768px`) | Perilaku Desktop (`≥ 768px`) |
|-------|--------------------------|--------------------------|
| `.sg-mobile-borderless` | `border-x-0 border-t-0 rounded-none shadow-none` | `border border-border/40 rounded-[var(--radius)] shadow-sm` |
| `.sg-list-card` | Borderless feed + left accent line 3px | Card penuh dengan shadow hover |
| `.sigap-full-bleed-mobile` | `-mx-3 px-3` (melebar ke tepi layar) | `mx-0 px-0` (normal) |
| `.sg-page` | `pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]` | `pb-6` |
| `.sigap-scrollable` | `overflow-y: auto; -webkit-overflow-scrolling: touch; padding-bottom: var(--bottom-nav-height)` | Normal |

### POROS — Kelas yang Sudah Ada di `poros.css`

| Kelas | Perilaku Mobile (`< 768px`) | Perilaku Desktop (`≥ 768px`) |
|-------|--------------------------|--------------------------|
| `.poros-full-bleed-mobile` | `-mx-4 px-4` | `mx-0 px-0` |
| `.poros-scrollable` | `overflow-y: auto; padding-bottom: var(--bottom-nav-height)` | Normal |
| `.nk-card` | Card standard dengan shadow teal | Sama + lift on hover |

> **⚠️ Gap:** POROS belum punya `.nk-mobile-borderless`. Gunakan utility Tailwind langsung:
> ```tsx
> className="border-x-0 border-t-0 rounded-none shadow-none md:border md:rounded-[var(--radius)] md:shadow-sm"
> ```

---

## 3. 📦 Wajib: Wrapper Halaman Standar

Setiap halaman di dashboard **WAJIB** menggunakan wrapper yang menjamin clearance bottom navigation:

### SIGAP
```tsx
// ✅ Gunakan class .sg-page (sudah termasuk pb safe area + animate-in)
<div className="sg-page space-y-4 px-4 md:px-0">
  <SigapPageHeader title="Judul" icon={Icon} description="..." />
  {/* Konten halaman */}
</div>
```

### POROS
```tsx
// ✅ Gunakan var(--bottom-nav-height) dari poros.css
<div className="poros-scrollable space-y-4 px-4 md:px-0">
  {/* Konten halaman */}
</div>
```

**CSS Variable yang harus dipakai (JANGAN hardcode pixel):**
- `--header-height: 56px` — Tersedia di keduanya
- `--bottom-nav-height: calc(60px + env(safe-area-inset-bottom, 0px))` — Tersedia di keduanya

---

## 4. 📱 Matriks Tipografi Responsif (Wajib Dipatuhi)

| Elemen | Mobile Class | Desktop Class | Gabungan |
|--------|-------------|--------------|---------|
| Judul Halaman | `text-xl font-bold` | `text-3xl font-bold` | `text-xl md:text-3xl font-bold` |
| Judul Seksi | `text-base font-bold` | `text-xl font-bold` | `text-base md:text-xl font-bold` |
| Judul Item/Surat | `text-sm font-semibold` | `text-base font-semibold` | `text-sm md:text-base font-semibold` |
| Teks Body/Deskripsi | `text-xs` | `text-sm` | `text-xs md:text-sm text-muted-foreground` |
| Label/Tag/Timestamp | `text-[10px]` | `text-xs` | `text-[10px] md:text-xs tracking-wider uppercase` |

**❌ DILARANG:** `text-5xl` atau lebih besar untuk kalimat panjang di mobile.

---

## 5. 👆 Touch Target & Spacing

- **Tombol aksi utama di mobile**: `h-10 px-4 text-sm` (min 40px height — standar WCAG AA)
- **Tombol aksi sekunder / kompak**: `h-9 px-3 text-xs`
- **Ikon inline metadata**: `size-3.5` (14px) atau `size-4` (16px)
- **Jarak antar item feed**: `space-y-0` (borderless, tanpa jarak) atau `space-y-px` (pemisah 1px)
- **Padding horizontal halaman**: `px-3 md:px-0` untuk konten, `px-4 md:px-0` untuk POROS

---

## 6. 🎨 Animasi Page Mobile

Setiap halaman yang baru dimuat **HARUS** memiliki animasi masuk yang halus:

### SIGAP
```tsx
// Gunakan class sg-page yang sudah termasuk animasi:
// animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out
<div className="sg-page ...">
```

Atau untuk elemen individual:
```tsx
<div className="sg-animate-in sg-stagger-1">Item pertama</div>
<div className="sg-animate-in sg-stagger-2">Item kedua</div>
```

### POROS
```tsx
// Gunakan animate-nk-shimmer untuk skeleton, animate-nk-float untuk elemen dekoratif
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
```

---

## 7. 🚫 Checklist Anti-Pattern Mobile

Sebelum mengimplementasikan UI mobile, pastikan TIDAK ada hal berikut:

| Anti-Pattern | Dampak | Solusi |
|-------------|--------|--------|
| `<Card>` di dalam `<Card>` | Visual menumpuk berat | Gunakan `.sg-list-card` / borderless list |
| Padding horizontal besar `px-6 md:px-6` | Konten terasa sempit | Gunakan `px-3 md:px-4` atau `px-0` |
| `absolute -left-4` tanpa `overflow-hidden` di induk | Elemen terpotong di tepi | Gunakan margin positif atau `w-[calc(100%-...)]` |
| Bottom padding tanpa safe-area | Tertutup nav bar | Gunakan `pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]` |
| `text-5xl` untuk judul panjang di mobile | Overflow teks | Batasi `text-3xl` di mobile |
| Shadow berlapis (`shadow-lg` + child `shadow-md`) | Visual berat | Pilih satu layer yang memiliki shadow |
| Border di setiap sisi di mobile | Kotak dalam kotak | Gunakan hanya `border-b` untuk separator |
