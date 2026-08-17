"use client";

import React, { useState } from 'react';
import { useUserAuth } from '@/context/AuthContext';
import { Database, ShieldCheck, RefreshCw, UploadCloud, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SiasnIntegrationPage() {
  const { userProfile, loading } = useUserAuth();
  const [isSyncing, setIsSyncing] = useState(false);

  // Cek otorisasi khusus super_admin
  const isSuperAdmin = userProfile?.role === 'super_admin';

  const handleSync = () => {
    setIsSyncing(true);
    // Simulasi sinkronisasi
    setTimeout(() => {
      setIsSyncing(false);
      alert('Sinkronisasi data BKN selesai. (Simulasi)');
    }, 2000);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat modul integrasi...</div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Akses Ditolak</h2>
        <p className="text-muted-foreground">Halaman ini adalah area konfigurasi tingkat tinggi yang hanya dapat diakses oleh Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp pb-20">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Database className="w-8 h-8 text-[var(--nk-teal-mid)]" />
            Integrasi SIASN / BKN
          </h1>
          <p className="text-muted-foreground mt-2">Pusat kontrol sinkronisasi data kepegawaian dengan database BKN Pusat.</p>
        </div>
        <Button onClick={handleSync} disabled={isSyncing} className="bg-[var(--nk-teal-mid)] hover:bg-[var(--nk-teal-mid)]/90 text-white">
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Sinkronisasi Berjalan...' : 'Mulai Sinkronisasi Master'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="nk-card p-6 border-t-4 border-t-blue-500">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="text-blue-500"/> Sinkronisasi Pegawai</h3>
            <p className="text-sm text-muted-foreground mt-1">Update profil, NIP, dan pangkat/golongan seluruh pegawai dari SIASN.</p>
          </div>
          <div>
             <div className="space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Terakhir Sinkron:</span>
                 <span className="font-semibold text-foreground">Belum Pernah</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Status Koneksi:</span>
                 <span className="text-emerald-500 font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> API Siap</span>
               </div>
               <Button variant="outline" className="w-full mt-2 border-[var(--nk-teal-mid)] text-[var(--nk-teal-mid)] hover:bg-[var(--nk-teal-mid)]/10" onClick={handleSync} disabled={isSyncing}>Tarik Data Pegawai Baru</Button>
             </div>
          </div>
        </div>

        <div className="nk-card p-6 border-t-4 border-t-purple-500">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Settings className="text-purple-500"/> Sinkronisasi Jabatan</h3>
            <p className="text-sm text-muted-foreground mt-1">Update master jabatan, struktur organisasi, dan kelas jabatan dari BKN.</p>
          </div>
          <div>
             <div className="space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Terakhir Sinkron:</span>
                 <span className="font-semibold text-foreground">Belum Pernah</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Status Koneksi:</span>
                 <span className="text-emerald-500 font-semibold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> API Siap</span>
               </div>
               <Button variant="outline" className="w-full mt-2" disabled>Update Master Jabatan (WIP)</Button>
             </div>
          </div>
        </div>

        <div className="nk-card p-6 border-t-4 border-t-orange-500 bg-muted/10">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><UploadCloud className="text-orange-500"/> Push Kinerja Ke BKN</h3>
            <p className="text-sm text-muted-foreground mt-1">Kirimkan data hasil e-kinerja Ruang Sigap kembali ke sistem SIASN BKN.</p>
          </div>
          <div>
             <div className="text-center py-6">
                <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-medium text-muted-foreground mb-4">Fitur sedang dalam pengembangan tahap 2 (membutuhkan kredensial khusus dari BKN).</p>
                <Button variant="secondary" className="w-full bg-muted/50 text-muted-foreground" disabled>Kirim Data Kinerja (Locked)</Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
