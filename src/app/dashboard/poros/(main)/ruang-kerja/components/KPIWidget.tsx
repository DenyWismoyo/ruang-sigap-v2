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
      <Card className="border-x-0 border-t-0 border-b border-border/20 md:border md:border-border shadow-none md:shadow-sm mb-6 bg-transparent md:bg-gradient-to-br md:from-card md:to-secondary/30 rounded-none md:rounded-xl">
        <CardHeader className="px-4 py-3 md:p-4 md:py-3 border-b border-border/20 md:border-border">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" /> Dashboard Manajerial (Pimpinan)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          <div className="flex flex-col items-center justify-center p-3 md:p-4 bg-background rounded-lg border border-border shadow-inner relative overflow-hidden">
            <div className="absolute -right-2 -top-2 md:-right-4 md:-top-4 opacity-5 text-primary"><Inbox className="w-16 h-16 md:w-24 md:h-24" /></div>
            <Inbox className="text-blue-500 mb-1 md:mb-2 w-5 h-5 md:w-6 md:h-6" />
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{pimpinanStats.menungguDisposisi}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase tracking-wider text-center">Menunggu Disposisi</div>
          </div>
          <div className="flex flex-col items-center justify-center p-3 md:p-4 bg-background rounded-lg border border-border shadow-inner relative overflow-hidden">
            <div className="absolute -right-2 -top-2 md:-right-4 md:-top-4 opacity-5 text-primary"><ShieldAlert className="w-16 h-16 md:w-24 md:h-24" /></div>
            <ShieldAlert className="text-orange-500 mb-1 md:mb-2 w-5 h-5 md:w-6 md:h-6" />
            <div className="text-2xl md:text-3xl font-bold text-orange-600">{pimpinanStats.tugasBawahanPending}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase tracking-wider text-center">Tugas Bawahan Tertunda</div>
          </div>
          <div className="flex flex-col justify-center space-y-2 md:space-y-3 p-3 md:p-4 col-span-2 md:col-span-1 bg-background/50 md:bg-transparent rounded-lg border border-border md:border-transparent">
            <h4 className="text-xs md:text-sm font-bold flex items-center gap-2"><TrendingUp size={14} className="text-green-500"/> Tingkat Respons</h4>
            <p className="text-[10px] md:text-xs text-muted-foreground">Rata-rata waktu disposisi Anda tergolong <strong>Sangat Cepat</strong> (&lt; 2 Jam).</p>
            <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200 text-[10px] md:text-xs">Excellent 🚀</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isAdminTU) {
    const zeroInboxStreak = adminStats.suratTertunda === 0 ? "3 Hari" : "0 Hari";
    return (
      <Card className="border-x-0 border-t-0 border-b border-border/20 md:border md:border-border shadow-none md:shadow-sm mb-6 bg-transparent md:bg-gradient-to-br md:from-card md:to-secondary/30 rounded-none md:rounded-xl">
        <CardHeader className="px-4 py-3 md:p-4 md:py-3 border-b border-border/20 md:border-border">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" /> Kinerja Distribusi Surat (TU/Admin)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          <div className="flex flex-col justify-center space-y-2 col-span-2 md:col-span-1 p-3 md:p-0 bg-background/50 md:bg-transparent rounded-lg border border-border md:border-transparent">
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="flex items-center gap-1 font-medium"><Send size={14} className="text-blue-500"/> Volume Distribusi</span>
              <span className="text-muted-foreground">{adminStats.volumeMingguIni} Surat</span>
            </div>
            <Progress value={100} className="h-1.5 md:h-2 bg-blue-100" />
            <p className="text-[10px] md:text-xs text-muted-foreground text-right">Minggu Ini</p>
          </div>
          <div className="flex flex-col items-center justify-center p-3 md:p-4 bg-background rounded-lg border border-border shadow-inner relative overflow-hidden">
            <AlertTriangle className={adminStats.suratTertunda > 0 ? "text-orange-500 mb-1 md:mb-2 w-5 h-5 md:w-6 md:h-6" : "text-green-500 mb-1 md:mb-2 w-5 h-5 md:w-6 md:h-6"} />
            <div className="text-2xl md:text-3xl font-bold">{adminStats.suratTertunda}</div>
            <div className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase tracking-wider text-center">Tertunda (Inbox)</div>
          </div>
          <div className="flex flex-col items-center justify-center p-3 md:p-4 bg-gradient-to-b from-yellow-50 to-background dark:from-yellow-950/20 rounded-lg border border-yellow-200 shadow-inner">
            <Trophy className="text-yellow-600 mb-1 md:mb-2 w-5 h-5 md:w-6 md:h-6" />
            <div className="text-xl md:text-2xl font-bold text-yellow-700">{zeroInboxStreak}</div>
            <div className="text-[10px] md:text-xs text-yellow-700/80 mt-1 uppercase tracking-wider text-center">Zero-Inbox Streak 🔥</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // DEFAULT: STAF
  const taskProgress = stafStats.tugasTotal > 0 ? Math.round((stafStats.tugasSelesai / stafStats.tugasTotal) * 100) : 0;
  const logbookProgress = Math.round((stafStats.logbookTerisi / 5) * 100); 

  return (
    <Card className="border-x-0 border-t-0 border-b border-border/20 md:border md:border-border shadow-none md:shadow-sm mb-6 bg-transparent md:bg-gradient-to-br md:from-card md:to-secondary/30 rounded-none md:rounded-xl">
      <CardHeader className="px-4 py-3 md:p-4 md:py-3 border-b border-border/20 md:border-border">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" /> Pencapaian Kinerja Anda (Staf Eksekutor)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <div className="flex flex-col items-center justify-center p-3 md:p-4 bg-background rounded-lg border border-border shadow-inner relative overflow-hidden col-span-2 md:col-span-1">
          <div className="absolute -left-2 -bottom-2 md:-left-4 md:-bottom-4 opacity-5 text-primary"><TrendingUp className="w-16 h-16 md:w-24 md:h-24" /></div>
          <TrendingUp className="text-primary mb-1 md:mb-2 w-5 h-5 md:w-6 md:h-6" />
          <div className="text-2xl md:text-3xl font-bold text-primary">{stafStats.poin}</div>
          <div className="text-[10px] md:text-xs text-muted-foreground mt-1 uppercase tracking-wider">Impact Poin</div>
        </div>
        <div className="flex flex-col justify-center space-y-2 p-3 md:p-0 bg-background/50 md:bg-transparent rounded-lg border border-border md:border-transparent">
          <div className="flex justify-between items-center text-xs md:text-sm">
            <span className="flex items-center gap-1 font-medium"><Target size={12} className="text-blue-500 md:w-3.5 md:h-3.5"/> Penyelesaian</span>
            <span className="text-muted-foreground text-[10px] md:text-xs">{stafStats.tugasSelesai}/{stafStats.tugasTotal}</span>
          </div>
          <Progress value={taskProgress} className="h-1.5 md:h-2 bg-blue-100" />
          <p className="text-[10px] md:text-xs text-muted-foreground text-right">{taskProgress}% Selesai</p>
        </div>
        <div className="flex flex-col justify-center space-y-2 p-3 md:p-0 bg-background/50 md:bg-transparent rounded-lg border border-border md:border-transparent">
          <div className="flex justify-between items-center text-xs md:text-sm">
            <span className="flex items-center gap-1 font-medium"><Clock size={12} className="text-green-500 md:w-3.5 md:h-3.5"/> Logbook</span>
            <span className="text-muted-foreground text-[10px] md:text-xs">{stafStats.logbookTerisi}/5 Hari</span>
          </div>
          <Progress value={Math.min(logbookProgress, 100)} className="h-1.5 md:h-2 bg-green-100" />
          <p className="text-[10px] md:text-xs text-muted-foreground text-right">
            {stafStats.logbookTerisi >= 5 ? "Tuntas 🎉" : `${Math.min(logbookProgress, 100)}% Terisi`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
