"use client";

import React from 'react';
import { PublicPageLayout } from "@/components/public/PublicPageLayout";
import { InfrastructureSupportTiers } from "@/components/showcase/InfrastructureSupportTiers";
import { ArrowRight, CheckCircle2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReplikasiPage() {
  const waNumber = "6285777117587";
  const waMessage = encodeURIComponent("Halo, saya tertarik untuk berkonsultasi mengenai replikasi sistem SIGAP E-Office untuk Instansi kami.");
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  return (
    <PublicPageLayout>
      <section className="pt-32 pb-16 bg-muted/30 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-[-50%]" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>Adopsi Sistem Nasional</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">
            Panduan Replikasi SIGAP
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Transformasi digital instansi Anda sekarang. Kami siap membantu implementasi dari awal hingga Go-Live dalam waktu kurang dari 1 bulan.
          </p>
          <Button
            size="lg"
            className="h-12 px-8 text-base font-bold shadow-xl shadow-primary/20 rounded-full"
            onClick={() => window.open(waLink, '_blank')}
          >
            Mulai Konsultasi Gratis <MessageSquare className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Timeline Journey Replikasi */}
      <section className="py-20 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">Journey Replikasi</h2>
            <p className="text-muted-foreground">Tahapan jelas dan terukur untuk memastikan keberhasilan adopsi sistem.</p>
          </div>

          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-primary/20 before:to-transparent">
            
            {/* Step 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                1
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-card border border-border/50 rounded-2xl shadow-sm">
                <h3 className="font-bold text-lg text-foreground mb-2">Konsultasi & Assessment</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Diskusi awal kebutuhan instansi, analisis struktur organisasi, dan audit kesiapan infrastruktur untuk menentukan lingkup implementasi.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                2
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-card border border-border/50 rounded-2xl shadow-sm">
                <h3 className="font-bold text-lg text-foreground mb-2">Setup & Konfigurasi</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Provisioning instance database terisolasi, penyesuaian tema warna (jika diperlukan), dan import data master pegawai ke dalam sistem.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                3
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-card border border-border/50 rounded-2xl shadow-sm">
                <h3 className="font-bold text-lg text-foreground mb-2">Training & Sosialisasi</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Bimbingan teknis (Bimtek) komprehensif bagi Administrator, Pejabat struktural, dan operator pelaksana persuratan.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                4
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 bg-card border border-border/50 rounded-2xl shadow-sm">
                <h3 className="font-bold text-lg text-foreground mb-2">Go-Live & Support</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Peluncuran resmi penggunaan sistem. Tim kami menyediakan dukungan teknis (SLA) untuk memastikan masa transisi berjalan lancar.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Skema Layanan */}
      <InfrastructureSupportTiers />

    </PublicPageLayout>
  );
}
