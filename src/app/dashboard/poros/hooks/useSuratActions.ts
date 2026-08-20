// Directory: src/app/dashboard/hooks/useSuratActions.ts
// [FIXED] Menambahkan mekanisme 'Optimistic Updates' untuk Feed Ruang Kerja.
// Mencegah masalah "Ghosting" / Feed tidak hilang akibat Race Condition dengan Cloud Functions.

import { useState } from 'react';
import { 
  doc, updateDoc, deleteDoc, Timestamp, writeBatch, collection, 
  serverTimestamp, arrayUnion, getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activityLogger';
import { useToast } from '@/context/ToastContext';
import { Surat, Disposisi, UserProfile, TindakLanjut } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { updateLogbook } from '@/lib/logbookUtils';

export interface TindakLanjutPayload {
    isiLaporan: string;
    judulLaporan?: string;
    warnaLabel?: 'default' | 'red' | 'green' | 'blue' | 'yellow' | 'purple';
    checklist?: { id: string; teks: string; isDone: boolean }[];
}

export const useSuratActions = () => {
  const { userProfile, actingJabatanProfile, jabatanProfile } = useUserAuth();
  const effectiveJabatan = actingJabatanProfile || jabatanProfile;
  const { addToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const queryClient = useQueryClient();

  // --- HELPER: OPTIMISTIC UPDATES ---
  // Menghapus data dari cache UI secara instan sebelum server selesai memproses
  const optimisticRemoveDisposisi = (disposisiId: string) => {
      if (!effectiveJabatan?.id) return;
      queryClient.setQueryData(['feed', 'user_summaries', effectiveJabatan.id], (oldData: any) => {
          if (!oldData) return oldData;
          const newPending = { ...oldData.pendingDisposisi };
          if (newPending[disposisiId]) {
              delete newPending[disposisiId];
          }
          return { ...oldData, pendingDisposisi: newPending };
      });
  };

  const optimisticUpdateAcknowledge = (disposisiId: string) => {
      if (!effectiveJabatan?.id) return;
      queryClient.setQueryData(['feed', 'user_summaries', effectiveJabatan.id], (oldData: any) => {
          if (!oldData) return oldData;
          const newPending = { ...oldData.pendingDisposisi };
          if (newPending[disposisiId]) {
              newPending[disposisiId] = { ...newPending[disposisiId], needsAcknowledge: false };
          }
          return { ...oldData, pendingDisposisi: newPending };
      });
  };

  const refreshData = () => {
      queryClient.invalidateQueries({ queryKey: ['suratList'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] }); 
      // Cache 'feed' (user_summaries) sudah di-update secara optimistic di masing-masing action
      // sehingga tidak perlu di-invalidate dengan hardcoded delay yang memicu ghosting.
  };

  const getActorName = () => {
    if (!userProfile || !effectiveJabatan) return 'User';
    return `${userProfile.namaLengkap} (${effectiveJabatan.namaJabatan})`;
  };

  // --- 1. DISPOSISI (Top-Down) ---
  const kirimDisposisi = async (
    surat: Surat,
    targets: UserProfile[],
    instruksi: string,
    batasWaktu?: Date,
    isRevising: boolean = false,
    oldDisposisiId?: string,
    isInformational: boolean = false,
    audioBlob?: Blob | null
  ) => {
    if (!userProfile || !effectiveJabatan) {
        addToast("Sesi tidak valid.", "error");
        return false;
    }

    setIsProcessing(true);
    try {
      let audioUrl = '';
      if (audioBlob) {
          const storage = getStorage();
          const fileName = `disposisi-audio/${surat.id}_${Date.now()}.webm`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, audioBlob);
          audioUrl = await getDownloadURL(storageRef);
      }

      const batch = writeBatch(db);
      const actorName = getActorName();
      
      if (oldDisposisiId) {
          const oldRef = doc(db, 'disposisi', oldDisposisiId);
          if (isRevising) {
              batch.delete(oldRef);
          } else {
              batch.update(oldRef, { penerimaSelesai: arrayUnion(effectiveJabatan.id) });
          }
          // [SINKRONISASI UI INSTAN]
          optimisticRemoveDisposisi(oldDisposisiId);
      }

      const disposisiRef = doc(collection(db, 'disposisi'));
      const targetJabatanIds = targets.map(t => t.jabatanId);

      // Fetch OPD Name for the sender
      let dariOpdNama = 'Instansi';
      if (effectiveJabatan.opdId) {
          try {
              const opdSnap = await getDoc(doc(db, 'opd', effectiveJabatan.opdId));
              if (opdSnap.exists()) {
                  dariOpdNama = opdSnap.data().namaOpd || 'Instansi';
              }
          } catch (e) {
              console.error("Gagal mengambil nama OPD:", e);
          }
      }
      
      const disposisiData: Partial<Disposisi> = {
        suratId: surat.id,
        dariJabatanId: effectiveJabatan.id!,
        dariJabatanNama: effectiveJabatan.namaJabatan,
        opdId: effectiveJabatan.opdId,
        dariOpdId: effectiveJabatan.opdId,
        dariOpdNama: dariOpdNama,
        kepadaJabatanId: targetJabatanIds,
        instruksi: instruksi,
        tanggalDisposisi: serverTimestamp() as Timestamp,
        penerimaDiterima: [],
        status: 'Terkirim',
        isInformational: isInformational,
      };

      if (audioUrl) {
          disposisiData.audioUrl = audioUrl;
      }

      if (batasWaktu && !isInformational) {
          disposisiData.batasWaktu = Timestamp.fromDate(batasWaktu);
      }
      
      batch.set(disposisiRef, disposisiData);

      const suratRef = doc(db, 'surat', surat.id!);
      const suratUpdates: any = {};

      const idsToUnion = [effectiveJabatan.id!, ...targetJabatanIds].filter(Boolean);
      suratUpdates.terlibatJabatanIds = arrayUnion(...idsToUnion);

      if (!isInformational) {
        if (surat.statusPenyelesaian === 'Baru' || surat.statusPenyelesaian === 'Revisi Disposisi') {
            suratUpdates.statusPenyelesaian = 'Didisposisikan';
        }
      }

      suratUpdates.infoTampilan = {
          senderName: effectiveJabatan.namaJabatan,
          recipientNames: targets.length > 5 && isInformational 
              ? "Seluruh Pegawai OPD" 
              : Array.from(new Set(targets.map(t => t.namaLengkap))).join(', '),
          isInformational: isInformational
      };

      batch.update(suratRef, suratUpdates);
      
      const actionLog = isInformational ? "Pemberitahuan disebar" : (isRevising ? "Disposisi direvisi" : "Disposisi dikirim");
      await logActivity(surat.id!, actorName, actionLog, `Kepada: ${targets.map(t => t.namaLengkap).join(', ')}. Instruksi: ${instruksi}`);

      for (const userToNotify of targets) {
        if (userToNotify && userToNotify.uid && userToNotify.uid !== userProfile.uid) {
          const notifRef = doc(collection(db, 'notifications'));
          batch.set(notifRef, {
            userId: userToNotify.uid, 
            userNip: userToNotify.nip,
            message: `${isInformational ? 'Pemberitahuan' : 'Disposisi'} dari ${actorName}: "${surat.perihal}"`,
            link: `/dashboard/surat/${surat.id!}`, 
            isRead: false, 
            timestamp: serverTimestamp() as Timestamp,
          });
        }
      }

      await batch.commit();

      try {
          await updateLogbook(userProfile.uid, effectiveJabatan.opdId, new Date(), {
              id: `auto_disp_${surat.id}_${Date.now()}`,
              deskripsi: `Mendisposisikan surat: "${surat.perihal}"`,
              selesai: true
          });
      } catch (logErr) { console.error(logErr); }

      addToast(`Berhasil mengirim ke ${targets.length} orang.`, "success");
      refreshData();
      return true;
    } catch (error: any) {
      console.error("Error kirim disposisi:", error);
      addToast(error.message, "error");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 2. ESKALASI SURAT (Bottom-Up) ---
  const eskalasiSurat = async (
    surat: Surat,
    atasanTarget: UserProfile,
    catatan: string,
    oldDisposisiId?: string
  ) => {
    if (!userProfile || !effectiveJabatan) {
        addToast("Sesi tidak valid.", "error");
        return false;
    }

    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const actorName = getActorName();
      
      const eskalasiRef = doc(collection(db, 'disposisi'));
      const eskalasiData: Partial<Disposisi> = {
        suratId: surat.id,
        dariJabatanId: effectiveJabatan.id!,
        dariJabatanNama: effectiveJabatan.namaJabatan,
        opdId: effectiveJabatan.opdId,
        kepadaJabatanId: [atasanTarget.jabatanId],
        instruksi: catatan, 
        tanggalDisposisi: serverTimestamp() as Timestamp,
        penerimaDiterima: [],
        status: 'Terkirim',
        isInformational: false, 
      };

      batch.set(eskalasiRef, eskalasiData);

      const suratRef = doc(db, 'surat', surat.id!);
      const idsToUnion = [effectiveJabatan.id!, atasanTarget.jabatanId].filter(Boolean);
      batch.update(suratRef, { 
          statusPenyelesaian: 'Didisposisikan',
          terlibatJabatanIds: arrayUnion(...idsToUnion),
          infoTampilan: {
              senderName: effectiveJabatan.namaJabatan,
              recipientNames: atasanTarget.namaLengkap,
              isInformational: false
          }
      });
      
      await logActivity(surat.id!, actorName, "Menaikkan surat ke pimpinan", `Ke: ${atasanTarget.namaLengkap}. Catatan: ${catatan}`);

      if (atasanTarget.uid !== userProfile.uid) {
        const notifRef = doc(collection(db, 'notifications'));
        batch.set(notifRef, {
          userId: atasanTarget.uid, 
          userNip: atasanTarget.nip,
          message: `Eskalasi Surat dari ${actorName}: "${surat.perihal}"`,
          link: `/dashboard/surat/${surat.id!}`, 
          isRead: false, 
          timestamp: serverTimestamp() as Timestamp,
        });
      }

      if (oldDisposisiId) {
          const oldRef = doc(db, 'disposisi', oldDisposisiId);
          batch.update(oldRef, { penerimaSelesai: arrayUnion(effectiveJabatan.id) });
          // [SINKRONISASI UI INSTAN]
          optimisticRemoveDisposisi(oldDisposisiId);
      }

      await batch.commit();

      try {
          await updateLogbook(userProfile.uid, effectiveJabatan.opdId, new Date(), {
              id: `auto_esk_${surat.id}_${Date.now()}`,
              deskripsi: `Eskalasi surat ke pimpinan: "${surat.perihal}"`,
              selesai: true
          });
      } catch (logErr) { console.error(logErr); }

      addToast(`Surat berhasil dinaikkan ke pimpinan.`, "success");
      refreshData();
      return true;
    } catch (error: any) {
      console.error("Error eskalasi surat:", error);
      addToast(error.message, "error");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const terimaDisposisi = async (disposisi: Disposisi, surat: Surat) => {
    if (!userProfile || !effectiveJabatan?.id) return false;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const disposisiRef = doc(db, 'disposisi', disposisi.id!);
      batch.update(disposisiRef, { penerimaDiterima: arrayUnion(effectiveJabatan.id) });
      await logActivity(surat.id!, getActorName(), disposisi.isInformational ? "Menerima pemberitahuan" : "Menerima disposisi");
      
      // [STATUS UPDATE]
      if (surat.statusPenyelesaian === 'Baru' || surat.statusPenyelesaian === 'Didisposisikan') {
          const suratRef = doc(db, 'surat', surat.id!);
          batch.update(suratRef, { statusPenyelesaian: 'Proses Tindak Lanjut' });
      }

      // [NOTIFIKASI]
      if (disposisi.dariJabatanId) {
          const { query, collection, where, limit, getDocs } = await import('firebase/firestore');
          const usersQ = query(collection(db, 'users'), where('jabatanId', '==', disposisi.dariJabatanId), limit(1));
          const usersSnap = await getDocs(usersQ);
          if (!usersSnap.empty) {
              const sender = usersSnap.docs[0].data();
              if (sender.uid !== userProfile.uid) {
                  const notifRef = doc(collection(db, 'notifications'));
                  batch.set(notifRef, {
                      userId: sender.uid,
                      userNip: sender.nip,
                      message: `Disposisi telah diterima oleh ${getActorName()}.`,
                      link: `/dashboard/surat/${surat.id!}`,
                      isRead: false,
                      timestamp: serverTimestamp() as Timestamp,
                  });
              }
          }
      }

      // [SINKRONISASI UI INSTAN]
      optimisticUpdateAcknowledge(disposisi.id!);

      await batch.commit();

      // [AUTO LOGBOOK]
      try {
          await updateLogbook(userProfile.uid, effectiveJabatan.opdId, new Date(), {
              id: `auto_terima_${disposisi.id}_${Date.now()}`,
              deskripsi: `Menerima ${disposisi.isInformational ? 'pemberitahuan' : 'disposisi'} surat: "${surat.perihal}"`,
              selesai: true
          });
      } catch (logErr) { console.error(logErr); }
      addToast("Disposisi diterima.", "success");
      refreshData();
      return true;
    } catch (error: any) {
        addToast("Gagal menerima disposisi.", "error");
        return false;
    } finally {
        setIsProcessing(false);
    }
  };

  // --- MENGIRIM LAPORAN BARU (Payload Google Keep) ---
  const kirimTindakLanjut = async (
     surat: Surat, disposisi: Disposisi, 
     payload: TindakLanjutPayload, 
     fileData?: { url: string, name: string }, 
     opsi?: { buatTugasPengingat?: boolean, teruskanKe?: { targets: UserProfile[], instruksi: string }, isFinalAction?: boolean, closePersonalDisposisi?: boolean }
  ) => {
    if (!userProfile || !effectiveJabatan) return false;
    setIsProcessing(true);

    try {
        const batch = writeBatch(db);
        const actorName = getActorName();
        const isFinal = opsi?.isFinalAction || false;
        const closePersonal = opsi?.closePersonalDisposisi ?? isFinal;

        const tindakLanjutRef = doc(collection(db, 'tindakLanjut'));
        
        const tindakLanjutData: Omit<TindakLanjut, 'id'> = {
            suratId: surat.id!, 
            disposisiId: disposisi.id!, 
            jabatanId: effectiveJabatan.id!, 
            userId: userProfile.uid, 
            isiLaporan: payload.isiLaporan, 
            judulLaporan: payload.judulLaporan || '',
            warnaLabel: payload.warnaLabel || 'default',
            checklist: payload.checklist || [],
            tanggalLaporan: serverTimestamp() as Timestamp,
            opdId: surat.opdId,
            terlibatJabatanIds: surat.terlibatJabatanIds || [effectiveJabatan.id!],
            ...(fileData && { googleDriveLink: fileData.url, googleDriveFileName: fileData.name }),
        } as any; 

        batch.set(tindakLanjutRef, tindakLanjutData as any);

        const logText = payload.judulLaporan ? `[${payload.judulLaporan}] ${payload.isiLaporan}` : payload.isiLaporan;
        const actionLogText = isFinal ? "Menyelesaikan Tindak Lanjut (SELESAI)" : "Melaporkan Progres Tindak Lanjut";
        await logActivity(surat.id!, actorName, actionLogText, logText.substring(0, 100));

        const disposisiRef = doc(db, 'disposisi', disposisi.id!);
        if (closePersonal) {
            batch.update(disposisiRef, { penerimaSelesai: arrayUnion(effectiveJabatan.id) });
            // [SINKRONISASI UI INSTAN]
            optimisticRemoveDisposisi(disposisi.id!);
        }

        // [NOTIFIKASI PENGIRIM DISPOSISI]
        if (disposisi.dariJabatanId) {
            const { query, collection, where, limit, getDocs } = await import('firebase/firestore');
            const usersQ = query(collection(db, 'users'), where('jabatanId', '==', disposisi.dariJabatanId), limit(1));
            const usersSnap = await getDocs(usersQ);
            if (!usersSnap.empty) {
                const sender = usersSnap.docs[0].data();
                if (sender.uid !== userProfile.uid) {
                    const notifRef = doc(collection(db, 'notifications'));
                    batch.set(notifRef, {
                        userId: sender.uid,
                        userNip: sender.nip,
                        message: `Tindak lanjut baru dari ${actorName}: "${payload.judulLaporan || 'Proses'}"`,
                        link: `/dashboard/surat/${surat.id!}`,
                        isRead: false,
                        timestamp: serverTimestamp() as Timestamp,
                    });
                }
            }
        }
        // [PARALLEL DISPOSISI CHECK] - Cegah Bug Ghosting Surat Hilang
        let isGloballyFinal = isFinal;
        if (isFinal) {
            const { query, collection, where, getDocs } = await import('firebase/firestore');
            const dispQ = query(collection(db, 'disposisi'), where('suratId', '==', surat.id));
            const dispSnap = await getDocs(dispQ);
            
            let allDispoCompleted = true;
            dispSnap.forEach(dDoc => {
                const dData = dDoc.data() as Disposisi;
                if (dData.id === disposisi.id) return; // Abaikan disposisi yang sedang kita tutup ini
                
                const isCompleted = dData.kepadaJabatanId?.every(id => dData.penerimaSelesai?.includes(id));
                if (!isCompleted && dData.status !== 'Dikembalikan') {
                    allDispoCompleted = false;
                }
            });
            
            isGloballyFinal = allDispoCompleted;
        }

        const suratRef = doc(db, 'surat', surat.id!);
        const suratUpdates: any = { terlibatJabatanIds: arrayUnion(effectiveJabatan.id!) };

        if (isGloballyFinal) { suratUpdates.statusPenyelesaian = 'Selesai'; } 
        else { suratUpdates.statusPenyelesaian = 'Proses Tindak Lanjut'; }
        batch.update(suratRef, suratUpdates);
        
        await batch.commit();

        // --- [AUTO LOGBOOK] ---
        try {
            const logDesc = isFinal 
                ? `Menyelesaikan surat: "${surat.perihal}"`
                : `Tindak Lanjut Surat: "${surat.perihal}" - ${payload.judulLaporan || 'Proses'}`;
                
            await updateLogbook(userProfile.uid, effectiveJabatan.opdId, new Date(), {
                id: `auto_tinjut_${tindakLanjutRef.id}_${Date.now()}`,
                deskripsi: logDesc,
                selesai: isFinal
            });
            console.log("Auto-logbook tindak lanjut berhasil.");
        } catch (logErr) {
            console.error("Gagal auto-logbook tindak lanjut:", logErr);
        }
        // --- [AKHIR AUTO LOGBOOK] ---

        addToast(isFinal ? "Surat diselesaikan." : "Laporan dikirim.", "success");
        refreshData();
        return true;

    } catch (error: any) {
        console.error("Error kirim tindak lanjut:", error);
        addToast("Gagal mengirim tindak lanjut.", "error");
        return false;
    } finally {
        setIsProcessing(false);
    }
  };

  // --- MENGEDIT LAPORAN / CATATAN YANG SUDAH ADA ---
  const editTindakLanjut = async (
      tindakLanjutId: string,
      suratId: string,
      payload: TindakLanjutPayload
  ) => {
      if (!userProfile || !effectiveJabatan) return false;
      setIsProcessing(true);
      try {
          const batch = writeBatch(db);
          const tlRef = doc(db, 'tindakLanjut', tindakLanjutId);
          
          batch.update(tlRef, {
              isiLaporan: payload.isiLaporan,
              judulLaporan: payload.judulLaporan || '',
              warnaLabel: payload.warnaLabel || 'default',
              checklist: payload.checklist || [],
          });

          const actorName = getActorName();
          const snippetText = payload.isiLaporan || (payload.checklist && payload.checklist.length > 0 ? "[Pembaruan Checklist]" : "");
          const logText = payload.judulLaporan ? `[Revisi Judul: ${payload.judulLaporan}] ${snippetText}` : `[Revisi Laporan] ${snippetText}`;
          
          await logActivity(suratId, actorName, "Merevisi Laporan/Catatan", logText.substring(0, 100));

          // [AUTO LOGBOOK]
          try {
              await updateLogbook(userProfile.uid, effectiveJabatan.opdId, new Date(), {
                  id: `auto_edit_tinjut_${tindakLanjutId}_${Date.now()}`,
                  deskripsi: `Merevisi catatan/tindak lanjut: ${payload.judulLaporan || 'Proses'}`,
                  selesai: false
              });
          } catch (logErr) { console.error(logErr); }

          // [SINKRONISASI UI INSTAN]
          queryClient.setQueryData(['suratDetail', suratId], (oldData: any) => {
              if (!oldData || !oldData.tindakLanjutList) return oldData;
              return {
                  ...oldData,
                  tindakLanjutList: oldData.tindakLanjutList.map((tl: any) => 
                      tl.id === tindakLanjutId ? { ...tl, isiLaporan: payload.isiLaporan, judulLaporan: payload.judulLaporan || '', warnaLabel: payload.warnaLabel || 'default', checklist: payload.checklist || [] } : tl
                  )
              };
          });

          await batch.commit();
          addToast("Catatan berhasil diperbarui.", "success");
          refreshData();
          return true;
      } catch (error: any) {
          console.error("Error edit tindak lanjut:", error);
          addToast("Gagal memperbarui catatan.", "error");
          return false;
      } finally {
          setIsProcessing(false);
      }
  };

  const archiveSurat = async (surat: Surat, alasan: string = 'Diarsipkan manual') => {
    if (!surat.id) return false;
    setIsProcessing(true);
    try {
        const batch = writeBatch(db);
        const suratRef = doc(db, 'surat', surat.id);
        batch.update(suratRef, {
            statusPenyelesaian: 'Diarsipkan',
            diarsipkanOleh: userProfile?.uid || 'system',
            tanggalArsip: Timestamp.now(),
            alasanArsip: alasan
        });
        await logActivity(surat.id, getActorName(), 'Surat Diarsipkan', `Alasan: ${alasan}`);
        
        // [AUTO LOGBOOK]
        try {
            await updateLogbook(userProfile?.uid || '', effectiveJabatan?.opdId || '', new Date(), {
                id: `auto_arsip_${surat.id}_${Date.now()}`,
                deskripsi: `Mengarsipkan surat: "${surat.perihal}". Alasan: ${alasan}`,
                selesai: true
            });
        } catch (logErr) { console.error(logErr); }

        // [SINKRONISASI UI INSTAN]
        if (effectiveJabatan?.opdId) {
            queryClient.setQueryData(['suratList', effectiveJabatan.opdId], (oldData: any) => {
                if (!oldData) return oldData;
                return oldData.filter((s: any) => s.id !== surat.id);
            });
        }

        await batch.commit();
        addToast("Surat berhasil diarsipkan.", "success");
        refreshData(); 
        return true;
    } catch (error: any) {
        addToast("Gagal mengarsipkan surat.", "error");
        return false;
    } finally {
        setIsProcessing(false);
    }
  };

  const kembalikanDisposisi = async (disposisi: Disposisi, alasan: string, senderProfile?: UserProfile) => {
     if (!userProfile || !disposisi.id) return false;
     setIsProcessing(true);
     try {
        const batch = writeBatch(db);
        const disposisiRef = doc(db, 'disposisi', disposisi.id);
        batch.update(disposisiRef, { status: 'Dikembalikan', alasanPengembalian: alasan, dikembalikanPada: Timestamp.now() });
        const suratRef = doc(db, 'surat', disposisi.suratId);
        batch.update(suratRef, { statusPenyelesaian: 'Revisi Disposisi' });
        
        // [SINKRONISASI UI INSTAN dipindah ke setelah commit]

        // [SEDANG-5 FIX]: Fallback fetch jika pengirim tidak ada di cache (beda OPD)
        let finalSenderProfile = senderProfile;
        if (!finalSenderProfile && disposisi.dariJabatanId) {
            const { query, collection, where, limit, getDocs } = await import('firebase/firestore');
            const usersQ = query(collection(db, 'users'), where('jabatanId', '==', disposisi.dariJabatanId), limit(1));
            const usersSnap = await getDocs(usersQ);
            if (!usersSnap.empty) {
                finalSenderProfile = usersSnap.docs[0].data() as UserProfile;
            }
        }

        // Tambah notifikasi untuk pengirim
        if (finalSenderProfile?.uid) {
            const notifRef = doc(collection(db, 'notifications'));
            batch.set(notifRef, {
                userId: finalSenderProfile.uid,
                userNip: finalSenderProfile.nip,
                message: `Disposisi dikembalikan oleh ${getActorName()}. Alasan: ${alasan}`,
                link: `/dashboard/surat/${disposisi.suratId}`,
                isRead: false,
                timestamp: serverTimestamp() as Timestamp,
            });
        }

        await batch.commit();
        
        // [SINKRONISASI UI INSTAN]
        optimisticRemoveDisposisi(disposisi.id);

        // [AUTO LOGBOOK]
        try {
            await updateLogbook(userProfile.uid, effectiveJabatan?.opdId || userProfile.opdId, new Date(), {
                id: `auto_kembali_${disposisi.id}_${Date.now()}`,
                deskripsi: `Mengembalikan disposisi surat. Alasan: ${alasan}`,
                selesai: true
            });
        } catch (logErr) { console.error(logErr); }

        addToast('Disposisi dikembalikan.', 'success');
        refreshData(); 
        return true;
     } catch (err) {
         addToast('Gagal mengembalikan disposisi.', 'error');
         return false;
     } finally {
         setIsProcessing(false);
     }
  };

  const updateSurat = async (originalSurat: Surat, updatedData: Partial<Surat>, newFile?: File) => {
      if (!userProfile) return false;
      setIsProcessing(true);
      try {
          if (updatedData.detailAgenda && originalSurat.detailAgenda) {
              const newAgenda = updatedData.detailAgenda;
              const oldAgenda = originalSurat.detailAgenda;
              const isDateChanged = newAgenda.tanggal?.seconds !== oldAgenda.tanggal?.seconds;
              const isTimeChanged = newAgenda.jam !== oldAgenda.jam;
              if (isDateChanged || isTimeChanged) {
                  updatedData.reminderSent = false;
              }
          }

          if (newFile) {
              const { storage, ref, uploadBytesResumable, getDownloadURL } = await import('@/lib/firebase');
              const fileRef = ref(storage, `surat_files/${Date.now()}_${newFile.name}`);
              const uploadTask = await uploadBytesResumable(fileRef, newFile);
              const downloadURL = await getDownloadURL(uploadTask.ref);
              
              updatedData.fileUrl = downloadURL;
              updatedData.fileName = newFile.name;
          }

          const suratRef = doc(db, 'surat', originalSurat.id!);
          await updateDoc(suratRef, updatedData);
          addToast("Surat berhasil diperbarui.", "success");
          refreshData(); 
          return true;
      } catch (err: any) {
          console.error("Error update surat:", err);
          addToast("Gagal memperbarui surat.", "error");
          return false;
      } finally {
          setIsProcessing(false);
      }
  };

  const deleteSurat = async (surat: Surat) => {
      if (!userProfile || !surat.id) return false;
      setIsProcessing(true);
      try {
          // Cari dokumen terkait (disposisi dan tindakLanjut)
          const [disposisiSnap, tlSnap] = await Promise.all([
              import('firebase/firestore').then(m => m.getDocs(m.query(m.collection(db, 'disposisi'), m.where('suratId', '==', surat.id)))),
              import('firebase/firestore').then(m => m.getDocs(m.query(m.collection(db, 'tindakLanjut'), m.where('suratId', '==', surat.id))))
          ]);

          const refsToDelete = [
              doc(db, 'surat', surat.id),
              ...disposisiSnap.docs.map(d => d.ref),
              ...tlSnap.docs.map(d => d.ref)
          ];

          // Chunking into batches of 500
          for (let i = 0; i < refsToDelete.length; i += 500) {
              const chunk = refsToDelete.slice(i, i + 500);
              const batch = writeBatch(db);
              chunk.forEach(ref => batch.delete(ref));
              await batch.commit();
          }

          // [AUTO LOGBOOK]
          try {
              await updateLogbook(userProfile?.uid || '', effectiveJabatan?.opdId || '', new Date(), {
                  id: `auto_delete_${surat.id}_${Date.now()}`,
                  deskripsi: `Menghapus surat dan data terkait: "${surat.perihal}"`,
                  selesai: true
              });
          } catch (logErr) { console.error(logErr); }

          // [SINKRONISASI UI INSTAN]
          if (effectiveJabatan?.opdId) {
              queryClient.setQueryData(['suratList', effectiveJabatan.opdId], (oldData: any) => {
                  if (!oldData) return oldData;
                  return oldData.filter((s: any) => s.id !== surat.id);
              });
          }

          addToast("Surat berhasil dihapus beserta data terkait.", "success");
          refreshData(); 
          return true;
      } catch (err) {
          console.error("Error delete surat:", err);
          addToast("Gagal menghapus surat.", "error");
          return false;
      } finally {
          setIsProcessing(false);
      }
  };

  const distribusikanArsip = async (surat: Surat, targetUsers: UserProfile[]) => {
      if (!userProfile || !surat.id) return false;
      setIsProcessing(true);
      try {
          const batch = writeBatch(db);
          targetUsers.forEach(u => {
              const arsipRef = doc(db, 'suratPerPengguna', u.uid, 'arsip', surat.id);
              batch.set(arsipRef, { ...surat, diarsipkanOleh: userProfile.uid, tanggalArsip: Timestamp.now() });

              // [NOTIFIKASI PENERIMA ARSIP]
              const notifRef = doc(collection(db, 'notifications'));
              batch.set(notifRef, {
                  userId: u.uid,
                  userNip: u.nip,
                  message: `Anda mendapat tembusan arsip surat: "${surat.perihal}" dari ${getActorName()}`,
                  link: `/dashboard/surat/${surat.id}`,
                  isRead: false,
                  timestamp: serverTimestamp() as Timestamp,
              });
          });
          await batch.commit();
          addToast(`Surat berhasil diarsipkan ke ${targetUsers.length} penerima.`, 'success');
          return true;
      } catch (err) {
          addToast('Gagal mendistribusikan arsip.', 'error');
          return false;
      } finally {
          setIsProcessing(false);
      }
  };

  return {
    isProcessing,
    optimisticRemoveDisposisi,   // <-- EKSPOR FUNGSI INI
    optimisticUpdateAcknowledge, // <-- EKSPOR FUNGSI INI
    kirimDisposisi,
    eskalasiSurat,
    terimaDisposisi,
    kirimTindakLanjut,
    editTindakLanjut,
    archiveSurat,
    kembalikanDisposisi,
    distribusikanArsip,
    updateSurat,
    deleteSurat
  };
};