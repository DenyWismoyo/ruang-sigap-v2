"use client";

import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LogbookMobileActionDockProps {
  onAddKegiatan: () => void;
  onOpenAiEntry: () => void;
  tenant?: 'sigap' | 'poros';
}

export const LogbookMobileActionDock: React.FC<LogbookMobileActionDockProps> = ({
  onAddKegiatan,
  onOpenAiEntry,
  tenant = 'sigap',
}) => {
  const isPoros = tenant === 'poros';

  return (
    <div
      className={cn(
        "fixed left-4 right-4 z-40 md:hidden flex items-center gap-2 p-2 rounded-2xl shadow-xl border backdrop-blur-xl transition-transform duration-200 animate-in fade-in slide-in-from-bottom-5",
        "bottom-[calc(var(--bottom-nav-height,60px)+0.75rem)]",
        isPoros
          ? "bg-card/95 border-teal-500/30 shadow-teal-950/20 text-foreground"
          : "bg-card/95 border-border shadow-slate-950/15 text-foreground"
      )}
    >
      {/* Tombol Utama: Tambah Kegiatan */}
      <Button
        type="button"
        onClick={onAddKegiatan}
        className={cn(
          "flex-1 h-11 text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5",
          isPoros
            ? "bg-teal-600 hover:bg-teal-700 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        )}
      >
        <Plus size={18} className="shrink-0" />
        <span>+ Tambah Kegiatan</span>
      </Button>

      {/* Tombol Cepat: AI Smart Entry */}
      <Button
        type="button"
        onClick={onOpenAiEntry}
        className="h-11 px-3.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 shrink-0"
        title="Asisten AI: Pecah catatan bebas menjadi butir kegiatan mandiri"
      >
        <Sparkles size={16} className="text-amber-200 animate-pulse shrink-0" />
        <span>AI Entry</span>
      </Button>
    </div>
  );
};
