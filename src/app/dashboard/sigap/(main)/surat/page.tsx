// @ts-nocheck
// Lokasi: src/app/dashboard/surat/page.tsx
// Status: OPTIMIZED CACHE & DEBOUNCE
// [UPDATE LANGKAH 4]: 
// - Menambahkan state `searchInput` dan `debouncedSearchTerm` agar fungsi 
//   pencarian tidak membebani memori dan memicu filter loop di setiap ketikan.
// - Menambahkan import `useCallback` yang sebelumnya terlewat.

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUserAuth } from '@/context/AuthContext';
import { useSuratData } from '@/app/dashboard/sigap/hooks/useSuratData';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData';
import { useSuratDetail, fetchSuratLengkap } from '@/app/dashboard/sigap/hooks/useSuratDetail'; 
import { useSuratActions, TindakLanjutPayload } from '@/app/dashboard/sigap/hooks/useSuratActions'; 
import { useUserSuratSummary } from '@/app/dashboard/sigap/hooks/useUserSummaries'; 
import { useQuickReport } from '@/context/QuickReportContext'; // [BARU] Global Quick Report
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/context/ToastContext'; 
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { formatDateRelative } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Icons
import { 
  Inbox, Plus, FileText, User, Calendar, 
  Loader2, Search, ChevronDown, Users as UsersIcon, Activity,
  Clock, CheckCircle, MessageSquare, CornerDownRight,
  MoreVertical, Eye, Copy, Archive, ExternalLink, AlertTriangle,
  Palette, ListTodo, X, Maximize2, Minimize2, Save, Info
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

import { SkeletonCard } from '@/app/dashboard/sigap/components/skeletons/SkeletonCard';
import SigapPageHeader from '@/app/dashboard/sigap/components/SigapPageHeader';
import { Surat, Disposisi, Jabatan } from '@/types'; 
import Avatar from '@/app/dashboard/sigap/components/Avatar';
import PemantauanTab from './components/PemantauanTab';
import { getWarnaClass } from './[id]/components/TindakLanjutSection';
import UniversalPreviewModal from '@/app/dashboard/sigap/components/UniversalPreviewModal';

// Dynamic Import untuk PDF Viewer (Lama - Tidak Dipakai Lagi)
const CachedPdfViewer = dynamic(() => import('@/app/dashboard/sigap/(main)/surat/[id]/components/CachedPdfViewer'), { 
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
        case 'Baru': return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 hover:bg-red-200";
        case 'Didisposisikan': return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 hover:bg-blue-200";
        case 'Proses Tindak Lanjut': return "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border-orange-200 hover:bg-orange-200";
        case 'Selesai': return "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-200 hover:bg-green-200";
        case 'Revisi Disposisi': return "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200 border-purple-200 hover:bg-purple-200";
        case 'Diarsipkan': return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 hover:bg-gray-200";
        default: return "bg-gray-100 text-gray-800 border-gray-200";
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
    const gradientClass = 
        surat.statusPenyelesaian === 'Baru' ? 'bg-gradient-to-b from-red-500 to-rose-400' : 
        surat.statusPenyelesaian === 'Didisposisikan' ? 'bg-gradient-to-b from-blue-500 to-cyan-400' :
        surat.statusPenyelesaian === 'Proses Tindak Lanjut' ? 'bg-gradient-to-b from-orange-500 to-amber-400' :
        surat.statusPenyelesaian === 'Selesai' ? 'bg-gradient-to-b from-emerald-500 to-teal-400' : 'bg-gradient-to-b from-slate-400 to-gray-300';

    const safeRecipientNames = recipientNames ? Array.from(new Set(recipientNames.split(', ').map((s:string) => s.trim()))).join(', ') : null;

    const isBaru = surat.statusPenyelesaian === 'Baru';
    // Gunakan background transparan di mobile agar benar-benar menyatu dengan background halaman
    const bgClass = isBaru ? 'bg-background md:bg-card' : 'bg-background md:bg-slate-50/70 dark:md:bg-muted/10';

    return (
        <Card className={`sg-glass-panel sg-mobile-borderless md:hover:-translate-y-[1px] md:hover:shadow-md transition-all duration-200 overflow-hidden sg-animate-in relative border-b border-border/30`} onMouseEnter={() => onPrefetch && onPrefetch(surat.id)}>
            {/* Accent Strip Penanda Status (Gradient) */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 md:w-1 ${gradientClass}`} />
            
            <div className="p-4 md:p-4 pl-5 md:pl-5 cursor-pointer relative" onClick={onNavigate}>
                
                <div className="absolute top-2 right-2 flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-full">
                                <MoreVertical size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Opsi Lainnya</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => onCopyNomor(surat.nomorSurat)}>
                                <Copy className="mr-2 h-4 w-4 text-muted-foreground" /> Salin Nomor
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onNavigate}>
                                <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" /> Buka Detail Penuh
                            </DropdownMenuItem>
                            
                            {/* Tindak Lanjut Cepat - Tampilkan HANYA jika surat ini didisposisikan KE user ini dan BUKAN Baru/Selesai */}
                            {surat.statusPenyelesaian === 'Didisposisikan' && actionItem && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={onQuickAccept} className="text-blue-600 focus:text-blue-600 focus:bg-blue-50">
                                        <CheckCircle className="mr-2 h-4 w-4" /> Terima & Tindak Lanjuti
                                    </DropdownMenuItem>
                                </>
                            )}

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

                <div className="flex justify-between items-start mb-1.5 gap-2 pr-8">
                    <div className="flex items-center text-[11px] text-muted-foreground font-medium truncate min-w-0 flex-1">
                        <span className="truncate">Dr: {surat.pengirim}</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/50 px-1.5 py-0.5 rounded">
                        {surat.tanggalDiterima?.toDate ? surat.tanggalDiterima.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' }) : 'N/A'}
                    </div>
                </div>

                <CardTitle className="text-sm leading-snug font-semibold text-foreground mb-2 line-clamp-2 pr-2">
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

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 mt-2 border-t border-border/40">
                    <span className="flex items-center truncate mr-2">
                        {safeRecipientNames ? (
                            <>
                                <UsersIcon size={11} className="mr-1 flex-shrink-0" />
                                Kpda:&nbsp;<strong className="text-foreground font-medium truncate">{safeRecipientNames}</strong>
                            </>
                        ) : (
                            <span className="italic opacity-70">Tidak ada penerima khusus</span>
                        )}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-[10px] text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={(e) => { e.stopPropagation(); onQuickPreview(surat); }}
                        >
                            Pratinjau
                        </Button>
                        {surat.statusPenyelesaian !== 'Baru' && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-[10px] text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                onClick={(e) => { e.stopPropagation(); onQuickTrack(surat); }}
                            >
                                <Activity size={12} className="mr-1" /> Pantau
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- AREA QUICK ACTIONS --- */}
            {actionItem?.needsAcknowledge && (
                <div className="bg-green-50/50 border-t border-green-200/40 p-2 dark:bg-green-900/10 dark:border-green-800/50">
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
                <div className="bg-blue-50 border-t border-blue-100 p-2 dark:bg-blue-950/30 dark:border-blue-900/50">
                    <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 h-9 text-xs text-white shadow-sm"
                        onClick={(e) => { e.stopPropagation(); onQuickReport(surat, actionItem.disposisi); }}
                    >
                        <MessageSquare className="mr-2 h-4 w-4" /> Lapor Tindak Lanjut
                    </Button>
                </div>
            )}
        </Card>
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
        <TableRow className="sg-table-row group cursor-pointer" onClick={onClick} onMouseEnter={() => onPrefetch && onPrefetch(surat.id)}>
            <TableCell className="font-semibold cursor-pointer" onClick={() => { onNavigate(); onClick(); }}>
                <div className="text-primary hover:underline line-clamp-2">{surat.perihal}</div>
                <p className="text-xs text-muted-foreground font-normal truncate">{surat.nomorSurat}</p>
            </TableCell>
            <TableCell className="cursor-pointer" onClick={() => { onNavigate(); onClick(); }}>{surat.pengirim}</TableCell>
            <TableCell className="cursor-pointer" onClick={() => { onNavigate(); onClick(); }}>
                <span className={`px-2 py-1 text-xs font-medium rounded border whitespace-nowrap ${getJenisSuratStyle(surat.jenisSurat)}`}>
                    {surat.jenisSurat || 'Lainnya'}
                </span>
            </TableCell>
            <TableCell className="cursor-pointer" onClick={() => { onNavigate(); onClick(); }}>
                <Badge className={`border ${getStatusColor(surat.statusPenyelesaian)}`} variant="outline">
                    {surat.statusPenyelesaian}
                </Badge>
            </TableCell>
            <TableCell className="text-sm max-w-[200px] truncate cursor-pointer" onClick={() => { onNavigate(); onClick(); }}>
                {safeRecipientNames ? <span className="truncate">Kepada: {safeRecipientNames}</span> : <span className="text-muted-foreground italic">Belum didisposisi</span>}
            </TableCell>
            
            <TableCell className="text-right">
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
                            size="sm"
                            className="h-8 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
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
            </TableCell>
        </TableRow>
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
                                            const snapshotList = (d as any).penerimaSnapshot || [];
                                            const snapshotUser = snapshotList.find((p: any) => p.jabatanId === jId);
                                            const jName = snapshotUser ? snapshotUser.nama : (jabatanMap.get(jId)?.namaJabatan || 'Pegawai');
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
            staleTime: 1000 * 60 * 5
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
    const { openQuickReport } = useQuickReport(); // [BARU] Gunakan global state
    
    // State Modal UI
    const [quickTrackSurat, setQuickTrackSurat] = useState<Surat | null>(null);
    const [quickPreviewSurat, setQuickPreviewSurat] = useState<Surat | null>(null);
    const [quickArchiveSurat, setQuickArchiveSurat] = useState<Surat | null>(null);
    const [showTutorial, setShowTutorial] = useState(false);

    useEffect(() => {
        setIsNavigating(false);
        if (typeof window !== 'undefined') {
            const lastSeen = localStorage.getItem('surat_tutorial_last_seen');
            const today = new Date().toLocaleDateString('id-ID');
            if (lastSeen !== today) {
                setShowTutorial(true);
            }
        }
    }, [pathname]);

    const dismissTutorial = useCallback(() => {
        const today = new Date().toLocaleDateString('id-ID');
        localStorage.setItem('surat_tutorial_last_seen', today);
        setShowTutorial(false);
    }, []);

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
        openQuickReport(s, d);
    }, [openQuickReport]);

    if (authLoading) return <div className="p-8 text-center text-muted-foreground">Memuat...</div>;

    return (
        <div className="animate-fadeInUp pb-6 md:pb-0 relative">
            
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
            <div className="px-4 md:px-0">
                <SigapPageHeader 
                    title="Kotak Masuk"
                    icon={Inbox}
                    actions={
                        canCreate && (
                            <Link href="/dashboard/surat/upload" className="hidden md:block" onClick={() => setIsNavigating(true)}>
                                <Button className="w-full md:w-auto sg-btn sg-btn-success text-white">
                                    <Plus size={16} className="mr-2" /> Tambah Surat Baru
                                </Button>
                            </Link>
                        )
                    }
                />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                
                <div className="px-4 md:px-0">
                    <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6 h-12">
                        <TabsTrigger value="daftar-surat" className="flex items-center gap-2 font-semibold">
                            <FileText size={16} /> Daftar Surat
                        </TabsTrigger>
                        <TabsTrigger value="pemantauan" className="flex items-center gap-2 font-semibold">
                            <Activity size={16} /> Pantau Laporan
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* --- TAB CONTENT 1: DAFTAR SURAT --- */}
                <TabsContent value="daftar-surat" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    
                    {/* Tutorial Card */}
                    {showTutorial && (
                        <div className="mx-4 md:mx-0 mb-6 p-4 bg-blue-600 text-white rounded-xl shadow-md relative animate-in fade-in zoom-in-95 duration-300">
                            <button onClick={dismissTutorial} className="absolute top-3 right-3 text-blue-200 hover:text-white transition-colors" title="Tutup">
                                <X size={16} />
                            </button>
                            <h3 className="font-bold mb-3 flex items-center gap-2 text-base">
                                <Info size={18} /> Cara Penggunaan
                            </h3>
                            <p className="text-sm mb-4 text-blue-50">
                                Fitur <strong>Kotak Masuk</strong> membantu Anda berkolaborasi, menindaklanjuti, dan memantau disposisi surat dengan cepat.
                            </p>
                            <div className="bg-blue-700/50 rounded-lg p-3 space-y-3 text-[13px] text-blue-50">
                                <div className="flex items-start gap-2.5">
                                    <CornerDownRight size={16} className="mt-0.5 shrink-0 text-amber-300" /> 
                                    <span><strong>Mendisposisi:</strong> (Khusus Pimpinan) Mengirimkan arahan ke bawahan. Klik <em>Pratinjau</em> lalu <em>Disposisi Sekarang</em>.</span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-300" /> 
                                    <span><strong>Terima & Tindak Lanjuti:</strong> Konfirmasi bahwa Anda telah membaca instruksi dari atasan Anda.</span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <MessageSquare size={16} className="mt-0.5 shrink-0 text-blue-300" /> 
                                    <span><strong>Lapor Tindak Lanjut:</strong> Kirimkan laporan atau progres dari pekerjaan yang diinstruksikan kepada Anda.</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="sg-filter-bar sg-mobile-borderless mb-6">
                        <div className="relative flex-1">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input 
                                placeholder="Cari perihal, nomor surat..." 
                                value={searchInput} 
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="hidden md:flex gap-2">
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
                        {/* Mobile Filter Chips */}
                        <div className="md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-none items-center">
                            {["Semua", "Baru", "Didisposisikan", "Proses Tindak Lanjut", "Selesai"].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-sm text-[11px] font-medium whitespace-nowrap border transition-colors ${
                                        statusFilter === status 
                                            ? 'bg-primary text-primary-foreground border-primary' 
                                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                    }`}
                                >
                                    {status === "Semua" ? "Semua Status" : status === "Proses Tindak Lanjut" ? "Proses" : status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content List */}
                    {dataLoading ? (
                        <div className="flex flex-col md:grid md:grid-cols-1 gap-0 md:gap-4">
                            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : suratList.length === 0 ? (
                        <div className="mx-4 md:mx-0 text-center py-16 text-muted-foreground bg-card rounded-xl border-2 border-dashed border-border">
                            <Inbox size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                            <p className="font-semibold">Kotak masuk kosong.</p>
                            <p className="text-sm">Tidak ada surat yang sesuai filter.</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile List */}
                            <div className="md:hidden flex flex-col space-y-0">
                                {suratList.map(surat => {
                                    const actionItem = getActionItem(surat.id);
                                    return (
                                        <SuratCard 
                                            key={surat.id} surat={surat} 
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
                                    );
                                })}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block w-full">
                                <Table className="sg-table border-none shadow-none">
                                    <TableHeader className="sg-table-header">
                                        <TableRow>
                                            <TableHead className="font-bold">Perihal / Nomor</TableHead>
                                            <TableHead className="font-bold">Pengirim</TableHead>
                                            <TableHead className="font-bold">Jenis</TableHead>
                                            <TableHead className="font-bold">Status</TableHead>
                                            <TableHead className="font-bold">Info Disposisi</TableHead>
                                            <TableHead className="font-bold text-right">Aksi / Tgl</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
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
                                    </TableBody>
                                </Table>
                            </div>

                            {hasMore && (
                                <div className="flex justify-center mt-6 mb-8">
                                    <Button variant="outline" onClick={() => loadMore()} disabled={isMoreLoading} className="w-full md:w-auto shadow-sm">
                                        {isMoreLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <ChevronDown className="mr-2 h-4 w-4"/>}
                                        {isMoreLoading ? 'Memuat...' : 'Muat Lebih Banyak'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* --- TAB CONTENT 2: PEMANTAUAN --- */}
                <TabsContent value="pemantauan" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                    <PemantauanTab onNavigate={() => setIsNavigating(true)} />
                </TabsContent>

            </Tabs>

            {/* --- MODAL QUICK TRACK --- */}
            <Dialog open={!!quickTrackSurat} onOpenChange={(open) => !open && setQuickTrackSurat(null)}>
                <DialogContent className="sm:max-w-xl bg-card border-border">
                    <DialogHeader className="pb-4 border-b border-border">
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

                    <div className="pt-4 border-t border-border flex justify-end gap-2">
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

            {/* --- MODAL QUICK PREVIEW UNIVERSAL --- */}
            <UniversalPreviewModal 
                suratId={quickPreviewSurat?.id || null} 
                isOpen={!!quickPreviewSurat} 
                onClose={() => setQuickPreviewSurat(null)} 
                onNavigateToDetail={(id) => { 
                    setIsNavigating(true); 
                    router.push(`/dashboard/surat/${id}`); 
                }} 
            />


            {/* --- MODAL QUICK ARCHIVE --- */}
            <Dialog open={!!quickArchiveSurat} onOpenChange={(open) => !open && setQuickArchiveSurat(null)}>
                <DialogContent className="sm:max-w-md bg-card border-border">
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

        </div>
    );
}
