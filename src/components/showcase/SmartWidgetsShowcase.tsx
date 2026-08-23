"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, MessageSquare, Sparkles, CheckCircle2, ChevronRight, FileText, Send, Palette, ListTodo, Bot, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SmartWidgetsShowcase() {
  const [activeWidget, setActiveWidget] = useState<'batch' | 'quick' | 'portal' | null>(null);

  return (
    <section className="relative w-full py-24 sm:py-32 overflow-hidden bg-background">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="absolute w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold mb-6"
          >
            <Zap className="w-4 h-4" />
            <span>Aksi Cepat Tanpa Gesekan</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6"
          >
            Selesaikan Tugas dari <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Pojok Layar</span> Anda.
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed"
          >
            Fitur cerdas yang mengambang siap sedia. Kapan pun Anda butuh, asisten ini hadir untuk merampingkan alur kerja tanpa perlu berpindah halaman.
          </motion.p>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 1. Lapor Masal (Batch Report) */}
          <div 
            className="relative glass-enterprise rounded-2xl border border-border/40 p-6 md:p-8 h-[400px] flex flex-col overflow-hidden group"
            onMouseEnter={() => setActiveWidget('batch')}
            onMouseLeave={() => setActiveWidget(null)}
          >
            <div className="mb-4">
               <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                 <Zap className="w-5 h-5 text-orange-500" /> Lapor Masal
               </h3>
               <p className="text-xs text-muted-foreground">Tindak lanjuti puluhan tugas tertunda sekaligus dalam hitungan detik bergaya *Tinder-swipe*.</p>
            </div>
            
            {/* Visualizer Area */}
            <div className="flex-1 relative flex items-center justify-center mt-4">
               {/* FAB Fake */}
               <div className={cn(
                 "absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 bg-orange-500 rounded-l-[24px] flex items-center justify-center shadow-lg transition-transform duration-500 z-10",
                 activeWidget === 'batch' ? "scale-90 -translate-x-4 opacity-0" : "scale-100 translate-x-6 opacity-100"
               )}>
                 <div className="absolute inset-0 rounded-l-[24px] bg-red-500 animate-ping opacity-20" />
                 <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}>
                   <Zap className="w-6 h-6 text-white" />
                 </motion.div>
                 <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-background">3</div>
               </div>

               {/* Expanded State (Stack of Cards) */}
               <div className={cn(
                 "absolute inset-0 flex items-center justify-center transition-all duration-500",
                 activeWidget === 'batch' ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
               )}>
                 <div className="relative w-full max-w-[240px] h-[220px]">
                   {/* Background Card 2 */}
                   <div className="absolute top-4 left-4 right-4 bottom-0 bg-background/50 border border-border/40 rounded-xl transform -rotate-6 opacity-50 blur-[1px]" />
                   {/* Background Card 1 */}
                   <div className="absolute top-2 left-2 right-2 bottom-2 bg-background/80 border border-border/40 rounded-xl transform rotate-3 shadow-md opacity-80" />
                   
                   {/* Front Card with Swipe Animation */}
                   <motion.div 
                     animate={activeWidget === 'batch' ? { 
                       x: [0, 0, 150, 150, 0],
                       y: [0, 0, -50, -50, 0],
                       rotate: [0, 0, 15, 15, 0],
                       opacity: [1, 1, 0, 0, 1]
                     } : {}}
                     transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                     className="absolute inset-0 bg-card border border-border/60 rounded-xl shadow-xl flex flex-col p-4 origin-bottom-right"
                   >
                      <div className="flex items-center gap-2 mb-3">
                         <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[9px] font-bold rounded">TERLAMBAT 3 HARI</span>
                      </div>
                      <h4 className="text-[11px] font-bold text-foreground mb-1 leading-tight">Peninjauan Infrastruktur Jalan</h4>
                      <p className="text-[9px] text-muted-foreground line-clamp-2 mb-auto">"Mohon segera dilaporkan progres fisik jalan poros kecamatan..."</p>
                      
                      <div className="mt-4 flex gap-2">
                         <div className="flex-1 h-7 bg-muted/50 rounded flex items-center justify-center text-[10px] font-medium text-muted-foreground border border-border/50">Lewati</div>
                         <motion.div 
                           animate={activeWidget === 'batch' ? { scale: [1, 1.1, 1, 1, 1] } : {}}
                           transition={{ duration: 3, repeat: Infinity }}
                           className="flex-1 h-7 bg-emerald-500/10 rounded flex items-center justify-center text-[10px] font-bold text-emerald-600 border border-emerald-500/20"
                         >
                           Selesai <CheckCircle2 className="w-3 h-3 ml-1"/>
                         </motion.div>
                      </div>
                   </motion.div>
                 </div>
               </div>
            </div>
          </div>

          {/* 2. Lapor Cepat (Quick Report) */}
          <div 
            className="relative glass-enterprise rounded-2xl border border-border/40 p-6 md:p-8 h-[400px] flex flex-col overflow-hidden group"
            onMouseEnter={() => setActiveWidget('quick')}
            onMouseLeave={() => setActiveWidget(null)}
          >
            <div className="mb-4">
               <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                 <MessageSquare className="w-5 h-5 text-blue-600" /> Catatan Instan
               </h3>
               <p className="text-xs text-muted-foreground">Buat draf progres atau catatan rapat tanpa menutup layar dokumen utama Anda.</p>
            </div>
            
            {/* Visualizer Area */}
            <div className="flex-1 relative flex items-center justify-center mt-4">
               {/* FAB Fake */}
               <div className={cn(
                 "absolute right-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-blue-600 rounded-l-[32px] flex items-center justify-center shadow-lg transition-transform duration-500 z-10",
                 activeWidget === 'quick' ? "scale-90 -translate-x-4 opacity-0" : "scale-100 translate-x-6 opacity-100"
               )}>
                 <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                   <MessageSquare className="w-6 h-6 text-white" />
                 </motion.div>
                 <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute top-1 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">2</motion.div>
               </div>

               {/* Expanded State (Notepad) */}
               <div className={cn(
                 "absolute inset-0 flex items-center justify-center transition-all duration-500 w-full",
                 activeWidget === 'quick' ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
               )}>
                 <div className="w-full max-w-[260px] bg-background border border-border/50 rounded-xl shadow-2xl flex flex-col overflow-hidden transform group-hover:-translate-y-2 transition-transform">
                    <div className="bg-muted/30 px-3 py-2 border-b border-border/40 flex items-center justify-between">
                       <span className="text-[10px] font-bold text-foreground flex items-center gap-1.5">
                          <MessageSquare className="w-3 h-3 text-blue-500"/> Draf: Koordinasi
                       </span>
                    </div>
                    <div className="p-3 bg-blue-50/30 dark:bg-blue-950/20">
                       <div className="text-[10px] text-muted-foreground font-medium mb-2 flex items-center gap-1">
                          Tugas: "Siapkan materi presentasi..."
                       </div>
                       <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span className="text-[10px] text-foreground line-through opacity-50">Data historis terkumpul</span>
                          </div>
                          
                          {/* Typing Animation */}
                          <div className="flex items-start gap-2">
                            <div className="w-3 h-3 mt-0.5 rounded-sm border border-border flex-shrink-0" />
                            <div className="flex flex-col gap-1 w-full mt-1">
                              <span className="text-[10px] text-foreground leading-none">Draft slide ke-3</span>
                              {activeWidget === 'quick' && (
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: ["0%", "80%", "80%", "0%"] }}
                                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                  className="h-1 bg-blue-500/40 rounded-full"
                                />
                              )}
                            </div>
                          </div>
                       </div>
                    </div>
                    <div className="px-3 py-2 border-t border-border/30 bg-muted/10 flex justify-between items-center">
                       <div className="flex gap-1.5">
                          <Palette className="w-3 h-3 text-muted-foreground" />
                          <ListTodo className="w-3 h-3 text-muted-foreground" />
                       </div>
                       <div className="h-6 px-3 bg-blue-600 rounded text-[9px] font-bold text-white flex items-center gap-1">
                          Kirim <Send className="w-2 h-2" />
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* 3. Portal Pintar (Smart Portal) */}
          <div 
            className="relative glass-enterprise rounded-2xl border border-border/40 p-6 md:p-8 h-[400px] flex flex-col overflow-hidden group"
            onMouseEnter={() => setActiveWidget('portal')}
            onMouseLeave={() => setActiveWidget(null)}
          >
            <div className="mb-4">
               <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                 <Sparkles className="w-5 h-5 text-amber-500" /> Portal Pintar
               </h3>
               <p className="text-xs text-muted-foreground">Pusat tautan cepat dan asisten AI pintar yang siap melayani dari sudut kanan bawah layar.</p>
            </div>
            
            {/* Visualizer Area */}
            <div className="flex-1 relative flex items-center justify-center mt-4">
               {/* FAB Fake */}
               <div className={cn(
                 "absolute right-0 top-1/2 -translate-y-1/2 w-14 h-14 bg-amber-500 rounded-l-[24px] flex items-center justify-center shadow-lg transition-transform duration-500 z-10",
                 activeWidget === 'portal' ? "scale-90 -translate-x-4 opacity-0" : "scale-100 translate-x-6 opacity-100"
               )}>
                 <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 8, ease: "linear" }}>
                   <Sparkles className="w-6 h-6 text-white" />
                 </motion.div>
               </div>

               {/* Expanded State (Quick Links Drawer) */}
               <div className={cn(
                 "absolute inset-0 flex items-center justify-center transition-all duration-500 w-full",
                 activeWidget === 'portal' ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
               )}>
                 <div className="w-full max-w-[260px] bg-background border border-border/50 rounded-xl shadow-2xl p-4 flex flex-col gap-3 transform group-hover:-translate-y-2 transition-transform">
                    <div className="flex items-center gap-2 mb-2">
                       <Bot className="w-4 h-4 text-amber-500" />
                       <span className="text-[11px] font-bold text-foreground">AI & Tautan Pribadi</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                       {/* Link AI 1 */}
                       <div className="bg-muted/30 border border-border/50 rounded-lg p-2.5 flex flex-col items-center justify-center gap-1.5 hover:bg-muted/50 cursor-pointer transition-colors relative overflow-hidden group/link">
                          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          <Bot className="w-4 h-4 text-emerald-500" />
                          <span className="text-[9px] font-semibold text-foreground text-center relative z-10">ChatGPT 4o</span>
                       </div>
                       
                       {/* Link AI 2 */}
                       <div className="bg-muted/30 border border-border/50 rounded-lg p-2.5 flex flex-col items-center justify-center gap-1.5 hover:bg-muted/50 cursor-pointer transition-colors relative overflow-hidden group/link">
                          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="text-[9px] font-semibold text-foreground text-center relative z-10">Claude Sonnet</span>
                       </div>
                       
                       {/* Tautan Pribadi 1 */}
                       <div className="bg-muted/30 border border-border/50 rounded-lg p-2 px-3 flex items-center gap-2 col-span-2 hover:bg-muted/50 cursor-pointer transition-colors group/link">
                          <div className="w-5 h-5 rounded bg-blue-500/10 flex items-center justify-center shrink-0">
                             <Link2 className="w-3 h-3 text-blue-500 group-hover/link:-rotate-45 transition-transform" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-foreground">Drive Proyek Rahasia</span>
                             <span className="text-[8px] text-muted-foreground">drive.google.com/folders/...</span>
                          </div>
                       </div>
                       
                       {/* Tautan Pribadi 2 */}
                       <div className="bg-muted/30 border border-border/50 rounded-lg p-2 px-3 flex items-center gap-2 col-span-2 hover:bg-muted/50 cursor-pointer transition-colors group/link">
                          <div className="w-5 h-5 rounded bg-orange-500/10 flex items-center justify-center shrink-0">
                             <Link2 className="w-3 h-3 text-orange-500 group-hover/link:-rotate-45 transition-transform" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-foreground">Dashboard Analytics Pribadi</span>
                             <span className="text-[8px] text-muted-foreground">lookerstudio.google.com/...</span>
                          </div>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
