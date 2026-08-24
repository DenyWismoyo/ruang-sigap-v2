"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Server, ShieldCheck, HardDrive, Check, Info, Lock, Activity, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TIERS = [
  {
    name: "Skala Kecil",
    price: "500.000",
    description: "Kapasitas ideal untuk instansi tingkat kelurahan/desa atau unit kerja dengan lalu lintas surat ringan.",
    users: 20,
    letters: 500,
    features: [
      "Infrastruktur Cloud SPBE",
      "Backup & Mirroring Data",
      "Enkripsi Keamanan (AES-256)",
      "Pemeliharaan Sistem & BSSN",
      "Dukungan Teknis Instansi"
    ],
    highlighted: false
  },
  {
    name: "Skala Menengah",
    price: "1.000.000",
    description: "Kapasitas standar untuk instansi tingkat kecamatan atau OPD skala kecil dengan administrasi rutin.",
    users: 50,
    letters: 1000,
    features: [
      "Infrastruktur Cloud SPBE",
      "Backup & Mirroring Data",
      "Enkripsi Keamanan (AES-256)",
      "Pemeliharaan Sistem & BSSN",
      "Dukungan Teknis Instansi"
    ],
    highlighted: false
  },
  {
    name: "Skala Besar",
    price: "1.500.000",
    description: "Sangat direkomendasikan untuk instansi tingkat dinas/badan dengan aktivitas persuratan tinggi.",
    users: 75,
    letters: 2500,
    features: [
      "Infrastruktur Cloud SPBE",
      "Backup & Mirroring Data",
      "Enkripsi Keamanan (AES-256)",
      "Pemeliharaan Sistem & BSSN",
      "Dukungan Teknis Instansi"
    ],
    highlighted: true
  },
  {
    name: "Skala Enterprise",
    price: "3.500.000",
    description: "Kapasitas maksimal untuk tingkat sekretariat daerah atau instansi berskala sangat besar.",
    users: 150,
    letters: 10000,
    features: [
      "Infrastruktur Cloud SPBE",
      "Backup & Mirroring Data",
      "Enkripsi Keamanan (AES-256)",
      "Pemeliharaan Sistem & BSSN",
      "Dukungan Teknis Instansi"
    ],
    highlighted: false
  }
];

