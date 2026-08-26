"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const comparisonData = [
  {
    feature: "Pelacakan Status Surat",
    oldWay: "Tanya via WhatsApp atau telepon ke staf secara manual.",
    sigapWay: "Real-time tracking dashboard dengan riwayat disposisi detail."
  },
  {
    feature: "Laporan Kinerja & Logbook",
    oldWay: "Rekap manual dari buku agenda setiap akhir bulan.",
    sigapWay: "Di-generate otomatis dari aktivitas harian di sistem."
  },
  {
    feature: "Biaya Operasional",
    oldWay: "Pengadaan kertas, tinta, kurir, dan server fisik mahal.",
    sigapWay: "Biaya langganan terjangkau, paperless, berbasis cloud."
  },
  {
    feature: "Waktu Implementasi (Onboarding)",
    oldWay: "Berbulan-bulan untuk setup dan pelatihan.",
    sigapWay: "Kurang dari 1 minggu siap digunakan (Go-Live)."
  },
  {
    feature: "Aksesibilitas Tanpa Internet",
    oldWay: "Tidak bisa bekerja tanpa koneksi ke server lokal.",
    sigapWay: "PWA Offline-Ready. Data disinkronkan saat online kembali."
  }
];

export function ComparisonTable() {
  return (
    <section className="py-24 bg-background relative z-10 border-t border-border/50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transformasi Cara Kerja</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
            Cara Lama vs <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">SIGAP</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tinggalkan birokrasi kertas yang lambat. Beralih ke sistem cerdas yang menghemat waktu dan anggaran secara nyata.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border/50 shadow-xl bg-card">
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Header */}
            <div className="hidden md:flex items-center p-6 bg-muted/50 border-b md:border-b-0 md:border-r border-border/50 font-bold text-foreground">
              Aspek Operasional
            </div>
            <div className="flex items-center justify-center md:justify-start p-6 bg-rose-500/5 border-b md:border-b-0 md:border-r border-border/50 font-bold text-rose-600 dark:text-rose-400">
              <span className="md:hidden mr-2">vs</span> Cara Lama
            </div>
            <div className="flex items-center justify-center md:justify-start p-6 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-400 text-lg">
              SIGAP E-Office
            </div>

            {/* Rows */}
            {comparisonData.map((row, index) => (
              <React.Fragment key={index}>
                <div className="p-6 md:p-8 bg-muted/10 border-t border-border/50 font-semibold text-foreground md:border-r flex items-center">
                  {row.feature}
                </div>
                <div className="p-6 md:p-8 bg-rose-500/5 border-t border-border/50 text-muted-foreground md:border-r flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center">
                    <X className="w-3 h-3 text-rose-500" />
                  </div>
                  <span className="text-sm leading-relaxed">{row.oldWay}</span>
                </div>
                <div className="p-6 md:p-8 bg-emerald-500/5 border-t border-border/50 text-foreground font-medium flex items-start gap-3 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-500" />
                  </div>
                  <span className="text-sm leading-relaxed relative z-10">{row.sigapWay}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
