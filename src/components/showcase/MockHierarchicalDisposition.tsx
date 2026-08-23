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
    <div className="w-full h-full p-4 md:p-6 flex flex-col relative bg-transparent overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 shrink-0">
        <div>
          <h3 className="text-xl font-bold text-primary flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            Rantai Disposisi Lintas Jenjang
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Lacak instruksi dari Kepala Daerah hingga staf pelaksana secara real-time</p>
        </div>
        <div className="hidden sm:flex px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-semibold items-center gap-1.5 border border-emerald-500/20 shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Tracking
        </div>
      </div>

      <div className="flex-1 flex flex-col relative max-w-3xl mx-auto w-full">
        {/* Vertical line connector */}
        <div className="absolute left-5 sm:left-6 top-2 bottom-6 w-px bg-border/40 z-0" />

        <div className="flex flex-col gap-4 relative z-10 w-full pb-6">
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
                  <div className="relative mt-2 shrink-0 flex items-start justify-center w-10 sm:w-12">
                    <div className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-500 z-10 relative shadow-sm border",
                      isDone 
                        ? "bg-primary text-primary-foreground border-primary/20 shadow-primary/20" 
                        : "bg-background/50 backdrop-blur-sm text-muted-foreground border-white/10 animate-pulse"
                    )}>
                      {isDone ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className={cn(
                    "flex-1 p-4 sm:p-5 rounded-xl transition-all duration-300 relative overflow-hidden",
                    isDone 
                      ? "bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/10 shadow-sm" 
                      : "bg-white/20 dark:bg-black/10 backdrop-blur-sm border border-dashed border-white/10"
                  )}>
                    {isDone && (
                      <div className="absolute -top-4 -right-4 p-3 opacity-[0.02]">
                        <Network className="w-32 h-32" />
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1.5 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-md uppercase tracking-wider whitespace-nowrap border border-primary/10">
                          Lvl {node.level}
                        </span>
                        <h4 className="font-bold text-foreground text-xs sm:text-sm line-clamp-1">{node.role}</h4>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                         {isDone ? <CheckCircle2 className="w-3 h-3 text-emerald-500"/> : <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>}
                         {isDone ? 'Disposisi Terkirim' : 'Memproses...'}
                      </span>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-foreground/80 font-medium mb-3 relative z-10">{node.name}</p>
                    
                    {isDone && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-white/5 flex gap-2 mt-3 relative z-10"
                      >
                        <Send className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
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
