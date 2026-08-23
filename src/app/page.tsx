"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Shield, Zap, LayoutDashboard, Send, Clock, BarChart3, Users, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ThemeToggleCompact } from "@/components/ui/ThemeToggleCompact";
import DomainBanner from "@/components/DomainBanner";
import { GlassPanel } from "@/components/GlassPanel";

export default function LandingPage() {
  const router = useRouter();

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0b] selection:bg-blue-500/30 selection:text-blue-900 dark:selection:text-blue-100 transition-colors duration-300 flex flex-col relative overflow-hidden">
      
      {/* Background Ornaments - Similar to Sigap Dashboard */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden flex justify-center z-0">
        {/* Top glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/20 dark:bg-blue-600/10 blur-[120px] rounded-full" />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] dark:[mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 dark:opacity-10" />
      </div>

      {/* Banner Migrasi Domain */}
      <div className="w-full z-[60] relative">
        <DomainBanner />
      </div>

      {/* Header Minimalis */}
      <nav className="w-full p-6 flex justify-between items-center z-50 relative max-w-7xl mx-auto">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
            <Send className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspace
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggleCompact />
          <Button 
            variant="default" 
            className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 px-6 font-medium transition-all"
            onClick={() => router.push('/login')}
          >
            Sign In
          </Button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left: Hero Copy */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center lg:items-start text-center lg:text-left"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium text-sm mb-6 border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-md">
              <Zap className="w-4 h-4 fill-blue-600 dark:fill-blue-400" />
              <span>Smart E-Office Terintegrasi v2.0</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 leading-[1.15]">
              Sistem Persuratan & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                Disposisi Cerdas
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl leading-relaxed">
              Workspace modern untuk mengelola administrasi birokrasi. Pantau disposisi, lacak surat, dan tingkatkan efisiensi kerja dalam satu platform terpadu.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Button 
                onClick={() => router.push('/login')}
                size="lg"
                className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 px-8 h-14 text-base font-medium group"
              >
                Masuk ke Workspace
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="w-full sm:w-auto rounded-full border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 h-14 px-8 font-medium"
              >
                Pelajari Lebih Lanjut
              </Button>
            </motion.div>
          </motion.div>

          {/* Right: Dashboard Preview Mockup using GlassPanel */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative w-full h-full min-h-[500px] hidden lg:flex items-center justify-center"
          >
            {/* Main Glass Mockup */}
            <GlassPanel intensity="heavy" className="w-full h-full rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl p-6 flex flex-col gap-6 relative overflow-hidden bg-white/40 dark:bg-slate-900/40">
              
              {/* Fake Sidebar & Header */}
              <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="w-32 h-4 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                </div>
              </div>

              {/* Fake Stat Cards */}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 mb-3 flex items-center justify-center">
                      <LayoutDashboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="w-24 h-3 rounded-md bg-slate-200 dark:bg-slate-700 mb-2" />
                    <div className="w-16 h-6 rounded-md bg-slate-300 dark:bg-slate-600" />
                  </div>
                ))}
              </div>

              {/* Fake List */}
              <div className="flex-1 bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3">
                <div className="w-40 h-4 rounded-md bg-slate-200 dark:bg-slate-700 mb-2" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className="w-3/4 h-3 rounded-md bg-slate-200 dark:bg-slate-700" />
                      <div className="w-1/2 h-2 rounded-md bg-slate-100 dark:bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating Decorative Badge */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-6 -bottom-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Disposisi Selesai</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Just now</p>
                </div>
              </motion.div>
            </GlassPanel>
          </motion.div>
        </div>
      </main>

      {/* Feature Highlights - Bottom Strip */}
      <div className="w-full border-t border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-8 md:gap-16">
          {[
            { icon: Fingerprint, label: "Akses Aman & Terenkripsi" },
            { icon: Zap, label: "Real-time Sinkronisasi" },
            { icon: BarChart3, label: "Monitoring Kinerja" },
            { icon: Users, label: "Multi-Role Terintegrasi" },
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <feature.icon className="w-5 h-5 text-blue-600 dark:text-blue-500" />
              <span className="font-medium text-sm">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}