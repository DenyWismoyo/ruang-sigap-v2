"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OPD } from '@/types';
import { OpdHealthScoreDoc, calculateOpdHealthScore, getOpdHealthDiagnosis, normalizeHealthMetrics } from '@/lib/healthScoreService';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import {
  Users,
  CalendarDays,
  FileCheck2,
  Clock,
  Sparkles,
  RefreshCw,
  Settings,
  ShieldAlert,
  CheckCircle2,
  Activity,
  ArrowRight,
  TrendingUp,
  FileText,
  BookOpenCheck
} from 'lucide-react';

interface OpdHealthDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  opd: OPD | null;
  healthData?: OpdHealthScoreDoc | null;
  onHealthDataUpdated?: (updated: OpdHealthScoreDoc) => void;
}

export default function OpdHealthDetailModal({
  isOpen,
  onClose,
  opd,
  healthData,
  onHealthDataUpdated,
}: OpdHealthDetailModalProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [recalculating, setRecalculating] = useState(false);

  if (!opd) return null;

  const score = Math.round(healthData?.score || opd.currentHealthScore || 0);
  const metrics = normalizeHealthMetrics(healthData?.metrics);
  const diagnosis = getOpdHealthDiagnosis(metrics, score, opd.namaOpd);

  const getScoreColor = (sc: number) => {
    if (sc >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    if (sc >= 70) return 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    if (sc >= 50) return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    if (sc > 0) return 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
  };

  const getCategoryBadge = (sc: number) => {
    if (sc >= 85) return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"><CheckCircle2 className="w-3 h-3" /> Sangat Sehat</Badge>;
    if (sc >= 70) return <Badge className="bg-blue-600 hover:bg-blue-700 text-white gap-1"><TrendingUp className="w-3 h-3" /> Sehat</Badge>;
    if (sc >= 50) return <Badge className="bg-amber-600 hover:bg-amber-700 text-white gap-1"><Activity className="w-3 h-3" /> Perlu Perhatian</Badge>;
    if (sc > 0) return <Badge className="bg-rose-600 hover:bg-rose-700 text-white gap-1"><ShieldAlert className="w-3 h-3" /> Kritis</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Tidak Aktif</Badge>;
  };

  const handleRecalculateSingle = async () => {
    if (!opd.id) return;
    setRecalculating(true);
    try {
      const updated = await calculateOpdHealthScore(opd.id);
      addToast(`Skor kesehatan ${opd.namaOpd} berhasil dihitung ulang (${updated.score} poin)`, 'success');
      if (onHealthDataUpdated) {
        onHealthDataUpdated(updated);
      }
    } catch (err: any) {
      console.error(err);
      addToast(`Gagal menghitung skor: ${err.message}`, 'error');
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border bg-card">
        {/* Header Section */}
        <div className="p-6 pb-5 border-b border-border/60 bg-gradient-to-b from-muted/40 to-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                {getCategoryBadge(score)}
                <Badge variant="outline" className="text-xs">
                  {opd.tipe || 'Induk'}
                </Badge>
                {healthData?.dateString && (
                  <span className="text-xs text-muted-foreground font-mono">
                    Periode: {healthData.dateString}
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground line-clamp-2">
                {opd.namaOpd}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                ID Instansi: <span className="font-mono">{opd.id}</span>
              </DialogDescription>
            </div>

            {/* Score Big Badge */}
            <div className={`shrink-0 px-5 py-3 rounded-2xl border flex flex-col items-center justify-center ${getScoreColor(score)}`}>
              <span className="text-3xl font-black tracking-tight leading-none">
                {score > 0 ? score : '-'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider mt-1 opacity-80">
                Composite Score
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* 4 Pilar Utama */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              4 Pilar Penilaian Kesehatan Instansi
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Pilar 1: Adopsi User */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block text-foreground">1. Adopsi Pengguna</span>
                      <span className="text-[10px] text-muted-foreground">Bobot 30%</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {metrics.skorAdopsi}%
                  </span>
                </div>
                <Progress value={metrics.skorAdopsi} className="h-2 bg-muted" />
                <div className="text-[11px] text-muted-foreground flex justify-between">
                  <span>Login Bulan Ini</span>
                  <span className="font-medium text-foreground">
                    {metrics.totalUserLogin} dari {metrics.totalUserAktif} pegawai
                  </span>
                </div>
              </div>

              {/* Pilar 2: Konsistensi Mingguan */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block text-foreground">2. Konsistensi Mingguan</span>
                      <span className="text-[10px] text-muted-foreground">Bobot 20%</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {metrics.skorKonsistensi}%
                  </span>
                </div>
                <Progress value={metrics.skorKonsistensi} className="h-2 bg-muted" />
                <div className="text-[11px] text-muted-foreground flex justify-between">
                  <span>Retensi Rutinitas</span>
                  <span className="font-medium text-foreground">
                    {metrics.skorKonsistensi}% keteraturan login
                  </span>
                </div>
              </div>

              {/* Pilar 3: Produktivitas Dokumen */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block text-foreground">3. Produktivitas Dokumen</span>
                      <span className="text-[10px] text-muted-foreground">Bobot 25%</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {metrics.skorProduktivitasDokumen}%
                  </span>
                </div>
                <Progress value={metrics.skorProduktivitasDokumen} className="h-2 bg-muted" />
                <div className="text-[11px] text-muted-foreground flex justify-between">
                  <span>Surat Selesai / Arsip</span>
                  <span className="font-medium text-foreground">
                    {metrics.totalSuratSelesai} dari {metrics.totalSuratMasuk} surat
                  </span>
                </div>
              </div>

              {/* Pilar 4: Ketepatan Waktu Tugas */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block text-foreground">4. Ketepatan Waktu Tugas</span>
                      <span className="text-[10px] text-muted-foreground">Bobot 25%</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-foreground">
                    {metrics.skorTugasTepatWaktu}%
                  </span>
                </div>
                <Progress value={metrics.skorTugasTepatWaktu} className="h-2 bg-muted" />
                <div className="text-[11px] text-muted-foreground flex justify-between">
                  <span>Selesai Sesuai SLA</span>
                  <span className="font-medium text-foreground">
                    {metrics.totalTugasTepatWaktu} dari {metrics.totalTugasSelesai} tugas
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Raw Metrics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center">
              <span className="text-[11px] text-muted-foreground block">Surat Masuk</span>
              <span className="text-lg font-bold text-foreground">{metrics.totalSuratMasuk}</span>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center">
              <span className="text-[11px] text-muted-foreground block">Disposisi Dibuat</span>
              <span className="text-lg font-bold text-foreground">{metrics.totalDisposisi}</span>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center">
              <span className="text-[11px] text-muted-foreground block">Tugas Selesai</span>
              <span className="text-lg font-bold text-foreground">{metrics.totalTugasSelesai}</span>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center">
              <span className="text-[11px] text-muted-foreground block">Logbook Diisi</span>
              <span className="text-lg font-bold text-foreground">{metrics.totalLogbook}</span>
            </div>
          </div>

          {/* AI Diagnostics & Actionable Recommendations */}
          <div className="p-4 rounded-xl border border-indigo-200/80 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI Health Diagnostics & Rekomendasi</span>
            </div>

            <p className="text-xs font-medium text-foreground">
              {diagnosis.headline}
            </p>

            {diagnosis.insights.length > 0 && (
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Temuan Lapangan:
                </span>
                <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                  {diagnosis.insights.map((ins, idx) => (
                    <li key={idx} className="leading-relaxed">{ins}</li>
                  ))}
                </ul>
              </div>
            )}

            {diagnosis.recommendations.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-indigo-200/60 dark:border-indigo-900/40">
                <span className="text-[11px] font-semibold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider block">
                  Rekomendasi Tindakan:
                </span>
                <ul className="space-y-1.5 text-xs text-foreground">
                  {diagnosis.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="p-4 px-6 bg-muted/20 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculateSingle}
            disabled={recalculating}
            className="w-full sm:w-auto gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Menghitung Ulang...' : 'Kalkulasi Ulang OPD Ini'}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                router.push(`/dashboard/super-admin/${opd.id}`);
              }}
              className="gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              Kelola Instansi
            </Button>
            <Button size="sm" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
