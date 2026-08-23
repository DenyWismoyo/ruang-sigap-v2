"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, ArrowRight, UserCheck, CheckCircle2, ChevronRight, Send, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DispositionNode {
  id: string;
  role: string;
  name: string;
  level: number;
  status: 'pending' | 'processing' | 'done';
  message?: string;
  delay: number;
}

const DISPOSITION_FLOW: DispositionNode[] = [
  { id: '1', role: 'Kepala Daerah', name: 'Bupati / Walikota', level: 0, status: 'done', message: 'Segera tindak lanjuti undangan kementerian ini. Koordinasikan dengan BAPPEDA.', delay: 0 },
  { id: '2', role: 'Kepala Perangkat Daerah', name: 'Kepala Dinas Kominfo', level: 1, status: 'done', message: 'Siapkan bahan presentasi SPBE. Kabid e-Gov harap pimpin tim.', delay: 2000 },
  { id: '3', role: 'Kepala Perangkat Daerah', name: 'Kepala BAPPEDA', level: 1, status: 'done', message: 'Siapkan data statistik pencapaian RPJMD terkait.', delay: 3000 },
  { id: '4', role: 'Pejabat Administrator', name: 'Kepala Bidang E-Government', level: 2, status: 'done', message: 'Staf fungsional segera susun slide dan kumpulkan data infrastruktur.', delay: 5000 },
  { id: '5', role: 'Staf Pelaksana', name: 'Fungsional Pranata Komputer', level: 3, status: 'done', message: 'Siap laksanakan. Laporan segera diselesaikan.', delay: 7000 },
];

export function MockHierarchicalDisposition() {
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];
    
    // Animate flow sequentially
    DISPOSITION_FLOW.forEach(node => {
      const t1 = setTimeout(() => {
        setActiveNodes(prev => prev.includes(node.id) ? prev : [...prev, node.id]);
      }, node.delay);
      
      const t2 = setTimeout(() => {
        setCompletedNodes(prev => prev.includes(node.id) ? prev : [...prev, node.id]);
      }, node.delay + 1500); // 1.5s after appearing, mark as done
      
      timeouts.push(t1, t2);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full h-full p-6 md:p-10 flex flex-col relative bg-white dark:bg-[#0f172a] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div>
          <h3 className="text-[28px] font-bold text-[#1a56db] dark:text-[#3b82f6] flex items-center gap-3">
            <Network className="w-8 h-8 text-slate-800 dark:text-slate-200" />
            Rantai Disposisi Lintas Jenjang
          </h3>
          <p className="text-base text-slate-500 mt-1">Lacak instruksi dari Kepala Daerah hingga staf pelaksana secara real-time</p>
        </div>
        <div className="hidden sm:flex px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-semibold items-center gap-2 border border-emerald-200 dark:border-emerald-800 shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Tracking
        </div>
      </div>

      <div className="flex-1 flex flex-col relative max-w-3xl mx-auto w-full">
        {/* Vertical line connector */}
        <div className="absolute left-6 sm:left-10 top-4 bottom-10 w-0.5 bg-border/40 z-0" />

        <div className="flex flex-col gap-6 relative z-10 w-full pb-10">
          <AnimatePresence>
            {DISPOSITION_FLOW.map((node, index) => {
              const isVisible = activeNodes.includes(node.id);
              const isDone = completedNodes.includes(node.id);
              
              if (!isVisible) return null;

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -20, y: 10 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.5, type: 'spring' }}
                  className="relative flex w-full"
                  style={{ marginLeft: `${node.level * (window.innerWidth < 640 ? 1 : 2)}rem` }}
                >
                  {/* Status Indicator */}
                  <div className="relative mt-3 shrink-0 flex items-start justify-center w-12 sm:w-20">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 relative shadow-sm border",
                      isDone 
                        ? "bg-primary text-primary-foreground border-primary/20 shadow-primary/20" 
                        : "bg-background text-muted-foreground border-border animate-pulse"
                    )}>
                      {isDone ? <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" /> : <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className={cn(
                    "flex-1 p-5 sm:p-6 rounded-xl border transition-all duration-300 relative overflow-hidden",
                    isDone 
                      ? "bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700 shadow-sm" 
                      : "bg-slate-50 dark:bg-[#0f172a] border-dashed border-slate-300 dark:border-slate-600"
                  )}>
                    {isDone && (
                      <div className="absolute -top-4 -right-4 p-3 opacity-[0.02]">
                        <Network className="w-32 h-32" />
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2 relative z-10">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] sm:text-xs font-bold px-2.5 py-1 bg-[#eff6ff] text-[#1d4ed8] dark:bg-[#1e3a8a]/30 dark:text-[#60a5fa] rounded-md uppercase tracking-wider whitespace-nowrap">
                          Lvl {node.level}
                        </span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-1">{node.role}</h4>
                      </div>
                      <span className="text-[10px] sm:text-xs text-slate-500 font-medium flex items-center gap-1.5">
                         {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> : <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"/>}
                         {isDone ? 'Disposisi Terkirim' : 'Memproses...'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-4 relative z-10">{node.name}</p>
                    
                    {isDone && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 flex gap-3 mt-4 relative z-10"
                      >
                        <Send className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground italic leading-relaxed">
                          "{node.message}"
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
