// Lokasi: src/app/dashboard/logbook/page.tsx
// [UPDATE] Menambahkan Tahun pada format nama sub-folder otomatis (Angka. Tahun Bulan - Bukti E Kinerja)

"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, getDoc, Timestamp, orderBy, getDocs } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { ChecklistBoard, ChecklistItem, LogbookKegiatan, LogbookHarian, Tugas, UserProfile } from '@/types';
import { Plus, Trash2, ClipboardList, Sparkles, Loader2, BookOpen, ChevronDown, ClipboardCheck, Send, MoreVertical, BrainCircuit, GripVertical, X, HelpCircle, Calendar, FileDown, ChevronLeft, ChevronRight, Edit, Link as LinkIcon, CheckSquare, Square, Save, ListChecks, FileText } from 'lucide-react';
import Link from 'next/link';
import FormTugas from '@/app/dashboard/sigap/(main)/tugas/components/FormTugas';
import { useGoogleDriveUploader, UploadStatus } from '@/app/dashboard/sigap/hooks/useGoogleDriveUploader';

import { useVirtualizer } from '@tanstack/react-virtual';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { LogbookPdfDocument } from './components/LogbookPdfDocument'; 
import { SmartAddKegiatanModal } from '@/app/dashboard/poros/(main)/logbook/components/SmartAddKegiatanModal';
import SigapPageHeader from '@/app/dashboard/sigap/components/SigapPageHeader';
import SigapHelpModal from '@/app/dashboard/sigap/components/SigapHelpModal';

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

const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];

const BantuanHalamanModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    return (
        <SigapHelpModal isOpen={isOpen} onClose={onClose} title="Logbook Harian">
            <h3 className="font-semibold text-lg text-foreground">Apa Kegunaan Menu Ini?</h3>
            <p>Menu "Logbook Harian" adalah buku catatan digital Anda untuk mencatat semua kegiatan yang Anda lakukan setiap hari.</p>
            
            <h3 className="font-semibold text-lg text-foreground mt-4">Cara Menggunakan:</h3>
            <ol className="list-decimal list-inside space-y-2">
                <li><strong>Membuat Kegiatan Baru:</strong>
                    <ul className="list-disc list-inside pl-4 mt-1 text-sm space-y-1">
                        <li>Klik tombol "Tambah Kegiatan".</li>
                        <li>Tulis deskripsi pekerjaan Anda.</li>
                        <li>Klik Simpan.</li>
                    </ul>
                </li>
                <li><strong>Rekapitulasi Bulanan (E-Kinerja):</strong>
                    <ul className="list-disc list-inside pl-4 mt-1 text-sm space-y-1">
                        <li>Klik tombol "Rekap Bulanan".</li>
                        <li>Pilih Bulan dan Tahun.</li>
                        <li>Klik "Generate Rekap" untuk melihat preview.</li>
                        <li>Klik "Upload ke Bukti Kinerja" untuk mengirim laporan langsung ke folder Google Drive E-Kinerja Anda (Folder Bulanan).</li>
                        <li>Anda juga bisa mengunduh versi PDF untuk dicetak.</li>
                    </ul>
                </li>
            </ol>
        </SigapHelpModal>
    );
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
        setIsUploading(true);
        setError('');
        setSuccess('');
        try {
            const rekapBlob = new Blob([rekapData], { type: 'text/plain;charset=utf-8' });
            const [year, monthStr] = selectedMonth.split('-');
            const month = parseInt(monthStr, 10);
            const monthName = new Date(Number(year), month - 1).toLocaleString('id-ID', { month: 'long' });
            const fileName = `Laporan_Logbook_${monthName}_${year}_${userProfile.namaLengkap.replace(/\s+/g, '_')}.txt`;
            
            // --- [UPDATE] SUB FOLDER OTOMATIS ---
            // Format Lama: "11. November - Bukti E Kinerja"
            // Format Baru: "11. 2025 November - Bukti E Kinerja"
            const subFolderName = `${month}. ${year} ${monthName} - Bukti E Kinerja`;
            // ---

            const link = await uploader.uploadFile(
                rekapBlob, 
                fileName, 
                userProfile.googleDriveReportLink,
                subFolderName // Kirim nama sub folder
            );
            
            if (link) {
                setSuccess(`Laporan berhasil diunggah ke folder "${subFolderName}"!`);
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
                        <Button 
                            onClick={handleDownloadPdf}
                            disabled={isPdfGenerating}
                            variant="outline" 
                            className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                            {isPdfGenerating ? <Loader2 size={16} className="animate-spin mr-2"/> : <FileText size={16} className="mr-2"/>}
                            {isPdfGenerating ? 'Menyiapkan...' : 'Download PDF'}
                        </Button>
                    )}

                    <Button
                        onClick={handleUploadRekap}
                        disabled={isLoading || !rekapData || !!success}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    >
                        <FileDown size={16} className="mr-2" />
                        {isUploading ? 'Mengunggah...' : 'Upload ke Drive'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ShortcutNav = () => (
    <div className="mb-6 flex items-center gap-2 flex-wrap"> 
        <span className="text-sm font-semibold text-muted-foreground shrink-0">Akses Cepat:</span>
        <Button asChild variant="secondary" size="sm" className="rounded-full sg-btn">
          <Link href="/dashboard/tugas"><ClipboardCheck size={14} /> Tugas</Link>
        </Button>
        <Button asChild variant="secondary" size="sm" className="rounded-full sg-btn">
          <Link href="/dashboard/checklist"><ListChecks size={14} /> Checklist</Link>
        </Button>
    </div>
);

// SmartAddKegiatanModal diimpor dari file terpisah

const EditKegiatanModal = ({ isOpen, onClose, onSave, onFullDelete, entry, tasks }: { isOpen: boolean, onClose: () => void, onSave: (entry: LogbookKegiatan) => void, onFullDelete: (id: string) => void, entry: LogbookKegiatan | null, tasks: Tugas[] }) => {
    const [currentEntry, setCurrentEntry] = useState<LogbookKegiatan | null>(null);
    useEffect(() => { if (isOpen && entry) { setCurrentEntry(entry); } else { setCurrentEntry(null); } }, [isOpen, entry]);
    if (!isOpen || !currentEntry) return null;
    const handleSave = (e: React.FormEvent) => { e.preventDefault(); if (currentEntry.deskripsi.trim()) { onSave(currentEntry); } };
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-card border-border">
                <DialogHeader><DialogTitle>Edit Kegiatan</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 pt-2">
                    <div><Label htmlFor="edit-deskripsi">Deskripsi Kegiatan</Label><Textarea id="edit-deskripsi" value={currentEntry.deskripsi} onChange={(e) => setCurrentEntry({ ...currentEntry, deskripsi: e.target.value })} rows={3} autoFocus /></div>
                    <div><Label htmlFor="tugas-terkait">Tautkan ke Tugas (Opsional)</Label><Select value={currentEntry.tugasTerkaitId || ''} onValueChange={(value) => { const task = tasks.find(t => t.id === value); setCurrentEntry({ ...currentEntry, tugasTerkaitId: value || undefined, tugasTerkaitJudul: task?.judulTugas || undefined }); }}><SelectTrigger id="tugas-terkait"><SelectValue placeholder="-- Tidak ditautkan --" /></SelectTrigger><SelectContent><SelectItem value="">-- Tidak ditautkan --</SelectItem>{tasks.map(t => <SelectItem key={t.id} value={t.id!}>{t.judulTugas}</SelectItem>)}</SelectContent></Select></div>
                    <DialogFooter className="sm:justify-between"><Button type="button" variant="destructive" onClick={() => onFullDelete(currentEntry.id)}><Trash2 size={16} className="mr-2" /> Hapus</Button><Button type="submit" disabled={!currentEntry.deskripsi.trim()}><Save size={16} className="mr-2" /> Simpan</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const LogbookItem = ({ k, onToggle, onEdit, onDelete }: { k: LogbookKegiatan, onToggle: (id: string) => void, onEdit: (entry: LogbookKegiatan) => void, onDelete: (id: string) => void }) => {
    return (
        <div className="sg-glass-panel sg-mobile-borderless p-3 flex items-start gap-3 group md:hover:-translate-y-[1px] md:hover:shadow-md transition-all duration-200">
            <Button variant="ghost" size="icon" onClick={() => onToggle(k.id)} title="Tandai selesai / belum selesai" className="mt-1 shrink-0 h-auto w-auto p-0">
                {k.selesai ? <CheckSquare size={20} className="text-green-600"/> : <Square size={20} className="text-muted-foreground"/>}
            </Button>
            <div className="flex-1 min-w-0">
                <p className={`font-medium text-foreground ${k.selesai ? 'line-through text-muted-foreground' : ''}`}>{k.deskripsi}</p>
                {k.tugasTerkaitId && (<Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-green-700 dark:text-green-300"><Link href={`/dashboard/tugas`}><LinkIcon size={12} className="mr-1.5"/> Tugas: {k.tugasTerkaitJudul || 'Lihat Tugas'}</Link></Button>)}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical size={16} /></Button></DropdownMenuTrigger>
                <DropdownMenuContent><DropdownMenuItem onClick={() => onEdit(k)}><Edit size={14} className="mr-2"/> Edit</DropdownMenuItem><DropdownMenuItem onClick={() => onDelete(k.id)} className="text-red-600 focus:text-red-600"><Trash2 size={14} className="mr-2"/> Hapus</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
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

    const parentRef = useRef<HTMLDivElement>(null);

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
    const handleAddKegiatan = async (text: string) => { const newKegiatan: LogbookKegiatan = { id: new Date().getTime().toString(), deskripsi: text, selesai: false }; const currentKegiatan = logbookData?.kegiatan || []; await updateKegiatanList([...currentKegiatan, newKegiatan]); };
    
    const handleAddTindakLanjut = async (kegiatanBaru: Partial<LogbookKegiatan>) => {
        const newKegiatan: LogbookKegiatan = {
            id: new Date().getTime().toString(),
            deskripsi: kegiatanBaru.deskripsi || '',
            selesai: kegiatanBaru.selesai ?? true,
            kategori: kegiatanBaru.kategori || 'Disposisi',
            sumber: kegiatanBaru.sumber || 'laporan_tindak_lanjut',
            suratTerkaitId: kegiatanBaru.suratTerkaitId,
            suratPerihal: kegiatanBaru.suratPerihal,
            disposisiTerkaitId: kegiatanBaru.disposisiTerkaitId,
            createdAt: new Date().toISOString()
        };
        const currentKegiatan = logbookData?.kegiatan || [];
        await updateKegiatanList([...currentKegiatan, newKegiatan]);
    };

    const handleEditSave = async (entry: LogbookKegiatan) => { if (!entry.deskripsi.trim()) { alert("Deskripsi kegiatan tidak boleh kosong."); return; } const currentKegiatan = logbookData?.kegiatan || []; await updateKegiatanList(currentKegiatan.map(k => k.id === entry.id ? entry : k)); setIsEditModalOpen(false); setEntryToEdit(null); };
    const handleToggleSelesai = async (kegiatanId: string) => { const currentKegiatan = logbookData?.kegiatan || []; await updateKegiatanList(currentKegiatan.map(k => k.id === kegiatanId ? { ...k, selesai: !k.selesai } : k)); };
    const handleDeleteKegiatan = async (kegiatanId: string) => { if (!window.confirm("Hapus kegiatan ini dari logbook?")) return; const currentKegiatan = logbookData?.kegiatan || []; await updateKegiatanList(currentKegiatan.filter(k => k.id !== kegiatanId)); if (entryToEdit?.id === kegiatanId) { setIsEditModalOpen(false); setEntryToEdit(null); } };

    const changeDate = (offset: number) => setSelectedDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + offset); return d; });

    const progress = useMemo(() => {
        const kegiatan = logbookData?.kegiatan;
        if (!kegiatan || kegiatan.length === 0) return { percent: 0, text: '0/0' };
        const total = kegiatan.length;
        const completed = kegiatan.filter(k => k.selesai).length;
        return { percent: Math.round((completed / total) * 100), text: `${completed}/${total}` };
    }, [logbookData]);

    const isToday = toYYYYMMDD(selectedDate) === toYYYYMMDD(new Date());

    const rowVirtualizer = useVirtualizer({
        count: logbookData?.kegiatan.length || 0,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 85,
        overscan: 5,
    });
    
    if (authLoading || isCacheLoading) {
        return <p className="text-center p-8">Memuat data pengguna...</p>;
    }

    return (
        <div className="sg-page">
            <SigapPageHeader 
                title="Logbook"
                icon={BookOpen}
                actions={
                    <Button onClick={() => setIsBantuanOpen(true)} title="Bantuan" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                        <HelpCircle size={20} />
                    </Button>
                }
            >
                <ShortcutNav />
            </SigapPageHeader>

            <div className="p-4 bg-card rounded-xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-10 md:static">
                <div className="flex items-center space-x-2">
                    <Button onClick={() => changeDate(-1)} variant="outline" size="icon"><ChevronLeft/></Button>
                    <span className="md:hidden font-semibold">{selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <Input type="date" value={toYYYYMMDD(selectedDate)} onChange={e => setSelectedDate(new Date(e.target.value + 'T00:00:00'))} className="hidden md:block"/>
                    <Button onClick={() => changeDate(1)} variant="outline" size="icon"><ChevronRight/></Button>
                    <Button onClick={() => setSelectedDate(new Date())} variant={isToday ? "default" : "secondary"}>Hari Ini</Button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                     <Button onClick={() => setIsAddModalOpen(true)} className="w-full md:w-auto sg-btn sg-btn-primary">
                        <Plus size={16} className="mr-2"/> Tambah Kegiatan
                    </Button>
                     <Button
                        onClick={() => setIsRekapOpen(true)}
                        className="w-full md:w-auto bg-green-600 hover:bg-green-700 sg-btn"
                    >
                        <Calendar size={16} className="mr-2"/> Rekap Bulanan
                    </Button>
                </div>
            </div>

            <div className="sg-section">
                 {loading ? <p className="text-center p-8 text-muted-foreground">Memuat data logbook...</p> : (
                    <>
                        {logbookData && logbookData.kegiatan.length > 0 ? (
                           <div className="space-y-4">
                               <div className="mb-4 sticky top-[160px] md:static z-10 bg-background/80 backdrop-blur-sm -mx-4 px-4 py-3 md:p-0 md:bg-transparent md:dark:bg-transparent">
                                    <h3 className="text-sm font-semibold text-muted-foreground">Progress: {progress.text} Selesai</h3>
                                    <Progress value={progress.percent} className="h-2 mt-1" />
                                </div>
                                
                                <div 
                                    ref={parentRef} 
                                    className="h-[600px] overflow-y-auto rounded-none border-x-0 border-t-0 border-b border-border bg-transparent p-0 md:rounded-lg md:border sg-glass-panel md:p-2"
                                    style={{ contain: 'strict' }}
                                >
                                    <div
                                        style={{
                                            height: `${rowVirtualizer.getTotalSize()}px`,
                                            width: '100%',
                                            position: 'relative',
                                        }}
                                    >
                                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                            const k = logbookData.kegiatan[virtualRow.index];
                                            return (
                                                <div
                                                    key={virtualRow.key}
                                                    data-index={virtualRow.index}
                                                    ref={rowVirtualizer.measureElement}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        transform: `translateY(${virtualRow.start}px)`,
                                                    }}
                                                    className="pb-0 md:pb-3"
                                                >
                                                    <LogbookItem 
                                                        k={k} 
                                                        onToggle={handleToggleSelesai} 
                                                        onDelete={handleDeleteKegiatan} 
                                                        onEdit={(entry) => { setEntryToEdit(entry); setIsEditModalOpen(true); }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                           </div>
                        ) : (
                            <div className="mt-8 p-10 bg-card rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center">
                                <BookOpen size={48} className="text-muted-foreground/30 mb-4" />
                                <h2 className="text-xl font-semibold text-foreground">Logbook Kosong</h2>
                                <p className="mt-2 text-muted-foreground max-w-md">Belum ada kegiatan yang dicatat untuk tanggal ini. Tambahkan kegiatan baru menggunakan tombol (+).</p>
                            </div>
                        )}
                    </>
                 )}
            </div>
            
            <SmartAddKegiatanModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSaveUmum={handleAddKegiatan}
                onSaveTindakLanjut={handleAddTindakLanjut}
                userProfile={effectiveProfile}
            />
            <EditKegiatanModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleEditSave} onFullDelete={handleDeleteKegiatan} entry={entryToEdit} tasks={tasks} />
            <BantuanHalamanModal isOpen={isBantuanOpen} onClose={() => setIsBantuanOpen(false)} />
            
            <RekapBulananModal 
                isOpen={isRekapOpen} 
                onClose={() => setIsRekapOpen(false)} 
                userProfile={effectiveProfile}
                jabatanNama={effectiveJabatan?.namaJabatan || 'Staf'} 
                opdNama={opdName || 'Pemerintah Kota Surakarta'} 
                uploader={uploader}
            />
        </div>
    );
}