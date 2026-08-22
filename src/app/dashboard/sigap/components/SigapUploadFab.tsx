"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FilePlus } from 'lucide-react';
import { useUserAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function SigapUploadFab() {
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile, loading } = useUserAuth();

  // Condition to show FAB
  const canUploadSurat = 
    userProfile?.role === 'admin_opd' || 
    userProfile?.role === 'staf_tu' || 
    userProfile?.additionalRoles?.includes('operator_surat');

  // Do not show if still loading, user doesn't have permission, or already on the upload page
  if (loading || !canUploadSurat || pathname === '/dashboard/surat/upload') {
    return null;
  }

  // Adjust bottom position if on detail page so it doesn't overlap with other bottom bars
  const isDetailPage = pathname?.match(/\/surat\/[^\/]+$/);
  // Sama dengan Copilot bottomPos
  const bottomPos = isDetailPage ? 'bottom-[120px]' : 'bottom-20';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        className="flex items-center transition-all duration-300 relative group"
      >
        <div
          onClick={() => router.push('/dashboard/surat/upload')}
          title="Upload Surat Baru"
          className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 backdrop-blur-xl rounded-r-[24px] flex items-center justify-center cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.4)] relative transition-all duration-300 active:scale-95 border-r border-y border-white/20 hover:pl-2"
        >
          <FilePlus className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-background z-20 animate-pulse" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
