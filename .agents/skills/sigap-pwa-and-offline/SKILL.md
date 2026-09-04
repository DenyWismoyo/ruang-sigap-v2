---
name: sigap-pwa-and-offline
description: Panduan implementasi PWA (Progressive Web App), offline queue via IndexedDB (offlineSync.ts), install prompt, dan Service Worker pada platform RUANG SIGAP. Gunakan saat menambahkan fitur offline atau memodifikasi Service Worker.
---

# PWA & Offline Support — RUANG SIGAP

```
IndexedDB Store   : SIGAP_OFFLINE_DB → pendingSuratUploads
Utility File      : src/lib/offlineSync.ts
Install Component : src/components/InstallPwaButton.tsx
Offline Component : src/components/OfflineSyncManager.tsx
```

---

## 🌐 Deteksi Status Online/Offline

```tsx
import { useState, useEffect } from 'react';

// ✅ Hook standar untuk deteksi koneksi
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

---

## 📦 Menyimpan Aksi ke Antrian Offline

Saat pengguna mencoba mengunggah surat dalam kondisi offline, simpan ke IndexedDB:

```tsx
import { savePendingSurat } from '@/lib/offlineSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function FormUploadSurat() {
  const isOnline = useOnlineStatus();
  const { addToast } = useToast();

  const handleSubmit = async (data: SuratFormValues, file: File) => {
    if (!isOnline) {
      // ✅ Simpan ke antrian offline jika tidak ada koneksi
      try {
        await savePendingSurat(data, file);
        addToast({
          type: 'info',
          title: 'Disimpan Offline',
          message: 'Surat akan dikirim otomatis saat koneksi kembali.',
        });
      } catch (err) {
        addToast({ type: 'error', title: 'Gagal', message: 'Tidak dapat menyimpan offline.' });
      }
      return;
    }
    
    // Normal flow jika online
    await uploadSuratNormal(data, file);
  };
}
```

---

## 🔄 Sinkronisasi Antrian saat Online Kembali

```tsx
import { getPendingSuratUploads, deletePendingSuratUpload } from '@/lib/offlineSync';

// ✅ Hook untuk sinkronisasi otomatis saat koneksi kembali
export function useOfflineSync() {
  const isOnline = useOnlineStatus();
  const { addToast } = useToast();
  const { userProfile } = useUserAuth();

  useEffect(() => {
    if (!isOnline || !userProfile) return;
    
    // Cek dan proses antrian saat online kembali
    const syncQueue = async () => {
      const pending = await getPendingSuratUploads();
      if (pending.length === 0) return;
      
      addToast({
        type: 'info',
        title: `Menyinkronkan ${pending.length} surat...`,
        message: 'Data offline sedang dikirim ke server.',
      });
      
      for (const item of pending) {
        try {
          // Upload ke Firestore & Storage
          await uploadSuratFromQueue(item);
          // Hapus dari antrian jika berhasil
          await deletePendingSuratUpload(item.id);
        } catch (err) {
          console.error('[OfflineSync] Gagal sync item:', item.id, err);
        }
      }
      
      addToast({ type: 'success', title: 'Sinkronisasi Selesai' });
    };
    
    syncQueue();
  }, [isOnline]); // Trigger saat isOnline berubah true
}
```

---

## 📱 Install PWA Button

Gunakan komponen yang sudah ada:

```tsx
import InstallPwaButton from '@/components/InstallPwaButton';

// Tampilkan di header atau settings
<InstallPwaButton />

// Komponen ini sudah menangani:
// - beforeinstallprompt event
// - Tidak tampil jika sudah di-install (standalone mode)
// - Tombol hanya muncul di browser yang support PWA
```

---

## ⚙️ Cek Status PWA (Standalone / Browser)

```tsx
// Deteksi apakah aplikasi berjalan sebagai PWA installed
const isPWA = typeof window !== 'undefined' && 
  window.matchMedia('(display-mode: standalone)').matches;

// Atau untuk iOS
const isIOSPWA = (window.navigator as any).standalone === true;

// Gunakan untuk kondisional UI
{!isPWA && <InstallPwaButton />}
{isPWA && <span className="text-xs text-muted-foreground">Aplikasi terinstall ✓</span>}
```

---

## 🚫 Anti-Pattern PWA

| Anti-Pattern | Risiko | Solusi |
|-------------|--------|--------|
| Langsung gagal saat offline tanpa feedback | UX buruk | Cek `isOnline`, gunakan `savePendingSurat` |
| Tidak ada fallback untuk offline | App crash | Tampilkan UI offline yang informatif |
| Service Worker cache terlalu agresif | Data stale | Set cache TTL yang tepat untuk Firestore data |
| Tidak hapus item dari antrian setelah sync | Data ganda | Selalu `deletePendingSuratUpload` setelah berhasil |

---

## 🚀 Persyaratan WebAPK Android (Native App Install)

Agar PWA di Android terinstal sebagai **WebAPK** (aplikasi native dengan icon penuh dan laci aplikasi sendiri), BUKAN sekadar *browser shortcut* (icon kecil dengan lambang Chrome), patuhi aturan berikut:

1. **Wajib Memiliki Fetch Listener**: Service Worker (`firebase-messaging-sw.js` atau `sw.js`) **HARUS** memanggil `self.addEventListener('fetch', ...)` meskipun isinya kosong/hanya pass-through. Ini adalah syarat teknis mutlak dari Chrome Android.
2. **Manifest Cache Busting**: Selalu tambahkan query string versi pada link manifest di `layout.tsx` (e.g. `<link rel="manifest" href="/manifest.json?v=2" />`) jika memperbarui icon atau data manifest, karena browser sering mem-cache manifest dengan sangat agresif.
3. **Global `beforeinstallprompt`**: Tangkap event instalasi di level teratas aplikasi (Top-level Layout atau Provider) lalu simpan ke state global agar komponen tombol Install bisa memanggilnya kapanpun tanpa kehilangan konteks.
