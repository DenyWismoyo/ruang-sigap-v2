"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, FileText, Search, ChevronDown } from 'lucide-react';
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

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 overflow-y-auto custom-scrollbar p-6 sm:p-10">
      
      {/* Breadcrumb & Title */}
      <div className="mb-8">
         <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <ChevronDown className="w-3 h-3 -rotate-90" />
            <span>Surat</span>
         </div>
         <h1 className="text-[32px] font-bold text-[#1a56db] dark:text-[#3b82f6] flex items-center gap-3">
            <Inbox className="w-8 h-8 text-slate-800 dark:text-slate-200" />
            Kotak Masuk
         </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
         <div className="px-10 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 font-bold text-sm bg-white dark:bg-slate-800 shadow-sm flex items-center gap-2 text-slate-800 dark:text-slate-200">
            <FileText className="w-4 h-4" /> Daftar Surat
         </div>
         <div className="px-10 py-2.5 rounded-full font-semibold text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> 
            Pantau Laporan
         </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
         <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
            <input 
               type="text" 
               placeholder="Cari perihal, nomor surat..." 
               className="w-full h-10 pl-11 pr-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:border-blue-500 shadow-sm"
            />
         </div>
         <div className="flex gap-3">
            <button className="h-10 px-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold flex items-center gap-6 shadow-sm">
               Semua Status <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            <button className="h-10 px-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold flex items-center gap-6 shadow-sm">
               Semua Jenis <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
         </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-slate-800">
         <table className="w-full text-left text-sm">
            <thead>
               <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 w-[35%]">PERIHAL / NOMOR</th>
                  <th className="px-6 py-4 w-[25%]">PENGIRIM</th>
                  <th className="px-6 py-4">JENIS</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4">INFO DISPOSISI</th>
                  <th className="px-6 py-4 text-right">AKSI / TGL</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
               {INBOX_ITEMS.map((item, idx) => (
                  <motion.tr 
                     key={item.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                     <td className="px-6 py-4 align-top">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-[14px] leading-snug mb-1">{item.perihal}</p>
                        <p className="text-slate-400 text-xs">{item.nomor}</p>
                     </td>
                     <td className="px-6 py-4 align-top">
                        <p className="text-slate-700 dark:text-slate-300 text-[14px] leading-snug">{item.pengirim}</p>
                     </td>
                     <td className="px-6 py-4 align-top">
                        <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
                           {item.jenis}
                        </span>
                     </td>
                     <td className="px-6 py-4 align-top">
                        <span className="inline-flex px-2 py-1 rounded text-xs font-semibold bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                           {item.status}
                        </span>
                     </td>
                     <td className="px-6 py-4 align-top">
                        <span className="text-slate-400 italic text-sm">{item.info}</span>
                     </td>
                     <td className="px-6 py-4 align-top text-right text-slate-500 text-sm font-medium">
                        {item.tgl}
                     </td>
                  </motion.tr>
               ))}
            </tbody>
         </table>
      </div>

    </div>
  );
}
