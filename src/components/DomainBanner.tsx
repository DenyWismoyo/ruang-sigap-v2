"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DomainBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hostname = window.location.hostname;
    // Tampilkan banner HANYA JIKA domain adalah hosting lama (web.app atau firebaseapp.com)
    if (hostname.includes('web.app') || hostname.includes('firebaseapp.com')) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="w-full bg-red-600 text-white overflow-hidden z-50 shadow-md">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
      <div className="animate-marquee py-2 text-xs md:text-sm font-semibold">
        ✨ Halo! Untuk pengalaman yang lebih cepat dan stabil, gunakan link alternatif ini. 
        <Link href="https://sgp.omnifit.cloud/login" className="underline font-bold text-yellow-300 mx-2 hover:text-white transition-colors">
          Klik di sini untuk login
        </Link>
        ✨
      </div>
    </div>
  );
}
