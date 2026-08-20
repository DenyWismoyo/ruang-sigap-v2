"use client";

import React, { useState } from 'react';
import { Download, MonitorSmartphone, Share, PlusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstall } from '@/hooks/usePwaInstall';

export default function InstallPwaButton() {
  const { install, isInstallable, isIOS, isInstalled } = usePwaInstall();
  const [showIosInstruction, setShowIosInstruction] = useState(false);

  // Paksa tombol muncul di development mode (karena npm run dev mematikan service worker PWA)
  const isDevMode = process.env.NODE_ENV === 'development';
  const shouldShow = (!isInstalled && isInstallable) || (isDevMode && !isInstalled);

  if (!shouldShow) return null;

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIosInstruction(true);
    } else if (isInstallable) {
      install();
    } else if (isDevMode) {
      alert("⚠️ Mode Development: Tombol ini muncul untuk keperluan tes UI.\n\nFungsi instalasi asli tidak akan berjalan karena Service Worker dimatikan pada 'npm run dev'. Untuk mengetes instalasi sungguhan, jalankan 'npm run build' lalu 'npm start'.");
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="rounded-full text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors relative px-3 h-8 gap-1.5 flex items-center"
        onClick={handleInstallClick}
        title="Instal Aplikasi"
      >
        <MonitorSmartphone size={16} />
        <span className="text-xs font-semibold">Instal</span>
        {/* Indikator dot untuk menarik perhatian */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-sm" />
      </Button>

      <Dialog open={showIosInstruction} onOpenChange={setShowIosInstruction}>
        <DialogContent className="sm:max-w-md text-center rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Instal Aplikasi di iOS</DialogTitle>
            <DialogDescription className="text-center pt-4">
              Untuk menginstal SIGAP di iPhone atau iPad Anda, ikuti langkah berikut:
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center gap-6 py-6">
            <div className="flex items-center justify-center gap-4 text-muted-foreground w-full px-4">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Share size={24} className="text-primary" />
                </div>
                <span className="text-sm font-medium">1. Ketuk Bagikan</span>
              </div>
              <div className="w-8 h-[2px] bg-border rounded-full" />
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <PlusSquare size={24} className="text-primary" />
                </div>
                <span className="text-sm font-medium">2. Tambah ke Layar Utama</span>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground bg-accent/50 p-3 rounded-lg w-full">
              Aplikasi akan berjalan lebih cepat dan dapat diakses langsung dari layar utama perangkat Anda.
            </p>
          </div>
          
          <Button className="w-full rounded-xl" onClick={() => setShowIosInstruction(false)}>
            Mengerti
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
