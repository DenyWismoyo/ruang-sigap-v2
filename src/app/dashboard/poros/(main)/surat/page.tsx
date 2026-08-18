// Lokasi: src/app/dashboard/surat/page.tsx
// Status: OPTIMIZED CACHE & DEBOUNCE
// [UPDATE LANGKAH 4]: 
// - Menambahkan state `searchInput` dan `debouncedSearchTerm` agar fungsi 
//   pencarian tidak membebani memori dan memicu filter loop di setiap ketikan.
// - Menambahkan import `useCallback` yang sebelumnya terlewat.

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserAuth } from '@/context/AuthContext';
import { useSuratData } from '@/app/dashboard/poros/hooks/useSuratData';
import { useMasterData } from '@/app/dashboard/poros/hooks/useMasterData';
import { useSuratDetail, fetchSuratLengkap } from '@/app/dashboard/poros/hooks/useSuratDetail'; 
import { useSuratActions, TindakLanjutPayload } from '@/app/dashboard/poros/hooks/useSuratActions'; 
import { useUserSuratSummary } from '@/app/dashboard/poros/hooks/useUserSummaries'; 
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext'; 
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { formatDateRelative } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { NkPageHeader } from '@/app/dashboard/poros/components/NkCard';

// Icons
import { 
  Inbox, Plus, FileText, User, Calendar, 
  Loader2, Search, ChevronDown, Users as UsersIcon, Activity,
  Clock, CheckCircle, MessageSquare, CornerDownRight,
  MoreVertical, Eye, Copy, Archive, ExternalLink, AlertTriangle,
  Palette, ListTodo, X, Maximize2, Minimize2, Save,
  Sparkles
} from 'lucide-react';

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; 
import { Label } from "@/components/ui/label"; 
import { Checkbox } from "@/components/ui/checkbox"; 
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { SkeletonCard } from '@/app/dashboard/poros/components/skeletons/SkeletonCard';
import { Surat, Disposisi, Jabatan } from '@/types'; 
import Avatar from '@/app/dashboard/poros/components/Avatar';
import PemantauanTab from './components/PemantauanTab';
import { getWarnaClass } from './[id]/components/TindakLanjutSection';

// Dynamic Import untuk PDF Viewer
const CachedPdfViewer = dynamic(() => import('@/app/dashboard/poros/(main)/surat/[id]/components/CachedPdfViewer'), { 
    ssr: false, 
    loading: () => <div className="h-full flex items-center justify-center bg-muted/30 rounded-lg"><Loader2 className="animate-spin text-primary" /></div> 
});

const PALETTE_COLORS = [
    { id: 'default', code: 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700' },
    { id: 'red', code: 'bg-red-200 dark:bg-red-900 border-red-300 dark:border-red-800' },
    { id: 'green', code: 'bg-emerald-200 dark:bg-emerald-900 border-emerald-300 dark:border-emerald-800' },
    { id: 'blue', code: 'bg-blue-200 dark:bg-blue-900 border-blue-300 dark:border-blue-800' },
    { id: 'yellow', code: 'bg-amber-200 dark:bg-amber-900 border-amber-300 dark:border-amber-800' },
    { id: 'purple', code: 'bg-purple-200 dark:bg-purple-900 border-purple-300 dark:border-purple-800' },
];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'Baru': return "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200/50";
        case 'Didisposisikan': return "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/50";
        case 'Proses Tindak Lanjut': return "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/50";
        case 'Selesai': return "bg-[var(--nk-surface-3)] text-[var(--nk-deep)] dark:bg-[var(--nk-teal-mid)]/20 dark:text-[var(--nk-teal-light)] border-[var(--nk-teal-light)]/30";
        case 'Revisi Disposisi': return "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/50";
        case 'Diarsipkan': return "bg-slate-50 text-slate-700 dark:bg-slate-900/50 dark:text-slate-300 border-slate-200/50";
        default: return "bg-slate-50 text-slate-700 border-slate-200/50";
    }
};

const getJenisSuratStyle = (jenis?: string) => {
    switch (jenis) {
       case 'Undangan': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300';
       case 'Pemberitahuan': return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300';
       case 'Permohonan': return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300';
       default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
   }
};

