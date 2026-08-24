# Standarisasi Performa & Code Splitting (RUANG SIGAP)

Dokumen ini mendefinisikan guardrail mutlak untuk menjaga First Contentful Paint (FCP) tetap cepat dan Total Blocking Time (TBT) = 0 di semua halaman RUANG SIGAP.

---

## 1. 🚫 WAJIB: `next/dynamic` untuk Komponen Berat

Komponen yang memuat library besar **WAJIB** dimuat secara lazy menggunakan `next/dynamic`. Jangan pernah import komponen berat secara langsung di halaman.

**Kategori komponen yang WAJIB lazy-load:**

| Kategori | Contoh | Kenapa |
|----------|--------|--------|
| Grafik / Chart | Recharts, Chart.js | Bundle +200KB |
| PDF Viewer | `pdfjs-dist` | Bundle +500KB |
| Rich Text Editor | Tiptap, Quill | Bundle +300KB |
| Export/Print | jsPDF, html2canvas | Bundle +400KB |
| Calendar besar | FullCalendar | Bundle +200KB |
| Showcase/Demo | `InteractiveShowcase`, `WorkflowVisualizer` | Hanya di landing page |

**❌ DILARANG — Import langsung komponen berat:**
```tsx
import AreaChart from '@/components/AreaChart'; // ❌ Langsung import!
import InteractiveShowcase from './InteractiveShowcase'; // ❌
```

**✅ WAJIB — Lazy load dengan `next/dynamic`:**
```tsx
import dynamic from 'next/dynamic';

// ✅ Pola standar dengan skeleton fallback
const AreaChart = dynamic(() => import('@/components/AreaChart'), {
  ssr: false,  // Chart biasanya tidak perlu SSR
  loading: () => <div className="sg-shimmer h-64 w-full rounded-[var(--radius)]" />,
});

const InteractiveShowcase = dynamic(
  () => import('@/components/showcase/InteractiveShowcase'),
  {
    ssr: false,
    loading: () => <div className="sg-shimmer h-96 w-full" />,
  }
);

const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => (
    <div className="sg-shimmer h-[600px] w-full rounded-[var(--radius)]" />
  ),
});
```

---

## 2. 📐 Standar Skeleton Fallback (CLS = 0)

Setiap skeleton fallback **WAJIB** memiliki tinggi eksplisit yang sama dengan komponen aslinya agar tidak terjadi Cumulative Layout Shift:

```tsx
// ✅ Tinggi eksplisit — tidak ada layout shift
<div className="sg-shimmer h-64 w-full rounded-[var(--radius)]" />      // Chart
<div className="sg-shimmer h-[600px] w-full" />                          // PDF Viewer
<div className="sg-shimmer h-24 w-full rounded-[var(--radius)]" />       // Card skeleton

// ❌ DILARANG — tidak ada tinggi (menyebabkan layout shift)
<div className="sg-shimmer w-full" />  // Tinggi = 0 saat loading!
```

**Komponen Skeleton yang Sudah Ada:**
```tsx
// Gunakan komponen skeleton yang sudah ada jika tersedia
import { Skeleton } from '@/components/ui/skeleton';

// Contoh: Skeleton card feed
function RuangKerjaSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3 p-3 border-b border-border/30">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 3. ⚡ Wajib: `useDeferredValue` untuk Filter Realtime

Input pencarian yang memfilter daftar besar **WAJIB** menggunakan `useDeferredValue` atau `useTransition` agar ketikan pengguna tidak pernah terhambat:

```tsx
import { useState, useDeferredValue, useMemo } from 'react';

function DaftarSuratWithSearch({ suratList }: { suratList: SuratMasuk[] }) {
  const [query, setQuery] = useState('');
  
  // ✅ Deferred — render input tetap responsif, filter berjalan di background
  const deferredQuery = useDeferredValue(query);

  const filteredSurat = useMemo(() => {
    if (!deferredQuery) return suratList;
    const lower = deferredQuery.toLowerCase();
    return suratList.filter(s =>
      s.perihal.toLowerCase().includes(lower) ||
      s.nomorSurat.toLowerCase().includes(lower)
    );
  }, [suratList, deferredQuery]);

  return (
    <>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)} // ✅ Update segera (tidak defer)
        placeholder="Cari surat..."
        className="w-full h-9 border border-input rounded-[var(--radius)] px-3 text-sm"
      />
      <div>
        {filteredSurat.map(s => <SuratCard key={s.id} surat={s} />)}
      </div>
    </>
  );
}
```

---

## 4. 🎯 Standar `useMemo` dan `useCallback`

```tsx
// ✅ WAJIB useMemo untuk komputasi dari array besar
const suratBaru = useMemo(
  () => suratList.filter(s => s.statusPenyelesaian === 'Baru'),
  [suratList]
);

// ✅ WAJIB useCallback untuk fungsi yang diteruskan sebagai props
const handleDisposisi = useCallback(async (suratId: string) => {
  await kirimDisposisi(suratId);
}, [kirimDisposisi]);

// ❌ DILARANG — komputasi berat inline di render
return <div>{suratList.filter(s => s.statusPenyelesaian === 'Baru').length}</div>;
```

---

## 5. 🚫 Anti-Pattern Performa yang Dilarang

| Anti-Pattern | Dampak | Solusi |
|-------------|--------|--------|
| Import langsung komponen chart/pdf | Bundle besar, FCP lambat | `next/dynamic` + skeleton |
| Skeleton tanpa tinggi eksplisit | CLS = merusak skor Core Web Vitals | Tambahkan `h-[...]` eksplisit |
| Filter array di JSX render | Input lag / frame drop | `useDeferredValue` + `useMemo` |
| `useEffect` yang fetch di setiap render | Waterfall request | Pindah ke TanStack Query |
| Animasi menggunakan `width`/`height` CSS | Reflow browser mahal | Gunakan `transform` + `opacity` |
| `console.log` banyak di production | Memory leak + performance | Hapus sebelum commit |
