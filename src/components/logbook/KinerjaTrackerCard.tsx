"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, LogbookHarian, LogbookKegiatan } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getAktivitasSoloById, detectAktivitasFromLogbookText } from '@/data/masterAktivitasSolo';
import { Trophy, Clock, Sparkles, Zap, ChevronRight, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface KinerjaTrackerCardProps {
  userProfile: UserProfile | null;
  currentDayKegiatan?: LogbookKegiatan[];
  selectedMonth: string; // 'YYYY-MM'
  onOpenAiAssistant: () => void;
  onOpenEkinerjaSync?: () => void;
  tenant?: 'sigap' | 'poros';
}

export function KinerjaTrackerCard({
  userProfile,
  currentDayKegiatan = [],
  selectedMonth,
  onOpenAiAssistant,
  onOpenEkinerjaSync,
  tenant = 'sigap',
}: KinerjaTrackerCardProps) {
  const [monthlyLogs, setMonthlyLogs] = useState<LogbookHarian[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Target standar kinerja bulanan ASN Pemkot Surakarta (Kepwal 786/154/2020)
  const TARGET_POIN_BULANAN = 1200; // Target rata-rata poin kinerja bulanan
  const TARGET_JAM_BULANAN = 112.5; // 112,5 Jam kerja efektif (5.625 menit / bulan)

  // Fetch semua logbook bulan berjalan untuk user ini
  useEffect(() => {
    if (!userProfile?.uid || !selectedMonth) return;

    let isMounted = true;
    const fetchMonthlyData = async () => {
      setIsLoading(true);
      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const q = query(
          collection(db, 'logbookHarian'),
          where('userId', '==', userProfile.uid)
        );
        const snap = await getDocs(q);

        if (!isMounted) return;

        const filtered = snap.docs
          .map(doc => doc.data() as LogbookHarian)
          .filter(log => {
            if (!log.tanggal || typeof log.tanggal.toDate !== 'function') return false;
            const t = log.tanggal.toDate().getTime();
            return t >= startDate.getTime() && t <= endDate.getTime();
          });

        setMonthlyLogs(filtered);
      } catch (err) {
        console.warn("[KinerjaTracker] Gagal memuat data bulanan:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchMonthlyData();
    return () => {
      isMounted = false;
    };
  }, [userProfile?.uid, selectedMonth]);

  // Helper kalkulasi poin dan durasi sebuah kegiatan
  const calculateKegiatanMetrics = (k: LogbookKegiatan) => {
    let poin = 0;
    if (k.aktivitasId) {
      poin = getAktivitasSoloById(k.aktivitasId)?.nilaiPoin || 35;
    } else {
      poin = detectAktivitasFromLogbookText(k.deskripsi)?.nilaiPoin || 35;
    }

    let menit = 60; // default 1 jam
    if (k.waktuMulai && k.waktuSelesai) {
      const [sh, sm] = k.waktuMulai.split(':').map(Number);
      const [eh, em] = k.waktuSelesai.split(':').map(Number);
      if (!isNaN(sh) && !isNaN(eh)) {
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        menit = diff > 0 ? diff : 60;
      }
    }

    return { poin, menit };
  };

  // Metrik Bulan Berjalan
  const monthlyMetrics = useMemo(() => {
    let totalPoin = 0;
    let totalMenit = 0;
    let totalKegiatan = 0;

    monthlyLogs.forEach(dayLog => {
      (dayLog.kegiatan || []).forEach(k => {
        const { poin, menit } = calculateKegiatanMetrics(k);
        totalPoin += poin;
        totalMenit += menit;
        totalKegiatan += 1;
      });
    });

    const totalJam = (totalMenit / 60);
    const persenPoin = Math.min(100, Math.round((totalPoin / TARGET_POIN_BULANAN) * 100));
    const persenJam = Math.min(100, Math.round((totalJam / TARGET_JAM_BULANAN) * 100));

    return {
      totalPoin,
      totalJam: totalJam.toFixed(1),
      totalKegiatan,
      persenPoin,
      persenJam,
    };
  }, [monthlyLogs]);

  // Metrik Hari Ini
  const todayMetrics = useMemo(() => {
    let poin = 0;
    let menit = 0;

    currentDayKegiatan.forEach(k => {
      const m = calculateKegiatanMetrics(k);
      poin += m.poin;
      menit += m.menit;
    });

    return {
      poin,
      jam: (menit / 60).toFixed(1),
      count: currentDayKegiatan.length,
    };
  }, [currentDayKegiatan]);

  // Status TPP & Rekomendasi
  const getStatusTPP = () => {
    const poin = monthlyMetrics.totalPoin;
    if (poin >= TARGET_POIN_BULANAN) {
      return {
        label: "Target TPP Terpenuhi (100%)",
        color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        icon: CheckCircle2,
        tip: "Luar biasa! Target kinerja bulan ini sudah melampaui batas aman TPP 100%."
      };
    }
    if (poin >= TARGET_POIN_BULANAN * 0.7) {
      const sisa = TARGET_POIN_BULANAN - poin;
      return {
        label: "Aman (On Track)",
        color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
        icon: Sparkles,
        tip: `Tersisa ${sisa} poin lagi untuk mengunci target poin TPP 100% bulan ini.`
      };
    }
    const sisa = TARGET_POIN_BULANAN - poin;
    return {
      label: "Perlu Ditingkatkan",
      color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      icon: AlertCircle,
      tip: `Kekurangan ${sisa} poin. Gunakan AI Smart Entry untuk mencatat setiap aktivitas harian secara detail!`
    };
  };

  const status = getStatusTPP();
  const StatusIcon = status.icon;

  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthName = new Date(Number(yearStr), Number(monthStr) - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className={`rounded-xl border p-4 sm:p-5 transition-all shadow-sm ${
      tenant === 'poros' 
        ? 'nk-card border-[var(--nk-glass-border)] bg-[var(--nk-surface-2)] text-foreground'
        : 'bg-card text-card-foreground border-border/80 sg-glass-panel'
    }`}>
      {/* Header Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${tenant === 'poros' ? 'bg-[var(--nk-teal-mid)]/15 text-[var(--nk-teal-mid)]' : 'bg-primary/10 text-primary'}`}>
            <Trophy size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Tracker Kinerja & Poin SKP
              </h3>
              <Badge variant="outline" className={`text-[11px] font-semibold border ${status.color}`}>
                <StatusIcon size={12} className="mr-1" />
                {status.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Periode {monthName} (Kepwal Solo No. 786/154/2020)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto">
          <Button
            size="sm"
            onClick={onOpenAiAssistant}
            className="flex-1 sm:flex-none gap-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-sm font-semibold text-xs h-8 px-3"
            title="Pecah catatan / jejak hari ini menjadi multi-kegiatan mandiri berpoin"
          >
            <Sparkles size={13} className="text-amber-200 animate-pulse" />
            AI Smart Entry
          </Button>

          {onOpenEkinerjaSync && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenEkinerjaSync}
              className="gap-1.5 border-amber-400/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs h-8 px-2.5 font-medium"
              title="Kirim ke portal e-Kinerja BKPSDM Surakarta"
            >
              <Zap size={13} className="fill-amber-500 text-amber-500" />
              Sync e-Kinerja
            </Button>
          )}
        </div>
      </div>

      {/* Grid Statistik Poin & Jam Kerja */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3.5">
        {/* Kolom 1: Akumulasi Poin Bulanan */}
        <div className="p-3 rounded-lg bg-muted/40 border border-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-semibold text-foreground/80 flex items-center gap-1">
              <Trophy size={13} className="text-amber-500" /> Akumulasi Poin
            </span>
            <span className="font-mono font-bold text-foreground">
              {monthlyMetrics.totalPoin} <span className="text-muted-foreground font-normal">/ {TARGET_POIN_BULANAN}p</span>
            </span>
          </div>
          <Progress value={monthlyMetrics.persenPoin} className="h-2 bg-muted" />
          <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1.5">
            <span>Ketercapaian: {monthlyMetrics.persenPoin}%</span>
            <span>{monthlyMetrics.totalKegiatan} Kegiatan</span>
          </div>
        </div>

        {/* Kolom 2: Jam Kerja Efektif Bulanan */}
        <div className="p-3 rounded-lg bg-muted/40 border border-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-semibold text-foreground/80 flex items-center gap-1">
              <Clock size={13} className="text-blue-500" /> Jam Efektif
            </span>
            <span className="font-mono font-bold text-foreground">
              {monthlyMetrics.totalJam} <span className="text-muted-foreground font-normal">/ {TARGET_JAM_BULANAN} Jam</span>
            </span>
          </div>
          <Progress value={monthlyMetrics.persenJam} className="h-2 bg-muted" />
          <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1.5">
            <span>Target: {monthlyMetrics.persenJam}%</span>
            <span>22 Hari Kerja</span>
          </div>
        </div>

        {/* Kolom 3: Perolehan Hari Ini */}
        <div className="p-3 rounded-lg bg-muted/40 border border-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="font-semibold text-foreground/80 flex items-center gap-1">
              <Calendar size={13} className="text-emerald-500" /> Hari Ini
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              +{todayMetrics.poin} Poin
            </span>
          </div>
          <div className="flex items-baseline justify-between text-xs mt-1">
            <span className="text-[11px] text-muted-foreground">Durasi Dicatat:</span>
            <span className="font-bold text-foreground font-mono">{todayMetrics.jam} Jam ({todayMetrics.count} kegiatan)</span>
          </div>
          <p className="text-[10px] text-muted-foreground italic truncate mt-1">
            {todayMetrics.count > 0 ? "Kegiatan hari ini siap diekspor ke e-Kinerja." : "Belum ada kegiatan hari ini."}
          </p>
        </div>
      </div>

      {/* Smart Tip Bar */}
      <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate flex items-center gap-1.5">
          <Sparkles size={12} className="text-amber-500 shrink-0" />
          <span className="truncate">{status.tip}</span>
        </span>
        <button
          onClick={onOpenAiAssistant}
          className="text-[11px] font-semibold text-primary hover:underline shrink-0 ml-2 flex items-center gap-0.5"
        >
          Catat via AI <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
