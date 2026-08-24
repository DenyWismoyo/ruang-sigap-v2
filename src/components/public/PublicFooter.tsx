"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Database, Server, Mail, MapPin, Phone, ExternalLink } from "lucide-react";
import Logo from "@/app/dashboard/sigap/components/Logo";

export function PublicFooter() {
  return (
    <footer className="bg-background py-16 border-t border-border/50 relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          {/* Kolom 1: Brand & Deskripsi */}
          <div className="col-span-1 md:col-span-1 flex flex-col items-start">
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <Logo className="h-8 w-auto group-hover:scale-105 transition-all duration-300" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground tracking-tight leading-none">SIGAP</span>
                <span className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase mt-0.5">Sistem E-Office</span>
              </div>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Sistem Integrasi Administrasi Persuratan modern yang dirancang khusus untuk memenuhi standar SPBE dan mendukung kedaulatan data instansi pemerintah.
            </p>
          </div>

          {/* Kolom 2: Eksplorasi */}
          <div className="flex flex-col">
            <h4 className="font-semibold text-foreground mb-4">Eksplorasi</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <Link href="/fitur" className="hover:text-primary transition-colors">Fitur & Modul</Link>
              <Link href="/keamanan" className="hover:text-primary transition-colors">Keamanan & Kepatuhan</Link>
              <Link href="/replikasi" className="hover:text-primary transition-colors">Panduan Replikasi</Link>
              <Link href="/changelog" className="hover:text-primary transition-colors">Riwayat Pembaruan</Link>
            </div>
          </div>

          {/* Kolom 3: Legal & Regulasi */}
          <div className="flex flex-col">
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <Link href="/privacy-policy" className="hover:text-primary transition-colors">Kebijakan Privasi</Link>
              <Link href="/terms-of-service" className="hover:text-primary transition-colors">Ketentuan Layanan</Link>
              <a href="https://jdih.bumn.go.id/peraturan/detail/peraturan-presiden-nomor-95-tahun-2018" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1.5">
                Perpres 95/2018 (SPBE) <ExternalLink className="w-3 h-3" />
              </a>
              <a href="https://peraturan.bpk.go.id/Details/122741/pp-no-71-tahun-2019" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-1.5">
                PP 71/2019 (PSTE) <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Kolom 4: Kontak */}
          <div className="flex flex-col">
            <h4 className="font-semibold text-foreground mb-4">Hubungi Kami</h4>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <a href="https://wa.me/6285777117587" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                <Phone className="w-4 h-4" /> +62 857-7711-7587
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-xs text-muted-foreground font-medium">
            &copy; {new Date().getFullYear()} RUANG SIGAP. Hak Cipta Dilindungi.
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap justify-center font-semibold">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> SOC2 Ready Architecture</span>
            <span className="flex items-center gap-1.5"><Database className="w-4 h-4" /> AES-256 Encryption</span>
            <span className="flex items-center gap-1.5"><Server className="w-4 h-4" /> 99.99% Uptime SLA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
