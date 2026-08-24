"use client";

import React from 'react';
import { PublicPageLayout } from "@/components/public/PublicPageLayout";
import { ModuleCatalog } from "@/components/showcase/ModuleCatalog";
import { WorkflowVisualizer } from "@/components/showcase/WorkflowVisualizer";
import { Layers } from "lucide-react";

export default function FiturPage() {
  return (
    <PublicPageLayout>
      <section className="pt-32 pb-16 bg-muted/30 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-[-50%]" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <Layers className="w-4 h-4" />
            <span>Katalog Modul Ekosistem</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">
            Fitur & Modul SIGAP
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            SIGAP bukan sekadar pencatat surat. Ini adalah ekosistem E-Office yang mendigitalkan seluruh siklus administrasi, dari disposisi hingga arsip.
          </p>
        </div>
      </section>

      {/* Re-use ModuleCatalog tapi kita tampilkan secara utuh */}
      <div className="py-12">
        <ModuleCatalog />
      </div>

      <div className="py-12 bg-muted/20 border-t border-border/50">
        <WorkflowVisualizer />
      </div>
    </PublicPageLayout>
  );
}