// --- Mobile Card ---
const SuratCard = React.memo(({ 
    surat, actionItem, recipientNames, onNavigate, onQuickTrack, 
    onQuickPreview, onQuickArchive, onCopyNomor, canArchive,
    onQuickAccept, onQuickReport, isActionProcessing, onPrefetch
}: any) => {
    const borderColorClass = 
        surat.statusPenyelesaian === 'Baru' ? 'border-l-red-500' : 
        surat.statusPenyelesaian === 'Didisposisikan' ? 'border-l-blue-500' :
        surat.statusPenyelesaian === 'Proses Tindak Lanjut' ? 'border-l-orange-500' :
        surat.statusPenyelesaian === 'Selesai' ? 'border-l-green-500' : 'border-l-gray-400';

    const safeRecipientNames = recipientNames ? Array.from(new Set(recipientNames.split(', ').map((s:string) => s.trim()))).join(', ') : null;

    return (
        <div 
            className={`nk-card flex flex-col h-fit overflow-hidden relative group transition-all duration-300 hover:shadow-[var(--nk-shadow-md)] hover:-translate-y-1 mb-4 ${borderColorClass}`}
            onMouseEnter={() => onPrefetch && onPrefetch(surat.id)}
        >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--nk-teal-light)] to-[var(--nk-teal-mid)] opacity-80"></div>
            <div className="p-3.5 md:p-4 cursor-pointer relative" onClick={onNavigate}>
                
                <div className="absolute top-2 right-2" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <MoreVertical size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Opsi Lainnya</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onQuickPreview(surat)}>
                                <Eye className="mr-2 h-4 w-4 text-blue-500" /> Pratinjau Surat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCopyNomor(surat.nomorSurat)}>
                                <Copy className="mr-2 h-4 w-4 text-muted-foreground" /> Salin Nomor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onNavigate}>
                                <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" /> Buka Detail Penuh
                            </DropdownMenuItem>
                            {canArchive && surat.statusPenyelesaian !== 'Diarsipkan' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onQuickArchive(surat)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                                        <Archive className="mr-2 h-4 w-4" /> Arsipkan
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex justify-between items-start mb-2 gap-2 pr-8 mt-1">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center text-[11px] text-[var(--nk-teal-mid)] font-bold truncate bg-[var(--nk-surface-3)] px-2 py-0.5 rounded-full border border-[var(--nk-teal-light)]/20 w-fit">
                            <User size={10} className="mr-1" />
                            <span className="truncate">{surat.pengirim}</span>
                        </div>
                        {surat.isLintasOpd && surat.statusLintasOpd === 'diterima' && (
                            <div className="flex items-center text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-300 w-fit">
                                <ExternalLink size={10} className="mr-1" />
                                Dari: {surat.sumberEksternalNama}
                            </div>
                        )}
                        {surat.isLintasOpd && surat.statusLintasOpd === 'dikirim' && (
                            <div className="flex items-center text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-300 w-fit">
                                <ExternalLink size={10} className="mr-1" />
                                Lintas OPD Ke: {surat.tujuanEksternalNama}
                            </div>
                        )}
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/50 px-1.5 py-0.5 rounded">
                        {surat.tanggalDiterima?.toDate ? surat.tanggalDiterima.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }) : 'N/A'}
                    </div>
                </div>

                <CardTitle className="text-sm leading-snug font-bold font-heading text-foreground mb-2 line-clamp-2 pr-2">
                    {surat.perihal}
                </CardTitle>

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <Badge className={`text-[10px] px-1.5 py-0 border leading-none h-5 ${getStatusColor(surat.statusPenyelesaian)}`} variant="outline">
                        {surat.statusPenyelesaian}
                    </Badge>
                    <span className={`text-[10px] px-1.5 py-0 border rounded h-5 flex items-center leading-none ${getJenisSuratStyle(surat.jenisSurat)}`}>
                        {surat.jenisSurat || 'Lainnya'}
                    </span>
                </div>

                {safeRecipientNames && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-md p-2 border border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                        <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-start text-[11px] md:text-xs text-muted-foreground">
                                <UsersIcon size={12} className="mr-1.5 mt-0.5 flex-shrink-0" />
                                <span className="leading-tight line-clamp-2">Kpda: <strong className="text-foreground font-medium">{safeRecipientNames}</strong></span>
                            </div>
                        </div>
                        {surat.statusPenyelesaian !== 'Baru' && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-6 px-2 text-[10px] shrink-0 text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800/50 dark:hover:bg-blue-900/20"
                                onClick={(e) => { e.stopPropagation(); onQuickTrack(surat); }}
                            >
                                <Activity size={12} className="mr-1" /> Pantau
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* --- AREA QUICK ACTIONS --- */}
            {actionItem?.needsAcknowledge && (
                <div className="bg-green-50 border-t border-green-200 p-2.5 dark:bg-green-900/20 dark:border-green-800">
                    <Button 
                        className="w-full bg-green-600 hover:bg-green-700 h-9 text-xs text-white shadow-sm"
                        onClick={(e) => { e.stopPropagation(); onQuickAccept(surat, actionItem.disposisi); }}
                        disabled={isActionProcessing}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" /> Saya Mengerti & Terima
                    </Button>
                </div>
            )}

            {actionItem?.needsTindakLanjut && (
                <div className="bg-blue-50 border-t border-blue-200 p-2.5 dark:bg-blue-900/20 dark:border-blue-800">
                    <Button 
                        variant="outline"
                        className="w-full h-9 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/50 bg-white dark:bg-background shadow-sm"
                        onClick={(e) => { e.stopPropagation(); onQuickReport(surat, actionItem.disposisi); }}
                    >
                        <MessageSquare className="mr-2 h-4 w-4" /> Lapor Tindak Lanjut
                    </Button>
                </div>
            )}
        </div>
    );
});
SuratCard.displayName = 'SuratCard';

