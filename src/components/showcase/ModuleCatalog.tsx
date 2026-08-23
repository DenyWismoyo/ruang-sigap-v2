"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, Workflow, BrainCircuit, Wallet, Sparkles, CheckSquare, Layers, Shield } from "lucide-react";

export function ModuleCatalog() {
  const [activeTab, setActiveTab] = useState("administrasi");

  const categories = [
    { id: "administrasi", label: "Administrasi & Arsip", icon: FolderKanban },
    { id: "manajemen", label: "Manajemen Kinerja", icon: Workflow },
    { id: "ai", label: "AI & Otomasi", icon: BrainCircuit },
    { id: "fungsional", label: "Ekstensi Fungsional", icon: Wallet },
  ];

  const modules = {
    administrasi: [
      { title: "Manajemen Surat Masuk", desc: "Tampilan dua panel, filter status real-time, in-app PDF viewer." },
      { title: "Surat Lintas OPD", desc: "Kirim surat antar instansi tanpa kurir fisik." },
      { title: "Arsip Digital", desc: "Pencarian super cepat dengan jejak audit lengkap." },
      { title: "Repositori Dokumen", desc: "Struktur folder-subfolder persis seperti Google Drive." },
      { title: "Persetujuan Draf", desc: "Rantai persetujuan (approval) berjenjang sebelum finalisasi." },
      { title: "Surat Keluar", desc: "Manajemen dan penomoran surat keluar instansi." },
    ],
    manajemen: [
      { title: "Disposisi Digital", desc: "Multi-penerima, batas waktu, tembusan, dan eskalasi hierarki." },
      { title: "Logbook Harian", desc: "Auto-entry dari aksi sistem. Progress bar harian." },
      { title: "Laporan Tindak Lanjut", desc: "Kirim laporan yang langsung tersimpan sebagai Bukti Kinerja." },
      { title: "E-Kinerja (Bukti Kinerja)", desc: "Ekspor PDF atau sinkronisasi langsung ke Google Drive." },
      { title: "Agenda Harian", desc: "Terintegrasi dengan jadwal ruang rapat & undangan." },
      { title: "Checklist Board (Kanban)", desc: "Papan visual Todo - In Progress - Done." },
      { title: "Manajemen Tugas", desc: "Sub-tugas, pendelegasian, diskusi, dan prioritas." },
    ],
    ai: [
      { title: "AI Scan Surat (Gemini)", desc: "Ekstraksi metadata dari PDF secara otomatis (pengirim, perihal, dll)." },
      { title: "AI Ringkasan Eksekutif", desc: "Ringkuman inti surat untuk dibaca cepat oleh pimpinan." },
      { title: "AI Notulensi", desc: "Menyusun draft notulensi rapat dengan cerdas." },
      { title: "Notifikasi Push (FCM)", desc: "Pemberitahuan real-time langsung ke smartphone Anda." },
      { title: "Bank Templat Instruksi", desc: "Autofill kalimat instruksi disposisi." },
      { title: "Laporan Kinerja", desc: "Grafik volume surat dan statistik respon per jabatan." },
    ],
    fungsional: [
      { title: "Manajemen Aset", desc: "Pencatatan aset, maintenance, dan peminjaman." },
      { title: "Keuangan & SPJ", desc: "Pencatatan kas dan kertas kerja bendahara." },
      { title: "Pelayanan Publik", desc: "Layanan administrasi masyarakat terintegrasi." },
      { title: "Tata Pemerintahan", desc: "Pencatatan kerja sama dan data wilayah." },
      { title: "Jadwal Tempat", desc: "Booking ruang rapat dengan alur persetujuan." },
      { title: "Knowledge Base", desc: "SOP dan panduan internal instansi." },
    ]
  };

  return (
    <section className="py-24 bg-background relative z-10 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <Layers className="w-4 h-4" />
            <span>Skala Enterprise</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">Ekosistem 28 Modul Terintegrasi.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Sistem dirancang secara modular. Pilih dan aktifkan fitur sesuai kebutuhan instansi Anda.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tabs Menu */}
          <div className="w-full lg:w-1/4 flex flex-col gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl text-left transition-all ${
                  activeTab === cat.id 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground font-medium"
                }`}
              >
                <cat.icon className="w-5 h-5" />
                {cat.label}
              </button>
            ))}
          </div>

          {/* Modules Grid */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {modules[activeTab as keyof typeof modules].map((mod, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all group">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                         <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{mod.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{mod.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
