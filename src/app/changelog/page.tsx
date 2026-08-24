"use client";

import React from 'react';
import { PublicPageLayout } from "@/components/public/PublicPageLayout";
import { History, Rocket, Wrench, Shield, Sparkles, BrainCircuit, Users, LayoutDashboard, BookOpen, Globe } from "lucide-react";

const phases = [
  {
    version: "Fase I — MVP",
    period: "Agustus – Oktober 2025",
    tag: "Fondasi",
    tagColor: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    icon: <Wrench className="w-5 h-5 text-slate-500" />,
    iconBg: "bg-slate-100 dark:bg-slate-800",
    title: "Persuratan & Disposisi Dasar",
    description: "Membangun fondasi sistem persuratan elektronik yang layak pakai sebagai pengganti manual.",
    changes: [
      "Form input surat masuk lengkap (nomor, perihal, pengirim, tanggal, jenis, lampiran PDF).",
      "Kotak masuk dengan filter status & jenis surat.",
      "Disposisi sederhana: memilih penerima jabatan, catatan, dan batas waktu.",
      "Lifecycle awal: Baru → Didisposisikan → Selesai.",
      "Agenda harian terintegrasi dengan data surat.",
      "Autentikasi Firebase Auth dengan Google OAuth.",
      "Isolasi data multi-OPD (multi-tenant) via Firestore Security Rules.",
    ]
  },
  {
    version: "Fase II — AI & Manajemen User",
    period: "November 2025 – Januari 2026",
    tag: "Ekspansi",
    tagColor: "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300",
    icon: <BrainCircuit className="w-5 h-5 text-purple-500" />,
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
    title: "Integrasi AI, Pengelolaan Jabatan & Arsip",
    description: "Menghadirkan otomasi AI untuk mempercepat input surat dan membangun pengelolaan pengguna berbasis hierarki jabatan.",
    changes: [
      "Manajemen role & jabatan struktural (Eselon II/III/IV/Pelaksana) per OPD.",
      "Panel Admin untuk registrasi pegawai dan pemetaan jabatan.",
      "AI Input Surat: ekstraksi otomatis data surat dari scan PDF via Gemini AI.",
      "AI Saran Disposisi: rekomendasi penerima berdasarkan isi surat dan hierarki jabatan.",
      "Pencarian full-text dengan indeks searchKeywords[].",
      "Modul Arsip digital dengan penanda warna dan kategori.",
      "Preview PDF terenkripsi langsung dalam aplikasi.",
    ]
  },
  {
    version: "Fase III — Ruang Kerja & Tindak Lanjut",
    period: "Februari – April 2026",
    tag: "Peningkatan Mayor",
    tagColor: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300",
    icon: <Rocket className="w-5 h-5 text-blue-500" />,
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    title: "Command Center, Disposisi Berjenjang & Laporan",
    description: "Transformasi dari aplikasi surat menjadi pusat kendali kerja harian terintegrasi untuk seluruh pejabat.",
    changes: [
      "Ruang Kerja: feed terpadu menggabungkan antrian disposisi, tugas aktif, dan agenda.",
      "Alur Disposisi Berjenjang multi-level dengan lacak status di setiap level.",
      "Tindak Lanjut Disposisi: laporan progres, lampiran bukti, penanda selesai oleh pelaksana.",
      "Tab Pemantauan real-time bagi pimpinan untuk memantau disposisi yang dikirim.",
      "Manajemen Tugas mandiri (Quick Add, Edit, Checklist Task).",
      "Notulensi rapat terintegrasi dengan Agenda.",
      "Dukungan PWA penuh: offline queue (IndexedDB), install prompt Android & iOS.",
    ]
  },
  {
    version: "Fase IV — Logbook & Backend Enterprise",
    period: "Mei – Juli 2026",
    tag: "Kinerja & AI",
    tagColor: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300",
    icon: <BookOpen className="w-5 h-5 text-emerald-500" />,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
    title: "Logbook Terintegrasi & Fitur Enterprise",
    description: "Melengkapi siklus kinerja ASN dengan pencatatan otomatis ke Logbook dan menghadirkan fitur backend yang canggih.",
    changes: [
      "Logbook Harian: buku catatan digital per ASN dengan kategori dan waktu kegiatan.",
      "Auto-Logbook: setiap aksi sistem otomatis mencatat entri ke Logbook (writeLogbookEntry).",
      "Rekap E-Kinerja bulanan ke PDF dan upload langsung ke Google Drive.",
      "SigapCopilot: asisten AI percakapan yang memahami konteks surat.",
      "AI Suggest Eskalasi untuk surat yang melampaui batas waktu penyelesaian.",
      "AI Grammar & Copywriter untuk catatan disposisi dan laporan.",
      "FCM Push Notification real-time ke perangkat pengguna.",
      "Global Search lintas-modul (surat, jabatan, arsip).",
      "Rekap Surat: dashboard agregasi statistik persuratan untuk pimpinan.",
    ]
  },
  {
    version: "Fase V — Skala Daerah",
    period: "Agustus 2026 — Sekarang",
    tag: "Implementasi Penuh",
    tagColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    icon: <Globe className="w-5 h-5 text-amber-600" />,
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    title: "Disposisi Berjenjang Lintas Instansi & Halaman Publik",
    description: "Alur disposisi topdown dari Kepala Daerah hingga pelaksana lapangan, siap diimplementasikan di skala pemerintah daerah.",
    changes: [
      "Disposisi Multi-Level Cross-Jabatan: melewati 5+ level dengan lacak penuh di setiap node.",
      "Disposition Tracker: visualisasi tree/timeline dari Kepala Daerah hingga pelaksana.",
      "Riwayat Disposisi lengkap per dokumen surat (log setiap catatan & perubahan status).",
      "Audit Trail (Activity Log) per surat untuk keperluan non-repudiation.",
      "Dukungan jabatan PLT (Pelaksana Tugas) pada alur disposisi.",
      "Modul Pengumuman Instansi dari Admin ke seluruh pegawai.",
      "Beranda Smart Greeting personal berdasarkan waktu dan peran jabatan.",
      "Portal informasi publik komprehensif: Landing Page, Halaman Fitur, Keamanan, Replikasi, Changelog.",
    ]
  }
];

