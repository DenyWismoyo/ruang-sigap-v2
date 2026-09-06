"use client";

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogbookDateStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  tenant?: 'sigap' | 'poros';
  kegiatanDates?: Set<string>; // YYYY-MM-DD dates that have kegiatan
  presensiInfo?: {
    jamMasuk: string | null;
    jamPulang: string | null;
    statusKehadiran: string | null;
  } | null;
}

const toYYYYMMDD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const DAY_NAMES = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

export const LogbookDateStrip: React.FC<LogbookDateStripProps> = ({
  selectedDate,
  onSelectDate,
  tenant = 'sigap',
  kegiatanDates,
  presensiInfo,
}) => {
  const isPoros = tenant === 'poros';

  // Dapatkan hari Senin dari pekan yang memuat selectedDate
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDate);
    const dayOfWeek = curr.getDay(); // 0 = Minggu, 1 = Senin, ...
    // Hitung jarak ke hari Senin (Senin = 1, jika Minggu = 0 jadikan 7 agar Senin pekan lalu)
    const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(curr);
    monday.setDate(curr.getDate() + distanceToMonday);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const todayStr = toYYYYMMDD(new Date());
  const selectedStr = toYYYYMMDD(selectedDate);
  const isTodaySelected = selectedStr === todayStr;

  const handlePrevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 7);
    onSelectDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 7);
    onSelectDate(next);
  };

  const handleToday = () => {
    onSelectDate(new Date());
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [y, m, d] = e.target.value.split('-').map(Number);
      onSelectDate(new Date(y, m - 1, d));
    }
  };

  // Label bulan dan tahun saat ini
  const monthYearLabel = useMemo(() => {
    return selectedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }, [selectedDate]);

  const selectedDateFormatted = useMemo(() => {
    return selectedDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  return (
    <div className={cn(
      "w-full p-3 md:p-4 transition-all duration-200",
      isPoros
        ? "nk-card nk-mobile-borderless border-b border-border/40 bg-card/90 backdrop-blur-xl"
        : "sg-card sg-mobile-borderless border-b border-border/40 bg-card"
    )}>
      {/* Baris Atas: Bulan/Tahun, Navigasi Pekan, dan Tombol Hari Ini */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "p-1.5 rounded-lg shrink-0",
            isPoros ? "bg-teal-500/10 text-teal-600 dark:text-teal-400" : "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
          )}>
            <CalendarIcon size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm md:text-base font-bold text-foreground capitalize truncate leading-tight">
                {monthYearLabel}
              </h3>
              {presensiInfo && (presensiInfo.jamMasuk || presensiInfo.jamPulang) ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Presensi: {presensiInfo.jamMasuk || '--:--'} - {presensiInfo.jamPulang || 'Belum Pulang'}
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
              {selectedDateFormatted}
            </p>
          </div>
        </div>

        {/* Kontrol Navigasi Tanggal */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Datepicker */}
          <div className="relative">
            <input
              type="date"
              value={selectedStr}
              onChange={handleDatePickerChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="Pilih tanggal langsung dari kalender"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground font-medium flex items-center gap-1"
            >
              <CalendarIcon size={13} />
              <span className="hidden md:inline">Pilih Tanggal</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handlePrevWeek}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Pekan Sebelumnya"
          >
            <ChevronLeft size={16} />
          </Button>

          <Button
            type="button"
            variant={isTodaySelected ? "default" : "outline"}
            size="sm"
            onClick={handleToday}
            className={cn(
              "h-8 px-2.5 text-xs font-semibold",
              isTodaySelected
                ? (isPoros ? "bg-teal-600 hover:bg-teal-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white")
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Kembali ke Hari Ini"
          >
            <RotateCcw size={12} className="mr-1 hidden sm:inline" />
            Hari Ini
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleNextWeek}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Pekan Berikutnya"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Baris Strip 7 Hari (Senin s.d. Minggu) */}
      <div className="grid grid-cols-7 gap-1 md:gap-2">
        {weekDays.map((d) => {
          const dateStr = toYYYYMMDD(d);
          const isSelected = dateStr === selectedStr;
          const isToday = dateStr === todayStr;
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const dayShort = DAY_NAMES[d.getDay()];
          const dayNum = d.getDate();
          const hasKegiatan = kegiatanDates?.has(dateStr);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(d)}
              className={cn(
                "group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 select-none",
                isSelected
                  ? (isPoros
                      ? "bg-teal-600 text-white shadow-md shadow-teal-700/20 scale-[1.02]"
                      : "bg-blue-600 text-white shadow-md shadow-blue-700/20 scale-[1.02]")
                  : isToday
                  ? (isPoros
                      ? "bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/30 hover:bg-teal-500/20"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/40")
                  : isWeekend
                  ? "bg-muted/30 text-muted-foreground/80 hover:bg-accent hover:text-foreground border border-transparent"
                  : "bg-muted/15 text-foreground hover:bg-accent hover:text-foreground border border-transparent"
              )}
            >
              {/* Nama Hari */}
              <span className={cn(
                "text-[10px] md:text-xs font-semibold uppercase tracking-wider",
                isSelected
                  ? "text-white/90"
                  : isWeekend
                  ? "text-rose-500/80 dark:text-rose-400/80"
                  : "text-muted-foreground"
              )}>
                {dayShort}
              </span>

              {/* Tanggal Angka */}
              <span className={cn(
                "text-base md:text-lg font-bold leading-tight mt-0.5",
                isSelected ? "text-white" : "text-foreground"
              )}>
                {dayNum}
              </span>

              {/* Indicator Dot (Kegiatan / Today) */}
              <div className="flex items-center gap-1 mt-1 h-1.5">
                {isToday && !isSelected && (
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isPoros ? "bg-teal-500" : "bg-blue-600"
                  )} />
                )}
                {hasKegiatan && (
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isSelected ? "bg-amber-300" : "bg-emerald-500"
                  )} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Sub-Text Tanggal Terpilih di Ponsel */}
      <div className="mt-2 text-center text-[11px] text-muted-foreground font-medium sm:hidden">
        {selectedDateFormatted}
      </div>
    </div>
  );
};
