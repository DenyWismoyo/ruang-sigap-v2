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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Bot,
  Trophy,
  X,
  Layers,
  FileCheck,
  Compass
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
  const [activeTab, setActiveTab] = useState<'keunggulan' | 'perbandingan'>('keunggulan');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setStep('OFFER');
      setActiveTab('keunggulan');
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
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl max-h-[92vh] flex flex-col">
        
        {/* HEADER BRANDING DENGAN VALUE HOOK KUAT */}
        <div className={cn(
          "px-6 py-5 text-white relative overflow-hidden shrink-0",
          isSigap 
            ? "bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900" 
            : "bg-gradient-to-br from-teal-700 via-teal-900 to-slate-900"
        )}>
          {/* Decorative glowing blobs */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-14 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className="bg-amber-400/25 text-amber-200 border border-amber-300/40 text-xs px-2.5 py-0.5 font-bold flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                Add-on Personal Premium
              </Badge>
              <Badge className="bg-white/15 text-white border border-white/25 text-xs font-medium">
                Mayar.id Verified Gateway
              </Badge>
            </div>

            <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0" />
              Akselerator e-Kinerja & AI Logbook Solo
            </DialogTitle>

            <DialogDescription className="text-blue-100/90 dark:text-teal-100/90 text-xs sm:text-[13px] mt-1.5 leading-relaxed max-w-xl">
              Otomasi pengisian formulir 8 kolom portal e-Kinerja BKPSDM Surakarta, AI pemecah kegiatan berpoin maksimal, dan pelacak kepastian TPP 100% tanpa cemas.
            </DialogDescription>

            {/* Benefit stat pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-3 flex-wrap text-[11px] font-semibold text-white/90">
              <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20">⏱️ Hemat 2 Jam/Hari</span>
              <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20">🎯 Target TPP 100% Aman</span>
              <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20">🤖 AI Multi-Activity</span>
              <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/20">🚀 Zero-Click Sync</span>
            </div>
          </div>
        </div>

        {/* BODY CONTENT DENGAN SCROLL AREA */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 bg-white dark:bg-slate-900 flex-1">

          {/* STEP 1: OFFER & MATRIKS PERBANDINGAN */}
          {step === 'OFFER' && (
            <>
              <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 p-1">
                  <TabsTrigger value="keunggulan" className="text-xs font-semibold py-1.5">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Keunggulan Fitur
                  </TabsTrigger>
                  <TabsTrigger value="perbandingan" className="text-xs font-semibold py-1.5">
                    <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Perbandingan (Free vs PRO)
                  </TabsTrigger>
                </TabsList>

                {/* TAB 1: KEUNGGULAN FITUR PREMIUM */}
                <TabsContent value="keunggulan" className="pt-3 space-y-2.5">
                  {/* Benefit 1: AI Multi-Activity */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        AI Smart Entry (Multi-Activity Decomposer)
                        <span className="text-[10px] bg-orange-500/15 text-orange-600 dark:text-orange-300 font-semibold px-1.5 py-0.2 rounded">Poin Maksimal</span>
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                        Ketik bebas atau diktekan aktivitas seharian. AI secara cerdas <strong>memecah</strong> menjadi butir-butir kegiatan resmi Kepwal yang terpisah (tanpa merangkum) dengan alokasi jam kerja yang tidak bertabrakan.
                      </p>
                    </div>
                  </div>

                  {/* Benefit 2: Realtime SKP Tracker */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        Realtime SKP & Poin Kinerja Tracker
                        <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold px-1.5 py-0.2 rounded">Jaminan TPP 100%</span>
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                        Kalkulator otomatis akumulasi poin 152 kamus Kepwal dan jam kerja bulanan (112,5 jam). Indikator visual realtime memberi kepastian target TPP aman sebelum tanggal tutup buku.
                      </p>
                    </div>
                  </div>

                  {/* Benefit 3: Chrome Bridge & Bookmarklet */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        Ekstensi Chrome Bridge (Zero-Click) & Bookmarklet
                        <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold px-1.5 py-0.2 rounded">1-Klik Otomatis</span>
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                        Mengisi seluruh 8 kolom formulir e-Kinerja BKPSDM Solo secara otomatis dan simultan ke tab browser aktif tanpa perlu ketik ulang nama kegiatan, jam, dan poin.
                      </p>
                    </div>
                  </div>

                  {/* Benefit 4: Auto Drive & Timestamp */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        Auto-Sync Google Drive & Waktu Presisi (createdAt)
                      </h4>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                        Penyematan link folder Google Drive bukti dukung per kegiatan dan perekaman jam presisi saat aksi dilakukan secara instan.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: MATRIKS PERBANDINGAN FITUR (FREE VS PRO) */}
                <TabsContent value="perbandingan" className="pt-3">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <th className="p-2.5 font-bold text-slate-700 dark:text-slate-200">Fitur & Layanan</th>
                          <th className="p-2.5 text-center font-semibold text-slate-500 dark:text-slate-400 w-24">Gratis</th>
                          <th className={cn(
                            "p-2.5 text-center font-bold w-28 text-white",
                            isSigap ? "bg-blue-600" : "bg-teal-600"
                          )}>
                            🌟 Premium
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">Catat Logbook & Rekap Teks</td>
                          <td className="p-2.5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-blue-50/30 dark:bg-teal-950/20"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto font-bold" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">Tautkan Tugas & Tindak Lanjut</td>
                          <td className="p-2.5 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-blue-50/30 dark:bg-teal-950/20"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto font-bold" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">Kamus 152 Aktivitas Kepwal Solo</td>
                          <td className="p-2.5 text-center text-[11px] text-amber-600">Manual</td>
                          <td className="p-2.5 text-center bg-blue-50/30 dark:bg-teal-950/20 font-semibold text-blue-700 dark:text-teal-300">Smart Select</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">AI Smart Entry (Multi-Activity)</td>
                          <td className="p-2.5 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-blue-50/30 dark:bg-teal-950/20 font-bold text-orange-600 dark:text-orange-400">Unlimited</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">Tracker Poin SKP & Target Jam TPP</td>
                          <td className="p-2.5 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-blue-50/30 dark:bg-teal-950/20"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto font-bold" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">Jembatan 1-Klik e-Kinerja BKPSDM</td>
                          <td className="p-2.5 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-blue-50/30 dark:bg-teal-950/20 font-bold text-emerald-600">Aktif Penuh</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">Ekstensi Chrome Bridge (Zero-Click)</td>
                          <td className="p-2.5 text-center"><X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" /></td>
                          <td className="p-2.5 text-center bg-blue-50/30 dark:bg-teal-950/20"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto font-bold" /></td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">Penyematan Google Drive Otomatis</td>
                          <td className="p-2.5 text-center text-[11px] text-slate-400">Manual</td>
                          <td className="p-2.5 text-center bg-blue-50/30 dark:bg-teal-950/20"><Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto font-bold" /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>

              {/* BANNER HARGA & ROI VALUE FRAMING */}
              <div className="p-4 rounded-xl border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent dark:from-amber-950/30 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
                    Investasi Proteksi Kinerja & TPP
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Rp 50.000</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">/ 30 Hari</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-0.5">
                    Hanya ~Rp 1.660 / hari • Setara biaya parkir, lindungi TPP jutaan rupiah
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/50">
                    Aktivasi Instan
                  </Badge>
                  <p className="text-[10px] text-slate-400 mt-1">Masa aktif akumulatif</p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="space-y-2 pt-1">
                <Button
                  onClick={handlePayWithQris}
                  disabled={loading}
                  className={cn(
                    "w-full h-11 text-white font-bold text-sm shadow-md transition-all gap-2",
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
                Pembayaran resmi aman terverifikasi via payment gateway Mayar.id
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
                    Scan kode QRIS di atas menggunakan GoPay, OVO, Dana, BCA Mobile, atau m-Banking perbankan Anda.
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
                  Akses Jembatan e-Kinerja BKPSDM Solo dan AI Smart Entry untuk akun Anda telah aktif selama 30 hari ke depan.
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
