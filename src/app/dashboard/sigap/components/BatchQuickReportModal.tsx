"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { RuangKerjaItem, Disposisi, Surat } from '@/types';
import { 
    X, Check, FastForward, Info, Layers, CheckCircle2, 
    ArrowRight, ArrowLeft, Loader2, CheckCheck, MessageSquare, FileCheck, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSuratActions } from '@/app/dashboard/sigap/hooks/useSuratActions';
import { useUserAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface BatchQuickReportModalProps {
    items: RuangKerjaItem[];
    onClose: () => void;
}

type ActionType = 'TERIMA' | 'SELESAI' | 'PROSES' | 'LEWATI';

type PendingSwipeItem = RuangKerjaItem & { type: 'surat_disposisi', surat: Surat, disposisi: Disposisi, needsAcknowledge?: boolean, needsTindakLanjut?: boolean };

export default function BatchQuickReportModal({ items, onClose }: BatchQuickReportModalProps) {
    const { actingJabatanProfile, jabatanProfile } = useUserAuth();
    const effectiveJabatanId = actingJabatanProfile?.id || jabatanProfile?.id;

    // Helper: ambil timestamp disposisi dalam milidetik
    const getDisposisiMillis = (item: any): number => {
        const d = item.disposisi?.tanggalDisposisi;
        if (!d) return 0;
        if (typeof d.toMillis === 'function') return d.toMillis();
        if (d.seconds) return d.seconds * 1000;
        return 0;
    };

    // Helper: filter & sort items
    const buildSortedItems = (rawItems: RuangKerjaItem[]): PendingSwipeItem[] => {
        return rawItems
            .filter(i => {
                if (i.type !== 'surat_disposisi') return false;
                const item = i as any;
                if (item.disposisi?.status === 'Selesai') return false;
                const suratStatus = item.surat?.statusPenyelesaian;
                if (suratStatus === 'Selesai' || suratStatus === 'Diarsipkan') return false;
                return true;
            })
            // Murni kronologis: TERLAMA DULU (tidak ada priority needsAcknowledge)
            .sort((a: any, b: any) => getDisposisiMillis(a) - getDisposisiMillis(b)) as PendingSwipeItem[];
    };

    const [currentIndex, setCurrentIndex] = useState(0);
    const [customReport, setCustomReport] = useState("");
    const [showTutorial, setShowTutorial] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isFallbackLoading, setIsFallbackLoading] = useState(true);
    const [allItems, setAllItems] = useState<RuangKerjaItem[]>(items);
    const { kirimTindakLanjut, terimaDisposisi, isProcessing } = useSuratActions();

    // Fallback: Saat modal dibuka, langsung query Firestore untuk memastikan
    // tidak ada item yang hilang dari cache feed
    useEffect(() => {
        const fetchFallback = async () => {
            if (!effectiveJabatanId) { setIsFallbackLoading(false); return; }
            try {
                // Ambil daftar pending disposisi langsung dari userSummaries (source of truth)
                const summarySnap = await getDoc(doc(db, 'userSummaries', effectiveJabatanId));
                if (!summarySnap.exists()) { setAllItems(items); return; }

                const pendingMap = summarySnap.data().pendingDisposisi || {};
                const allDisposisiFromFirestore = Object.values(pendingMap) as (Disposisi & { needsAcknowledge?: boolean })[];

                // Buat map dari items yang sudah ada di feed (berdasarkan disposisi.id)
                const existingById = new Map<string, RuangKerjaItem>();
                items.forEach(item => {
                    const disp = (item as any).disposisi;
                    if (disp?.id) existingById.set(disp.id, item);
                });

                // Cari disposisi yang ada di Firestore tapi tidak ada di feed ("lost" items)
                const lostDisposisi = allDisposisiFromFirestore.filter(d => d.id && !existingById.has(d.id));

                if (lostDisposisi.length === 0) {
                    setAllItems(items);
                    return;
                }

                // Fetch surat untuk item yang hilang
                const missingSuratIds = [...new Set(lostDisposisi.map(d => d.suratId).filter(Boolean))];
                const suratMap = new Map<string, Surat>();

                // Batch fetch surat (max 30 per query Firestore)
                for (let i = 0; i < missingSuratIds.length; i += 30) {
                    const chunk = missingSuratIds.slice(i, i + 30);
                    const q = query(collection(db, 'surat'), where(documentId(), 'in', chunk));
                    const snap = await getDocs(q);
                    snap.forEach(d => suratMap.set(d.id, { id: d.id, ...d.data() } as Surat));
                }

                // Bangun RuangKerjaItem baru untuk lost items
                const recoveredItems: RuangKerjaItem[] = lostDisposisi
                    .map(disp => {
                        const surat = suratMap.get(disp.suratId || '');
                        if (!surat || surat.statusPenyelesaian === 'Selesai' || surat.statusPenyelesaian === 'Diarsipkan') return null;
                        return {
                            type: 'surat_disposisi' as const,
                            surat,
                            disposisi: disp,
                            needsAcknowledge: disp.needsAcknowledge,
                            needsTindakLanjut: !disp.needsAcknowledge,
                            fromJabatanName: disp.dariJabatanNama || 'Atasan',
                            isOverdue: false,
                            isReadOnly: false,
                        };
                    })
                    .filter(Boolean) as RuangKerjaItem[];

                // Gabungkan: existing items + recovered items, deduplicate by disposisi.id
                const merged = new Map<string, RuangKerjaItem>();
                [...items, ...recoveredItems].forEach(item => {
                    const dispId = (item as any).disposisi?.id;
                    if (dispId) merged.set(dispId, item);
                    else merged.set(Math.random().toString(), item);
                });

                setAllItems(Array.from(merged.values()));
            } catch (err) {
                console.error('Fallback fetch BatchQuickReport gagal:', err);
                setAllItems(items); // Fallback ke items dari props
            } finally {
                setIsFallbackLoading(false);
            }
        };

        fetchFallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [effectiveJabatanId]);

    // Derive sorted pending items from allItems
    const pendingItems = useMemo(() => buildSortedItems(allItems), [allItems]);

    const currentItem = pendingItems[currentIndex];
    
    // Framer Motion controls
    const controls = useAnimation();
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-10, 10]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
    
    // Background color indicators based on swipe direction
    const bgSuccess = useTransform(x, [0, 150], [0, 1]);
    const bgSkip = useTransform(x, [-150, 0], [1, 0]);

    useEffect(() => {
        setMounted(true);
        
        // Cek localStorage: munculkan tutorial hanya sekali sehari
        const today = new Date().toISOString().split('T')[0];
        const lastSeen = localStorage.getItem('sigap_batch_report_tutorial_date');
        
        if (lastSeen !== today) {
            setShowTutorial(true);
            localStorage.setItem('sigap_batch_report_tutorial_date', today);
            const timer = setTimeout(() => setShowTutorial(false), 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Helper: cek apakah item saat ini masih perlu terimaDisposisi
    const getItemNeedsAcknowledge = (item: typeof pendingItems[0]) => {
        if (item.needsAcknowledge !== undefined) return item.needsAcknowledge;
        // Fallback: cek dari data disposisi langsung
        return !(item.disposisi?.penerimaDiterima || []).includes('__placeholder__');
    };

    const handleAction = async (actionType: ActionType) => {
        if (!currentItem || isProcessing) return;

        if (actionType === 'LEWATI') {
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.3 } });
            nextCard();
            return;
        }

        const needsAcknowledge = getItemNeedsAcknowledge(currentItem);

        // Jika aksi TERIMA: hanya panggil terimaDisposisi, lanjut ke kartu berikutnya
        if (actionType === 'TERIMA') {
            const success = await terimaDisposisi(currentItem.disposisi!, currentItem.surat);
            if (success) {
                await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
                nextCard();
            } else {
                controls.start({ x: 0, opacity: 1 });
            }
            return;
        }

        // Untuk SELESAI dan PROSES: jika belum diterima, panggil terimaDisposisi dulu
        if (needsAcknowledge) {
            const acknowledged = await terimaDisposisi(currentItem.disposisi!, currentItem.surat);
            if (!acknowledged) {
                controls.start({ x: 0, opacity: 1 });
                return;
            }
        }

        // Kirim laporan tindak lanjut
        const isFinal = actionType === 'SELESAI';
        const payload = {
            isiLaporan: customReport.trim() !== '' 
                ? customReport.trim() 
                : (isFinal ? 'Tugas telah selesai dilaksanakan.' : 'Sedang dalam proses pengerjaan.'),
            judulLaporan: isFinal ? 'Selesai Dilaksanakan' : 'Proses Pengerjaan',
            warnaLabel: (isFinal ? 'green' : 'yellow') as 'green' | 'yellow',
            checklist: []
        };

        const success = await kirimTindakLanjut(
            currentItem.surat, 
            currentItem.disposisi!, 
            payload, 
            undefined, 
            { isFinalAction: isFinal }
        );

        if (success) {
            await controls.start({ x: 500, opacity: 0, transition: { duration: 0.3 } });
            nextCard();
        } else {
            controls.start({ x: 0, opacity: 1 });
        }
    };

    const handleDragEnd = async (e: any, info: any) => {
        const threshold = 100;
        if (info.offset.x > threshold) {
            // Swipe kanan adaptif: TERIMA jika belum diterima, SELESAI jika sudah
            const needsAck = currentItem ? getItemNeedsAcknowledge(currentItem) : true;
            handleAction(needsAck ? 'TERIMA' : 'SELESAI');
        } else if (info.offset.x < -threshold) {
            handleAction('LEWATI');
        } else {
            controls.start({ x: 0, y: 0 });
        }
    };

    const nextCard = () => {
        setCurrentIndex(prev => prev + 1);
        setCustomReport("");
        x.set(0);
        controls.set({ x: 0, opacity: 1 });
    };

    if (!mounted) return null;

    // Tampilkan loading saat fallback Firestore sedang berjalan
    if (isFallbackLoading) {
        return createPortal(
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-card p-6 rounded-2xl flex flex-col items-center gap-3 shadow-xl">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground">Memuat semua tugas dari server...</p>
                </div>
            </div>,
            document.body
        );
    }

    // Status item saat ini untuk UI adaptif
    const currentNeedsAcknowledge = currentItem ? getItemNeedsAcknowledge(currentItem) : false;

    let content;

    if (currentIndex >= pendingItems.length || pendingItems.length === 0) {
        content = (
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-card text-card-foreground p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-border/50 relative"
                >
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Selesai!</h2>
                    <p className="text-muted-foreground mb-6">
                        Anda telah menyelesaikan antrean pelaporan masal.
                    </p>
                    <Button className="w-full rounded-xl h-12" onClick={onClose}>Kembali ke Ruang Kerja</Button>
                </motion.div>
            </div>
        );
    } else {
        content = (
            <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-0 md:p-4 overflow-hidden">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="w-full h-full md:h-auto md:max-w-md bg-white dark:bg-slate-900 rounded-none md:rounded-[2rem] shadow-2xl border-none md:border md:border-border/50 flex flex-col overflow-hidden relative"
                >
                    {/* Header Modal */}
                    <div className="flex justify-between items-center px-6 py-4 border-b border-border/50 bg-muted/20">
                        <div className="flex items-center gap-2">
                            <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold">
                                <Layers size={14} />
                                {pendingItems.length - currentIndex} Tersisa
                            </div>
                            {/* Badge status adaptif */}
                            {currentNeedsAcknowledge ? (
                                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold">
                                    <FileCheck size={11} /> Perlu Diterima
                                </div>
                            ) : (
                                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] font-bold">
                                    <MessageSquare size={11} /> Perlu Laporan
                                </div>
                            )}
                        </div>
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground" onClick={() => setShowTutorial(true)}>
                                <Info size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 text-muted-foreground" onClick={onClose}>
                                <X size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* Konten Area Geser */}
                    <div className="relative flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950/50">
                        
                        <AnimatePresence>
                            {showTutorial && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="absolute top-6 z-50 bg-blue-600 text-white p-4 rounded-2xl w-[90%] shadow-xl"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold flex items-center gap-2 text-sm"><Info size={16} /> Cara Penggunaan</h3>
                                        <button onClick={() => setShowTutorial(false)}><X size={14} className="opacity-70 hover:opacity-100"/></button>
                                    </div>
                                    <div className="text-xs space-y-3 opacity-95">
                                        <p className="leading-relaxed">Fitur <strong>Lapor Masal</strong> membantu Anda menindaklanjuti tumpukan tugas atau disposisi secara cepat bagaikan tumpukan kartu.</p>
                                        <ul className="space-y-2 ml-1">
                                            <li className="flex items-center gap-2"><ArrowRight size={14} className="text-emerald-300"/> <strong>Geser Kanan</strong>: Terima disposisi (badge merah) / Selesai (badge biru).</li>
                                            <li className="flex items-center gap-2"><ArrowLeft size={14} className="text-rose-300"/> <strong>Geser Kiri</strong> (atau tombol Lewati) untuk melewati ke kartu berikutnya.</li>
                                        </ul>
                                        <div className="bg-blue-700/50 p-2.5 rounded-lg border border-blue-500/30 flex items-start gap-2 mt-2">
                                            <Info size={14} className="mt-0.5 shrink-0 text-blue-200" />
                                            <p className="leading-snug text-[11px] text-blue-50">Badge <strong>merah</strong> = perlu diterima dulu. Badge <strong>biru</strong> = sudah diterima, bisa lapor/selesai.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="relative w-full max-w-[320px] aspect-[4/5] flex items-center justify-center my-4">
                            {/* Background Indicators (Swipe Left/Right Colors) */}
                            <motion.div style={{ opacity: bgSuccess }} className="absolute inset-0 bg-emerald-500 rounded-3xl z-0 shadow-[0_0_40px_rgba(16,185,129,0.2)]" />
                            <motion.div style={{ opacity: bgSkip }} className="absolute inset-0 bg-rose-500 rounded-3xl z-0 shadow-[0_0_40px_rgba(244,63,94,0.2)]" />

                            <motion.div
                                className="absolute inset-0 bg-background rounded-3xl shadow-xl border border-border flex flex-col overflow-hidden z-10 cursor-grab active:cursor-grabbing"
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.8}
                                onDragEnd={handleDragEnd}
                                animate={controls}
                                style={{ x, rotate, opacity }}
                                whileDrag={{ scale: 1.02 }}
                            >
                                {/* Status Indicators appearing when dragging */}
                                <motion.div style={{ opacity: bgSuccess }} className="absolute top-6 left-6 border-4 border-emerald-500 text-emerald-500 font-bold text-xl px-3 py-1 rounded-xl rotate-[-15deg] uppercase z-20 pointer-events-none bg-background/80 backdrop-blur-sm">
                                    {currentNeedsAcknowledge ? 'Terima' : 'Selesai'}
                                </motion.div>
                                <motion.div style={{ opacity: bgSkip }} className="absolute top-6 right-6 border-4 border-rose-500 text-rose-500 font-bold text-2xl px-3 py-1 rounded-xl rotate-[15deg] uppercase z-20 pointer-events-none bg-background/80 backdrop-blur-sm">
                                    Lewati
                                </motion.div>

                                {/* Card Content */}
                                <div className="p-5 flex-1 flex flex-col bg-card">
                                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1.5 uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 w-fit px-2 py-0.5 rounded-full">Disposisi Masuk</div>
                                    <h3 className="text-base md:text-lg font-bold leading-tight mb-3 line-clamp-3">
                                        {currentItem.surat.perihal}
                                    </h3>
                                    
                                    <div className="bg-slate-100 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                        <span className="text-[10px] text-muted-foreground block mb-0.5 uppercase tracking-wide">Pengirim</span>
                                        <div className="font-semibold text-sm text-foreground leading-tight">
                                            {currentItem.disposisi?.dariJabatanNama}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex-1 flex flex-col">
                                        <span className="text-[10px] text-muted-foreground font-semibold block mb-1 uppercase tracking-wide">Instruksi:</span>
                                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 flex-1 overflow-y-auto custom-scrollbar">
                                            <p className="text-sm text-foreground/90 whitespace-pre-wrap font-medium">
                                                {currentItem.disposisi?.instruksi || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                                        <span>Disposisi: {(() => {
                                            const d = currentItem.disposisi?.tanggalDisposisi;
                                            if (!d) return 'N/A';
                                            const date = typeof d.toDate === 'function' ? d.toDate() : new Date(d.seconds * 1000);
                                            return format(date, 'dd MMM yyyy', { locale: id });
                                        })()}</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                    {/* Area Input & Aksi - Adaptif berdasarkan needsAcknowledge */}
                    <div className="p-4 bg-background border-t border-border/30 rounded-b-[2rem]">
                        
                        {/* Jika sudah diterima: tampilkan input laporan + tombol Selesai/Proses */}
                        {!currentNeedsAcknowledge && (
                            <div className="flex items-end gap-2.5 transition-all mb-3">
                                <textarea
                                    className="flex-1 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 rounded-2xl p-3 text-sm focus:outline-none resize-none min-h-[74px] transition-all"
                                    placeholder="Ketik laporan manual (opsional)..."
                                    value={customReport}
                                    onChange={(e) => setCustomReport(e.target.value)}
                                />
                                
                                <div className="flex flex-col gap-1.5 shrink-0">
                                    <Button 
                                        size="sm"
                                        className="h-[34px] rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm px-4 text-xs font-bold w-[88px]"
                                        onClick={() => handleAction('SELESAI')}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" /> : <><Check className="mr-1 h-3.5 w-3.5" />Selesai</>}
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        size="sm"
                                        className="h-[34px] rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900/50 dark:hover:bg-amber-900/30 text-[11px] font-semibold px-2 w-[88px]"
                                        onClick={() => handleAction('PROSES')}
                                        disabled={isProcessing}
                                    >
                                        Proses
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Jika belum diterima: tampilkan tombol Terima primer */}
                        {currentNeedsAcknowledge && (
                            <Button
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold mb-3 flex items-center justify-center gap-2"
                                onClick={() => handleAction('TERIMA')}
                                disabled={isProcessing}
                            >
                                {isProcessing 
                                    ? <Loader2 className="h-4 w-4 animate-spin" /> 
                                    : <><CheckCheck size={16} /> Terima Disposisi</>
                                }
                            </Button>
                        )}

                        <div className="flex justify-center">
                            <button 
                                onClick={() => handleAction('LEWATI')}
                                disabled={isProcessing}
                                className="flex items-center text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-4 py-1.5 rounded-full transition-colors disabled:opacity-50"
                            >
                                <FastForward className="mr-1.5 h-3.5 w-3.5" />
                                Lewati Tugas Ini
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return createPortal(content, document.body);
}
