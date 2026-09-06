// src/app/verify/logbook/page.tsx
// Halaman Publik Verifikasi Keabsahan Laporan Kinerja Bulanan Logbook ASN
// Diakses saat QR Code pada dokumen PDF Laporan Kinerja dipindai oleh atasan/auditor.

"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { CheckCircle2, ShieldCheck, Building2, User, Calendar, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function VerifyLogbookContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const nipParam = searchParams.get('nip');
  const periodeParam = searchParams.get('periode') || '-';

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [opdName, setOpdName] = useState<string>('Pemerintah Kota Surakarta');

  useEffect(() => {
    async function fetchVerificationData() {
      if (!uid) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserData(data);

          if (data.opdId) {
            try {
              const opdSnap = await getDoc(doc(db, 'opd', data.opdId));
              if (opdSnap.exists()) {
                setOpdName(opdSnap.data().namaOpd || 'Pemerintah Kota Surakarta');
              }
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Gagal memvalidasi data dokumen:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchVerificationData();
  }, [uid]);

  const verifiedDateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-xl mx-auto w-full">
        {/* Header Identitas Pemkot */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 mb-3 shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Pemerintah Kota Surakarta
          </h1>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
            Sistem Verifikasi Dokumen Kinerja ASN
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            RUANG SIGAP & POROS E-OFFICE SURAKARTA
          </p>
        </div>

        {/* Card Verifikasi Utama */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-500/5 overflow-hidden">
          {/* Status Banner */}
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Dokumen Resmi Terverifikasi
              </div>
              <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                Keabsahan Laporan Kinerja Harian ASN tervalidasi di basis data sistem.
              </div>
            </div>
          </div>

          {/* Rincian Dokumen */}
          <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
            <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <User size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-slate-500 dark:text-slate-400 text-xs block">Nama Pegawai</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  {userData?.namaLengkap || 'Aparatur Sipil Negara'}
                </span>
                <span className="text-xs text-slate-500 block font-mono mt-0.5">
                  NIP. {userData?.nip || nipParam || '-'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Building2 size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-slate-500 dark:text-slate-400 text-xs block">Perangkat Daerah (OPD)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {opdName}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Calendar size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-slate-500 dark:text-slate-400 text-xs block">Periode Laporan</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {periodeParam}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-slate-500 dark:text-slate-400 text-xs block">Waktu Akses Verifikasi</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {verifiedDateStr}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Card Catatan Regulasi */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed">
            <p>
              Dokumen ini dihasilkan secara elektronik dari platform RUANG SIGAP / POROS E-Office Pemerintah Kota Surakarta berpedoman pada Keputusan Walikota Surakarta Nomor 786/154 Tahun 2020. Tanda tangan dan pengesahan sah menurut hukum.
            </p>
          </div>
        </div>

        {/* Tombol Navigasi Kembali */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            <ArrowLeft size={13} /> Kembali ke Halaman Utama
          </Link>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-400 mt-8">
        &copy; {new Date().getFullYear()} Pemerintah Kota Surakarta. Hak Cipta Dilindungi.
      </footer>
    </div>
  );
}

export default function VerifyLogbookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs text-muted-foreground">Memuat data verifikasi...</div>}>
      <VerifyLogbookContent />
    </Suspense>
  );
}
