// Lokasi: src/components/ui/breadcrumbs.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const routeMapping: Record<string, string> = {
  dashboard: 'Beranda',
  'ruang-kerja': 'Ruang Kerja',
  surat: 'Surat',
  upload: 'Upload',
  tugas: 'Tugas',
  delegasi: 'Delegasi',
  logbook: 'Logbook Harian',
  checklist: 'Checklist Pribadi',
  profil: 'Profil Pengguna',
  users: 'Manajemen User',
  opd: 'Manajemen OPD',
  jabatan: 'Manajemen Jabatan',
  templat: 'Bank Template',
  'surat-keluar': 'Surat Keluar',
  buat: 'Buat Baru',
  arsip: 'Arsip Digital',
  dokumen: 'Repository',
  notulensi: 'Notulensi Rapat',
  jadwal: 'Jadwal',
  pengumuman: 'Pengumuman',
  evaluasi: 'Evaluasi Kinerja',
  laporan: 'Laporan',
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  const pathNames = pathname?.split('/').filter((path) => path) || [];

  // Jangan tampilkan di halaman dashboard utama (home)
  if (pathname === '/dashboard') return null;

  return (
    <nav aria-label="breadcrumb" className="mb-4 hidden md:block">
      <motion.ol 
        initial="hidden" 
        animate="show" 
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }} 
        className="flex items-center space-x-2 text-sm text-muted-foreground"
      >
        <motion.li variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex items-center">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            <Home size={16} />
          </Link>
        </motion.li>
        {pathNames.map((link, index) => {
          if (link === 'dashboard') return null; // Skip kata 'dashboard' (sudah ada di ikon Home)
          
          const isLast = index === pathNames.length - 1;
          const href = `/${pathNames.slice(0, index + 1).join('/')}`;
          
          let displayName = routeMapping[link] || link;
          
          if (link.length >= 20) {
             const prevLink = pathNames[index - 1];
             if (prevLink === 'super-admin') {
                displayName = 'Konfigurasi Instansi';
             } else {
                displayName = 'Detail Dokumen';
             }
          }

          // Capitalize jika tidak ada di mapping
          if (displayName === link) {
            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1).replace(/-/g, ' ');
          }

          return (
            <React.Fragment key={index}>
              <motion.div variants={{ hidden: { opacity: 0, scale: 0.5 }, show: { opacity: 1, scale: 1 } }}>
                <ChevronRight size={14} className="text-muted-foreground/50" />
              </motion.div>
              <motion.li variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}>
                {isLast ? (
                  <span className="font-semibold text-foreground cursor-default">
                    {displayName}
                  </span>
                ) : (
                  <Link href={href} className="hover:text-primary transition-colors">
                    {displayName}
                  </Link>
                )}
              </motion.li>
            </React.Fragment>
          );
        })}
      </motion.ol>
    </nav>
  );
}