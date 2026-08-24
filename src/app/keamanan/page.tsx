"use client";

import React from 'react';
import { PublicPageLayout } from "@/components/public/PublicPageLayout";
import { ComplianceFAQ } from "@/components/showcase/ComplianceFAQ";
import { ShieldCheck, Database, Server, Lock, Fingerprint, Network } from "lucide-react";

export default function KeamananPage() {
  return (
    <PublicPageLayout>
      <section className="pt-32 pb-16 bg-muted/30 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-[-50%]" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <ShieldCheck className="w-4 h-4" />
            <span>Keamanan Kelas Enterprise</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">
            Kedaulatan & Keamanan Data
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Arsitektur yang dirancang secara native untuk mematuhi regulasi SPBE Pemerintah Republik Indonesia dan melindungi rahasia negara.
          </p>
        </div>
      </section>

      {/* Security Features Grid */}
      <section className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Data Residency (ID)</h3>
              <p className="text-muted-foreground leading-relaxed">
                Seluruh database dan dokumen fisik disimpan di Data Center yang berlokasi di Jakarta (Region asia-southeast2), memenuhi mandat PP No. 71/2019.
              </p>
            </div>
            
            <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">AES-256 Encryption</h3>
              <p className="text-muted-foreground leading-relaxed">
                Setiap dokumen dienkripsi saat transit (TLS 1.2+) dan saat tersimpan (AES-256) di Google Cloud Storage untuk memastikan kerahasiaan absolut.
              </p>
            </div>

            <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                <Fingerprint className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Tenant Isolation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Isolasi data antar tenant (instansi) secara logis menggunakan Firestore Security Rules yang ketat. Data instansi A tidak akan pernah bocor ke instansi B.
              </p>
            </div>

            <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
                <Network className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Audit Trail Log</h3>
              <p className="text-muted-foreground leading-relaxed">
                Setiap aksi CRUD (Create, Read, Update, Delete) dicatat secara presisi untuk keperluan audit investigatif dan menjamin prinsip non-repudiation.
              </p>
            </div>

            <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                <Server className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">99.99% Uptime SLA</h3>
              <p className="text-muted-foreground leading-relaxed">
                Berjalan di atas arsitektur Serverless Google Cloud Platform yang auto-scaling, menghilangkan kekhawatiran server down di jam sibuk instansi.
              </p>
            </div>

            <div className="bg-card border border-border/50 shadow-sm rounded-2xl p-8 hover:shadow-md transition-shadow bg-primary text-primary-foreground">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Standar SPBE (Perpres 95)</h3>
              <p className="text-white/80 leading-relaxed">
                Mendukung indeks SPBE Nasional dengan mengintegrasikan proses bisnis surat menyurat elektronik secara menyeluruh dan terpadu.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ComplianceFAQ />
    </PublicPageLayout>
  );
}
