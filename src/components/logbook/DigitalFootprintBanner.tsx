// src/components/logbook/DigitalFootprintBanner.tsx
// Banner cerdas pendeteksi jejak aktivitas digital hari ini yang belum masuk logbook.

'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Loader2, Footprints, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UnloggedFootprintItem } from '@/hooks/useDigitalFootprint';
import { useToastContext } from '@/context/ToastContext';

interface DigitalFootprintBannerProps {
  unloggedItems: UnloggedFootprintItem[];
  isInjecting: boolean;
  onInjectAll: () => Promise<boolean>;
  tenant?: 'sigap' | 'poros';
}

export const DigitalFootprintBanner: React.FC<DigitalFootprintBannerProps> = ({
  unloggedItems,
  isInjecting,
  onInjectAll,
  tenant = 'sigap',
}) => {
  const { addToast } = useToastContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const isPoros = tenant === 'poros';

  if (!unloggedItems || unloggedItems.length === 0) return null;

  const totalPoints = unloggedItems.reduce((acc, curr) => acc + (curr.nilaiPoin || 0), 0);

  const handleInject = async () => {
    const success = await onInjectAll();
    if (success) {
      addToast(`${unloggedItems.length} aktivitas digital berhasil dicatatkan ke logbook (+${totalPoints} MKE).`, 'success');
    } else {
      addToast('Terjadi kendala saat memasukkan jejak digital ke logbook.', 'error');
    }
  };

  return (
    <div
      className={cn(
        "p-4 mb-4 transition-all duration-300 backdrop-blur-md",
        isPoros
          ? "nk-mobile-borderless border-b border-teal-500/30 md:border md:border-teal-500/30 md:rounded-[var(--radius)] md:shadow-md bg-gradient-to-r from-teal-950/40 via-teal-900/20 to-slate-900/40 text-teal-100"
          : "sg-mobile-borderless border-b border-blue-500/30 md:border md:border-blue-500/30 md:rounded-[var(--radius)] md:shadow-md bg-gradient-to-r from-blue-950/40 via-indigo-900/20 to-slate-900/40 text-blue-100"
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Sisi Kiri: Info Jejak */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
              isPoros ? "bg-teal-500/20 text-teal-300" : "bg-blue-500/20 text-blue-300"
            )}
          >
            <Footprints className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-foreground">
                Digital Footprint Terdeteksi!
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  isPoros
                    ? "bg-teal-500/15 border-teal-400/40 text-teal-300"
                    : "bg-blue-500/15 border-blue-400/40 text-blue-300"
                )}
              >
                {unloggedItems.length} Aksi Belum Tercatat
              </Badge>
              <Badge
                variant="secondary"
                className="text-[11px] bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold"
              >
                +{totalPoints} MKE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sistem menemukan {unloggedItems.length} pekerjaan dinas hari ini yang belum masuk logbook Anda.
            </p>
          </div>
        </div>

        {/* Sisi Kanan: Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-muted-foreground hover:text-foreground h-9 px-2.5"
          >
            {isExpanded ? (
              <>Tutup <ChevronUp className="w-3.5 h-3.5 ml-1" /></>
            ) : (
              <>Lihat Detail <ChevronDown className="w-3.5 h-3.5 ml-1" /></>
            )}
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isInjecting}
            onClick={handleInject}
            className={cn(
              "text-xs font-bold h-9 px-4 rounded-xl shadow-md transition-all gap-1.5",
              isPoros
                ? "bg-teal-600 hover:bg-teal-500 text-white"
                : "bg-blue-600 hover:bg-blue-500 text-white"
            )}
          >
            {isInjecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Masukkan Semua (1-Klik)</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Detail Expansion */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border/40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {unloggedItems.map((item) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-background/50 border border-border/60 text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0 px-1.5">
                    {item.tipe}
                  </Badge>
                  <span className="text-muted-foreground font-mono text-[10px]">{item.waktu} WIB</span>
                </div>
                <p className="font-semibold text-foreground line-clamp-2">{item.deskripsi}</p>
              </div>

              <div className="mt-2 pt-1 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate">{item.aktivitasNama || 'Kepwal Solo'}</span>
                <span className="font-bold text-amber-500 shrink-0">+{item.nilaiPoin} Poin</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
