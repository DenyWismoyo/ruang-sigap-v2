// Lokasi: src/app/dashboard/bukti-kinerja/page.tsx
// [UPDATE] Menambahkan Tahun pada format nama sub-folder otomatis (Angka. Tahun Bulan - Bukti E Kinerja)

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { useGoogleDriveUploader } from '@/app/dashboard/sigap/hooks/useGoogleDriveUploader';
import { BuktiKinerja } from '@/types';
import { Upload, FileText, CheckCircle, Loader2, AlertCircle, Link as LinkIcon, ExternalLink, ChevronDown, FolderCheck, Zap, Sparkles } from 'lucide-react';
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
import { Badge } from "@/components/ui/badge";
// --- Akhir Impor Shadcn ---


const RiwayatItem = ({ 
    item, 
    onPrepareEkinerja 
}: { 
    item: BuktiKinerja; 
    onPrepareEkinerja: (item: BuktiKinerja) => void;
}) => {
    return (
        <div className="group flex flex-col justify-between p-4 bg-card rounded-xl border border-border hover:border-blue-500 hover:shadow-md transition-all">
            <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <FileText size={18} className="text-blue-600 flex-shrink-0" />
                        <p className="font-semibold text-sm text-foreground truncate" title={item.judul}>
                            {item.judul}
                        </p>
                    </div>
                    {item.googleDriveLink && (
                        <a 
                            href={item.googleDriveLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1 rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Buka File di Google Drive"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                </div>

                {item.aktivitasNama ? (
                    <div className="mb-3">
                        <Badge variant="secondary" className="text-[11px] font-normal bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 line-clamp-1">
                            ⚡ {item.aktivitasNama}
                        </Badge>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                        {item.fileName || 'Bukti kinerja harian'}
                    </p>
                )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground text-[11px]">
                    {safeFormatDate(item.createdAt)}
                </span>
                <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => onPrepareEkinerja(item)}
                    className="h-7 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm"
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
    const ITEMS_PER_PAGE = 10;

    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [uploadError, setUploadError] = useState(''); 

    const handleConnectGoogle = () => {
        if (userProfile?.nip) {
            const statePayload = JSON.stringify({ 
                userId: userProfile.nip, 
                redirectUrl: '/dashboard/sigap/bukti-kinerja' 
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
            let q = query(
                collection(db, 'buktiKinerja'),
                where('userId', '==', userProfile.uid),
                orderBy('createdAt', 'desc'),
                limit(ITEMS_PER_PAGE)
            );

            if (loadMore && lastVisible) {
                q = query(q, startAfter(lastVisible));
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

    // Fungsi inti untuk meng-handle upload
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
            if (isFileInstance && fileToUpload.name) {
                const parts = fileToUpload.name.split('.');
                if (parts.length > 1) {
                    fileExtension = '.' + parts.pop();
                }
            }
            const finalFileName = `${dateStr} - ${safeJudul}${fileExtension}`;

            // --- GENERATE NAMA SUB FOLDER ---
            const monthIndex = dateObj.getMonth() + 1; // 1-12
            const monthName = dateObj.toLocaleString('id-ID', { month: 'long' });
            const year = dateObj.getFullYear();
            const subFolderName = `${monthIndex}. ${year} ${monthName} - Bukti E Kinerja`;

            const link = await uploadFile(
                fileToUpload, 
                finalFileName, 
                userProfile!.googleDriveReportLink,
                subFolderName // Kirim nama sub folder ke uploader
            );

            if (link && userProfile) {
                await addDoc(collection(db, 'buktiKinerja'), {
                    userId: userProfile.uid,
                    opdId: userProfile.opdId,
                    judul: judul,
                    googleDriveLink: link,
                    fileName: finalFileName,
                    fileType: fileToUpload.type,
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

    const isUploadDisabled = isProcessing || !judul.trim() || !file || !isReady;

    const handleOpenEkinerjaModal = (item: BuktiKinerja) => {
        setActiveModalBukti(item);
        setIsEkinerjaModalOpen(true);
    };

    return (
        <div className="animate-fadeInUp pb-12">
            <h1 className="text-3xl font-bold text-foreground flex items-center mb-6">
                <Upload size={28} className="mr-3 text-blue-600"/> Upload Bukti Dukung E-Kinerja
            </h1>
            
            {/* Status 1: Folder Belum Diatur */}
            {!isFolderConfigured && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" /> 
                    <AlertTitle>Folder Google Drive Belum Diatur</AlertTitle>
                    <AlertDescription className="mt-1">
                        Anda harus mengatur <strong>ID Folder Google Drive</strong> di halaman <Link href="/dashboard/sigap/profil" className="font-bold underline hover:text-yellow-600">Profil Saya</Link> sebelum dapat menggunakan fitur ini.
                    </AlertDescription>
                </Alert>
            )}

            {/* Status 2: Akun Google Belum Terhubung */}
            {!isGoogleConnected && (
                <Alert className="mb-6 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <AlertTitle className="font-semibold">Akun Google Belum Terhubung</AlertTitle>
                    <AlertDescription className="mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <span>Aplikasi memerlukan izin otorisasi Google Drive agar dapat mengunggah file bukti kinerja ke akun Anda.</span>
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
                <div className="mb-6 p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <FolderCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
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

            {/* Form Upload */}
            <div className="p-6 bg-card rounded-xl shadow-md border border-border">
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
                        <p className="text-xs text-muted-foreground mt-1">File akan otomatis masuk ke folder bulan ini (cth: 9. 2026 September - Bukti E Kinerja).</p>
                    </div>

                    {/* Pemilihan Aktivitas Resmi BKPSDM */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                                <Sparkles size={13} className="text-blue-600" /> Aktivitas Resmi BKPSDM Solo (Opsional)
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
                            tenant="sigap"
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
                            capture="environment"
                            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                            className="mt-1"
                            disabled={isProcessing || !isReady}
                        />
                    </div>
                    
                    {uploadStatus === 'uploading' && (
                        <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>Mengunggah file ke folder E-Kinerja...</AlertDescription>
                        </Alert>
                    )}
                    
                    {uploadError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{uploadError}</AlertDescription>
                        </Alert>
                    )}
                    {errorMessage && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}
                    {successMessage && (
                        <Alert variant="default" className="bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 pt-2">
                        <Button 
                            type="submit" 
                            disabled={isUploadDisabled}
                            className="w-full flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Upload size={16} className="mr-2"/> Upload
                        </Button>
                    </div>
                </form>
            </div>

            {/* Riwayat Upload & Bridge e-Kinerja */}
            <div className="mt-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">Riwayat Upload Bukti Kinerja</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Klik tombol <strong>⚡ Siapkan e-Kinerja</strong> pada setiap bukti untuk mengisi otomatis portal BKPSDM.
                        </p>
                    </div>
                </div>

                {loadingRiwayat ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" size={28}/></div>
                ) : riwayatList.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 bg-card rounded-lg border border-dashed border-border">
                        Belum ada bukti dukung yang diunggah.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {riwayatList.map(item => (
                            <RiwayatItem 
                                key={item.id} 
                                item={item} 
                                onPrepareEkinerja={handleOpenEkinerjaModal}
                            />
                        ))}
                    </div>
                )}
                
                {hasMore && (
                    <div className="flex justify-center mt-6">
                        <Button
                            onClick={() => fetchRiwayat(true)}
                            disabled={isRiwayatLoadingMore}
                            variant="outline"
                        >
                            <ChevronDown size={16} className="mr-2" />
                            {isRiwayatLoadingMore ? 'Memuat...' : 'Muat Lebih Banyak'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal Jembatan e-Kinerja Solo */}
            <EkinerjaBridgeModal
                isOpen={isEkinerjaModalOpen}
                onClose={() => setIsEkinerjaModalOpen(false)}
                bukti={activeModalBukti}
                tenant="sigap"
            />
        </div>
    );
}