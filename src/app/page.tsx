"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, FileText, CheckCircle2, Bot, Layers, CheckSquare, Fingerprint, Box, Sparkles, Server, ShieldCheck, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ThemeToggleCompact } from "@/components/ui/ThemeToggleCompact";
import DomainBanner from "@/components/DomainBanner";
import { InteractiveShowcase } from "@/components";
import { BentoFeatures } from "@/components/showcase/BentoFeatures";

// Import CSS SIGAP agar tema landing page persis seperti aplikasi
import "@/app/dashboard/sigap/sigap.css";

export default function LandingPage() {
  const router = useRouter();
  
  // Nomor WA untuk replikasi
  const waNumber = "6285777117587";
  const waMessage = encodeURIComponent("Halo, saya tertarik untuk berkonsultasi mengenai replikasi sistem Workspace E-Office untuk Instansi kami.");
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

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
    // Membungkus dengan data-tenant="sigap" agar variabel dari sigap.css berlaku mutlak.
    <div data-tenant="sigap" className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden font-sans transition-colors duration-300">
      
      {/* Subtle Grid & Glow Background */}
      <div className="fixed inset-0 pointer-events-none flex justify-center z-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.05]" />
      </div>

      {/* Banner */}
      <div className="w-full z-[60] relative">
        <DomainBanner />
      </div>

      {/* Premium Navbar */}
      <nav className="w-full p-6 flex justify-between items-center z-50 relative max-w-7xl mx-auto border-b border-border/50 bg-background/50 backdrop-blur-md rounded-b-2xl mb-8">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-foreground">
            Workspace
          </span>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggleCompact />
          <Button 
            variant="default" 
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 font-semibold transition-all hidden sm:flex h-10 shadow-md shadow-primary/10"
            onClick={() => router.push('/login')}
          >
            Log In
          </Button>
        </div>
      </nav>

      {/* Enterprise Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 pt-8 pb-20 lg:pt-12 lg:pb-32">
        <div className="w-full max-w-5xl mx-auto text-center flex flex-col items-center">
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-center w-full"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold mb-8 backdrop-blur-md">
              <Sparkles className="w-4 h-4" />
              <span>Sistem Pemerintahan Berbasis Elektronik (SPBE)</span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl lg:text-[80px] font-extrabold text-foreground tracking-tighter mb-8 leading-[1.1]">
              Satu Input.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--sg-gradient-start))] to-[hsl(var(--sg-gradient-end))]">Lima Output Otomatis.</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl leading-relaxed">
              Konsep <strong>Satu Aksi Berdampak Besar</strong>. Hanya dengan mengunggah satu dokumen, sistem akan langsung bekerja untuk Anda: <span className="font-semibold text-foreground">mendigitalisasi arsip, membaca inti surat menggunakan AI, mendistribusikan disposisi secara berjenjang, mengirim <em>push notification</em> seketika,</span> dan <span className="font-semibold text-foreground">memperbarui laporan analitika kinerja</span>. Selesaikan pekerjaan hitungan jam menjadi hitungan detik.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              <Button 
                onClick={() => router.push('/login')}
                size="lg"
                className="w-full sm:w-auto rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 px-8 h-12 text-base font-medium group transition-all"
              >
                Mulai Sistem
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => window.open(waLink, '_blank')}
                className="w-full sm:w-auto rounded-full border-border bg-card/50 hover:bg-muted text-foreground h-12 px-8 font-medium transition-all"
              >
                <MessageCircle className="w-4 h-4 mr-2 text-emerald-500" />
                Hubungi Penjualan
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Interactive UI Showcase Section */}
      <section className="relative z-10 w-full border-t border-border/50 bg-muted/20">
        <InteractiveShowcase />
      </section>

      {/* Enterprise Feature Grid (Bento) */}
      <section className="py-24 bg-background relative z-10 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 flex flex-col items-center text-center">
             <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-4">Arsitektur Ekosistem.</h2>
             <p className="text-muted-foreground text-lg max-w-2xl">Dirancang sebagai Single Source of Truth. Semua data terintegrasi, transparan, dan dapat diaudit secara real-time.</p>
          </div>
          
          <BentoFeatures />
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-24 bg-muted/20 relative z-10 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <h3 className="text-2xl font-bold text-foreground mb-12">Terintegrasi dengan Layanan Skala Global</h3>
           <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex flex-col items-center gap-3 hover:scale-110 transition-transform">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-sm border">
                    {/* Placeholder for Google Drive Logo */}
                    <svg viewBox="0 0 24 24" className="w-full h-full text-blue-500" fill="currentColor"><path d="M7.71 3.5L1.15 15l3.43 6L11.14 9.5h-3.43zm9.44 0l-3.43 6h6.86l3.43-6h-6.86zM13.42 21H1.15l3.43-6h12.28l3.43 6h-6.86z"/></svg>
                 </div>
                 <span className="text-sm font-semibold">Google Drive</span>
              </div>
              <div className="flex flex-col items-center gap-3 hover:scale-110 transition-transform">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-sm border">
                    {/* Placeholder for Gemini AI Logo */}
                    <Sparkles className="w-10 h-10 text-blue-600" />
                 </div>
                 <span className="text-sm font-semibold">Gemini AI</span>
              </div>
              <div className="flex flex-col items-center gap-3 hover:scale-110 transition-transform">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-sm border">
                    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.568 18.239l7.075 4.025a2.535 2.535 0 002.502 0l7.108-4.041a.585.585 0 00.222-.843l-3.32-6.529-6.386 6.387c-.492.492-1.32.492-1.811 0l-5.61-5.61-2.909 5.82a.585.585 0 00.129.791z" fill="#FFA000"/>
                      <path d="M12.924 10.978l4.238-4.238L13.8 1.135a.879.879 0 00-1.52 0l-1.554 2.96 2.198 6.883z" fill="#F57C00"/>
                      <path d="M3.568 18.239l5.474-10.947 1.685-3.21a.878.878 0 011.559-.021l1.791 3.483-5.351 5.351-5.289 5.291c-.347.347-.323.91.047 1.233z" fill="#FFCA28"/>
                    </svg>
                 </div>
                 <span className="text-sm font-semibold">Firebase Push</span>
              </div>
              <div className="flex flex-col items-center gap-3 hover:scale-110 transition-transform">
                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-sm border">
                    {/* Placeholder for Google Cloud Logo */}
                    <Server className="w-10 h-10 text-blue-500" />
                 </div>
                 <span className="text-sm font-semibold">Google Cloud</span>
              </div>
           </div>
        </div>
      </section>

      {/* Security and Compliance Section */}
      <section className="py-24 bg-white dark:bg-[#0f172a] relative z-10 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold mb-6 border border-emerald-500/20">
                 <ShieldCheck className="w-4 h-4" />
                 <span>Kepatuhan Regulasi Nasional</span>
               </div>
               <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6 leading-tight">
                 Infrastruktur Cloud yang Mematuhi Standar <span className="text-emerald-600 dark:text-emerald-500">SPBE</span>.
               </h2>
               <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                 Arsitektur sistem dibangun secara ketat mengikuti pedoman <strong>Peraturan Presiden No. 95 Tahun 2018</strong> tentang Sistem Pemerintahan Berbasis Elektronik (SPBE).
               </p>
               <p className="text-lg text-muted-foreground leading-relaxed">
                 Sesuai dengan amanat <strong>Peraturan Pemerintah No. 71 Tahun 2019</strong> tentang Penyelenggaraan Sistem dan Transaksi Elektronik (PSTE), seluruh pusat data dan pemrosesan informasi publik secara eksklusif ditempatkan pada infrastruktur <em>Cloud Server</em> (termasuk Firebase & repositori objek) yang berlokasi secara fisik di wilayah hukum Indonesia, menjamin kedaulatan data dan keamanan informasi tingkat tinggi.
               </p>
            </div>
            
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 flex flex-col gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
                     <Database className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="font-bold text-foreground mb-1">Data Sovereignty</h4>
                     <p className="text-sm text-muted-foreground">Server berlokasi 100% di Indonesia (Data Center Region Jakarta).</p>
                  </div>
               </div>
               <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 flex flex-col gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                     <h4 className="font-bold text-foreground mb-1">Enkripsi End-to-End</h4>
                     <p className="text-sm text-muted-foreground">Protokol keamanan tingkat tinggi pada transmisi dan penyimpanan data.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="bg-background py-12 border-t border-border/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4" />
             </div>
             <span className="text-lg font-bold text-foreground tracking-tight">Workspace</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Fingerprint className="w-4 h-4" /> SOC2 Ready Architecture</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> AES-256 Encryption</span>
            <span className="flex items-center gap-1.5"><Server className="w-4 h-4" /> 99.99% Uptime SLA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}