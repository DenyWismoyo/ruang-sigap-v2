"use client";

import React, { useState } from 'react';
import { LogbookKegiatan, UserProfile } from '@/types';
import {
  EkinerjaFormPayload,
  formatToEkinerjaDate,
  copyEkinerjaBatchPayloadToClipboard,
  getEkinerjaBookmarkletHref,
} from '@/lib/ekinerjaBookmarklet';
import { MASTER_AKTIVITAS_SOLO, detectAktivitasFromLogbookText } from '@/data/masterAktivitasSolo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Zap,
  Check,
  ExternalLink,
  Copy,
  Clock,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToastContext } from '@/context/ToastContext';

interface EkinerjaBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  kegiatanList: LogbookKegiatan[];
  userProfile: UserProfile | null;
  tenant?: 'sigap' | 'poros';
}

export const EkinerjaBatchModal: React.FC<EkinerjaBatchModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  kegiatanList,
  userProfile,
  tenant = 'sigap',
}) => {
  const { addToast } = useToastContext();
  const isPoros = tenant === 'poros';
  const [copiedBatch, setCopiedBatch] = useState(false);

  // Selected item IDs (default all selected)
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Initialize selected item IDs when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const initial: Record<string, boolean> = {};
      kegiatanList.forEach((k) => {
        initial[k.id] = true;
      });
      setSelectedIds(initial);
      setCopiedBatch(false);
    }
  }, [isOpen, kegiatanList]);

  const rawDrive = userProfile?.googleDriveReportLink || '';
  const driveUrl = rawDrive
    ? (rawDrive.startsWith('http') ? rawDrive : `https://drive.google.com/drive/folders/${rawDrive}`)
    : '';

  const dateStr = formatToEkinerjaDate(selectedDate);

  // Build items preview and payloads
  const itemsWithMeta = React.useMemo(() => {
    return kegiatanList.map((k) => {
      let actNama = k.aktivitasNama || '';
      let actId = k.aktivitasId;
      let nilaiPoin = 0;

      if (actId) {
        const found = MASTER_AKTIVITAS_SOLO.find((a) => a.id === actId);
        if (found) {
          actNama = actNama || found.nama;
          nilaiPoin = found.nilaiPoin;
        }
      } else {
        const detected = detectAktivitasFromLogbookText(k.deskripsi);
        if (detected) {
          actNama = detected.nama;
          actId = detected.id;
          nilaiPoin = detected.nilaiPoin;
        }
      }

      let finalNamaKegiatan = k.deskripsi.trim();
      if (actNama && !finalNamaKegiatan.toLowerCase().includes(actNama.toLowerCase())) {
        finalNamaKegiatan = `[${actNama}] ${finalNamaKegiatan}`;
      }

      const payload: EkinerjaFormPayload = {
        tglPelaksanaan: dateStr,
        aktivitasId: actId,
        aktivitasNama: actNama,
        namaKegiatan: finalNamaKegiatan,
        jamMulai: k.waktuMulai || '08:00',
        jamSelesai: k.waktuSelesai || '09:30',
        kuantitas: 1,
        urlBuktiDukung: k.buktiUrl || driveUrl,
        catatan: `Dicatat melalui Logbook Harian ${isPoros ? 'POROS' : 'SIGAP'} Pemkot Surakarta.`,
      };

      return {
        ...k,
        actNama,
        actId,
        nilaiPoin,
        payload,
      };
    });
  }, [kegiatanList, dateStr, driveUrl, isPoros]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectAll = () => {
    const next: Record<string, boolean> = {};
    itemsWithMeta.forEach((item) => {
      next[item.id] = true;
    });
    setSelectedIds(next);
  };

  const unselectAll = () => {
    setSelectedIds({});
  };

  const selectedItems = itemsWithMeta.filter((item) => selectedIds[item.id]);
  const totalPoinSelected = selectedItems.reduce((acc, item) => acc + item.nilaiPoin, 0);

  const handleCopyBatch = async () => {
    if (selectedItems.length === 0) {
      addToast('Pilih minimal satu kegiatan untuk diekspor ke e-Kinerja.', 'info');
      return;
    }

    const payloads = selectedItems.map((item) => item.payload);
    const success = await copyEkinerjaBatchPayloadToClipboard(payloads, dateStr);

    if (success) {
      setCopiedBatch(true);
      addToast(`${payloads.length} kegiatan siap dimasukkan ke form e-Kinerja via Bookmarklet.`, 'success');
      setTimeout(() => setCopiedBatch(false), 4000);
    }
  };

  const primaryBtnClass = isPoros
    ? "bg-teal-600 hover:bg-teal-700 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl bg-card border-border">
        {/* Header Modal */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn("p-2 rounded-xl text-white shadow-sm", isPoros ? "bg-teal-600" : "bg-amber-600")}>
                <Zap size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Ekspor Batch e-Kinerja ({selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})
                  <Badge variant="outline" className="text-[10px] font-semibold border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                    Multi-Item Otomatis
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Salin seluruh catatan hari ini sekaligus. Script bookmarklet akan memandu pengisian form beruntun di tab e-Kinerja BKPSDM.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Banner Edukasi Cara Kerja Batch */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
              <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
              <span>Cara Kerja Antrean Multi-Item (Batch Helper):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
              <li>Klik tombol <strong>&quot;Salin Antrean Batch ({selectedItems.length} Kegiatan)&quot;</strong> di bawah.</li>
              <li>Buka form e-Kinerja BKPSDM Solo, lalu klik Bookmarklet <strong>&quot;⚡ Isi e-Kinerja Solo&quot;</strong>.</li>
              <li><strong>Item ke-1 langsung terisi!</strong> Setelah Anda klik Simpan, widget hijau di pojok kanan atas portal akan memunculkan tombol <em>&quot;Lanjut Item 2 ➡️&quot;</em>.</li>
              <li>Tidak perlu bolak-balik salin-tempel ke tab SIGAP lagi!</li>
            </ol>
          </div>

          {/* Controls Bar: Select All / Deselect + Ringkasan Poin */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                Pilih Semua
              </Button>
              <span className="text-muted-foreground/50">|</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={unselectAll}
                className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                Kosongkan
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Dipilih: <strong className="text-foreground">{selectedItems.length}/{itemsWithMeta.length}</strong></span>
              <Badge className="bg-emerald-600 text-white text-[11px] font-bold">
                +{totalPoinSelected} MKE
              </Badge>
            </div>
          </div>

          {/* List Kegiatan Batch */}
          {itemsWithMeta.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-xs">
              Belum ada kegiatan yang tercatat pada tanggal ini.
            </div>
          ) : (
            <div className="space-y-2">
              {itemsWithMeta.map((item) => {
                const isSelected = !!selectedIds[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer text-xs flex items-start gap-3",
                      isSelected
                        ? "bg-card border-amber-400/60 dark:border-amber-700/60 shadow-xs"
                        : "bg-muted/30 border-border opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock size={12} /> {item.waktuMulai || '08:00'} - {item.waktuSelesai || '09:30'}
                        </span>
                        {item.actNama && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                            {item.actNama}
                          </Badge>
                        )}
                        {item.nilaiPoin > 0 && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40">
                            +{item.nilaiPoin}m
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-foreground text-xs leading-relaxed break-words">
                        {item.deskripsi}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 sm:p-5 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href="http://103.115.227.196/e-kinerja/v4/d_kegiatan_harian"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline"
          >
            <ExternalLink size={12} className="mr-1" /> Buka e-Kinerja BKPSDM Solo
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Tutup
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleCopyBatch}
              disabled={selectedItems.length === 0}
              className={cn("text-xs font-bold shadow-md flex items-center gap-1.5", primaryBtnClass)}
            >
              {copiedBatch ? (
                <>
                  <Check size={14} className="text-emerald-300" />
                  <span>Antrean Batch Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Salin Antrean Batch ({selectedItems.length} Kegiatan)</span>
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
