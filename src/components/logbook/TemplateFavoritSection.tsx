// src/components/logbook/TemplateFavoritSection.tsx
// Komponen carousel template kegiatan favorit untuk logbook
// Mendukung: 1-tap tambah ke logbook, jadwal rutinitas otomatis (recurring), tambah template baru, hapus template

'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Loader2, Star, Zap, X, Calendar, Clock, Repeat } from 'lucide-react';
import { useTemplateLogbook } from '@/hooks/useTemplateLogbook';
import { TemplateLogbookItem } from '@/types';
import { cn } from '@/lib/cn';

interface TemplateFavoritSectionProps {
  onSuccess?: () => void;
  targetDate?: Date;
  tenant?: 'sigap' | 'poros';
}

const DAY_LABELS: Record<number, string> = {
  1: 'Sen',
  2: 'Sel',
  3: 'Rab',
  4: 'Kam',
  5: 'Jum',
  6: 'Sab',
  0: 'Min',
};

// Modal untuk tambah template baru
function AddTemplateModal({
  isOpen,
  onClose,
  onAdd,
  isSaving,
  EMOJI_BY_KATEGORI,
  tenant = 'sigap',
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Pick<TemplateLogbookItem, 'nama' | 'deskripsi' | 'kategori' | 'aktivitasId' | 'aktivitasNama' | 'emoji' | 'recurringDays' | 'recurringWaktuMulai' | 'recurringWaktuSelesai' | 'isAutoRecurring'>) => Promise<boolean>;
  isSaving: boolean;
  EMOJI_BY_KATEGORI: Record<string, string>;
  tenant?: 'sigap' | 'poros';
}) {
  const isPoros = tenant === 'poros';
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategori, setKategori] = useState<TemplateLogbookItem['kategori']>('Umum');
  const [emoji, setEmoji] = useState('🏢');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // default Senin
  const [waktuMulai, setWaktuMulai] = useState('07:30');
  const [waktuSelesai, setWaktuSelesai] = useState('08:15');

  const KATEGORI_OPTIONS: Array<TemplateLogbookItem['kategori']> = ['Umum', 'Rapat', 'Laporan', 'Tugas', 'Surat', 'Disposisi'];

  const handleKategoriChange = (k: TemplateLogbookItem['kategori']) => {
    setKategori(k);
    setEmoji(EMOJI_BY_KATEGORI[k] || '🏢');
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleSubmit = async () => {
    if (!nama.trim() || !deskripsi.trim()) return;
    const ok = await onAdd({
      nama,
      deskripsi,
      kategori,
      emoji,
      recurringDays: isRecurring ? selectedDays : [],
      recurringWaktuMulai: isRecurring ? waktuMulai : undefined,
      recurringWaktuSelesai: isRecurring ? waktuSelesai : undefined,
      isAutoRecurring: isRecurring,
    });
    if (ok) {
      setNama('');
      setDeskripsi('');
      setKategori('Umum');
      setEmoji('🏢');
      setIsRecurring(false);
      setSelectedDays([1]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="font-semibold text-foreground text-sm">Simpan Template Baru</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3.5 overflow-y-auto">
          {/* Nama Template */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Nama Template <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={e => setNama(e.target.value)}
              placeholder="cth: Apel Pagi, Senam Jumat, Evaluasi Tim"
              className={cn(
                "w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs outline-none focus:ring-2 transition-all",
                isPoros ? "focus:ring-teal-500" : "focus:ring-blue-500"
              )}
            />
          </div>

          {/* Deskripsi Kegiatan */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Uraian Pekerjaan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={deskripsi}
              onChange={e => setDeskripsi(e.target.value)}
              rows={2}
              placeholder="Teks uraian kegiatan yang akan masuk ke logbook..."
              className={cn(
                "w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-xs outline-none focus:ring-2 transition-all resize-none",
                isPoros ? "focus:ring-teal-500" : "focus:ring-blue-500"
              )}
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Kategori</label>
            <div className="flex flex-wrap gap-1.5">
              {KATEGORI_OPTIONS.map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKategoriChange(k)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium transition-all border',
                    kategori === k
                      ? (isPoros ? 'bg-teal-600 text-white border-teal-600 shadow-sm' : 'bg-blue-600 text-white border-blue-600 shadow-sm')
                      : (isPoros ? 'bg-background text-muted-foreground border-border hover:border-teal-400' : 'bg-background text-muted-foreground border-border hover:border-blue-400')
                  )}
                >
                  {EMOJI_BY_KATEGORI[k]} {k}
                </button>
              ))}
            </div>
          </div>

          {/* Jadwal Rutinitas Otomatis (Recurring) */}
          <div className="p-3 rounded-xl border border-border/80 bg-muted/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                  className={cn(
                    "rounded border-input w-4 h-4",
                    isPoros ? "text-teal-600 focus:ring-teal-500" : "text-blue-600 focus:ring-blue-500"
                  )}
                />
                <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Repeat className={cn("w-3.5 h-3.5", isPoros ? "text-teal-500" : "text-blue-500")} />
                  Jadwal Rutin Mingguan
                </span>
              </label>
              {isRecurring && (
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", isPoros ? "text-teal-600 bg-teal-500/10" : "text-blue-600 bg-blue-500/10")}>
                  Aktif
                </span>
              )}
            </div>

            {isRecurring && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <p className="text-[11px] text-muted-foreground">Pilih hari kerja kegiatan rutin ini:</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border',
                        selectedDays.includes(d)
                          ? (isPoros ? 'bg-teal-600 text-white border-teal-600 shadow-xs' : 'bg-blue-600 text-white border-blue-600 shadow-xs')
                          : 'bg-background text-muted-foreground border-border hover:bg-muted'
                      )}
                    >
                      {DAY_LABELS[d]}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Jam Mulai</label>
                    <input
                      type="time"
                      value={waktuMulai}
                      onChange={e => setWaktuMulai(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-input bg-background text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-0.5">Jam Selesai</label>
                    <input
                      type="time"
                      value={waktuSelesai}
                      onChange={e => setWaktuSelesai(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-input bg-background text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 pt-2 border-t border-border flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-input text-foreground text-xs font-medium hover:bg-muted transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!nama.trim() || !deskripsi.trim() || isSaving}
            className={cn(
              "flex-1 py-2 rounded-xl disabled:opacity-50 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm",
              isPoros ? "bg-teal-600 hover:bg-teal-700" : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>Simpan Template</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TemplateFavoritSection({ onSuccess, targetDate, tenant = 'sigap' }: TemplateFavoritSectionProps) {
  const { templates, isLoading, isSaving, addTemplate, deleteTemplate, useTemplate, EMOJI_BY_KATEGORI } = useTemplateLogbook();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [usingId, setUsingId] = useState<string | null>(null);

  const isPoros = tenant === 'poros';
  const accentColor = isPoros ? 'teal' : 'blue';

  const handleUse = async (templateId: string) => {
    setUsingId(templateId);
    const ok = await useTemplate(templateId, targetDate);
    if (ok) {
      onSuccess?.();
    }
    setUsingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    setDeletingId(templateId);
    await deleteTemplate(templateId);
    setDeletingId(null);
  };

  const KATEGORI_COLORS: Record<string, string> = {
    'Disposisi': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'Rapat': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'Laporan': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'Tugas': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'Surat': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    'Umum': 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 px-1 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Memuat template favorit...</span>
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-1.5 rounded-lg shadow-xs',
            accentColor === 'teal' ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-600' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
          )}>
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-foreground">Template Kegiatan Rutin</p>
            <p className="text-[11px] text-muted-foreground">1-ketuk langsung masuk logbook</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs',
            accentColor === 'teal'
              ? 'bg-teal-600 hover:bg-teal-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Buat Template</span>
        </button>
      </div>

      {/* Template Cards — Horizontal Scroll */}
      {templates.length === 0 ? (
        <div
          onClick={() => setIsAddModalOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center py-5 px-4 border-2 border-dashed border-border rounded-2xl cursor-pointer transition-all group",
            isPoros ? "hover:border-teal-400 hover:bg-teal-50/20" : "hover:border-blue-400 hover:bg-blue-50/20"
          )}
        >
          <Star className="w-7 h-7 text-muted-foreground/50 group-hover:text-amber-500 transition-colors mb-1.5" />
          <p className={cn("text-xs font-semibold text-foreground transition-colors", isPoros ? "group-hover:text-teal-600" : "group-hover:text-blue-600")}>
            Belum ada template kegiatan
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Klik untuk simpan kegiatan rutin harian atau mingguan
          </p>
        </div>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {templates.map(template => {
            const hasRecurring = template.recurringDays && template.recurringDays.length > 0;
            const recurringStr = hasRecurring
              ? template.recurringDays!.map(d => DAY_LABELS[d]).join(',')
              : null;

            return (
              <button
                key={template.id}
                type="button"
                onClick={() => handleUse(template.id)}
                disabled={usingId === template.id || deletingId === template.id}
                className={cn(
                  'relative flex-shrink-0 w-44 p-3 rounded-2xl border text-left transition-all group',
                  'bg-card border-border hover:shadow-md hover:-translate-y-0.5',
                  isPoros ? 'hover:border-teal-400' : 'hover:border-blue-400',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {/* Emoji & Recurring Badge */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl leading-none">
                    {usingId === template.id ? (
                      <Loader2 className={cn("w-5 h-5 animate-spin", isPoros ? "text-teal-500" : "text-blue-500")} />
                    ) : (
                      template.emoji || '🏢'
                    )}
                  </span>

                  <div className="flex items-center gap-1">
                    {hasRecurring && (
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-0.5",
                        isPoros 
                          ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20" 
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                      )}>
                        <Repeat className="w-2.5 h-2.5" />
                        {recurringStr}
                      </span>
                    )}
                    {/* Hapus tombol */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, template.id)}
                      disabled={deletingId === template.id}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      {deletingId === template.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Nama Template */}
                <p className="text-xs font-bold text-foreground truncate mb-0.5">
                  {template.nama}
                </p>

                {/* Deskripsi (truncated) */}
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                  {template.deskripsi}
                </p>

                {/* Kategori & Usage */}
                <div className="flex items-center justify-between mt-auto">
                  <span className={cn('text-[9px] px-2 py-0.5 rounded-full font-bold', KATEGORI_COLORS[template.kategori || 'Umum'])}>
                    {template.kategori || 'Umum'}
                  </span>
                  {template.usageCount > 0 && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {template.usageCount}× dipakai
                    </span>
                  )}
                </div>

                {/* Hover: Tap to add indicator */}
                <div className={cn(
                  'absolute inset-0 rounded-2xl flex items-center justify-center pointer-events-none',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                  isPoros ? 'bg-teal-600/5' : 'bg-blue-600/5',
                  usingId === template.id && 'opacity-100'
                )}>
                  {usingId === template.id && (
                    <div className={cn(
                      "text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 shadow-md",
                      isPoros ? "bg-teal-600" : "bg-blue-600"
                    )}>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Menambahkan...
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {/* Tombol tambah di akhir carousel */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className={cn(
              "flex-shrink-0 w-16 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border transition-all text-muted-foreground",
              isPoros ? "hover:border-teal-400 hover:bg-teal-50/20 hover:text-teal-600" : "hover:border-blue-400 hover:bg-blue-50/20 hover:text-blue-600"
            )}
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-bold">Baru</span>
          </button>
        </div>
      )}

      {/* Modal Tambah Template */}
      <AddTemplateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addTemplate}
        isSaving={isSaving}
        EMOJI_BY_KATEGORI={EMOJI_BY_KATEGORI}
        tenant={tenant}
      />
    </>
  );
}
