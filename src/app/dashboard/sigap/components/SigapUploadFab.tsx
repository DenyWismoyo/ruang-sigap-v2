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
        initial={{ scale: 0, opacity: 0, x: -50 }}
        animate={{ scale: 1, opacity: 1, x: 0 }}
        exit={{ scale: 0, opacity: 0, x: -50 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`fixed ${bottomPos} left-0 z-50 flex items-center transition-all duration-300`}
      >
        <div
          onClick={() => router.push('/dashboard/surat/upload')}
          title="Upload Surat Baru"
          className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 hover:bg-blue-700 backdrop-blur-xl border-r border-y border-white/20 rounded-r-full flex items-center justify-center cursor-pointer shadow-xl relative group transition-all duration-300 hover:pl-2"
        >
          <FilePlus className="w-5 h-5 md:w-6 md:h-6 text-white" />
          <span className="absolute top-1 md:top-2 left-1 md:left-2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400 border border-white z-20 animate-pulse" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
