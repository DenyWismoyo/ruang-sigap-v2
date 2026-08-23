"use client";

import { motion } from "framer-motion";
import { Clock, TrendingUp, ShieldCheck, Wallet, ArrowUpRight } from "lucide-react";

export function ImpactStatistics() {
  const stats = [
    {
      title: "Efisiensi Waktu",
      value: "80%",
      label: "Lebih Cepat",
      desc: "Memangkas durasi administrasi persuratan dan birokrasi yang berhari-hari menjadi hitungan menit secara otonom.",
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      gradient: "from-blue-500 to-indigo-500",
      border: "border-blue-500/20"
    },
    {
      title: "Efisiensi Anggaran",
      value: "60%",
      label: "Cost Reduction",
      desc: "Menekan drastis biaya material (kertas, tinta), kurir ekspedisi, hingga biaya sewa ruang penyimpanan arsip fisik.",
      icon: Wallet,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      gradient: "from-emerald-400 to-teal-500",
      border: "border-emerald-500/20"
    },
    {
      title: "Produktivitas Tim",
      value: "3x",
      label: "Lipat Tumbuh",
      desc: "Kinerja ASN meningkat tajam. Waktu tidak lagi terbuang untuk melacak dokumen nyasar atau rapat update status.",
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      gradient: "from-amber-400 to-orange-500",
      border: "border-amber-500/20"
    },
    {
      title: "Integritas Audit",
      value: "100%",
      label: "Akurat",
      desc: "Jejak rekam digital anti-manipulasi. Setiap tindakan terenkripsi dan siap diaudit oleh Inspektorat kapan saja.",
      icon: ShieldCheck,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      gradient: "from-purple-400 to-fuchsia-500",
      border: "border-purple-500/20"
    }
  ];

  return (
    <section className="py-24 bg-background relative z-10 border-t border-white/5 overflow-hidden">
      {/* Subtle Dark Mesh Background */}
      <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-6 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <TrendingUp className="w-4 h-4" />
            <span>ROI & Dampak Nyata</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
            Penghematan Berskala Masif.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Sistem ini dirancang dengan presisi bukan sekadar untuk mencatat, melainkan untuk mengubah pengeluaran menjadi penghematan dan lambat menjadi kilat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`p-8 rounded-3xl glass-enterprise border ${stat.border} hover:bg-white/5 transition-all duration-500 group relative overflow-hidden`}
            >
              {/* Background Large Icon */}
              <div className="absolute -top-4 -right-4 p-6 opacity-[0.03] group-hover:opacity-10 group-hover:scale-110 transition-all duration-700 pointer-events-none">
                <stat.icon className="w-32 h-32" />
              </div>

              {/* Glowing Top Edge */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              {/* Icon Badge */}
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className="w-6 h-6" />
              </div>

              {/* Metric Value */}
              <div className="flex items-end gap-2 mb-2 relative z-10">
                <h3 className={`text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br ${stat.gradient}`}>
                  {stat.value}
                </h3>
                <span className="text-sm font-bold text-muted-foreground mb-1.5 flex items-center">
                  <ArrowUpRight className={`w-4 h-4 ${stat.color} mr-1`} />
                  {stat.label}
                </span>
              </div>

              {/* Text Content */}
              <h4 className="font-bold text-foreground mb-3 tracking-tight relative z-10">{stat.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                {stat.desc}
              </p>
              
              {/* Subtle light sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
