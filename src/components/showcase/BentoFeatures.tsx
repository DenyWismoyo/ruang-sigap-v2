"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileCheck, Link as LinkIcon, Database, CheckSquare, Zap, FolderSearch, Network } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BentoFeatures() {
  const features = [
    {
      title: "Siklus Disposisi Cerdas",
      description: "Alur surat terstruktur: input otomatis menjadi agenda, diteruskan ke Pimpinan untuk disposisi, hingga pelaporan tindak lanjut oleh penerima.",
      icon: <Network className="w-6 h-6 text-blue-500" />,
      className: "md:col-span-2 md:row-span-2 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20",
      content: (
        <div className="mt-4 flex flex-col gap-2 relative">
           <div className="absolute left-[11px] top-6 bottom-6 w-[2px] bg-border/50 z-0" />
           <div className="w-full bg-background/50 rounded-lg border border-border p-3 flex justify-between items-center relative z-10 shadow-sm">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-xs font-medium">Input & Agenda</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">Selesai</span>
           </div>
           <div className="w-[calc(100%-1rem)] bg-background/50 rounded-lg border border-border p-3 flex justify-between items-center ml-4 relative z-10 shadow-sm">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500" />
                 <span className="text-xs font-medium">Disposisi Pimpinan</span>
              </div>
              <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-semibold">Diteruskan</span>
           </div>
           <div className="w-[calc(100%-2rem)] bg-card rounded-lg border border-primary/50 p-3 flex justify-between items-center ml-8 shadow-sm relative z-10">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                 <span className="text-xs font-bold text-primary">Tindak Lanjut & Laporan</span>
              </div>
              <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-semibold animate-pulse">Menunggu</span>
           </div>
        </div>
      )
    },
    {
      title: "Surat Lintas OPD",
      description: "Kirim surat antar dinas atau instansi secara elektronik dalam hitungan detik. Tanpa kurir fisik.",
      icon: <LinkIcon className="w-5 h-5 text-purple-500" />,
      className: "md:col-span-1 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent",
      content: null
    },
    {
      title: "Repositori Tersentral",
      description: "Penyimpanan arsip digital dengan pencarian super cepat layaknya Google Search.",
      icon: <Database className="w-5 h-5 text-amber-500" />,
      className: "md:col-span-1 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent",
      content: null
    },
    {
      title: "Kanban Checklist",
      description: "Papan visual untuk memantau progres tugas harian Anda dari To Do, In Progress, hingga Done.",
      icon: <CheckSquare className="w-5 h-5 text-emerald-500" />,
      className: "md:col-span-1 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent",
      content: null
    },
    {
      title: "Agenda Otomatis",
      description: "Sistem otomatis membuatkan jadwal dan mengingatkan Anda 1 jam sebelum undangan rapat dimulai.",
      icon: <Zap className="w-6 h-6 text-rose-500" />,
      className: "md:col-span-2 border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent",
      content: (
        <div className="mt-4 p-4 rounded-xl border border-border bg-background/50 flex gap-4 items-center">
           <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex flex-col items-center justify-center shrink-0 border border-rose-500/20">
              <span className="text-[10px] font-bold text-rose-500 uppercase">Agu</span>
              <span className="text-lg font-black text-rose-600">30</span>
           </div>
           <div>
              <p className="text-sm font-bold text-foreground">Rapat Paripurna DPRD</p>
              <p className="text-xs text-muted-foreground mt-0.5">Otomatis ditambahkan dari Surat No. 123/DPRD</p>
           </div>
        </div>
      )
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[minmax(180px,auto)] gap-4 w-full">
      {features.map((feature, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className={cn(
            "p-6 sm:p-8 rounded-3xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden flex flex-col relative group hover:border-foreground/20 transition-colors",
            feature.className
          )}
        >
          <div className="mb-4 bg-background/80 w-12 h-12 rounded-2xl flex items-center justify-center border border-border shadow-sm group-hover:scale-110 transition-transform duration-300">
            {feature.icon}
          </div>
          <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">{feature.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1">{feature.description}</p>
          
          {feature.content && (
             <div className="mt-6 flex-1 w-full">
                {feature.content}
             </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
