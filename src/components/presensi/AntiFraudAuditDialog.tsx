"use client";

import React from "react";
import { PresensiRecord, PresensiAntiFraudAudit } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  MapPin,
  Laptop,
  CheckCircle2,
  Activity,
} from "lucide-react";

interface AntiFraudAuditDialogProps {
  record: PresensiRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AntiFraudAuditDialog({
  record,
  open,
  onOpenChange,
}: AntiFraudAuditDialogProps) {
  if (!record) return null;

  const auditMasuk = record.antiFraudAudit;
  const auditPulang = record.antiFraudAuditPulang;

  const renderAuditSection = (title: string, audit?: PresensiAntiFraudAudit) => {
    if (!audit) {
      return (
        <div className="p-4 rounded-xl border border-border/60 bg-muted/30 text-xs text-muted-foreground text-center">
          Data audit anti-fraud {title.toLowerCase()} belum tercatat untuk presensi ini.
        </div>
      );
    }

    const isHigh = audit.riskLevel === "high" || audit.fraudScore >= 60;
    const isSuspicious = audit.riskLevel === "suspicious" || (audit.fraudScore >= 35 && audit.fraudScore < 60);

    const scoreColor = isHigh
      ? "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40"
      : isSuspicious
      ? "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40"
      : "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40";

    return (
      <div className="p-4 rounded-xl border border-border/70 bg-card space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-sm text-foreground">{title}</h4>
          </div>
          <div className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${scoreColor}`}>
            Skor Resiko: {audit.fraudScore} / 100 ({audit.riskLevel.toUpperCase()})
          </div>
        </div>

        {/* Metrik Indikator */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-medium flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Akurasi GPS
            </span>
            <div className="font-mono font-bold text-foreground">
              {audit.gpsAccuracyMeters !== undefined ? `${audit.gpsAccuracyMeters} meter` : "-"}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {audit.isMockGpsSuspected
                ? "⚠️ Mock/Fake GPS Suspek"
                : audit.gpsAccuracyMeters === 0
                ? "⚠️ 0m (Mock/Emulator)"
                : audit.gpsAccuracyMeters < 1.5
                ? "⚠️ Terlalu presisi"
                : "Normal Satelit"}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" /> Deviasi Jam
            </span>
            <div className="font-mono font-bold text-foreground">
              {audit.clockDriftSeconds !== undefined ? `${Math.abs(audit.clockDriftSeconds)} dtk` : "-"}
            </div>
            <span className="text-[10px] text-muted-foreground">
              {audit.isClockDriftSuspected
                ? "⚠️ Drift > 3 Menit"
                : "Sinkron NTP WIB"}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 space-y-0.5 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-muted-foreground uppercase font-medium flex items-center gap-1">
              <Laptop className="w-3 h-3" /> Otomasi Web
            </span>
            <div className="font-mono font-bold text-foreground">
              {audit.isBotSuspected ? "Terdeteksi Bot 🚨" : "Alami (User)"}
            </div>
            <span className="text-[10px] text-muted-foreground truncate block">
              {audit.deviceInfo?.platform || (audit.deviceInfo?.isMobile ? "Ponsel Mobile" : "Desktop Browser")}
            </span>
          </div>
        </div>

        {/* Daftar Anomali Terdeteksi */}
        <div>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Temuan Forensik & Anomali:
          </span>
          {audit.anomaliesDetected && audit.anomaliesDetected.length > 0 ? (
            <div className="space-y-1.5">
              {audit.anomaliesDetected.map((ano: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 font-medium"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-500" />
                  <span>{ano}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span>Tidak terdeteksi anomali. Presensi valid dan sesuai standar integritas.</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                Laporan Forensik Anti-Fraud Presensi
              </DialogTitle>
              <DialogDescription className="text-xs">
                Analisis anomali GPS, integritas waktu perangkat, dan telemetri browser pegawai.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Ringkasan Profil Pegawai */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <div className="font-bold text-foreground text-sm">{record.namaLengkap}</div>
            <div className="text-muted-foreground font-mono text-[11px]">
              NIP: {record.userNip || "-"} &bull; {record.namaJabatan || "Staf"}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-muted-foreground">{record.tanggal}</div>
            <Badge variant="outline" className="text-[10px] uppercase font-mono mt-0.5">
              Klaster: {record.klasterStruktur || "umum"}
            </Badge>
          </div>
        </div>

        {/* Section Audit Masuk & Pulang */}
        <div className="space-y-4">
          {renderAuditSection("Audit Sesi Masuk (Check-In)", auditMasuk)}
          {renderAuditSection("Audit Sesi Pulang (Check-Out)", auditPulang)}
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Tutup Laporan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
