"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { LogbookKegiatan } from '@/types';
import {
  Clock,
  CheckCircle2,
  Circle,
  Zap,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  Check,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MASTER_AKTIVITAS_SOLO } from '@/data/masterAktivitasSolo';

interface LogbookTimelineCardProps {
  k: LogbookKegiatan;
  onToggle: (id: string) => void;
  onEdit: (entry: LogbookKegiatan) => void;
  onDelete: (id: string) => void;
  onKirimEkinerja?: (entry: LogbookKegiatan) => void;
  tenant?: 'sigap' | 'poros';
}

export const LogbookTimelineCard: React.FC<LogbookTimelineCardProps> = ({
  k,
  onToggle,
  onEdit,
  onDelete,
  onKirimEkinerja,
  tenant = 'sigap',
}) => {
  const [copied, setCopied] = useState(false);
  const isPoros = tenant === 'poros';



  // Cari bobot poin dari kamus jika aktivitas terdaftar
  const masterItem = React.useMemo(() => {
    if (!k.aktivitasId) return null;
    return MASTER_AKTIVITAS_SOLO.find((a) => a.id === k.aktivitasId);
  }, [k.aktivitasId]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(k.deskripsi);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Gagal menyalin:', e);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-3.5 md:p-4 rounded-2xl transition-all duration-200 border",
        k.selesai
          ? "bg-card/60 opacity-80 border-border/60"
          : isPoros
          ? "bg-card/90 backdrop-blur-md border-border/80 hover:border-teal-500/40 hover:shadow-md hover:shadow-teal-900/5"
          : "bg-card border-border/80 hover:border-blue-500/40 hover:shadow-md hover:shadow-slate-900/5"
      )}
    >
      {/* Kolom Kiri: Checkbox & Konten Utama */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {/* Toggle Selesai / Belum Button */}
        <button
          type="button"
          onClick={() => onToggle(k.id)}
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-lg focus:outline-hidden"
          title={k.selesai ? "Tandai belum selesai" : "Tandai selesai"}
        >
          {k.selesai ? (
            <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950/60" />
          ) : (
            <Circle size={22} className="text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          {/* Baris Meta Atas: Jam Kerja & Poin Menit */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] border",
              k.selesai
                ? "bg-muted text-muted-foreground border-border/40"
                : "bg-muted/70 text-foreground border-border/60"
            )}>
              <Clock size={12} className="text-muted-foreground shrink-0" />
              <span>{k.waktuMulai || '08:00'} - {k.waktuSelesai || '09:30'}</span>
            </span>

            {/* Badge Aktivitas Kepwal */}
            {k.aktivitasNama && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold py-0 px-2 flex items-center gap-1 truncate max-w-[260px]",
                  isPoros
                    ? "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/60"
                    : "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60"
                )}
                title={k.aktivitasNama}
              >
                <Sparkles size={11} className={isPoros ? "text-teal-600 dark:text-teal-400" : "text-blue-600 dark:text-blue-400"} />
                <span className="truncate">{k.aktivitasNama}</span>
                {masterItem && (
                  <span className="font-bold shrink-0">+{masterItem.nilaiPoin}m</span>
                )}
              </Badge>
            )}
          </div>

          {/* Deskripsi Kegiatan */}
          <p
            className={cn(
              "text-sm font-medium leading-relaxed break-words",
              k.selesai ? "line-through text-muted-foreground" : "text-foreground"
            )}
          >
            {k.deskripsi}
          </p>

          {/* Tugas Terkait (Jika Ada) */}
          {k.tugasTerkaitId && (
            <div className="pt-0.5">
              <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs text-emerald-700 dark:text-emerald-400 font-medium hover:underline">
                <Link href="/dashboard/tugas">
                  <LinkIcon size={12} className="mr-1 inline shrink-0" />
                  <span>Tugas: {k.tugasTerkaitJudul || 'Buka Rincian Tugas'}</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Kolom Kanan: Aksi Cepat (e-Kinerja, Edit, Dropdown) */}
      <div className="flex items-center justify-end gap-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-border/40 sm:self-center">
        {/* Tombol Utama: e-Kinerja Bridge */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onKirimEkinerja?.(k)}
          className="h-8 px-2.5 text-xs font-semibold border-amber-300 bg-amber-50/70 hover:bg-amber-100 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-900/50 shadow-xs flex items-center gap-1.5 transition-colors"
          title="Kirim entri ini ke formulir e-Kinerja BKPSDM Surakarta"
        >
          <Zap size={13} className="fill-amber-500 text-amber-500 shrink-0" />
          <span>e-Kinerja</span>
        </Button>

        {/* Tombol Cepat Edit (Desktop) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onEdit(k)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:inline-flex"
          title="Edit Kegiatan"
        >
          <Edit3 size={14} />
        </Button>

        {/* Menu Dropdown Opsi Lengkap */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              title="Menu Opsi"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => onKirimEkinerja?.(k)}
              className="text-amber-600 dark:text-amber-400 font-semibold focus:text-amber-600"
            >
              <Zap size={14} className="mr-2 fill-amber-500 text-amber-500" />
              Kirim ke e-Kinerja
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onEdit(k)}>
              <Edit3 size={14} className="mr-2" />
              Edit Kegiatan
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleCopyText}>
              {copied ? (
                <>
                  <Check size={14} className="mr-2 text-green-600" />
                  Uraian Tersalin!
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-2" />
                  Salin Teks Uraian
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => onDelete(k.id)}
              className="text-rose-600 dark:text-rose-400 focus:text-rose-600"
            >
              <Trash2 size={14} className="mr-2" />
              Hapus Kegiatan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
