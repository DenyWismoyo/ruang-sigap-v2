"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, LogbookHarian, LogbookKegiatan } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getAktivitasSoloById, detectAktivitasFromLogbookText } from '@/data/masterAktivitasSolo';
import { Trophy, Clock, Sparkles, Zap, ChevronRight, CheckCircle2, AlertCircle, Calendar, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface KinerjaTrackerCardProps {
  userProfile: UserProfile | null;
  currentDayKegiatan?: LogbookKegiatan[];
  selectedMonth: string; // 'YYYY-MM'
  onOpenAiAssistant: () => void;
  onOpenEkinerjaSync?: () => void;
  onAutoArrangeTimes?: () => void;
  tenant?: 'sigap' | 'poros';
}

export function KinerjaTrackerCard({
  userProfile,
  currentDayKegiatan = [],
  selectedMonth,
  onOpenAiAssistant,
  onOpenEkinerjaSync,
  onAutoArrangeTimes,
  tenant = 'sigap',
}: KinerjaTrackerCardProps) {
  const [monthlyLogs, setMonthlyLogs] = useState<LogbookHarian[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Target standar kinerja bulanan ASN Pemkot Surakarta (Kepwal 786/154/2020)
  // Standar: 8.400 Menit Kerja Efektif (MKE) / Poin = 140 Jam Kerja Efektif per Bulan
  const TARGET_POIN_BULANAN = 8400; // Target resmi 8.400 Menit Kerja Efektif (MKE) / Poin
  const TARGET_JAM_BULANAN = 140; // 140 Jam kerja efektif (8.400 menit / 60)

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
    let basePoin = 0;
    if (k.aktivitasId) {
      basePoin = getAktivitasSoloById(k.aktivitasId)?.nilaiPoin || 35;
    } else {
      basePoin = detectAktivitasFromLogbookText(k.deskripsi)?.nilaiPoin || 35;
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

    const kuantitas = k.kuantitas && k.kuantitas > 0 ? k.kuantitas : 1;
    const poin = basePoin * kuantitas;

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

  // Deteksi Hari Kerja Bolong (Audit Gap Finder)
  const gapFinder = useMemo(() => {
    if (!selectedMonth) return { missingCount: 0 };
    const [year, month] = selectedMonth.split('-').map(Number);
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
    const maxDay = isCurrentMonth ? now.getDate() : new Date(year, month, 0).getDate();

    const loggedDates = new Set<string>();
    monthlyLogs.forEach(log => {
      if (log.kegiatan && log.kegiatan.length > 0 && log.tanggal && typeof log.tanggal.toDate === 'function') {
        const d = log.tanggal.toDate();
        loggedDates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      }
    });

    let missing = 0;
    for (let day = 1; day <= maxDay; day++) {
      const checkDate = new Date(year, month - 1, day);
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!loggedDates.has(dateStr)) {
          missing++;
        }
      }
    }
    return { missingCount: missing };
  }, [monthlyLogs, selectedMonth]);

  // Deteksi Overlapping Jam Kerja pada Kegiatan Hari Ini
  const overlapWarning = useMemo(() => {
    if (!currentDayKegiatan || currentDayKegiatan.length < 2) return null;

    const parsed = currentDayKegiatan.map((k, idx) => {
      let start = -1;
      let end = -1;
      if (k.waktuMulai && k.waktuSelesai) {
        const [sh, sm] = k.waktuMulai.split(':').map(Number);
        const [eh, em] = k.waktuSelesai.split(':').map(Number);
        if (!isNaN(sh) && !isNaN(eh)) {
          start = sh * 60 + sm;
          end = eh * 60 + em;
        }
      }
      return { idx, start, end, deskripsi: k.deskripsi };
    }).filter(t => t.start >= 0 && t.end > t.start);

    for (let i = 0; i < parsed.length; i++) {
      for (let j = i + 1; j < parsed.length; j++) {
        const t1 = parsed[i];
        const t2 = parsed[j];
        if (t1.start < t2.end && t2.start < t1.end) {
          return {
            hasConflict: true,
            message: `Waktu "${t1.deskripsi.slice(0, 24)}..." bertabrakan dengan "${t2.deskripsi.slice(0, 24)}..."`,
          };
        }
      }
    }
    return null;
  }, [currentDayKegiatan]);

  // Status TPP & Rekomendasi
  const getStatusTPP = () => {
    const poin = monthlyMetrics.totalPoin;
    if (poin >= TARGET_POIN_BULANAN) {
      return {
        label: "Target 100% Terpenuhi",
        color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        icon: CheckCircle2,
        tip: "Luar biasa! Target kinerja 8.400 Menit Kerja Efektif (140 jam) bulan ini sudah aman 100%."
      };
    }
    if (poin >= TARGET_POIN_BULANAN * 0.7) {
      const sisa = TARGET_POIN_BULANAN - poin;
      return {
        label: "Aman (On Track)",
        color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
        icon: Sparkles,
        tip: `Tersisa ${sisa} poin lagi untuk mengunci target 8.400 poin (140 jam) TPP 100% bulan ini.`
      };
    }
    const sisa = TARGET_POIN_BULANAN - poin;
    return {
      label: "Perlu Ditingkatkan",
      color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
      icon: AlertCircle,
      tip: `Kekurangan ${sisa} poin menuju target 8.400 MKE. Gunakan AI Smart Entry untuk mencatat setiap aktivitas!`
    };
  };

  const status = getStatusTPP();
  const StatusIcon = status.icon;

  // Kalkulator Proyeksi Hak TPP 100%
  const tppProjection = useMemo(() => {
    const poin = monthlyMetrics.totalPoin;
    if (poin >= TARGET_POIN_BULANAN) {
      return {
        isSafe: true,
        projectedDateStr: "Sudah 100% Terkunci",
        dailyAvg: 0,
        tip: "Selamat! Hak TPP 100% Anda bulan ini sudah terkunci aman.",
      };
    }

    const [year, month] = selectedMonth.split('-').map(Number);
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month;
    const currentDay = isCurrentMonth ? Math.max(1, now.getDate()) : new Date(year, month, 0).getDate();

    const dailyAvg = Math.round(poin / currentDay);
    const remainingPoin = TARGET_POIN_BULANAN - poin;

    if (dailyAvg > 0) {
      const daysNeeded = Math.ceil(remainingPoin / dailyAvg);
      const projectedDay = currentDay + daysNeeded;
      const daysInMonth = new Date(year, month, 0).getDate();
      const isSafe = projectedDay <= daysInMonth;

      return {
        isSafe,
        projectedDateStr: isSafe
          ? `Tercapai ~${Math.min(daysInMonth, projectedDay)} ${new Date(year, month - 1).toLocaleString('id-ID', { month: 'short' })}`
          : `Proyeksi melewati bulan`,
        dailyAvg,
        tip: isSafe
          ? `Laju kinerja: ~${dailyAvg} MKE/hari. Target diproyeksikan tuntas ${Math.min(daysInMonth, projectedDay)} ${new Date(year, month - 1).toLocaleString('id-ID', { month: 'short' })}. Hak TPP AMAN 100%!`
          : `Laju saat ini ~${dailyAvg} MKE/hari. Perlu percepatan minimal ${Math.ceil(remainingPoin / Math.max(1, (daysInMonth - currentDay)))} MKE/hari agar TPP 100% aman.`,
      };
    }

    return {
      isSafe: false,
      projectedDateStr: "Belum ada laju",
      dailyAvg: 0,
      tip: "Mulai catat kegiatan harian Anda untuk mengaktifkan kalkulator proyeksi TPP.",
    };
  }, [monthlyMetrics.totalPoin, selectedMonth]);

  const [yearStr, monthStr] = selectedMonth.split('-');
  const monthName = new Date(Number(yearStr), Number(monthStr) - 1).toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className={cn(
      "p-4 sm:p-5 transition-all",
      tenant === 'poros' 
        ? 'nk-card nk-mobile-borderless border-b border-[var(--nk-glass-border)] bg-[var(--nk-surface-2)] text-foreground'
        : 'sg-card sg-mobile-borderless border-b border-border/80 bg-card text-card-foreground sg-glass-panel'
    )}>
      {/* Header Tracker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg ${tenant === 'poros' ? 'bg-[var(--nk-teal-mid)]/15 text-[var(--nk-teal-mid)]' : 'bg-primary/10 text-primary'}`}>
            <Trophy size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Tracker Kinerja & Target 8.400 MKE
              </h3>
              <Badge variant="outline" className={`text-[11px] font-semibold border ${status.color}`}>
                <StatusIcon size={12} className="mr-1" />
                {status.label}
              </Badge>
              <Badge variant="outline" className={`text-[10px] font-semibold border ${tppProjection.isSafe ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'}`}>
                <ShieldCheck size={12} className="mr-1" />
                TPP: {tppProjection.isSafe ? 'Aman 100%' : 'Perlu Pacu'}
              </Badge>
              {gapFinder.missingCount > 0 ? (
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                  ⚠️ {gapFinder.missingCount} Hari Bolong
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                  ✅ Hari Kerja Terisi
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Periode {monthName} • Target 8.400 Menit Kerja Efektif (Kepwal Solo No. 786/154/2020)
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

      {/* Alert Overlapping Waktu (Jika Terdeteksi) */}
      {overlapWarning?.hasConflict && (
        <div className="mt-3 p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-red-700 dark:text-red-300">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="text-red-500 shrink-0" />
            <span><strong>Peringatan Tabrakan Jam:</strong> {overlapWarning.message}</span>
          </div>
          {onAutoArrangeTimes && (
            <Button
              size="sm"
              variant="outline"
              onClick={onAutoArrangeTimes}
              className="h-7 text-xs border-red-400 text-red-700 dark:text-red-300 hover:bg-red-500/20 font-semibold shrink-0"
            >
              ⚡ Runtunkan Jam Otomatis
            </Button>
          )}
        </div>
      )}

      {/* Grid Statistik Poin & Jam Kerja */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-3.5">
        {/* Kolom 1: Akumulasi Poin Bulanan */}
        <div className="p-3 rounded-lg bg-muted/40 border border-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-semibold text-foreground/80 flex items-center gap-1">
              <Trophy size={13} className="text-amber-500" /> Akumulasi Poin (MKE)
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
            <span>Target: {monthlyMetrics.persenJam}% (140 Jam)</span>
            <span>Standar 8.400 Menit</span>
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

      {/* Smart Tip Bar & Proyeksi TPP */}
      <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="truncate flex items-center gap-1.5 min-w-0">
          <ShieldCheck size={13} className={tppProjection.isSafe ? "text-emerald-500 shrink-0" : "text-amber-500 shrink-0"} />
          <span className="truncate font-medium">{tppProjection.tip}</span>
        </span>
        <button
          onClick={onOpenAiAssistant}
          className="text-[11px] font-semibold text-primary hover:underline shrink-0 flex items-center gap-0.5 self-end sm:self-auto"
        >
          Catat via AI <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
