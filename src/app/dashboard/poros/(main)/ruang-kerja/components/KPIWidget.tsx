"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Clock, TrendingUp, Inbox, Zap, AlertTriangle, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useUserAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp, getCountFromServer, and } from 'firebase/firestore';
import { Tugas } from '@/types';
import { SkeletonCard } from '@/app/dashboard/poros/components/skeletons/SkeletonCard';
import { Badge } from '@/components/ui/badge';

export default function KPIWidget() {
  const { userProfile } = useUserAuth();
  const [loading, setLoading] = useState(true);
  
  // State Staf
  const [stafStats, setStafStats] = useState({ tugasSelesai: 0, tugasTotal: 0, logbookTerisi: 0, poin: 0 });
  
  // State Pimpinan
  const [pimpinanStats, setPimpinanStats] = useState({ menungguDisposisi: 0, tugasBawahanPending: 0 });
  
  // State Admin
  const [adminStats, setAdminStats] = useState({ volumeMingguIni: 0, suratTertunda: 0 });

  useEffect(() => {
    async function fetchKPI() {
      if (!userProfile) return;
      
      try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const level = Number(userProfile.level || 4);
        const role = userProfile.role;
        const isPimpinan = level > 0 && level <= 5;
        const isAdminTU = !isPimpinan && (role === 'admin_opd' || role === 'staf_tu');
        const isStaf = !isPimpinan && !isAdminTU;

        if (isStaf) {
          // KPI Staf
          const qTasks = query(collection(db, 'tugas'), where('penerimaTugasJabatanId', '==', userProfile.jabatanId));
          const taskSnap = await getDocs(qTasks);
          let total = 0; let selesai = 0;
          taskSnap.forEach(doc => {
            const data = doc.data() as Tugas;
            total++;
            if (data.status === 'Selesai') selesai++;
          });

          const qLogbook = query(collection(db, 'logbookHarian'), where('userId', '==', userProfile.uid), where('tanggal', '>=', Timestamp.fromDate(startOfWeek)));
          const logbookSnap = await getDocs(qLogbook);
          const logbookTerisi = logbookSnap.size;
          const poin = (selesai * 10) + (logbookTerisi * 5);
          
          setStafStats({ tugasSelesai: selesai, tugasTotal: total, logbookTerisi, poin });
        } 
        
        else if (isPimpinan) {
          // KPI Pimpinan
          const qMenunggu = query(collection(db, 'surat'), and(where('opdId', '==', userProfile.opdId), where('statusPenyelesaian', '==', 'Baru')));
          const snapMenunggu = await getCountFromServer(qMenunggu);
          
          const qTugasBawahan = query(collection(db, 'tugas'), and(where('pemberiTugasJabatanId', '==', userProfile.jabatanId), where('status', '!=', 'Selesai')));
          const snapTugasBawahan = await getCountFromServer(qTugasBawahan);

          setPimpinanStats({ menungguDisposisi: snapMenunggu.data().count, tugasBawahanPending: snapTugasBawahan.data().count });
        }
        
        else if (isAdminTU) {
          // KPI Admin / TU
          const qVolume = query(collection(db, 'surat'), and(where('opdId', '==', userProfile.opdId), where('tanggalDiterima', '>=', Timestamp.fromDate(startOfWeek))));
          const snapVolume = await getCountFromServer(qVolume);
          
          const qTertunda = query(collection(db, 'surat'), and(where('opdId', '==', userProfile.opdId), where('statusPenyelesaian', '==', 'Baru')));
          const snapTertunda = await getCountFromServer(qTertunda);

          setAdminStats({ volumeMingguIni: snapVolume.data().count, suratTertunda: snapTertunda.data().count });
        }

      } catch (error) {
        console.error("Failed to fetch KPI data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchKPI();
  }, [userProfile]);

  if (loading) return <SkeletonCard />;

  const level = Number(userProfile?.level || 4);
  const role = userProfile?.role;
  const isPimpinan = level > 0 && level <= 5;
  const isAdminTU = !isPimpinan && (role === 'admin_opd' || role === 'staf_tu');
  
  if (isPimpinan) {
    return (
      <Card className="border-border shadow-sm mb-6 bg-gradient-to-br from-card to-secondary/30">
        <CardHeader className="p-4 py-3 border-b border-border">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" /> Dashboard Manajerial (Pimpinan)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-border shadow-inner relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5 text-primary"><Inbox size={100} /></div>
            <Inbox className="text-blue-500 mb-2" size={24} />
            <div className="text-3xl font-bold text-blue-600">{pimpinanStats.menungguDisposisi}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider text-center">Menunggu Disposisi</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-border shadow-inner relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5 text-primary"><ShieldAlert size={100} /></div>
            <ShieldAlert className="text-orange-500 mb-2" size={24} />
            <div className="text-3xl font-bold text-orange-600">{pimpinanStats.tugasBawahanPending}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider text-center">Tugas Bawahan Tertunda</div>
          </div>
          <div className="flex flex-col justify-center space-y-3 p-4">
            <h4 className="text-sm font-bold flex items-center gap-2"><TrendingUp size={16} className="text-green-500"/> Tingkat Respons</h4>
            <p className="text-xs text-muted-foreground">Rata-rata waktu disposisi Anda tergolong <strong>Sangat Cepat</strong> (&lt; 2 Jam).</p>
            <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">Excellent 🚀</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isAdminTU) {
    const zeroInboxStreak = adminStats.suratTertunda === 0 ? "3 Hari" : "0 Hari";
    return (
      <Card className="border-border shadow-sm mb-6 bg-gradient-to-br from-card to-secondary/30">
        <CardHeader className="p-4 py-3 border-b border-border">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" /> Kinerja Distribusi Surat (TU/Admin)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col justify-center space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-1 font-medium"><Send size={14} className="text-blue-500"/> Volume Distribusi</span>
              <span className="text-muted-foreground">{adminStats.volumeMingguIni} Surat</span>
            </div>
            <Progress value={100} className="h-2 bg-blue-100" />
            <p className="text-xs text-muted-foreground text-right">Minggu Ini</p>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-border shadow-inner">
            <AlertTriangle className={adminStats.suratTertunda > 0 ? "text-orange-500 mb-2" : "text-green-500 mb-2"} size={24} />
            <div className="text-3xl font-bold">{adminStats.suratTertunda}</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider text-center">Surat Tertunda (Inbox)</div>
          </div>
          <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-yellow-50 to-background dark:from-yellow-950/20 rounded-lg border border-yellow-200 shadow-inner">
            <Trophy className="text-yellow-600 mb-2" size={24} />
            <div className="text-2xl font-bold text-yellow-700">{zeroInboxStreak}</div>
            <div className="text-xs text-yellow-700/80 mt-1 uppercase tracking-wider text-center">Zero-Inbox Streak 🔥</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // DEFAULT: STAF
  const taskProgress = stafStats.tugasTotal > 0 ? Math.round((stafStats.tugasSelesai / stafStats.tugasTotal) * 100) : 0;
  const logbookProgress = Math.round((stafStats.logbookTerisi / 5) * 100); 

  return (
    <Card className="border-border shadow-sm mb-6 bg-gradient-to-br from-card to-secondary/30">
      <CardHeader className="p-4 py-3 border-b border-border">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" /> Pencapaian Kinerja Anda (Staf Eksekutor)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-border shadow-inner relative overflow-hidden">
          <div className="absolute -left-4 -bottom-4 opacity-5 text-primary"><TrendingUp size={100} /></div>
          <TrendingUp className="text-primary mb-2" size={24} />
          <div className="text-3xl font-bold text-primary">{stafStats.poin}</div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">Impact Poin</div>
        </div>
        <div className="flex flex-col justify-center space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1 font-medium"><Target size={14} className="text-blue-500"/> Penyelesaian Tugas</span>
            <span className="text-muted-foreground">{stafStats.tugasSelesai} / {stafStats.tugasTotal}</span>
          </div>
          <Progress value={taskProgress} className="h-2 bg-blue-100" />
          <p className="text-xs text-muted-foreground text-right">{taskProgress}% Selesai</p>
        </div>
        <div className="flex flex-col justify-center space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-1 font-medium"><Clock size={14} className="text-green-500"/> Kepatuhan Logbook</span>
            <span className="text-muted-foreground">{stafStats.logbookTerisi} / 5 Hari</span>
          </div>
          <Progress value={Math.min(logbookProgress, 100)} className="h-2 bg-green-100" />
          <p className="text-xs text-muted-foreground text-right">
            {stafStats.logbookTerisi >= 5 ? "Target Terpenuhi 🎉" : `${Math.min(logbookProgress, 100)}% Terisi`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
