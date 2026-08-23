"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Zap, Eye, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MockRuangKerjaCard() {
  const FEED_ITEMS = [
    {
      id: 1,
      type: 'Surat Baru',
      title: 'Pemberitahuan Pelaksanaan Pemeriksaan Rutin Tahunan',
      sender: 'Biro Pengawasan Internal Daerah',
      urgent: false,
      time: '1 hari yang lalu',
      avatar: 'B',
      avatarColor: 'bg-[#a7f3d0] text-[#065f46]' // Light Emerald
    },
    {
      id: 2,
      type: 'Surat Baru',
      title: 'Undangan Penyerahan Penghargaan Inovasi Pelayanan Publik Nasional',
      sender: 'Kementerian Pendayagunaan Aparatur Negara',
      urgent: false,
      time: '1 hari yang lalu',
      avatar: 'K',
      avatarColor: 'bg-[#fed7aa] text-[#9a3412]' // Light Orange
    }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-transparent text-foreground overflow-y-auto custom-scrollbar p-4 sm:p-6">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
        
        {/* Ringkasan Hari Ini Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 glass-enterprise"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h3 className="text-sm font-bold text-blue-500 flex items-center gap-1.5 mb-1.5">
                 <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                 Ringkasan Hari Ini
               </h3>
               <p className="text-xs text-blue-400">
                 Anda memiliki <span className="font-bold text-foreground">10 Surat Baru</span> yang perlu didisposisikan. <span className="font-bold text-rose-500">(1 Mendesak)</span>
               </p>
            </div>
            <Button variant="outline" className="bg-background/50 border-blue-500/30 text-blue-500 hover:bg-blue-500/20 rounded-full px-4 h-8 font-medium shadow-sm text-xs">
               <Mail className="w-3.5 h-3.5 mr-1.5" /> 10 Surat
            </Button>
          </div>
        </motion.div>

        {/* Feed Cards */}
        {FEED_ITEMS.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + (idx * 0.1) }}
            className="w-full glass-enterprise border border-border/40 rounded-xl shadow-sm hover:bg-white/5 transition-all"
          >
            <div className="p-4 pb-3">
              
              <div className="flex justify-between items-start mb-3">
                 <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold px-2.5 py-0.5 rounded shadow-sm">
                   {item.type}
                 </div>
                 <div className="text-muted-foreground text-[10px] flex items-center gap-1">
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                   {item.time}
                 </div>
              </div>

              <div className="flex gap-3">
                 <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border border-border/20", item.avatarColor)}>
                    {item.avatar}
                 </div>
                 <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">{item.sender}</p>
                    <h4 className="text-sm font-bold text-foreground leading-snug">{item.title}</h4>
                 </div>
              </div>
            </div>

            <div className="bg-muted/10 border-t border-border/20 p-3 sm:px-4 flex justify-between items-center rounded-b-xl">
               <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm font-semibold h-8 px-4 rounded text-xs">
                  <Send className="w-3 h-3 mr-1.5" /> Disposisi / Aksi
               </Button>
               
               <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="icon" className="h-8 w-8 border-border/40 rounded bg-background/50 text-muted-foreground hover:text-foreground shadow-sm">
                     <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Button>
               </div>
            </div>
          </motion.div>
        ))}
        
      </div>
    </div>
  );
}
