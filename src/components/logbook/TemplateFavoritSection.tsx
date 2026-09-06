// src/components/logbook/TemplateFavoritSection.tsx
// Komponen carousel template kegiatan favorit untuk logbook
// Mendukung: 1-tap tambah ke logbook, tambah template baru, hapus template

'use client';

import React, { useState } from 'react';
import { Plus, Trash2, Loader2, Star, Zap, ChevronRight, X } from 'lucide-react';
import { useTemplateLogbook } from '@/hooks/useTemplateLogbook';
import { TemplateLogbookItem } from '@/types';
import { cn } from '@/lib/cn';

interface TemplateFavoritSectionProps {
  onSuccess?: () => void; // Dipanggil setelah template digunakan (untuk refresh logbook)
  tenant?: 'sigap' | 'poros';
}

// Modal untuk tambah template baru
function AddTemplateModal({
  isOpen,
  onClose,
  onAdd,
  isSaving,
  EMOJI_BY_KATEGORI,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Pick<TemplateLogbookItem, 'nama' | 'deskripsi' | 'kategori' | 'aktivitasId' | 'aktivitasNama' | 'emoji'>) => Promise<boolean>;
  isSaving: boolean;
  EMOJI_BY_KATEGORI: Record<string, string>;
}) {
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategori, setKategori] = useState<TemplateLogbookItem['kategori']>('Umum');
  const [emoji, setEmoji] = useState('🏢');

  const KATEGORI_OPTIONS: Array<TemplateLogbookItem['kategori']> = ['Umum', 'Rapat', 'Laporan', 'Tugas', 'Surat', 'Disposisi'];

  const handleKategoriChange = (k: TemplateLogbookItem['kategori']) => {
    setKategori(k);
    setEmoji(EMOJI_BY_KATEGORI[k] || '🏢');
  };

  const handleSubmit = async () => {
    if (!nama.trim() || !deskripsi.trim()) return;
    const ok = await onAdd({ nama, deskripsi, kategori, emoji });
    if (ok) {
      setNama('');
      setDeskripsi('');
      setKategori('Umum');
      setEmoji('🏢');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-neutral-900 dark:text-white">Simpan Template Baru</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Nama Template */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              Nama Template <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={e => setNama(e.target.value)}
              placeholder="cth: Apel Pagi, Rapat Rutin, dll"
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Deskripsi Kegiatan */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
              Deskripsi Kegiatan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={deskripsi}
              onChange={e => setDeskripsi(e.target.value)}
              rows={3}
              placeholder="Tulis deskripsi kegiatan yang akan masuk ke logbook..."
              className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Kategori</label>
            <div className="flex flex-wrap gap-2">
              {KATEGORI_OPTIONS.map(k => (
                <button
                  key={k}
                  onClick={() => handleKategoriChange(k)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                    kategori === k
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-blue-400'
                  )}
                >
                  {EMOJI_BY_KATEGORI[k]} {k}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!nama.trim() || !deskripsi.trim() || isSaving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Star className="w-4 h-4" />
                Simpan Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TemplateFavoritSection({ onSuccess, tenant = 'sigap' }: TemplateFavoritSectionProps) {
  const { templates, isLoading, isSaving, addTemplate, deleteTemplate, useTemplate, EMOJI_BY_KATEGORI } = useTemplateLogbook();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [usingId, setUsingId] = useState<string | null>(null);

  const accentColor = tenant === 'poros' ? 'teal' : 'blue';

  const handleUse = async (templateId: string) => {
    setUsingId(templateId);
    const ok = await useTemplate(templateId);
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
      <div className="flex items-center gap-2 py-3 px-1 text-neutral-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-xs">Memuat template favorit...</span>
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'p-1.5 rounded-lg',
            accentColor === 'teal' ? 'bg-teal-100 dark:bg-teal-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
          )}>
            <Zap className={cn('w-4 h-4', accentColor === 'teal' ? 'text-teal-600' : 'text-amber-600')} />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Template Favorit</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">1 ketuk langsung masuk logbook</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            accentColor === 'teal'
              ? 'bg-teal-600 hover:bg-teal-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah
        </button>
      </div>

      {/* Template Cards — Horizontal Scroll */}
      {templates.length === 0 ? (
        <div
          onClick={() => setIsAddModalOpen(true)}
          className="flex flex-col items-center justify-center py-6 px-4 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-2xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
        >
          <Star className="w-8 h-8 text-neutral-300 dark:text-neutral-600 group-hover:text-blue-400 transition-colors mb-2" />
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Belum ada template
          </p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            Klik untuk tambah kegiatan rutin
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {templates.map(template => (
            <button
              key={template.id}
              onClick={() => handleUse(template.id)}
              disabled={usingId === template.id || deletingId === template.id}
              className={cn(
                'relative flex-shrink-0 w-40 p-3 rounded-2xl border text-left transition-all group',
                'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700',
                'hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {/* Emoji & Loading */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl leading-none">
                  {usingId === template.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  ) : (
                    template.emoji || '🏢'
                  )}
                </span>
                {/* Hapus tombol */}
                <button
                  onClick={(e) => handleDelete(e, template.id)}
                  disabled={deletingId === template.id}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                >
                  {deletingId === template.id ? (
                    <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                  ) : (
                    <Trash2 className="w-3 h-3 text-red-400" />
                  )}
                </button>
              </div>

              {/* Nama Template */}
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate mb-1">
                {template.nama}
              </p>

              {/* Deskripsi (truncated) */}
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed mb-2">
                {template.deskripsi}
              </p>

              {/* Kategori & Usage */}
              <div className="flex items-center justify-between">
                <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium', KATEGORI_COLORS[template.kategori || 'Umum'])}>
                  {template.kategori || 'Umum'}
                </span>
                {template.usageCount > 0 && (
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                    {template.usageCount}×
                  </span>
                )}
              </div>

              {/* Hover: Tap to add indicator */}
              <div className={cn(
                'absolute inset-0 rounded-2xl flex items-center justify-center',
                'opacity-0 group-hover:opacity-100 bg-blue-600/5 transition-opacity',
                usingId === template.id && 'opacity-100'
              )}>
                {usingId === template.id && (
                  <div className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Menambahkan...
                  </div>
                )}
              </div>
            </button>
          ))}

          {/* Tombol tambah di akhir carousel */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-shrink-0 w-16 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all text-neutral-400 hover:text-blue-500"
          >
            <Plus className="w-5 h-5" />
            <span className="text-[10px] font-medium">Tambah</span>
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
      />
    </>
  );
}
