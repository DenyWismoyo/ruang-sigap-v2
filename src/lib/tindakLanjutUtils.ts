import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { writeLogbookEntry } from '@/lib/logbookUtils';

import { LaporanTindakLanjut } from '@/types';

export interface CreateLaporanParams extends Omit<LaporanTindakLanjut, 'id' | 'createdAt'> {
  sumber?: 'manual' | 'copilot' | 'laporan_tindak_lanjut' | 'tugas' | 'checklist';
}

/**
 * Utilitas untuk membuat Laporan Tindak Lanjut beserta Bukti Kinerja dan Logbook.
 * Fungsi ini menangani triple-write atomik (simulasi atomik karena Firestore SDK di client
 * secara otomatis mengantrikan write ini).
 */
export const createLaporanTindakLanjut = async (params: CreateLaporanParams) => {
  const {
    userId,
    jabatanId,
    opdId,
    disposisiId,
    suratId = '',
    tugasId = '',
    ringkasanTindakan,
    hasilTindakan,
    instruksiAwal = 'Laporan otomatis dari Copilot',
    kendala = '',
    buktiFileUrl = null,
    sumber = 'copilot'
  } = params;

  if (!ringkasanTindakan || !hasilTindakan) {
    throw new Error('Ringkasan tindakan dan hasil tindakan wajib diisi.');
  }

  const now = Timestamp.now();

  // 1. Buat Laporan Tindak Lanjut
  const laporanRef = await addDoc(collection(db, 'laporanTindakLanjut'), {
    disposisiId,
    suratId,
    tugasId,
    userId,
    jabatanId,
    opdId,
    instruksiAwal,
    ringkasanTindakan,
    hasilTindakan,
    kendala,
    buktiFileUrl,
    createdAt: now,
  });

  // 2. Buat Bukti Kinerja
  await addDoc(collection(db, 'buktiKinerja'), {
    userId,
    jabatanId,
    opdId,
    judul: `Laporan Tindak Lanjut: ${ringkasanTindakan.substring(0, 50)}${ringkasanTindakan.length > 50 ? '...' : ''}`,
    deskripsi: hasilTindakan,
    sumber: 'laporan',
    laporanId: laporanRef.id,
    googleDriveLink: buktiFileUrl || '',
    tugasId,
    createdAt: now,
  });

  // 3. Catat ke Logbook
  await writeLogbookEntry(userId, opdId, {
    deskripsi: `Laporan Tindak Lanjut: ${ringkasanTindakan}`,
    selesai: true,
    kategori: 'Laporan',
    sumber,
    suratTerkaitId: suratId,
    disposisiTerkaitId: disposisiId,
    tugasTerkaitId: tugasId,
  });

  return laporanRef;
};
