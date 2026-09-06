"use client";

import React, { useState, useMemo } from 'react';
import { UserProfile, LogbookHarian, LogbookKegiatan, RencanaHasilKerjaBkn } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  FolderPlus, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Send, 
  Settings2, 
  Calendar,
  AlertCircle,
  RefreshCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BknEvidenceExporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  logbookHistory: LogbookHarian[];
  tenant?: 'sigap' | 'poros';
  onOpenRhkManager: () => void;
}

interface SynthesisResult {
  rencanaAksi: string;
  targetAksi: string;
  namaEviden: string;
  realisasiKuantitas: string;
  realisasiKualitas: string;
  realisasiWaktu: string;
  sumberData: string;
  ringkasanEksekutif: string;
}

export const BknEvidenceExporterModal: React.FC<BknEvidenceExporterModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  logbookHistory = [],
  tenant = 'sigap',
  onOpenRhkManager
}) => {
  const isSigap = tenant === 'sigap';

  // Palette Tokens
  const themePrimary = isSigap ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white';
  const themeText = isSigap ? 'text-blue-600' : 'text-teal-600';
  const themeBorder = isSigap ? 'border-blue-500' : 'border-teal-500';
  const themeBgLight = isSigap ? 'bg-blue-50/70 border-blue-200' : 'bg-teal-50/70 border-teal-200';

  const [selectedTriwulan, setSelectedTriwulan] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL'>('Q1');
  const [selectedTahun, setSelectedTahun] = useState<number>(new Date().getFullYear());
  const [activeRhkId, setActiveRhkId] = useState<string | null>(null);

  // AI Synthesis State map: rhkId -> SynthesisResult
  const [synthesisMap, setSynthesisMap] = useState<Record<string, SynthesisResult>>({});
  const [loadingAiMap, setLoadingAiMap] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bridgeSentKey, setBridgeSentKey] = useState<string | null>(null);

  const triwulanOptions = [
    { id: 'Q1', label: 'Triwulan I (Jan – Mar)', startMonth: 0, endMonth: 2 },
    { id: 'Q2', label: 'Triwulan II (Apr – Jun)', startMonth: 3, endMonth: 5 },
    { id: 'Q3', label: 'Triwulan III (Jul – Sep)', startMonth: 6, endMonth: 8 },
    { id: 'Q4', label: 'Triwulan IV (Okt – Des)', startMonth: 9, endMonth: 11 },
    { id: 'ALL', label: 'Tahunan (Jan – Des)', startMonth: 0, endMonth: 11 }
  ];

  const currentOption = triwulanOptions.find(o => o.id === selectedTriwulan) || triwulanOptions[0];

  // Filter activities within the selected quarter
  const quarterActivities = useMemo(() => {
    const list: { kegiatan: LogbookKegiatan; dateStr: string; timestamp: Date }[] = [];

    (logbookHistory || []).forEach(day => {
      if (!day.tanggal) return;
      const rawTgl = day.tanggal as any;
      const date: Date = typeof rawTgl?.toDate === 'function'
        ? rawTgl.toDate()
        : (rawTgl?.seconds ? new Date(rawTgl.seconds * 1000) : new Date(rawTgl));
      const m = date.getMonth();
      const y = date.getFullYear();

      if (y === selectedTahun && m >= currentOption.startMonth && m <= currentOption.endMonth) {
        const dStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        (day.kegiatan || []).forEach(k => {
          list.push({ kegiatan: k, dateStr: dStr, timestamp: date });
        });
      }
    });

    return list;
  }, [logbookHistory, selectedTriwulan, selectedTahun, currentOption]);

  const rhkList: RencanaHasilKerjaBkn[] = userProfile?.rhkBknList || [];

  // Group activities by rhkId
  const groupedByRhk = useMemo(() => {
    const map = new Map<string, { kegiatan: LogbookKegiatan; dateStr: string }[]>();

    // initialize for all defined RHKs
    rhkList.forEach(r => map.set(r.id, []));
    map.set('uncategorized', []);

    quarterActivities.forEach(item => {
      const rId = item.kegiatan.rhkId;
      if (rId && map.has(rId)) {
        map.get(rId)!.push(item);
      } else {
        map.get('uncategorized')!.push(item);
      }
    });

    return map;
  }, [rhkList, quarterActivities]);

  const handleCopyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch (e) {
      console.warn("Gagal copy clipboard:", e);
    }
  };

  const handleRunAiSynthesis = async (rhk: RencanaHasilKerjaBkn) => {
    const activities = (groupedByRhk.get(rhk.id) || []).map(i => i.kegiatan);

    setLoadingAiMap(prev => ({ ...prev, [rhk.id]: true }));
    try {
      const res = await fetch('/api/ai/bkn-synthesizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rhkItem: rhk,
          kegiatanList: activities,
          periode: currentOption.label,
          userNama: userProfile?.namaLengkap || 'Pegawai ASN',
          userJabatan: userProfile?.namaJabatan || 'Aparatur Sipil Negara'
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal memanggil AI Synthesizer');
      }

      const data: SynthesisResult = await res.json();
      setSynthesisMap(prev => ({ ...prev, [rhk.id]: data }));
    } catch (error: any) {
      console.error("Gagal sintesis AI:", error);
      alert(`Gagal menjalankan AI: ${error.message}`);
    } finally {
      setLoadingAiMap(prev => ({ ...prev, [rhk.id]: false }));
    }
  };

  const handleSendToExtension = (type: 'RENCANA_AKSI' | 'EVIDEN_REALISASI', rhk: RencanaHasilKerjaBkn) => {
    const synth = synthesisMap[rhk.id];
    const defaultDriveUrl = rhk.googleDriveFolderUrl || userProfile?.googleDriveReportLink || '';

    const payload = {
      type: 'SIGAP_BRIDGE_SEND_BKN',
      actionType: type,
      rhkId: rhk.id,
      rhkNama: rhk.rencanaHasilKerja,
      rencanaAksi: synth?.rencanaAksi || rhk.rencanaAksiDefault || `Pelaksanaan ${rhk.rencanaHasilKerja}`,
      targetAksi: synth?.targetAksi || rhk.targetDefault || '1 Laporan',
      namaEviden: synth?.namaEviden || `Dokumen Bukti ${rhk.rencanaHasilKerja}`,
      linkEviden: defaultDriveUrl,
      realisasi: synth?.realisasiKuantitas || `${rhk.aspekKuantitas?.target || '1 Laporan'} telah diselesaikan sesuai target berdasarkan bukti terlampir.`,
      sumberData: synth?.sumberData || 'Aplikasi Tata Kelola E-Office RUANG SIGAP'
    };

    // Post to window for extension content-sigap.js
    window.postMessage(payload, '*');
    setBridgeSentKey(`${rhk.id}-${type}`);
    setTimeout(() => setBridgeSentKey(null), 3000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader className="border-b pb-3 border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className={cn("p-2 rounded-xl flex items-center justify-center text-white", isSigap ? "bg-blue-600 shadow-blue-500/20 shadow-md" : "bg-teal-600 shadow-teal-500/20 shadow-md")}>
                <Target className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  Eksportir Eviden & Rencana Aksi e-Kinerja BKN
                  <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", themeText)}>
                    PermenPANRB 6/2022
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Otomasi sintesis Rencana Aksi, Target, dan narasi Realisasi dari kumpulan logbook harian untuk portal <span className="font-semibold text-blue-600">kinerja.bkn.go.id</span>.
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenRhkManager}
              className="text-xs h-8 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Settings2 className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Kelola RHK ({rhkList.length})
            </Button>
          </div>
        </DialogHeader>

        {/* Filter Bar: Periode & Tahun */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 py-2.5 px-3 bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Periode Evaluasi:
            </span>
            <div className="flex flex-wrap gap-1">
              {triwulanOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedTriwulan(opt.id as any)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                    selectedTriwulan === opt.id
                      ? (isSigap ? "bg-blue-600 text-white shadow-sm" : "bg-teal-600 text-white shadow-sm")
                      : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Tahun:</span>
            <Input 
              type="number" 
              value={selectedTahun} 
              onChange={(e) => setSelectedTahun(Number(e.target.value))}
              className="w-20 h-7 text-xs bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        {/* Informative Alert for Portal BKN 2-Stage Flow */}
        <div className={cn("p-3 rounded-xl border flex items-start gap-2.5 text-xs", themeBgLight)}>
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 dark:text-slate-100">
              Alur 2-Tahap Resmi Portal e-Kinerja BKN:
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong className="text-blue-700 dark:text-blue-400">1. Tahap Rencana Aksi:</strong> Isi kalimat Rencana Aksi & Target di menu <code className="text-[10px] bg-white dark:bg-slate-800 px-1 py-0.5 rounded">/rencana_aksi</code> terlebih dahulu. <br />
              <strong className="text-emerald-700 dark:text-emerald-400">2. Tahap Bukti Dukung:</strong> Masuk ke tab Hasil Kerja, isi Nama Eviden + Link Google Drive, lalu klik Edit Realisasi untuk memasukkan narasi capaian.
            </p>
          </div>
        </div>

        {/* Content Section: RHK Cards */}
        <div className="space-y-4 py-2">
          {rhkList.length === 0 ? (
            <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Target className="w-10 h-10 mx-auto text-slate-400 mb-2" />
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum Ada RHK yang Dikonfigurasi</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Tambahkan RHK tahunan Anda terlebih dahulu agar sistem dapat mengelompokkan kegiatan logbook secara otomatis.
              </p>
              <Button type="button" size="sm" onClick={onOpenRhkManager} className={themePrimary}>
                <Settings2 className="w-4 h-4 mr-1.5" />
                Buka Pengaturan RHK
              </Button>
            </div>
          ) : (
            rhkList.map((rhk, idx) => {
              const activities = groupedByRhk.get(rhk.id) || [];
              const synth = synthesisMap[rhk.id];
              const isLoadingAi = loadingAiMap[rhk.id];
              const driveUrl = rhk.googleDriveFolderUrl || userProfile?.googleDriveReportLink || '';

              return (
                <div 
                  key={rhk.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-semibold bg-blue-50 text-blue-700 border-blue-200">
                          {rhk.klasifikasi}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                          {rhk.jenis}
                        </Badge>
                        <span className="text-[11px] text-slate-500 font-medium">
                          • {activities.length} Kegiatan Tercatat
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                        {rhk.rencanaHasilKerja}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isLoadingAi}
                        onClick={() => handleRunAiSynthesis(rhk)}
                        className={cn("text-xs font-semibold h-8 rounded-lg shadow-sm", themePrimary)}
                      >
                        {isLoadingAi ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            Menganalisis...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                            {synth ? 'Sintesis Ulang (AI)' : 'Sintesis Data (AI)'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3.5 sm:p-4 space-y-3.5 text-xs">
                    {/* Ringkasan Eksekutif AI jika sudah ada */}
                    {synth?.ringkasanEksekutif && (
                      <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-[11px] text-amber-900 dark:text-amber-200">
                        <span className="font-bold flex items-center gap-1 mb-0.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          Ringkasan Eksekutif Capaian:
                        </span>
                        {synth.ringkasanEksekutif}
                      </div>
                    )}

                    {/* DUA TAHAP BKN CONTAINER */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {/* BLOK TAHAP 1: RENCANA AKSI */}
                      <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-blue-100 dark:border-blue-900/50">
                          <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 text-xs">
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                            Tahap 1: Rencana Aksi
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-blue-700 hover:text-blue-800 hover:bg-blue-100/70"
                            onClick={() => handleSendToExtension('RENCANA_AKSI', rhk)}
                          >
                            {bridgeSentKey === `${rhk.id}-RENCANA_AKSI` ? (
                              <span className="flex items-center text-emerald-600 font-bold"><Check className="w-3 h-3 mr-1" /> Terkirim</span>
                            ) : (
                              <span className="flex items-center"><Send className="w-3 h-3 mr-1" /> Kirim ke Tab BKN</span>
                            )}
                          </Button>
                        </div>

                        <div>
                          <Label className="text-[10px] font-semibold text-slate-500 uppercase">Rencana Aksi</Label>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Input 
                              readOnly 
                              value={synth?.rencanaAksi || rhk.rencanaAksiDefault || `Pelaksanaan ${rhk.rencanaHasilKerja}`} 
                              className="h-7 text-xs bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleCopyText(synth?.rencanaAksi || rhk.rencanaAksiDefault || `Pelaksanaan ${rhk.rencanaHasilKerja}`, `ra-${rhk.id}`)}
                              title="Salin Rencana Aksi"
                            >
                              {copiedKey === `ra-${rhk.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-[10px] font-semibold text-slate-500 uppercase">Target Aksi</Label>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Input 
                              readOnly 
                              value={synth?.targetAksi || rhk.targetDefault || '1 Laporan'} 
                              className="h-7 text-xs bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleCopyText(synth?.targetAksi || rhk.targetDefault || '1 Laporan', `target-${rhk.id}`)}
                              title="Salin Target"
                            >
                              {copiedKey === `target-${rhk.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* BLOK TAHAP 2: BUKTI DUKUNG & REALISASI */}
                      <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-emerald-100 dark:border-emerald-900/50">
                          <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                            Tahap 2: Bukti Dukung & Realisasi
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100/70"
                            onClick={() => handleSendToExtension('EVIDEN_REALISASI', rhk)}
                          >
                            {bridgeSentKey === `${rhk.id}-EVIDEN_REALISASI` ? (
                              <span className="flex items-center text-emerald-600 font-bold"><Check className="w-3 h-3 mr-1" /> Terkirim</span>
                            ) : (
                              <span className="flex items-center"><Send className="w-3 h-3 mr-1" /> Kirim ke Tab BKN</span>
                            )}
                          </Button>
                        </div>

                        <div>
                          <Label className="text-[10px] font-semibold text-slate-500 uppercase">Nama Eviden</Label>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Input 
                              readOnly 
                              value={synth?.namaEviden || `Dokumen Bukti Capaian ${rhk.rencanaHasilKerja}`} 
                              className="h-7 text-xs bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-900"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleCopyText(synth?.namaEviden || `Dokumen Bukti Capaian ${rhk.rencanaHasilKerja}`, `ev-${rhk.id}`)}
                              title="Salin Nama Eviden"
                            >
                              {copiedKey === `ev-${rhk.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-[10px] font-semibold text-slate-500 uppercase">Link Google Drive Bukti</Label>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Input 
                              readOnly 
                              value={driveUrl || 'Belum diatur (Tambahkan di Kelola RHK)'} 
                              className="h-7 text-xs bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-900 text-blue-600 truncate"
                            />
                            {driveUrl && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7 shrink-0"
                                onClick={() => handleCopyText(driveUrl, `link-${rhk.id}`)}
                                title="Salin Link Google Drive"
                              >
                                {copiedKey === `link-${rhk.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                              </Button>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label className="text-[10px] font-semibold text-slate-500 uppercase">Narasi Realisasi (Kuantitas)</Label>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Input 
                              readOnly 
                              value={synth?.realisasiKuantitas || `${rhk.aspekKuantitas?.target || '1 Laporan'} telah diselesaikan sesuai standar berdasarkan Bukti Dukung terlampir.`} 
                              className="h-7 text-xs bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-900"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleCopyText(synth?.realisasiKuantitas || `${rhk.aspekKuantitas?.target || '1 Laporan'} telah diselesaikan berdasarkan Bukti Dukung.`, `real-${rhk.id}`)}
                              title="Salin Realisasi"
                            >
                              {copiedKey === `real-${rhk.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-[10px] font-semibold text-slate-500 uppercase">Sumber Data</Label>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Input 
                              readOnly 
                              value={synth?.sumberData || 'Aplikasi Tata Kelola E-Office RUANG SIGAP'} 
                              className="h-7 text-xs bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-900"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7 shrink-0"
                              onClick={() => handleCopyText(synth?.sumberData || 'Aplikasi Tata Kelola E-Office RUANG SIGAP', `src-${rhk.id}`)}
                              title="Salin Sumber Data"
                            >
                              {copiedKey === `src-${rhk.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bukti Tautan yang Ditemukan di Logbook */}
                    {activities.filter(a => a.kegiatan.buktiUrl).length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">
                          Tautan Dokumen Bukti yang Terkumpul dari Logbook ({activities.filter(a => a.kegiatan.buktiUrl).length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                          {activities.filter(a => a.kegiatan.buktiUrl).map((item, bIdx) => (
                            <a
                              key={bIdx}
                              href={item.kegiatan.buktiUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 border border-slate-200 dark:border-slate-700 truncate max-w-xs"
                            >
                              <FileText className="w-3 h-3 shrink-0" />
                              <span className="truncate">{item.kegiatan.buktiNama || item.kegiatan.deskripsi}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="border-t pt-3 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Gunakan ekstensi <strong>SIGAP e-Kinerja Bridge</strong> untuk injeksi otomatis tanpa salin manual.</span>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
