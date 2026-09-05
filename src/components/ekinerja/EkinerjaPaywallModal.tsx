"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { callCloudFunction, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Check,
  CheckCircle2,
  ExternalLink,
  QrCode,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EkinerjaPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tenant?: 'sigap' | 'poros';
}

export const EkinerjaPaywallModal: React.FC<EkinerjaPaywallModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tenant = 'sigap',
}) => {
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState<'OFFER' | 'QRIS' | 'SUCCESS'>('OFFER');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setStep('OFFER');
      setLoading(false);
      setErrorMessage(null);
      setTransactionId(null);
      setQrCodeUrl(null);
      setPaymentLink(null);
    }
  }, [isOpen]);

  // Listener realtime Firestore untuk mendeteksi webhook Mayar (status = PAID)
  useEffect(() => {
    if (!transactionId || step === 'SUCCESS') return;

    const txRef = doc(db, 'transactions', transactionId);
    const unsubscribe = onSnapshot(txRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.status === 'PAID') {
          setStep('SUCCESS');
          // Berikan delay sejenak agar user melihat animasi sukses
          setTimeout(() => {
            onSuccess?.();
          }, 2000);
        }
      }
    }, (err) => {
      console.warn('[EkinerjaPaywallModal] Snapshot listener error:', err);
    });

    return () => unsubscribe();
  }, [transactionId, step, onSuccess]);

  const handlePayWithQris = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const createQrisFn = callCloudFunction('createEkinerjaDynamicQris');
      const result: any = await createQrisFn({
        userEmail: user?.email || userProfile?.email || '',
        userName: userProfile?.namaLengkap || user?.displayName || 'Pegawai ASN',
      });

      const data = result.data;
      if (data?.transactionId && data?.qrCodeUrl) {
        setTransactionId(data.transactionId);
        setQrCodeUrl(data.qrCodeUrl);
        setStep('QRIS');
      } else {
        throw new Error('Gagal mendapatkan QRIS dari gateway Mayar.');
      }
    } catch (err: any) {
      console.error('[EkinerjaPaywallModal] QRIS Error:', err);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat membuat QRIS. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithInvoice = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const createInvoiceFn = callCloudFunction('createEkinerjaPaymentInvoice');
      const result: any = await createInvoiceFn({
        userEmail: user?.email || userProfile?.email || '',
        userName: userProfile?.namaLengkap || user?.displayName || 'Pegawai ASN',
      });

      const data = result.data;
      if (data?.transactionId && data?.paymentLink) {
        setTransactionId(data.transactionId);
        setPaymentLink(data.paymentLink);
        // Buka tab checkout Mayar
        window.open(data.paymentLink, '_blank', 'noopener,noreferrer');
        setStep('QRIS'); // Arahkan ke step waiting confirmation
      } else {
        throw new Error('Gagal membuat tautan pembayaran Mayar.');
      }
    } catch (err: any) {
      console.error('[EkinerjaPaywallModal] Invoice Error:', err);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat menghubungi Mayar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const isSigap = tenant === 'sigap';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) onClose(); }}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        
        {/* HEADER BRANDING */}
        <div className={cn(
          "px-6 py-5 text-white relative overflow-hidden",
          isSigap 
            ? "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800" 
            : "bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800"
        )}>
          {/* Subtle decoration elements */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute right-12 -bottom-10 w-24 h-24 bg-white/10 rounded-full blur-lg pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs px-2.5 py-0.5 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Add-on Personal Premium
              </Badge>
              <Badge className="bg-white/15 text-white border border-white/20 text-xs font-medium">
                Mayar.id Verified
              </Badge>
            </div>

            <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              Aktivasi Jembatan e-Kinerja Solo
            </DialogTitle>

            <DialogDescription className="text-blue-100 dark:text-teal-100 text-xs mt-1 leading-relaxed">
              Otomasi pengisian formulir 8 kolom kegiatan harian ke portal e-Kinerja BKPSDM Surakarta secara instan tanpa perlu ketik manual.
            </DialogDescription>
          </div>
        </div>

        {/* BODY CONTENT */}
        <div className="p-6 space-y-5 bg-white dark:bg-slate-900">

          {/* STEP 1: OFFER & BENEFIT */}
          {step === 'OFFER' && (
            <>
              {/* Feature Checklist */}
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Ekstensi Chrome Bridge (Zero-Click):</span>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Kirim data logbook langsung ke tab e-Kinerja BKPSDM yang sedang terbuka tanpa perantara.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">Bookmarklet Browser 1-Klik:</span>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Alternatif fleksibel untuk semua browser (Chrome, Edge, Firefox) cukup dengan 1 klik.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">152 Kamus Aktivitas Kepwal 786/154/2020:</span>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">Auto-deteksi uraian tugas & integrasi link berkas Google Drive secara otomatis.</p>
                  </div>
                </div>
              </div>

              {/* Price Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl border-2 border-blue-500/30 dark:border-teal-500/30 bg-blue-50/50 dark:bg-teal-950/20">
                <div>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Tarif Langganan</span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">Rp 50.000</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ 30 Hari</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                    Hanya ~Rp 1.660 / hari
                  </span>
                </div>

                <div className="text-right">
                  <Badge variant="outline" className="text-[10px] text-slate-600 dark:text-slate-300 border-slate-300">
                    Aktivasi Otomatis
                  </Badge>
                  <p className="text-[10px] text-slate-400 mt-1">Perpanjangan akumulatif</p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={handlePayWithQris}
                  disabled={loading}
                  className={cn(
                    "w-full h-11 text-white font-semibold text-sm shadow-md transition-all gap-2",
                    isSigap 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-teal-600 hover:bg-teal-700"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menghubungi Gateway Mayar...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      Bayar Sekarang via QRIS (Rp 50.000)
                    </>
                  )}
                </Button>

                <Button
                  onClick={handlePayWithInvoice}
                  disabled={loading}
                  variant="outline"
                  className="w-full h-10 text-xs font-medium border-slate-200 dark:border-slate-700 gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Metode Pembayaran Lainnya (Virtual Account / Kartu / E-Wallet)
                </Button>
              </div>

              <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Pembayaran aman terverifikasi via payment gateway Mayar.id
              </p>
            </>
          )}

          {/* STEP 2: QRIS / WAITING CONFIRMATION */}
          {step === 'QRIS' && (
            <div className="space-y-4 text-center py-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold animate-pulse">
                <Clock className="w-3.5 h-3.5" />
                Menunggu Pembayaran Terkonfirmasi
              </div>

              {qrCodeUrl ? (
                <div className="flex flex-col items-center">
                  <div className="p-3 bg-white border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrCodeUrl} 
                      alt="QRIS Mayar" 
                      className="w-56 h-56 object-contain rounded-lg"
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-3">
                    Scan kode QRIS di atas menggunakan GoPay, OVO, Dana, BCA Mobile, atau perbankan Anda.
                  </p>
                </div>
              ) : paymentLink ? (
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-3">
                    Silakan selesaikan pembayaran di tab checkout Mayar yang baru dibuka.
                  </p>
                  <Button
                    onClick={() => window.open(paymentLink, '_blank')}
                    variant="outline"
                    className="gap-2 text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Ulang Halaman Mayar
                  </Button>
                </div>
              ) : null}

              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Sistem sedang mendeteksi pembayaran secara otomatis (real-time)...</span>
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  onClick={() => setStep('OFFER')}
                  variant="ghost"
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Kembali ke pilihan pembayaran
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'SUCCESS' && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Pembayaran Berhasil Dikonfirmasi!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Akses Jembatan e-Kinerja BKPSDM Solo untuk akun Anda telah aktif selama 30 hari ke depan.
                </p>
              </div>

              <Button
                onClick={() => {
                  onClose();
                  onSuccess?.();
                }}
                className={cn(
                  "w-full text-white font-semibold text-sm gap-2 mt-2",
                  isSigap ? "bg-blue-600 hover:bg-blue-700" : "bg-teal-600 hover:bg-teal-700"
                )}
              >
                Mulai Gunakan e-Kinerja Sekarang
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

        </div>

      </DialogContent>
    </Dialog>
  );
};
