import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export interface LaporanTindakLanjutData {
    tugasId: string;
    suratId: string;
    disposisiId: string;
    instruksiAwal: string;
    ringkasanTindakan: string;
    hasilTindakan: string;
    kendala: string;
    buktiFileUrl?: string;
    addToLogbook?: boolean;
}

export function useLaporanTindakLanjut() {
    const { userProfile } = useUserAuth();
    const { addToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitLaporan = async (data: LaporanTindakLanjutData) => {
        if (!userProfile) {
            addToast("Sesi tidak valid.", "error");
            return false;
        }

        setIsSubmitting(true);
        try {
            const now = Timestamp.now();
            
            // 1. Simpan ke koleksi laporanTindakLanjut
            const laporanData = {
                tugasId: data.tugasId,
                suratId: data.suratId,
                disposisiId: data.disposisiId,
                userId: userProfile.uid,
                jabatanId: userProfile.jabatanId,
                opdId: userProfile.opdId,
                instruksiAwal: data.instruksiAwal,
                ringkasanTindakan: data.ringkasanTindakan,
                hasilTindakan: data.hasilTindakan,
                kendala: data.kendala,
                buktiFileUrl: data.buktiFileUrl || null,
                createdAt: now,
            };
            
            const laporanRef = await addDoc(collection(db, 'laporanTindakLanjut'), laporanData);

            // 2. Simpan sebagai Bukti Kinerja (Otomatis)
            await addDoc(collection(db, 'buktiKinerja'), {
                userId: userProfile.uid,
                jabatanId: userProfile.jabatanId,
                opdId: userProfile.opdId,
                judul: `Laporan Tindak Lanjut: ${data.ringkasanTindakan.substring(0, 50)}...`,
                deskripsi: data.hasilTindakan,
                googleDriveLink: data.buktiFileUrl || '',
                sumber: 'laporan',
                tugasId: data.tugasId,
                laporanId: laporanRef.id,
                createdAt: now,
            });

            // 3. Tambahkan ke Logbook (Opsional, jika dicentang)
            if (data.addToLogbook) {
                await addDoc(collection(db, 'logbookHarian'), {
                    userId: userProfile.uid,
                    jabatanId: userProfile.jabatanId,
                    opdId: userProfile.opdId,
                    tanggal: now,
                    aktivitas: data.ringkasanTindakan,
                    hasil: data.hasilTindakan,
                    keterangan: data.kendala ? `Kendala: ${data.kendala}` : 'Selesai',
                    sumber: 'laporan',
                    laporanId: laporanRef.id,
                    createdAt: now,
                });
            }

            addToast("Laporan tindak lanjut berhasil disimpan.", "success");
            return true;
        } catch (error) {
            console.error("Error submitLaporan:", error);
            addToast("Gagal menyimpan laporan.", "error");
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return { submitLaporan, isSubmitting };
}
