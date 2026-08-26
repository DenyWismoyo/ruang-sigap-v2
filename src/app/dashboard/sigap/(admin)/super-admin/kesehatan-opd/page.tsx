"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData';
import { OpdConfig } from '@/types';
import { Loader2, HeartPulse, Search, ArrowLeft, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HealthScore {
  opdId: string;
  score: number;
  breakdown?: {
    adopsiUser?: number;
    retensiMingguan?: number;
    produktivitas?: number;
    tepatWaktu?: number;
    suratTerselesaikan?: number;
    ketepatanWaktu?: number;
    partisipasiLogbook?: number;
    [key: string]: number | undefined;
  };
  updatedAt?: { seconds: number, nanoseconds: number };
}

export default function KesehatanOpdDashboard() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useUserAuth();
  const { opdList, isLoading: opdLoading } = useMasterData(true);
  
  const [healthScores, setHealthScores] = useState<Map<string, HealthScore>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Protect route
  useEffect(() => {
    if (!authLoading && userProfile?.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [userProfile, authLoading, router]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'opd_health_scores'), snap => {
      const scores = new Map<string, HealthScore>();
      snap.forEach(doc => {
        scores.set(doc.id, { opdId: doc.id, ...doc.data() } as HealthScore);
      });
      setHealthScores(scores);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (authLoading || loading || opdLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userProfile?.role !== 'super_admin') return null;

  const mergedData = opdList.map(opd => {
    return {
      opd,
      health: healthScores.get(opd.id!) || { opdId: opd.id!, score: 0 }
    };
  }).filter(item => 
    item.opd.namaOpd.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.health.score - a.health.score);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score > 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (score >= 60) return <Activity className="w-5 h-5 text-yellow-600" />;
    if (score > 0) return <ShieldAlert className="w-5 h-5 text-red-600" />;
    return <Activity className="w-5 h-5 text-gray-400" />;
  };

  const avgScore = healthScores.size > 0 
    ? Math.round(Array.from(healthScores.values()).reduce((acc, curr) => acc + (curr.score || 0), 0) / healthScores.size)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HeartPulse className="w-8 h-8 text-pink-600" />
            Monitoring Kesehatan OPD
          </h1>
          <p className="text-muted-foreground mt-1">
            Pantau skor kesehatan, adopsi, dan produktivitas seluruh instansi secara real-time.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100">
          <CardHeader className="pb-2">
            <CardDescription className="text-pink-600 font-medium">Rata-Rata Nasional</CardDescription>
            <CardTitle className="text-4xl text-pink-700">{avgScore}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-pink-600/80">Skor kesehatan rata-rata dari seluruh OPD terdaftar.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Instansi Terpantau</CardDescription>
            <CardTitle className="text-4xl">{healthScores.size}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Instansi yang telah diukur oleh cron.</p>
          </CardContent>
        </Card>
        <Card className="flex items-center justify-center p-6 border-dashed">
           <div className="w-full relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Cari nama OPD..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mergedData.map((item) => {
          const score = Math.round(item.health.score || 0);
          const colorClass = getScoreColor(score);
          const bd = item.health.breakdown || {};
          
          return (
            <Card key={item.opd.id} className="overflow-hidden hover:border-pink-200 transition-colors">
              <div className="p-5 flex items-start gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm shrink-0 ${colorClass}`}>
                  <div className="text-center">
                    <div className="text-2xl font-bold leading-none">{score > 0 ? score : '-'}</div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg line-clamp-2" title={item.opd.namaOpd}>{item.opd.namaOpd}</h3>
                    <div className="shrink-0 mt-1">
                      {getScoreIcon(score)}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {/* Render whatever breakdown data exists */}
                    {(bd.adopsiUser !== undefined || bd.partisipasiLogbook !== undefined) && (
                      <div className="bg-muted/50 p-2 rounded-md">
                        <div className="text-muted-foreground text-xs">Adopsi User</div>
                        <div className="font-medium">{Math.round((bd.adopsiUser ?? bd.partisipasiLogbook) || 0)}%</div>
                      </div>
                    )}
                    {(bd.retensiMingguan !== undefined) && (
                      <div className="bg-muted/50 p-2 rounded-md">
                        <div className="text-muted-foreground text-xs">Retensi Mingguan</div>
                        <div className="font-medium">{Math.round(bd.retensiMingguan)}%</div>
                      </div>
                    )}
                    {(bd.produktivitas !== undefined || bd.suratTerselesaikan !== undefined) && (
                      <div className="bg-muted/50 p-2 rounded-md">
                        <div className="text-muted-foreground text-xs">Produktivitas</div>
                        <div className="font-medium">{Math.round((bd.produktivitas ?? bd.suratTerselesaikan) || 0)}%</div>
                      </div>
                    )}
                    {(bd.tepatWaktu !== undefined || bd.ketepatanWaktu !== undefined) && (
                      <div className="bg-muted/50 p-2 rounded-md">
                        <div className="text-muted-foreground text-xs">Tepat Waktu</div>
                        <div className="font-medium">{Math.round((bd.tepatWaktu ?? bd.ketepatanWaktu) || 0)}%</div>
                      </div>
                    )}
                  </div>
                  {item.health.updatedAt && (
                    <div className="mt-4 text-xs text-muted-foreground text-right">
                      Update: {new Date(item.health.updatedAt.seconds * 1000).toLocaleString('id-ID')}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        
        {mergedData.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            Tidak ada data kesehatan instansi yang sesuai.
          </div>
        )}
      </div>
    </div>
  );
}
