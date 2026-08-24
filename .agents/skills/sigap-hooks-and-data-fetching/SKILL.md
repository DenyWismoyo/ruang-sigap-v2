---
name: sigap-hooks-and-data-fetching
description: Pola standar untuk custom hooks Firestore realtime, TanStack Query, optimistic UI, dan data fetching di RUANG SIGAP / POROS. Gunakan saat membuat hook baru, menambahkan query baru, atau mengimplementasikan pola optimistic update.
---

# Hooks & Data Fetching — Pola Standar RUANG SIGAP

---

## 📁 Lokasi Hooks

```
src/app/dashboard/sigap/hooks/   ← Custom hooks SSOT bersama (30+ hooks)
src/hooks/                        ← Hooks global lintas dashboard
```

**Hooks Kunci yang Harus Dikenali:**

| Hook | File | Fungsi |
|------|------|--------|
| `useMasterData` | `useMasterData.ts` | Cache jabatan & user semua OPD |
| `useSuratData` | `useSuratData.ts` | Daftar surat masuk dengan filter |
| `useRuangKerjaFeed` | `useRuangKerjaFeed.ts` | Feed unified: surat baru + disposisi + tugas |
| `useBawahanList` | `useBawahanList.ts` | Daftar bawahan untuk disposisi |
| `useSuratActions` | `useSuratActions.ts` | Semua aksi surat: disposisi, arsip, dll. |
| `useUserSummaries` | `useUserSummaries.ts` | Counter KPI realtime |
| `useTugasData` | `useTugasData.ts` | Daftar tugas |
| `useTugasActions` | `useTugasActions.ts` | Aksi tugas: buat, selesaikan, dll. |
| `useAgendaData` | `useAgendaData.ts` | Agenda harian |
| `useInstruksiTemplat` | `useInstruksiTemplat.ts` | Bank templat disposisi |

---

## 🔧 Template 1: Firestore Realtime Hook (onSnapshot)

Gunakan pola ini untuk data yang perlu update real-time (feed, notifikasi, ruang kerja):

```typescript
// hooks/useNamaData.ts
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TipeData } from '@/types';

interface UseNamaDataOptions {
  opdId: string;
  limitCount?: number;
}

interface UseNamaDataResult {
  data: TipeData[];
  isLoading: boolean;
  error: string | null;
}

export function useNamaData({ opdId, limitCount = 20 }: UseNamaDataOptions): UseNamaDataResult {
  const [data, setData] = useState<TipeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!opdId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // ✅ Selalu filter opdId untuk isolasi data
    const q = query(
      collection(db, 'nama_koleksi'),
      where('opdId', '==', opdId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    // ✅ Simpan unsubscribe, bersihkan saat unmount
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as TipeData[];
        setData(items);
        setIsLoading(false);
      },
      (err) => {
        console.error('[useNamaData] Firestore error:', err);
        setError('Gagal memuat data. Periksa koneksi Anda.');
        setIsLoading(false);
      }
    );

    // ✅ WAJIB cleanup
    return () => unsubscribe();
  }, [opdId, limitCount]);

  return { data, isLoading, error };
}
```

---

## 🔧 Template 2: One-Time Fetch Hook (getDocs)

Untuk data yang tidak perlu realtime (laporan, arsip, data statis):

```typescript
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TipeData } from '@/types';

export function useNamaDataStatic(opdId: string) {
  const [data, setData] = useState<TipeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!opdId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, 'nama_koleksi'),
        where('opdId', '==', opdId)
      );
      const snap = await getDocs(q);
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() } as TipeData)));
    } catch (err) {
      console.error('[useNamaDataStatic] Error:', err);
      setError('Gagal memuat data.');
    } finally {
      setIsLoading(false);
    }
  }, [opdId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Ekspor refetch untuk manual refresh
  return { data, isLoading, error, refetch: fetchData };
}
```

---

## 🔧 Template 3: Action Hook (Mutasi + Optimistic UI)

Pola untuk hooks yang berisi fungsi-fungsi mutasi Firestore (contoh: `useSuratActions`):

```typescript
// hooks/useNamaActions.ts
import { useState, useCallback } from 'react';
import { doc, updateDoc, addDoc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { TipeData } from '@/types';
import * as Sentry from '@sentry/nextjs';

export function useNamaActions() {
  const { userProfile, actingJabatanProfile } = useUserAuth();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // ─── Aksi: Buat Item Baru ───
  const buatItemBaru = useCallback(async (
    data: Omit<TipeData, 'id' | 'createdAt'>,
    onOptimisticUpdate?: (item: TipeData) => void  // Callback untuk optimistic UI
  ) => {
    if (!userProfile || !actingJabatanProfile) return;
    
    setIsLoading(true);
    
    // Optimistic update: tampilkan item sementara sebelum server konfirmasi
    const tempId = `temp_${Date.now()}`;
    const optimisticItem: TipeData = {
      ...data,
      id: tempId,
      opdId: userProfile.opdId,
      createdAt: new Date() as any, // Sementara
    };
    onOptimisticUpdate?.(optimisticItem);
    
    try {
      const docRef = await addDoc(collection(db, 'nama_koleksi'), {
        ...data,
        opdId: userProfile.opdId,
        pembuatUid: userProfile.uid,
        pembuatNama: userProfile.namaLengkap,
        createdAt: serverTimestamp(),
      });
      
      addToast({ type: 'success', title: 'Berhasil', message: 'Item berhasil dibuat.' });
      return docRef.id;
      
    } catch (error) {
      console.error('[buatItemBaru] Error:', error);
      addToast({ type: 'error', title: 'Gagal', message: 'Item tidak dapat dibuat.' });
      Sentry.captureException(error, { extra: { action: 'buatItemBaru', opdId: userProfile.opdId } });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, actingJabatanProfile, addToast]);

  // ─── Aksi: Update Item ───
  const updateItem = useCallback(async (
    itemId: string,
    updates: Partial<TipeData>
  ) => {
    if (!userProfile) return;
    
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'nama_koleksi', itemId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      addToast({ type: 'success', title: 'Tersimpan', message: 'Perubahan berhasil disimpan.' });
    } catch (error) {
      addToast({ type: 'error', title: 'Gagal', message: 'Perubahan tidak dapat disimpan.' });
      Sentry.captureException(error);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, addToast]);

  return { buatItemBaru, updateItem, isLoading };
}
```

