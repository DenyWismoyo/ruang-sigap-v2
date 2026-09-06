"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  Trash2, 
  FileText, 
  Clock, 
  Send, 
  Trophy, 
  ArrowLeft,
  Database,
  Plus
} from 'lucide-react';
import { LogbookKegiatan, UserProfile } from '@/types';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToastContext } from '@/context/ToastContext';
import { getAktivitasSoloById } from '@/data/masterAktivitasSolo';

interface ParsedCandidateKegiatan {
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

interface SmartAiEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  selectedDate: Date;
  onSaveBatch: (kegiatanList: LogbookKegiatan[]) => Promise<void>;
  tenant?: 'sigap' | 'poros';
}

export function SmartAiEntryModal({
  isOpen,
  onClose,
  userProfile,
  selectedDate,
  onSaveBatch,
  tenant = 'sigap',
}: SmartAiEntryModalProps) {
  const { addToast } = useToastContext();
  const [activeTab, setActiveTab] = useState<string>("catatan");
  
  // State Input
  const [rawNotes, setRawNotes] = useState('');
  const [systemTraces, setSystemTraces] = useState<any[]>([]);
  const [isFetchingTraces, setIsFetchingTraces] = useState(false);

  // State Hasil Analisis AI
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedCandidates, setParsedCandidates] = useState<ParsedCandidateKegiatan[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setRawNotes('');
      setParsedCandidates([]);
      setSystemTraces([]);
      fetchTodaySystemTraces();
    }
  }, [isOpen]);

  const fetchTodaySystemTraces = async () => {
    if (!userProfile?.jabatanId) return;
    setIsFetchingTraces(true);
    try {
      const traces: any[] = [];
      const dateStr = selectedDate.toISOString().split('T')[0];

      // 1. Ambil disposisi yang dibuat oleh user ini
      try {
        const dispoQuery = query(
          collection(db, 'disposisi'),
          where('dariJabatanId', '==', userProfile.jabatanId)
        );
        const dispoSnap = await getDocs(dispoQuery);
        for (const docSnap of dispoSnap.docs) {
          const d = docSnap.data();
          let createdAtStr = '';
          if (d.createdAt && typeof d.createdAt.toDate === 'function') {
            createdAtStr = d.createdAt.toDate().toISOString().split('T')[0];
          }
          if (createdAtStr === dateStr) {
            // Ambil perihal surat
            let perihal = 'Surat Dinas';
            if (d.suratId) {
              const suratDoc = await getDoc(doc(db, 'surat', d.suratId));
              if (suratDoc.exists()) {
                perihal = suratDoc.data().perihal || perihal;
              }
            }
            traces.push({
              tipe: 'Disposisi Surat',
              deskripsi: `Mendisposisikan naskah surat dinas: "${perihal}". Instruksi: ${d.instruksi || 'Tindak lanjuti'}`,
              perihal,
              waktu: d.createdAt?.toDate ? d.createdAt.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '08:30'
            });
          }
        }
      } catch (e) {
        console.warn("[SmartAiEntry] Error fetching disposisi traces:", e);
      }

      // 2. Ambil laporan tindak lanjut yang diselesaikan hari ini
      try {
        const tlQuery = query(
          collection(db, 'laporanTindakLanjut'),
          where('userId', '==', userProfile.uid)
        );
        const tlSnap = await getDocs(tlQuery);
        tlSnap.forEach(docSnap => {
          const tl = docSnap.data();
          if (tl.tanggalSelesai && tl.tanggalSelesai.startsWith(dateStr)) {
            traces.push({
              tipe: 'Laporan Tindak Lanjut',
              deskripsi: `Menyelesaikan laporan tindak lanjut: ${tl.hasilTindakan?.substring(0, 100) || 'Pelaksanaan disposisi'}`,
              waktu: '11:00'
            });
          }
        });
      } catch (e) {
        console.warn("[SmartAiEntry] Error fetching tindak lanjut traces:", e);
      }

      // 3. Ambil tugas per pengguna yang selesai
      try {
        const tugasQuery = query(
          collection(db, 'tugasPerPengguna', userProfile.uid, 'tugas'),
          where('status', '==', 'Selesai')
        );
        const tugasSnap = await getDocs(tugasQuery);
        tugasSnap.forEach(docSnap => {
          const t = docSnap.data();
          traces.push({
            tipe: 'Tugas Selesai',
            deskripsi: `Menyelesaikan penugasan: "${t.judulTugas}"`,
            waktu: '14:00'
          });
        });
      } catch (e) {
        console.warn("[SmartAiEntry] Error fetching tugas traces:", e);
      }

      setSystemTraces(traces);
    } catch (err) {
      console.error("[SmartAiEntry] Gagal menarik jejak sistem:", err);
    } finally {
      setIsFetchingTraces(false);
    }
  };

  const handleAnalyzeAI = async (useTracesOnly = false) => {
    if (!useTracesOnly && !rawNotes.trim()) {
      addToast('Tuliskan catatan kegiatan harian Anda terlebih dahulu.', 'info');
      return;
    }

    if (useTracesOnly && systemTraces.length === 0) {
      addToast('Tidak ditemukan jejak aktivitas digital pada tanggal ini.', 'info');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/ai/parse-kegiatan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawNotes: useTracesOnly ? '' : rawNotes,
          systemTraces: useTracesOnly ? systemTraces : (systemTraces.length > 0 ? systemTraces : undefined),
          userNama: userProfile?.namaLengkap,
          userJabatan: userProfile?.jabatanId,
          tanggalStr: selectedDate.toISOString().split('T')[0]
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal menganalisis catatan.');
      }

      const data = await response.json();
      if (Array.isArray(data.kegiatanList) && data.kegiatanList.length > 0) {
        setParsedCandidates(data.kegiatanList);
        addToast(`Berhasil memecah menjadi ${data.kegiatanList.length} butir kegiatan mandiri!`, 'success');
      } else {
        throw new Error('AI tidak menemukan butir kegiatan yang valid.');
      }
    } catch (err: any) {
      console.error("[SmartAiEntry] Error analyzing:", err);
      addToast(err.message || 'Gagal memproses dengan AI.', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleSelect = (index: number) => {
    setParsedCandidates(prev => prev.map((item, idx) => 
      idx === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const handleUpdateItem = (index: number, field: keyof ParsedCandidateKegiatan, value: any) => {
    setParsedCandidates(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === 'waktuMulai' || field === 'waktuSelesai') {
        const [sh, sm] = (field === 'waktuMulai' ? value : item.waktuMulai).split(':').map(Number);
        const [eh, em] = (field === 'waktuSelesai' ? value : item.waktuSelesai).split(':').map(Number);
        if (!isNaN(sh) && !isNaN(eh)) {
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          updated.durasiMenit = diff > 0 ? diff : 60;
        }
      }
      return updated;
    }));
  };

  const handleDeleteItem = (index: number) => {
    setParsedCandidates(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleSaveToLogbook = async () => {
    const selectedItems = parsedCandidates.filter(item => item.selected && item.deskripsi.trim());
    if (selectedItems.length === 0) {
      addToast('Pilih setidaknya 1 kegiatan untuk disimpan ke logbook.', 'info');
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const entriesToSave: LogbookKegiatan[] = selectedItems.map((item, idx) => ({
        id: `${now.getTime()}_${idx}`,
        deskripsi: item.deskripsi.trim(),
        selesai: true,
        kategori: (item.kategori as any) || 'Umum',
        waktuMulai: item.waktuMulai,
        waktuSelesai: item.waktuSelesai,
        createdAt: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), parseInt(item.waktuMulai.split(':')[0] || '8', 10), parseInt(item.waktuMulai.split(':')[1] || '0', 10)).toISOString(),
        aktivitasId: item.aktivitasId,
        aktivitasNama: item.aktivitasNama,
      }));

      await onSaveBatch(entriesToSave);
      addToast(`Berhasil menyimpan ${entriesToSave.length} kegiatan ke logbook!`, 'success');
      onClose();
    } catch (err) {
      console.error("[SmartAiEntry] Gagal menyimpan batch logbook:", err);
      addToast('Terjadi kesalahan saat menyimpan ke logbook.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Kalkulasi total poin & jam dari kandidat yang dicentang
  const selectedMetrics = parsedCandidates
    .filter(i => i.selected)
    .reduce((acc, curr) => ({
      poin: acc.poin + (curr.nilaiPoin || 0),
      menit: acc.menit + (curr.durasiMenit || 60),
      count: acc.count + 1
    }), { poin: 0, menit: 0, count: 0 });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <span className="p-1.5 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-sm">
                <Sparkles size={18} />
              </span>
              <span>AI Smart Entry — Pecah Kegiatan Terperinci</span>
            </DialogTitle>
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
              Kepwal 786/154/2020
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            AI memecah catatan atau jejak hari ini menjadi butir kegiatan mandiri berbobot poin tinggi (tanpa merangkum).
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {parsedCandidates.length === 0 ? (
            /* TAHAP 1: INPUT CATATAN ATAU JEJAK SISTEM */
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="catatan" className="text-xs">
                  <FileText size={13} className="mr-1.5" /> Dikte / Catatan Bebas
                </TabsTrigger>
                <TabsTrigger value="jejak" className="text-xs">
                  <Database size={13} className="mr-1.5" /> Jejak Digital Hari Ini ({systemTraces.length})
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: CATATAN BEBAS */}
              <TabsContent value="catatan" className="space-y-3 pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ai-notes" className="text-xs font-semibold text-foreground/80">
                    Tuliskan Catatan Kerja Hari Ini Secara Bebas
                  </Label>
                  <Textarea
                    id="ai-notes"
                    rows={5}
                    value={rawNotes}
                    onChange={e => setRawNotes(e.target.value)}
                    placeholder="Contoh: Pagi verifikasi 5 berkas izin, jam 10 rapat koordinasi dengan Bappeda soal data, siang jam 1 sampai 2 nyusun konsep nota dinas, sore arsipkan berkas surat..."
                    className="text-sm font-medium leading-relaxed bg-background"
                    autoFocus
                  />
                </div>

                {/* Quick Suggestion Pills */}
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Contoh Cepat (Klik untuk menyisipkan):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Mempelajari surat masuk dan mendisposisikan ke staf",
                      "Mengikuti rapat koordinasi teknis dinas",
                      "Membuat laporan hasil evaluasi kegiatan",
                      "Memeriksa berkas permohonan layanan",
                      "Mengarsipkan dokumen naskah dinas"
                    ].map(sample => (
                      <Badge
                        key={sample}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary/10 text-[11px] font-normal py-0.5"
                        onClick={() => setRawNotes(prev => prev ? `${prev}, lalu ${sample.toLowerCase()}` : sample)}
                      >
                        + {sample}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={() => handleAnalyzeAI(false)}
                    disabled={isAnalyzing || !rawNotes.trim()}
                    className="w-full gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold"
                  >
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-amber-200" />}
                    ✨ Analisis & Pecah Menjadi Kegiatan Mandiri
                  </Button>
                </div>
              </TabsContent>

              {/* TAB 2: TARIK JEJAK SISTEM */}
              <TabsContent value="jejak" className="space-y-3 pt-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground/80">
                      Jejak Aksi Terdeteksi pada {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchTodaySystemTraces}
                      disabled={isFetchingTraces}
                      className="h-6 text-xs text-primary"
                    >
                      {isFetchingTraces ? 'Memindai...' : 'Muat Ulang'}
                    </Button>
                  </div>

                  {isFetchingTraces ? (
                    <div className="p-8 text-center text-muted-foreground text-xs">
                      <Loader2 size={20} className="animate-spin mx-auto mb-2 text-primary" />
                      Memindai data disposisi, tindak lanjut, dan tugas...
                    </div>
                  ) : systemTraces.length === 0 ? (
                    <div className="p-6 text-center border rounded-lg bg-muted/20 border-dashed text-xs text-muted-foreground">
                      Belum ada jejak disposisi atau tugas yang tercatat pada tanggal ini.
                      <p className="mt-1">Gunakan Tab "Dikte / Catatan Bebas" untuk mengetik aktivitas Anda.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {systemTraces.map((trace, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg border border-border/80 bg-muted/30 text-xs flex items-start gap-2">
                          <span className="font-semibold text-primary shrink-0">🕒 {trace.waktu}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-foreground">{trace.tipe}:</span> {trace.deskripsi}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {systemTraces.length > 0 && (
                  <Button
                    onClick={() => handleAnalyzeAI(true)}
                    disabled={isAnalyzing}
                    className="w-full gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold mt-2"
                  >
                    {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-amber-200" />}
                    ✨ Konversi Jejak Digital Jadi Entri Kegiatan Berpoin
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            /* TAHAP 2: REVIEW CHECKLIST KEGIATAN YANG SUDAH DIPECAH */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setParsedCandidates([])}
                    className="h-7 text-xs text-muted-foreground hover:text-foreground -ml-2"
                  >
                    <ArrowLeft size={13} className="mr-1" /> Input Ulang
                  </Button>
                  <span className="text-xs font-semibold text-foreground">
                    Ditemukan {parsedCandidates.length} Kegiatan Terpisah:
                  </span>
                </div>

                <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  Total: +{selectedMetrics.poin} Poin ({((selectedMetrics.menit)/60).toFixed(1)} Jam)
                </div>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {parsedCandidates.map((item, idx) => (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-lg border transition-colors ${
                      item.selected 
                        ? 'border-primary/40 bg-primary/5 dark:bg-primary/10' 
                        : 'border-border/60 bg-muted/20 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => handleToggleSelect(idx)}
                        className="mt-1 shrink-0"
                      />

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-muted-foreground">
                              #{idx + 1}
                            </span>
                            {item.aktivitasNama && (
                              <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200">
                                ⭐ {item.aktivitasNama}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50">
                              +{item.nilaiPoin} Poin
                            </Badge>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(idx)}
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            title="Hapus kegiatan ini"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>

                        {/* Deskripsi Kegiatan */}
                        <Textarea
                          value={item.deskripsi}
                          onChange={e => handleUpdateItem(idx, 'deskripsi', e.target.value)}
                          rows={2}
                          className="text-xs bg-background leading-relaxed"
                        />

                        {/* Jam Mulai & Selesai */}
                        <div className="flex items-center gap-3 pt-0.5">
                          <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-muted-foreground shrink-0" />
                            <Input
                              type="time"
                              value={item.waktuMulai}
                              onChange={e => handleUpdateItem(idx, 'waktuMulai', e.target.value)}
                              className="h-7 text-xs w-20 px-1 text-center bg-background"
                            />
                            <span className="text-xs text-muted-foreground">-</span>
                            <Input
                              type="time"
                              value={item.waktuSelesai}
                              onChange={e => handleUpdateItem(idx, 'waktuSelesai', e.target.value)}
                              className="h-7 text-xs w-20 px-1 text-center bg-background"
                            />
                          </div>

                          <span className="text-[11px] text-muted-foreground">
                            ({item.durasiMenit} menit)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {parsedCandidates.length > 0 && (
          <DialogFooter className="p-4 border-t border-border bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground text-center sm:text-left">
              <span>{selectedMetrics.count} dari {parsedCandidates.length} kegiatan terpilih</span>
              <span className="font-bold text-foreground ml-2">Total: +{selectedMetrics.poin} Poin</span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setParsedCandidates([])}
                className="w-full sm:w-auto text-xs"
              >
                Ulangi
              </Button>
              <Button
                size="sm"
                onClick={handleSaveToLogbook}
                disabled={isSaving || selectedMetrics.count === 0}
                className="w-full sm:w-auto gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Simpan Terpilih ke Logbook (+{selectedMetrics.poin}p)
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
