// Lokasi: src/app/dashboard/surat/components/PemantauanTab.tsx
// [UPDATE] Tampilan Mobile Friendly, Penambahan tombol Load More, 
// dan Grouping Tindak Lanjut per Surat (Thread/Paket Surat).

"use client";

import React, { useMemo } from 'react';
import { usePemantauanTindakLanjut, TindakLanjutEnriched } from '@/app/dashboard/poros/hooks/usePemantauanTindakLanjut';
import { formatDateRelative } from '@/lib/utils';
import Avatar from '@/app/dashboard/poros/components/Avatar';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Activity, Paperclip, CheckCircle, ChevronDown, RefreshCw, MessagesSquare, ArrowRight, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PemantauanTabProps {
    onNavigate: () => void;
}

export default function PemantauanTab({ onNavigate }: PemantauanTabProps) {
    const { 
        feedTindakLanjut, 
        isLoading, 
        isMoreLoading, 
        hasMore, 
        loadMore, 
        refetch 
    } = usePemantauanTindakLanjut();

    // Mengelompokkan Tindak Lanjut berdasarkan Surat ID agar menjadi "1 Paket"
    const groupedFeed = useMemo(() => {
        if (!feedTindakLanjut) return [];

        const groups: Record<string, TindakLanjutEnriched[]> = {};
        
        feedTindakLanjut.forEach(item => {
            const sid = item.suratId;
            if (!groups[sid]) groups[sid] = [];
            groups[sid].push(item);
        });

        // Helper untuk mendapatkan timestamp
        const getTime = (dateObj: any) => {
            if (!dateObj) return 0;
            if (typeof dateObj.toMillis === 'function') return dateObj.toMillis();
            if (dateObj instanceof Date) return dateObj.getTime();
            return new Date(dateObj).getTime() || 0;
        };

        // Urutkan grup berdasarkan aktivitas (laporan) terbaru
        return Object.values(groups).sort((a, b) => {
            const maxA = Math.max(...a.map(i => getTime(i.tanggalLaporan)));
            const maxB = Math.max(...b.map(i => getTime(i.tanggalLaporan)));
            return maxB - maxA;
        });
    }, [feedTindakLanjut]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-muted-foreground border border-dashed rounded-xl bg-card">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                <p className="text-sm md:text-base">Mengumpulkan rantai tindak lanjut...</p>
            </div>
        );
    }

    if (groupedFeed.length === 0) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 flex flex-col items-center justify-center nk-glass-card opacity-80 hover:opacity-100 transition-opacity mt-4"
            >
                <div className="w-24 h-24 mb-4 rounded-full bg-[var(--nk-surface-3)] flex items-center justify-center border border-[var(--nk-teal-light)]/20 shadow-inner relative">
                    <div className="absolute inset-0 bg-[var(--nk-teal-light)]/10 blur-xl rounded-full"></div>
                    <MessagesSquare size={48} className="text-[var(--nk-teal-mid)]/60 relative z-10 animate-pulse" />
                </div>
                <p className="font-heading font-semibold text-foreground/70 text-xl">Belum Ada Pantauan</p>
                <p className="text-sm text-muted-foreground mt-2">Aktivitas tindak lanjut surat akan dikelompokkan di sini.</p>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-6 rounded-full px-6">
                    <RefreshCw size={14} className="mr-2" /> Segarkan
                </Button>
            </motion.div>
        );
    }

    return (
        <div className="bg-transparent md:bg-card md:rounded-xl md:shadow-sm md:border border-border md:p-6 space-y-0 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border md:border-none md:p-0 md:bg-transparent mx-4 md:mx-0 mb-4 md:mb-0">
                <div>
                    <h2 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
                        <Activity className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                        Timeline Tindak Lanjut
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Pantau seluruh rantai progres surat dalam satu paket terpadu.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="w-full sm:w-auto text-xs md:text-sm h-9 md:h-10">
                    <RefreshCw size={14} className="mr-2" /> Segarkan Feed
                </Button>
            </div>

            {/* List Grouped Feed */}
            <div className="space-y-0 md:space-y-6">
                <AnimatePresence>
                {groupedFeed.map((group, groupIdx) => {
                    const surat = group[0].surat;
                    // Anggap surat selesai jika status utamanya selesai
                    const isSuratSelesai = surat?.statusPenyelesaian === 'Selesai';

                    return (
                        <motion.div 
                            key={surat?.id || group[0].id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: groupIdx * 0.1 }}
                            className="bg-card border-x-0 border-b border-t-0 border-border/50 rounded-none md:nk-card flex flex-col relative hover:shadow-[var(--nk-shadow-md)] transition-all duration-300 group/paket"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--nk-teal-light)] to-[var(--nk-teal-mid)] opacity-80"></div>
                            {/* Header Paket Surat */}
                            <div className="bg-muted/30 p-3 md:p-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-2 mb-2">
                                        {isSuratSelesai ? (
                                            <span className="inline-flex items-center text-[10px] md:text-xs font-bold text-emerald-700 bg-emerald-100/50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                <CheckCircle size={12} className="mr-1" /> Selesai
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center text-[10px] md:text-xs font-bold text-amber-700 bg-amber-100/50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                <Activity size={12} className="mr-1" /> Dalam Proses
                                            </span>
                                        )}
                                        <span className="text-[10px] md:text-xs text-muted-foreground flex items-center font-medium bg-background px-2 py-0.5 rounded-full border border-border/50">
                                            <FileText size={12} className="mr-1.5 opacity-70" /> {surat?.nomorSurat || 'Nomor tidak tersedia'}
                                        </span>
                                    </div>
                                    <Link 
                                        href={`/dashboard/surat/${surat?.id}`} 
                                        onClick={onNavigate}
                                        className="group-hover/paket:text-[var(--nk-teal-mid)] transition-colors"
                                    >
                                        <h3 className="text-sm md:text-base font-bold font-heading text-foreground leading-snug line-clamp-2">
                                            {surat?.perihal || 'Surat Tidak Ditemukan / Dihapus'}
                                        </h3>
                                    </Link>
                                </div>
                                <Button asChild variant="outline" size="sm" className="shrink-0 text-xs h-8 rounded-full hover:bg-[var(--nk-teal-light)]/20 hover:text-[var(--nk-teal-mid)] hover:border-[var(--nk-teal-light)]/40 transition-all">
                                    <Link href={`/dashboard/surat/${surat?.id}`} onClick={onNavigate}>
                                        Detail Surat <ArrowRight size={14} className="ml-1.5" />
                                    </Link>
                                </Button>
                            </div>

                            {/* Thread / Rantai Laporan */}
                            <div className="p-3 md:p-5 relative">
                                <div className="space-y-4 md:space-y-6 relative before:absolute before:inset-0 before:ml-[1.125rem] md:before:ml-[1.625rem] before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                                    
                                    {group.map((item, index) => {
                                        return (
                                            <motion.div 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.3, delay: 0.2 + (index * 0.1) }}
                                                key={item.id} className="relative flex items-start gap-3 md:gap-4 group/node"
                                            >
                                                
                                                {/* Node Timeline */}
                                                <div className="relative z-10 flex items-center justify-center w-9 h-9 md:w-10 md:h-10 bg-background border-2 border-muted-foreground/20 rounded-full flex-shrink-0 group-hover:border-primary/50 transition-colors mt-1 md:mt-0">
                                                    <Avatar name={item.pelaporNama} className="w-7 h-7 md:w-8 md:h-8" />
                                                </div>

                                                {/* Konten Laporan Individu */}
                                                <div className="flex-1 min-w-0 bg-muted/20 border border-border/50 rounded-lg p-3 md:p-4 hover:bg-muted/30 transition-colors">
                                                    <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-2 gap-1">
                                                        <div className="text-xs md:text-sm leading-tight">
                                                            <span className="font-bold text-foreground mr-1.5">{item.pelaporNama}</span>
                                                            <span className="text-muted-foreground text-[10px] md:text-xs">({item.pelaporJabatan})</span>
                                                        </div>
                                                        <time className="text-[10px] md:text-[11px] font-medium text-muted-foreground shrink-0">
                                                            {formatDateRelative(item.tanggalLaporan)}
                                                        </time>
                                                    </div>

                                                    <div className="text-xs md:text-sm text-foreground/90 leading-relaxed flex items-start">
                                                        <CornerDownRight size={14} className="text-muted-foreground mr-2 shrink-0 mt-0.5" />
                                                        <span className="italic">"{item.isiLaporan}"</span>
                                                    </div>
                                                    
                                                    {/* Lampiran Laporan (Jika Ada) */}
                                                    {item.googleDriveLink && (
                                                        <div className="mt-3 pt-3 border-t border-border/50">
                                                            <Button asChild variant="outline" size="sm" className="h-6 md:h-7 text-[10px] md:text-xs px-2 md:px-2.5">
                                                                <a href={item.googleDriveLink} target="_blank" rel="noopener noreferrer">
                                                                    <Paperclip size={10} className="mr-1 md:mr-1.5"/> 
                                                                    {item.googleDriveFileName ? (
                                                                        <span className="truncate max-w-[120px] md:max-w-[200px]">{item.googleDriveFileName}</span>
                                                                    ) : (
                                                                        <span>Lihat Lampiran</span>
                                                                    )}
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                </AnimatePresence>
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="mt-6 md:mt-8 text-center pb-4">
                    <Button 
                        variant="outline" 
                        onClick={loadMore} 
                        disabled={isMoreLoading} 
                        className="w-full sm:w-auto shadow-sm text-xs md:text-sm h-10 rounded-full px-8"
                    >
                        {isMoreLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <ChevronDown className="mr-2 h-4 w-4"/>}
                        {isMoreLoading ? 'Memuat riwayat lama...' : 'Muat Lebih Banyak Riwayat'}
                    </Button>
                </div>
            )}
        </div>
    );
}
