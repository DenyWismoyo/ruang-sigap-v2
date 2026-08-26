"use client";

import React, { useState } from 'react';
import { PublicPageLayout } from "@/components/public/PublicPageLayout";
import { dataInstansi, InstansiCategory } from "@/data/instansi";
import { Building2, MapPin, CheckCircle2, ChevronRight, Globe, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstansiPage() {
  // Ambil kategori unik yang ada datanya
  const availableCategories = Array.from(new Set(dataInstansi.map(item => item.category)));
  const [activeTab, setActiveTab] = useState<InstansiCategory | "Semua">("Semua");

  const filteredData = activeTab === "Semua" 
    ? dataInstansi 
    : dataInstansi.filter(item => item.category === activeTab);

  return (
    <PublicPageLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted/30 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-[-50%]" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <Globe className="w-4 h-4" />
            <span>Jejaring Replikasi Nasional</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">
            Dipercaya untuk Mewujudkan Birokrasi Digital
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            SIGAP E-Office lahir dari inovasi ASN untuk ASN. Bergabunglah dengan puluhan instansi lainnya yang telah memodernisasi tata kelola administrasi mereka.
          </p>
        </div>
      </section>

      {/* Directory Section */}
      <section className="py-20 relative z-10 bg-background min-h-[500px]">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Tabs Filter */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <button
              onClick={() => setActiveTab("Semua")}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeTab === "Semua" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
              }`}
            >
              Semua Instansi
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  activeTab === cat 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid Layout */}
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredData.map((instansi) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  key={instansi.id}
                  className="bg-card border border-border/50 rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all group flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {instansi.status}
                    </div>
                  </div>
                  
                  <div className="mb-auto">
                    <h3 className="font-bold text-lg text-foreground mb-1 leading-tight group-hover:text-primary transition-colors">
                      {instansi.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 font-medium">
                      <MapPin className="w-3.5 h-3.5" />
                      {instansi.location}
                    </div>
                    {instansi.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {instansi.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      {instansi.category}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Sejak {instansi.year}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredData.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Belum ada data untuk kategori ini.</p>
            </div>
          )}

        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground tracking-tight mb-6">
            Jadilah Instansi Berikutnya
          </h2>
          <p className="text-primary-foreground/90 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium">
            Bergabung dengan ekosistem kami dan rasakan lompatan produktivitas dalam hitungan minggu.
          </p>
          <button
            onClick={() => window.open(`https://wa.me/6285777117587?text=${encodeURIComponent("Halo, kami dari Instansi ... tertarik untuk mereplikasi sistem SIGAP.")}`, '_blank')}
            className="inline-flex items-center h-12 px-8 text-base font-bold bg-background text-primary hover:bg-background/90 rounded-full shadow-xl transition-all hover:scale-105"
          >
            Mulai Konsultasi Replikasi <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </section>
    </PublicPageLayout>
  );
}
