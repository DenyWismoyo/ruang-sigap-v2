// Lokasi: src/context/NotificationContext.tsx
// [BARU] Memisahkan logika Notifikasi dari AuthContext.
// Tujuannya agar update notifikasi tidak memicu render ulang pada komponen yang hanya butuh data user.

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { db, functions } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, doc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useUserAuth } from "@/context/AuthContext"; // Kita butuh user dari Auth
import { Notification, WelcomeSummary } from "@/types";

interface NotificationContextType {
  welcomeSummary: WelcomeSummary;
  notifikasiList: Notification[];
  resetNotificationCount: (type: 'surat' | 'tugas') => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user, actingJabatanProfile, jabatanProfile } = useUserAuth(); // Dependency ke Auth
  const effectiveJabatanId = actingJabatanProfile?.id || jabatanProfile?.id || user?.uid;
  
  const [notifikasiList, setNotifikasiList] = useState<Notification[]>([]);
  const [welcomeSummary, setWelcomeSummary] = useState<WelcomeSummary>({
    disposisiBaru: 0, tindakLanjutMenunggu: 0, tugasAktif: 0,
    tugasLewatBatasWaktu: 0, suratMenungguDisposisi: 0,
    suratBaruCount: 0, tugasBaruCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Helper untuk update badge browser/PWA
  const updateAppBadge = (count: number) => {
    if (typeof window !== 'undefined' && 'setAppBadge' in navigator && typeof (navigator as any).setAppBadge === 'function') {
        (navigator as any).setAppBadge(count > 0 ? count : 0).catch((err: any) => console.error(err));
    }
  };

  // Reset Count Action
  const resetNotificationCount = async (type: 'surat' | 'tugas') => {
    if (!user) return;
    const fieldToReset = type === 'surat' ? 'suratBaruCount' : 'tugasBaruCount';
    
    // Optimistic Update
    setWelcomeSummary(prev => ({ ...prev, [fieldToReset]: 0 }));
    
    try {
      const resetCountFn = httpsCallable(functions, 'resetUserSummaryCount');
      await resetCountFn({ fieldToReset });
    } catch (error) { console.error(`Gagal reset ${fieldToReset}:`, error); }
  };

  // Listener Realtime
  useEffect(() => {
    if (!user) {
        setNotifikasiList([]);
        setWelcomeSummary({
            disposisiBaru: 0, tindakLanjutMenunggu: 0, tugasAktif: 0,
            tugasLewatBatasWaktu: 0, suratMenungguDisposisi: 0,
            suratBaruCount: 0, tugasBaruCount: 0,
        });
        setIsLoading(false);
        return;
    }

    setIsLoading(true);

    let unsubSummary = () => {};
    let unsubNotif = () => {};

    // 1. Listener Summary (Angka-angka dashboard)
    if (effectiveJabatanId) {
        const summaryRef = doc(db, 'userSummaries', effectiveJabatanId);
        unsubSummary = onSnapshot(summaryRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as WelcomeSummary;
                setWelcomeSummary(prev => ({ ...prev, ...data }));
                
                // Update App Badge
                const total = (data.suratBaruCount || 0) + (data.tugasBaruCount || 0);
                updateAppBadge(total);
            }
            setIsLoading(false);
        }, (err) => console.warn("Gagal subscribe summary:", err));
    } else {
        setIsLoading(false);
    }

    // 2. Listener Notifikasi (Lonceng)
    const notifQuery = query(
        collection(db, 'notifications'), 
        where('userId', '==', user.uid), 
        orderBy('timestamp', 'desc'), 
        limit(5)
    );
    unsubNotif = onSnapshot(notifQuery, (snapshot) => {
      setNotifikasiList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (err) => console.warn("Gagal subscribe notif:", err));
    
    return () => {
        unsubSummary();
        unsubNotif();
    };
  }, [user, effectiveJabatanId]);

  return (
    <NotificationContext.Provider value={{
      welcomeSummary,
      notifikasiList,
      resetNotificationCount,
      isLoading
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};