// Lokasi: src/app/dashboard/surat-keluar/persetujuan/[id]/page.tsx
// [UPDATE LOGBOOK OTOMATIS]
// - Menambahkan pencatatan logbook otomatis saat Menyetujui atau Merevisi draf.
// - Mengimpor updateLogbook dari lib/logbookUtils.

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { marked } from 'marked';

import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  writeBatch,
  Timestamp,
  addDoc,
  getDocs
} from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { DrafPersetujuan, RiwayatPersetujuan, ApprovalStep, UserProfile, Jabatan } from '@/types';
import {
  ArrowLeft,
  FileSignature,
  User,
  Calendar,
  ExternalLink,
  CheckCircle,
  Clock,
  RotateCcw,
  XCircle,
  AlertCircle,
  Send,
  Loader2,
  ListOrdered,
  History,
  Eye
} from 'lucide-react';
import Avatar from '@/app/dashboard/sigap/components/Avatar';
import { formatDateRelative } from '@/lib/utils';
import ConfirmModal from '@/app/dashboard/sigap/components/ConfirmModal';
import { updateLogbook } from '@/lib/logbookUtils'; // Import helper logbook

// --- Komponen Anak untuk Halaman Detail (Tidak Berubah) ---
// ... (InfoDrafCard, AlurPersetujuan, RiwayatAktivitas tetap sama) ...

