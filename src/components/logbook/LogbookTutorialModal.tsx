"use client";

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Smartphone,
  Laptop,
  Sparkles,
  Zap,
} from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PANDUAN_LOGBOOK_MARKDOWN } from '@/data/panduanLogbookContent';

interface LogbookTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant?: 'sigap' | 'poros';
}

const CHAPTERS = [
  { id: 'semua', label: '📖 Semua Bab' },
  { id: 'bab-1', label: '1. Pengenalan' },
  { id: 'bab-2', label: '2. Kamus Kepwal' },
  { id: 'bab-3', label: '3. Asisten AI' },
  { id: 'bab-4', label: '4. Target 8.400' },
  { id: 'bab-5', label: '5. Rekap PDF' },
  { id: 'bab-6', label: '6. e-Kinerja Bridge' },
  { id: 'bab-7', label: '7. Google Drive' },
  { id: 'bab-8', label: '8. Tanya Jawab (FAQ)' },
];

export const LogbookTutorialModal: React.FC<LogbookTutorialModalProps> = ({
  isOpen,
  onClose,
  tenant = 'sigap',
}) => {
  const [activeChapter, setActiveChapter] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const isPoros = tenant === 'poros';
  const primaryBg = isPoros ? 'bg-teal-600 hover:bg-teal-700' : 'bg-blue-600 hover:bg-blue-700';
  const accentColor = isPoros ? 'text-teal-600 dark:text-teal-400' : 'text-blue-600 dark:text-blue-400';

  // Filter content berdasarkan bab atau pencarian
  const displayedMarkdown = useMemo(() => {
    let content = PANDUAN_LOGBOOK_MARKDOWN;

    if (activeChapter !== 'semua') {
      const chapterNum = activeChapter.replace('bab-', '');
      const pattern = new RegExp(`(## BAB ${chapterNum}:[\\s\\S]*?)(?=## BAB |$)`, 'i');
      const match = content.match(pattern);
      if (match) {
        content = match[1];
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const lines = content.split('\n');
      const matchedBlocks: string[] = [];
      let currentSection = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('## ') || line.startsWith('### ')) {
          currentSection = line;
        }
        if (line.toLowerCase().includes(q)) {
          if (currentSection && !matchedBlocks.includes(currentSection)) {
            matchedBlocks.push(currentSection);
          }
          matchedBlocks.push(line);
        }
      }

      if (matchedBlocks.length > 0) {
        return `### 🔍 Hasil Pencarian: "${searchQuery}"\n\n` + matchedBlocks.join('\n\n');
      } else {
        return `### 🔍 Hasil Pencarian: "${searchQuery}"\n\n*Tidak ditemukan bagian yang cocok dengan kata kunci tersebut. Coba kata kunci lain seperti "bookmarklet", "ekstensi", "rekap", atau "poin".*`;
      }
    }

    return content;
  }, [activeChapter, searchQuery]);

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(PANDUAN_LOGBOOK_MARKDOWN);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn("Gagal menyalin markdown:", e);
    }
  };

  const handleDownloadFile = () => {
    const blob = new Blob([PANDUAN_LOGBOOK_MARKDOWN], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PANDUAN_LOGBOOK_DAN_EKINERJA_SOLO.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl border-border bg-card">
        {/* Header Dialog */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/20 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl text-white shadow-sm ${primaryBg}`}>
                <BookOpen size={22} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Buku Panduan Logbook &amp; e-Kinerja
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    Kepwal 786/154
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Pedoman resmi pengisian kegiatan harian, otomasi ekstensi, &amp; bookmarklet ponsel ASN Surakarta.
                </DialogDescription>
              </div>
            </div>

            {/* Tombol Aksi Cepat (Unduh & Salin) */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyMarkdown}
                className="text-xs h-8"
                title="Salin seluruh isi panduan ke clipboard"
              >
                {copied ? (
                  <>
                    <Check size={14} className="mr-1.5 text-green-600" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1.5" /> Salin .MD
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadFile}
                className="text-xs h-8 border-primary/30 text-primary hover:bg-primary/10"
                title="Unduh file PANDUAN_LOGBOOK_DAN_EKINERJA_SOLO.md ke perangkat"
              >
                <Download size={14} className="mr-1.5" /> Unduh .MD
              </Button>
            </div>
          </div>

          {/* Quick Highlight Banners */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4 pt-2 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/40 text-blue-900 dark:text-blue-200">
              <Laptop size={14} className="text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate"><strong>PC / Laptop:</strong> Ekstensi Zero-Click</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200">
              <Smartphone size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate"><strong>Ponsel HP:</strong> Bookmarklet 1-Klik</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-amber-900 dark:text-amber-200">
              <Sparkles size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate"><strong>Target TPP:</strong> 8.400 Menit (140 Jam)</span>
            </div>
          </div>

          {/* Search & Chapter Bar */}
          <div className="mt-3 flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full sm:w-64 shrink-0">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari topik (cth: bookmarklet, poin)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs bg-card"
              />
            </div>

            {/* Chapter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
              {CHAPTERS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setActiveChapter(ch.id);
                    setSearchQuery('');
                  }}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border ${
                    activeChapter === ch.id && !searchQuery
                      ? 'bg-foreground text-background border-foreground shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Markdown Reading Area */}
        <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
          <article className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 space-y-3 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayedMarkdown}
            </ReactMarkdown>
          </article>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Berkas tersimpan di:</span>
            <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono text-foreground">
              /docs/PANDUAN_LOGBOOK_DAN_EKINERJA.md
            </code>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadFile}
              className="text-xs"
            >
              <Download size={13} className="mr-1.5" /> Unduh Dokumen
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className={`text-xs text-white ${primaryBg}`}
            >
              Tutup Panduan
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
