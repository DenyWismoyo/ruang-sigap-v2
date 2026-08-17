"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Shield, Zap, LayoutDashboard, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ThemeToggleCompact } from "@/components/ui/ThemeToggleCompact";

export default function LandingPage() {
  const router = useRouter();

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 selection:bg-blue-100 dark:selection:bg-blue-900/50 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-300">
      {/* Navbar Minimalis */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Send className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">
            Poros
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggleCompact />
          <Button 
            variant="outline" 
            className="rounded-full border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-6"
            onClick={() => router.push('/login')}
          >
            Masuk
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none opacity-70 dark:opacity-40">
          <div className="absolute -top-48 -right-48 w-96 h-96 bg-blue-400/30 dark:bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute top-32 -left-32 w-72 h-72 bg-indigo-400/30 dark:bg-indigo-600/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-sm mb-6 border border-blue-200 dark:border-blue-800/50 shadow-sm backdrop-blur-sm">
              <Zap className="w-4 h-4" />
              <span>Sistem ERP Birokrasi Modern</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-8 leading-tight">
              Birokrasi Cepat, <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Tepat & Terintegrasi
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Tinggalkan cara manual. Poros menghadirkan solusi E-Office modern untuk pengelolaan surat, disposisi otomatis, dan pemantauan tugas secara real-time antar Instansi.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => router.push('/login')}
                size="lg"
                className="w-full sm:w-auto rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-500/30 px-8 py-6 text-lg h-auto transition-all hover:scale-105"
              >
                Mulai Poros
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-md py-24 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Fitur Unggulan</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Sistem yang dirancang untuk mempercepat alur kerja instansi pemerintah dengan teknologi terkini.</p>
          </div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {/* Feature 1 */}
            <motion.div variants={fadeIn} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-blue-900/5 transition-all group">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Send className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Disposisi Cepat</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Kirim dan terima surat beserta disposisi dalam hitungan detik. Tersinkronisasi secara real-time ke semua penerima yang dituju.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={fadeIn} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-indigo-900/5 transition-all group">
              <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Pantau Real-Time</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Ketahui status surat Anda secara pasti. Apakah sudah dibaca, sedang dikerjakan, atau sudah selesai, semua terpantau jelas.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={fadeIn} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Keamanan Ekstra</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Tiap dokumen dan akses dilindungi sistem autentikasi ketat. Data tersimpan aman di infrastruktur cloud skala enterprise.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer Minimalis */}
      <footer className="bg-slate-900 dark:bg-black text-slate-400 py-12 text-center border-t border-slate-800">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-4">
             <div className="w-8 h-8 bg-blue-600 dark:bg-blue-700 rounded-lg flex items-center justify-center">
                <Send className="w-4 h-4 text-white" />
             </div>
             <span className="text-lg font-bold text-white">Poros</span>
          </div>
          <p className="mb-6">Sistem ERP Pemerintahan Modern</p>
          <p className="text-sm">© {new Date().getFullYear()} Pemerintah Kabupaten. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}