"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mailbox, Send, CalendarDays, CheckCircle2, FileText, Bot, Network, ScanLine, Briefcase } from 'lucide-react';
import { MockRuangKerjaCard } from './MockRuangKerjaCard';
import { MockSuratMasukList } from './MockSuratMasukList';
import { MockDashboardStats } from './MockDashboardStats';
import { MockHierarchicalDisposition } from './MockHierarchicalDisposition';
import { MockAIDocumentReader } from './MockAIDocumentReader';
import { cn } from '@/lib/utils';

const TABS = [
  {
    id: 'hierarchical',
    label: 'Disposisi Berjenjang',
    icon: Network,
    description: 'Rantai disposisi tanpa putus dari Kepala Daerah, Kepala Dinas, hingga Staf Pelaksana.'
  },
  {
    id: 'inbox',
    label: 'Manajemen Persuratan',
    icon: Mailbox,
    description: 'Terima, filter, dan kelola ribuan surat masuk dengan antarmuka dual-panel modern.'
  },
  {
    id: 'ai-reader',
    label: 'AI Document Intelligence',
    icon: ScanLine,
    description: 'Kecerdasan buatan mengekstrak data dari PDF surat dan merangkum isi secara instan.'
  },
  {
    id: 'ruang-kerja',
    label: 'Ruang Kerja Terpadu',
    icon: Briefcase,
    description: 'Feed interaktif untuk Tugas, Draf Persetujuan, dan Disposisi di satu tempat.'
  },
  {
    id: 'dashboard',
    label: 'Dashboard Analitika',
    icon: CalendarDays,
    description: 'Pantau kinerja instansi, beban kerja, dan SLA respons surat secara real-time.'
  }
];

export function InteractiveShowcase() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  return (
    <div className="w-full max-w-[1400px] mx-auto py-16 px-4 sm:px-6 relative z-10" data-tenant="sigap">
      
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">
          Berhenti Membayangkan. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--sg-gradient-start))] to-[hsl(var(--sg-gradient-end))]">
            Lihat Bagaimana Ia Bekerja.
          </span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Antarmuka yang dirancang presisi untuk skala enterprise. Rasakan pengalaman SIGAP tanpa perlu mendaftar.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        
        {/* Tabs Selection - Minimalist (Scrollable on mobile) */}
        <div className="w-full lg:w-[320px] flex lg:flex-col gap-2 shrink-0 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide snap-x snap-mandatory px-4 lg:px-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-left py-3 px-4 rounded-xl transition-all duration-300 relative group flex flex-col items-start gap-1.5 border border-transparent min-w-[200px] lg:min-w-0 shrink-0 snap-start",
                  isActive 
                    ? "bg-primary/5 border-primary/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                    : "hover:bg-muted/30 hover:border-border/30"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicatorSigap"
                    className="absolute left-2 right-2 bottom-0 h-1 lg:left-0 lg:top-2 lg:bottom-2 lg:w-1 lg:h-auto bg-primary rounded-t-full lg:rounded-t-none lg:rounded-r-full"
                  />
                )}
                
                <div className="flex items-center gap-4 w-full">
                  <div className={cn(
                    "transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    <tab.icon className="w-5 h-5" />
                  </div>
                  <h3 className={cn(
                    "font-bold text-sm sm:text-base flex-1",
                    isActive ? "text-primary" : "text-foreground"
                  )}>
                    {tab.label}
                  </h3>
                </div>
                
                {isActive && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-xs sm:text-sm leading-relaxed text-muted-foreground pl-9 pr-2"
                  >
                    {tab.description}
                  </motion.p>
                )}
              </button>
            );
          })}
        </div>

        {/* Mock UI Display - Minimalist Browser Window */}
        <div className="w-full flex-1">
          <div className="w-full aspect-auto min-h-[500px] xl:h-[600px] rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden glass-enterprise flex flex-col">
            
            {/* Top Browser-like bar - Clean */}
            <div className="w-full h-10 border-b border-border/30 bg-background/20 backdrop-blur-md flex items-center px-4 gap-2 z-20 shrink-0">
              <div className="flex gap-1.5 mr-4 opacity-70 hover:opacity-100 transition-opacity">
                 <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                 <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="h-6 px-4 rounded-md bg-black/5 dark:bg-white/5 text-[10px] text-muted-foreground/70 font-mono flex items-center justify-center w-full max-w-xs border border-border/20 mx-auto">
                sgp.omnifit.cloud/dashboard
              </div>
              <div className="w-[60px]" /> {/* Spacer to balance flex */}
            </div>

            {/* Render Context based on Tab */}
            <div className="flex-1 w-full relative z-10 bg-transparent overflow-hidden flex flex-col">
              <AnimatePresence mode="wait">
                
                {activeTab === 'hierarchical' && (
                  <motion.div
                    key="hierarchical"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full p-0"
                  >
                    <MockHierarchicalDisposition />
                  </motion.div>
                )}

                {activeTab === 'inbox' && (
                  <motion.div
                    key="inbox"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full p-0"
                  >
                    <MockSuratMasukList />
                  </motion.div>
                )}

                {activeTab === 'ai-reader' && (
                  <motion.div
                    key="ai-reader"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full p-0 flex items-center justify-center bg-white dark:bg-[#0f172a]"
                  >
                    <MockAIDocumentReader />
                  </motion.div>
                )}

                {activeTab === 'ruang-kerja' && (
                  <motion.div
                    key="ruang-kerja"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full p-0"
                  >
                    <MockRuangKerjaCard />
                  </motion.div>
                )}

                {activeTab === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full p-0"
                  >
                    <MockDashboardStats />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
