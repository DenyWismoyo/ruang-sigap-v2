// Lokasi: src/app/dashboard/logbook/page.tsx
// [UPDATE] Menambahkan Tahun pada format nama sub-folder otomatis (Angka. Tahun Bulan - Bukti E Kinerja)

"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserProfile, LogbookHarian, LogbookKegiatan, Tugas, BuktiKinerja } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc, Timestamp, orderBy, getDocs, addDoc } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { Plus, Trash2, ClipboardList, Sparkles, Loader2, BookOpen, ChevronDown, ClipboardCheck, Send, MoreVertical, BrainCircuit, GripVertical, X, HelpCircle, Calendar, FileDown, ChevronLeft, ChevronRight, Edit, Link as LinkIcon, CheckSquare, Square, Save, ListChecks, FileText, Zap, Download, Settings } from 'lucide-react';
import FormTugas from '@/app/dashboard/sigap/(main)/tugas/components/FormTugas';
import { useGoogleDriveUploader, UploadStatus } from '@/app/dashboard/sigap/hooks/useGoogleDriveUploader';
import { EkinerjaBridgeModal } from '@/components/ekinerja/EkinerjaBridgeModal';
import { EkinerjaPaywallModal } from '@/components/ekinerja/EkinerjaPaywallModal';
import { useEkinerjaSubscription } from '@/hooks/useEkinerjaSubscription';
import { detectAktivitasFromLogbookText } from '@/data/masterAktivitasSolo';

import { useVirtualizer } from '@tanstack/react-virtual';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { LogbookPdfDocument } from './components/LogbookPdfDocument'; 
import { SmartAddKegiatanModal } from '@/app/dashboard/poros/(main)/logbook/components/SmartAddKegiatanModal';
import { LogbookSettingsModal } from '@/components/logbook/LogbookSettingsModal';
import { KinerjaTrackerCard } from '@/components/logbook/KinerjaTrackerCard';
import { SmartAiEntryModal } from '@/components/logbook/SmartAiEntryModal';
import SigapPageHeader from '@/app/dashboard/sigap/components/SigapPageHeader';
import SigapHelpModal from '@/app/dashboard/sigap/components/SigapHelpModal';
import { LogbookTutorialModal } from '@/components/logbook/LogbookTutorialModal';
import { LogbookDateStrip } from '@/components/logbook/LogbookDateStrip';
import { LogbookTimelineCard } from '@/components/logbook/LogbookTimelineCard';
import { LogbookMobileActionDock } from '@/components/logbook/LogbookMobileActionDock';
import { MASTER_AKTIVITAS_SOLO } from '@/data/masterAktivitasSolo';
import { TemplateFavoritSection } from '@/components/logbook/TemplateFavoritSection';

// --- Impor Komponen Shadcn ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from '@/components/ui/progress'; 
import { Badge } from "@/components/ui/badge";
import { AktivitasCombobox } from "@/components/ekinerja/AktivitasCombobox"; 

const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

const BantuanHalamanModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    return <LogbookTutorialModal isOpen={isOpen} onClose={onClose} tenant="sigap" />;
};

// --- Komponen Modal Rekap Bulanan ---
interface RekapBulananModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
    jabatanNama: string; 
    opdNama: string; 
    uploader: {
        uploadFile: (file: File | Blob, fileName: string, customFolderId?: string | null, subFolderName?: string) => Promise<string | null>;
        uploadStatus: UploadStatus;
        errorMessage: string;
        isReady: boolean;
    }
}

