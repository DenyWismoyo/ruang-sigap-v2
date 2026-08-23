"use client";

import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, Layers, Fingerprint, ShieldCheck, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ThemeToggleCompact } from "@/components/ui/ThemeToggleCompact";
import DomainBanner from "@/components/DomainBanner";
import { InteractiveShowcase } from "@/components";
import { BentoFeatures } from "@/components/showcase/BentoFeatures";

// Import komponen-komponen showcase baru
import { WorkflowVisualizer } from "@/components/showcase/WorkflowVisualizer";
import { LifecycleFlowVisualizer } from "@/components/showcase/LifecycleFlowVisualizer";
import { PainPointsShowcase } from "@/components/showcase/PainPointsShowcase";
import { SmartWidgetsShowcase } from "@/components/showcase/SmartWidgetsShowcase";
import { ImpactStatistics } from "@/components/showcase/ImpactStatistics";
import { InfrastructureSupportTiers } from "@/components/showcase/InfrastructureSupportTiers";
import { ModuleCatalog } from "@/components/showcase/ModuleCatalog";
import { ComplianceFAQ } from "@/components/showcase/ComplianceFAQ";

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
      <nav className="w-full p-6 flex justify-between items-center z-50 relative max-w-7xl mx-auto border-b border-border/50 bg-background/50 backdrop-blur-md rounded-b-2xl">
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



      {/* Workflow Visualizer (1 Input -> 5 Output) dinaikkan langsung di bawah Hero */}
      <WorkflowVisualizer />

      {/* Lifecycle Flow Visualizer (Siklus 5 Status Dokumen) */}
      <LifecycleFlowVisualizer />

      {/* Pain Points Showcase (Masa Lalu vs Masa Depan) */}
      <PainPointsShowcase />

      {/* Interactive UI Showcase Section */}
      <section className="relative z-10 w-full border-t border-border/50 bg-muted/20">
        <InteractiveShowcase />
      </section>

      {/* Smart Widgets (Aksi Cepat) Section */}
      <SmartWidgetsShowcase />

      {/* Impact & ROI Statistics */}
      <ImpactStatistics />

      {/* Skema Harga / Infrastruktur SPBE */}
      <InfrastructureSupportTiers />

      {/* Module Catalog */}
      <ModuleCatalog />

      {/* Compliance & Security FAQ */}
      <ComplianceFAQ />

      {/* Enterprise Footer */}
      <footer className="bg-background py-12 border-t border-border/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                <Layers className="w-4 h-4" />
             </div>
             <span className="text-lg font-bold text-foreground tracking-tight">Workspace</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap justify-center">
            <span className="flex items-center gap-1.5"><Fingerprint className="w-4 h-4" /> SOC2 Ready Architecture</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> AES-256 Encryption</span>
            <span className="flex items-center gap-1.5"><Server className="w-4 h-4" /> 99.99% Uptime SLA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}