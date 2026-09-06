// src/hooks/useDigitalFootprint.ts
// Hook untuk mendeteksi dan mengumpulkan jejak digital aktivitas sistem hari ini (Disposisi, Tindak Lanjut, Tugas Selesai)
// yang belum tercatat di logbook pengguna.

'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { UserProfile, LogbookKegiatan } from '@/types';
import { detectAktivitasFromLogbookText, getAktivitasSoloById } from '@/data/masterAktivitasSolo';
import { writeLogbookEntry } from '@/lib/logbookUtils';

export interface UnloggedFootprintItem {
  id: string;
  tipe: 'Disposisi' | 'Laporan' | 'Tugas' | 'Rapat';
  judul: string;
  deskripsi: string;
  waktu: string; // HH:mm
  referensiId?: string;
  aktivitasId?: number;
  aktivitasNama?: string;
  nilaiPoin: number;
  buktiUrl?: string;
  buktiNama?: string;
  suratTerkaitId?: string;
  suratPerihal?: string;
}

export function useDigitalFootprint(
  userProfile: UserProfile | null,
  selectedDate: Date,
  existingKegiatan: LogbookKegiatan[],
  onSuccessInject?: () => void
) {
  const [unloggedItems, setUnloggedItems] = useState<UnloggedFootprintItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);

  const scanFootprints = useCallback(async () => {
    if (!userProfile?.uid) return;
    setIsScanning(true);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const candidates: UnloggedFootprintItem[] = [];

      // Daftar ID/Perihal yang sudah ada di logbook hari ini untuk mencegah duplikasi
      const existingRefs = new Set<string>();
      existingKegiatan.forEach(k => {
        if (k.suratTerkaitId) existingRefs.add(k.suratTerkaitId);
        if (k.disposisiTerkaitId) existingRefs.add(k.disposisiTerkaitId);
        if (k.tugasTerkaitId) existingRefs.add(k.tugasTerkaitId);
        if (k.deskripsi) existingRefs.add(k.deskripsi.toLowerCase().trim());
      });

      // 1. Scan Disposisi yang dikirim oleh jabatan user pada tanggal ini
      if (userProfile.jabatanId) {
        try {
          const dispoQuery = query(
            collection(db, 'disposisi'),
            where('dariJabatanId', '==', userProfile.jabatanId)
          );
          const dispoSnap = await getDocs(dispoQuery);
          for (const docSnap of dispoSnap.docs) {
            const d = docSnap.data();
            let dDateStr = '';
            let dTimeStr = '08:30';
            if (d.createdAt && typeof d.createdAt.toDate === 'function') {
              const dDate = d.createdAt.toDate();
              dDateStr = dDate.toISOString().split('T')[0];
              dTimeStr = dDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
            }

            if (dDateStr === dateStr) {
              const dispoId = docSnap.id;
              if (existingRefs.has(dispoId) || (d.suratId && existingRefs.has(d.suratId))) {
                continue; // Sudah ada di logbook
              }

              let perihal = 'Surat Dinas';
              let suratPdfUrl = '';
              if (d.suratId) {
                const sDoc = await getDoc(doc(db, 'surat', d.suratId));
                if (sDoc.exists()) {
                  const sData = sDoc.data();
                  perihal = sData.perihal || perihal;
                  suratPdfUrl = sData.fileUrl || `/dashboard/surat/${d.suratId}`;
                }
              }

              const desc = `Mendisposisikan surat dinas: "${perihal}". Instruksi: ${d.instruksi || 'Tindak lanjuti'}`;
              const detected = detectAktivitasFromLogbookText(desc) || getAktivitasSoloById(79); // ID 79: Mendisposisi

              candidates.push({
                id: `fp_dispo_${dispoId}`,
                tipe: 'Disposisi',
                judul: `Disposisi: ${perihal}`,
                deskripsi: desc,
                waktu: dTimeStr,
                referensiId: dispoId,
                aktivitasId: detected?.id || 79,
                aktivitasNama: detected?.nama || 'Mendisposisi',
                nilaiPoin: detected?.nilaiPoin || 30,
                buktiUrl: suratPdfUrl || undefined,
                buktiNama: `Surat Dinas: ${perihal}`,
                suratTerkaitId: d.suratId,
                suratPerihal: perihal,
              });
            }
          }
        } catch (err) {
          console.warn('[DigitalFootprint] Gagal scan disposisi:', err);
        }
      }

      // 2. Scan Laporan Tindak Lanjut yang diselesaikan user pada tanggal ini
      try {
        const tlQuery = query(
          collection(db, 'laporanTindakLanjut'),
          where('userId', '==', userProfile.uid)
        );
        const tlSnap = await getDocs(tlQuery);
        for (const docSnap of tlSnap.docs) {
          const tl = docSnap.data();
          if (tl.tanggalSelesai && tl.tanggalSelesai.startsWith(dateStr)) {
            const tlId = docSnap.id;
            if (existingRefs.has(tlId) || (tl.suratId && existingRefs.has(tl.suratId))) {
              continue;
            }

            const desc = `Melaksanakan tindak lanjut: ${tl.hasilTindakan || 'Tindak lanjut disposisi surat dinas'}`;
            const detected = detectAktivitasFromLogbookText(desc) || getAktivitasSoloById(41); // ID 41: Membuat laporan

            candidates.push({
              id: `fp_tl_${tlId}`,
              tipe: 'Laporan',
              judul: `Tindak Lanjut Surat`,
              deskripsi: desc,
              waktu: '11:00',
              referensiId: tlId,
              aktivitasId: detected?.id || 41,
              aktivitasNama: detected?.nama || 'Membuat laporan',
              nilaiPoin: detected?.nilaiPoin || 64,
              buktiUrl: tl.buktiUrl || tl.fileBuktiUrl || undefined,
              buktiNama: `Bukti Tindak Lanjut: ${tl.hasilTindakan?.slice(0, 30) || 'Laporan'}`,
              suratTerkaitId: tl.suratId,
            });
          }
        }
      } catch (err) {
        console.warn('[DigitalFootprint] Gagal scan tindak lanjut:', err);
      }

      // 3. Scan Tugas yang selesai pada tanggal ini
      try {
        const tugasQuery = query(
          collection(db, 'tugasPerPengguna', userProfile.uid, 'tugas'),
          where('status', '==', 'Selesai')
        );
        const tugasSnap = await getDocs(tugasQuery);
        for (const docSnap of tugasSnap.docs) {
          const t = docSnap.data();
          let tDateStr = '';
          if (t.updatedAt && typeof t.updatedAt.toDate === 'function') {
            tDateStr = t.updatedAt.toDate().toISOString().split('T')[0];
          } else if (t.createdAt && typeof t.createdAt.toDate === 'function') {
            tDateStr = t.createdAt.toDate().toISOString().split('T')[0];
          }

          if (tDateStr === dateStr) {
            const tugasId = docSnap.id;
            if (existingRefs.has(tugasId)) continue;

            const desc = `Menyelesaikan penugasan: ${t.judul || 'Pelaksanaan tugas dinas'}`;
            const detected = detectAktivitasFromLogbookText(desc) || getAktivitasSoloById(32); // ID 32: Memasukkan data / tugas

            candidates.push({
              id: `fp_tugas_${tugasId}`,
              tipe: 'Tugas',
              judul: `Tugas: ${t.judul || 'Tugas Dinas'}`,
              deskripsi: desc,
              waktu: '13:30',
              referensiId: tugasId,
              aktivitasId: detected?.id || 32,
              aktivitasNama: detected?.nama || 'Memasukkan data',
              nilaiPoin: detected?.nilaiPoin || 35,
              buktiUrl: t.lampiranUrl || undefined,
              buktiNama: `Dokumen Tugas: ${t.judul || 'Tugas Dinas'}`,
            });
          }
        }
      } catch (err) {
        console.warn('[DigitalFootprint] Gagal scan tugas:', err);
      }

      // 4. [STRATEGIC P2] Scan Notulensi Rapat yang dihadiri atau dibuat user pada tanggal ini
      if (userProfile.opdId) {
        try {
          const notulensiQuery = query(
            collection(db, 'notulensi'),
            where('opdId', '==', userProfile.opdId)
          );
          const notulensiSnap = await getDocs(notulensiQuery);
          for (const docSnap of notulensiSnap.docs) {
            const n = docSnap.data();
            let nDateStr = '';
            if (n.tanggalRapat && typeof n.tanggalRapat.toDate === 'function') {
              nDateStr = n.tanggalRapat.toDate().toISOString().split('T')[0];
            }

            if (nDateStr === dateStr) {
              const notulensiId = docSnap.id;
              if (existingRefs.has(notulensiId)) continue;

              const isCreator = n.createdBy === userProfile.uid;
              const pesertaStr = typeof n.peserta === 'string' ? n.peserta.toLowerCase() : '';
              const isParticipant = userProfile.namaLengkap && pesertaStr.includes(userProfile.namaLengkap.toLowerCase());

              if (isCreator || isParticipant) {
                const desc = isCreator 
                  ? `Menyusun dan memvalidasi notulensi rapat dinas: "${n.judulRapat || 'Rapat Koordinasi'}"`
                  : `Mengikuti rapat koordinasi kedinasan: "${n.judulRapat || 'Rapat Dinas'}"`;
                
                const detected = isCreator ? getAktivitasSoloById(96) : getAktivitasSoloById(97); // 96: Membuat notulensi, 97: Mengikuti rapat

                candidates.push({
                  id: `fp_notulensi_${notulensiId}`,
                  tipe: 'Rapat',
                  judul: `Rapat: ${n.judulRapat || 'Rapat Kedinasan'}`,
                  deskripsi: desc,
                  waktu: '10:00',
                  referensiId: notulensiId,
                  aktivitasId: detected?.id || (isCreator ? 96 : 97),
                  aktivitasNama: detected?.nama || (isCreator ? 'Membuat notulen rapat' : 'Mengikuti rapat kedinasan'),
                  nilaiPoin: detected?.nilaiPoin || (isCreator ? 45 : 60),
                  buktiUrl: `/dashboard/notulensi`,
                  buktiNama: `Notulensi Rapat: ${n.judulRapat || 'Dokumen Rapat'}`,
                });
              }
            }
          }
        } catch (err) {
          console.warn('[DigitalFootprint] Gagal scan notulensi:', err);
        }
      }

      setUnloggedItems(candidates);
    } catch (err) {
      console.error('[DigitalFootprint] Error scanning footprints:', err);
    } finally {
      setIsScanning(false);
    }
  }, [userProfile?.uid, userProfile?.jabatanId, userProfile?.opdId, userProfile?.namaLengkap, selectedDate, existingKegiatan]);

  useEffect(() => {
    scanFootprints();
  }, [scanFootprints]);

  // Eksekusi masukkan seluruh kandidat jejak ke logbook harian
  const injectAllFootprints = async (): Promise<boolean> => {
    if (!userProfile?.uid || unloggedItems.length === 0) return false;
    setIsInjecting(true);

    try {
      for (const item of unloggedItems) {
        const [h, m] = item.waktu.split(':').map(Number);
        const startH = isNaN(h) ? 9 : h;
        const startM = isNaN(m) ? 0 : m;
        const endH = Math.min(16, startH + 1);
        const endM = startM;

        const waktuMulai = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
        const waktuSelesai = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        await writeLogbookEntry(userProfile.uid, userProfile.opdId, {
          deskripsi: item.deskripsi,
          kategori: item.tipe as any,
          selesai: true,
          sumber: 'footprint',
          aktivitasId: item.aktivitasId,
          aktivitasNama: item.aktivitasNama,
          waktuMulai,
          waktuSelesai,
          disposisiTerkaitId: item.tipe === 'Disposisi' ? item.referensiId : undefined,
          tugasTerkaitId: item.tipe === 'Tugas' ? item.referensiId : undefined,
          suratTerkaitId: item.suratTerkaitId,
          suratPerihal: item.suratPerihal,
          buktiUrl: item.buktiUrl,
          buktiNama: item.buktiNama,
        }, selectedDate);
      }

      setUnloggedItems([]);
      if (onSuccessInject) onSuccessInject();
      return true;
    } catch (err) {
      console.error('[DigitalFootprint] Gagal inject footprint:', err);
      return false;
    } finally {
      setIsInjecting(false);
    }
  };

  return {
    unloggedItems,
    isScanning,
    isInjecting,
    scanFootprints,
    injectAllFootprints,
  };
}
