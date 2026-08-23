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
    <div className="w-full h-full flex flex-col bg-transparent text-foreground overflow-y-auto custom-scrollbar p-4 sm:p-6">
      
      {/* Greeting Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-start gap-3"
      >
        <Sun className="w-6 h-6 text-orange-500 shrink-0 mt-1" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary tracking-tight mb-1">
            Selamat Siang, Pimpinan!
          </h1>
          <p className="text-muted-foreground text-xs">Jangan lupa istirahat sejenak.</p>
        </div>
      </motion.div>

      {/* Main Agenda Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-enterprise border border-border/40 rounded-lg shadow-sm"
      >
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b border-border/20 gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div className="w-1 h-4 bg-primary rounded-sm" />
            <h2 className="text-sm font-bold text-foreground">Agenda Undangan OPD</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-background/50 rounded-md p-0.5 border border-border/30">
               <button className="px-3 py-1 text-[10px] font-medium bg-muted shadow-sm rounded border border-border/40">Hari Ini</button>
               <button className="px-3 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground">Akan Datang</button>
            </div>
            
            <div className="flex bg-background/50 rounded-md border border-border/30 p-0.5 ml-1">
               <button className="p-1 bg-muted shadow-sm rounded border border-border/40"><List className="w-3.5 h-3.5" /></button>
               <button className="p-1 text-muted-foreground hover:text-foreground"><Grid className="w-3.5 h-3.5" /></button>
            </div>
            
            <Button variant="outline" size="sm" className="ml-1 h-7 border-border/40 bg-background/50 text-[10px]">
               <Download className="w-3.5 h-3.5 mr-1" /> Export
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap sm:whitespace-normal">
            <thead>
              <tr className="bg-muted/10 text-muted-foreground text-[10px] font-bold uppercase tracking-wider border-b border-border/20">
                <th className="px-4 py-3 w-[100px]">WAKTU</th>
                <th className="px-4 py-3 w-1/2">PERIHAL & PENGIRIM</th>
                <th className="px-4 py-3 w-[20%]">LOKASI</th>
                <th className="px-4 py-3 w-[25%]">DISPOSISI KEPADA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/10">
              {AGENDA.map((item, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 align-top">
                    <p className="font-bold text-foreground text-xs">{item.waktu}</p>
                    <p className="font-bold text-foreground text-xs">{item.jam}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-bold text-foreground text-xs leading-snug mb-1">{item.perihal}</p>
                    <p className="text-muted-foreground/70 text-[10px] mb-1">No: {item.nomor}</p>
                    <p className="text-muted-foreground/80 text-[10px] flex items-center gap-1 uppercase font-semibold">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {item.pengirim}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground text-xs">
                    {item.lokasi}
                  </td>
                  <td className="px-4 py-3 align-top text-foreground/80 text-xs">
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
