"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggleCompact } from "@/components/ui/ThemeToggleCompact";
import DomainBanner from "@/components/DomainBanner";
import Logo from "@/app/dashboard/sigap/components/Logo";
import { PublicFooter } from "./PublicFooter";
import { Button } from "@/components/ui/button";

// Import CSS SIGAP agar tema landing page persis seperti aplikasi
import "@/app/dashboard/sigap/sigap.css";

interface PublicPageLayoutProps {
  children: React.ReactNode;
}

export function PublicPageLayout({ children }: PublicPageLayoutProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    // Membungkus dengan data-tenant="sigap" agar variabel dari sigap.css berlaku mutlak.
    <div data-tenant="sigap" className="min-h-screen bg-background text-foreground flex flex-col relative overflow-clip font-sans transition-colors duration-300">
      
      {/* Subtle Grid & Glow Background */}
      <div className="fixed inset-0 pointer-events-none flex justify-center z-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.05]" />
      </div>

      {/* Banner */}
      <div className="w-full z-[60] relative">
        <DomainBanner />
      </div>

      {/* Sticky Premium Navbar */}
      <header className="sticky top-0 w-full z-[50] border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <nav className="w-full px-4 md:px-6 h-14 md:h-16 flex justify-between items-center max-w-7xl mx-auto">
          {/* Kiri: Logo */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <Logo className="h-7 md:h-8 w-auto group-hover:scale-105 transition-transform duration-300 drop-shadow-md" />
            <div className="flex flex-col hidden sm:flex">
              <span className="text-base md:text-lg font-extrabold tracking-tight text-foreground leading-none">
                SIGAP
              </span>
              <span className="text-[9px] md:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase leading-tight mt-0.5">
                Sistem Integrasi Administrasi Persuratan
              </span>
            </div>
          </Link>

          {/* Tengah: Navigasi (Hanya di PC) */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/fitur" className="hover:text-primary transition-colors">Fitur & Modul</Link>
            <Link href="/keamanan" className="hover:text-primary transition-colors">Keamanan & Kepatuhan</Link>
            <Link href="/replikasi" className="hover:text-primary transition-colors">Panduan Replikasi</Link>
            <Link href="/instansi" className="hover:text-primary transition-colors">Instansi Pengguna</Link>
            <Link href="/dokumen" className="hover:text-primary transition-colors">Dokumen</Link>
            <Link href="/#info" className="hover:text-primary transition-colors">Tentang Inovasi</Link>
          </div>

          {/* Kanan: Aksi */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggleCompact />
            <Button 
              variant="default" 
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-5 font-semibold transition-all flex h-8 md:h-9 text-xs md:text-sm shadow-md shadow-primary/20"
              onClick={() => router.push('/login')}
            >
              Log In
            </Button>
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-[100%] left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border/40 py-4 px-6 shadow-lg flex flex-col gap-4 z-[40]">
            <Link href="/fitur" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-primary transition-colors py-2 border-b border-border/30">Fitur & Modul</Link>
            <Link href="/keamanan" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-primary transition-colors py-2 border-b border-border/30">Keamanan & Kepatuhan</Link>
            <Link href="/replikasi" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-primary transition-colors py-2 border-b border-border/30">Panduan Replikasi</Link>
            <Link href="/instansi" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-primary transition-colors py-2 border-b border-border/30">Instansi Pengguna</Link>
            <Link href="/dokumen" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-primary transition-colors py-2 border-b border-border/30">Dokumen</Link>
            <Link href="/#info" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium hover:text-primary transition-colors py-2">Tentang Inovasi</Link>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 w-full relative z-10 flex flex-col">
        {children}
      </main>
      
      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
