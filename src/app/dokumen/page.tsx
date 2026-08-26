"use client";

import React from 'react';
import { PublicPageLayout } from "@/components/public/PublicPageLayout";
import { FileText, Download, ChevronRight, FileBadge, Server, BookOpen } from "lucide-react";

export default function DokumenPage() {
  const documents = [
    {
      id: 1,
      title: "Proposal Replikasi SIGAP E-Office",
      description: "Dokumen komprehensif penawaran replikasi sistem. Mencakup latar belakang, ruang lingkup, model kerja sama, dan estimasi nilai investasi.",
      icon: <FileBadge className="w-8 h-8 text-primary" />,
      size: "2.4 MB",
      format: "PDF",
      url: "/dokumen/Proposal-Replikasi-SIGAP.pdf",
      highlight: true
    },
    {
      id: 2,
      title: "Profil Sistem (Company Profile)",
      description: "Ringkasan eksekutif mengenai fitur, arsitektur, dan manfaat SIGAP E-Office bagi transformasi digital instansi.",
      icon: <FileText className="w-8 h-8 text-blue-500" />,
      size: "1.8 MB",
      format: "PDF",
      url: "#",
      highlight: false
    },
    {
      id: 3,
      title: "Spesifikasi Teknis & Kebutuhan Server",
      description: "Detail spesifikasi infrastruktur cloud/on-premise yang dibutuhkan untuk menjalankan sistem secara optimal.",
      icon: <Server className="w-8 h-8 text-emerald-500" />,
      size: "850 KB",
      format: "PDF",
      url: "#",
      highlight: false
    },
    {
      id: 4,
      title: "Buku Panduan Pengguna (User Manual)",
      description: "Panduan dasar penggunaan sistem untuk level Administrator dan Pengguna (Staf/Pimpinan).",
      icon: <BookOpen className="w-8 h-8 text-orange-500" />,
      size: "5.2 MB",
      format: "PDF",
      url: "#",
      highlight: false
    }
  ];

  return (
    <PublicPageLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted/30 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-[-50%]" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">
            Pusat Unduhan Dokumen Resmi
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unduh proposal, profil sistem, dan dokumen teknis resmi SIGAP E-Office untuk dipelajari lebih lanjut oleh tim Anda.
          </p>
        </div>
      </section>

      {/* Documents List */}
      <section className="py-20 relative z-10 bg-background min-h-[500px]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col h-full ${
                  doc.highlight 
                    ? "bg-primary/5 border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.1)] hover:shadow-[0_0_30px_rgba(var(--primary),0.2)] hover:border-primary/50" 
                    : "bg-card border-border/50 hover:shadow-lg hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-xl shrink-0 ${doc.highlight ? 'bg-primary/10' : 'bg-muted'}`}>
                    {doc.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground mb-1 leading-tight">{doc.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded">{doc.format}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-grow">
                  {doc.description}
                </p>

                <a 
                  href={doc.url}
                  className={`inline-flex items-center justify-center w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
                    doc.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Unduh Dokumen
                </a>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">Butuh Dokumen Lainnya?</h3>
            <p className="text-muted-foreground mb-6">
              Jika instansi Anda membutuhkan dokumen presentasi, legalitas, atau Nota Kesepahaman (MoU) khusus, silakan hubungi tim kami.
            </p>
            <button
              onClick={() => window.open(`https://wa.me/6285777117587?text=${encodeURIComponent("Halo, kami membutuhkan dokumen pendukung tambahan terkait SIGAP E-Office.")}`, '_blank')}
              className="inline-flex items-center px-6 py-2.5 rounded-full text-sm font-bold bg-background text-foreground border border-border shadow-sm hover:border-primary/50 hover:text-primary transition-all"
            >
              Hubungi Tim Legal/Marketing <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
