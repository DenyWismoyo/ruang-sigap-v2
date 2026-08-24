"use client";

import { useEffect } from "react";

/**
 * Komponen ini berfungsi untuk memaksa browser menghapus Service Worker lama
 * dan cache yang mungkin korup akibat upgrade Next.js.
 * * Cara pakai: Import dan letakkan di root layout.tsx atau halaman utama dashboard.
 */
export function ServiceWorkerReset() {
  useEffect(() => {
    const RESET_TOKEN = 'reset-pwa-firebase-cache-v5'; 
    const STORAGE_KEY = 'app_pwa_reset_status';

    const performReset = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

      const hasReset = localStorage.getItem(STORAGE_KEY) === RESET_TOKEN;

      if (!hasReset) {
        console.warn('[System] Mendeteksi kebutuhan reset Service Worker dan Cache. Memulai pembersihan...');

        try {
          // 1. Dapatkan semua registrasi Service Worker aktif
          const registrations = await navigator.serviceWorker.getRegistrations();
          
          if (registrations.length > 0) {
              const unregisterPromises = registrations.map(registration => {
                console.log('[System] Menghapus Service Worker:', registration.scope);
                return registration.unregister();
              });
              await Promise.all(unregisterPromises);
          }

          // 2. Hapus Cache Storage 
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            const deletePromises = cacheNames.map(name => {
                console.log('[System] Menghapus Cache:', name);
                return caches.delete(name);
            });
            await Promise.all(deletePromises);
          }

          // 3. Hapus IndexedDB (Membersihkan sisa cache Firestore yang membandel)
          // PENTING: JANGAN hapus 'firebaseLocalStorageDb' karena berisi sesi Auth.
          // Menghapusnya saat Firebase sedang berjalan akan memicu deadlock di mobile browser.
          if ('indexedDB' in window && (indexedDB as any).databases) {
              try {
                  const dbs = await (indexedDB as any).databases();
                  dbs.forEach((db: any) => {
                      if (db.name && db.name !== 'firebaseLocalStorageDb') {
                          console.log('[System] Menghapus IndexedDB:', db.name);
                          indexedDB.deleteDatabase(db.name);
                      }
                  });
              } catch (e) {
                  console.warn('[System] Gagal menghapus IndexedDB secara massal', e);
              }
          }

          // 4. Simpan tanda bahwa reset sudah berhasil dilakukan
          localStorage.setItem(STORAGE_KEY, RESET_TOKEN);
          console.log('[System] Reset selesai. Reloading...');

          // 5. Hard Reload halaman untuk memastikan browser mengambil aset baru dari jaringan
          window.location.reload();

        } catch (error) {
          console.error('[System] Gagal melakukan reset SW/Cache:', error);
        }
      }
    };

    performReset();
  }, []);

  return null; // Komponen ini invisible
}