---

## 🔧 Template 4: useMasterData (Data Jabatan & User)

Data jabatan dan daftar user sudah ter-cache di `useMasterData`. **Jangan query ulang koleksi `jabatan` atau `users` secara manual** dari komponen jika sudah ada di master data:

```tsx
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData';

function MyComponent() {
  const { jabatanList, userList, isLoading } = useMasterData();
  
  // Cari jabatan berdasarkan ID
  const jabatan = jabatanList.find(j => j.id === targetJabatanId);
  
  // Cari user berdasarkan jabatan
  const user = userList.find(u => u.jabatanId === jabatanId);
  
  // Bawahan langsung dari jabatan tertentu
  const bawahan = jabatanList.filter(j => j.idAtasan === actingJabatan?.id);
}
```

---

## ⚡ Pola Optimistic UI (Ruang Kerja Feed)

Di hooks seperti `useSuratActions`, item langsung dihapus dari feed **sebelum** server konfirmasi untuk menghindari lag UI:

```typescript
// Contoh: Optimistic remove setelah kirim disposisi
const optimisticRemoveFromFeed = useCallback((suratId: string) => {
  // Update state lokal segera (tanpa tunggu server)
  setFeedItems(prev => prev.filter(item => item.suratId !== suratId));
}, []);

const kirimDisposisi = useCallback(async (surat, targets) => {
  // 1. Hapus dari feed segera (optimistic)
  optimisticRemoveFromFeed(surat.id);
  
  try {
    // 2. Commit ke Firestore (di background)
    await doKirimDisposisi(surat, targets);
    addToast({ type: 'success', title: 'Disposisi Terkirim', message: '...' });
  } catch (error) {
    // 3. Rollback jika gagal: kembalikan ke feed
    setFeedItems(prev => [surat, ...prev]);
    addToast({ type: 'error', title: 'Gagal', message: '...' });
  }
}, [optimisticRemoveFromFeed, addToast]);
```

---

## 🔄 TanStack Query + Firebase Pattern

Untuk data yang tidak perlu realtime tapi butuh caching/refetching yang cerdas:

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ─── Query Key Constants ───
export const QUERY_KEYS = {
  arsip: (opdId: string) => ['arsip', opdId],
  laporan: (opdId: string, periode: string) => ['laporan', opdId, periode],
  templat: (opdId: string) => ['templat', opdId],
} as const;

// ─── useQuery untuk fetch ───
export function useArsipData(opdId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.arsip(opdId),
    queryFn: async () => {
      const q = query(
        collection(db, 'surat'),
        where('opdId', '==', opdId),
        where('statusPenyelesaian', '==', 'Diarsipkan')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    staleTime: 5 * 60 * 1000,     // 5 menit sebelum refetch
    enabled: !!opdId,               // Hanya query jika opdId tersedia
  });
}

// ─── useMutation untuk write ───
export function useArsipMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ suratId, opdId }: { suratId: string; opdId: string }) => {
      await updateDoc(doc(db, 'surat', suratId), { statusPenyelesaian: 'Diarsipkan' });
    },
    onSuccess: (_, { opdId }) => {
      // Invalidate cache agar refetch otomatis
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.arsip(opdId) });
    },
  });
}
```

---

## 📋 Pola Konsumsi Hook di Komponen

```tsx
// ✅ Pola Lengkap di Komponen
export default function HalamanSurat() {
  // 1. Semua hooks di atas
  const { userProfile, actingJabatanProfile, opdConfig, loading } = useUserAuth();
  const { suratList, isLoading: isSuratLoading } = useSuratData({
    opdId: userProfile?.opdId ?? '',
  });
  const { kirimDisposisi, isLoading: isActionLoading } = useSuratActions();

  // 2. Early return setelah hooks
  if (loading || !userProfile) return <LoadingSpinner />;

  // 3. Feature gate check
  if (!opdConfig?.features?.aiSuratReader) {
    // Sembunyikan tombol AI
  }

  // 4. Render
  return (
    <div>
      {isSuratLoading ? <SuratSkeleton /> : suratList.map(s => <SuratCard key={s.id} surat={s} />)}
    </div>
  );
}
```

---

## 🚫 Anti-Pattern Hooks yang Dilarang

| Anti-Pattern | Aturan |
|-------------|--------|
| Query Firestore langsung dari JSX | Pindahkan ke custom hook |
| `onSnapshot` tanpa cleanup `return () => unsubscribe()` | Menyebabkan memory leak |
| Dua hook yang query koleksi yang sama | Gunakan satu hook yang sama (SSOT) |
| `useEffect` dengan dependency array kosong tapi menggunakan state | Selalu sertakan semua dependency |
| Query ulang `jabatan` jika sudah ada `useMasterData` | Gunakan `useMasterData` |
| `callCloudFunction` langsung di komponen tanpa hook | Bungkus dalam action hook |
