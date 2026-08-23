"use client";

import { motion } from "framer-motion";
import { 
  Inbox, 
  CheckSquare, 
  MessageSquareOff, 
  FileSearch, 
  ArrowRight,
  XCircle,
  CheckCircle2,
  BellRing,
  ShieldCheck,
  Zap,
  Target
} from "lucide-react";

export function PainPointsShowcase() {
  const painPoints = [
    {
      id: "surat-hilang",
      icon: Inbox,
      pain: "Surat Masuk Hilang di Tray Meja",
      painAnalogy: "Seperti kotak saran berdebu yang tertempel di dinding dan tak pernah dibuka. Surat fisik tertumpuk, terlupakan, tanpa notifikasi atau tenggat waktu yang jelas.",
      cure: "Dashboard Instan & Notifikasi",
      cureAnalogy: "Setiap surat masuk langsung memicu Push Notification. Terdapat penanda SLA waktu tunggu, memastikan tidak ada dokumen yang bisa 'bersembunyi' dari pimpinan.",
      iconPain: XCircle,
      iconCure: BellRing
    },
    {
      id: "disposisi-gelap",
      icon: CheckSquare,
      pain: "Tidak Tahu Status Tindak Lanjut",
      painAnalogy: "Seperti mengirim surat pos tanpa resi. Pimpinan seringkali tidak tahu apakah instruksinya sudah dibaca, sedang dikerjakan, atau malah diabaikan oleh staf.",
      cure: "Tanda Terima Digital Real-time",
      cureAnalogy: "Pimpinan menerima update seketika saat staf menekan [Terima Disposisi], saat laporan diketik, hingga tombol [Selesai] ditekan. Nol tebak-tebakan.",
      iconPain: XCircle,
      iconCure: Target
    },
    {
      id: "koordinasi-kacau",
      icon: MessageSquareOff,
      pain: "Koordinasi via WhatsApp yang Kacau",
      painAnalogy: "Rapat penting di tengah pasar malam. Instruksi penting tenggelam oleh ratusan chat lain. Tidak ada jejak terpusat, dan rawan penyangkalan.",
      cure: "Ruang Kerja Terstruktur",
      cureAnalogy: "Setiap instruksi memiliki 'kamar' obrolan tersendiri yang terikat pada dokumen terkait. Jejak terekam permanen dengan timestamp akurat.",
      iconPain: XCircle,
      iconCure: ShieldCheck
    },
    {
      id: "rekap-kinerja",
      icon: FileSearch,
      pain: "Rekap Kinerja Berbasis Ingatan",
      painAnalogy: "Seperti diminta dokter mengingat semua makanan yang Anda makan bulan lalu. Hasilnya tidak akurat, menguras waktu berjam-jam, dan bisa dimanipulasi.",
      cure: "Logbook Otomatis (Autonomous)",
      cureAnalogy: "Setiap aksi (klik, laporan, disposisi) otomatis tercatat sebagai e-kinerja di latar belakang. Akhir bulan, cukup 1-klik untuk men-generate laporan PDF presisi.",
      iconPain: XCircle,
      iconCure: Zap
    }
  ];

  return (
    <section className="py-24 bg-background relative z-10 overflow-hidden border-t border-border/50">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold mb-6 border border-rose-500/20">
            <XCircle className="w-4 h-4" />
            <span>Problem Birokrasi Konvensional</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6 max-w-4xl">
            Berapa jam yang Anda buang minggu ini hanya untuk mencari tahu status sebuah surat?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sistem ini tidak sekadar mendigitalkan kertas, melainkan menyembuhkan penyakit kronis dalam rantai birokrasi pemerintahan tradisional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {painPoints.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col h-full rounded-3xl glass-enterprise border border-border/50 overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
            >
              {/* PAIN SECTION (Masa Lalu) */}
              <div className="flex-1 p-8 bg-rose-500/5 relative overflow-hidden group-hover:bg-rose-500/10 transition-colors">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <item.iconPain className="w-32 h-32 text-rose-500" />
                </div>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <item.iconPain className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-rose-700 dark:text-rose-400">Masa Lalu</h4>
                </div>
                
                <h3 className="text-xl font-extrabold text-foreground mb-3">{item.pain}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed relative z-10 italic">
                  "{item.painAnalogy}"
                </p>
              </div>

              {/* TRANSITION DIVIDER */}
              <div className="relative h-px bg-border/50">
                <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground z-10 group-hover:rotate-90 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-500 shadow-sm">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* CURE SECTION (Solusi) */}
              <div className="flex-1 p-8 bg-emerald-500/5 relative overflow-hidden group-hover:bg-emerald-500/10 transition-colors">
                <div className="absolute bottom-0 right-0 p-6 opacity-10 pointer-events-none">
                  <item.iconCure className="w-32 h-32 text-emerald-500" />
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <item.iconCure className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-emerald-700 dark:text-emerald-400">Solusi Digital</h4>
                </div>
                
                <h3 className="text-xl font-extrabold text-foreground mb-3">{item.cure}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed relative z-10">
                  {item.cureAnalogy}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
