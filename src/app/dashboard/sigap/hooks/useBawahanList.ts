/**
 * Directory: src/app/dashboard/hooks/useBawahanList.ts
 * Status: MIGRATED TO REACT QUERY & SORTING FIXED
 * Deskripsi: Mengambil daftar bawahan (Lokal + Sub-OPD) dengan caching.
 * Mencegah re-fetch berulang saat membuka/tutup modal disposisi.
 * [FIX]: Memperbaiki logika sorting berdasarkan Level + Abjad
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useUserAuth } from '@/context/AuthContext';
import { fetchOpdList, fetchOpdMasterDocument } from '@/app/dashboard/sigap/hooks/useMasterData';
import { UserProfile, Jabatan, OPD } from '@/types';

// Fetcher terpisah untuk Pimpinan Sub-OPD
const fetchSubOpdLeaders = async (opdIndukId: string): Promise<UserProfile[]> => {
    // 1. Ambil semua OPD untuk mencari anak-anaknya
    // (Query ini ringan karena OPD collection biasanya kecil)
    const opdSnapshot = await getDocs(collection(db, 'opd'));
    const allOpds: OPD[] = [];
    opdSnapshot.forEach(doc => allOpds.push({ id: doc.id, ...doc.data() } as OPD));

    // 2. Cari ID Sub-OPD
    const subOpdIds = allOpds
        .filter(opd => opd.idOpdInduk === opdIndukId)
        .map(opd => opd.id!);

    if (subOpdIds.length === 0) return [];

    // 3. Cari Jabatan di Sub-OPD
    const jabatansInSubOpds: Jabatan[] = [];
    const chunks = [];
    // Batching query 'in' limit 10
    for (let i = 0; i < subOpdIds.length; i += 10) chunks.push(subOpdIds.slice(i, i + 10));
    
    for (const chunk of chunks) {
        const jabatansQuery = query(collection(db, 'jabatan'), where('opdId', 'in', chunk), where('status', '==', 'aktif'));
        const jabatansSnapshot = await getDocs(jabatansQuery);
        jabatansSnapshot.forEach(doc => jabatansInSubOpds.push({ id: doc.id, ...doc.data() } as Jabatan));
    }
    
    // 4. Filter Jabatan Tertinggi di tiap Sub-OPD
    const pimpinanJabatanIds: string[] = [];
    subOpdIds.forEach(subOpdId => {
        const jabatansInThisSubOpd = jabatansInSubOpds.filter(j => j.opdId === subOpdId);
        if (jabatansInThisSubOpd.length === 0) return;
        const minLevel = Math.min(...jabatansInThisSubOpd.map(j => j.level));
        const pimpinanJabatan = jabatansInThisSubOpd.find(j => j.level === minLevel);
        if (pimpinanJabatan && pimpinanJabatan.id) pimpinanJabatanIds.push(pimpinanJabatan.id);
    });

    if (pimpinanJabatanIds.length === 0) return [];

    // 5. Ambil User Profile
    const pimpinanProfiles: UserProfile[] = [];
    const userChunks = [];
    for (let i = 0; i < pimpinanJabatanIds.length; i += 10) userChunks.push(pimpinanJabatanIds.slice(i, i + 10));

    for (const chunk of userChunks) {
        const usersQuery = query(collection(db, 'users'), where('jabatanId', 'in', chunk), where('status', '==', 'aktif'));
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.forEach(doc => pimpinanProfiles.push(doc.data() as UserProfile));
    }
    
    return pimpinanProfiles;
};

export const useBawahanList = (
  userCache: Map<string, UserProfile>,
  opdJabatans: Map<string, Jabatan>
) => {
  const { userProfile, jabatanProfile, actingJabatanProfile } = useUserAuth();
  const effectiveJabatan = actingJabatanProfile || jabatanProfile;
  const isTuOrAdmin = userProfile?.role === 'staf_tu' || userProfile?.role === 'admin_opd';

  // Tentukan apakah perlu fetch Sub-OPD
  const shouldFetchSubOpd = !!(
      effectiveJabatan && 
      userProfile && 
      !isTuOrAdmin &&
      ((effectiveJabatan.level <= 5 && effectiveJabatan.idAtasan === null) || userProfile.role === 'super_admin')
  );

  // [OPTIMASI] Gunakan useQuery menggantikan useEffect
  const { data: subOpdPimpinan = [], isLoading: isSubOpdLoading, error } = useQuery({
      queryKey: ['subOpdLeaders', effectiveJabatan?.opdId],
      queryFn: () => fetchSubOpdLeaders(effectiveJabatan!.opdId),
      enabled: shouldFetchSubOpd && !!effectiveJabatan?.opdId,
      staleTime: 1000 * 60 * 60, // Cache 1 jam (Struktur OPD jarang berubah)
  });

  // Helper untuk mendapatkan skor birokrasi (Semakin besar = semakin tinggi kelasnya)
  const getBirokrasiScore = (jabatan: Jabatan) => {
      if (jabatan.tipeJabatan === 'struktural') {
          if (jabatan.eselon?.startsWith('I/')) return 50;
          if (jabatan.eselon?.startsWith('II/')) return 40;
          if (jabatan.eselon?.startsWith('III/')) return 30;
          if (jabatan.eselon?.startsWith('IV/')) return 20;
          return 10;
      } else if (jabatan.tipeJabatan === 'fungsional') {
          if (jabatan.jenjangFungsional === 'Utama') return 40; // Setara Eselon II
          if (jabatan.jenjangFungsional === 'Madya') return 30; // Setara Eselon III
          if (jabatan.jenjangFungsional === 'Muda') return 20;  // Setara Eselon IV
          if (jabatan.jenjangFungsional === 'Pertama' || jabatan.jenjangFungsional === 'Penyelia') return 10;
          return 5;
      }
      return 0; // Pelaksana / Default
  };

  // Helper untuk mengecek relasi idAtasan (langsung atau tidak langsung)
  const isTransitiveBawahan = (targetJabatanId: string, managerJabatanId: string, jabatanMap: Map<string, Jabatan>): boolean => {
      let currentId = targetJabatanId;
      let maxDepth = 20; // Mencegah infinite loop jika ada siklus
      while (currentId && maxDepth > 0) {
          const currentJab = jabatanMap.get(currentId);
          if (!currentJab || !currentJab.idAtasan) return false;
          if (currentJab.idAtasan === managerJabatanId) return true;
          currentId = currentJab.idAtasan;
          maxDepth--;
      }
      return false;
  };

  // MEMOIZED LIST (Gabungan)
  const bawahanList = useMemo(() => {
    if (!effectiveJabatan) return [];
    
    // A. Bawahan di OPD sendiri (dari cache yang dikirim parent)
    const bawahanDiOpdSendiri = Array.from(userCache.values()).filter(user => {
        const userJabatan = opdJabatans.get(user.jabatanId);
        if (!userJabatan) return false;
        
        const isActive = user.status === 'aktif';
        const notSelf = user.jabatanId !== effectiveJabatan.id; 
        const notAdmin = !user.role?.includes('admin');
        
        if (!isActive || !notSelf || !notAdmin) return false;

        // 1. Jalur Eksplisit (idAtasan) - Prioritas Tertinggi
        if (effectiveJabatan.id && isTransitiveBawahan(user.jabatanId, effectiveJabatan.id, opdJabatans)) {
            return true;
        }

        // 2. Jalur Heuristik Administratif (Level)
        const isLowerLevel = userJabatan.level > effectiveJabatan.level;
        
        if (isLowerLevel) {
             // 3. Filter Birokrasi (Pangkat/Kesetaraan)
             if (effectiveJabatan.tipeJabatan && userJabatan.tipeJabatan) {
                 const myScore = getBirokrasiScore(effectiveJabatan);
                 const theirScore = getBirokrasiScore(userJabatan);
                 
                 // Aturan Ketat: Struktural tidak boleh mendisposisi ke Fungsional yang setara/lebih tinggi
                 if (effectiveJabatan.tipeJabatan === 'struktural' && userJabatan.tipeJabatan === 'fungsional') {
                     return theirScore < myScore; 
                 }
             }
             return true; 
        }
        
        return false;
    });

    // B. Gabungkan dengan Pimpinan Sub-OPD
    const combinedList = [...bawahanDiOpdSendiri, ...subOpdPimpinan];

    // C. Sortir (Perbaikan logika hirarki)
    return combinedList.sort((a, b) => {
        // Cari Level A
        let levelA = 99; // Default terbawah
        const jabA = opdJabatans.get(a.jabatanId);
        if (jabA?.level !== undefined) {
            levelA = jabA.level;
        } else if (subOpdPimpinan.some(p => p.jabatanId === a.jabatanId && p.opdId !== effectiveJabatan.opdId)) {
            levelA = effectiveJabatan.level + 1; // Pimpinan Sub-OPD setingkat di bawah pimpinan OPD induk
        }

        // Cari Level B
        let levelB = 99; // Default terbawah
        const jabB = opdJabatans.get(b.jabatanId);
        if (jabB?.level !== undefined) {
            levelB = jabB.level;
        } else if (subOpdPimpinan.some(p => p.jabatanId === b.jabatanId && p.opdId !== effectiveJabatan.opdId)) {
            levelB = effectiveJabatan.level + 1;
        }

        // 1. Sortir berdasarkan level (kecil ke besar / hirarki atas ke bawah)
        if (levelA !== levelB) {
            return levelA - levelB; 
        }

        // 2. Jika level sama, sortir berdasarkan abjad nama sebagai fallback
        return a.namaLengkap.localeCompare(b.namaLengkap);
    });

  }, [userCache, opdJabatans, effectiveJabatan, subOpdPimpinan]);

  return {
    bawahanList,
    isLoading: isSubOpdLoading && shouldFetchSubOpd, // Hanya loading jika fetch aktif
    error: error ? (error as Error).message : null
  };
};