// Lokasi: src/app/dashboard/components/SmartFab.tsx
// [NEW COMPONENT] Smart Floating Action Button
// Tombol aksi melayang yang berubah sesuai konteks halaman.
// Diposisikan di atas BottomNavBar (bottom-20) untuk mengisi ruang kosong.

"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Plus, Upload, FileSignature, CheckSquare, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserAuth } from '@/context/AuthContext';

export default function SmartFab() {
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile } = useUserAuth();
  
  // Tentukan aksi berdasarkan path
  const getAction = () => {
    if (pathname === '/dashboard/surat') {
        // Hanya staf TU/Admin yang butuh upload
        if (userProfile?.role === 'staf_tu' || userProfile?.role === 'admin_opd') {
            return {
                icon: <Upload size={20} />,
                label: 'Upload Surat',
                onClick: () => router.push('/dashboard/surat/upload'),
                color: 'bg-blue-600 hover:bg-blue-700'
            };
        }
    }
    
    if (pathname === '/dashboard/tugas') {
        return {
            icon: <CheckSquare size={20} />,
            label: 'Tugas Baru',
            // Kita bisa mentrigger modal di sini, tapi untuk simpel redirect dulu atau gunakan state global UI
            // Idealnya gunakan UIContext untuk membuka modal global
            onClick: () => document.getElementById('btn-tugas-baru-desktop')?.click(), 
            color: 'bg-emerald-600 hover:bg-emerald-700'
        };
    }

    if (pathname === '/dashboard/persetujuan-draf') {
        return {
            icon: <FileSignature size={20} />,
            label: 'Buat Draf',
            onClick: () => {}, // Perlu integrasi dengan modal di page tersebut
            color: 'bg-purple-600 hover:bg-purple-700'
        };
    }

    // Default: Tidak ada FAB di halaman lain (atau bisa tombol general)
    return null;
  };

  const action = getAction();

  // Reposition if on detail page with fixed tab bar
  // Reposition to sit EXACTLY below the Copilot button
  const isDetailPage = pathname?.match(/\/surat\/[^\/]+$/);
  const bottomPos = isDetailPage ? 'bottom-[120px]' : 'bottom-20';

  return (
    <AnimatePresence>
      {action && (
        <motion.div
          key="smart-fab-container"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className={`fixed ${bottomPos} right-0 z-40 md:hidden transition-all duration-300`} // Posisi strategis menempel di kanan
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={action.label}
              initial={{ x: 20, opacity: 0, scale: 0.5 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 20, opacity: 0, scale: 0.5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Button
                variant="ghost"
                onClick={action.onClick}
                className="relative group flex items-center justify-center p-1.5 pr-0.5 rounded-tl-none rounded-bl-[24px] rounded-r-none bg-card/90 backdrop-blur-xl border border-primary/30 border-r-0 border-t-0 shadow-[-4px_0_15px_rgba(0,0,0,0.15)] transition-all duration-300 active:scale-95 h-auto w-auto hover:bg-card/95"
                title={action.label}
              >
                <div className={`relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${action.color} text-white shadow-inner border border-white/10`}>
                  <div className="scale-125 pr-1">{action.icon}</div>
                </div>
              </Button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
