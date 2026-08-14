import { useState } from 'react';
import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export const useJadwalActions = () => {
    const { userProfile } = useUserAuth();
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async (id: string, onSuccess?: () => void) => {
        if (!userProfile) return;
        setIsProcessing(true);
        try {
            await updateDoc(doc(db, 'jadwalTempat', id), { 
                status: 'Disetujui', 
                ditinjauOleh: userProfile.uid, 
                tanggalDitinjau: Timestamp.now() 
            });
            addToast('Jadwal berhasil disetujui.', 'success');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Approve Jadwal Error:', error);
            addToast('Gagal menyetujui jadwal.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (id: string, alasan: string, onSuccess?: () => void) => {
        if (!userProfile) return;
        setIsProcessing(true);
        try {
            await updateDoc(doc(db, 'jadwalTempat', id), { 
                status: 'Ditolak', 
                alasanDitolak: alasan, 
                ditinjauOleh: userProfile.uid, 
                tanggalDitinjau: Timestamp.now() 
            });
            addToast('Jadwal ditolak.', 'success');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Reject Jadwal Error:', error);
            addToast('Gagal menolak jadwal.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async (id: string, onSuccess?: () => void) => {
        if (!userProfile) return;
        if (window.confirm("Yakin ingin membatalkan dan menghapus jadwal ini?")) {
            setIsProcessing(true);
            try {
                await deleteDoc(doc(db, 'jadwalTempat', id));
                addToast('Jadwal berhasil dihapus.', 'success');
                if (onSuccess) onSuccess();
            } catch (error) {
                console.error('Delete Jadwal Error:', error);
                addToast('Gagal menghapus jadwal.', 'error');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return {
        isProcessing,
        handleApprove,
        handleReject,
        handleDelete
    };
};
