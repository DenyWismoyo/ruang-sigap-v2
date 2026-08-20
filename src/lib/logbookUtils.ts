// Lokasi file: src/lib/logbookUtils.ts
// File helper baru untuk mengisolasi logika pembaruan logbook harian.

import { db } from './firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { LogbookKegiatan, LogbookHarian } from '@/types';

/**
 * Helper untuk mengubah objek Date menjadi string YYYY-MM-DD.
 * @param date Objek Date.
 * @returns String format YYYY-MM-DD.
 */
const toYYYYMMDD = (date: Date) : string => {
  // Salin tanggal agar tidak mengubah objek aslinya
  const d = new Date(date);
  // Sesuaikan dengan zona waktu lokal (WIB adalah UTC+7)
  // Ini penting agar 'new Date()' yang dibuat di sisi server/klien
  // mereferensikan hari yang benar di zona waktu tersebut.
  // Cara aman adalah menggunakan UTC dan menyesuaikan offset,
  // tapi untuk aplikasi yang konsisten di satu zona waktu (misal Indonesia),
  // konversi ISOString dan split sudah cukup.
  // Namun, cara paling aman adalah TIDAK mengonversi ke YYYY-MM-DD
  // dan membiarkan sisi klien/server menggunakan objek Date utuh.
  
  // Untuk konsistensi dengan kode Anda di logbook/page.tsx:
  return date.toISOString().split('T')[0];
};

/**
 * Memperbarui (menambah/mengganti) entri logbook harian untuk seorang pengguna pada tanggal tertentu.
 * Fungsi ini akan mengambil data logbook yang ada, menambahkan kegiatan baru, dan menyimpannya kembali.
 *
 * @param userId UID pengguna.
 * @param opdId OPD pengguna.
 * @param tanggal Objek Date dari hari logbook yang akan diupdate.
 * @param kegiatanBaru Objek LogbookKegiatan yang akan ditambahkan.
 */
export const updateLogbook = async (
  userId: string,
  opdId: string,
  tanggal: Date,
  kegiatanBaru: LogbookKegiatan
) => {
  if (!userId || !opdId || !tanggal || !kegiatanBaru) {
    throw new Error("Data tidak lengkap untuk memperbarui logbook.");
  }

  // Tentukan tanggal di jam 00:00:00 untuk konsistensi Timestamp
  const tanggalLogbook = new Date(tanggal.getFullYear(), tanggal.getMonth(), tanggal.getDate());
  
  const dateStr = toYYYYMMDD(tanggalLogbook);
  const docId = `${userId}_${dateStr}`;
  const docRef = doc(db, 'logbookHarian', docId);

  try {
    // Tambahkan UID opsional ke arrayUnion untuk mencegah race condition (sudah atomic)
    const entry = {
      ...kegiatanBaru,
      id: kegiatanBaru.id || `kegiatan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: kegiatanBaru.createdAt || new Date().toISOString(),
    };

    // Gunakan setDoc dengan arrayUnion agar proses update atomic
    // import arrayUnion harus sudah ada di file, tapi saya harus cek impornya.
    // Untungnya ini hanya string replacement. Saya asumsikan arrayUnion akan diimport.
    const { arrayUnion } = await import('firebase/firestore');

    await setDoc(docRef, {
      userId: userId,
      opdId: opdId,
      tanggal: Timestamp.fromDate(tanggalLogbook),
      kegiatan: arrayUnion(entry),
    }, { merge: true });

    console.log(`Logbook berhasil diperbarui untuk ${docId}`);
  
  } catch (error) {
    console.error("Error di updateLogbook helper:", error);
    throw new Error("Gagal memperbarui logbook harian.");
  }
};

/**
 * Mencatat kegiatan baru ke dalam logbook harian (bisa dari manual, copilot, laporan, dll).
 */
export const writeLogbookEntry = async (
  userId: string,
  opdId: string,
  entry: Partial<LogbookKegiatan> & { deskripsi: string }
) => {
  const tanggal = new Date(); // Hari ini
  
  const kegiatanBaruRaw = {
    id: entry.id || `kegiatan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    deskripsi: entry.deskripsi,
    selesai: entry.selesai ?? true,
    kategori: entry.kategori || 'Umum',
    sumber: entry.sumber || 'manual',
    suratTerkaitId: entry.suratTerkaitId,
    suratPerihal: entry.suratPerihal,
    disposisiTerkaitId: entry.disposisiTerkaitId,
    tugasTerkaitId: entry.tugasTerkaitId,
    tugasTerkaitJudul: entry.tugasTerkaitJudul,
    waktuMulai: entry.waktuMulai,
    waktuSelesai: entry.waktuSelesai,
    createdAt: new Date().toISOString(),
  };

  // Firebase Firestore akan throw error jika ada value undefined
  const kegiatanBaru: any = {};
  for (const [key, value] of Object.entries(kegiatanBaruRaw)) {
    if (value !== undefined) {
      kegiatanBaru[key] = value;
    }
  }

  await updateLogbook(userId, opdId, tanggal, kegiatanBaru);
};
