import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { OPD } from '@/types';

export interface OpdHealthMetrics {
  skorAdopsi: number;
  skorKonsistensi: number;
  skorProduktivitasDokumen: number;
  skorTugasTepatWaktu: number;
  totalUserAktif: number;
  totalUserLogin: number;
  rateAdopsi: number;
  totalSuratMasuk: number;
  totalSuratSelesai: number;
  totalTugasSelesai: number;
  totalTugasTepatWaktu: number;
  totalDisposisi: number;
  totalLogbook: number;
}

export interface OpdHealthScoreDoc {
  opdId: string;
  score: number;
  kategori: 'Sangat Sehat' | 'Sehat' | 'Perlu Perhatian' | 'Buruk' | 'Tidak Aktif' | string;
  dateString: string;
  tanggal?: any;
  metrics: OpdHealthMetrics;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Menormalkan metrik kesehatan dari schema lama maupun baru agar tidak pernah bernilai undefined
 */
export const normalizeHealthMetrics = (raw: any): OpdHealthMetrics => {
  const m = raw || {};
  const skorAdopsi = Number(m.skorAdopsi ?? m.rateAdopsi ?? m.aktivitasPengguna ?? m.adopsiUser ?? 0);
  const skorKonsistensi = Number(m.skorKonsistensi ?? m.retensiMingguan ?? 0);
  const skorProduktivitasDokumen = Number(m.skorProduktivitasDokumen ?? m.suratTerselesaikan ?? m.produktivitas ?? 0);
  const skorTugasTepatWaktu = Number(m.skorTugasTepatWaktu ?? m.ketepatanWaktu ?? m.tepatWaktu ?? m.tugasSelesaiTepatWaktu ?? 100);

  const totalUserAktif = Number(m.totalUserAktif ?? 0);
  const totalUserLogin = Number(m.totalUserLogin ?? 0);
  const rateAdopsi = totalUserAktif > 0 ? Math.round((totalUserLogin / totalUserAktif) * 100) : skorAdopsi;

  const totalSuratMasuk = Number(m.totalSuratMasuk ?? 0);
  const totalSuratSelesai = Number(m.totalSuratSelesai ?? 0);
  const totalTugasSelesai = Number(m.totalTugasSelesai ?? 0);
  const totalTugasTepatWaktu = Number(m.totalTugasTepatWaktu ?? m.tugasSelesaiTepatWaktu ?? 0);
  const totalDisposisi = Number(m.totalDisposisi ?? 0);
  const totalLogbook = Number(m.totalLogbook ?? 0);

  return {
    skorAdopsi,
    skorKonsistensi,
    skorProduktivitasDokumen,
    skorTugasTepatWaktu,
    totalUserAktif,
    totalUserLogin,
    rateAdopsi,
    totalSuratMasuk,
    totalSuratSelesai,
    totalTugasSelesai,
    totalTugasTepatWaktu,
    totalDisposisi,
    totalLogbook,
  };
};

const pad = (n: number) => (n < 10 ? '0' + n : String(n));

/**
 * Mendapatkan string bulan berjalan "YYYY-MM"
 */
export const getCurrentYearMonth = (date: Date = new Date()): string => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

/**
 * Menghitung skor kesehatan OPD untuk 1 OPD secara on-demand
 */
export const calculateOpdHealthScore = async (opdId: string): Promise<OpdHealthScoreDoc> => {
  const now = new Date();
  const dateStr = getCurrentYearMonth(now);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const startTimestamp = Timestamp.fromDate(startOfMonth);
  const endTimestamp = Timestamp.fromDate(now);

  const daysElapsed = Math.max(1, now.getDate());
  const weeksElapsed = Math.max(1, Math.ceil(daysElapsed / 7));

  // 1. Fetch multi-source data secara paralel
  const [usersSnap, masterDocSnap, sessionsSnap, suratSnap, disposisiSnap, logbookSnap, tindakLanjutSnap] = await Promise.all([
    // Ambil users tanpa filter status agar case-sensitivity ('Aktif' vs 'aktif') atau field kosong tidak menyebabkan 0 user
    getDocs(query(collection(db, 'users'), where('opdId', '==', opdId))),
    getDoc(doc(db, 'opdMasterData', opdId)).catch(() => null),
    getDocs(query(collection(db, 'userSessions'), where('opdId', '==', opdId), where('yearMonth', '==', dateStr))),
    getDocs(
      query(
        collection(db, 'surat'),
        where('opdId', '==', opdId),
        where('tanggalDiterima', '>=', startTimestamp),
        where('tanggalDiterima', '<=', endTimestamp)
      )
    ),
    getDocs(
      query(
        collection(db, 'disposisi'),
        where('opdId', '==', opdId),
        where('tanggalDisposisi', '>=', startTimestamp),
        where('tanggalDisposisi', '<=', endTimestamp)
      )
    ),
    getDocs(
      query(
        collection(db, 'logbookHarian'),
        where('opdId', '==', opdId),
        where('tanggal', '>=', startTimestamp),
        where('tanggal', '<=', endTimestamp)
      )
    ),
    getDocs(
      query(
        collection(db, 'laporanTindakLanjut'),
        where('opdId', '==', opdId),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp)
      )
    ).catch(() => ({ docs: [], size: 0, forEach: () => {} } as any)),
  ]);

