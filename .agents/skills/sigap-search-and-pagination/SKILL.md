---
name: sigap-search-and-pagination
description: Panduan implementasi full-text search via searchKeywords[] array dan cursor-based pagination dengan startAfter() di Firestore pada platform RUANG SIGAP. Gunakan saat membuat fitur pencarian atau daftar dengan infinite scroll/load more.
---

# Search & Pagination — RUANG SIGAP

---

## 🔍 Full-Text Search dengan `searchKeywords[]`

Firestore tidak mendukung `LIKE` query. RUANG SIGAP menggunakan pola **searchKeywords array** — sebuah array string lowercase yang di-generate saat dokumen dibuat.

### Cara Generate Keywords (Backend / Cloud Function)

```typescript
// functions/src/utils/helpers.ts — fungsi ini sudah ada
export function generateSearchKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  const keywords = new Set<string>();
  
  words.forEach(word => {
    // Tambahkan setiap prefix (untuk "search as you type")
    for (let i = 2; i <= word.length; i++) {
      keywords.add(word.substring(0, i));
    }
    keywords.add(word); // Kata penuh
  });
  
  return Array.from(keywords);
}

// Contoh penggunaan saat membuat dokumen baru:
await db.collection('surat').add({
  perihal: 'Undangan Rapat Koordinasi',
  pengirim: 'Badan Kepegawaian Daerah',
  // ...
  searchKeywords: generateSearchKeywords('Undangan Rapat Koordinasi Badan Kepegawaian Daerah'),
});
// Hasil keywords: ['un', 'und', 'unda', ..., 'undangan', 'ra', 'rapat', ...]
```

### Cara Query dengan Keywords (Frontend)

```typescript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ✅ Query full-text search via array-contains
async function searchSurat(opdId: string, searchQuery: string, limitCount = 20) {
  if (!searchQuery || searchQuery.length < 2) return []; // Minimal 2 karakter
  
  const keyword = searchQuery.toLowerCase().trim();
  
  const q = query(
    collection(db, 'surat'),
    where('opdId', '==', opdId),               // ✅ SELALU filter opdId dulu
    where('searchKeywords', 'array-contains', keyword),
    orderBy('tanggalDiterima', 'desc'),
    limit(limitCount)
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
```

### Hook Search dengan `useDeferredValue`

```tsx
import { useState, useDeferredValue, useEffect } from 'react';

export function useSearchSurat(opdId: string) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SuratMasuk[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const deferredQuery = useDeferredValue(query); // Cegah search tiap keystroke

  useEffect(() => {
    if (deferredQuery.length < 2) {
      setResults([]);
      return;
    }
    
    let cancelled = false;
    setIsSearching(true);
    
    searchSurat(opdId, deferredQuery).then(data => {
      if (!cancelled) {
        setResults(data as SuratMasuk[]);
        setIsSearching(false);
      }
    });
    
    return () => { cancelled = true; };
  }, [opdId, deferredQuery]);

  return { query, setQuery, results, isSearching };
}
```

---

## 📄 Cursor-Based Pagination dengan `startAfter()`

Untuk daftar panjang (arsip surat, laporan), gunakan cursor pagination — **bukan** offset-based (tidak didukung Firestore).

```typescript
import { query, collection, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';

const PAGE_SIZE = 20;

// ✅ Pola cursor pagination lengkap
export function useSuratPaginated(opdId: string) {
  const [items, setItems] = useState<SuratMasuk[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch halaman pertama
  const fetchFirst = useCallback(async () => {
    if (!opdId) return;
    setIsLoading(true);
    
    const q = query(
      collection(db, 'surat'),
      where('opdId', '==', opdId),
      orderBy('tanggalDiterima', 'desc'),
      limit(PAGE_SIZE)
    );
    
    const snap = await getDocs(q);
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SuratMasuk));
    
    setItems(docs);
    setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === PAGE_SIZE);
    setIsLoading(false);
  }, [opdId]);

  // Fetch halaman berikutnya
  const fetchMore = useCallback(async () => {
    if (!lastDoc || !hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    
    const q = query(
      collection(db, 'surat'),
      where('opdId', '==', opdId),
      orderBy('tanggalDiterima', 'desc'),
      startAfter(lastDoc),  // ✅ Cursor: mulai setelah dokumen terakhir
      limit(PAGE_SIZE)
    );
    
    const snap = await getDocs(q);
    const newDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SuratMasuk));
    
    setItems(prev => [...prev, ...newDocs]); // Append, bukan replace
    setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === PAGE_SIZE);
    setIsLoadingMore(false);
  }, [opdId, lastDoc, hasMore, isLoadingMore]);

  useEffect(() => { fetchFirst(); }, [fetchFirst]);

  return { items, hasMore, isLoading, isLoadingMore, fetchMore, refetch: fetchFirst };
}
```

### Tombol "Muat Lebih Banyak"

```tsx
const { items, hasMore, isLoading, isLoadingMore, fetchMore } = useSuratPaginated(opdId);

return (
  <div>
    {items.map(s => <SuratCard key={s.id} surat={s} />)}
    
    {hasMore && (
      <button
        onClick={fetchMore}
        disabled={isLoadingMore}
        className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {isLoadingMore ? (
          <Loader2 className="size-4 animate-spin mx-auto" />
        ) : (
          'Muat lebih banyak...'
        )}
      </button>
    )}
    
    {!hasMore && items.length > 0 && (
      <p className="text-center text-xs text-muted-foreground py-4">
        Semua data sudah ditampilkan ({items.length} item)
      </p>
    )}
  </div>
);
```

---

## ⚠️ Composite Index yang Dibutuhkan

Query dengan `where` + `orderBy` yang berbeda field **memerlukan composite index** di Firestore:

```
Koleksi: surat
Fields: opdId (ASC) + searchKeywords (ARRAY_CONTAINS) + tanggalDiterima (DESC)

Koleksi: surat
Fields: opdId (ASC) + statusPenyelesaian (ASC) + tanggalDiterima (DESC)

Koleksi: disposisi
Fields: opdId (ASC) + kepadaJabatanId (ARRAY_CONTAINS) + tanggalDisposisi (DESC)
```

Buat di Firebase Console → Firestore → Indexes, atau via `firestore.indexes.json`.
