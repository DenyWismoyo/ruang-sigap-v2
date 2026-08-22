"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, X, FileText, Share } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSuratDetail } from '@/app/dashboard/sigap/hooks/useSuratDetail';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData';
import { useUserAuth } from '@/context/AuthContext';
import { useInstruksiTemplat } from '@/app/dashboard/sigap/hooks/useInstruksiTemplat';
import FormDisposisi from '@/app/dashboard/sigap/(main)/surat/[id]/components/FormDisposisi';
import InlineTindakLanjutForm from '@/app/dashboard/sigap/(main)/ruang-kerja/components/InlineTindakLanjutForm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClipboardCheck } from 'lucide-react';

// Lazy load PDF viewer
const CachedPdfViewer = dynamic(() => import('@/app/dashboard/sigap/(main)/surat/[id]/components/CachedPdfViewer'), { 
    ssr: false, 
    loading: () => <div className="h-full flex items-center justify-center bg-muted/30 rounded-lg"><Loader2 className="animate-spin text-primary" /></div> 
});

interface UniversalPreviewModalProps {
    suratId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onNavigateToDetail?: (id: string) => void;
}

export default function UniversalPreviewModal({ suratId, isOpen, onClose, onNavigateToDetail }: UniversalPreviewModalProps) {
    const { userProfile, jabatanProfile, actingJabatanProfile } = useUserAuth();
    const effectiveJabatan = actingJabatanProfile || jabatanProfile;
    const isPimpinan = effectiveJabatan ? effectiveJabatan.level <= 5 : false;

    const { surat, disposisiList, isLoading: detailLoading } = useSuratDetail(suratId || '');
    const { userMap, jabatanMap, isLoading: masterLoading } = useMasterData();
    const { templatList } = useInstruksiTemplat();

    const [activePanel, setActivePanel] = useState<'disposisi' | 'laporan' | null>(null);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setActivePanel(null);
        }
    }, [isOpen, suratId]);

    // Derive disposisi state
    const latestDisposisi = disposisiList && disposisiList.length > 0 ? disposisiList[0] : null;
    const isPimpinanPenerimaAwal = !!(effectiveJabatan && effectiveJabatan.level <= 5 && !latestDisposisi);

    // Check if user has received disposisi and needs to revise
    const needsRevision = Boolean(surat?.statusPenyelesaian === 'Revisi Disposisi' && latestDisposisi?.dariJabatanId === effectiveJabatan?.id);
    const isRevising = needsRevision; // Auto true if returned to them

    const isSuratActive = surat?.statusPenyelesaian !== 'Selesai' && surat?.statusPenyelesaian !== 'Diarsipkan';
    const myLatestDisposisi = disposisiList?.find(d => d.kepadaJabatanId.includes(effectiveJabatan?.id || ''));
    const isRecipient = !!myLatestDisposisi;
    const hasConfirmed = myLatestDisposisi ? (myLatestDisposisi.penerimaDiterima || []).includes(effectiveJabatan?.id || '') : false;
    const userHasForwarded = disposisiList?.some(d => d.dariJabatanId === effectiveJabatan?.id);
    const isTuOrAdmin = userProfile?.role === 'staf_tu' || userProfile?.role === 'admin_opd';

    const canDoNormalDisposisi = isSuratActive && (isPimpinanPenerimaAwal || (isRecipient && hasConfirmed)) && !userHasForwarded;
    const canDoLaporan = isSuratActive && isRecipient;

    const canPerformAction = {
        disposisi: Boolean((canDoNormalDisposisi || needsRevision) && !isTuOrAdmin),
        laporan: Boolean(canDoLaporan && !isTuOrAdmin)
    };

    if (!isOpen || !suratId) return null;

    const isLoading = detailLoading || masterLoading || !surat;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-6xl w-[100vw] h-[100vh] sm:h-[90vh] bg-background/95 backdrop-blur-xl border-border/40 p-0 gap-0 flex flex-col overflow-hidden sm:rounded-2xl transition-all duration-500 shadow-2xl">
                
                {/* HEADER BORDERLESS & DARK (Instagram-like) */}
                <DialogHeader className="p-4 bg-zinc-950 text-white flex-shrink-0 flex flex-row items-center justify-between shadow-md z-20">
                    <DialogTitle className="flex items-start gap-3 text-left pr-6 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-zinc-300" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 justify-center">
                            {isLoading ? (
                                <div className="h-4 w-1/3 bg-white/20 rounded animate-pulse mb-2"></div>
                            ) : (
                                <span className="line-clamp-1 leading-tight text-base font-semibold tracking-tight">{surat.perihal}</span>
                            )}
                            {isLoading ? (
                                <div className="h-3 w-1/4 bg-white/10 rounded animate-pulse"></div>
                            ) : (
                                <span className="text-xs text-zinc-400 font-medium truncate tracking-wide">{surat.nomorSurat}</span>
                            )}
                        </div>
                    </DialogTitle>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full shrink-0" onClick={onClose}>
                        <X className="h-6 w-6" />
                    </Button>
                </DialogHeader>
                
                <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden bg-muted/20">
                    {/* PDF VIEWER */}
                    <div className={`flex-1 relative transition-all duration-300 ${activePanel !== null ? 'md:w-1/2 opacity-50 md:opacity-100' : 'w-full'}`}>
                        {isLoading ? (
                            <div className="h-full w-full flex items-center justify-center">
                                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                            </div>
                        ) : (
                            <CachedPdfViewer 
                                fileUrl={surat.fileUrl} 
                                fileName={surat.fileName} 
                            />
                        )}
                    </div>

                    {/* DRAWER / PANEL */}
                    {activePanel !== null && !isLoading && (
                        <div className="absolute inset-x-0 bottom-0 md:relative md:inset-auto md:w-[450px] lg:w-[500px] h-[75vh] md:h-full bg-background md:border-l border-t md:border-t-0 border-border/50 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-30 flex flex-col animate-in slide-in-from-bottom-full md:slide-in-from-right-full duration-300 rounded-t-3xl md:rounded-none overflow-hidden">
                            <div className="md:hidden flex justify-center py-3 bg-muted/30" onClick={() => setActivePanel(null)}>
                                <div className="w-12 h-1.5 bg-border rounded-full" />
                            </div>
                            
                            <div className="px-4 md:px-6 py-4 border-b border-border/40 flex justify-between items-center bg-card">
                                <h3 className="font-semibold text-lg flex items-center gap-2">
                                    {activePanel === 'disposisi' ? (
                                        <><Share className="h-5 w-5 text-blue-500" /> Form Disposisi</>
                                    ) : (
                                        <><ClipboardCheck className="h-5 w-5 text-green-500" /> Form Laporan</>
                                    )}
                                </h3>
                                <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:bg-muted rounded-full" onClick={() => setActivePanel(null)}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            
                            <ScrollArea className="flex-1 bg-muted/10">
                                <div className={activePanel === 'disposisi' ? "p-4 md:p-6" : ""}>
                                    {activePanel === 'disposisi' ? (
                                        <FormDisposisi 
                                            surat={surat}
                                            onDisposisiSuccess={() => {
                                                setActivePanel(null);
                                                onClose();
                                            }}
                                            opdJabatans={jabatanMap} 
                                            userCache={userMap}       
                                            isRevising={isRevising}
                                            latestDisposisi={latestDisposisi}
                                            isPimpinanPenerimaAwal={isPimpinanPenerimaAwal}
                                        />
                                    ) : (
                                        <div className="p-4 md:p-6 pb-20">
                                            {myLatestDisposisi && (
                                                <InlineTindakLanjutForm 
                                                    surat={surat}
                                                    disposisi={myLatestDisposisi}
                                                    userCache={userMap}
                                                    opdJabatans={jabatanMap}
                                                    templatList={templatList}
                                                    onSuccess={() => {
                                                        setActivePanel(null);
                                                        onClose();
                                                    }}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                {/* BOTTOM ACTION BAR */}
                {activePanel === null && (
                    <DialogFooter className="p-3 md:p-4 border-t border-border/40 bg-background/80 backdrop-blur-md flex-shrink-0 flex sm:justify-between flex-row items-center gap-2 z-20">
                        {onNavigateToDetail && (
                            <Button variant="outline" className="text-muted-foreground font-medium rounded-full px-4 sm:px-6 shadow-sm border-border/60 hover:bg-muted hidden sm:flex" onClick={() => {
                                onClose();
                                onNavigateToDetail(suratId);
                            }}>
                                Buka Detail
                            </Button>
                        )}
                        <div className="flex-1" />
                        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                            {canPerformAction.laporan && (
                                <Button className="rounded-full px-4 sm:px-6 shadow-md bg-green-600 hover:bg-green-700 text-white font-semibold flex-1 sm:flex-none whitespace-nowrap" onClick={() => setActivePanel('laporan')}>
                                    <ClipboardCheck className="mr-2 h-4 w-4" /> Lapor Tindak Lanjut
                                </Button>
                            )}
                            {canPerformAction.disposisi && (
                                <Button className="rounded-full px-4 sm:px-6 shadow-md bg-blue-600 hover:bg-blue-700 text-white font-semibold flex-1 sm:flex-none whitespace-nowrap" onClick={() => setActivePanel('disposisi')}>
                                    <Share className="mr-2 h-4 w-4" /> Disposisi Sekarang
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