  // Himpun seluruh data pegawai yang tidak berstatus 'nonaktif'
  const allUserDocs = new Map<string, any>();
  usersSnap.forEach((docSnap) => {
    const u = docSnap.data();
    const st = String(u.status || '').toLowerCase();
    if (st !== 'nonaktif') {
      const uid = (u.uid || u.nip || docSnap.id) as string;
      allUserDocs.set(uid, { id: docSnap.id, ...u });
    }
  });

  // Fallback dari opdMasterData jika query users kosong
  if (allUserDocs.size === 0 && masterDocSnap?.exists()) {
    const masterData = masterDocSnap.data();
    if (Array.isArray(masterData.users)) {
      masterData.users.forEach((u: any) => {
        const st = String(u.status || '').toLowerCase();
        if (st !== 'nonaktif') {
          const uid = (u.uid || u.nip || u.id) as string;
          if (uid) allUserDocs.set(uid, u);
        }
      });
    }
  }

  const uniqueUserIds = new Set<string>();
  const userWeeks = new Map<string, Set<number>>();

  const registerUserActivity = (uid: string | undefined, dateOrWeek?: Date | number) => {
    if (!uid) return;
    uniqueUserIds.add(uid);
    if (!userWeeks.has(uid)) userWeeks.set(uid, new Set());
    
    if (typeof dateOrWeek === 'number') {
      userWeeks.get(uid)!.add(dateOrWeek);
    } else if (dateOrWeek instanceof Date) {
      const w = Math.max(1, Math.ceil(dateOrWeek.getDate() / 7));
      userWeeks.get(uid)!.add(w);
    } else {
      userWeeks.get(uid)!.add(1);
    }
  };

  // Sumber A: Koleksi userSessions (Session Heartbeat)
  sessionsSnap.forEach((docSnap) => {
    const d = docSnap.data();
    const uid = d.userId as string;
    const week = d.weekOfMonth as number;
    registerUserActivity(uid, week);
  });

  // Sumber B: Aktivitas Pengisian Logbook Harian
  logbookSnap.forEach((docSnap) => {
    const d = docSnap.data();
    const uid = d.userId as string;
    let tglDate: Date | undefined;
    if (d.tanggal) {
      tglDate = d.tanggal.toDate ? d.tanggal.toDate() : new Date(d.tanggal);
    }
    registerUserActivity(uid, tglDate);
  });

  // Sumber C: Laporan Tindak Lanjut Surat
  tindakLanjutSnap.forEach((docSnap: any) => {
    const d = docSnap.data();
    const uid = d.userId as string;
    let tglDate: Date | undefined;
    if (d.createdAt) {
      tglDate = d.createdAt.toDate ? d.createdAt.toDate() : new Date(d.createdAt);
    }
    registerUserActivity(uid, tglDate);
  });

  // Sumber D: Profil User dengan lastActiveAt di bulan ini
  allUserDocs.forEach((u, uid) => {
    if (u.lastActiveAt) {
      const activeDate = u.lastActiveAt.toDate ? u.lastActiveAt.toDate() : new Date(u.lastActiveAt);
      if (activeDate >= startOfMonth && activeDate <= endOfMonth) {
        registerUserActivity(uid, activeDate);
      }
    }
  });

  const totalUserLogin = uniqueUserIds.size;
  // Pastikan totalUserAktif minimal sejumlah user login jika allUserDocs kosong
  const totalUserAktif = Math.max(allUserDocs.size, totalUserLogin);

  let skorAdopsi = 0;
  if (totalUserAktif > 0) {
    skorAdopsi = Math.min(100, Math.round((totalUserLogin / totalUserAktif) * 100));
  } else if (totalUserLogin > 0) {
    skorAdopsi = 100;
  }

  let skorKonsistensi = 0;
  if (totalUserLogin > 0) {
    let totalRate = 0;
    userWeeks.forEach((weeksSet) => {
      totalRate += Math.min(1, weeksSet.size / weeksElapsed);
    });
    skorKonsistensi = Math.min(100, Math.round((totalRate / totalUserLogin) * 100));
  }