const RekapBulananModal = ({ isOpen, onClose, userProfile, uploader, jabatanNama, opdNama }: RekapBulananModalProps) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
    const [rekapData, setRekapData] = useState('');
    const [rawLogbookList, setRawLogbookList] = useState<LogbookHarian[]>([]);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRekapData('');
            setRawLogbookList([]); 
            setError('');
            setSuccess('');
            setIsGenerating(false);
            setIsUploading(false);
            setIsPdfGenerating(false);
            setSelectedMonth(new Date().toISOString().slice(0, 7));
        }
    }, [isOpen]);

    const handleGenerateRekap = async () => {
        if (!userProfile) return;
        setIsGenerating(true);
        setError('');
        setSuccess('');
        setRekapData('');
        setRawLogbookList([]);

        try {
            const [year, month] = selectedMonth.split('-').map(Number);
            const startDate = Timestamp.fromDate(new Date(year, month - 1, 1));
            const endDate = Timestamp.fromDate(new Date(year, month, 0, 23, 59, 59)); 
            // Menghindari error composite index di Firestore dengan mem-filter tanggal di sisi klien
            const q = query(
                collection(db, 'logbookHarian'),
                where('userId', '==', userProfile.uid)
            );
            const snapshot = await getDocs(q);
            
            const fetchedLogs = snapshot.docs
                .map(doc => doc.data() as LogbookHarian)
                .filter(log => {
                    if (!log.tanggal || typeof log.tanggal.toDate !== 'function') return false;
                    const logDate = log.tanggal.toDate().getTime();
                    return logDate >= startDate.toDate().getTime() && logDate <= endDate.toDate().getTime();
                })
                .sort((a, b) => {
                    if (!a.tanggal || typeof a.tanggal.toDate !== 'function') return 0;
                    if (!b.tanggal || typeof b.tanggal.toDate !== 'function') return 0;
                    return a.tanggal.toDate().getTime() - b.tanggal.toDate().getTime();
                });
            
            setRawLogbookList(fetchedLogs);
            
            if (fetchedLogs.length === 0) {
                setRekapData("Tidak ada data kegiatan yang ditemukan untuk bulan ini.");
                return;
            }

            const monthName = new Date(year, month - 1).toLocaleString('id-ID', { month: 'long' });
            let rekapString = `LAPORAN KEGIATAN HARIAN (LOGBOOK)\n`;
            rekapString += `NAMA      : ${userProfile.namaLengkap.toUpperCase()}\n`;
            rekapString += `PERIODE   : ${monthName} ${year}\n`;
            rekapString += `===================================================\n\n`;
            
            fetchedLogs.forEach(data => {
                const tanggalStr = data.tanggal.toDate().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
                rekapString += `HARI/TANGGAL: ${tanggalStr}\n`;
                const kegiatanList = data.kegiatan || [];
                if (kegiatanList.length === 0) {
                    rekapString += `- (Tidak ada kegiatan tercatat)\n`;
                } else {
                    kegiatanList.forEach(keg => {
                        rekapString += `- [${keg.selesai ? 'SELESAI' : 'PROSES'}] ${keg.deskripsi}\n`;
                        if (keg.tugasTerkaitJudul) {
                            rekapString += `  (Terkait Tugas: ${keg.tugasTerkaitJudul})\n`;
                        }
                    });
                }
                rekapString += `\n`;
            });
            setRekapData(rekapString);

        } catch (err: any) {
            console.error(err);
            setError(`Gagal membuat rekap: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUploadRekap = async () => {
        if (!rekapData || !userProfile || !uploader.isReady) {
            setError("Rekap belum di-generate atau uploader belum siap.");
            return;
        }
        if (!userProfile.googleDriveReportLink) {
            setError("Folder Google Drive E-Kinerja belum diatur di Profil.");
            return;
        }
        if (!userProfile.googleRefreshToken) {
            setError("Akun Google belum terhubung. Harap hubungkan akun Google di menu Profil.");
            return;
        }
        setIsUploading(true);
        setError('');
        setSuccess('');
        try {
            const rekapBlob = new Blob([rekapData], { type: 'text/plain;charset=utf-8' });
            const [year, monthStr] = selectedMonth.split('-');
            const month = parseInt(monthStr, 10);
            const monthName = new Date(Number(year), month - 1).toLocaleString('id-ID', { month: 'long' });
            const fileName = `Laporan_Logbook_${monthName}_${year}_${userProfile.namaLengkap.replace(/\s+/g, '_')}.txt`;
            const subFolderName = `${month}. ${year} ${monthName} - Bukti E Kinerja`;

            const link = await uploader.uploadFile(
                rekapBlob, 
                fileName, 
                userProfile.googleDriveReportLink,
                subFolderName
            );
            
            if (link) {
                // [TRIPLE-SYNC: AUTO REGISTER BUKTI KINERJA]
                try {
                    await addDoc(collection(db, 'buktiKinerja'), {
                        userId: userProfile.uid,
                        opdId: userProfile.opdId,
                        judul: `Rekap Logbook Bulanan - ${monthName} ${year}`,
                        deskripsi: `Laporan rekapitulasi aktivitas logbook kinerja harian periode ${monthName} ${year}`,
                        googleDriveLink: link,
                        fileName: fileName,
                        fileType: 'text/plain',
                        sumber: 'logbook_rekap',
                        createdAt: Timestamp.now(),
                    });
                } catch (dbErr) {
                    console.warn("[BuktiKinerja] Gagal mencatat rekap ke buktiKinerja:", dbErr);
                }

                setSuccess(`Laporan teks berhasil diunggah ke folder "${subFolderName}" dan tercatat di Bukti Kinerja!`);
            } else {
                throw new Error(uploader.errorMessage || "Upload gagal.");
            }
        } catch (err: any) {
            console.error(err);
            setError(`Gagal mengunggah: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadPdfRekap = async () => {
        if (!rekapData || rawLogbookList.length === 0 || !userProfile || !uploader.isReady) {
            setError("Data rekap belum siap atau uploader belum aktif.");
            return;
        }
        if (!userProfile.googleDriveReportLink) {
            setError("Folder Google Drive E-Kinerja belum diatur di Profil.");
            return;
        }
        if (!userProfile.googleRefreshToken) {
            setError("Akun Google belum terhubung. Harap hubungkan akun Google di menu Profil.");
            return;
        }

        setIsUploading(true);
        setError('');
        setSuccess('');
        try {
            const [year, monthStr] = selectedMonth.split('-');
            const month = parseInt(monthStr, 10);
            const monthName = new Date(Number(year), month - 1).toLocaleString('id-ID', { month: 'long' });
            const fileName = `Laporan_Kinerja_${monthName}_${year}_${userProfile.namaLengkap.replace(/\s+/g, '_')}.pdf`;
            const subFolderName = `${month}. ${year} ${monthName} - Bukti E Kinerja`;

            const document = (
                <LogbookPdfDocument 
                    userProfile={userProfile} 
                    jabatanNama={jabatanNama} 
                    opdNama={opdNama} 
                    periode={`${new Date(Number(year), month - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`} 
                    data={rawLogbookList} 
                />
            );
            
            const pdfBlob = await pdf(document).toBlob();

            const link = await uploader.uploadFile(
                pdfBlob, 
                fileName, 
                userProfile.googleDriveReportLink,
                subFolderName
            );
            
            if (link) {
                // [TRIPLE-SYNC: AUTO REGISTER BUKTI KINERJA]
                try {
                    await addDoc(collection(db, 'buktiKinerja'), {
                        userId: userProfile.uid,
                        opdId: userProfile.opdId,
                        judul: `Laporan Kinerja Resmi (PDF) - ${monthName} ${year}`,
                        deskripsi: `Laporan resmi PDF kinerja bulanan periode ${monthName} ${year}`,
                        googleDriveLink: link,
                        fileName: fileName,
                        fileType: 'application/pdf',
                        sumber: 'logbook_rekap',
                        createdAt: Timestamp.now(),
                    });
                } catch (dbErr) {
                    console.warn("[BuktiKinerja] Gagal mencatat PDF ke buktiKinerja:", dbErr);
                }

                setSuccess(`Laporan PDF resmi berhasil diunggah ke folder "${subFolderName}" dan tercatat di Bukti Kinerja!`);
            } else {
                throw new Error(uploader.errorMessage || "Upload PDF gagal.");
            }
        } catch (err: any) {
            console.error(err);
            setError(`Gagal mengunggah PDF: ${err.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!rekapData || rawLogbookList.length === 0 || !userProfile) return;
        
        setIsPdfGenerating(true);
        try {
            const document = (
                <LogbookPdfDocument 
                    userProfile={userProfile} 
                    jabatanNama={jabatanNama} 
                    opdNama={opdNama} 
                    periode={`${new Date(Number(selectedMonth.split('-')[0]), Number(selectedMonth.split('-')[1]) - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`} 
                    data={rawLogbookList} 
                />
            );
            
            const blob = await pdf(document).toBlob();
            const url = URL.createObjectURL(blob);
            const a = window.document.createElement('a');
            a.href = url;
            a.download = `Laporan_Kinerja.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error(err);
            setError(`Gagal membuat PDF: ${err.message}`);
        } finally {
            setIsPdfGenerating(false);
        }
    };

    const isLoading = isGenerating || isUploading || isPdfGenerating || uploader.uploadStatus === 'uploading';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-card border-border flex flex-col max-h-[90vh] p-0 gap-0">
                <DialogHeader className="p-6 pb-4 flex-shrink-0">
                    <DialogTitle>Rekapitulasi Logbook Bulanan</DialogTitle>
                </DialogHeader>
                
                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="px-6 space-y-4">
                        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                        {success && <Alert variant="default" className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700"><AlertDescription>{success}</AlertDescription></Alert>}
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <Label htmlFor="month-picker">Pilih Bulan & Tahun</Label>
                                <Input
                                    id="month-picker"
                                    type="month"
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(e.target.value)}
                                    disabled={isLoading}
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex-shrink-0 sm:self-end">
                                <Button
                                    onClick={handleGenerateRekap}
                                    disabled={isLoading}
                                    className="w-full sm:w-auto"
                                >
                                    <Calendar size={16} className="mr-2" />
                                    {isGenerating ? 'Membuat...' : 'Generate Rekap'}
                                </Button>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="rekap-hasil">Hasil Rekapitulasi</Label>
                            <Textarea
                                id="rekap-hasil"
                                readOnly
                                value={rekapData}
                                placeholder="Klik 'Generate Rekap' untuk menampilkan data..."
                                rows={10}
                                className="mt-1 font-mono"
                            />
                        </div>
                    </div>
                </ScrollArea>
                
                <DialogFooter className="p-4 border-t border-border flex-shrink-0 bg-muted/50 flex flex-col sm:flex-row gap-2">
                    {rekapData && rawLogbookList.length > 0 && userProfile && (
                        <>
                            <Button 
                                onClick={handleDownloadPdf}
                                disabled={isPdfGenerating || isLoading}
                                variant="outline" 
                                className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                            >
                                {isPdfGenerating ? <Loader2 size={16} className="animate-spin mr-2"/> : <FileText size={16} className="mr-2"/>}
                                {isPdfGenerating ? 'Menyiapkan...' : 'Download PDF'}
                            </Button>
                            <Button
                                onClick={handleUploadPdfRekap}
                                disabled={isLoading || !!success}
                                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                            >
                                {isUploading ? <Loader2 size={16} className="animate-spin mr-2" /> : <FileDown size={16} className="mr-2" />}
                                {isUploading ? 'Mengunggah...' : 'Upload PDF ke Drive'}
                            </Button>
                        </>
                    )}

                    <Button
                        onClick={handleUploadRekap}
                        disabled={isLoading || !rekapData || !!success}
                        variant="secondary"
                        className="w-full sm:w-auto"
                    >
                        <FileDown size={16} className="mr-2" />
                        {isUploading ? 'Mengunggah...' : 'Upload Teks ke Drive'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ShortcutNav = ({ onOpenTutorial }: { onOpenTutorial?: () => void }) => (
    <div className="mb-6 flex items-center gap-2 flex-wrap"> 
        <span className="text-sm font-semibold text-muted-foreground shrink-0">Akses Cepat:</span>
        <Button asChild variant="secondary" size="sm" className="rounded-full sg-btn">
          <Link href="/dashboard/tugas"><ClipboardCheck size={14} /> Tugas</Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="rounded-full sg-btn">
          <Link href="/dashboard/checklist"><ListChecks size={14} /> Checklist</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-full sg-btn border-emerald-300 dark:border-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-medium">
          <a href="/downloads/sigap-chrome-bridge.zip" download="sigap-chrome-bridge.zip" title="Unduh Ekstensi Chrome Bridge untuk Otomasi e-Kinerja Solo">
            <Download size={13} className="mr-1.5 text-emerald-600 dark:text-emerald-400" /> Ekstensi e-Kinerja (.ZIP)
          </a>
        </Button>
        {onOpenTutorial && (
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onOpenTutorial}
            className="rounded-full sg-btn border-blue-300 dark:border-blue-700 bg-blue-50/70 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-medium"
            title="Buka Buku Panduan Lengkap Logbook & e-Kinerja (.MD)"
          >
            <BookOpen size={13} className="mr-1.5 text-blue-600 dark:text-blue-400" /> Buku Panduan (.MD)
          </Button>
        )}
    </div>
);

// SmartAddKegiatanModal diimpor dari file terpisah

const EditKegiatanModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    onFullDelete, 
    entry, 
    tasks,
    userProfile,
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (entry: LogbookKegiatan) => void, 
    onFullDelete: (id: string) => void, 
    entry: LogbookKegiatan | null, 
    tasks: Tugas[],
    userProfile: UserProfile | null,
}) => {
    const [currentEntry, setCurrentEntry] = useState<LogbookKegiatan | null>(null);
    const [isPolishing, setIsPolishing] = useState(false);
    const isKamusKepwalEnabled = userProfile?.useKamusAktivitasKepwal !== false;

    const handlePolish = async () => {
        if (!currentEntry?.deskripsi?.trim() || isPolishing) return;
        setIsPolishing(true);
        try {
            const res = await fetch('/api/ai/polish-kegiatan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: currentEntry.deskripsi,
                    userJabatan: userProfile?.namaJabatan,
                    currentAktivitasId: currentEntry.aktivitasId,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setCurrentEntry(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        deskripsi: data.polishedText || prev.deskripsi,
                        aktivitasId: data.aktivitasId || prev.aktivitasId,
                        aktivitasNama: data.aktivitasNama || prev.aktivitasNama,
                    };
                });
            }
        } catch (e) {
            console.warn("Gagal poles bahasa:", e);
        } finally {
            setIsPolishing(false);
        }
    };

    useEffect(() => { 
        if (isOpen && entry) { 
            setCurrentEntry(entry); 
        } else { 
            setCurrentEntry(null); 
        } 
    }, [isOpen, entry]);

    if (!isOpen || !currentEntry) return null;

    const handleSave = (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (currentEntry.deskripsi.trim()) { 
            onSave(currentEntry); 
        } 
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-card border-border">
                <DialogHeader><DialogTitle>Edit Kegiatan</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 pt-2">
                    {/* SMART SELECT KAMUS AKTIVITAS KE दिश */}
                    {isKamusKepwalEnabled && (
                        <div className="space-y-1.5 p-2.5 rounded-lg border border-border/80 bg-muted/20">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground/90">
                                    <BookOpen size={14} className="text-primary" /> Kamus 152 Aktivitas Kepwal Solo (Smart Select)
                                </Label>
                                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                                    Kepwal 786/154/2020
                                </Badge>
                            </div>
                            <AktivitasCombobox
                                value={currentEntry.aktivitasId}
                                onChange={(akt) => {
                                    if (akt) {
                                        setCurrentEntry({
                                            ...currentEntry,
                                            aktivitasId: akt.id,
                                            aktivitasNama: akt.nama,
                                            deskripsi: currentEntry.deskripsi.trim()
                                                ? (currentEntry.deskripsi.includes(akt.nama) ? currentEntry.deskripsi : `[${akt.nama}] ${currentEntry.deskripsi}`)
                                                : akt.nama
                                        });
                                    } else {
                                        setCurrentEntry({
                                            ...currentEntry,
                                            aktivitasId: undefined,
                                            aktivitasNama: undefined,
                                        });
                                    }
                                }}
                                placeholder="Cari & pilih aktivitas resmi BKPSDM Solo..."
                                showQuickPills={true}
                            />
                        </div>
                    )}

                    {/* Deskripsi Kegiatan */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="edit-deskripsi" className="text-xs font-medium text-foreground/80">Deskripsi Kegiatan</Label>
                            {currentEntry.deskripsi.trim().length >= 3 && (
                                <button
                                    type="button"
                                    onClick={handlePolish}
                                    disabled={isPolishing}
                                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 transition-colors"
                                    title="Poles bahasa menjadi tata naskah dinas formal baku ASN via AI"
                                >
                                    {isPolishing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-amber-500" />}
                                    Poles Bahasa Birokrasi
                                </button>
                            )}
                        </div>
                        <Textarea 
                            id="edit-deskripsi" 
                            value={currentEntry.deskripsi} 
                            onChange={(e) => setCurrentEntry({ ...currentEntry, deskripsi: e.target.value })} 
                            rows={3} 
                            autoFocus={!isKamusKepwalEnabled} 
                        />
                    </div>

                    {/* Real-time Smart Match Suggestion */}
                    {isKamusKepwalEnabled && !currentEntry.aktivitasId && currentEntry.deskripsi.trim().length >= 3 && (() => {
                        const matched = detectAktivitasFromLogbookText(currentEntry.deskripsi);
                        if (!matched) return null;
                        return (
                            <div className="flex items-center justify-between p-2 rounded-md bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 text-xs animate-in fade-in-50">
                                <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                                    <Sparkles size={13} className="text-blue-500 shrink-0" />
                                    <span>Saran kamus Kepwal:</span>
                                    <span className="font-semibold text-blue-700 dark:text-blue-300 truncate">
                                        {matched.nama} (+{matched.nilaiPoin}p)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentEntry({
                                            ...currentEntry,
                                            aktivitasId: matched.id,
                                            aktivitasNama: matched.nama,
                                        });
                                    }}
                                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline shrink-0 ml-2"
                                >
                                    + Terapkan
                                </button>
                            </div>
                        );
                    })()}

                    {/* Jam Mulai & Jam Selesai */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="edit-jam-mulai" className="text-xs text-muted-foreground">Jam Mulai</Label>
                            <Input id="edit-jam-mulai" type="time" value={currentEntry.waktuMulai || ''} onChange={(e) => setCurrentEntry({ ...currentEntry, waktuMulai: e.target.value })} className="h-8 text-xs bg-background" />
                        </div>
                        <div>
                            <Label htmlFor="edit-jam-selesai" className="text-xs text-muted-foreground">Jam Selesai</Label>
                            <Input id="edit-jam-selesai" type="time" value={currentEntry.waktuSelesai || ''} onChange={(e) => setCurrentEntry({ ...currentEntry, waktuSelesai: e.target.value })} className="h-8 text-xs bg-background" />
                        </div>
                    </div>

                    {/* Tautkan ke Tugas */}
                    <div>
                        <Label htmlFor="tugas-terkait" className="text-xs text-muted-foreground">Tautkan ke Tugas (Opsional)</Label>
                        <Select 
                            value={currentEntry.tugasTerkaitId || ''} 
                            onValueChange={(value) => { 
                                const task = tasks.find(t => t.id === value); 
                                setCurrentEntry({ 
                                    ...currentEntry, 
                                    tugasTerkaitId: value || undefined, 
                                    tugasTerkaitJudul: task?.judulTugas || undefined 
                                }); 
                            }}
                        >
                            <SelectTrigger id="tugas-terkait"><SelectValue placeholder="-- Tidak ditautkan --" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">-- Tidak ditautkan --</SelectItem>
                                {tasks.map(t => <SelectItem key={t.id} value={t.id!}>{t.judulTugas}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Kamus Aktivitas Rutin Pribadi */}
                    {userProfile?.customAktivitasList && userProfile.customAktivitasList.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                            <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Sparkles size={12} className="text-primary" /> Kamus Aktivitas Rutin Anda:
                            </Label>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                {userProfile.customAktivitasList.map((akt, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 text-xs font-normal py-1 px-2 transition-colors"
                                        onClick={() => {
                                            setCurrentEntry({
                                                ...currentEntry,
                                                deskripsi: currentEntry.deskripsi ? `${currentEntry.deskripsi} - ${akt}` : akt
                                            });
                                        }}
                                    >
                                        + {akt}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="sm:justify-between pt-2">
                        <Button type="button" variant="destructive" onClick={() => onFullDelete(currentEntry.id)}><Trash2 size={16} className="mr-2" /> Hapus</Button>
                        <Button type="submit" disabled={!currentEntry.deskripsi.trim()}><Save size={16} className="mr-2" /> Simpan</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const LogbookItem = ({ 
    k, 
    onToggle, 
    onEdit, 
    onDelete,
    onKirimEkinerja,
}: { 
    k: LogbookKegiatan, 
    onToggle: (id: string) => void, 
    onEdit: (entry: LogbookKegiatan) => void, 
    onDelete: (id: string) => void,
    onKirimEkinerja?: (entry: LogbookKegiatan) => void,
}) => {
    return (
        <div className="sg-glass-panel sg-mobile-borderless p-3 flex items-start gap-3 group md:hover:-translate-y-[1px] md:hover:shadow-md transition-all duration-200">
            <Button variant="ghost" size="icon" onClick={() => onToggle(k.id)} title="Tandai selesai / belum selesai" className="mt-1 shrink-0 h-auto w-auto p-0">
                {k.selesai ? <CheckSquare size={20} className="text-green-600"/> : <Square size={20} className="text-muted-foreground"/>}
            </Button>
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-medium text-foreground ${k.selesai ? 'line-through text-muted-foreground' : ''}`}>{k.deskripsi}</p>
                    {k.aktivitasNama && (
                        <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                            ⭐ {k.aktivitasNama}
                        </span>
                    )}
                    {(k.waktuMulai || k.waktuSelesai) && (
                        <span className="text-[11px] font-semibold text-muted-foreground shrink-0 bg-muted/60 px-1.5 py-0.5 rounded border border-border/50">
                            🕒 {k.waktuMulai || '08:00'} - {k.waktuSelesai || '09:30'}
                        </span>
                    )}
                </div>
                {k.tugasTerkaitId && (<Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-green-700 dark:text-green-300"><Link href={`/dashboard/tugas`}><LinkIcon size={12} className="mr-1.5"/> Tugas: {k.tugasTerkaitJudul || 'Lihat Tugas'}</Link></Button>)}
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onKirimEkinerja?.(k)}
                    title="Kirim entri ini ke portal e-Kinerja BKPSDM Surakarta"
                    className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30 border-amber-300 dark:border-amber-700/50 flex items-center gap-1 font-medium transition-colors"
                >
                    <Zap size={13} className="fill-amber-500 text-amber-500 shrink-0" />
                    <span className="hidden sm:inline">e-Kinerja</span>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity">
                            <MoreVertical size={16} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onKirimEkinerja?.(k)} className="text-amber-600 dark:text-amber-400 focus:text-amber-600 font-medium">
                            <Zap size={14} className="mr-2 fill-amber-500 text-amber-500" /> Kirim ke e-Kinerja
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(k)}>
                            <Edit size={14} className="mr-2"/> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(k.id)} className="text-red-600 focus:text-red-600">
                            <Trash2 size={14} className="mr-2"/> Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export default function LogbookPage() {
    const { userProfile, actingJabatanProfile, jabatanProfile, loading: authLoading } = useUserAuth();
    const uploader = useGoogleDriveUploader();
    
    const effectiveJabatan = actingJabatanProfile || jabatanProfile;

    const [localUserCache, setLocalUserCache] = useState<Map<string, UserProfile>>(new Map());
    const [isCacheLoading, setIsCacheLoading] = useState(true);
    
    const [opdName, setOpdName] = useState('');

    const [logbookData, setLogbookData] = useState<LogbookHarian | null>(null);
    const [tasks, setTasks] = useState<Tugas[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<LogbookKegiatan | null>(null);
    
    const [isBantuanOpen, setIsBantuanOpen] = useState(false);
    const [isRekapOpen, setIsRekapOpen] = useState(false);
    const [ekinerjaModalBukti, setEkinerjaModalBukti] = useState<BuktiKinerja | null>(null);
    const [isEkinerjaModalOpen, setIsEkinerjaModalOpen] = useState(false);
    const [isPaywallOpen, setIsPaywallOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAiEntryOpen, setIsAiEntryOpen] = useState(false);
    const { isSubscribed } = useEkinerjaSubscription();

    const [filterStatus, setFilterStatus] = useState<'all' | 'uncompleted' | 'completed'>('all');
    const [isTrackerExpanded, setIsTrackerExpanded] = useState(false);

    useEffect(() => {
        if (userProfile?.opdId && localUserCache.size === 0 && !authLoading) {
          const fetchLocalCache = async () => {
            setIsCacheLoading(true);
            try {
              const usersInOpdQuery = query(collection(db, "users"), where("opdId", "==", userProfile.opdId));
              const usersSnapshot = await getDocs(usersInOpdQuery);
              const userCacheMap = new Map<string, UserProfile>();
              usersSnapshot.forEach(doc => {
                const user = { id: doc.id, ...doc.data() } as UserProfile;
                if (user.jabatanId) {
                  userCacheMap.set(user.jabatanId, user); 
                }
              });
              setLocalUserCache(userCacheMap);
              
              const opdDocRef = doc(db, 'opd', userProfile.opdId);
              const opdDocSnap = await getDoc(opdDocRef);
              if (opdDocSnap.exists()) {
                  setOpdName(opdDocSnap.data().namaOpd);
              }

            } catch (err) {
              console.error("Gagal fetch local data for LogbookPage:", err);
            } finally {
              setIsCacheLoading(false);
            }
          };
          fetchLocalCache();
        } else if (localUserCache.size > 0 || authLoading) {
            setIsCacheLoading(false);
        }
    }, [userProfile, authLoading, localUserCache.size]);

    const effectiveProfile = useMemo(() => localUserCache.get(effectiveJabatan?.id!) || userProfile, [effectiveJabatan, userProfile, localUserCache]);

    const fetchLogbookData = useCallback(async () => {
        if (!effectiveProfile) return;
        setLoading(true);
        const dateForQuery = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const dateStr = toYYYYMMDD(dateForQuery);
        const docId = `${effectiveProfile.uid}_${dateStr}`;
        const docRef = doc(db, 'logbookHarian', docId);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setLogbookData(docSnap.data() as LogbookHarian);
            } else {
                 setLogbookData({
                    userId: effectiveProfile.uid,
                    opdId: effectiveProfile.opdId,
                    tanggal: Timestamp.fromDate(dateForQuery), 
                    kegiatan: []
                });
            }
        } catch (error) {
            console.error("Error fetching logbook:", error);
            setLogbookData(null);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, effectiveProfile]);

    useEffect(() => {
        if (!isCacheLoading) {
            fetchLogbookData();
        }
    }, [fetchLogbookData, isCacheLoading]);

    useEffect(() => {
        if (!userProfile) return;
        const fetchTasks = async () => {
            const q = query(collection(db, 'tugasPerPengguna', userProfile.uid, 'tugas'), where('status', 'in', ['Baru', 'Dikerjakan']));
            const snapshot = await getDocs(q);
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tugas)));
        };
        fetchTasks();
    }, [userProfile]);

    const updateKegiatanList = async (newOrUpdatedKegiatanList: LogbookKegiatan[]) => {
        if (!effectiveProfile) return;
        const dateForQuery = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        const dateStr = toYYYYMMDD(dateForQuery);
        const docId = `${effectiveProfile.uid}_${dateStr}`;
        const docRef = doc(db, 'logbookHarian', docId);
        try {
            await setDoc(docRef, { userId: effectiveProfile.uid, opdId: effectiveProfile.opdId, tanggal: Timestamp.fromDate(dateForQuery), kegiatan: newOrUpdatedKegiatanList }, { merge: true });
             await fetchLogbookData();
        } catch (error) { console.error("Error updating logbook:", error); alert("Gagal menyimpan perubahan ke logbook."); throw error; }
    };
    const handleAddKegiatan = async (text: string, waktuMulaiInput?: string, waktuSelesaiInput?: string, aktivitasId?: number, aktivitasNama?: string) => { 
        const now = new Date();
        const pad = (num: number) => String(num).padStart(2, '0');
        const autoJamMulai = waktuMulaiInput || `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const autoEndDate = new Date(now.getTime() + 60 * 60 * 1000);
        const autoJamSelesai = waktuSelesaiInput || `${pad(autoEndDate.getHours())}:${pad(autoEndDate.getMinutes())}`;

        const newKegiatan: LogbookKegiatan = { 
            id: now.getTime().toString(), 
            deskripsi: text, 
            selesai: false,
            waktuMulai: autoJamMulai,
            waktuSelesai: autoJamSelesai,
            createdAt: now.toISOString(),
            aktivitasId: aktivitasId,
            aktivitasNama: aktivitasNama,
        }; 
        const currentKegiatan = logbookData?.kegiatan || []; 
        await updateKegiatanList([...currentKegiatan, newKegiatan]); 
    };

    const handleBatchAddKegiatan = async (kegiatanList: LogbookKegiatan[]) => {
        const currentKegiatan = logbookData?.kegiatan || [];
        await updateKegiatanList([...currentKegiatan, ...kegiatanList]);
    };

    const handleAutoArrangeTimes = async () => {
        if (!logbookData?.kegiatan || logbookData.kegiatan.length === 0) return;
        try {
            let currentHour = 8;
            let currentMinute = 0;

            const arranged = logbookData.kegiatan.map((k) => {
                const startStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
                let durationMinutes = 60;
                if (k.waktuMulai && k.waktuSelesai) {
                    const [sh, sm] = k.waktuMulai.split(':').map(Number);
                    const [eh, em] = k.waktuSelesai.split(':').map(Number);
                    if (!isNaN(sh) && !isNaN(eh)) {
                        const diff = (eh * 60 + em) - (sh * 60 + sm);
                        if (diff > 0) durationMinutes = diff;
                    }
                }
                const endTotalMinutes = currentHour * 60 + currentMinute + durationMinutes;
                const endHour = Math.min(17, Math.floor(endTotalMinutes / 60));
                const endMinute = endTotalMinutes % 60;
                const endStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

                currentHour = endHour;
                currentMinute = endMinute;

                return {
                    ...k,
                    waktuMulai: startStr,
                    waktuSelesai: endStr,
                };
            });

            await updateKegiatanList(arranged);
        } catch (err) {
            console.error("Gagal meruntunkan jam kegiatan:", err);
        }
    };
    
    const handleAddTindakLanjut = async (kegiatanBaru: Partial<LogbookKegiatan>) => {
        const now = new Date();
        const pad = (num: number) => String(num).padStart(2, '0');
        const autoJamMulai = kegiatanBaru.waktuMulai || `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const autoEndDate = new Date(now.getTime() + 60 * 60 * 1000);
        const autoJamSelesai = kegiatanBaru.waktuSelesai || `${pad(autoEndDate.getHours())}:${pad(autoEndDate.getMinutes())}`;

        const newKegiatan: LogbookKegiatan = {
            id: now.getTime().toString(),
            deskripsi: kegiatanBaru.deskripsi || '',
            selesai: kegiatanBaru.selesai ?? true,
            kategori: kegiatanBaru.kategori || 'Disposisi',
            sumber: kegiatanBaru.sumber || 'laporan_tindak_lanjut',
            suratTerkaitId: kegiatanBaru.suratTerkaitId,
            suratPerihal: kegiatanBaru.suratPerihal,
            disposisiTerkaitId: kegiatanBaru.disposisiTerkaitId,
            waktuMulai: autoJamMulai,
            waktuSelesai: autoJamSelesai,
            createdAt: kegiatanBaru.createdAt || now.toISOString(),
            aktivitasId: kegiatanBaru.aktivitasId,
            aktivitasNama: kegiatanBaru.aktivitasNama,
        };
        const currentKegiatan = logbookData?.kegiatan || [];
        await updateKegiatanList([...currentKegiatan, newKegiatan]);
    };

    const handleEditSave = async (entry: LogbookKegiatan) => { if (!entry.deskripsi.trim()) { alert("Deskripsi kegiatan tidak boleh kosong."); return; } const currentKegiatan = logbookData?.kegiatan || []; await updateKegiatanList(currentKegiatan.map(k => k.id === entry.id ? entry : k)); setIsEditModalOpen(false); setEntryToEdit(null); };
    const handleToggleSelesai = async (kegiatanId: string) => { const currentKegiatan = logbookData?.kegiatan || []; await updateKegiatanList(currentKegiatan.map(k => k.id === kegiatanId ? { ...k, selesai: !k.selesai } : k)); };
    const handleDeleteKegiatan = async (kegiatanId: string) => { if (!window.confirm("Hapus kegiatan ini dari logbook?")) return; const currentKegiatan = logbookData?.kegiatan || []; await updateKegiatanList(currentKegiatan.filter(k => k.id !== kegiatanId)); if (entryToEdit?.id === kegiatanId) { setIsEditModalOpen(false); setEntryToEdit(null); } };

    const handleOpenEkinerja = (entry: LogbookKegiatan) => {
        const isKepwalEnabled = effectiveProfile?.useKamusAktivitasKepwal !== false;
        const detected = isKepwalEnabled ? detectAktivitasFromLogbookText(entry.deskripsi) : null;
        const rawDrive = userProfile?.googleDriveReportLink || effectiveProfile?.googleDriveReportLink || '';
        const driveUrl = rawDrive 
            ? (rawDrive.startsWith('http') ? rawDrive : `https://drive.google.com/drive/folders/${rawDrive}`)
            : '';

        // Prioritaskan timestamp pencatatan asli (createdAt) jika ada
        let entryCreatedAt: Timestamp;
        if (entry.createdAt) {
            const parsed = new Date(entry.createdAt);
            entryCreatedAt = !isNaN(parsed.getTime()) ? Timestamp.fromDate(parsed) : Timestamp.fromDate(selectedDate);
        } else {
            entryCreatedAt = Timestamp.fromDate(selectedDate);
        }

        const virtualBukti: BuktiKinerja = {
            id: `logbook_${entry.id}`,
            userId: effectiveProfile?.uid || '',
            opdId: effectiveProfile?.opdId || '',
            judul: entry.deskripsi,
            deskripsi: `Dicatat melalui Logbook Harian SIGAP pada ${selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`,
            googleDriveLink: driveUrl,
            fileName: `Logbook_${entry.id}.txt`,
            fileType: 'text/plain',
            sumber: 'logbook_rekap',
            createdAt: entryCreatedAt,
            waktuMulai: entry.waktuMulai,
            waktuSelesai: entry.waktuSelesai,
            aktivitasId: entry.aktivitasId ?? (detected ? detected.id : undefined),
            aktivitasNama: entry.aktivitasNama ?? (detected ? detected.nama : undefined),
        };
        setEkinerjaModalBukti(virtualBukti);
        if (!isSubscribed) {
            setIsPaywallOpen(true);
            return;
        }
        setIsEkinerjaModalOpen(true);
    };

    const changeDate = (offset: number) => setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + offset); return d; });

    const dailyStats = useMemo(() => {
        const kegiatan = logbookData?.kegiatan || [];
        const total = kegiatan.length;
        const completed = kegiatan.filter(k => k.selesai).length;
        
        let totalMenitKerja = 0;
        let totalPoinMke = 0;
        const isKepwalEnabled = effectiveProfile?.useKamusAktivitasKepwal !== false;

        kegiatan.forEach(k => {
            // Durasi jam kerja
            if (k.waktuMulai && k.waktuSelesai) {
                const [hM, mM] = k.waktuMulai.split(':').map(Number);
                const [hS, mS] = k.waktuSelesai.split(':').map(Number);
                if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS)) {
                    const diff = (hS * 60 + mS) - (hM * 60 + mM);
                    if (diff > 0) totalMenitKerja += diff;
                }
            }

            // Bobot poin MKE Kepwal
            if (isKepwalEnabled) {
                if (k.aktivitasId) {
                    const found = MASTER_AKTIVITAS_SOLO.find(a => a.id === k.aktivitasId);
                    if (found) totalPoinMke += found.nilaiPoin;
                } else {
                    const detected = detectAktivitasFromLogbookText(k.deskripsi);
                    if (detected) totalPoinMke += detected.nilaiPoin;
                }
            }
        });

        const targetMke = 300;
        const targetPercent = Math.min(100, Math.round((totalPoinMke / targetMke) * 100));

        return {
            total,
            completed,
            uncompleted: total - completed,
            totalMenitKerja,
            jamKerjaText: `${Math.floor(totalMenitKerja / 60)}j ${totalMenitKerja % 60}m`,
            totalPoinMke,
            targetMke,
            targetPercent,
            isTargetMet: totalPoinMke >= targetMke || totalMenitKerja >= 300,
            percent: total > 0 ? Math.round((completed / total) * 100) : 0,
            text: `${completed}/${total}`
        };
    }, [logbookData, effectiveProfile]);

    const filteredKegiatan = useMemo(() => {
        const kegiatan = logbookData?.kegiatan || [];
        if (filterStatus === 'completed') {
            return kegiatan.filter(k => k.selesai);
        }
        if (filterStatus === 'uncompleted') {
            return kegiatan.filter(k => !k.selesai);
        }
        return kegiatan;
    }, [logbookData, filterStatus]);

    if (authLoading || isCacheLoading) {
        return <p className="text-center p-8">Memuat data pengguna...</p>;
    }

    return (
        <div className="sg-page pb-32 md:pb-12 space-y-4">
            {/* Header Halaman */}
            <SigapPageHeader 
                title="Logbook Harian"
                description="Pencatatan kegiatan harian, konversi bukti kinerja, dan integrasi e-Kinerja BKPSDM"
                icon={BookOpen}
                actions={
                    <div className="flex items-center gap-1.5">
                        <Button 
                            onClick={() => setIsRekapOpen(true)}
                            variant="outline"
                            size="sm"
                            className="hidden sm:inline-flex h-8 text-xs font-semibold items-center gap-1.5 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        >
                            <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                            <span>Rekap Bulanan</span>
                        </Button>
                        <Button 
                            onClick={() => setIsSettingsOpen(true)}
                            variant="outline"
                            size="sm"
                            className="hidden sm:inline-flex h-8 text-xs font-semibold items-center gap-1.5 border-border"
                            title="Pengaturan Google Drive & Kamus Aktivitas"
                        >
                            <Settings size={14} className="text-muted-foreground" />
                            <span>Pengaturan</span>
                        </Button>
                        <Button 
                            onClick={() => setIsBantuanOpen(true)} 
                            title="Buka Buku Panduan Lengkap (.md)" 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs font-semibold flex items-center gap-1.5 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 shadow-xs"
                        >
                            <BookOpen size={14} className="text-blue-600 dark:text-blue-400" />
                            <span className="hidden sm:inline">Buku Panduan</span>
                        </Button>
                        <Button onClick={() => setIsBantuanOpen(true)} title="Bantuan" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8">
                            <HelpCircle size={18} />
                        </Button>
                    </div>
                }
            >
                <ShortcutNav onOpenTutorial={() => setIsBantuanOpen(true)} />
            </SigapPageHeader>

            {/* Horizontal 7-Day Date Strip */}
            <LogbookDateStrip 
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                tenant="sigap"
            />

            {/* Daily Metric Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Metrik 1: Progress Penyelesaian */}
                <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="font-semibold uppercase tracking-wider">Status Kegiatan</span>
                        <span className="font-bold text-foreground">{dailyStats.text} Selesai</span>
                    </div>
                    <Progress value={dailyStats.percent} className="h-2 mb-1.5 bg-muted" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{dailyStats.percent}% terlaksana</span>
                        {dailyStats.uncompleted > 0 && (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">{dailyStats.uncompleted} pending</span>
                        )}
                    </div>
                </div>

                {/* Metrik 2: Poin e-Kinerja Kepwal */}
                <div className="bg-card border border-border/80 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-semibold uppercase tracking-wider">Poin MKE Hari Ini</span>
                        {dailyStats.isTargetMet ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold">
                                Target Terpenuhi
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] font-medium border-amber-300 text-amber-700 dark:text-amber-400 dark:border-amber-800">
                                {dailyStats.totalPoinMke}/300m
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-extrabold text-foreground">{dailyStats.totalPoinMke}</span>
                        <span className="text-xs text-muted-foreground font-semibold">/ 300 Menit (Target)</span>
                    </div>
                    <Progress value={dailyStats.targetPercent} className="h-1.5 mt-1.5 bg-muted" />
                </div>
            </div>

            {/* Desktop Command Bar & SKP Collapsible Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                {/* Tombol Aksi Desktop */}
                <div className="hidden md:flex items-center gap-2">
                    <Button 
                        onClick={() => setIsAddModalOpen(true)} 
                        className="sg-btn sg-btn-primary h-9 px-4 font-semibold text-xs shadow-xs"
                    >
                        <Plus size={15} className="mr-1.5" /> Tambah Kegiatan
                    </Button>
                    <Button 
                        onClick={() => {
                            if (!isSubscribed) {
                                setIsPaywallOpen(true);
                                return;
                            }
                            setIsAiEntryOpen(true);
                        }}
                        className="h-9 px-4 text-xs font-semibold bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-xs"
                        title="Asisten AI: Pecah catatan atau jejak hari ini menjadi kegiatan mandiri"
                    >
                        <Sparkles size={15} className="mr-1.5 text-amber-200 animate-pulse"/> AI Smart Entry
                    </Button>
                    <Button 
                        onClick={() => setIsRekapOpen(true)} 
                        variant="outline"
                        className="h-9 px-3 text-xs font-semibold border-border hover:bg-muted text-foreground"
                    >
                        <Calendar size={14} className="mr-1.5 text-emerald-600 dark:text-emerald-400"/> Rekap Bulanan
                    </Button>
                    <Button 
                        onClick={() => setIsSettingsOpen(true)} 
                        variant="outline"
                        className="h-9 px-3 text-xs font-semibold border-border hover:bg-muted text-foreground"
                    >
                        <Settings size={14} className="mr-1.5 text-muted-foreground"/> Pengaturan
                    </Button>
                </div>

                {/* Toggle SKP Tracker Collapsible */}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsTrackerExpanded(!isTrackerExpanded)}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground h-8 px-2.5 ml-auto flex items-center gap-1.5 border border-dashed border-border/80 rounded-lg hover:bg-muted/50"
                >
                    <Zap size={14} className={isTrackerExpanded ? "text-amber-500" : "text-muted-foreground"} />
                    <span>{isTrackerExpanded ? "Tutup Target SKP Bulanan" : "Lihat Target SKP Bulanan (8.400 Menit)"}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isTrackerExpanded ? "rotate-180" : ""}`} />
                </Button>
            </div>

            {/* Collapsible Monthly SKP Tracker */}
            {isTrackerExpanded && (
                <div className="animate-in fade-in slide-in-from-top-3 duration-200">
                    <KinerjaTrackerCard
                        userProfile={effectiveProfile}
                        currentDayKegiatan={logbookData?.kegiatan || []}
                        selectedMonth={toYYYYMMDD(selectedDate).slice(0, 7)}
                        onOpenAiAssistant={() => {
                            if (!isSubscribed) {
                                setIsPaywallOpen(true);
                                return;
                            }
                            setIsAiEntryOpen(true);
                        }}
                        onAutoArrangeTimes={handleAutoArrangeTimes}
                        tenant="sigap"
                    />
                </div>
            )}

            {/* === TEMPLATE KEGIATAN FAVORIT === */}
            <div className="mt-4 px-1">
                <TemplateFavoritSection
                    tenant="sigap"
                    onSuccess={() => {
                        // Logbook di-refresh otomatis oleh Firestore listener
                    }}
                />
            </div>

            {/* Filter Tabs & Timeline Kegiatan */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="flex items-center gap-1.5">
                        <Button
                            type="button"
                            variant={filterStatus === 'all' ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setFilterStatus('all')}
                            className="h-8 text-xs font-semibold rounded-lg px-3"
                        >
                            Semua ({dailyStats.total})
                        </Button>
                        <Button
                            type="button"
                            variant={filterStatus === 'uncompleted' ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setFilterStatus('uncompleted')}
                            className="h-8 text-xs font-semibold rounded-lg px-3"
                        >
                            Belum ({dailyStats.uncompleted})
                        </Button>
                        <Button
                            type="button"
                            variant={filterStatus === 'completed' ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setFilterStatus('completed')}
                            className="h-8 text-xs font-semibold rounded-lg px-3"
                        >
                            Selesai ({dailyStats.completed})
                        </Button>
                    </div>

                    <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                        {filteredKegiatan.length} item ditampilkan
                    </span>
                </div>

                {/* List Timeline Kegiatan */}
                {loading ? (
                    <div className="p-12 text-center text-muted-foreground space-y-2">
                        <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                        <p className="text-sm font-medium">Memuat catatan logbook...</p>
                    </div>
                ) : filteredKegiatan.length > 0 ? (
                    <div className="space-y-3">
                        {filteredKegiatan.map((k) => (
                            <LogbookTimelineCard
                                key={k.id}
                                k={k}
                                onToggle={handleToggleSelesai}
                                onEdit={(entry) => { setEntryToEdit(entry); setIsEditModalOpen(true); }}
                                onDelete={handleDeleteKegiatan}
                                onKirimEkinerja={handleOpenEkinerja}
                                tenant="sigap"
                            />
                        ))}
                    </div>
                ) : (
                    /* Interactive Empty State */
                    <div className="p-8 sm:p-12 bg-card rounded-2xl border border-dashed border-border/90 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                            <BookOpen size={26} />
                        </div>
                        <div className="space-y-1 max-w-md">
                            <h3 className="text-base font-bold text-foreground">
                                {filterStatus !== 'all' ? 'Tidak Ada Kegiatan Sesuai Filter' : 'Belum Ada Kegiatan pada Tanggal Ini'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {filterStatus !== 'all' 
                                    ? 'Coba ubah tab filter ke "Semua" untuk melihat daftar lengkap kegiatan.'
                                    : 'Mulai dokumentasikan kegiatan harian Anda. Kegiatan dapat diisi manual atau dibantu oleh AI Smart Entry.'}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                            {filterStatus !== 'all' ? (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => setFilterStatus('all')}
                                    className="text-xs font-semibold"
                                >
                                    Tampilkan Semua Kegiatan
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="sg-btn sg-btn-primary text-xs font-semibold h-9 px-3.5"
                                    >
                                        <Plus size={14} className="mr-1.5" /> Tambah Kegiatan
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            if (!isSubscribed) {
                                                setIsPaywallOpen(true);
                                                return;
                                            }
                                            setIsAiEntryOpen(true);
                                        }}
                                        className="h-9 px-3.5 text-xs font-semibold bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white"
                                    >
                                        <Sparkles size={14} className="mr-1.5 text-amber-200 animate-pulse" /> AI Smart Entry
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Floating Action Dock */}
            <LogbookMobileActionDock
                onAddKegiatan={() => setIsAddModalOpen(true)}
                onOpenAiEntry={() => {
                    if (!isSubscribed) {
                        setIsPaywallOpen(true);
                        return;
                    }
                    setIsAiEntryOpen(true);
                }}
                tenant="sigap"
            />
            
            <SmartAddKegiatanModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSaveUmum={handleAddKegiatan}
                onSaveTindakLanjut={handleAddTindakLanjut}
                userProfile={effectiveProfile}
            />
            <EditKegiatanModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                onSave={handleEditSave} 
                onFullDelete={handleDeleteKegiatan} 
                entry={entryToEdit} 
                tasks={tasks} 
                userProfile={effectiveProfile}
            />
            <BantuanHalamanModal isOpen={isBantuanOpen} onClose={() => setIsBantuanOpen(false)} />
            
            <RekapBulananModal 
                isOpen={isRekapOpen} 
                onClose={() => setIsRekapOpen(false)} 
                userProfile={effectiveProfile}
                jabatanNama={effectiveJabatan?.namaJabatan || 'Staf'} 
                opdNama={opdName || 'Pemerintah Kota Surakarta'} 
                uploader={uploader}
            />

            <EkinerjaBridgeModal
                isOpen={isEkinerjaModalOpen}
                onClose={() => setIsEkinerjaModalOpen(false)}
                bukti={ekinerjaModalBukti}
                tenant="sigap"
                onOpenPaywall={() => setIsPaywallOpen(true)}
            />

            <EkinerjaPaywallModal
                isOpen={isPaywallOpen}
                onClose={() => setIsPaywallOpen(false)}
                tenant="sigap"
                onSuccess={() => {
                    setIsPaywallOpen(false);
                    setIsEkinerjaModalOpen(true);
                }}
            />

            <LogbookSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                userProfile={effectiveProfile}
                tenant="sigap"
                onSaved={() => {
                    fetchLogbookData();
                }}
            />

            <SmartAiEntryModal
                isOpen={isAiEntryOpen}
                onClose={() => setIsAiEntryOpen(false)}
                userProfile={effectiveProfile}
                selectedDate={selectedDate}
                onSaveBatch={handleBatchAddKegiatan}
                tenant="sigap"
            />
        </div>
    );
}