// --- Desktop Row ---
const SuratRow = React.memo(({ 
    surat, actionItem, recipientNames, onClick, onNavigate, onQuickTrack, 
    onQuickPreview, onQuickArchive, onCopyNomor, canArchive,
    onQuickAccept, onQuickReport, isActionProcessing, onPrefetch
}: any) => {
    const safeRecipientNames = recipientNames ? Array.from(new Set(recipientNames.split(', ').map((s: string) => s.trim()))).join(', ') : null;

    return (
        <motion.tr 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01, zIndex: 10, position: 'relative' }}
            transition={{ duration: 0.2 }}
            className="group cursor-pointer"
            onClick={() => { onNavigate(); onClick(); }}
            onMouseEnter={() => onPrefetch && onPrefetch(surat.id)}
        >
            <td className="px-4 py-4 align-top w-1/4 font-medium text-sm">
                <div className="text-foreground hover:text-[var(--nk-teal-mid)] line-clamp-2 transition-colors">{surat.perihal}</div>
                {surat.ringkasanEksekutif && (
                    <div className="mt-2 text-xs bg-purple-50/50 border border-purple-100 rounded-md p-2 text-purple-900 flex items-start gap-1.5 shadow-sm">
                        <Sparkles size={12} className="text-purple-500 shrink-0 mt-0.5" />
                        <p className="leading-snug italic opacity-90 line-clamp-3">{surat.ringkasanEksekutif}</p>
                    </div>
                )}
                <p className="text-[11px] text-muted-foreground font-normal truncate mt-1">No: {surat.nomorSurat}</p>
            </td>
            <td className="px-4 py-4 align-top">
                <div className="flex flex-col gap-1 font-medium text-sm">
                    <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded-full bg-[var(--nk-surface-3)] text-[var(--nk-teal-mid)]"><User size={10} /></span>
                        <span className="line-clamp-2">{surat.pengirim}</span>
                    </div>
                    {surat.isLintasOpd && surat.statusLintasOpd === 'diterima' && (
                        <div className="flex items-center text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300 w-fit mt-1">
                            <ExternalLink size={10} className="mr-1" />
                            Dari: {surat.sumberEksternalNama}
                        </div>
                    )}
                    {surat.isLintasOpd && surat.statusLintasOpd === 'dikirim' && (
                        <div className="flex items-center text-[10px] text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded border border-purple-300 w-fit mt-1">
                            <ExternalLink size={10} className="mr-1" />
                            Lintas OPD Ke: {surat.tujuanEksternalNama}
                        </div>
                    )}
                </div>
            </td>
            <td className="px-4 py-4 align-top">
                <span className={`px-2 py-1 text-[10px] font-bold rounded-md border whitespace-nowrap uppercase tracking-wider ${getJenisSuratStyle(surat.jenisSurat)}`}>
                    {surat.jenisSurat || 'Lainnya'}
                </span>
            </td>
            <td className="px-4 py-4 align-top">
                <span className={`px-2 py-1 text-[10px] font-bold rounded-md border inline-block uppercase tracking-wider ${getStatusColor(surat.statusPenyelesaian)}`}>
                    {surat.statusPenyelesaian}
                </span>
            </td>
            <td className="px-4 py-4 align-top text-sm max-w-[200px]">
                {safeRecipientNames ? <span className="line-clamp-2">Kpda: {safeRecipientNames}</span> : <span className="text-[var(--nk-gold)] font-medium flex items-center gap-1.5 text-xs"><span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--nk-gold)] opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--nk-gold)]"></span></span> Belum didisposisi</span>}
            </td>
            
            <td className="px-4 py-4 align-top text-right">
                <div className="flex items-center justify-end gap-2">
                    <span className="text-sm text-muted-foreground whitespace-nowrap hidden lg:inline-block">
                        {surat.tanggalDiterima?.toDate ? surat.tanggalDiterima.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}
                    </span>
                    
                    {/* --- TOMBOL QUICK ACTIONS DESKTOP --- */}
                    {actionItem?.needsAcknowledge && (
                        <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 h-8 text-xs px-3 text-white shadow-sm"
                            onClick={(e) => { e.stopPropagation(); onQuickAccept(surat, actionItem.disposisi); }}
                            disabled={isActionProcessing}
                        >
                            <CheckCircle size={14} className="mr-1.5" /> Terima
                        </Button>
                    )}
                    
                    {actionItem?.needsTindakLanjut && (
                        <Button 
                            size="sm" variant="outline"
                            className="h-8 text-xs px-3 border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/50 bg-white dark:bg-background shadow-sm"
                            onClick={(e) => { e.stopPropagation(); onQuickReport(surat, actionItem.disposisi); }}
                            disabled={isActionProcessing}
                        >
                            <MessageSquare size={14} className="mr-1.5" /> Lapor
                        </Button>
                    )}

                    {surat.statusPenyelesaian !== 'Baru' && !actionItem && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Pantau Tindak Lanjut"
                            onClick={(e) => { e.stopPropagation(); onQuickTrack(surat); }}
                        >
                            <Activity size={16} />
                        </Button>
                    )}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Opsi Lainnya</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onQuickPreview(surat)}>
                                <Eye className="mr-2 h-4 w-4 text-blue-500" /> Pratinjau Surat
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCopyNomor(surat.nomorSurat)}>
                                <Copy className="mr-2 h-4 w-4 text-muted-foreground" /> Salin Nomor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { onNavigate(); onClick(); }}>
                                <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" /> Buka Detail Penuh
                            </DropdownMenuItem>
                            {canArchive && surat.statusPenyelesaian !== 'Diarsipkan' && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => onQuickArchive(surat)} className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                                        <Archive className="mr-2 h-4 w-4" /> Arsipkan
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </td>
        </motion.tr>
    );
});
SuratRow.displayName = 'SuratRow';

