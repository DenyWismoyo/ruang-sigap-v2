"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Surat, Disposisi } from '@/types';
import { useSuratActions, TindakLanjutPayload } from '@/app/dashboard/sigap/hooks/useSuratActions';
import { useToast } from '@/context/ToastContext';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface QuickReportSession {
  id: string; // The surat.id
  surat: Surat;
  disposisi: Disposisi;
  judul: string;
  isi: string;
  warna: 'default' | 'red' | 'green' | 'blue' | 'yellow' | 'purple';
  isChecklist: boolean;
  checklist: { id: string; teks: string; isDone: boolean }[];
  isExpanded: boolean;
  isMeetingMode: boolean;
}

interface QuickReportContextType {
  reports: QuickReportSession[];
  activeReportId: string | null;
  isDrawerOpen: boolean; 
  isActionProcessing: boolean;
  
  // Core Actions
  openQuickReport: (surat: Surat, disposisi: Disposisi, isMeetingMode?: boolean) => void;
  closeQuickReport: (id: string) => void;
  setActiveReportId: (id: string | null) => void;
  toggleDrawer: () => void;
  
  // Updates for active report
  updateActiveReport: (updates: Partial<QuickReportSession>) => void;
  submitQuickReport: (isFinal: boolean, onSuccess?: () => void) => Promise<void>;
}

const QuickReportContext = createContext<QuickReportContextType | undefined>(undefined);

export const useQuickReport = () => {
  const context = useContext(QuickReportContext);
  if (!context) {
    throw new Error('useQuickReport must be used within a QuickReportProvider');
  }
  return context;
};

export const QuickReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addToast } = useToast();
  const { kirimTindakLanjut } = useSuratActions();

  const [reports, setReports] = useState<QuickReportSession[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isActionProcessing, setIsActionProcessing] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  // Load from LocalStorage Cache on Mount
  useEffect(() => {
    const cachedKeys = Object.keys(localStorage).filter(k => k.startsWith('tindakLanjut_quick_cache_'));
    const loadedReports: QuickReportSession[] = [];
    
    for (const key of cachedKeys) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || '{}');
        if (parsed && parsed.id && parsed.surat && parsed.disposisi) {
          loadedReports.push(parsed);
        }
      } catch (e) {
        console.error("Gagal membaca cache multi-laporan:", e);
      }
    }
    
    // Limit to 5 just in case
    setReports(loadedReports.slice(0, 5));
    setHasHydrated(true);
  }, []);

  // Sync to LocalStorage Auto-save whenever reports change
  useEffect(() => {
    if (!hasHydrated) return;
    
    // We clear all existing cache first to handle deletions
    const existingKeys = Object.keys(localStorage).filter(k => k.startsWith('tindakLanjut_quick_cache_'));
    existingKeys.forEach(k => localStorage.removeItem(k));
    
    // Save current reports
    reports.forEach(report => {
      // Only cache if there's actual content or if it's explicitly expanded
      if (report.isExpanded || report.isi || report.judul || report.checklist.length > 0) {
        localStorage.setItem(`tindakLanjut_quick_cache_${report.id}`, JSON.stringify(report));
      }
    });
  }, [reports, hasHydrated]);

  // Firestore Real-Time Listeners for Cross-Device Deletion
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    reports.forEach(report => {
      if (report.disposisi?.id) {
        const unsub = onSnapshot(doc(db, 'disposisi', report.disposisi.id), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Jika disposisi sudah selesai dari device lain (atau dari PC ini)
            if (data.status === 'Selesai' || (data.penerimaSelesai && data.penerimaSelesai.length > 0)) {
              setReports(prev => prev.filter(r => r.id !== report.id));
              setActiveReportId(prevId => prevId === report.id ? null : prevId);
              localStorage.removeItem(`tindakLanjut_quick_cache_${report.id}`);
            }
          }
        });
        unsubscribes.push(unsub);
      } else if (report.surat?.id) {
        // Fallback check surat
        const unsub = onSnapshot(doc(db, 'surat', report.surat.id), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.statusPenyelesaian === 'Selesai') {
              setReports(prev => prev.filter(r => r.id !== report.id));
              setActiveReportId(prevId => prevId === report.id ? null : prevId);
              localStorage.removeItem(`tindakLanjut_quick_cache_${report.id}`);
            }
          }
        });
        unsubscribes.push(unsub);
      }
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [reports]);

  const openQuickReport = useCallback((surat: Surat, disposisi: Disposisi, meetingMode = false) => {
    setReports(prev => {
      const existing = prev.find(r => r.id === surat.id);
      if (existing) {
        // Jika sudah ada, aktifkan saja
        setActiveReportId(surat.id!);
        setIsDrawerOpen(false);
        return prev;
      }
      
      if (prev.length >= 5) {
        addToast("Maksimal 5 draf laporan terbuka bersamaan. Harap tutup salah satu.", "error");
        return prev;
      }
      
      const newReport: QuickReportSession = {
        id: surat.id!,
        surat,
        disposisi,
        judul: '',
        isi: '',
        warna: 'default',
        isChecklist: false,
        checklist: [],
        isExpanded: true,
        isMeetingMode: meetingMode
      };
      
      setActiveReportId(surat.id!);
      setIsDrawerOpen(false);
      return [...prev, newReport];
    });
  }, [addToast]);

  const closeQuickReport = useCallback((id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
    localStorage.removeItem(`tindakLanjut_quick_cache_${id}`);
    setActiveReportId(prevId => prevId === id ? null : prevId);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
    if (!isDrawerOpen) {
      // Saat drawer dibuka, tutup notepad aktif
      setActiveReportId(null);
    }
  }, [isDrawerOpen]);

  const updateActiveReport = useCallback((updates: Partial<QuickReportSession>) => {
    setActiveReportId(currentId => {
      if (!currentId) return currentId;
      setReports(prev => prev.map(r => r.id === currentId ? { ...r, ...updates } : r));
      return currentId;
    });
  }, []);

  const submitQuickReport = async (isFinal: boolean, onSuccess?: () => void) => {
    // We need to use functional state to ensure we get the latest
    setReports(currentReports => {
      setActiveReportId(currentId => {
        const activeReport = currentReports.find(r => r.id === currentId);
        if (!activeReport) return currentId;
        
        if (!activeReport.isi && activeReport.checklist.length === 0) {
          addToast("Isi laporan tidak boleh kosong.", "error");
          return currentId;
        }
        
        const executeSubmit = async () => {
          setIsActionProcessing(true);
          try {
            const payload: TindakLanjutPayload = {
              isiLaporan: activeReport.isi,
              judulLaporan: activeReport.judul,
              warnaLabel: activeReport.warna,
              checklist: activeReport.checklist
            };

            const success = await kirimTindakLanjut(
              activeReport.surat,
              activeReport.disposisi,
              payload,
              undefined, 
              { isFinalAction: isFinal }
            );

            if (success) {
              closeQuickReport(activeReport.id);
              if (onSuccess) onSuccess();
            }
          } finally {
            setIsActionProcessing(false);
          }
        };

        executeSubmit();
        return currentId;
      });
      return currentReports;
    });
  };

  return (
    <QuickReportContext.Provider value={{
      reports, activeReportId, isDrawerOpen, isActionProcessing,
      openQuickReport, closeQuickReport, setActiveReportId, toggleDrawer,
      updateActiveReport, submitQuickReport
    }}>
      {children}
    </QuickReportContext.Provider>
  );
};

