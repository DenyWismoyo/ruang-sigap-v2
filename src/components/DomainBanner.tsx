"use client";

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

// DomainBanner: Tampil HANYA di domain hosting lama (web.app / firebaseapp.com).
// Mengarahkan user ke domain App Hosting baru (sgp.omnifit.cloud).
// User diarahkan ke /login karena domain baru tidak memiliki cookie sesi dari domain lama.
// Setelah login sekali di domain baru, sesi akan bertahan 30 hari (persistent login).
export default function DomainBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    // Tampilkan banner HANYA JIKA domain adalah hosting lama (web.app atau firebaseapp.com)
    if (hostname.includes('web.app') || hostname.includes('firebaseapp.com')) {
      // Cek apakah user sudah dismiss banner ini sebelumnya di sesi ini
      const dismissed = sessionStorage.getItem('domain_banner_dismissed');
      if (!dismissed) setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('domain_banner_dismissed', '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="w-full bg-red-600 text-white z-50 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 gap-3">
        {/* Pesan utama — scrolling pada layar kecil */}
        <div className="flex-1 overflow-hidden">
          <p className="text-xs md:text-sm font-semibold whitespace-nowrap overflow-ellipsis overflow-hidden md:whitespace-normal">
            🚀 <span className="font-bold">Platform Baru Tersedia!</span>{' '}
            Kami telah pindah ke server yang lebih cepat.{' '}
            <a
              href="https://sgp.omnifit.cloud/login"
              className="underline font-bold text-yellow-300 hover:text-white transition-colors"
            >
              Login sekali di sini →
            </a>
            {' '}untuk masuk ke platform baru (sesi akan tersimpan 30 hari).
          </p>
        </div>

        {/* Tombol tutup */}
        <button
          onClick={handleDismiss}
          aria-label="Tutup notifikasi"
          className="flex-shrink-0 p-1 rounded hover:bg-red-700 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