function QuickTrackContent({ surat, userMap, jabatanMap }: { surat: Surat, userMap: Map<string, any>, jabatanMap: Map<string, Jabatan> }) {
    const { disposisiList, tindakLanjutList, isLoading } = useSuratDetail(surat.id);

    if (isLoading) {
        return (
            <div className="py-10 flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Memuat data pantauan...</p>
            </div>
        );
    }

    if (disposisiList.length === 0 && tindakLanjutList.length === 0) {
        return (
            <div className="py-10 text-center text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>Belum ada aktivitas disposisi atau laporan.</p>
            </div>
        );
    }

    return (
        <ScrollArea className="h-[50vh] md:h-[60vh] pr-4">
            <div className="space-y-6 pb-4">
                {tindakLanjutList.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold mb-3 flex items-center text-foreground">
                            <MessageSquare size={14} className="mr-2 text-green-600" /> Laporan Tindak Lanjut
                        </h4>
                        <div className="space-y-3">
                            {tindakLanjutList.map(tl => {
                                const pelapor = userMap.get(tl.jabatanId);
                                const richTl = tl as any; 
                                return (
                                    <div key={tl.id} className={`border rounded-lg p-3 ${getWarnaClass(richTl.warnaLabel)}`}>
                                        <div className="flex justify-between items-start mb-1.5 opacity-80">
                                            <div className="flex items-center gap-2">
                                                <Avatar name={pelapor?.namaLengkap || '?'} className="h-5 w-5" />
                                                <span className="text-xs font-semibold">{pelapor?.namaLengkap || '...'}</span>
                                            </div>
                                            <span className="text-[10px]">
                                                {formatDateRelative(tl.tanggalLaporan)}
                                            </span>
                                        </div>
                                        {richTl.judulLaporan && <p className="font-bold text-sm mb-1">{richTl.judulLaporan}</p>}
                                        <div className="flex items-start">
                                            <CornerDownRight size={12} className="opacity-50 mr-1.5 mt-0.5 shrink-0" />
                                            <p className="text-sm italic opacity-90 leading-snug">"{tl.isiLaporan}"</p>
                                        </div>
                                        {richTl.checklist && richTl.checklist.length > 0 && (
                                            <div className="mt-2 pl-4 space-y-1">
                                                {richTl.checklist.map((item: any) => (
                                                    <div key={item.id} className="flex items-center gap-1.5 text-xs opacity-80">
                                                        <Checkbox checked={item.isDone} disabled className="h-3 w-3 rounded-[2px]" />
                                                        <span className={item.isDone ? 'line-through opacity-50' : ''}>{item.teks}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center text-foreground">
                        <UsersIcon size={14} className="mr-2 text-blue-600" /> Jejak Disposisi
                    </h4>
                    <div className="relative pl-2 ml-2 border-l-2 border-border space-y-4">
                        {disposisiList.map(d => (
                            <div key={d.id} className="relative">
                                <div className="absolute -left-[13px] top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                                <div className="pl-3">
                                    <p className="text-xs">
                                        <span className="font-semibold">{d.dariJabatanNama || userMap.get(d.dariJabatanId)?.namaLengkap || 'Atasan'}</span>
                                        <span className="text-muted-foreground"> disposisi ke:</span>
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {d.kepadaJabatanId.map(jId => {
                                            const jName = jabatanMap.get(jId)?.namaJabatan || 'Pegawai';
                                            const isDone = (d.penerimaSelesai || []).includes(jId);
                                            return (
                                                <Badge key={jId} variant="secondary" className={`text-[10px] px-1.5 py-0 ${isDone ? 'bg-green-100 text-green-700 border-green-200' : 'bg-muted'}`}>
                                                    {isDone && <CheckCircle size={10} className="mr-1" />}
                                                    {jName}
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}

// --- MAIN PAGE ---

export default function KotakMasukPage() {
    const router = useRouter();
    const pathname = usePathname();
    const { userProfile, actingJabatanProfile, jabatanProfile, loading: authLoading } = useUserAuth();
    const { addToast } = useToast();
    
    const { archiveSurat, terimaDisposisi, kirimTindakLanjut, isProcessing: isActionProcessing } = useSuratActions();
    const effectiveJabatanId = actingJabatanProfile?.id || jabatanProfile?.id;
    const queryClient = useQueryClient();

    const handlePrefetch = useCallback((id: string) => {
        queryClient.prefetchQuery({
            queryKey: ['suratDetailFull', id],
            queryFn: () => fetchSuratLengkap(id),
            staleTime: 1000 * 60 * 5 // 5 menit
        });
    }, [queryClient]);

    // Filter & UI State
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [jenisFilter, setJenisFilter] = useState('Semua');
    const [searchInput, setSearchInput] = useState(''); // State raw dari input
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(''); // State untuk difilter
    
    const [isNavigating, setIsNavigating] = useState(false);
    const [activeTab, setActiveTab] = useState('daftar-surat');

    // [OPTIMASI LANGKAH 4]: Debounce untuk Mencegah Re-render Ekstensif
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchInput);
        }, 300); // Tunda 300ms setelah user berhenti mengetik

        return () => clearTimeout(timerId);
    }, [searchInput]);

    // Mengambil data dengan state yang telah di-debounce
    const { 
        suratList, loading: dataLoading, hasMore, isMoreLoading, loadMore, refetch
    } = useSuratData({ 
        filterStatus: statusFilter, 
        filterJenis: jenisFilter, 
        searchTerm: debouncedSearchTerm, 
        isArchive: false 
    });

    const { actionableItems, mutate: refetchActionable } = useUserSuratSummary(effectiveJabatanId, suratList);
    const { userMap, jabatanMap } = useMasterData(true);
    
    // State Modal UI
    const [quickTrackSurat, setQuickTrackSurat] = useState<Surat | null>(null);
    const [quickPreviewSurat, setQuickPreviewSurat] = useState<Surat | null>(null);
    const [quickArchiveSurat, setQuickArchiveSurat] = useState<Surat | null>(null);

    // State Modal Laporan Cepat
    const [quickReportSurat, setQuickReportSurat] = useState<{surat: Surat, disposisi: Disposisi} | null>(null);
    const [quickIsExpanded, setQuickIsExpanded] = useState(false);
    const [quickJudul, setQuickJudul] = useState('');
    const [quickIsi, setQuickIsi] = useState('');
    const [quickWarna, setQuickWarna] = useState<'default' | 'red' | 'green' | 'blue' | 'yellow' | 'purple'>('default');
    const [quickIsChecklist, setQuickIsChecklist] = useState(false);
    const [quickChecklist, setQuickChecklist] = useState<{id: string, teks: string, isDone: boolean}[]>([]);
    const [quickNewChecklist, setQuickNewChecklist] = useState('');
    const [isMeetingMode, setIsMeetingMode] = useState(false);

    useEffect(() => {
        if (quickReportSurat) {
            const cacheKey = `tindakLanjut_quick_cache_${quickReportSurat.surat.id}`;
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    setQuickJudul(parsed.judulLaporan || '');
                    setQuickIsi(parsed.isiLaporan || '');
                    setQuickWarna(parsed.warnaLabel || 'default');
                    setQuickIsChecklist(parsed.isChecklistMode || false);
                    setQuickChecklist(parsed.checklistItems || []);
                    setQuickIsExpanded(parsed.isExpanded || false);
                } catch (e) {
                    console.error("Gagal membaca cache:", e);
                }
            }
        }
    }, [quickReportSurat]);

    useEffect(() => {
        if (quickReportSurat && (quickIsExpanded || quickIsi || quickJudul || quickChecklist.length > 0)) {
            const cacheKey = `tindakLanjut_quick_cache_${quickReportSurat.surat.id}`;
            const dataToCache = {
                judulLaporan: quickJudul,
                isiLaporan: quickIsi,
                warnaLabel: quickWarna,
                isChecklistMode: quickIsChecklist,
                checklistItems: quickChecklist,
                isExpanded: quickIsExpanded
            };
            localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
        }
    }, [quickJudul, quickIsi, quickWarna, quickIsChecklist, quickChecklist, quickIsExpanded, quickReportSurat]);

    useEffect(() => {
        setIsNavigating(false);
    }, [pathname]);

    const canCreate = userProfile?.role === 'staf_tu' || userProfile?.role === 'admin_opd';
    const canArchive = canCreate; 

    // Memoize pencarian aksi untuk mencegah komputasi berat dalam array.map
    const getActionItem = useCallback((suratId: string) => {
        return actionableItems.find(item => item.surat.id === suratId);
    }, [actionableItems]);

    const handleCopyNomor = useCallback((nomor: string) => {
        navigator.clipboard.writeText(nomor);
        addToast('Nomor surat berhasil disalin!', 'success');
    }, [addToast]);

    const handleConfirmArchive = async () => {
        if (!quickArchiveSurat) return;
        const success = await archiveSurat(quickArchiveSurat, 'Diarsipkan manual dari Quick Action Inbox');
        if (success) {
            setQuickArchiveSurat(null);
            refetch(); 
        }
    };

    const handleQuickAccept = useCallback(async (surat: Surat, disposisi: Disposisi) => {
        const success = await terimaDisposisi(disposisi, surat);
        if (success) {
            refetch(); 
            refetchActionable(); 
        }
    }, [terimaDisposisi, refetch, refetchActionable]);

    const handleQuickReport = useCallback((s: Surat, d: Disposisi) => {
        setQuickReportSurat({ surat: s, disposisi: d });
    }, []);

    const resetQuickReportForm = () => {
        setQuickReportSurat(null);
        setQuickIsExpanded(false);
        setQuickJudul('');
        setQuickIsi('');
        setQuickWarna('default');
        setQuickIsChecklist(false);
        setQuickChecklist([]);
        setQuickNewChecklist('');
        setIsMeetingMode(false);
    };

    const addQuickChecklistItem = () => {
        if (!quickNewChecklist.trim()) return;
        setQuickChecklist([...quickChecklist, { id: Date.now().toString(), teks: quickNewChecklist, isDone: false }]);
        setQuickNewChecklist('');
    };

    const handleQuickTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            
            const target = e.target as HTMLTextAreaElement;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const value = target.value;

            const lines = value.substring(0, start).split('\n');
            const currentLine = lines[lines.length - 1];

            if (currentLine.trim() === '-') {
                const newValue = value.substring(0, start - currentLine.length) + '\n' + value.substring(end);
                setQuickIsi(newValue);
                setTimeout(() => {
                    target.selectionStart = target.selectionEnd = start - currentLine.length + 1;
                }, 0);
            } else {
                const newValue = value.substring(0, start) + '\n- ' + value.substring(end);
                setQuickIsi(newValue);
                setTimeout(() => {
                    target.selectionStart = target.selectionEnd = start + 3;
                }, 0);
            }
        }
    };

    const submitQuickReport = async (isFinal: boolean) => {
        if (!quickReportSurat || (!quickIsi && quickChecklist.length === 0)) {
            addToast("Isi laporan tidak boleh kosong.", "error");
            return;
        }
        
        const payload: TindakLanjutPayload = {
            isiLaporan: quickIsi,
            judulLaporan: quickJudul,
            warnaLabel: quickWarna,
            checklist: quickChecklist
        };

        const success = await kirimTindakLanjut(
            quickReportSurat.surat,
            quickReportSurat.disposisi,
            payload,
            undefined, 
            { isFinalAction: isFinal }
        );

        if (success) {
            const cacheKey = `tindakLanjut_quick_cache_${quickReportSurat.surat.id}`;
            localStorage.removeItem(cacheKey);

            resetQuickReportForm();
            refetch();
            refetchActionable();
        }
    };

    if (authLoading) return <div className="p-8 text-center text-muted-foreground">Memuat...</div>;

    return (
        <div className="animate-fadeInUp pb-20 relative">
            
            {/* OVERLAY LOADING */}
            {isNavigating && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-border max-w-xs text-center animate-in zoom-in-95 duration-300">
                        <div className="p-4 bg-primary/10 rounded-full mb-4">
                            <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        </div>
                        <p className="text-lg font-bold text-foreground">Membuka Dokumen</p>
                        <p className="text-sm text-muted-foreground mt-2">Menyiapkan pratinjau surat dan data disposisi...</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <NkPageHeader 
                title="Kotak Masuk"
                subtitle="Kelola dan pantau seluruh surat masuk dan disposisi"
                icon={Inbox}
                actions={
                    canCreate ? (
                        <Link href="/dashboard/surat/upload" onClick={() => setIsNavigating(true)}>
                            <Button className="w-full md:w-auto bg-[var(--nk-teal-mid)] hover:bg-[var(--nk-deep)] shadow-sm text-white">
                                <Plus size={16} className="mr-2" /> Tambah Surat Baru
                            </Button>
                        </Link>
                    ) : undefined
                }
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                
                <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6 h-12">
                    <TabsTrigger value="daftar-surat" className="flex items-center gap-2 font-semibold">
                        <FileText size={16} /> Daftar Surat
                    </TabsTrigger>
                    <TabsTrigger value="pemantauan" className="flex items-center gap-2 font-semibold">
                        <Activity size={16} /> Pantau Laporan
                    </TabsTrigger>
                </TabsList>

                {/* --- TAB CONTENT 1: DAFTAR SURAT --- */}
                <TabsContent value="daftar-surat" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={`daftar-surat-${statusFilter}-${jenisFilter}`}
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -10 }} 
                            transition={{ duration: 0.2 }}
                        >
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                                placeholder="Cari perihal, nomor surat..." 
                                value={searchInput} 
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Semua">Semua Status</SelectItem>
                                    <SelectItem value="Baru">Baru</SelectItem>
                                    <SelectItem value="Didisposisikan">Didisposisikan</SelectItem>
                                    <SelectItem value="Proses Tindak Lanjut">Proses</SelectItem>
                                    <SelectItem value="Selesai">Selesai</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={jenisFilter} onValueChange={setJenisFilter}>
                                <SelectTrigger className="w-[160px]"><SelectValue placeholder="Jenis" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Semua">Semua Jenis</SelectItem>
                                    <SelectItem value="Undangan">Undangan</SelectItem>
                                    <SelectItem value="Pemberitahuan">Pemberitahuan</SelectItem>
                                    <SelectItem value="Permohonan">Permohonan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Content List */}
                    {dataLoading ? (
                        <div className="grid grid-cols-1 md:hidden gap-4">
                            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : suratList.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center justify-center nk-glass-card opacity-80 hover:opacity-100 transition-opacity mt-4">
                            <div className="w-24 h-24 mb-4 rounded-full bg-[var(--nk-surface-3)] flex items-center justify-center border border-[var(--nk-teal-light)]/20 shadow-inner relative">
                                <div className="absolute inset-0 bg-[var(--nk-teal-light)]/10 blur-xl rounded-full"></div>
                                <Inbox size={48} className="text-[var(--nk-teal-mid)]/60 relative z-10" />
                            </div>
                            <p className="font-heading font-semibold text-foreground/70 text-xl">Kotak Masuk Kosong</p>
                            <p className="text-sm text-muted-foreground mt-2">Tidak ada surat yang sesuai filter saat ini.</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile List */}
                            <div className="md:hidden space-y-4">
                                {suratList.map((surat, index) => {
                                    const actionItem = getActionItem(surat.id);
                                    return (
                                        <motion.div
                                            key={surat.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3, delay: index * 0.05 }}
                                        >
                                            <SuratCard 
                                                key={`card-${surat.id}`} surat={surat} 
                                                actionItem={actionItem}
                                                recipientNames={surat.infoTampilan?.recipientNames}
                                                onNavigate={() => { setIsNavigating(true); router.push(`/dashboard/surat/${surat.id}`); }} 
                                                onQuickTrack={setQuickTrackSurat}
                                                onQuickPreview={setQuickPreviewSurat}
                                                onQuickArchive={setQuickArchiveSurat}
                                                onCopyNomor={handleCopyNomor}
                                                onQuickAccept={handleQuickAccept}
                                                onQuickReport={handleQuickReport}
                                                isActionProcessing={isActionProcessing}
                                                canArchive={canArchive}
                                                onPrefetch={handlePrefetch}
                                            />
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block mt-4 pb-4 overflow-x-auto">
                                <div className="nk-table-wrapper">
                                    <table className="nk-table">
                                        <thead>
                                            <tr>
                                                <th>Perihal / Nomor</th>
                                                <th>Pengirim</th>
                                                <th>Jenis</th>
                                                <th>Status</th>
                                                <th>Info Disposisi</th>
                                                <th className="text-right">Aksi / Tgl</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {suratList.map(surat => {
                                            const actionItem = getActionItem(surat.id);
                                            return (
                                                <SuratRow 
                                                    key={surat.id} surat={surat} 
                                                    actionItem={actionItem}
                                                    recipientNames={surat.infoTampilan?.recipientNames}
                                                    onClick={() => router.push(`/dashboard/surat/${surat.id}`)}
                                                    onNavigate={() => setIsNavigating(true)} 
                                                    onQuickTrack={setQuickTrackSurat} 
                                                    onQuickPreview={setQuickPreviewSurat}
                                                    onQuickArchive={setQuickArchiveSurat}
                                                    onCopyNomor={handleCopyNomor}
                                                    onQuickAccept={handleQuickAccept}
                                                    onQuickReport={handleQuickReport}
                                                    isActionProcessing={isActionProcessing}
                                                    canArchive={canArchive}
                                                    onPrefetch={handlePrefetch}
                                                />
                                            );
                                        })}
                                    </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                            {hasMore && (
                                <div className="flex justify-center mb-8">
                                    <Button variant="outline" onClick={() => loadMore()} disabled={isMoreLoading}>
                                        {isMoreLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronDown className="mr-2 h-4 w-4" />}
                                        Tampilkan Lebih Banyak
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </TabsContent>

                {/* --- TAB CONTENT 2: PEMANTAUAN --- */}
                <TabsContent value="pemantauan" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key="pemantauan-tab"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <PemantauanTab onNavigate={() => setIsNavigating(true)} />
                        </motion.div>
                    </AnimatePresence>
                </TabsContent>

            </Tabs>

            {/* --- MODAL QUICK TRACK --- */}
            <Dialog open={!!quickTrackSurat} onOpenChange={(open) => !open && setQuickTrackSurat(null)}>
                <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-xl sm:rounded-2xl rounded-none backdrop-blur-xl bg-card/95 border-border/40 shadow-2xl flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4 border-b border-border bg-card z-10 shrink-0">
                        <DialogTitle className="flex items-start gap-2 text-left">
                            <Activity className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-tight">Pantau: {quickTrackSurat?.perihal}</span>
                        </DialogTitle>
                        <DialogDescription className="text-left mt-1">
                            Status saat ini: <span className="font-semibold text-foreground">{quickTrackSurat?.statusPenyelesaian}</span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    {quickTrackSurat && (
                        <QuickTrackContent 
                            surat={quickTrackSurat} 
                            userMap={userMap} 
                            jabatanMap={jabatanMap} 
                        />
                    )}

                    <div className="p-4 sm:p-6 pt-4 border-t border-border flex justify-end gap-2 bg-card mt-auto shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <Button variant="outline" onClick={() => setQuickTrackSurat(null)}>Tutup</Button>
                        <Button onClick={() => {
                            setQuickTrackSurat(null);
                            setIsNavigating(true);
                            router.push(`/dashboard/surat/${quickTrackSurat?.id}`);
                        }}>
                            Buka Detail Surat
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* --- MODAL QUICK PREVIEW PDF --- */}
            <Dialog open={!!quickPreviewSurat} onOpenChange={(open) => !open && setQuickPreviewSurat(null)}>
                <DialogContent className="w-full h-[100dvh] sm:max-w-4xl sm:w-[95vw] sm:h-[90vh] sm:rounded-2xl rounded-none backdrop-blur-xl bg-card/95 border-border/40 shadow-2xl p-0 gap-0 flex flex-col overflow-hidden">
                    <DialogHeader className="p-4 border-b border-border bg-muted/30 flex-shrink-0">
                        <DialogTitle className="flex items-start gap-2 text-left pr-6">
                            <Eye className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                            <div className="flex flex-col min-w-0">
                                <span className="line-clamp-1 leading-tight text-base">{quickPreviewSurat?.perihal}</span>
                                <span className="text-xs text-muted-foreground font-normal mt-1 truncate">{quickPreviewSurat?.nomorSurat}</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="flex-1 bg-muted/10 relative">
                        {quickPreviewSurat && (
                            <CachedPdfViewer 
                                fileUrl={quickPreviewSurat.fileUrl} 
                                fileName={quickPreviewSurat.fileName} 
                            />
                        )}
                    </div>

                    <DialogFooter className="p-3 border-t border-border bg-card flex-shrink-0 sm:justify-between flex-row">
                        <Button variant="ghost" className="text-muted-foreground" onClick={() => setQuickPreviewSurat(null)}>Tutup</Button>
                        <Button onClick={() => {
                            setQuickPreviewSurat(null);
                            setIsNavigating(true);
                            router.push(`/dashboard/surat/${quickPreviewSurat?.id}`);
                        }}>
                            Tindak Lanjuti Surat Ini
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MODAL QUICK ARCHIVE --- */}
            <Dialog open={!!quickArchiveSurat} onOpenChange={(open) => !open && setQuickArchiveSurat(null)}>
                <DialogContent className="w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl backdrop-blur-xl bg-card/95 border-border/40 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Konfirmasi Arsip Cepat
                        </DialogTitle>
                        <DialogDescription className="mt-2 text-foreground">
                            Anda akan memindahkan surat ini ke folder Arsip (hanya terlihat oleh Admin/TU). Surat tidak akan dihapus.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {quickArchiveSurat && (
                        <div className="p-3 bg-muted/50 rounded-md border border-border mt-2">
                            <p className="text-sm font-semibold line-clamp-2">{quickArchiveSurat.perihal}</p>
                            <p className="text-xs text-muted-foreground mt-1">{quickArchiveSurat.nomorSurat}</p>
                        </div>
                    )}

                    <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
                        <Button variant="outline" onClick={() => setQuickArchiveSurat(null)} disabled={isActionProcessing}>Batal</Button>
                        <Button variant="destructive" onClick={handleConfirmArchive} disabled={isActionProcessing}>
                            {isActionProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
                            Ya, Arsipkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MODAL QUICK REPORT --- */}
            <Dialog open={!!quickReportSurat} onOpenChange={(open) => !open && resetQuickReportForm()}>
                <DialogContent className={`${isMeetingMode ? '!w-screen !h-[100dvh] !max-w-none !m-0 !p-0 !rounded-none border-0 backdrop-blur-none bg-card' : 'w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl rounded-none backdrop-blur-xl bg-card/95 border-border/40 shadow-2xl'} p-0 overflow-hidden flex flex-col transition-all duration-300`}>
                    <DialogHeader className="px-4 py-3 sm:px-5 sm:pt-5 sm:pb-3 bg-gradient-to-r from-[var(--nk-teal-mid)]/10 to-transparent border-b border-border/50 flex flex-row items-start justify-between shrink-0">
                        <div className="flex-1 pr-4">
                            <DialogTitle className="flex items-center gap-3 text-foreground font-heading">
                                <div className="p-2 bg-[var(--nk-teal-mid)]/10 rounded-xl">
                                    <MessageSquare className="h-5 w-5 text-[var(--nk-teal-mid)]" />
                                </div>
                                {isMeetingMode ? 'Catatan Rapat' : 'Laporan Cepat'}
                            </DialogTitle>
                            <DialogDescription className="line-clamp-2 mt-1">
                                Surat: <strong className="text-foreground">{quickReportSurat?.surat.perihal}</strong>
                            </DialogDescription>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex text-muted-foreground hover:text-foreground h-8 px-2 md:px-3 bg-muted/50 md:bg-transparent"
                            onClick={() => setIsMeetingMode(!isMeetingMode)}
                            title={isMeetingMode ? "Keluar Mode Rapat" : "Mode Rapat (Layar Penuh)"}
                        >
                            {isMeetingMode ? <Minimize2 size={16} className="md:mr-2" /> : <Maximize2 size={16} className="md:mr-2" />}
                            <span className="hidden md:inline">{isMeetingMode ? 'Keluar Mode' : 'Mode Rapat'}</span>
                        </Button>
                    </DialogHeader>
                    
                    {quickReportSurat && (
                        <div className={`${isMeetingMode ? 'p-0' : 'p-4 md:p-5'} flex-1 flex flex-col bg-background ${isMeetingMode ? 'overflow-hidden' : ''}`}>
                            {!isMeetingMode && (
                                <div className="p-3 mb-4 bg-[var(--nk-gold)]/5 border border-[var(--nk-gold)]/20 rounded-xl text-sm text-foreground relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[var(--nk-gold)]/50"></div>
                                    <span className="text-[11px] font-bold tracking-wider text-[var(--nk-gold)] block mb-1 uppercase">Instruksi Atasan</span>
                                    <span className="italic font-medium text-foreground/90">"{quickReportSurat.disposisi.instruksi}"</span>
                                </div>
                            )}
                            
                            {/* --- FORM KEEP NOTE INTERAKTIF --- */}
                            <div className={`${isMeetingMode ? 'border-0 rounded-none' : 'border rounded-xl shadow-sm'} transition-colors duration-300 focus-within:ring-2 focus-within:ring-primary/20 flex-1 flex flex-col ${getWarnaClass(quickWarna)}`}>
                                {/* Judul */}
                                {(quickIsExpanded || quickJudul || isMeetingMode) && (
                                    <div className="px-4 pt-3 flex-shrink-0">
                                        <Input 
                                            placeholder={isMeetingMode ? "Judul Catatan Rapat..." : "Judul Laporan (Opsional)"}
                                            value={quickJudul}
                                            onChange={(e) => setQuickJudul(e.target.value)}
                                            className={`border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 h-auto ${isMeetingMode ? 'text-xl md:text-2xl font-bold px-4 pt-2' : 'text-base font-bold'}`} 
                                        />
                                    </div>
                                )}
                                
                                <div className={`p-4 flex-1 flex flex-col ${isMeetingMode ? 'overflow-y-auto' : ''}`}>
                                    {quickIsChecklist ? (
                                        <div className="space-y-2 flex-1">
                                            {quickChecklist.map(item => (
                                                <div key={item.id} className="flex items-center gap-2 group">
                                                    <Checkbox 
                                                        checked={item.isDone} 
                                                        onCheckedChange={(checked) => setQuickChecklist(prev => prev.map(i => i.id === item.id ? {...i, isDone: !!checked} : i))}
                                                        className="border-current data-[state=checked]:bg-current data-[state=checked]:text-background"
                                                    />
                                                    <Input 
                                                        value={item.teks} 
                                                        onChange={(e) => setQuickChecklist(prev => prev.map(i => i.id === item.id ? {...i, teks: e.target.value} : i))} 
                                                        className={`border-0 border-b border-transparent hover:border-current/20 focus-visible:border-current/50 bg-transparent rounded-none px-1 h-7 shadow-none focus-visible:ring-0 ${item.isDone ? 'line-through opacity-60' : ''}`} 
                                                    />
                                                    <Button variant="ghost" size="icon" onClick={() => setQuickChecklist(prev => prev.filter(i => i.id !== item.id))} className="opacity-0 group-hover:opacity-100 h-6 w-6"><X size={14}/></Button>
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-2 pt-1 border-t border-current/10">
                                                <Plus size={16} className="opacity-50 ml-0.5 shrink-0" />
                                                <Input 
                                                    placeholder="Ketik item baru lalu tekan Enter..." 
                                                    value={quickNewChecklist}
                                                    onChange={(e) => setQuickNewChecklist(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addQuickChecklistItem(); } }}
                                                    className="border-0 bg-transparent px-1 h-7 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 flex-1" 
                                                />
                                                <Button size="sm" variant="ghost" onClick={addQuickChecklistItem} className="h-7 text-xs px-2" disabled={!quickNewChecklist.trim()}>Tambah</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Textarea 
                                            value={quickIsi} 
                                            onChange={e => setQuickIsi(e.target.value)} 
                                            onClick={() => setQuickIsExpanded(true)}
                                            onKeyDown={handleQuickTextareaKeyDown} 
                                            placeholder={quickIsExpanded || isMeetingMode ? "Ketik catatan Anda di sini..." : "Tuliskan progres/laporan di sini..."} 
                                            className={`border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 resize-none placeholder:text-muted-foreground/70 flex-1 ${isMeetingMode ? 'min-h-[50vh] text-base leading-relaxed px-4' : 'min-h-[80px]'}`} 
                                        />
                                    )}
                                </div>

                                {/* Footer Note Controls */}
                                {(quickIsExpanded || quickIsi || quickChecklist.length > 0 || isMeetingMode) && (
                                    <div className="flex items-center justify-between p-2 border-t border-current/10 bg-black/5 dark:bg-white/5 flex-shrink-0">
                                        <div className="flex gap-1">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-current/10 rounded-full">
                                                        <Palette size={16} className="opacity-70" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent align="start" className="w-auto p-2 flex gap-2">
                                                    {PALETTE_COLORS.map(c => (
                                                        <button 
                                                            key={c.id} 
                                                            onClick={() => setQuickWarna(c.id as any)} 
                                                            className={`w-6 h-6 rounded-full border-2 ${c.code} ${quickWarna === c.id ? 'ring-2 ring-offset-2 ring-primary' : 'border-transparent hover:scale-110'}`}
                                                        />
                                                    ))}
                                                </PopoverContent>
                                            </Popover>
                                            
                                            <Button 
                                                variant="ghost" size="icon" 
                                                className={`h-8 w-8 rounded-full hover:bg-current/10 ${quickIsChecklist ? 'bg-current/10' : ''}`} 
                                                onClick={() => setQuickIsChecklist(!quickIsChecklist)}
                                                title="Mode Daftar Centang"
                                            >
                                                <ListTodo size={16} className="opacity-70" />
                                            </Button>
                                        </div>
                                        
                                        <div className="text-[10px] opacity-80 pr-2 flex flex-col items-end gap-1">
                                            {isMeetingMode && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-200 font-semibold">Mode Rapat Aktif</span>}
                                            <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                                <Save size={10} /> Auto-save aktif
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className={`px-5 pb-5 pt-3 bg-background border-t-0 flex-col sm:flex-row gap-2 ${isMeetingMode ? 'border-t border-border' : ''}`}>
                        <Button 
                            variant="outline" 
                            onClick={() => submitQuickReport(false)}
                            disabled={(quickIsi.trim() === '' && quickChecklist.length === 0) || isActionProcessing}
                            className="w-full sm:w-auto text-[var(--nk-teal-mid)] border-[var(--nk-teal-mid)]/30 hover:bg-[var(--nk-teal-mid)]/10 hover:text-[var(--nk-teal-mid)]"
                        >
                            Kirim {isMeetingMode ? 'Catatan' : 'Progres'}
                        </Button>
                        <Button 
                            className="w-full sm:w-auto bg-gradient-to-r from-[var(--nk-gradient-start)] to-[var(--nk-gradient-end)] text-white shadow-md hover:shadow-lg transition-all border-none" 
                            onClick={() => submitQuickReport(true)}
                            disabled={(quickIsi.trim() === '' && quickChecklist.length === 0) || isActionProcessing}
                        >
                            Kirim & Selesai
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
