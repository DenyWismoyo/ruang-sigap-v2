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
    <div className="w-full h-full flex flex-col bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 overflow-y-auto custom-scrollbar p-4 sm:p-8">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        
        {/* Ringkasan Hari Ini Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-[#f0f9ff] dark:bg-[#1e3a8a]/20 border border-[#bae6fd] dark:border-[#1e3a8a]/50 rounded-xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
               <h3 className="text-xl font-bold text-[#1e3a8a] dark:text-[#60a5fa] flex items-center gap-2 mb-2">
                 <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                 Ringkasan Hari Ini
               </h3>
               <p className="text-[15px] text-[#1e40af] dark:text-[#93c5fd]">
                 Anda memiliki <span className="font-bold">10 Surat Baru</span> yang perlu didisposisikan. <span className="font-bold text-red-600 dark:text-red-400">(1 Mendesak)</span>
               </p>
            </div>
            <Button variant="outline" className="bg-white dark:bg-slate-800 border-[#93c5fd] text-[#1e40af] dark:text-[#93c5fd] hover:bg-[#e0f2fe] rounded-full px-5 h-9 font-medium shadow-sm">
               <Mail className="w-4 h-4 mr-2" /> 10 Surat
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
            className="w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="p-5 sm:p-6 pb-4">
              
              <div className="flex justify-between items-start mb-4">
                 <div className="bg-[#f97316] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                   {item.type}
                 </div>
                 <div className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1.5">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                   {item.time}
                 </div>
              </div>

              <div className="flex gap-4">
                 <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0", item.avatarColor)}>
                    {item.avatar}
                 </div>
                 <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{item.sender}</p>
                    <h4 className="text-[17px] font-bold text-slate-900 dark:text-white leading-snug">{item.title}</h4>
                 </div>
              </div>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 p-4 sm:px-6 flex justify-between items-center rounded-b-xl">
               <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-sm font-semibold h-10 px-6 rounded-md">
                  <Send className="w-4 h-4 mr-2" /> Disposisi / Aksi
               </Button>
               
               <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm">
                     <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-slate-600">
                     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </Button>
               </div>
            </div>
          </motion.div>
        ))}
        
      </div>
    </div>
  );
}
