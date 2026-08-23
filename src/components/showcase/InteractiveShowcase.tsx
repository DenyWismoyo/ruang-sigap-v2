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
          Antarmuka yang dirancang presisi untuk skala enterprise. Rasakan pengalaman Workspace tanpa perlu mendaftar.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        
        {/* Tabs Selection - Minimalist */}
        <div className="w-full lg:w-[320px] flex flex-col gap-2 shrink-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-left py-4 px-4 rounded-xl transition-all duration-300 relative group flex flex-col items-start gap-2",
                  isActive 
                    ? "bg-primary/5"
                    : "hover:bg-muted/50"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicatorSigap"
                    className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full"
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
          <div className="w-full aspect-auto min-h-[500px] xl:h-[650px] rounded-2xl border border-border/60 shadow-xl relative overflow-hidden bg-white dark:bg-[#0f172a] flex flex-col">
            
            {/* Top Browser-like bar - Clean */}
            <div className="w-full h-12 border-b border-border/50 bg-[#f8fafc] dark:bg-[#1e293b] flex items-center px-4 gap-2 z-20 shrink-0">
              <div className="flex gap-2 mr-4">
                 <div className="w-3 h-3 rounded-full bg-rose-400" />
                 <div className="w-3 h-3 rounded-full bg-amber-400" />
                 <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <div className="h-7 px-4 rounded-md bg-white dark:bg-[#0f172a] text-[11px] text-muted-foreground font-mono flex items-center justify-center w-full max-w-sm border border-border/40 shadow-sm truncate mx-auto">
                sgp.omnifit.cloud/dashboard
              </div>
              <div className="w-[60px]" /> {/* Spacer to balance flex */}
            </div>

            {/* Render Context based on Tab */}
            <div className="flex-1 w-full relative z-10 bg-[#f8fafc] dark:bg-[#0f172a] overflow-hidden flex flex-col">
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
