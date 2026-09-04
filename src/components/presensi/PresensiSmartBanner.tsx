"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useUserAuth } from "@/context/AuthContext";
import { PresensiRecord } from "@/types";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  Sun,
  Sunset,
  Sparkles,
  Camera,
  FileCheck,
  UserCheck,
  ChevronRight,
  MapPin,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PresensiSmartBannerProps {
  tenant?: "sigap" | "poros";
}

function getWibDateString(dateObj: Date = new Date()): string {
  const wib = new Date(dateObj.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const y = wib.getFullYear();
  const m = String(wib.getMonth() + 1).padStart(2, "0");
  const d = String(wib.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function PresensiSmartBanner({ tenant = "sigap" }: PresensiSmartBannerProps) {
  const { userProfile, jabatanProfile, opdConfig } = useUserAuth();
  const isPoros = tenant === "poros";

  const todayStr = useMemo(() => getWibDateString(), []);
  const [todayRecord, setTodayRecord] = useState<PresensiRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [wibHour, setWibHour] = useState<number>(() => {
    const wib = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    return wib.getHours();
  });
  const [wibTimeStr, setWibTimeStr] = useState<string>("");

  // Realtime WIB Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const wib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      setWibHour(wib.getHours());
      const h = String(wib.getHours()).padStart(2, "0");
      const m = String(wib.getMinutes()).padStart(2, "0");
      const s = String(wib.getSeconds()).padStart(2, "0");
      setWibTimeStr(`${h}:${m}:${s}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Evaluasi Visibilitas Berdasarkan Klaster & Pengaturan OPD
  const presensiConfig = opdConfig?.presensiConfig;
  const isModuleEnabled = opdConfig?.features?.enablePresensi || presensiConfig?.enabled;
  const userCluster = jabatanProfile?.klasterStruktur || "umum";
  const targetClusters = presensiConfig?.klasterTarget || ["blud"];
  const isTargetCluster = targetClusters.includes(userCluster);

  const isHrdOrAdmin =
    userProfile?.role === "admin_opd" ||
    userProfile?.role === "super_admin" ||
    userProfile?.role === ("hrd" as any) ||
    userProfile?.additionalRoles?.includes("hrd") ||
    (jabatanProfile && jabatanProfile.level <= 5);

  const shouldRender = isModuleEnabled && (isTargetCluster || isHrdOrAdmin);

  // Real-time Firestore Listener untuk Record Presensi Hari Ini
  useEffect(() => {
    if (!shouldRender || !userProfile?.opdId || !userProfile?.uid) {
      setLoading(false);
      return;
    }

    const docId = `${userProfile.opdId}_${userProfile.uid}_${todayStr}`;
    const unsub = onSnapshot(
      doc(db, "presensi", docId),
      (snap) => {
        if (snap.exists()) {
          setTodayRecord({ id: snap.id, ...snap.data() } as PresensiRecord);
        } else {
          setTodayRecord(null);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Gagal memuat banner presensi real-time:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [shouldRender, userProfile?.opdId, userProfile?.uid, todayStr]);

  if (!shouldRender || loading) return null;

  const jamMasukTarget = presensiConfig?.jadwalKerja?.jamMasuk || "07:30";
  const jamPulangTarget = presensiConfig?.jadwalKerja?.jamPulang || "16:00";
  const [pulangHour] = jamPulangTarget.split(":").map(Number);
  const lokasiKantor = presensiConfig?.lokasiKantor?.namaLokasi || "Kantor Instansi";

  // Apakah sudah memasuki jam pulang (misal jam >= jamPulang atau jam >= 15:00)
  const isTimeForCheckout = wibHour >= (pulangHour || 16) || wibHour >= 15;
  const isMorning = wibHour >= 4 && wibHour < 12;

  // Primary CTA Button Style (Sleek Gradient & Theme-Safe)
  const ctaButtonClass = isPoros
    ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-600/20"
    : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/20";

  // =========================================================================
  // KASUS 1: PENGAJUAN IZIN / SAKIT / DINAS LUAR
  // =========================================================================
  if (todayRecord?.statusKehadiran && ["izin", "sakit", "dinas_luar"].includes(todayRecord.statusKehadiran)) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden p-4 rounded-2xl border bg-gradient-to-br from-amber-50/90 via-background to-amber-50/40 dark:from-amber-950/20 dark:via-background dark:to-amber-950/10 border-amber-200/80 dark:border-amber-800/50 shadow-sm transition-all"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 ring-4 ring-amber-100 dark:ring-amber-950/40">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/50">
                  Status: {todayRecord.statusKehadiran.replace("_", " ")}
                </span>
                <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                  {userCluster}
                </Badge>
              </div>
              <h4 className="text-sm md:text-base font-bold text-foreground mt-1 truncate">
                Pengajuan Terverifikasi
              </h4>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                "{todayRecord.keteranganIzin || "Pengajuan Anda telah tercatat dalam sistem."}"
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="h-9 text-xs shrink-0 self-end sm:self-center gap-1.5 rounded-xl border-amber-300 dark:border-amber-700/60 hover:bg-amber-50 dark:hover:bg-amber-950/40">
            <Link href="/dashboard/presensi">
              Lihat Riwayat <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  // =========================================================================
  // KASUS 2: SUDAH CHECK-IN & SUDAH CHECK-OUT (Lengkap Selesai Hari Ini)
  // =========================================================================
  if (todayRecord?.jamMasuk && todayRecord?.jamPulang) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden p-4 rounded-2xl border bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/40 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/10 border-emerald-200/80 dark:border-emerald-800/50 shadow-sm transition-all"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 ring-4 ring-emerald-100 dark:ring-emerald-950/40">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/50 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Presensi Hari Ini Selesai
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  LENGKAP
                </span>
              </div>
              <h4 className="text-sm md:text-base font-bold text-foreground mt-1">
                Terima Kasih Atas Dedikasi Anda!
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Masuk: <strong className="text-foreground">{todayRecord.jamMasuk} WIB</strong> &bull; Pulang:{" "}
                <strong className="text-foreground">{todayRecord.jamPulang} WIB</strong>
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="h-9 text-xs shrink-0 self-end sm:self-center gap-1.5 rounded-xl border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
            <Link href="/dashboard/presensi">
              Riwayat Presensi <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  // =========================================================================
  // KASUS 3: SUDAH MASUK, BELUM PULANG (Dalam Jam Kerja / Menjelang Sore)
  // =========================================================================
  if (todayRecord?.jamMasuk && !todayRecord?.jamPulang) {
    if (isTimeForCheckout) {
      // 3A. WAKTU SORE: Waktunya Presensi Pulang (Energetic Sunset Glassmorphism)
      return (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          className="relative overflow-hidden p-4 md:p-5 rounded-2xl border bg-gradient-to-br from-amber-50/95 via-orange-50/60 to-background dark:from-amber-950/30 dark:via-slate-900/80 dark:to-orange-950/20 border-amber-300/90 dark:border-amber-700/60 shadow-[0_4px_20px_-4px_rgba(245,158,11,0.15)] dark:shadow-[0_4px_25px_-4px_rgba(0,0,0,0.5)] transition-all"
        >
          {/* Subtle Ambient Orbs */}
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30 ring-4 ring-orange-100 dark:ring-orange-950/60">
                <Sunset className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/70 px-2.5 py-0.5 rounded-full border border-amber-300/80 dark:border-amber-700/60 flex items-center gap-1">
                    <Sunset className="w-3 h-3 text-orange-500" />
                    Presensi Pulang &bull; Jadwal {jamPulangTarget} WIB
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full border border-border">
                    {wibTimeStr} WIB
                  </span>
                </div>
                <h3 className="text-base md:text-lg font-bold tracking-tight text-foreground mt-1">
                  Jam Kerja Telah Selesai, Waktunya Presensi Pulang!
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tercatat masuk pukul <strong className="text-foreground">{todayRecord.jamMasuk} WIB</strong>. Ambil swafoto kepulangan dan lengkapi ringkasan tugas hari ini.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto">
              <Button
                asChild
                size="sm"
                className="w-full sm:w-auto bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-xs h-10 px-4 rounded-xl shadow-md shadow-orange-600/25 transition-all active:scale-95 gap-2"
              >
                <Link href="/dashboard/presensi">
                  <Camera className="w-4 h-4" />
                  Absen Pulang Sekarang
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      );
    }

    // 3B. WAKTU SIANG: Presensi Masuk Berhasil, Menunggu Jam Pulang
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden p-4 rounded-2xl border bg-gradient-to-br from-emerald-50/80 via-background to-teal-50/30 dark:from-emerald-950/20 dark:via-background dark:to-teal-950/10 border-emerald-200/80 dark:border-emerald-800/50 shadow-sm transition-all"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ring-4 ring-emerald-100 dark:ring-emerald-950/40">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/50">
                  Presensi Masuk Tercatat ({todayRecord.jamMasuk} WIB)
                </span>
                <Badge
                  variant={todayRecord.statusMasuk === "terlambat" ? "destructive" : "default"}
                  className="text-[10px] uppercase font-semibold px-2 py-0"
                >
                  {todayRecord.statusMasuk === "terlambat" ? "Terlambat" : "Tepat Waktu"}
                </Badge>
              </div>
              <h4 className="text-sm md:text-base font-bold text-foreground mt-1">
                Selamat Bekerja & Beraktivitas!
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target Jam Pulang: <strong className="text-foreground">{jamPulangTarget} WIB</strong> &bull; Lokasi: {lokasiKantor}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="h-9 text-xs shrink-0 self-end sm:self-center gap-1.5 rounded-xl border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
            <Link href="/dashboard/presensi">
              Buka Presensi <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </motion.div>
    );
  }

  // =========================================================================
  // KASUS 4: BELUM PRESENSI MASUK (Pagi / Siang Hari)
  // Adaptive Light & Dark Mode Glassmorphism Card
  // =========================================================================
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden p-4 md:p-5 rounded-2xl border transition-all ${
        isPoros
          ? "bg-gradient-to-br from-teal-50/90 via-emerald-50/40 to-background dark:from-teal-950/30 dark:via-slate-900/80 dark:to-emerald-950/20 border-teal-300/80 dark:border-teal-700/50 shadow-[0_4px_20px_-4px_rgba(13,148,136,0.15)] dark:shadow-[0_4px_25px_-4px_rgba(0,0,0,0.5)]"
          : "bg-gradient-to-br from-blue-50/95 via-sky-50/50 to-background dark:from-blue-950/30 dark:via-slate-900/80 dark:to-indigo-950/20 border-blue-200/90 dark:border-blue-800/60 shadow-[0_4px_20px_-4px_rgba(59,130,246,0.15)] dark:shadow-[0_4px_25px_-4px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Subtle Atmospheric Light Spheres */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-blue-400/15 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-8 w-32 h-32 bg-amber-400/10 dark:bg-amber-500/5 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left Side: Glowing Icon + Smart Typography */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-amber-400/25 ring-4 ring-amber-100 dark:ring-amber-950/50">
            {isMorning ? (
              <Sun className="w-6 h-6 animate-spin-slow text-slate-900" />
            ) : (
              <Clock className="w-6 h-6 text-slate-900 animate-pulse" />
            )}
          </div>

          <div>
            {/* Header Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  isPoros
                    ? "text-teal-800 dark:text-teal-300 bg-teal-100/90 dark:bg-teal-950/70 border-teal-300/80 dark:border-teal-700/60"
                    : "text-blue-800 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-950/70 border-blue-200/80 dark:border-blue-800/60"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                {isMorning ? "Presensi Pagi" : "Presensi Masuk"} &bull; Target {jamMasukTarget} WIB
              </span>

              <span className="text-[10px] font-mono text-muted-foreground bg-background/80 dark:bg-black/40 px-2 py-0.5 rounded-full border border-border">
                {wibTimeStr} WIB
              </span>
            </div>

            {/* Title & Body Description */}
            <h3 className="text-base md:text-lg font-bold tracking-tight text-foreground mt-1">
              Halo {userProfile?.namaLengkap?.split(" ")[0] || "Pegawai"}, Anda Belum Presensi Masuk!
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              Pastikan GPS aktif dalam radius kantor (<span className="text-foreground font-medium">{lokasiKantor}</span>) dan lakukan swafoto untuk kehadiran.
            </p>
          </div>
        </div>

        {/* Right Side: Primary CTA Action */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto">
          <Button
            asChild
            size="sm"
            className={`w-full sm:w-auto font-bold text-xs h-10 px-4 rounded-xl gap-2 transition-all active:scale-95 ${ctaButtonClass}`}
          >
            <Link href="/dashboard/presensi">
              <Camera className="w-4 h-4" />
              Absen Masuk Sekarang
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </Button>
        </div>

      </div>
    </motion.div>
  );
}
