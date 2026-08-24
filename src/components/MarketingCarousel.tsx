"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, FileX, Smartphone, CalendarX, Archive, PhoneCall, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PAIN_POINTS = [
  {
    id: 1,
    icon: FileX,
    title: "Surat Hilang di Meja",
    description: "Surat penting terkubur di bawah tumpukan kertas di meja pimpinan. Baru ditemukan 3 hari kemudian. Deadline sudah lewat.",
    color: "text-rose-500 dark:text-rose-400",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    solution: "SIGAP mencatat setiap surat masuk secara digital dengan pelacakan posisi secara real-time."
  },
  {
    id: 2,
    icon: Smartphone,
    title: "Disposisi Via WA yang Kacau",
    description: "Disposisi via grup WA atau lisan. Tidak ada yang tahu sudah diterima atau belum. Pimpinan harus telepon satu per satu.",
    color: "text-orange-500 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    solution: "Disposisi terstruktur dengan tombol terima (acknowledge) dan update progres otomatis."
  },
  {
    id: 3,
    icon: CalendarX,
    title: "Rekap Kinerja Manual",
    description: "Akhir bulan: 3 jam mengetik rekap kinerja dari ingatan. Hasilnya tidak akurat. Dan tidak bisa diverifikasi.",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    solution: "Laporan Tindak Lanjut otomatis direkap menjadi Logbook dan terhubung ke E-Kinerja."
  },
  {
    id: 4,
    icon: Archive,
    title: "Audit Arsip yang Melelahkan",
    description: "Inspektorat meminta jejak surat dari 6 bulan lalu. Butuh seharian mencari di lemari arsip fisik yang penuh debu.",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    solution: "Pencarian arsip dalam hitungan detik dengan metadata lengkap dan jejak audit (audit trail) utuh."
  },
  {
    id: 5,
    icon: PhoneCall,
    title: "Rapat Koordinasi Tidak Efektif",
    description: "Rapat mingguan yang memakan waktu 1 jam penuh hanya untuk menanyakan 'sudah sampai mana?' ke masing-masing staf.",
    color: "text-indigo-500 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    solution: "Dashboard pimpinan menampilkan status seluruh disposisi dan tugas OPD secara live."
  },
  {
    id: 6,
    icon: HelpCircle,
    title: "Blindspot Informasi",
    description: "Pimpinan baru kembali dinas luar. Tidak tahu ada surat penting apa saja yang masuk, dan di mana surat itu sekarang.",
    color: "text-purple-500 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    solution: "Akses E-Office dari manapun. Pimpinan dapat memantau dan mendisposisi langsung dari smartphone."
  }
];

export function MarketingCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PAIN_POINTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % PAIN_POINTS.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + PAIN_POINTS.length) % PAIN_POINTS.length);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Anda Familiar dengan Situasi Ini?</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Ini bukan masalah SDM. Ini masalah sistem. Dan sistem yang tepat bisa mengubah semuanya.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        {/* Carousel Container */}
        <div className="relative h-[400px] md:h-[300px] w-full flex items-center justify-center p-6 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full max-w-3xl flex flex-col items-center text-center gap-6"
            >
              <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg", PAIN_POINTS[currentIndex].bg)}>
                {React.createElement(PAIN_POINTS[currentIndex].icon, { 
                  className: cn("w-10 h-10", PAIN_POINTS[currentIndex].color) 
                })}
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  "{PAIN_POINTS[currentIndex].title}"
                </h3>
                <p className="text-lg text-slate-600 dark:text-slate-400 italic mb-6">
                  {PAIN_POINTS[currentIndex].description}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-xl border border-blue-100 dark:border-blue-800/50">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  <span className="font-bold mr-2">Solusi SIGAP:</span>
                  {PAIN_POINTS[currentIndex].solution}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 md:left-8">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-md hover:scale-110 transition-transform"
            onClick={handlePrev}
          >
            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </Button>
        </div>
        
        <div className="absolute top-1/2 -translate-y-1/2 right-4 md:right-8">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-md hover:scale-110 transition-transform"
            onClick={handleNext}
          >
            <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </Button>
        </div>

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {PAIN_POINTS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setIsAutoPlaying(false);
                setCurrentIndex(idx);
              }}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                idx === currentIndex 
                  ? "w-8 bg-blue-600 dark:bg-blue-500" 
                  : "w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
