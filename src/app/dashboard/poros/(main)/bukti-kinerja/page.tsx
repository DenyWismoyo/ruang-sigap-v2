"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { useGoogleDriveUploader } from '@/app/dashboard/poros/hooks/useGoogleDriveUploader';
import { BuktiKinerja } from '@/types';
import { Upload, FileText, CheckCircle, Loader2, AlertCircle, Link as LinkIcon, ExternalLink, ChevronDown, Download, BarChart2, FolderCheck, Zap, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { safeFormatDate } from '@/lib/utils';
import { AktivitasCombobox } from '@/components/ekinerja/AktivitasCombobox';
import { EkinerjaBridgeModal } from '@/components/ekinerja/EkinerjaBridgeModal';
import { AktivitasSolo } from '@/data/masterAktivitasSolo';

// --- Impor Komponen Shadcn ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle, } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { generateLaporanKinerjaPdf } from '@/lib/pdfGenerator';
// --- Akhir Impor Shadcn ---


const RiwayatItem = ({ 
    item, 
    onPrepareEkinerja 
}: { 
    item: BuktiKinerja; 
    onPrepareEkinerja: (item: BuktiKinerja) => void;
}) => {
    return (
        <div className="group flex flex-col p-4 bg-card rounded-xl border border-border hover:border-teal-500 hover:shadow-md transition-all h-full justify-between">
            <div>
                <div className="flex justify-between items-start mb-2.5">
                    <Badge variant={item.sumber === 'laporan' ? 'default' : item.sumber === 'tugas_selesai' ? 'secondary' : 'outline'} className="text-[10px] uppercase">
                        {item.sumber === 'laporan' ? 'Laporan TL' : item.sumber === 'tugas_selesai' ? 'Penyelesaian Tugas' : 'Manual Upload'}
                    </Badge>
                    {item.googleDriveLink && (
                        <a 
                            href={item.googleDriveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-muted-foreground hover:text-teal-600 transition-colors"
                            title="Buka File di Google Drive"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                </div>
                <p className="font-semibold text-sm text-foreground line-clamp-2 mb-1.5">{item.judul}</p>
                {item.aktivitasNama ? (
                    <Badge variant="outline" className="text-[11px] font-normal bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800 line-clamp-1 mb-2">
                        ⚡ {item.aktivitasNama}
                    </Badge>
                ) : (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.deskripsi || item.fileName || 'Kinerja sistem otomatis'}</p>
                )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center text-[11px]">
                    <FileText size={12} className="mr-1"/> {safeFormatDate(item.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => onPrepareEkinerja(item)}
                    className="h-7 px-2.5 text-xs bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm"
                >
                    <Zap size={12} />
                    <span>⚡ Siapkan e-Kinerja</span>
                </Button>
            </div>
        </div>
    );
};

export default function BuktiKinerjaPage() {
    const { userProfile } = useUserAuth();
    const { uploadFile, uploadStatus, errorMessage, isReady, isGoogleConnected, isFolderConfigured } = useGoogleDriveUploader();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [judul, setJudul] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [selectedAktivitas, setSelectedAktivitas] = useState<AktivitasSolo | undefined>(undefined);

    // Modal e-Kinerja Bridge State
    const [activeModalBukti, setActiveModalBukti] = useState<BuktiKinerja | null>(null);
    const [isEkinerjaModalOpen, setIsEkinerjaModalOpen] = useState(false);
    
    const [riwayatList, setRiwayatList] = useState<BuktiKinerja[]>([]);
    const [loadingRiwayat, setLoadingRiwayat] = useState(true);
    const [isRiwayatLoadingMore, setIsRiwayatLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [activeTab, setActiveTab] = useState('semua');
    
    const ITEMS_PER_PAGE = 12;

    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [uploadError, setUploadError] = useState(''); 

    const handleConnectGoogle = () => {
        if (userProfile?.nip) {
            const statePayload = JSON.stringify({ 
                userId: userProfile.nip, 
                redirectUrl: '/dashboard/poros/bukti-kinerja' 
            });
            const state = btoa(statePayload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            window.location.href = `/api/google/auth?state=${state}`;
        }
    };

    const fetchRiwayat = useCallback(async (loadMore = false) => {
        if (!userProfile?.uid) return;

        if (loadMore) {
            setIsRiwayatLoadingMore(true);
        } else {
            setLoadingRiwayat(true);
            setRiwayatList([]); 
            setLastVisible(null);
            setHasMore(true);
        }

        try {
            let baseQuery = collection(db, 'buktiKinerja');
            let constraints: any[] = [
                where('userId', '==', userProfile.uid),
                orderBy('createdAt', 'desc')
            ];

            // Tab Filtering requires composite index for 'sumber' if we add where('sumber')
            // Since we don't have the index right now, we will fetch all and filter in frontend for this demo,
            // or just use limits on the base query and filter client side.
            constraints.push(limit(ITEMS_PER_PAGE));

            let q = query(baseQuery, ...constraints);

            if (loadMore && lastVisible) {
                q = query(baseQuery, where('userId', '==', userProfile.uid), orderBy('createdAt', 'desc'), startAfter(lastVisible), limit(ITEMS_PER_PAGE));
            }

            const snapshot = await getDocs(q);
            const newRiwayat = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BuktiKinerja));
            
            setRiwayatList(prev => loadMore ? [...prev, ...newRiwayat] : newRiwayat);
            
            if (snapshot.docs.length > 0) {
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            }
            
            setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);

        } catch (error) {
            console.error("Error fetching riwayat:", error);
        } finally {
            setLoadingRiwayat(false);
            setIsRiwayatLoadingMore(false);
        }
    }, [userProfile?.uid, lastVisible]);

    useEffect(() => {
        if (userProfile?.uid) {
            fetchRiwayat(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userProfile?.uid]);

    // Handle Upload Manual
    const handleUpload = async (fileToUpload: File | Blob) => {
        if (!isFolderConfigured) {
            setUploadError("Harap atur ID Folder Google Drive di profil Anda terlebih dahulu.");
            return;
        }
        if (!isGoogleConnected) {
            setUploadError("Akun Google belum terhubung. Harap hubungkan akun Google Anda terlebih dahulu.");
            return;
        }
        if (!judul.trim()) {
            setUploadError("Judul Bukti Dukung wajib diisi.");
            return;
        }
        const isFileInstance = fileToUpload instanceof File;

        setIsProcessing(true);
        setSuccessMessage('');
        setUploadError(''); 

        try {
            const dateObj = new Date();
            const dateStr = dateObj.toISOString().split('T')[0].replace(/-/g, '');
            const safeJudul = judul.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 50).trim();
            
            let fileExtension = '.jpg'; 
            if (isFileInstance && (fileToUpload as File).name) {
                const parts = (fileToUpload as File).name.split('.');
                if (parts.length > 1) {
                    fileExtension = '.' + parts.pop();
                }
            }
            const finalFileName = `${dateStr} - ${safeJudul}${fileExtension}`;

            const monthIndex = dateObj.getMonth() + 1;
            const monthName = dateObj.toLocaleString('id-ID', { month: 'long' });
            const year = dateObj.getFullYear();
            const subFolderName = `${monthIndex}. ${year} ${monthName} - Bukti E Kinerja`;

            const link = await uploadFile(
                fileToUpload, 
                finalFileName, 
                userProfile!.googleDriveReportLink,
                subFolderName 
            );

            if (link && userProfile) {
                await addDoc(collection(db, 'buktiKinerja'), {
                    userId: userProfile.uid,
                    opdId: userProfile.opdId,
                    judul: judul,
                    googleDriveLink: link,
                    fileName: finalFileName,
                    fileType: fileToUpload.type,
                    sumber: 'manual', // Set sumber manual
                    aktivitasId: selectedAktivitas?.id || null,
                    aktivitasNama: selectedAktivitas?.nama || null,
                    createdAt: Timestamp.now(),
                } as Omit<BuktiKinerja, 'id'>);
                
                setSuccessMessage(`File berhasil diunggah ke folder "${subFolderName}"!`);
                setJudul('');
                setFile(null);
                setSelectedAktivitas(undefined);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                
                fetchRiwayat(false); 
            } else {
                throw new Error(errorMessage || "Upload Gagal. Link tidak diterima.");
            }
        } catch (err: any) {
            console.error("Upload process error:", err);
            setUploadError(err.message || "Gagal mengunggah file.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setUploadError("Silakan pilih file terlebih dahulu.");
            return;
        }
        await handleUpload(file);
    };

    const handleExportPDF = () => {
        if (!userProfile) return;
        const monthYearStr = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        // Export only current visible list for simplicity, or we could fetch all for the month.
        generateLaporanKinerjaPdf(riwayatList, userProfile, monthYearStr);
    };

    const isUploadDisabled = isProcessing || !judul.trim() || !file || !isReady;

    const handleOpenEkinerjaModal = (item: BuktiKinerja) => {
        setActiveModalBukti(item);
        setIsEkinerjaModalOpen(true);
    };

    // Filter client-side
    const filteredRiwayat = riwayatList.filter(item => {
        if (activeTab === 'semua') return true;
        if (activeTab === 'otomatis') return item.sumber === 'laporan' || item.sumber === 'tugas_selesai';
        if (activeTab === 'manual') return item.sumber === 'manual' || !item.sumber;
        return true;
    });

    const totalKinerjaBulanIni = riwayatList.length; 
    const totalOtomatis = riwayatList.filter(i => i.sumber === 'laporan' || i.sumber === 'tugas_selesai').length;

    return (
        <div className="animate-fadeInUp pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-foreground flex items-center">
                    <BarChart2 size={28} className="mr-3 text-teal-600"/> Portofolio Kinerja
                </h1>
                <Button onClick={handleExportPDF} variant="outline" className="flex items-center border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/40">
                    <Download size={16} className="mr-2 text-teal-600" /> Export PDF Bulanan
                </Button>
            </div>
            
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-teal-50/50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Kinerja Tercatat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">{totalKinerjaBulanIni}</div>
                        <p className="text-xs text-muted-foreground mt-1">Dokumen/Aktivitas</p>
                    </CardContent>
                </Card>
                <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tercatat Otomatis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalOtomatis}</div>
                        <p className="text-xs text-muted-foreground mt-1">Dari Penyelesaian Tugas & Laporan</p>
                    </CardContent>
                </Card>
            </div>

            {/* Status 1: Folder Belum Diatur */}
            {!isFolderConfigured && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" /> 
                    <AlertTitle>Folder Google Drive Belum Diatur</AlertTitle>
                    <AlertDescription className="mt-1">
                        Anda harus mengatur <strong>ID Folder Google Drive</strong> di halaman <Link href="/dashboard/poros/profil" className="font-bold underline hover:text-yellow-600">Profil Saya</Link> untuk fitur upload manual. Pencatatan otomatis tetap berjalan.
                    </AlertDescription>
                </Alert>
            )}

            {/* Status 2: Akun Google Belum Terhubung */}
            {!isGoogleConnected && (
                <Alert className="mb-6 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="font-semibold">Akun Google Belum Terhubung</AlertTitle>
                    <AlertDescription className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <span>Aplikasi memerlukan izin akses Google Drive untuk menyimpan file bukti kinerja Anda secara otomatis.</span>
                        <Button 
                            type="button" 
                            size="sm" 
                            onClick={handleConnectGoogle}
                            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                        >
                            Hubungkan Akun Google
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Status 3: Siap Upload */}
            {isReady && (
                <div className="mb-6 p-4 bg-teal-50/50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <FolderCheck className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                        <div>
                            <span className="font-semibold text-foreground">Google Drive Tersinkron: </span>
                            <span className="text-muted-foreground">{userProfile?.googleEmail || 'Akun Aktif'}</span>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Target Folder: <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">{userProfile?.googleDriveReportLink}</code>
                    </div>
                </div>
            )}

            <Tabs defaultValue="semua" onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                    <TabsTrigger value="semua">Semua Portofolio</TabsTrigger>
                    <TabsTrigger value="otomatis">Catatan Otomatis</TabsTrigger>
                    <TabsTrigger value="manual">Upload Manual</TabsTrigger>
                </TabsList>
            </Tabs>

            {activeTab === 'manual' && (
                <div className="p-6 bg-card rounded-xl shadow-sm border border-border mb-8 max-w-2xl animate-in fade-in">
                    <h3 className="font-semibold mb-4 flex items-center text-teal-700 dark:text-teal-300">
                        <Upload size={18} className="mr-2 text-teal-600"/> Form Upload Manual
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="judul">Judul Bukti Dukung</Label>
                            <Input 
                                id="judul"
                                type="text" 
                                value={judul} 
                                onChange={e => setJudul(e.target.value)} 
                                placeholder="Contoh: Notulen Rapat Koordinasi Wilayah"
                                disabled={isProcessing || !isReady}
                                required 
                                className="mt-1"
                            />
                        </div>

                        {/* Pemilihan Aktivitas Resmi BKPSDM */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Label className="text-xs font-semibold flex items-center gap-1">
                                    <Sparkles size={13} className="text-teal-600" /> Aktivitas Resmi BKPSDM Solo (Opsional)
                                </Label>
                                {selectedAktivitas && (
                                    <span className="text-xs text-muted-foreground">
                                        Bobot: <strong className="text-foreground">{selectedAktivitas.nilaiPoin} Poin</strong> ({selectedAktivitas.satuan})
                                    </span>
                                )}
                            </div>
                            <AktivitasCombobox
                                value={selectedAktivitas?.id}
                                onChange={(act) => setSelectedAktivitas(act)}
                                tenant="poros"
                                placeholder="Pilih aktivitas resmi Pemkot Solo (Kepwal 786/154)..."
                            />
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Tautkan dengan 1 dari 152 aktivitas resmi agar formulir e-Kinerja dapat terisi otomatis 1-klik.
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="file-upload">Pilih File / Ambil Foto</Label>
                            <Input 
                                id="file-upload"
                                type="file" 
                                ref={fileInputRef}
                                onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                                accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                                className="mt-1"
                                disabled={isProcessing || !isReady}
                            />
                        </div>
                        
                        {uploadStatus === 'uploading' && (
                            <Alert variant="default" className="bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <AlertDescription>Mengunggah file ke folder E-Kinerja...</AlertDescription>
                            </Alert>
                        )}
                        {uploadError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{uploadError}</AlertDescription></Alert>}
                        {successMessage && <Alert variant="default" className="bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"><CheckCircle className="h-4 w-4" /><AlertDescription>{successMessage}</AlertDescription></Alert>}

                        <Button type="submit" disabled={isUploadDisabled} className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white">
                            <Upload size={16} className="mr-2"/> Upload Sekarang
                        </Button>
                    </form>
                </div>
            )}

            <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <p className="text-xs text-muted-foreground">
                        💡 Tips: Klik tombol <strong>⚡ Siapkan e-Kinerja</strong> pada setiap bukti untuk mengisi otomatis formulir BKPSDM.
                    </p>
                </div>

                {loadingRiwayat ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-teal-600" size={32}/></div>
                ) : filteredRiwayat.length === 0 ? (
                    <p className="text-center text-muted-foreground py-16 bg-card rounded-xl border border-dashed border-border">
                        Belum ada bukti dukung untuk kategori ini.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRiwayat.map(item => (
                            <RiwayatItem 
                                key={item.id} 
                                item={item} 
                                onPrepareEkinerja={handleOpenEkinerjaModal}
                            />
                        ))}
                    </div>
                )}
                
                {hasMore && (
                    <div className="flex justify-center mt-8">
                        <Button onClick={() => fetchRiwayat(true)} disabled={isRiwayatLoadingMore} variant="outline" className="w-full sm:w-auto">
                            <ChevronDown size={16} className="mr-2" /> {isRiwayatLoadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal Jembatan e-Kinerja Solo */}
            <EkinerjaBridgeModal
                isOpen={isEkinerjaModalOpen}
                onClose={() => setIsEkinerjaModalOpen(false)}
                bukti={activeModalBukti}
                tenant="poros"
            />
        </div>
    );
}
