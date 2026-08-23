"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, FileText, Search, ChevronDown, Activity, RefreshCw, CheckCircle2, ArrowRight, CornerDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MockSuratMasukList() {
  const INBOX_ITEMS = [
    {
      id: 1,
      perihal: 'Pemberitahuan Pelaksanaan Pemeriksaan Rutin Tahunan',
      nomor: '19/BP-INS/VIII/2026',
      pengirim: 'Biro Pengawasan Internal Daerah',
      jenis: 'Pemberitahuan',
      status: 'Baru',
      info: 'Belum didisposisi',
      tgl: '21 Agu'
    },
    {
      id: 2,
      perihal: 'Undangan Penyerahan Penghargaan Inovasi Pelayanan Publik Nasional',
      nomor: 'B/400.2.1/2169',
      pengirim: 'Kementerian Pendayagunaan Aparatur Negara',
      jenis: 'Undangan',
      status: 'Baru',
      info: 'Belum didisposisi',
      tgl: '21 Agu'
    },
    {
      id: 3,
      perihal: 'Desk Finalisasi Penilaian Kematangan Organisasi Daerah (KOD) Perangkat Daerah...',
      nomor: 'B/000.8.5/1592',
      pengirim: 'KEMENTERIAN DALAM NEGERI REPUBLIK INDONESIA',
      jenis: 'Undangan',
      status: 'Baru',
      info: 'Belum didisposisi',
      tgl: '21 Agu'
    }
  ];

  const LAPORAN_ITEMS = [
    {
       id: 1,
       status: 'Selesai',
       nomor: 'B/400.2.5/3019',
       title: 'Monitoring Berkala Pembangunan Gedung Arsip Daerah',
       avatar: 'B',
       name: 'B**** S****, S.T., M.T.',
       role: 'Kepala Bidang Infrastruktur',
       time: 'Hari ini, 09.15',
       note: 'Tinjauan lapangan telah selesai. Progres mencapai 85%.'
    },
    {
       id: 2,
       status: 'Selesai',
       nomor: 'B/400.2.6/2867',
       title: 'Pengajuan Pemeliharaan Kendaraan Dinas Operasional',
       avatar: 'F',
       name: 'F**** A****',
       role: 'Staf Sub Bagian Umum & Perlengkapan',
       time: 'Kemarin, 14.30',
       note: 'Kendaraan sudah masuk bengkel rekanan.'
    }
  ];

  const [activeTab, setActiveTab] = useState<'inbox' | 'laporan'>('inbox');

  return (
    <div className="w-full h-full flex flex-col bg-transparent text-foreground overflow-y-auto custom-scrollbar p-4 sm:p-6">
      
      {/* Breadcrumb & Title */}
      <div className="mb-6">
         <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <ChevronDown className="w-2.5 h-2.5 -rotate-90" />
            <span>Surat</span>
         </div>
         <h1 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
            <Inbox className="w-5 h-5 text-primary" />
            Kotak Masuk
         </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 relative">
         <button 
           onClick={() => setActiveTab('inbox')}
           className={cn(
             "px-6 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors relative",
             activeTab === 'inbox' 
               ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
               : "text-muted-foreground border border-transparent hover:bg-muted/10"
           )}
         >
            <FileText className="w-3 h-3" /> Daftar Surat
         </button>
         <button 
           onClick={() => setActiveTab('laporan')}
           className={cn(
            "px-6 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-colors relative",
            activeTab === 'laporan' 
              ? "bg-primary/10 text-primary border border-primary/20 shadow-sm" 
              : "text-muted-foreground border border-transparent hover:bg-muted/10"
          )}
         >
            <Activity className="w-3 h-3" /> Pantau Laporan
         </button>
      </div>

      <AnimatePresence mode="wait">
         {activeTab === 'inbox' ? (
           <motion.div 
             key="inbox-view"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.2 }}
             className="flex flex-col flex-1"
           >
             {/* Filter Bar */}
             <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="flex-1 relative">
                   <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                   <input 
                      type="text" 
                      placeholder="Cari perihal, nomor surat..." 
                      className="w-full h-8 pl-9 pr-3 rounded-full border border-border/40 bg-background/50 backdrop-blur-sm text-xs focus:outline-none focus:border-primary shadow-sm"
                   />
                </div>
                <div className="flex gap-2">
                   <button className="h-8 px-3 rounded-full border border-border/40 bg-background/50 backdrop-blur-sm text-xs font-bold flex items-center gap-4 shadow-sm text-foreground/80 hover:bg-muted/10">
                      Semua Status <ChevronDown className="w-3 h-3 text-muted-foreground" />
                   </button>
                   <button className="h-8 px-3 rounded-full border border-border/40 bg-background/50 backdrop-blur-sm text-xs font-bold flex items-center gap-4 shadow-sm text-foreground/80 hover:bg-muted/10">
                      Semua Jenis <ChevronDown className="w-3 h-3 text-muted-foreground" />
                   </button>
                </div>
             </div>

             {/* Table */}
             <div className="w-full overflow-x-auto glass-enterprise rounded-xl border border-border/40 shadow-sm flex-1">
                <table className="w-full text-left text-xs">
                   <thead>
                      <tr className="bg-muted/20 text-muted-foreground text-[10px] font-bold uppercase tracking-wider border-b border-border/40">
                         <th className="px-4 py-3 w-[35%]">PERIHAL / NOMOR</th>
                         <th className="px-4 py-3 w-[25%]">PENGIRIM</th>
                         <th className="px-4 py-3">JENIS</th>
                         <th className="px-4 py-3">STATUS</th>
                         <th className="px-4 py-3">INFO DISPOSISI</th>
                         <th className="px-4 py-3 text-right">AKSI / TGL</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-border/20">
                      {INBOX_ITEMS.map((item, idx) => (
                         <motion.tr 
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="hover:bg-white/5 transition-colors"
                         >
                            <td className="px-4 py-3 align-top">
                               <p className="font-bold text-foreground text-xs leading-snug mb-1">{item.perihal}</p>
                               <p className="text-muted-foreground/70 text-[10px]">{item.nomor}</p>
                            </td>
                            <td className="px-4 py-3 align-top">
                               <p className="text-foreground/80 text-xs leading-snug">{item.pengirim}</p>
                            </td>
                            <td className="px-4 py-3 align-top">
                               <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                  {item.jenis}
                               </span>
                            </td>
                            <td className="px-4 py-3 align-top">
                               <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                  {item.status}
                               </span>
                            </td>
                            <td className="px-4 py-3 align-top">
                               <span className="text-muted-foreground/70 italic text-[10px]">{item.info}</span>
                            </td>
                            <td className="px-4 py-3 align-top text-right text-muted-foreground text-[10px] font-medium">
                               {item.tgl}
                            </td>
                         </motion.tr>
                      ))}
                   </tbody>
                </table>
             </div>
           </motion.div>
         ) : (
           <motion.div 
             key="laporan-view"
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.2 }}
             className="flex flex-col flex-1"
           >
             <div className="flex items-center justify-between mb-5">
               <div>
                 <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1">
                   <Activity className="w-4 h-4 text-primary" />
                   Timeline Tindak Lanjut
                 </h2>
                 <p className="text-[11px] text-muted-foreground">Pantau seluruh rantai progres surat dalam satu paket terpadu.</p>
               </div>
               <button className="h-8 px-3 flex items-center gap-2 rounded border border-border/40 bg-background/50 hover:bg-muted/20 text-[10px] font-bold text-foreground transition-colors shadow-sm">
                  <RefreshCw className="w-3 h-3" /> Segarkan Feed
               </button>
             </div>

             <div className="flex flex-col gap-4">
               {LAPORAN_ITEMS.map((item, idx) => (
                 <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.1 }}
                   className="glass-enterprise rounded-xl border border-border/40 p-4 shadow-sm"
                 >
                   <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {item.status}
                        </div>
                        <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1 font-mono">
                           <FileText className="w-3 h-3" /> {item.nomor}
                        </span>
                     </div>
                     <button className="text-[10px] font-bold text-foreground/80 flex items-center gap-1.5 bg-muted/20 hover:bg-muted/40 px-3 py-1.5 rounded transition-colors border border-border/20">
                       Detail Surat <ArrowRight className="w-3 h-3" />
                     </button>
                   </div>
                   
                   <h3 className="font-bold text-[13px] text-foreground mb-4">{item.title}</h3>
                   
                   <div className="border-t border-border/20 pt-3 flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-500/20">
                        {item.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold text-foreground flex items-center gap-1">
                            {item.name} <span className="font-medium text-[10px] text-muted-foreground hidden sm:inline-block">({item.role})</span>
                          </p>
                          <span className="text-[9px] text-muted-foreground">{item.time}</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground italic mt-1 bg-muted/10 p-2 rounded border border-border/10">
                          <CornerDownRight className="w-3 h-3 mt-0.5 opacity-50 shrink-0" />
                          "{item.note}"
                        </div>
                      </div>
                   </div>
                 </motion.div>
               ))}
             </div>
           </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
