import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FileUp,
  Calendar,
  Send,
  Activity,
  Award,
  Archive,
  GitMerge,
  Sparkles,
  Mail,
  Bot,
  Briefcase,
  BellRing,
  CheckSquare,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="text-xs font-mono text-emerald-400">
      {displayedText}
      <span className="inline-block w-1.5 h-3 ml-1 bg-emerald-400 animate-pulse align-middle" />
    </span>
  );
};

export function WorkflowVisualizer() {
  const router = useRouter();

  const waNumber = "6285777117587";
  const waMessage = encodeURIComponent(
    "Halo, saya tertarik untuk berkonsultasi mengenai replikasi sistem SIGAP E-Office untuk Instansi kami."
  );
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  const [step, setStep] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    const runSequence = async () => {
      while (isMounted) {
        setStep(0);
        await delay(1000);
        if (!isMounted) break;
        
        setStep(1); // Input
        await delay(1500);
        if (!isMounted) break;

        setStep(2); // AI Processing
        await delay(3500);
        if (!isMounted) break;

        // Sekuensial Output 1 per 1 tanpa loop
        setStep(3); // Output 1
        await delay(800);
        if (!isMounted) break;

        setStep(4); // Output 2
        await delay(800);
        if (!isMounted) break;

        setStep(5); // Output 3
        await delay(800);
        if (!isMounted) break;

        setStep(6); // Output 4
        await delay(800);
        if (!isMounted) break;

        setStep(7); // Output 5
        await delay(800);
        if (!isMounted) break;

        setStep(8); // Selesai
        await delay(6000);
      }
    };
    runSequence();
    return () => { isMounted = false; };
  }, []);

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const outputs = [
    { icon: Calendar, title: "Agenda Harian", desc: "Terintegrasi penuh kalender eksekutif via Real-time API.", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", colorHex: "#3b82f6" },
    { icon: Send, title: "Disposisi Digital", desc: "Distribusi instruksi berjenjang via Push Notification seketika.", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", colorHex: "#10b981" },
    { icon: Activity, title: "Dashboard Holistik", desc: "Pemantauan progres live lintas divisi berarsitektur WebSocket.", color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20", colorHex: "#f59e0b" },
    { icon: Award, title: "Otomasi E-Kinerja", desc: "Generasi logbook aktivitas via trigger Cloud Functions.", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", colorHex: "#a855f7" },
    { icon: Archive, title: "Arsip Kriptografik", desc: "Penyimpanan abadi terenkripsi dengan indeks pencarian kilat.", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", colorHex: "#f43f5e" },
  ];

  const lifecycleSteps = [
    { 
      icon: Mail, 
      title: "1. Data Ingestion (SSOT)", 
      desc: "Staf mengunggah dokumen fisik/PDF. Berkas langsung diinisialisasi ke dalam koleksi terpusat menggunakan prinsip Single Source of Truth (SSOT), meminimalisir duplikasi data." 
    },
    { 
      icon: Bot, 
      title: "2. Ekstraksi Kognitif (AI)", 
      desc: "Mesin AI secara otonom membedah metadata (Pengirim, Tanggal, Perihal) dan menyusun ringkasan eksekutif secara instan, menghilangkan jam kerja ekstraksi manual." 
    },
    { 
      icon: Briefcase, 
      title: "3. Sinkronisasi Feed Terpadu", 
      desc: "Modul useRuangKerjaFeed mengagregasi data lintas sektoral. Memanfaatkan React Query untuk menghadirkan Optimistic UI, sehingga pimpinan melihat pembaruan data tanpa delay." 
    },
    { 
      icon: Send, 
      title: "4. Eksekusi Batch & Disposisi", 
      desc: "Fungsi useSuratActions mengeksekusi Firestore Batch Writes. Distribusi instruksi, mutasi status, dan pemicu notifikasi dieksekusi serentak dalam satu transaksi atomik." 
    },
    { 
      icon: CheckSquare, 
      title: "5. Tindak Lanjut Multi-Layer", 
      desc: "Penerima mandat menyelesaikan instruksi secara kolaboratif. Laporan berjenjang otomatis terikat pada tree-history dokumen asal sebagai bukti audit digital." 
    },
    { 
      icon: Award, 
      title: "6. E-Kinerja Autonomous", 
      desc: "Microservices berbasis Cloud Functions (logbookTriggers) bekerja secara senyap. Setiap tugas yang tuntas secara otomatis dikonversi menjadi poin E-Kinerja pengguna." 
    },
  ];

  return (
    <section className="pt-16 pb-24 lg:pt-24 bg-background relative z-10 overflow-hidden">
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 mesh-bg opacity-40 z-0 pointer-events-none" />
      
      {/* 1. BAGIAN HERO & FILOSOFI 1 INPUT 5 OUTPUT */}
      <div className="max-w-7xl mx-auto px-6 mb-32 relative">
        
        {/* Lebur dengan Hero Section */}
        <div className="mb-20 flex flex-col items-center text-center relative z-20">
          <motion.div 
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center w-full"
          >
            {/* SPBE Floating Badge */}
            <motion.div 
              variants={fadeIn} 
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-bold mb-10 backdrop-blur-md shadow-[0_0_20px_rgba(var(--primary),0.15)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span>Sistem Pemerintahan Berbasis Elektronik (SPBE)</span>
            </motion.div>
            
            {/* Animated Main Title */}
            <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl lg:text-[75px] font-extrabold text-foreground tracking-tighter mb-10 leading-[1.1] relative">
              <span className="relative z-10">Satu Input.</span><br />
              <motion.span 
                className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-blue-600 bg-[length:200%_200%]"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                Lima Output Otomatis.
              </motion.span>
              {/* Backlight Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 blur-[100px] -z-10 rounded-[100%]" />
            </motion.h1>

            <motion.p variants={fadeIn} className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl leading-relaxed">
              Konsep <strong>Satu Aksi Berdampak Besar</strong>. Sistem cerdas yang memproses secara paralel. Satu aksi unggah dokumen seketika menggerakkan lima instrumen organisasi tanpa intervensi manual tambahan.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto mt-6">
              <Button 
                onClick={() => router.push('/login')}
                size="lg"
                className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] px-8 h-14 text-base font-bold group transition-all duration-300 transform hover:-translate-y-1"
              >
                Mulai Sistem
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
            </motion.div>
            
            <motion.div variants={fadeIn} className="mt-8 flex items-center justify-center">
              <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground bg-muted/50 border border-border/50 px-4 py-2 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Mendukung PWA Offline-Ready</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Visualizer Nodes - Stateful Animation */}
        <div className="relative w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-4 py-10 lg:py-0 h-auto lg:h-[500px]">
          
          {/* Input Node (Muncul di Step >= 1) */}
          <div className="flex flex-col items-center z-20 shrink-0 lg:w-[220px]">
            <AnimatePresence>
              {step >= 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, x: -50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-28 h-28 rounded-2xl glass-enterprise glow-border float-organic flex flex-col items-center justify-center mb-6 relative group overflow-hidden bg-primary/5">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-30 mix-blend-overlay pointer-events-none" />
                    <FileUp className="w-10 h-10 text-primary relative z-10 group-hover:-translate-y-1 transition-transform" />
                    <div className="text-[10px] uppercase tracking-widest font-bold text-primary mt-2 relative z-10">Data Source</div>
                    
                    {/* Simulated document scan line when processing */}
                    {step === 2 && (
                       <motion.div 
                         className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_15px_var(--primary)]"
                         animate={{ top: ["0%", "100%", "0%"] }}
                         transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                       />
                    )}
                  </div>
                  <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                    Input Berkas
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mt-2 max-w-[180px]">
                    Staf mengunggah surat fisik / dokumen PDF
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Hub Connector (Desktop) */}
          <div className="hidden lg:flex flex-1 items-center justify-center relative min-w-[200px] h-full min-h-[400px]">
            
            {/* Trunk Line from Input to AI */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M 0 50 L 50 50" className="data-flow-base" vectorEffect="non-scaling-stroke" />
              {step >= 2 && (
                <path 
                  d="M 0 50 L 50 50" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="data-flow-path text-primary" 
                  vectorEffect="non-scaling-stroke" 
                />
              )}
            </svg>

            {/* SVG Connecting Paths to Outputs */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" preserveAspectRatio="none" viewBox="0 0 100 100">
              {/* Y coordinates manually mapped to match 5 stacked boxes evenly in 500px container */}
              {[12, 31, 50, 69, 88].map((y, i) => {
                const isVisible = step >= 3 + i;
                const colors = ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#f43f5e"];
                return (
                  <g key={i}>
                    <path 
                      d={`M 50 50 C 70 50, 70 ${y}, 100 ${y}`} 
                      fill="none" 
                      className="data-flow-base"
                      vectorEffect="non-scaling-stroke"
                    />
                    {isVisible && (
                      <path 
                        d={`M 50 50 C 70 50, 70 ${y}, 100 ${y}`} 
                        fill="none" 
                        stroke={colors[i]} 
                        strokeWidth="3" 
                        className="data-flow-path filter drop-shadow-[0_0_8px_currentColor]"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Center AI Node */}
            <div className="relative z-30 flex flex-col items-center">
              {/* Pulsing rings */}
              {step >= 2 && (
                <>
                  <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute inset-[-20px] rounded-full border border-primary/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                </>
              )}
              
              <motion.div 
                className={`w-32 h-32 rounded-full glass-enterprise flex flex-col items-center justify-center gap-1 backdrop-blur-xl transition-all duration-700 ${step >= 2 ? 'core-ai-breathing text-primary border-primary/50' : 'opacity-40 grayscale border-border'}`}
              >
                <motion.div animate={step >= 2 ? { rotate: 360 } : {}} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                  <Bot className="w-8 h-8" />
                </motion.div>
                <span className="font-black tracking-widest text-[10px] mt-1 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                  CORE AI
                </span>
              </motion.div>
              
              {/* Typewriter Terminal */}
              <AnimatePresence>
                {step >= 2 && step < 8 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                    animate={{ opacity: 1, y: -140, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 w-64 glass-enterprise border-primary/30 rounded-xl p-4 shadow-[0_0_30px_rgba(var(--primary),0.2)] text-left z-40 bg-background/90"
                  >
                    <div className="flex items-center justify-between mb-3 border-b border-primary/20 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                        <span className="text-[9px] text-emerald-400 font-mono uppercase tracking-widest">Neural Extraction</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <TypewriterText text="> Membaca PDF...&#10;> Ekstrak: Pengirim&#10;> Ekstrak: Tanggal&#10;> Ekstrak: Perihal&#10;> Mempersiapkan 5 Output..." />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Connectors (Mobile) */}
          <div className="lg:hidden flex flex-col items-center justify-center my-6 relative h-32 w-full z-10">
            <div className={`w-[2px] h-full bg-gradient-to-b from-transparent via-primary/30 to-transparent relative overflow-hidden transition-opacity ${step >= 2 ? 'opacity-100' : 'opacity-20'}`}>
              {step >= 2 && step < 8 && (
                <motion.div
                  className="absolute top-0 left-0 w-full h-1/3 bg-primary shadow-[0_0_10px_var(--primary)]"
                  animate={{ y: ["-100%", "300%"] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              )}
            </div>
            
            <div className={`absolute top-1/2 -translate-y-1/2 p-4 rounded-full glass-enterprise border border-primary/40 text-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all ${step >= 2 ? 'opacity-100 scale-110' : 'opacity-50'}`}>
              <Bot className="w-6 h-6" />
            </div>
          </div>

          {/* Output Nodes Side - Stack on Mobile, Absolute on Desktop */}
          <div className="relative z-20 shrink-0 lg:w-[320px] w-full flex flex-col gap-4 lg:block h-auto lg:h-[550px] mt-10 lg:mt-0">
            {outputs.map((item, index) => {
              const isVisible = step >= 3 + index;
              const yPercents = [12, 31, 50, 69, 88];
              
              return (
                <div 
                  key={index}
                  className="static lg:absolute w-full lg:-translate-y-1/2 left-0 right-0"
                  style={{ top: `calc(${yPercents[index]}%)` }}
                >
                  <motion.div
                    initial={false}
                    animate={{ 
                      opacity: isVisible ? 1 : 0, 
                      x: isVisible ? 0 : 40,
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className={`relative w-full flex items-center p-3 rounded-xl glass-enterprise hover:bg-white/5 border border-white/10 transition-all group overflow-visible shadow-lg hover:shadow-xl ${isVisible ? 'pointer-events-auto' : 'pointer-events-none'}`}
                  >
                    {/* Glowing line on the left inside */}
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r-md transition-all group-hover:top-0 group-hover:bottom-0" style={{ backgroundColor: item.colorHex }} />
                    
                    {/* Floating Badge */}
                    <div className={`absolute top-1/2 -translate-y-1/2 -left-3 lg:-left-5 w-10 h-10 rounded-full ${item.bg} flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)] border border-white/10 group-hover:scale-110 group-hover:shadow-[0_0_20px_var(--glow-color)] transition-all duration-500`} style={{ '--glow-color': item.colorHex } as React.CSSProperties}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    
                    <div className="flex flex-col pl-10 lg:pl-8 pr-2">
                      <h4 className="font-bold text-foreground text-[13px] tracking-tight mb-0.5">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {item.desc}
                      </p>
                    </div>
                    
                    {/* Sweep highlight effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none overflow-hidden rounded-xl" />
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
