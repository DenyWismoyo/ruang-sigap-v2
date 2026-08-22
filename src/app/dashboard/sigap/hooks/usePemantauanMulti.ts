import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAuth } from '@/context/AuthContext';
import { Disposisi, Surat } from '@/types';

export type PemantauanItem = {
    disposisi: Disposisi;
    surat: Surat | null;
};

export const usePemantauanMulti = () => {
    const { userProfile, actingJabatanProfile, jabatanProfile } = useUserAuth();
    const effectiveJabatan = actingJabatanProfile || jabatanProfile;

    return useQuery({
        queryKey: ['pemantauan_multi', effectiveJabatan?.id],
        queryFn: async (): Promise<PemantauanItem[]> => {
            if (!effectiveJabatan?.id) return [];

            // 1. Fetch Disposisi yang dikirim oleh user ini
            const dispQ = query(
                collection(db, 'disposisi'),
                where('dariJabatanId', '==', effectiveJabatan.id),
                orderBy('tanggalDisposisi', 'desc'),
                limit(50)
            );
            const dispSnap = await getDocs(dispQ);
            
            const disposisiList = dispSnap.docs.map(d => ({ id: d.id, ...d.data() } as Disposisi))
                .filter(d => (d.kepadaJabatanId?.length || 0) > 1 && d.status !== 'Dikembalikan' && !d.isInformational);

            if (disposisiList.length === 0) return [];

            // 2. Fetch Surat terkait
            const suratIds = [...new Set(disposisiList.map(d => d.suratId))].filter(Boolean);
            const suratMap = new Map<string, Surat>();

            if (suratIds.length > 0) {
                // Chunk to batches of 10
                for (let i = 0; i < suratIds.length; i += 10) {
                    const chunk = suratIds.slice(i, i + 10);
                    const sq = query(collection(db, 'surat'), where(documentId(), 'in', chunk));
                    const sSnap = await getDocs(sq);
                    sSnap.docs.forEach(d => {
                        suratMap.set(d.id, { id: d.id, ...d.data() } as Surat);
                    });
                }
            }

            return disposisiList.map(d => ({
                disposisi: d,
                surat: suratMap.get(d.suratId) || null
            }));
        },
        enabled: !!effectiveJabatan?.id && effectiveJabatan.level <= 5,
        staleTime: 1000 * 60 * 2, // 2 menit
    });
};
