"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sun, Download, List, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MockDashboardStats() {
  const AGENDA = [
    {
      waktu: '23 Agu',
      jam: '06:00',
      perihal: 'Jalan Sehat dalam rangka Memeriahkan HUT RI Ke 81',
      nomor: '81/UND/VIII/2026',
      pengirim: 'PANITIA HUT RI INSTANSI',
      lokasi: 'Taman Instansi',
      disposisi: 'Kepala Bagian Umum'
    },
    {
      waktu: '23 Agu',
      jam: '06:30',
      perihal: 'Rapat Koordinasi Evaluasi Kinerja Triwulan III',
      nomor: '09/Rakor/VIII/2026',
      pengirim: 'BIRO ORGANISASI DAN KEPEGAWAIAN',
      lokasi: 'Ruang Rapat Utama',
      disposisi: 'Kepala Bidang Perencanaan'
    },
    {
      waktu: '23 Agu',
      jam: '11:00',
      perihal: 'Kunjungan Kerja Studi Banding Penerapan SPBE',
      nomor: '130/K/SPBE/VI/2026',
      pengirim: 'Pemerintah Kota Seberang',
      lokasi: 'Command Center',
      disposisi: 'Kepala Bidang E-Government'
    }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 overflow-y-auto custom-scrollbar p-6 sm:p-10">
      
      {/* Greeting Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-start gap-4"
      >
        <Sun className="w-8 h-8 text-orange-500 shrink-0 mt-2" />
        <div>
          <h1 className="text-4xl sm:text-[42px] font-bold text-[#1a56db] dark:text-[#3b82f6] tracking-tight mb-2">
            Selamat Siang, Pimpinan!
          </h1>
          <p className="text-slate-500 text-lg">Jangan lupa istirahat sejenak.</p>
        </div>
      </motion.div>

      {/* Main Agenda Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm"
      >
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <div className="w-1 h-5 bg-[#1a56db] rounded-sm" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Agenda Undangan OPD</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
               <button className="px-4 py-1.5 text-sm font-medium bg-white dark:bg-slate-700 shadow-sm rounded border border-slate-200 dark:border-slate-600">Hari Ini</button>
               <button className="px-4 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">Akan Datang</button>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 p-0.5 ml-2">
               <button className="p-1.5 bg-white dark:bg-slate-700 shadow-sm rounded border border-slate-200 dark:border-slate-600"><List className="w-4 h-4" /></button>
               <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><Grid className="w-4 h-4" /></button>
            </div>
            
            <Button variant="outline" size="sm" className="ml-2 h-8 border-slate-200 dark:border-slate-700 text-xs">
               <Download className="w-4 h-4 mr-2" /> Export
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap sm:whitespace-normal">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="px-6 py-4 w-[120px]">WAKTU</th>
                <th className="px-6 py-4 w-1/2">PERIHAL & PENGIRIM</th>
                <th className="px-6 py-4 w-[20%]">LOKASI</th>
                <th className="px-6 py-4 w-[25%]">DISPOSISI KEPADA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {AGENDA.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-5 align-top">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">{item.waktu}</p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">{item.jam}</p>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <p className="font-bold text-slate-900 dark:text-slate-100 text-[15px] leading-snug mb-1">{item.perihal}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-1.5">No: {item.nomor}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1.5 uppercase font-medium">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {item.pengirim}
                    </p>
                  </td>
                  <td className="px-6 py-5 align-top text-slate-500 dark:text-slate-400 text-[15px]">
                    {item.lokasi}
                  </td>
                  <td className="px-6 py-5 align-top text-slate-700 dark:text-slate-300 text-[15px]">
                    {item.disposisi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      
    </div>
  );
}
