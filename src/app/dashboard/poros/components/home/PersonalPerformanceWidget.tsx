"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { CheckCircle2, Clock, Send, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PersonalPerformanceWidget() {
  const { userProfile, actingJabatanProfile, jabatanProfile } = useUserAuth();
  const [stats, setStats] = useState({
    tugasSelesai: 0,
    totalTugas: 0,
    ketepatanWaktu: 0,
    disposisiDiproses: 0,
    totalDisposisi: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userProfile) return;
      setIsLoading(true);

      try {
        const opdId = userProfile.opdId;
        const activeJabatanId = actingJabatanProfile?.id || jabatanProfile?.id;
        
        // Date range: 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysTimestamp = Timestamp.fromDate(thirtyDaysAgo);

        // Fetch Tasks (Tugas) assigned to user
        const qTugas = query(
          collection(db, 'tugas'),
          where('opdId', '==', opdId)
        );
        const tugasSnapshot = await getDocs(qTugas);
        
        let tugasSelesai = 0;
        let totalTugas = 0;
        let tepatWaktu = 0;

        tugasSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Check if user is involved in this task
          const isAssignee = (data.penerimaIds || []).includes(userProfile.uid);
          const createdAt = data.createdAt;
          
          if (isAssignee && createdAt && createdAt >= thirtyDaysTimestamp) {
            totalTugas++;
            if (data.status === 'Selesai') {
              tugasSelesai++;
              if (data.batasWaktu && data.waktuSelesai && data.waktuSelesai <= data.batasWaktu) {
                tepatWaktu++;
              }
            }
          }
        });

        const ketepatanWaktu = tugasSelesai > 0 ? Math.round((tepatWaktu / tugasSelesai) * 100) : 0;

        // Fetch Disposisi
        const qDispo = query(
          collection(db, 'disposisi'),
          where('opdId', '==', opdId)
        );
        
        const dispoSnapshot = await getDocs(qDispo);
        let disposisiDiproses = 0;
        let totalDisposisi = 0;

        dispoSnapshot.docs.forEach(doc => {
          const data = doc.data();
          const tanggal = data.tanggalDisposisi;
          
          if (activeJabatanId && tanggal && tanggal >= thirtyDaysTimestamp) {
            const isForMe = (data.kepadaJabatanId || []).includes(activeJabatanId);
            const isDoneByMe = (data.penerimaSelesai || []).includes(activeJabatanId);
            
            if (isForMe) {
              totalDisposisi++;
              if (isDoneByMe) {
                disposisiDiproses++;
              }
            }
          }
        });

        setStats({
          tugasSelesai,
          totalTugas,
          ketepatanWaktu,
          disposisiDiproses,
          totalDisposisi
        });
      } catch (error) {
        console.error("Error fetching performance stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [userProfile, actingJabatanProfile, jabatanProfile]);

  return (
    <Card className="bg-transparent md:bg-card border-x-0 border-t-0 border-b border-border/20 md:border md:border-border shadow-none md:shadow-[var(--nk-shadow-sm)] hover:md:shadow-[var(--nk-shadow-md)] md:transition-all md:duration-300 hover:md:-translate-y-0.5 overflow-hidden relative rounded-none md:rounded-[var(--radius)]">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none hidden md:block" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none hidden md:block" />

      <CardHeader className="bg-transparent md:bg-white/5 dark:md:bg-black/10 border-b border-border/20 md:border-white/10 px-4 py-3 md:p-5 md:pb-4 relative z-10">
        <CardTitle className="text-sm md:text-lg font-bold flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="p-1.5 md:p-2 rounded-lg bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(13,107,98,0.2)] animate-nk-glow-pulse">
              <Target className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <span className="nk-text-gradient tracking-tight">Kinerja Saya (30 Hari)</span>
          </div>
          <span className="nk-badge-gold flex items-center gap-1.5 shadow-sm border border-amber-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Real-time
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="px-4 py-4 md:p-6 space-y-4 md:space-y-6 relative z-10">
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-muted/50 rounded w-1/3"></div>
                  <div className="h-6 bg-muted/50 rounded w-1/4"></div>
                </div>
                <div className="h-3 bg-muted/30 rounded-full w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-7"
          >
            {/* Tugas Progress */}
            <div className="group">
              <div className="flex justify-between items-end mb-2.5">
                <div className="flex items-center gap-2 md:gap-2.5 text-xs md:text-sm font-semibold text-foreground/90 group-hover:text-blue-500 transition-colors">
                  <div className="p-1 md:p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500" />
                  </div>
                  Tugas Diselesaikan
                </div>
                <div className="text-xl md:text-2xl font-black text-foreground drop-shadow-sm">
                  {stats.tugasSelesai} <span className="text-xs md:text-sm font-medium text-muted-foreground">/ {stats.totalTugas}</span>
                </div>
              </div>
              <div className="w-full bg-secondary/50 dark:bg-black/20 border border-black/5 dark:border-white/5 h-1.5 md:h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] relative overflow-hidden" 
                  style={{ width: `${stats.totalTugas > 0 ? (stats.tugasSelesai / stats.totalTugas) * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-nk-shimmer" />
                </div>
              </div>
            </div>

            {/* Ketepatan Waktu */}
            <div className="group">
              <div className="flex justify-between items-end mb-2.5">
                <div className="flex items-center gap-2 md:gap-2.5 text-xs md:text-sm font-semibold text-foreground/90 group-hover:text-emerald-500 transition-colors">
                  <div className="p-1 md:p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                  </div>
                  Ketepatan Waktu
                </div>
                <div className="flex items-center gap-1 md:gap-1.5">
                  {stats.ketepatanWaktu >= 80 ? (
                    <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 drop-shadow-sm" />
                  ) : stats.ketepatanWaktu < 50 && stats.tugasSelesai > 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500 drop-shadow-sm" />
                  ) : null}
                  <span className={`text-xl md:text-2xl font-black drop-shadow-sm ${stats.ketepatanWaktu >= 80 ? 'text-emerald-500' : stats.ketepatanWaktu >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {stats.ketepatanWaktu}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-secondary/50 dark:bg-black/20 border border-black/5 dark:border-white/5 h-1.5 md:h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor] relative overflow-hidden ${
                    stats.ketepatanWaktu >= 80 ? 'bg-gradient-to-r from-emerald-600 to-teal-400 text-emerald-500' : 
                    stats.ketepatanWaktu >= 50 ? 'bg-gradient-to-r from-amber-600 to-yellow-400 text-amber-500' : 
                    'bg-gradient-to-r from-red-600 to-rose-400 text-red-500'
                  }`}
                  style={{ width: `${stats.ketepatanWaktu}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-nk-shimmer" />
                </div>
              </div>
            </div>

            {/* Disposisi Diproses */}
            <div className="group">
              <div className="flex justify-between items-end mb-2.5">
                <div className="flex items-center gap-2 md:gap-2.5 text-xs md:text-sm font-semibold text-foreground/90 group-hover:text-indigo-500 transition-colors">
                  <div className="p-1 md:p-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                    <Send className="w-3.5 h-3.5 md:w-4 md:h-4 text-indigo-500" />
                  </div>
                  Disposisi Diproses
                </div>
                <div className="text-xl md:text-2xl font-black text-foreground drop-shadow-sm">
                  {stats.disposisiDiproses} <span className="text-xs md:text-sm font-medium text-muted-foreground">/ {stats.totalDisposisi}</span>
                </div>
              </div>
              <div className="w-full bg-secondary/50 dark:bg-black/20 border border-black/5 dark:border-white/5 h-1.5 md:h-3 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-indigo-600 to-purple-400 shadow-[0_0_10px_rgba(79,70,229,0.5)] relative overflow-hidden" 
                  style={{ width: `${stats.totalDisposisi > 0 ? (stats.disposisiDiproses / stats.totalDisposisi) * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-nk-shimmer" />
                </div>
              </div>
            </div>
            
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