export default function ChangelogPage() {
  return (
    <PublicPageLayout>
      <section className="pt-32 pb-16 bg-muted/30 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-[-50%]" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <History className="w-4 h-4" />
            <span>Rekam Jejak Pembangunan Sistem</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">
            Riwayat Pengembangan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Roadmap nyata pembangunan sistem SIGAP dari Agustus 2025 hingga kini — setiap fitur yang tercantum di sini telah diimplementasikan dan berjalan di produksi.
          </p>
        </div>
      </section>

      <section className="py-20 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="space-y-16 relative before:absolute before:inset-0 before:ml-[19px] md:before:ml-[8.5rem] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            
            {phases.map((phase, index) => (
              <div key={index} className="relative flex flex-col md:flex-row gap-6 md:gap-8 group">
                
                {/* Tanggal (Desktop Only) */}
                <div className="hidden md:flex w-28 shrink-0 flex-col items-end pt-2 gap-1">
                  <span className="text-xs font-bold text-muted-foreground text-right leading-tight">{phase.period}</span>
                </div>

                {/* Node Icon */}
                <div className={`absolute left-0 md:relative md:left-auto flex items-center justify-center w-10 h-10 rounded-full border-4 border-background ${phase.iconBg} shadow shrink-0 z-10`}>
                  {phase.icon}
                </div>

                {/* Card Konten */}
                <div className="ml-14 md:ml-0 bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex-1 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${phase.tagColor}`}>
                      {phase.version}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${phase.tagColor}`}>
                      {phase.tag}
                    </span>
                    {/* Tanggal Mobile */}
                    <span className="md:hidden text-xs font-semibold text-muted-foreground ml-auto">{phase.period}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-2">{phase.title}</h3>
                  <p className="text-muted-foreground text-sm mb-5 leading-relaxed">{phase.description}</p>
                  
                  <ul className="space-y-2.5">
                    {phase.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/80">
                        <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
