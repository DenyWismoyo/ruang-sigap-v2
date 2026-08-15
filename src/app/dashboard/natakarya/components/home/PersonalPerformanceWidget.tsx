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
    <Card className="card-solid rounded-xl border-t-4 border-t-green-500 shadow-md overflow-hidden bg-gradient-to-br from-card to-card/90">
      <CardHeader className="bg-muted/30 border-b border-border p-4 pb-3">
        <CardTitle className="text-lg font-bold flex items-center justify-between text-foreground">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            Kinerja Saya (30 Hari)
          </div>
          <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-1 rounded-full border border-border">Real-time</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-5 space-y-5">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-10 bg-muted rounded w-full"></div>
            <div className="h-10 bg-muted rounded w-full"></div>
            <div className="h-10 bg-muted rounded w-full"></div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Tugas Progress */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 size={16} className="text-blue-500" />
                  Tugas Diselesaikan
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.tugasSelesai} <span className="text-sm font-medium text-muted-foreground">/ {stats.totalTugas}</span>
                </div>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.totalTugas > 0 ? (stats.tugasSelesai / stats.totalTugas) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Ketepatan Waktu */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock size={16} className="text-emerald-500" />
                  Ketepatan Waktu
                </div>
                <div className="flex items-center gap-1">
                  {stats.ketepatanWaktu >= 80 ? (
                    <TrendingUp size={16} className="text-emerald-500" />
                  ) : stats.ketepatanWaktu < 50 && stats.tugasSelesai > 0 ? (
                    <TrendingDown size={16} className="text-red-500" />
                  ) : null}
                  <span className="text-2xl font-bold text-foreground">{stats.ketepatanWaktu}%</span>
                </div>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${stats.ketepatanWaktu >= 80 ? 'bg-emerald-500' : stats.ketepatanWaktu >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${stats.ketepatanWaktu}%` }}
                ></div>
              </div>
            </div>

            {/* Disposisi Diproses */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Send size={16} className="text-indigo-500" />
                  Disposisi Diproses
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {stats.disposisiDiproses} <span className="text-sm font-medium text-muted-foreground">/ {stats.totalDisposisi}</span>
                </div>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.totalDisposisi > 0 ? (stats.disposisiDiproses / stats.totalDisposisi) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