export function InfrastructureSupportTiers() {
  return (
    <section className="relative w-full py-24 sm:py-32 bg-background border-t border-border/50 overflow-hidden">
      
      {/* Background Ornaments */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        
        {/* Header Section */}
        <div className="text-center max-w-5xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold mb-6"
          >
            <Server className="w-4 h-4" />
            <span>Kepatuhan Standar SPBE</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6"
          >
            Skema Pemeliharaan & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Infrastruktur Cloud</span>
          </motion.h2>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-muted/30 border border-border/50 rounded-2xl p-5 sm:p-8 backdrop-blur-sm relative overflow-hidden shadow-sm mt-8"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-left">
               
               {/* Point 1: Hak Milik & Lisensi (Full Width) */}
               <div className="flex items-start gap-3 md:col-span-2 border-b border-border/50 pb-4">
                 <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   Inovasi ini berawal dari proyek perubahan Diklat PKP di <strong className="text-foreground">Kecamatan Banjarsari, Kota Surakarta</strong> (didukung APBD). Karena perangkat lunak (<i>software</i>) ini berstatus hak milik instansi pemerintah, maka aplikasi ini <strong className="text-foreground">bebas lisensi untuk direplikasi</strong> oleh OPD lain tanpa biaya pembelian sistem.
                 </p>
               </div>

               {/* Point 2: Pembayaran Cloud & SPJ */}
               <div className="flex items-start gap-3">
                 <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   <strong className="text-foreground">Mekanisme Pembayaran & SPJ:</strong> Tagihan murni untuk <i>Cloud Storage</i> (Google Cloud). Bendahara menyetor via <i>Payment Gateway</i> resmi (Mayar.id) yang otomatis menerbitkan <strong>Kwitansi & Faktur Pajak Standar (DJP)</strong> untuk syarat mutlak kelengkapan SPJ.
                 </p>
               </div>

               {/* Point 3: Legalitas Pengadaan Layanan Cloud */}
               <div className="flex items-start gap-3">
                 <Cloud className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   <strong className="text-foreground">Legalitas Pengadaan Layanan Cloud:</strong> Sewa layanan komputasi awan adalah pengadaan modern yang diakui LKPP. OPD dapat menggeser <strong>Belanja Modal</strong> (ratusan juta untuk server fisik) menjadi <strong>Belanja Jasa/Sewa Operasional</strong> yang jauh lebih efisien.
                 </p>
               </div>

               {/* Point 4: Berbagi Pakai SPBE */}
               <div className="flex items-start gap-3">
                 <ShieldCheck className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   <strong className="text-foreground">Dukungan Berbagi Pakai SPBE:</strong> Replikasi inovasi sangat didorong oleh KemenPAN-RB guna mencegah <i>reinventing the wheel</i> (pemborosan). Mengadopsi sistem yang teruji mempercepat kenaikan Indeks SPBE tanpa risiko gagal *development*.
                 </p>
               </div>

               {/* Point 5: Kedaulatan & Keamanan Data (BSSN) */}
               <div className="flex items-start gap-3">
                 <Lock className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                 <p className="text-muted-foreground text-sm leading-relaxed">
                   <strong className="text-foreground">Kedaulatan Data & Standar BSSN:</strong> Sesuai amanat PP PSTE, seluruh arsip disimpan di <strong>Data Center Region Domestik (Indonesia)</strong> dengan <i>End-to-End Encryption</i> yang mematuhi pedoman audit keamanan siber <strong>BSSN</strong>.
                 </p>
               </div>

            </div>
          </motion.div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {TIERS.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={cn(
                "relative rounded-3xl p-6 sm:p-8 flex flex-col transition-all duration-300",
                tier.highlighted 
                  ? "bg-gradient-to-b from-primary/10 to-transparent border-2 border-primary shadow-xl shadow-primary/10 scale-100 lg:scale-105 z-10" 
                  : "glass-enterprise border border-border/50 shadow-lg hover:border-primary/50"
              )}
            >
              {tier.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                  Rekomendasi
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{tier.name}</h3>
                <p className="text-xs text-muted-foreground line-clamp-2 h-8">{tier.description}</p>
              </div>

              <div className="mb-6 pb-6 border-b border-border/50">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-muted-foreground">Rp</span>
                  <span className="text-3xl font-extrabold text-foreground tracking-tight">{tier.price}</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">/ bulan (Biaya Infrastruktur)</span>
              </div>

              {/* Capacities */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-blue-600" />
                     </div>
                     <span className="text-xs font-bold text-foreground">Kapasitas Pengguna</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{tier.users}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/30">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-md bg-emerald-500/10 flex items-center justify-center">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
                     </div>
                     <span className="text-xs font-bold text-foreground">Alokasi Surat</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{tier.letters}</span>
                </div>
              </div>

              {/* Features List */}
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Termasuk Layanan:</p>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary" />
                      </div>
                      <span className="text-sm text-foreground/80 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                className={cn(
                  "w-full h-11 font-bold rounded-xl transition-all shadow-sm",
                  tier.highlighted ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted hover:bg-muted/80 text-foreground"
                )}
              >
                Pilih Skema Ini
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Security / Compliance Badges */}
        <div className="mt-20 pt-10 border-t border-border/50 flex flex-wrap justify-center gap-6 sm:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <span className="text-sm font-bold text-foreground">Standar Kemanan BSSN</span>
           </div>
           <div className="flex items-center gap-2">
              <Cloud className="w-6 h-6 text-blue-500" />
              <span className="text-sm font-bold text-foreground">Data Center Domestik</span>
           </div>
           <div className="flex items-center gap-2">
              <Lock className="w-6 h-6 text-purple-500" />
              <span className="text-sm font-bold text-foreground">Enkripsi End-to-End</span>
           </div>
        </div>

      </div>
    </section>
  );
}

// Utility function (if cn is not available via import, you can define it or ensure it's in the project)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
