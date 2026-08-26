"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FilePlus, 
  Send, 
  Settings, 
  CheckCircle, 
  Archive,
  Activity
} from "lucide-react";

export function LifecycleFlowVisualizer() {
  const [step, setStep] = useState(0);

  // Animasi berputar berulang dari 0 sampai 5 (5 berarti selesai semua)
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev >= 5 ? 0 : prev + 1));
    }, 2500); // Tiap 2.5 detik ganti stage
    return () => clearInterval(timer);
  }, []);

  const stages = [
    {
      id: "baru",
      title: "Baru",
      subtitle: "Data Ingestion (SSOT)",
      desc: "Berkas fisik/PDF diunggah & diinisialisasi terpusat.",
      icon: FilePlus,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]"
    },
    {
      id: "disposisi",
      title: "Didisposisikan",
      subtitle: "Instruksi Top-Down",
      desc: "Distribusikan tugas berjenjang via Push Notification.",
      icon: Send,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.4)]"
    },
    {
      id: "proses",
      title: "Proses Lanjut",
      subtitle: "Kolaborasi Tim",
      desc: "Eksekusi tugas & input laporan secara real-time.",
      icon: Settings,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      glow: "shadow-[0_0_20px_rgba(245,158,11,0.4)]"
    },
    {
      id: "selesai",
      title: "Selesai",
      subtitle: "Validasi Akhir",
      desc: "Pimpinan memverifikasi & menutup status dokumen.",
      icon: CheckCircle,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]"
    },
    {
      id: "arsip",
      title: "Diarsipkan",
      subtitle: "Kriptografi Abadi",
      desc: "Data disimpan terenkripsi dengan indeks pencarian.",
      icon: Archive,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      glow: "shadow-[0_0_20px_rgba(244,63,94,0.4)]"
    }
  ];

  return (
    <section className="py-24 bg-background relative z-10 overflow-hidden border-t border-white/5">
      {/* Background Mesh */}
      <div className="absolute inset-0 mesh-bg opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="mb-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-6 border border-blue-500/20">
            <Activity className="w-4 h-4" />
            <span>State Machine Persuratan</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">
            Pipeline Siklus Hidup Dokumen.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Lacak pergerakan mutasi status dokumen secara linier dan transparan dari tahap penerimaan hingga penyimpanan arsip digital permanen.
          </p>
        </div>

        {/* The Pipeline Visualizer */}
        <div className="relative mt-20 pt-10 pb-10">
          
          {/* Base Pipeline Track (Garis Abu-abu) */}
          <div className="absolute top-[32px] left-[10%] right-[10%] h-1 bg-border/50 rounded-full hidden md:block z-0" />
          
          {/* Active Energy Pipeline (Garis Biru/Menyala) */}
          <div className="absolute top-[32px] left-[10%] right-[10%] h-1 rounded-full overflow-hidden hidden md:block z-0">
             <motion.div 
               className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-primary origin-left"
               initial={{ scaleX: 0 }}
               animate={{ scaleX: step === 0 ? 0 : step / (stages.length - 1) }}
               transition={{ duration: 0.8, ease: "easeInOut" }}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4 relative z-10">
            {stages.map((stage, idx) => {
              const isActive = step === idx;
              const isPassed = step > idx;
              
              // Tailwind dynamic classes safety issue:
              // It's better to use static mapped borders or just rely on inline styles,
              // but for this prototype, we'll extract the color hex or rely on a safe class.
              // We'll use style border-color to avoid purging issues.
              let borderColor = "#3b82f6"; // blue
              if(idx===1) borderColor = "#10b981"; // emerald
              if(idx===2) borderColor = "#f59e0b"; // amber
              if(idx===3) borderColor = "#a855f7"; // purple
              if(idx===4) borderColor = "#f43f5e"; // rose

              return (
                <div key={stage.id} className="relative flex flex-col items-center group">
                  
                  {/* Node Connector Point (Mobile Vertical Line) */}
                  <div className={`md:hidden absolute left-1/2 -translate-x-1/2 top-16 bottom-[-24px] w-1 bg-border/50 z-0 ${idx === stages.length - 1 ? 'hidden' : ''}`} />
                  
                  {/* Node Orb */}
                  <motion.div
                    className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 relative z-10 border-4 transition-all duration-500 ${
                      isActive || isPassed 
                        ? `bg-background ${stage.glow}`
                        : `bg-card border-border`
                    }`}
                    style={{ borderColor: isActive || isPassed ? borderColor : '' }}
                    animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                    transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
                  >
                    {/* Inner glowing pulse if active */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className={`absolute inset-0 rounded-full ${stage.bg} -z-10`}
                        />
                      )}
                    </AnimatePresence>
                    
                    <stage.icon className={`w-6 h-6 transition-colors duration-500 ${isActive || isPassed ? stage.color : 'text-muted-foreground'}`} />
                    
                    {/* Step Number Badge */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white transition-colors duration-500" style={{ backgroundColor: isActive || isPassed ? borderColor : '#737373' }}>
                      0{idx + 1}
                    </div>
                  </motion.div>

                  {/* Card Content */}
                  <div className={`w-full relative glass-enterprise p-5 rounded-2xl border transition-all duration-500 ${
                    isActive ? `shadow-lg ${stage.bg}` : 
                    isPassed ? 'border-white/10 opacity-80' : 
                    'border-white/5 opacity-50 grayscale'
                  }`} style={{ borderColor: isActive ? borderColor : '' }}>
                    <h4 className={`text-base font-extrabold mb-1 tracking-tight text-center transition-colors ${isActive || isPassed ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {stage.title}
                    </h4>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 text-center transition-colors ${isActive ? stage.color : 'text-muted-foreground'}`}>
                      {stage.subtitle}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed text-center">
                      {stage.desc}
                    </p>

                    {/* Active State Indicator Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl transition-all duration-500" style={{ backgroundColor: isActive ? borderColor : 'transparent' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
