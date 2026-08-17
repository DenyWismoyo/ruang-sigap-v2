"use client";

import React, { useState, useEffect } from 'react';
import { useUserAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function MonitoringPage() {
  const { userProfile, jabatanProfile, loading } = useUserAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTasks: 0,
    pendingSurat: 0,
    totalSurat: 0
  });
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Cek otorisasi
  const isAdmin = userProfile?.role === 'super_admin' || userProfile?.role === 'admin_opd';
  const isPimpinan = typeof jabatanProfile?.level === 'number' && jabatanProfile.level <= 2;
  const isAuthorized = isAdmin || isPimpinan;

  useEffect(() => {
    if (!userProfile || !isAuthorized) return;

    const fetchMonitoringData = async () => {
      setIsDataLoading(true);
      try {
        const opdId = userProfile.opdId;
        
        // Fetch Users in OPD
        const qUsers = query(collection(db, 'users'), where('opdId', '==', opdId));
        const usersSnap = await getDocs(qUsers);
        
        // Fetch Active Tasks in OPD
        const qTasks = query(collection(db, 'tugas'), where('opdId', '==', opdId), where('status', 'in', ['Baru', 'Sedang Berjalan']));
        const tasksSnap = await getDocs(qTasks);
        
        // Fetch Surat in OPD
        const qSurat = query(collection(db, 'surat'), where('opdId', '==', opdId));
        const suratSnap = await getDocs(qSurat);
        
        let pendingSurat = 0;
        suratSnap.docs.forEach(doc => {
          if (doc.data().statusDisposisi === 'Belum Didisposikan') {
            pendingSurat++;
          }
        });

        setStats({
          totalUsers: usersSnap.size,
          activeTasks: tasksSnap.size,
          totalSurat: suratSnap.size,
          pendingSurat: pendingSurat
        });

      } catch (error) {
        console.error("Error fetching monitoring data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchMonitoringData();
  }, [userProfile, isAuthorized]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Memuat modul pemantauan...</div>;
  }

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center">
        <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Akses Ditolak</h2>
        <p className="text-muted-foreground">Halaman ini hanya dapat diakses oleh Admin OPD dan Pimpinan (Level 1 & 2).</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Monitoring OPD
          </h1>
          <p className="text-muted-foreground mt-2">Pemantauan aktivitas dan beban kerja instansi secara real-time.</p>
        </div>
      </div>

      {isDataLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-32 nk-card rounded-xl border border-[var(--border)]"></div>)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Pegawai</p>
                    <h3 className="text-3xl font-bold text-foreground">{stats.totalUsers}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Activity size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tugas Aktif (OPD)</p>
                    <h3 className="text-3xl font-bold text-foreground">{stats.activeTasks}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <FileText size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Surat Masuk</p>
                    <h3 className="text-3xl font-bold text-foreground">{stats.totalSurat}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/20 rounded-lg text-orange-600 dark:text-orange-400">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Surat Belum Didisposisi</p>
                    <h3 className="text-3xl font-bold text-foreground">{stats.pendingSurat}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-8 border border-border border-dashed rounded-xl text-center bg-muted/10">
            <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Area Pengembangan Lanjutan</h3>
            <p className="text-sm text-muted-foreground">Di sini nantinya akan ditambahkan metrik performa tiap bidang, heatmap aktivitas login, dan pelacakan beban kerja pegawai secara mendetail.</p>
          </div>
        </>
      )}
    </div>
  );
}
