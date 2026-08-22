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
                        // Posisikan di atas tombol Copilot
                        className={`fixed ${bottomPos} right-0 z-[45] flex items-center transition-all duration-300`}
                    >
                        <div className="relative group">
                            {/* Tooltip Hover */}
                            <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap hidden md:block">
                                Lapor Masal (Ada {overdueCount} tugas &gt; 2 hari)
                            </div>
                            
                            {/* Tombol yang menempel di layar kanan */}
                            <div 
                                onClick={() => setIsOpen(true)}
                                className="w-14 h-14 md:w-16 md:h-16 bg-amber-500 hover:bg-amber-600 backdrop-blur-xl border-l border-y border-white/20 rounded-l-full flex items-center justify-center cursor-pointer shadow-xl relative transition-all duration-300 hover:pr-2 group-active:scale-95"
                            >
                                {/* Efek Ping merah merona di belakang icon */}
                                <div className="absolute inset-0 rounded-l-full bg-red-500 animate-ping opacity-20 pointer-events-none"></div>
                                
                                <Zap className="w-5 h-5 md:w-6 md:h-6 text-white fill-white" />
                                
                                <span className="absolute top-1 md:top-2 right-2 md:right-3 w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full bg-red-600 text-[10px] md:text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
                                    {pendingItems.length}
                                </span>
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