  const totalSuratMasuk = suratSnap.size;
  let totalSuratSelesai = 0;

  suratSnap.forEach((docSnap) => {
    const s = docSnap.data();
    if (s.statusPenyelesaian === 'Selesai' || s.statusPenyelesaian === 'Diarsipkan') {
      totalSuratSelesai++;
    }
  });

  let skorProduktivitasDokumen = 0;
  if (totalSuratMasuk > 0) {
    skorProduktivitasDokumen = Math.min(100, Math.round((totalSuratSelesai / totalSuratMasuk) * 100));
  }

  const totalDisposisi = disposisiSnap.size;
  const totalLogbook = logbookSnap.size;

  // 3. Pilar 4: Penyelesaian Tugas Tepat Waktu
  const tugasSnap = await getDocs(
    query(
      collection(db, 'tugas'),
      where('opdId', '==', opdId),
      where('status', '==', 'Selesai'),
      where('tanggalSelesai', '>=', startTimestamp),
      where('tanggalSelesai', '<=', endTimestamp)
    )
  );

  let tugasTepatWaktu = 0;
  const totalTugasSelesai = tugasSnap.size;

  tugasSnap.forEach((docSnap) => {
    const t = docSnap.data();
    if (t.batasWaktu && t.tanggalSelesai) {
      if (t.tanggalSelesai.toMillis() <= t.batasWaktu.toMillis()) {
        tugasTepatWaktu++;
      }
    } else {
      tugasTepatWaktu++;
    }
  });

  let skorTugasTepatWaktu = 100;
  if (totalTugasSelesai > 0) {
    skorTugasTepatWaktu = Math.round((tugasTepatWaktu / totalTugasSelesai) * 100);
  }

  // 4. Perhitungan Skor Akhir
  const adaAktivitas = totalUserLogin > 0 || totalSuratMasuk > 0 || totalTugasSelesai > 0;

  let finalScore = 0;
  let kategori = 'Tidak Aktif';

  if (adaAktivitas) {
    finalScore = Math.round(
      0.3 * skorAdopsi +
      0.2 * skorKonsistensi +
      0.25 * skorProduktivitasDokumen +
      0.25 * skorTugasTepatWaktu
    );

    if (finalScore >= 85) kategori = 'Sangat Sehat';
    else if (finalScore >= 70) kategori = 'Sehat';
    else if (finalScore >= 50) kategori = 'Perlu Perhatian';
    else kategori = 'Buruk';
  }

  const metrics: OpdHealthMetrics = {
    skorAdopsi,
    skorKonsistensi,
    skorProduktivitasDokumen,
    skorTugasTepatWaktu,
    totalUserAktif,
    totalUserLogin,
    rateAdopsi: totalUserAktif > 0 ? Math.round((totalUserLogin / totalUserAktif) * 100) : 0,
    totalSuratMasuk,
    totalSuratSelesai,
    totalTugasSelesai,
    totalTugasTepatWaktu: tugasTepatWaktu,
    totalDisposisi,
    totalLogbook,
  };

  const healthDoc: OpdHealthScoreDoc = {
    opdId,
    score: finalScore,
    kategori,
    dateString: dateStr,
    tanggal: startTimestamp,
    metrics,
    updatedAt: serverTimestamp(),
  };

  // Simpan ke collection opdHealthScores dan update dokumen opd
  const batch = writeBatch(db);
  const healthRef = doc(db, 'opdHealthScores', `${opdId}_${dateStr}`);
  batch.set(healthRef, healthDoc, { merge: true });

  const opdRef = doc(db, 'opd', opdId);
  batch.update(opdRef, {
    currentHealthScore: finalScore,
    healthCategory: kategori,
  });

  await batch.commit();

  return healthDoc;
};

/**
 * Menghitung ulang seluruh OPD secara batch
 */
export const recalculateAllOpds = async (
  opdList: OPD[],
  onProgress?: (current: number, total: number, currentOpdName: string) => void
): Promise<number> => {
  let count = 0;
  for (let i = 0; i < opdList.length; i++) {
    const opd = opdList[i];
    if (opd.id) {
      if (onProgress) onProgress(i + 1, opdList.length, opd.namaOpd || opd.id);
      try {
        await calculateOpdHealthScore(opd.id);
        count++;
      } catch (err) {
        console.error(`Gagal menghitung skor untuk OPD ${opd.namaOpd}:`, err);
      }
    }
  }
  return count;
};

/**
 * Memberikan diagnosa AI dan rekomendasi berbasis pilar kesehatan OPD
 */
