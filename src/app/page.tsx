"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InteractiveShowcase } from "@/components";
import { PublicPageLayout } from "@/components/public/PublicPageLayout";

// Import komponen-komponen showcase baru
import { WorkflowVisualizer } from "@/components/showcase/WorkflowVisualizer";
import { LifecycleFlowVisualizer } from "@/components/showcase/LifecycleFlowVisualizer";
import { PainPointsShowcase } from "@/components/showcase/PainPointsShowcase";
import { SmartWidgetsShowcase } from "@/components/showcase/SmartWidgetsShowcase";
import { ImpactStatistics } from "@/components/showcase/ImpactStatistics";
import { ModuleCatalog } from "@/components/showcase/ModuleCatalog";
import { ComplianceFAQ } from "@/components/showcase/ComplianceFAQ";

export default function LandingPage() {
  const router = useRouter();
  
  // Nomor WA untuk replikasi
  const waNumber = "6285777117587";
  const waMessage = encodeURIComponent("Halo, saya tertarik untuk berkonsultasi mengenai replikasi sistem SIGAP E-Office untuk Instansi kami.");
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <PublicPageLayout>
      {/* Workflow Visualizer (1 Input -> 5 Output) dinaikkan langsung di bawah Hero */}
      <div id="workflow" className="scroll-mt-20">
        <WorkflowVisualizer />

        {/* Lifecycle Flow Visualizer (Siklus 5 Status Dokumen) */}
        <LifecycleFlowVisualizer />
      </div>

      {/* Pain Points Showcase (Masa Lalu vs Masa Depan) */}
      <PainPointsShowcase />

      {/* Interactive UI Showcase Section */}
      <section id="demo" className="relative z-10 w-full border-t border-border/50 bg-muted/20 scroll-mt-20">
        <InteractiveShowcase />
      </section>

      {/* Smart Widgets (Aksi Cepat) Section */}
      <div id="info" className="scroll-mt-20">
        <SmartWidgetsShowcase />

        {/* Impact & ROI Statistics */}
        <ImpactStatistics />

        {/* Module Catalog */}
        <ModuleCatalog />

        {/* Compliance & Security FAQ */}
        <ComplianceFAQ />
      </div>

      {/* Replikasi CTA Section */}
      <section className="py-24 bg-primary relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground tracking-tight mb-6">
            Siap Mereplikasi SIGAP di Instansi Anda?
          </h2>
          <p className="text-primary-foreground/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Tingkatkan efisiensi dan wujudkan kedaulatan data dengan sistem persuratan elektronik berstandar SPBE.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto h-12 px-8 text-base font-bold shadow-xl rounded-full"
              onClick={() => router.push('/replikasi')}
            >
              Lihat Panduan Replikasi <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-base font-bold border-2 border-primary-foreground/20 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 rounded-full"
              onClick={() => window.open(waLink, '_blank')}
            >
              Konsultasi WhatsApp
            </Button>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}