// src/components/logbook/VoiceLogbookModal.tsx
// Modal Dikte Suara Instan (Voice-to-Logbook) berbasis Web Speech API dan pemrosesan Gemini 3.5 Flash-Lite

'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  CheckCircle2,
  Trash2,
  Clock,
  ArrowRight,
  Volume2,
  Trophy,
} from 'lucide-react';
import { LogbookKegiatan, UserProfile } from '@/types';
import { useToastContext } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import { getAktivitasSoloById } from '@/data/masterAktivitasSolo';

interface ParsedVoiceKegiatan {
  id: string;
  deskripsi: string;
  waktuMulai: string;
  waktuSelesai: string;
  durasiMenit: number;
  kategori: string;
  aktivitasId?: number;
  aktivitasNama?: string;
  nilaiPoin: number;
  selected: boolean;
}

interface VoiceLogbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  selectedDate: Date;
  onSaveBatch: (kegiatanList: LogbookKegiatan[]) => Promise<void>;
  tenant?: 'sigap' | 'poros';
}

export function VoiceLogbookModal({
  isOpen,
  onClose,
  userProfile,
  selectedDate,
  onSaveBatch,
  tenant = 'sigap',
}: VoiceLogbookModalProps) {
  const { addToast } = useToastContext();
  const isPoros = tenant === 'poros';

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [candidates, setCandidates] = useState<ParsedVoiceKegiatan[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Inisialisasi Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'id-ID';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setTranscript(currentTranscript.trim());
        };

        recognition.onerror = (event: any) => {
          console.warn('[Voice Logbook] Speech error:', event.error);
          setIsRecording(false);
          if (event.error === 'not-allowed') {
            addToast('Harap izinkan akses mikrofon di browser Anda untuk menggunakan fitur dikte.', 'error');
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [addToast]);

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setCandidates([]);
      setIsRecording(false);
      setIsAnalyzing(false);
      setIsSaving(false);
    } else {
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }
    }
  }, [isOpen]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      addToast('Browser Anda belum mendukung Web Speech API. Anda dapat mengetik teks langsung di area input.', 'info');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('[Voice Logbook] Start error:', err);
      }
    }
  };

  // Proses teks transkrip dengan Gemini 3.5 Flash-Lite
  const handleAnalyzeWithAI = async () => {
    if (!transcript.trim()) {
      addToast('Silakan berbicara atau ketik catatan pekerjaan Anda terlebih dahulu.', 'info');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/parse-kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes: transcript,
          userNama: userProfile?.namaLengkap,
          userJabatan: userProfile?.namaJabatan,
          tanggalStr: selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal menganalisis dikte suara dengan AI.');
      }

      if (Array.isArray(data.kegiatanList) && data.kegiatanList.length > 0) {
        setCandidates(data.kegiatanList);
        addToast(`AI berhasil memecah suara menjadi ${data.kegiatanList.length} butir kegiatan resmi Kepwal.`, 'success');
      } else {
        throw new Error('AI tidak menemukan butir kegiatan spesifik dari rekaman.');
      }
    } catch (err: any) {
      console.error('[Voice Logbook] Error:', err);
      addToast(err.message || 'Terjadi kesalahan sistem AI.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simpan kegiatan yang dipilih ke logbook
  const handleSaveBatch = async () => {
    const selected = candidates.filter((c) => c.selected);
    if (selected.length === 0) {
      addToast('Pilih minimal satu butir kegiatan untuk disimpan ke logbook.', 'info');
      return;
    }

    setIsSaving(true);
    try {
      const itemsToSave: LogbookKegiatan[] = selected.map((c) => ({
        id: `keg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        deskripsi: c.deskripsi,
        waktuMulai: c.waktuMulai,
        waktuSelesai: c.waktuSelesai,
        kategori: c.kategori as any,
        aktivitasId: c.aktivitasId,
        aktivitasNama: c.aktivitasNama,
        selesai: true,
        sumber: 'manual',
      }));

      await onSaveBatch(itemsToSave);
      addToast(`${itemsToSave.length} kegiatan berhasil dicatat ke logbook!`, 'success');
      onClose();
    } catch (err: any) {
      console.error('[Voice Logbook] Save batch error:', err);
      addToast(err.message || 'Terjadi kesalahan saat menyimpan ke logbook.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelectCandidate = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-border bg-card">
        <DialogHeader className="p-4 sm:p-5 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
              isPoros ? "bg-teal-500/20 text-teal-400" : "bg-blue-500/20 text-blue-500"
            )}>
              <Mic className="w-4 h-4" />
            </div>
            <span>Dikte Suara Kegiatan (Voice-to-Logbook)</span>
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Bicara santai tentang pekerjaan Anda hari ini, AI Gemini 3.5 Flash-Lite akan merapikan dan memecahnya menjadi format Kepwal Solo.
          </p>
        </DialogHeader>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {candidates.length === 0 ? (
            /* Area Rekaman & Transkrip */
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-muted/30 border border-border text-center">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 relative group",
                    isRecording
                      ? "bg-red-600 text-white animate-pulse ring-8 ring-red-500/20"
                      : isPoros
                        ? "bg-teal-600 hover:bg-teal-500 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                  )}
                >
                  {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                </button>

                <p className="text-xs font-bold text-foreground mt-3">
                  {isRecording ? 'Mendengarkan... Silakan bicara bebas' : 'Ketuk mikrofon untuk mulai berbicara'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Contoh: &quot;Jam 8 sampai 10 koordinasi di Bappeda, lalu jam 11 bikin laporan evaluasi triwulan.&quot;
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground flex items-center justify-between mb-1.5">
                  <span>Transkrip Suara / Catatan:</span>
                  {transcript && (
                    <button
                      type="button"
                      onClick={() => setTranscript('')}
                      className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Hapus Teks
                    </button>
                  )}
                </label>
                <Textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={4}
                  placeholder="Hasil rekaman suara akan muncul di sini secara otomatis. Anda juga dapat mengetik atau mengedit teks ini langsung..."
                  className="text-xs resize-none rounded-xl"
                />
              </div>
            </div>
          ) : (
            /* Area Hasil Analisis AI */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  Hasil Pecahan Kegiatan ({candidates.length} butir)
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCandidates([])}
                  className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                >
                  ← Rekam Ulang
                </Button>
              </div>

              <div className="space-y-2">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => toggleSelectCandidate(c.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer text-xs",
                      c.selected
                        ? isPoros
                          ? "bg-teal-500/10 border-teal-500/40 shadow-xs"
                          : "bg-blue-500/10 border-blue-500/40 shadow-xs"
                        : "bg-muted/30 border-border opacity-70"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        checked={c.selected}
                        onCheckedChange={() => toggleSelectCandidate(c.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="font-mono text-[11px] font-bold text-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {c.waktuMulai} - {c.waktuSelesai}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            {c.kategori}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold py-0 px-1.5">
                            +{c.nilaiPoin} Poin
                          </Badge>
                        </div>
                        <p className="font-semibold text-foreground">{c.deskripsi}</p>
                        {c.aktivitasNama && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            🏷️ Kepwal: {c.aktivitasNama}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-4 sm:p-5 border-t border-border flex sm:justify-between items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs"
          >
            Tutup
          </Button>

          {candidates.length === 0 ? (
            <Button
              type="button"
              size="sm"
              disabled={isAnalyzing || !transcript.trim()}
              onClick={handleAnalyzeWithAI}
              className={cn(
                "rounded-xl text-xs font-bold shadow-md gap-1.5",
                isPoros ? "bg-teal-600 hover:bg-teal-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menganalisis Dikte...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Proses dengan AI (Gemini Flash-Lite)</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={isSaving || candidates.filter((c) => c.selected).length === 0}
              onClick={handleSaveBatch}
              className={cn(
                "rounded-xl text-xs font-bold shadow-md gap-1.5",
                isPoros ? "bg-teal-600 hover:bg-teal-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan ke Logbook...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan ke Logbook ({candidates.filter((c) => c.selected).length})</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
