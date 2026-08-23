"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Reply, CheckCircle2, CornerDownRight, User, Search, Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MockFABs } from './MockFABs';

export function MockDetailSurat() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col relative bg-[hsl(var(--sg-surface-1))] overflow-hidden rounded-bl-3xl rounded-br-3xl"
    >
      {/* Top Navbar Simulation */}
      <div className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Menu className="w-5 h-5 text-muted-foreground mr-2" />
          <span className="hidden sm:inline">Detail Tindak Lanjut</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center relative">
            <Bell className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="text-xs font-bold text-primary">AD</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6">
        
        {/* Detail Panel */}
        <Card className="flex-1 bg-card border-border shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-border bg-muted/10 flex justify-between items-start">
            <div>
              <div className="text-xs text-muted-foreground font-mono mb-2 flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold">REG-2026/08/254</span>
                <span>•</span>
                <span>Penting</span>
              </div>
              <h3 className="font-bold text-foreground text-xl leading-tight mb-2">Permohonan Bantuan Tenaga Kesehatan untuk Acara Porprov</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Dinas Pemuda dan Olahraga</span>
                <span>•</span>
                <span>2 Hari yang lalu</span>
              </div>
            </div>
          </div>
          <CardContent className="p-0 bg-muted/5 flex-1 relative flex items-center justify-center min-h-[400px]">
            {/* Fake PDF Viewer */}
            <div className="w-[85%] h-[90%] bg-white dark:bg-[#e0e0e0] rounded shadow-md border border-border p-8 text-black opacity-90 pointer-events-none relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
               <div className="flex justify-between border-b border-slate-300 pb-4 mb-6">
                  <div className="w-16 h-16 bg-slate-200 rounded-full" />
                  <div className="text-right">
                     <div className="w-32 h-3 bg-slate-300 rounded mb-2 ml-auto" />
                     <div className="w-24 h-2 bg-slate-200 rounded ml-auto" />
                  </div>
               </div>
               <div className="w-full h-2 bg-slate-300 rounded mb-3" />
               <div className="w-full h-2 bg-slate-300 rounded mb-3" />
               <div className="w-[80%] h-2 bg-slate-300 rounded mb-8" />
               <div className="w-full h-2 bg-slate-200 rounded mb-3" />
               <div className="w-full h-2 bg-slate-200 rounded mb-3" />
               <div className="w-[60%] h-2 bg-slate-200 rounded" />
               <div className="mt-16 w-1/4 h-24 bg-slate-300/50 rounded-lg ml-auto flex flex-col justify-end p-2 border border-slate-300 border-dashed">
                 <div className="w-full h-2 bg-slate-300 rounded" />
               </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
          </CardContent>
        </Card>

        {/* Tindak Lanjut Panel */}
        <Card className="w-full md:w-[400px] bg-card border-border shadow-sm flex flex-col overflow-hidden shrink-0">
          <div className="p-5 border-b border-border bg-muted/10">
            <h4 className="font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Timeline Disposisi
            </h4>
          </div>
          <CardContent className="p-6 flex-1 overflow-y-auto space-y-6">
            
            <div className="relative pl-6 border-l-2 border-primary/20 pb-2">
              <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="mb-1 flex justify-between items-center">
                 <span className="font-bold text-sm text-foreground">Sekretaris Dinas</span>
                 <span className="text-[10px] text-muted-foreground bg-background px-1 rounded border border-border">Kemarin</span>
              </div>
              <div className="text-sm text-muted-foreground mb-3">
                Meneruskan disposisi dari Kepala Dinas: "Siapkan 2 unit ambulans dan 4 tim medis."
              </div>
            </div>

            <div className="relative pl-6 border-l-2 border-transparent">
              <div className="absolute -left-[17px] top-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mb-1 flex justify-between items-center">
                 <span className="font-bold text-sm text-foreground">Kepala Bidang Pelkes</span>
                 <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Hari ini, 09:30</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl text-sm text-slate-700 dark:text-slate-300 shadow-sm mt-2">
                <span className="font-semibold block mb-2 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  Laporan Selesai
                </span>
                Tim medis dan ambulans telah disiapkan sesuai instruksi. Surat balasan konfirmasi telah dikirimkan ke Dispora.
                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800 cursor-pointer hover:bg-blue-100 transition-colors">
                    <FileText className="w-3.5 h-3.5" /> Lampiran_SK_Tim_Medis.pdf
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800 cursor-pointer hover:bg-blue-100 transition-colors">
                    <FileText className="w-3.5 h-3.5" /> Draf_Balasan_Kadis.docx
                  </div>
                </div>
              </div>
            </div>

          </CardContent>
          <div className="p-5 border-t border-border bg-muted/5">
             <Button className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" disabled>
               <Reply className="w-5 h-5 mr-2" />
               Balas / Tindak Lanjuti
             </Button>
          </div>
        </Card>
      </div>

      <MockFABs />
    </motion.div>
  );
}
