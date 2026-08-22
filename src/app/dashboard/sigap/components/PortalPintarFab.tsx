"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import QuickLinksWidget from '@/app/dashboard/sigap/(main)/ruang-kerja/components/QuickLinksWidget';

export default function PortalPintarFab() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Posisi di atas Copilot FAB (Copilot ada di bottom-20 / 80px)
  const isDetailPage = pathname?.match(/\/surat\/[^\/]+$/);
  const bottomPos = isDetailPage ? 'bottom-[200px]' : 'bottom-[150px]';

  return (
    <>
      {/* FAB Trigger */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex items-center transition-all duration-300 relative group"
          >
            <div
              onClick={() => setIsOpen(true)}
              className="w-12 h-12 bg-amber-500 hover:bg-amber-600 backdrop-blur-xl rounded-l-[24px] md:rounded-full flex items-center justify-center cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(245,158,11,0.4)] relative transition-all duration-300 active:scale-95 border-l border-y md:border-r border-white/20 hover:pr-2 md:hover:pr-0"
              title="Portal Pintar (Tools AI & Tautan)"
            >
              <Sparkles className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-4 right-4 md:bottom-24 md:right-8 z-[60] w-[calc(100vw-2rem)] md:w-[400px]"
            >
              <div className="w-full">
                 <QuickLinksWidget variant="modal" onClose={() => setIsOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
