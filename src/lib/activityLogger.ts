// Lokasi: src/lib/activityLogger.ts
import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

/**
 * Mencatat sebuah aktivitas terkait surat ke dalam database.
 * @param suratId ID dari surat yang terkait.
 * @param actorName Nama dan jabatan dari pengguna yang melakukan aksi.
 * @param action Deskripsi singkat dari aksi yang dilakukan.
 * @param details Detail tambahan dari aksi (opsional).
 */
export const logActivity = async (
  suratId: string, // Bisa diisi ID Surat ATAU ID RepositoryItem jika resourceType = 'repository'
  actorName: string,
  action: string,
  details?: string,
  resourceType: 'surat' | 'repository' | 'other' = 'surat'
): Promise<void> => {
  try {
    const payload: any = {
      actorName,
      action,
      details: details || null,
      timestamp: Timestamp.now(),
      resourceType,
    };
    
    // Untuk backward compatibility
    if (resourceType === 'surat') {
      payload.suratId = suratId;
    } else {
      payload.resourceId = suratId;
    }

    await addDoc(collection(db, 'activityLogs'), payload);
  } catch (error) {
    console.error("Gagal mencatat aktivitas:", error);
    // Di aplikasi produksi, Anda mungkin ingin menambahkan penanganan error yang lebih baik
  }
};
