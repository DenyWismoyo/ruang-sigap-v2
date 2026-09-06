// src/hooks/usePresensiLogbookSync.ts
// Hook untuk membaca data presensi harian ASN dari Firestore (`presensi/{userId}_{YYYY-MM-DD}`)
// Memberikan status jam masuk, jam pulang, dan validasi rentang jam kerja logbook (Presensi Safety Guard).

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile, PresensiRecord, LogbookKegiatan } from '@/types';

export function usePresensiLogbookSync(userProfile: UserProfile | null, selectedDate: Date) {
  const [presensiRecord, setPresensiRecord] = useState<PresensiRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const dateStr = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  useEffect(() => {
    if (!userProfile?.uid) {
      setPresensiRecord(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const docId = `${userProfile.uid}_${dateStr}`;
    const docRef = doc(db, 'presensi', docId);

    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setPresensiRecord({ id: snap.id, ...snap.data() } as PresensiRecord);
        } else {
          setPresensiRecord(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.warn('[PresensiLogbookSync] Error fetching presensi:', err);
        setPresensiRecord(null);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userProfile?.uid, dateStr]);

  // Validasi apakah jam kegiatan berada di luar jam absensi riil
  const checkTimeSafety = useCallback((waktuMulai?: string, waktuSelesai?: string): { isWarning: boolean; reason?: string } => {
    if (!presensiRecord || !waktuMulai) return { isWarning: false };

    const jamMasuk = presensiRecord.jamMasuk || (presensiRecord as any).masuk?.jam; // format HH:mm
    const jamPulang = presensiRecord.jamPulang || (presensiRecord as any).pulang?.jam; // format HH:mm

    if (jamMasuk && waktuMulai < jamMasuk) {
      // Kegiatan dimulai sebelum jam absen masuk
      const [hM, mM] = waktuMulai.split(':').map(Number);
      const [hIn, mIn] = jamMasuk.split(':').map(Number);
      const diffMinutes = (hIn * 60 + mIn) - (hM * 60 + mM);
      if (diffMinutes > 15) {
        return {
          isWarning: true,
          reason: `Jam kegiatan (${waktuMulai}) mendahului jam presensi masuk (${jamMasuk}).`,
        };
      }
    }

    if (jamPulang && waktuSelesai && waktuSelesai > jamPulang) {
      const [hE, mE] = waktuSelesai.split(':').map(Number);
      const [hOut, mOut] = jamPulang.split(':').map(Number);
      const diffMinutes = (hE * 60 + mE) - (hOut * 60 + mOut);
      if (diffMinutes > 30) {
        return {
          isWarning: true,
          reason: `Jam kegiatan (${waktuSelesai}) melebihi jam presensi pulang (${jamPulang}).`,
        };
      }
    }

    return { isWarning: false };
  }, [presensiRecord]);

  // Meratakan urutan jam kegiatan secara sekuensial menyesuaikan jam presensi aktual (Smart Clamping)
  const getClampedSchedule = useCallback((kegiatanList: LogbookKegiatan[]): LogbookKegiatan[] => {
    if (!kegiatanList || kegiatanList.length === 0) return [];

    const pad = (n: number) => String(n).padStart(2, '0');

    // 1. Tentukan jam mulai awal dari jam presensi masuk
    const rawJamMasuk = presensiRecord?.jamMasuk || (presensiRecord as any)?.masuk?.jam;
    let startHour = 8;
    let startMinute = 0;

    if (rawJamMasuk && typeof rawJamMasuk === 'string' && rawJamMasuk.includes(':')) {
      const [hIn, mIn] = rawJamMasuk.split(':').map(Number);
      if (!isNaN(hIn) && !isNaN(mIn)) {
        // Dibulatkan ke kelipatan 5 menit ke atas terdekat
        startHour = hIn;
        startMinute = Math.ceil(mIn / 5) * 5;
        if (startMinute >= 60) {
          startHour += 1;
          startMinute = 0;
        }
      }
    }

    // 2. Tentukan batas akhir kerja
    const rawJamPulang = presensiRecord?.jamPulang || (presensiRecord as any)?.pulang?.jam;
    let maxEndMinutes = 16 * 60 + 30; // default 16:30
    if (rawJamPulang && typeof rawJamPulang === 'string' && rawJamPulang.includes(':')) {
      const [hOut, mOut] = rawJamPulang.split(':').map(Number);
      if (!isNaN(hOut) && !isNaN(mOut)) {
        maxEndMinutes = hOut * 60 + mOut;
      }
    }

    let currentMinutes = startHour * 60 + startMinute;

    return kegiatanList.map((k) => {
      // Hitung durasi asli kegiatan
      let duration = 60;
      if (k.waktuMulai && k.waktuSelesai) {
        const [sh, sm] = k.waktuMulai.split(':').map(Number);
        const [eh, em] = k.waktuSelesai.split(':').map(Number);
        if (!isNaN(sh) && !isNaN(eh)) {
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff >= 15) duration = diff;
        }
      }

      // Hitung waktu mulai kegiatan ini
      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const waktuMulai = `${pad(startH)}:${pad(startM)}`;

      // Hitung waktu selesai
      let endTotal = currentMinutes + duration;
      // Jika melebihi jam pulang, sesuaikan (clamping) dengan batas toleransi
      if (endTotal > maxEndMinutes && currentMinutes < maxEndMinutes) {
        const remaining = maxEndMinutes - currentMinutes;
        if (remaining >= 15) {
          endTotal = maxEndMinutes;
        }
      }

      const endH = Math.floor(endTotal / 60);
      const endM = endTotal % 60;
      const waktuSelesai = `${pad(endH)}:${pad(endM)}`;

      currentMinutes = endTotal;

      return {
        ...k,
        waktuMulai,
        waktuSelesai,
      };
    });
  }, [presensiRecord]);

  return {
    presensiRecord,
    isLoading,
    jamMasuk: presensiRecord?.jamMasuk || (presensiRecord as any)?.masuk?.jam || null,
    jamPulang: presensiRecord?.jamPulang || (presensiRecord as any)?.pulang?.jam || null,
    statusKehadiran: presensiRecord?.statusKehadiran || null,
    statusMasuk: presensiRecord?.statusMasuk || (presensiRecord as any)?.masuk?.statusMasuk || null,
    checkTimeSafety,
    getClampedSchedule,
  };
}