export const getOpdHealthDiagnosis = (
  rawMetrics: OpdHealthMetrics | undefined,
  score: number,
  namaOpd: string
): {
  headline: string;
  statusType: 'success' | 'warning' | 'destructive' | 'neutral';
  insights: string[];
  recommendations: string[];
} => {
  const metrics = normalizeHealthMetrics(rawMetrics);

  if (score === 0 && metrics.totalUserLogin === 0 && metrics.totalSuratMasuk === 0) {
    return {
      headline: 'Aktivitas Digital Belum Terdeteksi',
      statusType: 'neutral',
      insights: [
        `Instansi ${namaOpd} belum mencatatkan sesi login atau berkas surat masuk pada periode bulan ini.`,
      ],
      recommendations: [
        'Lakukan sosialisasi onboarding dan pastikan akun pegawai telah didaftarkan.',
        'Dorong Staf TU untuk mulai menginput surat masuk ke sistem.',
      ],
    };
  }

  const insights: string[] = [];
  const recommendations: string[] = [];

  // Analisis Pilar 1: Adopsi
  if (metrics.skorAdopsi >= 80) {
    insights.push(`Tingkat adopsi pegawai sangat kuat (${metrics.rateAdopsi}% user aktif login).`);
  } else if (metrics.skorAdopsi >= 50) {
    insights.push(`Adopsi pegawai moderat (${metrics.rateAdopsi}% user aktif login). Masih ada pegawai yang belum terbiasa membuka aplikasi.`);
    recommendations.push('Berikan pengingat berkala kepada kepala bidang agar mewajibkan staf membuka SIGAP.');
  } else {
    insights.push(`Adopsi rendah (${metrics.rateAdopsi}% user aktif login dari total ${metrics.totalUserAktif} pegawai).`);
    recommendations.push('Jadwalkan sesi bimbingan teknis ulang (Bimtek) internal untuk pegawai instansi ini.');
  }

  // Analisis Pilar 2: Konsistensi
  if (metrics.skorKonsistensi < 50 && metrics.totalUserLogin > 0) {
    insights.push('Sebagian besar pegawai hanya login sekali dalam sebulan dan tidak rutin aktif tiap minggu.');
    recommendations.push('Terapkan kewajiban pengisian logbook harian untuk meningkatkan retensi mingguan.');
  }

  // Analisis Pilar 3: Produktivitas Dokumen
  if (metrics.totalSuratMasuk > 0) {
    const selisih = metrics.totalSuratMasuk - metrics.totalSuratSelesai;
    if (metrics.skorProduktivitasDokumen >= 80) {
      insights.push(`Siklus persuratan lancar. ${metrics.totalSuratSelesai} dari ${metrics.totalSuratMasuk} surat telah tuntas ditindaklanjuti.`);
    } else if (metrics.skorProduktivitasDokumen >= 50) {
      insights.push(`Terdapat ${selisih} surat masuk yang masih dalam proses atau belum diarsipkan.`);
      recommendations.push('Pimpinan OPD disarankan meninjau disposisi yang terhambat di eselon bawahan.');
    } else {
      insights.push(`Penumpukan surat signifikan: ${selisih} surat masuk belum terselesaikan.`);
      recommendations.push('Lakukan pembersihan antrian surat baru dan evaluasi alur pendelegasian wewenang.');
    }
  }

  // Analisis Pilar 4: Ketepatan Waktu Tugas
  if (metrics.totalTugasSelesai > 0) {
    if (metrics.skorTugasTepatWaktu < 70) {
      const terlambat = metrics.totalTugasSelesai - metrics.totalTugasTepatWaktu;
      insights.push(`${terlambat} tugas diselesaikan melewati tenggat batas waktu (SLA).`);
      recommendations.push('Tetapkan batas waktu tugas yang lebih realistis atau seimbangkan beban kerja antar staf.');
    }
  }

  let statusType: 'success' | 'warning' | 'destructive' | 'neutral' = 'neutral';
  let headline = 'Performa Instansi Baik';

  if (score >= 85) {
    statusType = 'success';
    headline = 'Instansi Sangat Sehat & Berkinerja Optimal';
    if (recommendations.length === 0) {
      recommendations.push('Pertahankan standar kerja dan jadikan instansi ini sebagai benchmark rujukan bagi OPD lain.');
    }
  } else if (score >= 70) {
    statusType = 'neutral';
    headline = 'Instansi Sehat dengan Peluang Peningkatan';
  } else if (score >= 50) {
    statusType = 'warning';
    headline = 'Instansi Membutuhkan Perhatian & Monitoring';
  } else {
    statusType = 'destructive';
    headline = 'Instansi Berstatus Kritis / Perlu Intervensi';
  }

  return {
    headline,
    statusType,
    insights,
    recommendations,
  };
};
