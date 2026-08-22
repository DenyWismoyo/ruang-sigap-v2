"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, query, orderBy, onSnapshot, getDocs, doc,
  writeBatch, Timestamp, where, serverTimestamp
} from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { OPD } from '@/types';
import {
  Stethoscope, Loader2, RefreshCw, Users, TrendingUp,
  TrendingDown, Minus, FileCheck, CheckSquare, Activity,
  BarChart2, CalendarCheck
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { callCloudFunction } from "@/lib/firebase";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HealthMetrics {
  // Skor per pilar (0-100)
  skorAdopsi?: number;
  skorKonsistensi?: number;
  skorProduktivitasDokumen?: number;
  skorTugasTepatWaktu?: number;
  // Data mentah
  totalUserAktif?: number;
  totalUserLogin?: number;
  rateAdopsi?: number;
  totalSuratMasuk?: number;
  totalSuratSelesai?: number;
  totalTugasSelesai?: number;
  totalTugasTepatWaktu?: number;
  totalDisposisi?: number;
  totalLogbook?: number;
  // Legacy fields (untuk backward compat data lama)
  responsDisposisi?: number;
  tugasSelesaiTepatWaktu?: number;
  aktivitasPengguna?: number;
  totalTindakLanjut?: number;
  totalLogbookHarian?: number;
  totalAktivitas?: number;
}

interface HealthScoreDoc {
  opdId: string;
  tanggal: any;
  dateString: string;
  score: number;
  metrics: HealthMetrics;
  kategori: string;
}

// ── Helper: render label kategori pilar ───────────────────────────────────────

function renderPilarLabel(score: number | undefined, category: string): React.ReactNode {
  if (score === undefined || category === 'Tidak Aktif') return <span className="text-muted-foreground">-</span>;
  const label =
    score >= 85 ? 'Sangat Baik' :
    score >= 70 ? 'Baik' :
    score >= 50 ? 'Cukup' :
    score >= 30 ? 'Kurang' : 'Sangat Kurang';
  const color =
    score >= 85 ? 'text-green-600' :
    score >= 70 ? 'text-blue-600' :
    score >= 50 ? 'text-orange-500' : 'text-red-600';
  return <span className={`font-medium ${color}`}>{label}</span>;
}

function scoreColor(score: number) {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-orange-500';
  return 'text-red-600';
}

// ── Komponen Stat Card ─────────────────────────────────────────────────────────

function StatCard({
  title, value, sub, icon: Icon, color
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="nk-card p-4 flex items-start gap-4">
      <div className={`p-2.5 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{title}</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Halaman Utama ──────────────────────────────────────────────────────────────

export default function KesehatanOPDPage() {
  const { userProfile, loading: authLoading } = useUserAuth();
  const { addToast } = useToast();

  const [opds, setOpds] = useState<OPD[]>([]);
  const [healthHistory, setHealthHistory] = useState<Map<string, HealthScoreDoc[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const currentYearMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (userProfile?.role !== 'super_admin') return;

    const unsubOpd = onSnapshot(
      query(collection(db, 'opd'), orderBy('namaOpd')),
      snap => setOpds(snap.docs.map(d => ({ id: d.id, ...d.data() } as OPD)))
    );

    const unsubHealth = onSnapshot(collection(db, 'opdHealthScores'), snap => {
      const historyMap = new Map<string, HealthScoreDoc[]>();
      snap.forEach(d => {
        const data = d.data() as HealthScoreDoc;
        const list = historyMap.get(data.opdId) || [];
        list.push(data);
        historyMap.set(data.opdId, list);
      });
      setHealthHistory(historyMap);
      setLoading(false);
    });

    return () => { unsubOpd(); unsubHealth(); };
  }, [userProfile]);

  // ── Force Recalculate (memanggil Cloud Function di server) ─────────────────
  const handleForceAggregate = async () => {
    if (!window.confirm(
      `Yakin ingin menjalankan ulang kalkulasi skor kesehatan untuk bulan ${selectedMonth}?\n\nProses ini dijalankan di server dan hasilnya akan muncul dalam beberapa menit.`
    )) return;

    setIsRefreshing(true);
    addToast('Mengirim permintaan kalkulasi ulang ke server...', 'info');

    try {
      const [year, month] = selectedMonth.split('-');
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const now = new Date();
      const isCurrentMonth = selectedMonth === now.toISOString().slice(0, 7);
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0);
      endOfMonth.setHours(23, 59, 59, 999);
      const endTargetDate = isCurrentMonth ? now : endOfMonth;
      const daysElapsed = isCurrentMonth ? Math.max(1, now.getDate()) : endOfMonth.getDate();
      const weeksElapsed = Math.max(1, Math.ceil(daysElapsed / 7));

      const startTimestamp = Timestamp.fromDate(startOfMonth);
      const endTimestamp = Timestamp.fromDate(endTargetDate);
      const dateStr = selectedMonth;

      const opdSnapshot = await getDocs(collection(db, "opd"));
      const opdList = opdSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as OPD));
      const batch = writeBatch(db);

      for (const opd of opdList) {

        // Pilar 1 & 2: Adopsi & Konsistensi
        const usersQ = query(collection(db, "users"), where("opdId", "==", opd.id), where("status", "==", "aktif"));
        const usersSnap = await getDocs(usersQ);
        const totalUserAktif = usersSnap.size;

        const sessionsQ = query(collection(db, "userSessions"), where("opdId", "==", opd.id), where("yearMonth", "==", dateStr));
        const sessionsSnap = await getDocs(sessionsQ);

        const uniqueUserIds = new Set<string>();
        const userWeeks = new Map<string, Set<number>>();
        sessionsSnap.forEach(d => {
          const sd = d.data();
          uniqueUserIds.add(sd.userId);
          if (!userWeeks.has(sd.userId)) userWeeks.set(sd.userId, new Set());
          userWeeks.get(sd.userId)!.add(sd.weekOfMonth as number);
        });
        const totalUserLogin = uniqueUserIds.size;

        let skorAdopsi = 0;
        if (totalUserAktif > 0) skorAdopsi = Math.min(100, Math.round((totalUserLogin / totalUserAktif) * 100));
        else if (totalUserLogin > 0) skorAdopsi = 100;

        let skorKonsistensi = 0;
        if (totalUserLogin > 0) {
          let totalRate = 0;
          userWeeks.forEach(ws => { totalRate += ws.size / weeksElapsed; });
          skorKonsistensi = Math.min(100, Math.round((totalRate / totalUserLogin) * 100));
        }

        // Pilar 3: Produktivitas Dokumen
        const suratQ = query(collection(db, "surat"), where("opdId", "==", opd.id), where("tanggalDiterima", ">=", startTimestamp), where("tanggalDiterima", "<=", endTimestamp));
        const suratSnap = await getDocs(suratQ);
        const totalSuratMasuk = suratSnap.size;
        let totalSuratSelesai = 0;
        suratSnap.forEach(d => {
          const s = d.data();
          if (s.statusPenyelesaian === "Selesai" || s.statusPenyelesaian === "Diarsipkan") totalSuratSelesai++;
        });
        const skorProduktivitasDokumen = totalSuratMasuk > 0 ? Math.min(100, Math.round((totalSuratSelesai / totalSuratMasuk) * 100)) : 0;

        const disposisiQ = query(collection(db, "disposisi"), where("opdId", "==", opd.id), where("tanggalDisposisi", ">=", startTimestamp), where("tanggalDisposisi", "<=", endTimestamp));
        const disposisiSnap = await getDocs(disposisiQ);
        const totalDisposisi = disposisiSnap.size;

        const logbookQ = query(collection(db, "logbookHarian"), where("opdId", "==", opd.id), where("tanggal", ">=", startTimestamp), where("tanggal", "<=", endTimestamp));
        const logbookSnap = await getDocs(logbookQ);
        const totalLogbook = logbookSnap.size;

        // Pilar 4: Tugas Tepat Waktu
        const tugasQ = query(collection(db, "tugas"), where("opdId", "==", opd.id), where("status", "==", "Selesai"), where("tanggalSelesai", ">=", startTimestamp), where("tanggalSelesai", "<=", endTimestamp));
        const tugasSnap = await getDocs(tugasQ);
        let tugasTepatWaktu = 0;
        const totalTugasSelesai = tugasSnap.size;
        tugasSnap.forEach(d => {
          const t = d.data();
          if (t.batasWaktu && t.tanggalSelesai) {
            if (t.tanggalSelesai.toMillis() <= t.batasWaktu.toMillis()) tugasTepatWaktu++;
          } else {
            tugasTepatWaktu++;
          }
        });
        const skorTugasTepatWaktu = totalTugasSelesai > 0 ? Math.round((tugasTepatWaktu / totalTugasSelesai) * 100) : 100;

        // Skor Akhir
        const adaAktivitas = totalUserLogin > 0 || totalSuratMasuk > 0 || totalTugasSelesai > 0;
        let finalScore = 0;
        let kategori = 'Tidak Aktif';
        if (adaAktivitas) {
          finalScore = Math.round((0.30 * skorAdopsi) + (0.20 * skorKonsistensi) + (0.25 * skorProduktivitasDokumen) + (0.25 * skorTugasTepatWaktu));
          if (finalScore >= 85) kategori = 'Sangat Sehat';
          else if (finalScore >= 70) kategori = 'Sehat';
          else if (finalScore >= 50) kategori = 'Perlu Perhatian';
          else kategori = 'Buruk';
        }

        const healthRef = doc(db, "opdHealthScores", `${opd.id}_${dateStr}`);
        batch.set(healthRef, {
          opdId: opd.id, tanggal: startTimestamp, dateString: dateStr, score: finalScore,
          metrics: {
            skorAdopsi, skorKonsistensi, skorProduktivitasDokumen, skorTugasTepatWaktu,
            totalUserAktif, totalUserLogin,
            rateAdopsi: totalUserAktif > 0 ? Math.round((totalUserLogin / totalUserAktif) * 100) : 0,
            totalSuratMasuk, totalSuratSelesai, totalTugasSelesai,
            totalTugasTepatWaktu: tugasTepatWaktu, totalDisposisi, totalLogbook,
          },
          kategori, createdAt: serverTimestamp()
        });
        const opdRef = doc(db, "opd", opd.id!);
        batch.update(opdRef, { currentHealthScore: finalScore, healthCategory: kategori });
      }

      await batch.commit();
      addToast('Kalkulasi ulang selesai. Data telah diperbarui.', 'success');
    } catch (error: any) {
      addToast(`Gagal: ${error.message}`, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // ── Computed data per bulan ─────────────────────────────────────────────────
  const opdDataForMonth = useMemo(() => {
    return opds.map(opd => {
      const history = healthHistory.get(opd.id!) || [];
      const monthHistory = history.filter(h => h.dateString === selectedMonth || h.dateString.startsWith(selectedMonth));
      monthHistory.sort((a, b) => b.tanggal?.toMillis?.() - a.tanggal?.toMillis?.());
      const latest = monthHistory[0] || null;
      return { opd, latest };
    });
  }, [opds, healthHistory, selectedMonth]);

  const filteredOpdData = useMemo(() => {
    if (!searchTerm) return opdDataForMonth;
    const lower = searchTerm.toLowerCase();
    return opdDataForMonth.filter(d => d.opd.namaOpd.toLowerCase().includes(lower));
  }, [opdDataForMonth, searchTerm]);

  // ── Ringkasan statistik bulan ini ──────────────────────────────────────────
  const monthSummary = useMemo(() => {
    const aktif = opdDataForMonth.filter(d => d.latest && d.latest.kategori !== 'Tidak Aktif');
    const avgScore = aktif.length > 0
      ? Math.round(aktif.reduce((s, d) => s + d.latest!.score, 0) / aktif.length)
      : 0;
    const avgAdopsi = aktif.length > 0
      ? Math.round(aktif.reduce((s, d) => s + (d.latest?.metrics?.rateAdopsi ?? d.latest?.metrics?.skorAdopsi ?? 0), 0) / aktif.length)
      : 0;
    const totalUserLogin = aktif.reduce((s, d) => s + (d.latest?.metrics?.totalUserLogin ?? 0), 0);
    const totalUserAktif = opdDataForMonth.reduce((s, d) => s + (d.latest?.metrics?.totalUserAktif ?? 0), 0);
    return { aktif: aktif.length, total: opds.length, avgScore, avgAdopsi, totalUserLogin, totalUserAktif };
  }, [opdDataForMonth, opds.length]);

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (userProfile?.role !== 'super_admin') {
    return <div className="p-6 text-center text-red-500">Akses Ditolak. Halaman ini hanya untuk Super Admin.</div>;
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeInUp">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-[var(--nk-teal-mid)]" />
            Dasbor Kesehatan OPD
          </h1>
          <p className="text-muted-foreground mt-2">
            Pantau adopsi, retensi pengguna, produktivitas dokumen, dan penyelesaian tugas setiap Instansi/OPD.
          </p>
        </div>
        <Button
          onClick={handleForceAggregate}
          disabled={isRefreshing}
          className="bg-[var(--nk-teal-mid)] hover:bg-[var(--nk-teal-dark)] text-white"
        >
          {isRefreshing
            ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            : <RefreshCw className="mr-2 h-4 w-4" />
          }
          Kalkulasi Ulang
        </Button>
      </div>

      {/* Filter & Stats Row */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter Bulan:</label>
          <Input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="w-[180px] bg-transparent"
          />
        </div>
      </div>

      {/* Ringkasan Adopsi Bulanan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="OPD Aktif Bulan Ini"
          value={`${monthSummary.aktif} / ${monthSummary.total}`}
          sub="instansi yang tercatat aktif"
          icon={Activity}
          color="bg-teal-500"
        />
        <StatCard
          title="Rata-rata Skor Kesehatan"
          value={monthSummary.avgScore || '-'}
          sub="dari OPD yang aktif"
          icon={BarChart2}
          color="bg-blue-500"
        />
        <StatCard
          title="Adopsi Pengguna"
          value={`${monthSummary.avgAdopsi}%`}
          sub={`${monthSummary.totalUserLogin} dari ${monthSummary.totalUserAktif} user login`}
          icon={Users}
          color="bg-violet-500"
        />
        <StatCard
          title="Periode"
          value={new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          sub="bulan yang sedang dipantau"
          icon={CalendarCheck}
          color="bg-orange-500"
        />
      </div>

      {/* Keterangan Formula */}
      <div className="nk-card p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold mb-1">Formula Skor Kesehatan (v2)</p>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          <span className="font-mono">Skor = (30% × Adopsi User) + (20% × Konsistensi Login) + (25% × Produktivitas Dokumen) + (25% × Tugas Tepat Waktu)</span>
        </p>
        <p className="text-xs text-blue-500 dark:text-blue-500 mt-1">
          Adopsi: % user yg login bulan ini · Konsistensi: % minggu aktif per user · Produktivitas: % surat selesai · Tugas: % selesai tepat waktu
        </p>
      </div>

      {/* Tabel */}
      <div className="nk-card p-6">
        <div className="mb-4">
          <Input
            placeholder="Cari Instansi / OPD..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-md bg-transparent"
          />
        </div>
        <div className="nk-table-wrapper">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[160px]">Nama OPD</TableHead>
                <TableHead className="text-center w-[110px]">Skor</TableHead>
                <TableHead className="w-[150px]">Kategori</TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span>Adopsi User</span>
                    <span className="text-[10px] font-normal text-muted-foreground">% login bulan ini</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span>Konsistensi</span>
                    <span className="text-[10px] font-normal text-muted-foreground">% minggu aktif</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span>Produktivitas</span>
                    <span className="text-[10px] font-normal text-muted-foreground">% surat selesai</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span>Tugas</span>
                    <span className="text-[10px] font-normal text-muted-foreground">% tepat waktu</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span>Login</span>
                    <span className="text-[10px] font-normal text-muted-foreground">user / total</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span>Surat</span>
                    <span className="text-[10px] font-normal text-muted-foreground">selesai / masuk</span>
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex flex-col items-center">
                    <span>Disposisi</span>
                    <span className="text-[10px] font-normal text-muted-foreground">total transaksi</span>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpdData.map(({ opd, latest }) => {
                const score = latest?.score ?? 0;
                const category = latest?.kategori ?? 'Belum Dihitung';
                const m = latest?.metrics;

                // Deteksi data v2 vs legacy
                const isV2 = m?.skorAdopsi !== undefined;

                // Resolve nilai adopsi (v2 langsung pakai rateAdopsi, legacy fallback ke aktivitasPengguna)
                const adopsiScore = isV2 ? m?.skorAdopsi : m?.aktivitasPengguna;
                const konsistensiScore = isV2 ? m?.skorKonsistensi : undefined;
                const produktivitasScore = isV2 ? m?.skorProduktivitasDokumen : undefined;
                const tugasScore = isV2 ? m?.skorTugasTepatWaktu : m?.tugasSelesaiTepatWaktu;

                const userLogin = m?.totalUserLogin;
                const userAktif = m?.totalUserAktif;
                const suratSelesai = m?.totalSuratSelesai;
                const suratMasuk = m?.totalSuratMasuk;
                const totalDisposisi = m?.totalDisposisi;

                return (
                  <TableRow key={opd.id}>
                    <TableCell className="font-medium">{opd.namaOpd}</TableCell>

                    {/* Skor */}
                    <TableCell className="text-center">
                      <span className={`text-xl font-bold ${scoreColor(score)}`}>{score}</span>
                    </TableCell>

                    {/* Kategori Badge */}
                    <TableCell>
                      <Badge
                        variant={
                          score >= 85 ? 'default' :
                          score >= 70 ? 'secondary' :
                          score >= 50 ? 'outline' : 'destructive'
                        }
                        className={score >= 85 ? 'bg-green-100 text-green-800 border-green-200' : ''}
                      >
                        {category}
                      </Badge>
                    </TableCell>

                    {/* Adopsi */}
                    <TableCell className="text-center">
                      {renderPilarLabel(adopsiScore, category)}
                    </TableCell>

                    {/* Konsistensi */}
                    <TableCell className="text-center">
                      {isV2
                        ? renderPilarLabel(konsistensiScore, category)
                        : <span className="text-muted-foreground text-xs">-</span>
                      }
                    </TableCell>

                    {/* Produktivitas */}
                    <TableCell className="text-center">
                      {isV2
                        ? renderPilarLabel(produktivitasScore, category)
                        : <span className="text-muted-foreground text-xs">-</span>
                      }
                    </TableCell>

                    {/* Tugas */}
                    <TableCell className="text-center">
                      {renderPilarLabel(tugasScore, category)}
                    </TableCell>

                    {/* Login / Total */}
                    <TableCell className="text-center text-sm">
                      {userLogin !== undefined && userAktif !== undefined
                        ? <span className={`font-semibold ${scoreColor((userAktif > 0 ? (userLogin / userAktif) : 0) * 100)}`}>
                            {userLogin}<span className="text-muted-foreground font-normal"> / {userAktif}</span>
                          </span>
                        : '-'
                      }
                    </TableCell>

                    {/* Surat selesai / masuk */}
                    <TableCell className="text-center text-sm">
                      {suratSelesai !== undefined && suratMasuk !== undefined
                        ? <span>
                            <span className="font-semibold text-green-600">{suratSelesai}</span>
                            <span className="text-muted-foreground"> / {suratMasuk}</span>
                          </span>
                        : '-'
                      }
                    </TableCell>

                    {/* Disposisi */}
                    <TableCell className="text-center text-sm font-medium">
                      {totalDisposisi !== undefined ? totalDisposisi : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
