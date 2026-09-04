"use client";

import { useEffect } from "react";

/**
 * PwaRegister
 * Mendaftarkan Service Worker PWA (/sw.js) secara otomatis di browser klien
 * untuk memenuhi kriteria WebAPK Android, offline fetch support, dan push notifications.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js?v=2.2.0", {
          scope: "/",
        });
        
        // Auto update check
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[PWA] Versi baru tersedia. Memperbarui Service Worker...");
              }
            });
          }
        });

        console.log("[PWA] Service Worker aktif terdaftar dengan scope:", registration.scope);
      } catch (err) {
        console.warn("[PWA] Registrasi Service Worker gagal:", err);
      }
    };

    // Register saat idle / window load untuk performa optimal
    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker);
      return () => window.removeEventListener("load", registerServiceWorker);
    }
  }, []);

  return null;
}
