"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useRuangKerjaFeed } from '@/app/dashboard/sigap/hooks/useRuangKerjaFeed';
import BatchQuickReportModal from '@/app/dashboard/sigap/components/BatchQuickReportModal';
import { useUserAuth } from '@/context/AuthContext';
import { differenceInDays } from 'date-fns';

export default function GlobalBatchReportWidget() {
    const { feedItems } = useRuangKerjaFeed();
    const { userProfile, jabatanProfile, actingJabatanProfile } = useUserAuth();
    const effectiveJabatan = actingJabatanProfile || jabatanProfile;
    const isPimpinan = effectiveJabatan && effectiveJabatan.level <= 5;
    
    const [isOpen, setIsOpen] = useState(false);

    // Jangan tampilkan widget ini jika user adalah pimpinan (karena mereka mendisposisi, bukan menindaklanjuti)
    if (isPimpinan || !feedItems) return null;

    // Filter disposisi tertunda
    const pendingItems = feedItems.filter(
        i => i.type === 'surat_disposisi' && (i as any).disposisi?.status !== 'Selesai'
    );

    // Cek apakah ada yang berumur lebih dari 2 hari
    const overdueCount = pendingItems.filter(i => {
        if (i.type !== 'surat_disposisi' || !(i as any).disposisi?.tanggalDisposisi) return false;
        
        let tanggalDisposisi;
        try {
            tanggalDisposisi = typeof (i as any).disposisi.tanggalDisposisi.toDate === 'function' 
                ? (i as any).disposisi.tanggalDisposisi.toDate() 
                : new Date((i as any).disposisi.tanggalDisposisi.seconds * 1000);
        } catch (e) {
            tanggalDisposisi = new Date(); // Fallback
        }
        
        return differenceInDays(new Date(), tanggalDisposisi) >= 2;
    }).length;

    const pathname = usePathname();
    // Sama dengan posisi Copilot
    const isDetailPage = pathname?.match(/\/surat\/[^\/]+$/);
    const bottomPos = isDetailPage ? 'bottom-[190px]' : 'bottom-40'; // Posisi tepat di atas Copilot

    return (
        <>
            <AnimatePresence>
                {overdueCount > 0 && !isOpen && (
                    <motion.div 
                        initial={{ scale: 0, opacity: 0, y: 20 }} 
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        className="flex items-center transition-all duration-300 relative group"
                    >
                        <div className="relative">
                            {/* Tooltip Hover */}
                            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden md:block">
                                Lapor Masal (Ada {overdueCount} tugas &gt; 2 hari)
                            </div>
                            
                            <div 
                                onClick={() => setIsOpen(true)}
                                className="w-12 h-12 bg-orange-500 hover:bg-orange-600 backdrop-blur-xl rounded-l-[24px] md:rounded-full flex items-center justify-center cursor-pointer shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(249,115,22,0.4)] relative transition-all duration-300 active:scale-95 border-l border-y md:border-r border-white/20 hover:pr-2 md:hover:pr-0"
                            >
                                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20 pointer-events-none"></div>
                                <Zap className="w-5 h-5 text-white fill-white group-hover:scale-110 transition-transform" />
                                
                                <div className="absolute -top-1 -right-1 bg-red-600 border-2 border-background text-white text-[10px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full shadow-md z-10">
                                    {overdueCount > 99 ? '99+' : overdueCount}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Lapor Masal */}
            {isOpen && (
                <BatchQuickReportModal 
                    items={feedItems} // Kita kirim seluruh feedItems, filter dilakukan di dalam modal
                    onClose={() => setIsOpen(false)} 
                />
            )}
        </>
    );
}
