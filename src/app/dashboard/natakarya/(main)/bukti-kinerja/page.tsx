"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { useGoogleDriveUploader } from '@/app/dashboard/natakarya/hooks/useGoogleDriveUploader';
import { BuktiKinerja } from '@/types';
import { Upload, FileText, CheckCircle, Loader2, AlertCircle, Link as LinkIcon, ExternalLink, ChevronDown, Download, BarChart2 } from 'lucide-react';
import Link from 'next/link';

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


const RiwayatItem = ({ item }: { item: BuktiKinerja }) => {
    return (
        <a 
            href={item.googleDriveLink || '#'} 
            target={item.googleDriveLink ? "_blank" : "_self"} 
            rel="noopener noreferrer"
            className="group flex flex-col p-4 bg-card rounded-xl border border-border hover:border-blue-500 hover:shadow-md transition-all h-full"
        >
            <div className="flex justify-between items-start mb-3">
                <Badge variant={item.sumber === 'laporan' ? 'default' : item.sumber === 'tugas_selesai' ? 'secondary' : 'outline'} className="text-[10px] uppercase">
                    {item.sumber === 'laporan' ? 'Laporan TL' : item.sumber === 'tugas_selesai' ? 'Penyelesaian Tugas' : 'Manual Upload'}
                </Badge>
                {item.googleDriveLink && <ExternalLink size={14} className="text-muted-foreground group-hover:text-blue-600" />}
            </div>
            <div className="flex-1">
                <p className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{item.judul}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{item.deskripsi || item.fileName || 'Kinerja sistem otomatis'}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center"><FileText size={12} className="mr-1"/> {item.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
        </a>
    );
};

export default function BuktiKinerjaPage() {
    const { userProfile } = useUserAuth();
    const { uploadFile, uploadStatus, errorMessage, isReady } = useGoogleDriveUploader();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [judul, setJudul] = useState('');
    const [file, setFile] = useState<File | null>(null);
    
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

    const linkNotSet = !userProfile?.googleDriveReportLink;

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
        if (linkNotSet) {
            setUploadError("Harap atur ID Folder Google Drive di profil Anda terlebih dahulu.");
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
                    createdAt: Timestamp.now(),
                } as Omit<BuktiKinerja, 'id'>);
                
                setSuccessMessage(`File berhasil diunggah ke folder "${subFolderName}"!`);
                setJudul('');
                setFile(null);
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

    const isUploadDisabled = isProcessing || !judul.trim() || !file || !isReady || linkNotSet;

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
                    <BarChart2 size={28} className="mr-3 text-blue-600"/> Portofolio Kinerja
                </h1>
                <Button onClick={handleExportPDF} variant="outline" className="flex items-center">
                    <Download size={16} className="mr-2" /> Export PDF Bulanan
                </Button>
            </div>
            
            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Kinerja Tercatat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalKinerjaBulanIni}</div>
                        <p className="text-xs text-muted-foreground mt-1">Dokumen/Aktivitas</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tercatat Otomatis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">{totalOtomatis}</div>
                        <p className="text-xs text-muted-foreground mt-1">Dari Penyelesaian Tugas & Laporan</p>
                    </CardContent>
                </Card>
            </div>

            {linkNotSet && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" /> 
                    <AlertTitle>Folder Google Drive Belum Diatur</AlertTitle>
                    <AlertDescription>
                        Anda harus mengatur **ID Folder Google Drive** di halaman <Link href="/dashboard/profil" className="font-bold underline hover:text-yellow-600">Profil</Link> Anda untuk fitur upload manual. Pencatatan otomatis tetap berjalan.
                    </AlertDescription>
                </Alert>
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
                    <h3 className="font-semibold mb-4 flex items-center"><Upload size={18} className="mr-2"/> Form Upload Manual</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="judul">Judul Bukti Dukung</Label>
                            <Input 
                                id="judul"
                                type="text" 
                                value={judul} 
                                onChange={e => setJudul(e.target.value)} 
                                placeholder="Contoh: Laporan Kegiatan Harian"
                                disabled={isProcessing || linkNotSet}
                                required 
                                className="mt-1"
                            />
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
                                disabled={isProcessing || linkNotSet}
                            />
                        </div>
                        
                        {uploadStatus === 'uploading' && (
                            <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <AlertDescription>Mengunggah file ke folder E-Kinerja...</AlertDescription>
                            </Alert>
                        )}
                        {uploadError && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{uploadError}</AlertDescription></Alert>}
                        {successMessage && <Alert variant="default" className="bg-green-50 text-green-800 border-green-200"><CheckCircle className="h-4 w-4" /><AlertDescription>{successMessage}</AlertDescription></Alert>}

                        <Button type="submit" disabled={isUploadDisabled} className="w-full sm:w-auto">
                            <Upload size={16} className="mr-2"/> Upload Sekarang
                        </Button>
                    </form>
                </div>
            )}

            <div>
                {loadingRiwayat ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" size={32}/></div>
                ) : filteredRiwayat.length === 0 ? (
                    <p className="text-center text-muted-foreground py-16 bg-card rounded-xl border border-dashed border-border">
                        Belum ada bukti dukung untuk kategori ini.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredRiwayat.map(item => (
                            <RiwayatItem key={item.id} item={item} />
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
        </div>
    );
}
