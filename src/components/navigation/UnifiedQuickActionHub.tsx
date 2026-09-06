"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  X,
  FilePlus,
  Bot,
  Sparkles,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { useUserAuth } from '@/context/AuthContext';
import { useRuangKerjaFeed } from '@/app/dashboard/sigap/hooks/useRuangKerjaFeed';
import { differenceInDays } from 'date-fns';
import BatchQuickReportModal from '@/app/dashboard/sigap/components/BatchQuickReportModal';
import QuickLinksWidget from '@/app/dashboard/sigap/(main)/ruang-kerja/components/QuickLinksWidget';
import { cn } from '@/lib/utils';

interface UnifiedQuickActionHubProps {
  tenant?: 'sigap' | 'poros';
}

export const UnifiedQuickActionHub: React.FC<UnifiedQuickActionHubProps> = ({
  tenant = 'sigap',
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile, jabatanProfile, actingJabatanProfile, loading } = useUserAuth();
  const effectiveJabatan = actingJabatanProfile || jabatanProfile;
  const isPimpinan = effectiveJabatan && effectiveJabatan.level <= 5;

  const isPoros = tenant === 'poros';

  const [isOpen, setIsOpen] = useState(false);
  const [isBatchReportOpen, setIsBatchReportOpen] = useState(false);
  const [isPortalPintarOpen, setIsPortalPintarOpen] = useState(false);

  // Akses data feed disposisi untuk fitur swipe
  const { feedItems } = useRuangKerjaFeed();

  // Hitung jumlah disposisi yang menunggu > 2 hari (overdue)
  const pendingItems = (feedItems || []).filter(
    (i) => i.type === 'surat_disposisi' && (i as any).disposisi?.status !== 'Selesai'
  );

  const overdueCount = isPimpinan
    ? 0
    : pendingItems.filter((i) => {
        if (i.type !== 'surat_disposisi' || !(i as any).disposisi?.tanggalDisposisi) return false;
        let t: Date;
        try {
          t =
            typeof (i as any).disposisi.tanggalDisposisi.toDate === 'function'
              ? (i as any).disposisi.tanggalDisposisi.toDate()
              : new Date((i as any).disposisi.tanggalDisposisi.seconds * 1000);
        } catch {
          t = new Date();
        }
        return differenceInDays(new Date(), t) >= 2;
      }).length;

  // Izin upload surat
  const canUploadSurat =
    userProfile?.role === 'admin_opd' ||
    userProfile?.role === 'staf_tu' ||
    userProfile?.additionalRoles?.includes('operator_surat');

  const isUploadPage =
    pathname === '/dashboard/surat/upload' || pathname === '/dashboard/poros/surat/upload';

  // Tutup menu saat rute berpindah
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (loading) return null;

  return (
    <>
      {/* Backdrop semi-transparan saat menu terbuka */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-xs z-40"
          />
        )}
      </AnimatePresence>

      {/* Floating Container (Pojok Kanan Bawah) */}
      <div
        className={cn(
          "fixed z-50 flex flex-col items-end pointer-events-none *:pointer-events-auto",
          // Posisi adaptif di mobile (di atas bottom nav) dan desktop
          "bottom-[calc(var(--bottom-nav-height,60px)+0.75rem)] md:bottom-6 right-3 md:right-6"
        )}
      >
        {/* Action Palette (Speed Dial Popover) */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={cn(
                "mb-3 w-[290px] sm:w-[320px] rounded-2xl border shadow-2xl p-2.5 backdrop-blur-xl flex flex-col gap-1.5",
                isPoros
                  ? "bg-card/95 border-teal-500/30 text-foreground shadow-teal-950/20"
                  : "bg-card/95 border-border text-foreground shadow-slate-950/20"
              )}
            >
              {/* Header Mini Palette */}
              <div className="px-2.5 py-1.5 border-b border-border/50 flex items-center justify-between text-xs">
                <span className="font-bold tracking-wide uppercase text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Layers size={13} className={isPoros ? "text-teal-500" : "text-blue-500"} />
                  Akses Cepat
                </span>
                <span className="text-[10px] text-muted-foreground">Pintasan Harian</span>
              </div>

              {/* 1. Swipe Disposisi / Lapor Masal (Prioritas jika ada pending/overdue) */}
              {!isPimpinan && pendingItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setIsBatchReportOpen(true);
                  }}
                  className={cn(
                    "w-full text-left p-2.5 rounded-xl transition-all flex items-center gap-3 group border border-transparent",
                    overdueCount > 0
                      ? "bg-orange-500/10 hover:bg-orange-500/15 border-orange-500/30"
                      : "hover:bg-muted/60"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-orange-500/30 group-hover:scale-105 transition-transform">
                    <Zap size={18} className="fill-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs text-foreground group-hover:text-orange-600 transition-colors truncate">
                        Swipe Disposisi
                      </h4>
                      {overdueCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-extrabold shrink-0 animate-pulse">
                          {overdueCount} tugas
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {overdueCount > 0 ? `${overdueCount} tugas menunggu > 2 hari` : `${pendingItems.length} disposisi aktif`}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              )}

              {/* 2. Upload Surat Masuk (Jika role mengizinkan & bukan di halaman upload) */}
              {canUploadSurat && !isUploadPage && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push(isPoros ? '/dashboard/poros/surat/upload' : '/dashboard/surat/upload');
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-muted/60 transition-all flex items-center gap-3 group border border-transparent"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                    <FilePlus size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-xs text-foreground group-hover:text-indigo-600 transition-colors truncate">
                      Upload Surat Masuk
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate">
                      Registrasi dokumen & surat baru
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
                </button>
              )}

              {/* 3. AI Copilot & Knowledge Base */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  window.dispatchEvent(new CustomEvent('sigap:open-copilot'));
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-muted/60 transition-all flex items-center gap-3 group border border-transparent"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform",
                    isPoros ? "bg-teal-600 shadow-teal-600/30" : "bg-blue-600 shadow-blue-600/30"
                  )}
                >
                  <Bot size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4
                      className={cn(
                        "font-bold text-xs text-foreground transition-colors truncate",
                        isPoros ? "group-hover:text-teal-600" : "group-hover:text-blue-600"
                      )}
                    >
                      AI Copilot & Panduan
                    </h4>
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 text-[9px] font-bold shrink-0">
                      SOP
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Blueprint sistem & tanya jawab
                  </p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>

              {/* 4. Portal Pintar & Tools AI */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsPortalPintarOpen(true);
                }}
                className="w-full text-left p-2.5 rounded-xl hover:bg-muted/60 transition-all flex items-center gap-3 group border border-transparent"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30 group-hover:scale-105 transition-transform">
                  <Sparkles size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-foreground group-hover:text-amber-600 transition-colors truncate">
                    Portal Pintar & Tools AI
                  </h4>
                  <p className="text-[11px] text-muted-foreground truncate">
                    Tautan e-Kinerja, ChatGPT, Drive, dll.
                  </p>
                </div>
                <ChevronRight size={14} className="text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Master Floating Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Tutup Menu Akses Cepat" : "Buka Menu Akses Cepat"}
          title={isOpen ? "Tutup Akses Cepat" : "Akses Cepat (Swipe, Upload, Copilot, Tools)"}
          className={cn(
            "relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 active:scale-95 focus:outline-hidden",
            isOpen
              ? "bg-muted text-foreground border border-border rotate-90"
              : isPoros
              ? "bg-gradient-to-tr from-teal-700 via-teal-600 to-emerald-600 text-white shadow-teal-900/30 hover:shadow-teal-900/50 hover:scale-105"
              : "bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-blue-900/30 hover:shadow-blue-900/50 hover:scale-105"
          )}
        >
          {/* Efek Denyut Halus Saat Normal */}
          {!isOpen && (
            <span
              className={cn(
                "absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none",
                overdueCount > 0 ? "bg-red-500" : isPoros ? "bg-teal-400" : "bg-blue-400"
              )}
            />
          )}

          {/* Ikon Tombol: Berganti Menjadi X Saat Terbuka */}
          {isOpen ? (
            <X size={22} className="shrink-0 transition-transform duration-200" />
          ) : overdueCount > 0 ? (
            <Zap size={22} className="fill-white shrink-0 animate-bounce" />
          ) : (
            <Sparkles size={22} className="shrink-0" />
          )}

          {/* Smart Badge Notifikasi (Overdue Disposisi) */}
          {!isOpen && overdueCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 border-2 border-background text-white text-[10px] md:text-xs font-extrabold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full shadow-md z-10 animate-pulse">
              {overdueCount > 99 ? '99+' : overdueCount}
            </span>
          )}
        </button>
      </div>

      {/* Modal Swipe Disposisi (Lapor Masal) */}
      {isBatchReportOpen && (
        <BatchQuickReportModal
          items={feedItems || []}
          onClose={() => setIsBatchReportOpen(false)}
        />
      )}

      {/* Modal Popover Portal Pintar (QuickLinksWidget) */}
      <AnimatePresence>
        {isPortalPintarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPortalPintarOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed bottom-4 right-4 md:bottom-16 md:right-8 z-[70] w-[calc(100vw-2rem)] md:w-[420px]"
            >
              <QuickLinksWidget variant="modal" onClose={() => setIsPortalPintarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
