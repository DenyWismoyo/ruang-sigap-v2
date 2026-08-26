"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData';
import { OPD } from '@/types';
import {
  OpdHealthScoreDoc,
  recalculateAllOpds,
  calculateOpdHealthScore,
  getCurrentYearMonth,
  normalizeHealthMetrics,
} from '@/lib/healthScoreService';
import OpdHealthDetailModal from './components/OpdHealthDetailModal';
import { useToast } from '@/context/ToastContext';
import {
  Loader2,
  HeartPulse,
  Search,
  ArrowLeft,
  Activity,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterCategory = 'ALL' | 'SANGAT_SEHAT' | 'SEHAT' | 'PERHATIAN' | 'KRITIS' | 'TIDAK_AKTIF';
type SortOption = 'SCORE_DESC' | 'SCORE_ASC' | 'NAME_ASC' | 'ADOPTION_DESC';

export default function KesehatanOpdDashboard() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useUserAuth();
  const { opdList, isLoading: opdLoading } = useMasterData(true);
  const { addToast } = useToast();

  const [healthScores, setHealthScores] = useState<Map<string, OpdHealthScoreDoc>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('SCORE_DESC');

  // Modal State
  const [selectedOpd, setSelectedOpd] = useState<OPD | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Recalculation State
  const [isRecalculatingAll, setIsRecalculatingAll] = useState(false);
  const [recalcProgress, setRecalcProgress] = useState<{ current: number; total: number; name: string } | null>(null);

  // Protect route
  useEffect(() => {
    if (!authLoading && userProfile?.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [userProfile, authLoading, router]);

  // Realtime subscription on opdHealthScores
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'opdHealthScores'), (snap) => {
      const scores = new Map<string, OpdHealthScoreDoc>();
      snap.forEach((docSnap) => {
        const data = docSnap.data() as OpdHealthScoreDoc;
        if (data.opdId) {
          const existing = scores.get(data.opdId);
          const curDate = data.dateString || '';
          const exDate = existing?.dateString || '';
          if (!existing || curDate >= exDate) {
            scores.set(data.opdId, {
              ...data,
              opdId: data.opdId,
              metrics: normalizeHealthMetrics(data.metrics),
            });
          }
        }
      });
      setHealthScores(scores);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Merge OPD list with latest health scores
  const mergedData = useMemo(() => {
    return opdList.map((opd) => {
      const rawHealth = healthScores.get(opd.id!);
      const health = rawHealth
        ? {
            ...rawHealth,
            metrics: normalizeHealthMetrics(rawHealth.metrics),
          }
        : {
            opdId: opd.id!,
            score: opd.currentHealthScore || 0,
            kategori: opd.healthCategory || 'Tidak Aktif',
            dateString: getCurrentYearMonth(),
            metrics: normalizeHealthMetrics(null),
          };
      return { opd, health };
    });
  }, [opdList, healthScores]);

  // Filter & Sort
  const filteredAndSortedData = useMemo(() => {
    let result = mergedData.filter((item) => {
      // Search
      const matchSearch =
        item.opd.namaOpd.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.opd.id && item.opd.id.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchSearch) return false;

      // Category filter
      const sc = item.health.score;
      if (filterCategory === 'SANGAT_SEHAT') return sc >= 85;
      if (filterCategory === 'SEHAT') return sc >= 70 && sc < 85;
      if (filterCategory === 'PERHATIAN') return sc >= 50 && sc < 70;
      if (filterCategory === 'KRITIS') return sc > 0 && sc < 50;
      if (filterCategory === 'TIDAK_AKTIF') return sc === 0;
      return true;
    });

    // Sort
    result.sort((a, b) => {
      if (sortOption === 'SCORE_DESC') return b.health.score - a.health.score;
      if (sortOption === 'SCORE_ASC') return a.health.score - b.health.score;
      if (sortOption === 'NAME_ASC') return a.opd.namaOpd.localeCompare(b.opd.namaOpd);
      if (sortOption === 'ADOPTION_DESC') {
        const adA = a.health.metrics?.skorAdopsi || 0;
        const adB = b.health.metrics?.skorAdopsi || 0;
        return adB - adA;
      }
      return 0;
    });

    return result;
  }, [mergedData, searchQuery, filterCategory, sortOption]);

  // KPI Computations
  const stats = useMemo(() => {
    const totalOpd = mergedData.length;
    const scoredOpds = mergedData.filter((item) => item.health.score > 0);
    const avgScore = scoredOpds.length > 0
      ? Math.round(scoredOpds.reduce((acc, curr) => acc + curr.health.score, 0) / scoredOpds.length)
      : 0;

    const totalAdopsiSum = scoredOpds.reduce((acc, curr) => acc + (curr.health.metrics?.rateAdopsi || 0), 0);
    const avgAdopsi = scoredOpds.length > 0 ? Math.round(totalAdopsiSum / scoredOpds.length) : 0;

    // Top Performer
    const topPerformer = [...mergedData].sort((a, b) => b.health.score - a.health.score)[0];
    // Needs Attention (lowest score that is active or lowest overall)
    const needsAttention = [...scoredOpds].sort((a, b) => a.health.score - b.health.score)[0];

    return {
      totalOpd,
      monitoredCount: scoredOpds.length,
      avgScore,
      avgAdopsi,
      topPerformer,
      needsAttention,
    };
  }, [mergedData]);

  // Batch Recalculate All
  const handleRecalculateAll = async () => {
    if (opdList.length === 0) return;
    setIsRecalculatingAll(true);
    try {
      const count = await recalculateAllOpds(opdList, (current, total, name) => {
        setRecalcProgress({ current, total, name });
      });
      addToast(`Berhasil menghitung ulang kesehatan ${count} instansi!`, 'success');
    } catch (err: any) {
      console.error(err);
      addToast(`Gagal kalkulasi massal: ${err.message}`, 'error');
    } finally {
      setIsRecalculatingAll(false);
      setRecalcProgress(null);
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    if (score > 0) return 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
    return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 85) return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    if (score >= 70) return <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    if (score >= 50) return <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    if (score > 0) return <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
    return <Activity className="w-5 h-5 text-muted-foreground" />;
  };

  if (authLoading || loading || opdLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userProfile?.role !== 'super_admin') return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/super-admin')} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <HeartPulse className="w-7 h-7 text-pink-600 dark:text-pink-400 animate-pulse" />
              Monitoring Kesehatan OPD
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Pantau skor kesehatan, adopsi pengguna, produktivitas, dan kepatuhan SLA seluruh instansi.
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRecalculateAll}
            disabled={isRecalculatingAll}
            className="gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRecalculatingAll ? 'animate-spin' : ''}`} />
            {isRecalculatingAll
              ? recalcProgress
                ? `Kalkulasi (${recalcProgress.current}/${recalcProgress.total})...`
                : 'Menghitung...'
              : 'Kalkulasi Ulang Semua OPD'}
          </Button>
        </div>
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rata-Rata Nasional */}
        <Card className="bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-card border-pink-200/80 dark:border-pink-900/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-pink-700 dark:text-pink-400 font-semibold flex items-center justify-between">
              <span>Rata-Rata Nasional</span>
              <HeartPulse className="w-4 h-4 text-pink-600" />
            </CardDescription>
            <CardTitle className="text-3xl sm:text-4xl font-extrabold text-foreground">
              {stats.avgScore} <span className="text-sm font-normal text-muted-foreground">/ 100</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Dihitung dari {stats.monitoredCount} instansi aktif terpantau.
            </p>
          </CardContent>
        </Card>

        {/* Tingkat Adopsi */}
        <Card className="bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-card border-blue-200/80 dark:border-blue-900/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-blue-700 dark:text-blue-400 font-semibold flex items-center justify-between">
              <span>Tingkat Adopsi Pengguna</span>
              <Users className="w-4 h-4 text-blue-600" />
            </CardDescription>
            <CardTitle className="text-3xl sm:text-4xl font-extrabold text-foreground">
              {stats.avgAdopsi}%
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Rata-rata pegawai aktif yang login bulan ini.
            </p>
          </CardContent>
        </Card>

        {/* Top Performer */}
        <Card className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-card border-emerald-200/80 dark:border-emerald-900/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between">
              <span>Top Performer</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground line-clamp-1" title={stats.topPerformer?.opd.namaOpd}>
              {stats.topPerformer?.health.score ? `${stats.topPerformer.health.score} Poin` : '-'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground line-clamp-1">
              {stats.topPerformer?.opd.namaOpd || 'Belum ada data'}
            </p>
          </CardContent>
        </Card>

        {/* Butuh Perhatian */}
        <Card className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-card border-amber-200/80 dark:border-amber-900/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-700 dark:text-amber-400 font-semibold flex items-center justify-between">
              <span>Perlu Pendampingan</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground line-clamp-1" title={stats.needsAttention?.opd.namaOpd}>
              {stats.needsAttention?.health.score ? `${stats.needsAttention.health.score} Poin` : '-'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground line-clamp-1">
              {stats.needsAttention?.opd.namaOpd || 'Seluruh instansi sehat'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-muted/30 border border-border rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama instansi atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background w-full"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Category Filter */}
          <Select
            value={filterCategory}
            onValueChange={(val: any) => setFilterCategory(val)}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Kategori Skor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kategori</SelectItem>
              <SelectItem value="SANGAT_SEHAT">Sangat Sehat (≥85)</SelectItem>
              <SelectItem value="SEHAT">Sehat (70-84)</SelectItem>
              <SelectItem value="PERHATIAN">Perlu Perhatian (50-69)</SelectItem>
              <SelectItem value="KRITIS">Kritis (&lt;50)</SelectItem>
              <SelectItem value="TIDAK_AKTIF">Tidak Aktif (0)</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Options */}
          <Select
            value={sortOption}
            onValueChange={(val: any) => setSortOption(val)}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <ArrowUpDown className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SCORE_DESC">Skor Tertinggi</SelectItem>
              <SelectItem value="SCORE_ASC">Skor Terendah</SelectItem>
              <SelectItem value="ADOPTION_DESC">Adopsi Tertinggi</SelectItem>
              <SelectItem value="NAME_ASC">Nama OPD (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid of OPD Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAndSortedData.map((item) => {
          const score = Math.round(item.health.score || 0);
          const colorClass = getScoreColorClass(score);
          const metrics = item.health.metrics;

          return (
            <Card
              key={item.opd.id}
              onClick={() => {
                setSelectedOpd(item.opd);
                setIsModalOpen(true);
              }}
              className="cursor-pointer overflow-hidden hover:shadow-md hover:border-pink-300 dark:hover:border-pink-700 transition-all group flex flex-col justify-between"
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  {/* Score Pill */}
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border shadow-xs shrink-0 ${colorClass}`}>
                    <span className="text-xl font-black leading-none">{score > 0 ? score : '-'}</span>
                    <span className="text-[9px] uppercase font-semibold mt-0.5 opacity-80">Skor</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] py-0 px-2 h-5">
                        {item.opd.tipe || 'Induk'}
                      </Badge>
                      {getScoreIcon(score)}
                    </div>
                    <CardTitle className="text-base font-bold mt-1.5 line-clamp-2 text-foreground group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors" title={item.opd.namaOpd}>
                      {item.opd.namaOpd}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 pt-1 space-y-3">
                {/* 4 Pilar Mini Bars */}
                <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Adopsi Pegawai</span>
                    <span className="font-semibold text-foreground">
                      {metrics.skorAdopsi}%
                    </span>
                  </div>
                  <Progress value={metrics.skorAdopsi} className="h-1.5 bg-muted" />

                  <div className="flex justify-between items-center text-muted-foreground pt-1">
                    <span>Produktivitas Dokumen</span>
                    <span className="font-semibold text-foreground">
                      {metrics.skorProduktivitasDokumen}%
                    </span>
                  </div>
                  <Progress value={metrics.skorProduktivitasDokumen} className="h-1.5 bg-muted" />
                </div>

                {/* Footer preview */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {metrics.totalUserLogin}/{metrics.totalUserAktif} Pegawai Login
                  </span>
                  <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-medium group-hover:translate-x-0.5 transition-transform">
                    Detail <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredAndSortedData.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl space-y-2">
            <HeartPulse className="w-10 h-10 text-muted-foreground/50 mx-auto" />
            <h3 className="font-semibold text-foreground">Tidak Ada Data Instansi yang Sesuai</h3>
            <p className="text-xs max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau ganti filter kategori skor yang dipilih.
            </p>
          </div>
        )}
      </div>

      {/* Detailed Modal Dialog */}
      {selectedOpd && (
        <OpdHealthDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedOpd(null);
          }}
          opd={selectedOpd}
          healthData={healthScores.get(selectedOpd.id!) || null}
          onHealthDataUpdated={(updated) => {
            setHealthScores((prev) => new Map(prev).set(updated.opdId, updated));
          }}
        />
      )}
    </div>
  );
}