// Kartu Info Draf
const InfoDrafCard = ({ draf, pembuatNama }: { draf: DrafPersetujuan, pembuatNama: string }) => (
  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border mb-6">
    <div className="p-4 border-b border-gray-200 dark:border-dark-border">
      <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-dark-text-primary">
        <FileSignature size={18} className="mr-3 text-blue-600" />
        Informasi Draf
      </h3>
    </div>
    <div className="p-4 space-y-3 text-sm">
      <div className="flex items-start">
        <User size={16} className="mr-3 mt-1 text-gray-400 flex-shrink-0" />
        <div>
          <p className="font-semibold text-gray-500 dark:text-gray-400">Pembuat Draf</p>
          <p className="text-gray-800 dark:text-dark-text-primary">{pembuatNama}</p>
        </div>
      </div>
      <div className="flex items-start">
        <Calendar size={16} className="mr-3 mt-1 text-gray-400 flex-shrink-0" />
        <div>
          <p className="font-semibold text-gray-500 dark:text-gray-400">Tanggal Dibuat</p>
          <p className="text-gray-800 dark:text-dark-text-primary">
            {draf.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
      {draf.googleDocUrl && !draf.content && (
        <a
          href={draf.googleDocUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
        >
          <ExternalLink size={14} /> Buka Google Doc
        </a>
      )}
    </div>
  </div>
);

// Kartu Alur Persetujuan
const AlurPersetujuan = ({ draf, userCache }: {
  draf: DrafPersetujuan,
  userCache: Map<string, UserProfile>
}) => {
  
  const getStatusIcon = (stepStatus: ApprovalStep['status'], isCurrent: boolean) => {
    switch (stepStatus) {
      case 'Revisi': 
        if (draf?.status === 'Ditolak') {
          return <XCircle size={20} className="text-red-500" />;
        }
        return <RotateCcw size={20} className="text-yellow-500" />;
      
      case 'Disetujui':
        return <CheckCircle size={20} className="text-green-500" />;
        
      case 'Menunggu':
        if (isCurrent && draf?.status === 'Proses Review') {
          return <Clock size={20} className="text-blue-500 animate-pulse" />;
        }
        return <Clock size={20} className="text-gray-300 dark:text-slate-600" />;
        
      default:
        return <Clock size={20} className="text-gray-300 dark:text-slate-600" />;
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border mb-6">
      <div className="p-4 border-b border-gray-200 dark:border-dark-border">
        <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-dark-text-primary">
          <ListOrdered size={18} className="mr-3 text-blue-600" />
          Alur Persetujuan
        </h3>
      </div>
      <div className="p-4 space-y-4">
        {draf.approvalChain.map((step, index) => {
          const isCurrent = index === draf.currentStep;
          const user = userCache.get(step.jabatanId);
          return (
            <div key={step.jabatanId} className="flex items-start">
              <div className="flex flex-col items-center mr-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                  {getStatusIcon(step.status, isCurrent)}
                </div>
                {index < draf.approvalChain.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-slate-700 my-1"></div>}
              </div>
              <div className="pb-4">
                <p className="font-semibold text-gray-800 dark:text-dark-text-primary">
                  {user?.namaLengkap || step.namaJabatan}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">{step.namaJabatan}</p>
                {step.comments && (
                  <p className="text-xs italic text-yellow-700 dark:text-yellow-300 mt-1">"{step.comments}"</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Kartu Riwayat
const RiwayatAktivitas = ({ riwayat }: { riwayat: RiwayatPersetujuan[] }) => (
  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border">
    <div className="p-4 border-b border-gray-200 dark:border-dark-border">
      <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-dark-text-primary">
        <History size={18} className="mr-3 text-blue-600" />
        Riwayat Aktivitas
      </h3>
    </div>
    <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
      {riwayat.map((log, index) => (
        <div key={index} className="flex items-start">
          <Avatar name={log.actorName} className="w-8 h-8 mr-3 mt-1" />
          <div>
            <p className="text-sm">
              <span className="font-semibold text-gray-800 dark:text-dark-text-primary">{log.actorName}</span>
              <span className="text-gray-600 dark:text-slate-300"> {log.action.toLowerCase()}</span>
            </p>
            {log.comments && <p className="text-sm italic text-gray-500 dark:text-slate-400 mt-1">"{log.comments}"</p>}
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{formatDateRelative(log.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Form Aksi Persetujuan (Untuk Pimpinan)
const FormPersetujuan = ({ onAction, isProcessing }: { onAction: (action: 'approve' | 'reject', comments: string) => void, isProcessing: boolean }) => {
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border">
      <div className="p-4 border-b border-gray-200 dark:border-dark-border">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-dark-text-primary">Tindakan Anda</h3>
      </div>
      <div className="p-4 space-y-3">
        <textarea
          value={comments}
          onChange={e => setComments(e.target.value)}
          rows={3}
          placeholder="Tulis komentar/catatan revisi di sini..."
          className="w-full p-2 bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-dark-text-primary border border-gray-300 dark:border-dark-border rounded-lg"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => { setActionType('reject'); onAction('reject', comments); }}
            disabled={isProcessing || !comments} // Wajib isi komentar untuk revisi
            className="flex-1 flex items-center justify-center px-4 py-2 font-bold text-white bg-yellow-500 rounded-lg hover:bg-yellow-600 disabled:bg-gray-400"
          >
            {isProcessing && actionType === 'reject' ? <Loader2 className="animate-spin" /> : <RotateCcw size={16} className="mr-2" />}
            Kembalikan (Revisi)
          </button>
          <button
            onClick={() => { setActionType('approve'); onAction('approve', comments); }}
            disabled={isProcessing}
            className="flex-1 flex items-center justify-center px-4 py-2 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {isProcessing && actionType === 'approve' ? <Loader2 className="animate-spin" /> : <CheckCircle size={16} className="mr-2" />}
            Setujui & Teruskan
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 text-center">Komentar wajib diisi jika Anda mengembalikan draf.</p>
      </div>
    </div>
  );
};

// Form Aksi Revisi (Untuk Pembuat)
const FormRevisi = ({ onResubmit, isProcessing }: { onResubmit: () => void, isProcessing: boolean }) => (
  <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-yellow-300 dark:border-yellow-700">
    <div className="p-4 border-b border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30">
      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 flex items-center">
        <AlertCircle size={18} className="mr-3" /> Draf Perlu Revisi
      </h3>
    </div>
    <div className="p-4 space-y-3">
      <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
        Draf ini dikembalikan oleh atasan Anda. Silakan perbarui dokumen di Google Doc, lalu kirim ulang draf ini untuk ditinjau kembali.
      </p>
      <button
        onClick={onResubmit}
        disabled={isProcessing}
        className="w-full flex items-center justify-center px-4 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isProcessing ? <Loader2 className="animate-spin" /> : <Send size={16} className="mr-2" />}
        Kirim Ulang Hasil Revisi
      </button>
    </div>
  </div>
);

// Komponen Preview Inline Markdown
const InlineDocumentPreview = ({ draf, opdConfig }: { draf: DrafPersetujuan, opdConfig: any }) => {
  if (!draf.content) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-10 text-center text-gray-500">
        <FileSignature size={32} className="mx-auto mb-3 opacity-30" />
        <p>Dokumen ini masih menggunakan format Google Doc lama.</p>
        {draf.googleDocUrl && (
           <a
             href={draf.googleDocUrl}
             target="_blank"
             rel="noopener noreferrer"
             className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
           >
             <ExternalLink size={16} /> Buka Google Doc
           </a>
        )}
      </div>
    );
  }

  // Inject Kop Surat if any
  let displayContent = draf.content;
  if (displayContent && !displayContent.trim().startsWith('<')) {
      displayContent = marked.parse(displayContent) as string;
  }
  
  if (draf.kopSuratId && opdConfig?.kopSuratConfigs) {
      const kopData = opdConfig.kopSuratConfigs.find((k: any) => k.id === draf.kopSuratId);
      if (kopData) {
          const kopHtml = `<div style="text-align:center; border-bottom:3px double black; margin-bottom:20px; padding-bottom:10px;">
              <h2 style="margin:0; font-size:18px;">${kopData.headerUtama}</h2>
              <h1 style="margin:0; font-size:22px;">${kopData.subHeader}</h1>
              <p style="margin:5px 0 0; font-size:12px;">${kopData.alamat}</p>
              <p style="margin:0; font-size:12px;">${kopData.kontak}</p>
          </div>\n\n`;
          displayContent = kopHtml + displayContent;
      }
  }

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border overflow-hidden flex flex-col h-[800px]">
      <div className="p-3 border-b border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-slate-800 flex justify-between items-center shrink-0">
        <h3 className="font-semibold text-sm flex items-center text-gray-800 dark:text-dark-text-primary">
          <Eye className="w-4 h-4 mr-2 text-blue-600" /> Pratinjau Dokumen
        </h3>
      </div>
      <div className="p-8 overflow-y-auto flex-1 bg-gray-100 dark:bg-slate-900 custom-scrollbar" data-color-mode="light">
          <div className="bg-white text-black p-8 shadow-sm border border-gray-200 max-w-[800px] mx-auto min-h-full">
               <div 
                   className="prose max-w-none text-black quill-print-content"
                   dangerouslySetInnerHTML={{ __html: displayContent }} 
               />
          </div>
      </div>
    </div>
  );
};

// --- Komponen Utama Halaman ---
export default function PersetujuanDrafPage() {
  const params = useParams();
  const router = useRouter(); 
  const drafId = params?.id as string;

  const { userProfile, actingJabatanProfile, loading: authLoading, opdConfig } = useUserAuth();

  const [draf, setDraf] = useState<DrafPersetujuan | null>(null);
  const [riwayatList, setRiwayatList] = useState<RiwayatPersetujuan[]>([]);
  
  const [localUserCache, setLocalUserCache] = useState<Map<string, UserProfile>>(new Map());
  const [localJabatanList, setLocalJabatanList] = useState<Jabatan[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Fungsi fetch data lokal
  const fetchData = useCallback(async () => {
    if (!drafId || !userProfile?.opdId) {
        if (!authLoading) {
            setError("Parameter tidak lengkap.");
            setLoading(false);
        }
        return;
    }
    
    setLoading(true);
    try {
        // 1. Ambil Draf Utama
        const drafRef = doc(db, 'drafPersetujuan', drafId);
        const drafSnap = await getDoc(drafRef);

        if (!drafSnap.exists()) {
            throw new Error("Draf persetujuan tidak ditemukan.");
        }
        
        const drafData = { id: drafSnap.id, ...drafSnap.data() } as DrafPersetujuan;
        
        // Cek Otorisasi Sederhana
        const canView = drafData.opdId === userProfile.opdId || 
                        drafData.approvalJabatanIds.includes(actingJabatanProfile?.id || '') || 
                        drafData.createdBy === userProfile.uid ||
                        userProfile.role === 'super_admin';

        if (!canView) {
             throw new Error("Anda tidak memiliki izin untuk melihat draf ini.");
        }
        setDraf(drafData);

        // 2. Ambil Data Master Lokal (Users & Jabatans)
        const usersQuery = query(collection(db, "users"), where("opdId", "==", userProfile.opdId));
        const jabatansQuery = query(collection(db, "jabatan"), where("opdId", "==", userProfile.opdId));
        
        const [usersSnapshot, jabatansSnapshot] = await Promise.all([
            getDocs(usersQuery),
            getDocs(jabatansQuery)
        ]);

        const userCacheMap = new Map<string, UserProfile>();
        usersSnapshot.forEach(doc => {
            const user = { id: doc.id, ...doc.data() } as UserProfile;
            if (user.jabatanId) userCacheMap.set(user.jabatanId, user);
        });
        setLocalUserCache(userCacheMap);
        
        setLocalJabatanList(jabatansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Jabatan)));

    } catch (err: any) {
        console.error("Gagal memuat data:", err);
        setError(err.message || "Gagal memuat data draf.");
    } finally {
        setLoading(false);
    }
  }, [drafId, userProfile, authLoading, actingJabatanProfile]); 

  // Panggil fetchData
  useEffect(() => {
    if (!authLoading && userProfile && actingJabatanProfile) { 
        fetchData();
    }
  }, [authLoading, userProfile, actingJabatanProfile, fetchData]);

  // Listener untuk Riwayat (sub-koleksi)
  useEffect(() => {
    if (!drafId) return;
    const riwayatQuery = query(
        collection(db, 'drafPersetujuan', drafId, 'riwayat'), 
        orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(riwayatQuery, (snap) => {
        setRiwayatList(snap.docs.map(d => d.data() as RiwayatPersetujuan));
    }, (err) => {
        console.error("Gagal memuat riwayat:", err);
    });
    return () => unsubscribe();
  }, [drafId]);

  // Memo untuk status
  const isMyTurn = useMemo(() =>
    draf?.status === 'Proses Review' &&
    draf?.penerimaTugasJabatanId === actingJabatanProfile?.id
  , [draf, actingJabatanProfile]);

  const isPembuat = useMemo(() =>
    draf?.createdBy === userProfile?.uid
  , [draf, userProfile]);

  const canResubmit = useMemo(() =>
    isPembuat && draf?.status === 'Revisi'
  , [isPembuat, draf]);
  
  const pembuatNama = useMemo(() => {
      if (!draf) return '...';
      if(draf.pembuatNama) return draf.pembuatNama; 
      
      for (const user of localUserCache.values()) {
          if (user.uid === draf.createdBy) {
              return user.namaLengkap;
          }
      }
      
      return 'Nama Pembuat Tdk Tercatat'; 
  }, [draf, localUserCache]);

  // --- Fungsi Aksi ---

  const handleAction = (action: 'approve' | 'reject', comments: string) => {
    if (!draf || !userProfile || !actingJabatanProfile) return;
    if (action === 'reject' && !comments.trim()) {
        alert("Komentar wajib diisi untuk mengembalikan revisi.");
        return;
    }
    
    const actionText = action === 'approve' ? 'menyetujui' : 'mengembalikan';
    setConfirmModal({
        isOpen: true,
        title: `Konfirmasi ${action === 'approve' ? 'Persetujuan' : 'Revisi'}`,
        message: `Anda yakin ingin ${actionText} draf ini?`,
        onConfirm: async () => {
            setIsProcessing(true);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));

            try {
                const batch = writeBatch(db);
                const drafRef = doc(db, 'drafPersetujuan', draf.id!);
                
                const currentStepIndex = draf.currentStep;
                const newApprovalChain = [...draf.approvalChain];
                newApprovalChain[currentStepIndex] = {
                    ...newApprovalChain[currentStepIndex],
                    status: action === 'approve' ? 'Disetujui' : 'Revisi', 
                    timestamp: Timestamp.now(),
                    comments: comments || undefined
                };
                
                const riwayatRef = doc(collection(db, 'drafPersetujuan', draf.id!, 'riwayat'));
                const newRiwayat: RiwayatPersetujuan = {
                    timestamp: Timestamp.now(),
                    actorName: `${userProfile.namaLengkap} (${actingJabatanProfile.namaJabatan})`,
                    action: action === 'approve' ? 'Menyetujui & Meneruskan' : 'Mengembalikan (Revisi)',
                    comments: comments
                };

                if (action === 'approve') {
                    const nextStepIndex = currentStepIndex + 1;
                    if (nextStepIndex < draf.approvalChain.length) {
                        // Masih ada alur berikutnya
                        batch.update(drafRef, {
                            status: 'Proses Review',
                            currentStep: nextStepIndex,
                            penerimaTugasJabatanId: draf.approvalChain[nextStepIndex].jabatanId,
                            approvalChain: newApprovalChain
                        });
                    } else {
                        // Ini adalah persetujuan terakhir
                        let finalNomor = draf.nomorSurat || '';
                        let newContent = draf.content || '';
                        
                        if (draf.penomoranConfigId) {
                            try {
                                const res = await fetch('/api/surat/generate-nomor', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        opdId: draf.opdId,
                                        formatConfigId: draf.penomoranConfigId,
                                        kodeKlasifikasi: draf.nomorSurat?.split('/')[0] || ''
                                    })
                                });
                                const data = await res.json();
                                if (res.ok && data.generatedNumber) {
                                    finalNomor = data.generatedNumber;
                                    // Ganti teks nomor draf sebelumnya dengan nomor resmi di konten
                                    if (draf.nomorSurat && draf.nomorSurat !== 'Draft') {
                                        newContent = newContent.replace(new RegExp(draf.nomorSurat, 'g'), finalNomor);
                                    } else {
                                        newContent = newContent.replace(/Draft/g, finalNomor);
                                    }
                                }
                            } catch (e) {
                                console.error('Gagal auto-generate nomor saat disetujui', e);
                            }
                        }

                        batch.update(drafRef, {
                            status: 'Selesai',
                            penerimaTugasJabatanId: null,
                            approvalChain: newApprovalChain,
                            nomorSurat: finalNomor,
                            generatedNomorSurat: finalNomor,
                            content: newContent
                        });
                        newRiwayat.action = "Menyetujui (Selesai)";
                        
                        // --- [ARSIP OTOMATIS] ---
                        const suratKeluarRef = doc(db, 'suratKeluar', draf.id!);
                        batch.set(suratKeluarRef, {
                            judul: draf.judul,
                            nomorSurat: finalNomor,
                            opdId: draf.opdId,
                            createdBy: draf.createdBy,
                            pembuatNama: pembuatNama || draf.pembuatNama || 'Sistem',
                            createdAt: draf.createdAt,
                            disetujuiAt: Timestamp.now(),
                            content: newContent,
                            kopSuratId: draf.kopSuratId || '',
                            drafPersetujuanId: draf.id
                        });
                        // --- [AKHIR ARSIP OTOMATIS] ---
                    }
                } else {
                    // Kembalikan ke pembuat
                    batch.update(drafRef, {
                        status: 'Revisi',
                        penerimaTugasJabatanId: null, // Kembali ke pembuat
                        approvalChain: newApprovalChain
                    });
                }
                
                batch.set(riwayatRef, newRiwayat);
                await batch.commit();

                // --- [AUTO LOGBOOK] ---
                // Mencatat persetujuan/revisi draf ke logbook pimpinan
                try {
                    const logDesc = action === 'approve' 
                        ? `Menyetujui draf dokumen: "${draf.judul}"`
                        : `Mengembalikan (Revisi) draf dokumen: "${draf.judul}". Catatan: ${comments}`;
                    
                    await updateLogbook(userProfile.uid, userProfile.opdId, new Date(), {
                        id: `auto_draf_${draf.id}_${Date.now()}`,
                        deskripsi: logDesc,
                        selesai: true,
                        tugasTerkaitId: draf.id,
                        tugasTerkaitJudul: draf.judul
                    });
                    console.log("Auto-logbook draf berhasil.");
                } catch (logErr) {
                    console.error("Gagal auto-logbook draf:", logErr);
                }
                // --- [AKHIR AUTO LOGBOOK] ---
                
                // Panggil fetchData untuk sinkronisasi ulang state draf
                await fetchData(); 
                
            } catch (err: any) {
                console.error("Gagal memproses aksi:", err);
                setError(err.message || "Gagal memproses aksi.");
            } finally {
                setIsProcessing(false);
            }
        }
    });
  };
  
  const handleResubmit = () => {
    if (!draf || !userProfile || !actingJabatanProfile) return;

    setConfirmModal({
        isOpen: true,
        title: 'Konfirmasi Kirim Ulang',
        message: 'Anda yakin ingin mengirim ulang draf ini untuk ditinjau kembali oleh alur persetujuan?',
        onConfirm: async () => {
            setIsProcessing(true);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
            
            try {
                const batch = writeBatch(db);
                const drafRef = doc(db, 'drafPersetujuan', draf.id!);
                
                // Reset alur
                const resetApprovalChain = draf.approvalChain.map(step => ({ ...step, status: 'Menunggu', comments: undefined, timestamp: undefined } as ApprovalStep));

                batch.update(drafRef, {
                    status: 'Proses Review',
                    currentStep: 0,
                    penerimaTugasJabatanId: draf.approvalChain[0].jabatanId,
                    approvalChain: resetApprovalChain
                });
                
                const riwayatRef = doc(collection(db, 'drafPersetujuan', draf.id!, 'riwayat'));
                const newRiwayat: RiwayatPersetujuan = {
                    timestamp: Timestamp.now(),
                    actorName: `${userProfile.namaLengkap} (${actingJabatanProfile.namaJabatan})`,
                    action: 'Mengirim Ulang Revisi',
                    comments: 'Draf telah direvisi dan diajukan kembali.'
                };
                batch.set(riwayatRef, newRiwayat);
                
                await batch.commit();
                
                await fetchData(); 

            } catch (err: any) {
                console.error("Gagal kirim ulang:", err);
                setError(err.message || "Gagal mengirim ulang draf.");
            } finally {
                setIsProcessing(false);
            }
        }
    });
  };

  // --- Render ---

  if (loading || authLoading) { 
    return <p className="text-center p-8">Memuat data draf...</p>;
  }

  if (error) {
    return (
        <div className="text-center p-8">
            <p className="text-red-600 bg-red-100 rounded-lg p-4">{error}</p>
            <button
                onClick={() => router.back()}
                className="inline-flex mt-4 items-center text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4"
            >
                <ArrowLeft size={16} className="mr-2" /> Kembali
            </button>
        </div>
    );
  }
  
  if (!draf) {
      return (
          <div className="text-center p-8">
            <p className="text-gray-500">Gagal memuat draf.</p>
             <button
                onClick={() => router.back()}
                className="inline-flex mt-4 items-center text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4"
            >
                <ArrowLeft size={16} className="mr-2" /> Kembali
            </button>
          </div>
      );
  }
  
  return (
    <div>
      <button 
        onClick={() => router.back()} 
        className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4"
      >
        <ArrowLeft size={16} className="mr-2" /> Kembali ke Halaman Sebelumnya
      </button>
      
      <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">{draf.judul}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Kolom Kiri: Pratinjau Dokumen */}
        <div className="lg:col-span-7 space-y-6">
            <InlineDocumentPreview draf={draf} opdConfig={opdConfig} />
        </div>

        {/* Kolom Kanan: Aksi & Info */}
        <div className="lg:col-span-5 space-y-6">
          <InfoDrafCard draf={draf} pembuatNama={pembuatNama} />
          
          {isMyTurn && (
            <FormPersetujuan onAction={handleAction} isProcessing={isProcessing} />
          )}
          
          {canResubmit && (
            <FormRevisi onResubmit={handleResubmit} isProcessing={isProcessing} />
          )}
          
          <AlurPersetujuan 
            draf={draf} 
            userCache={localUserCache} 
          />
          <RiwayatAktivitas riwayat={riwayatList} />
        </div>
      </div>
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isProcessing={isProcessing}
      />
    </div>
  );
}