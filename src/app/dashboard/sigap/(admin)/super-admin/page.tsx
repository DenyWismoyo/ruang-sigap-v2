"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, deleteDoc } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData';
import { OpdConfig } from '@/types';
import { Building, Loader2, Settings, ShieldAlert, ArrowRight, ShieldCheck, Users, Calendar, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useUserAuth();
  const { opdList, isLoading: opdLoading } = useMasterData(true);
  
  const [opdConfigs, setOpdConfigs] = useState<Map<string, OpdConfig>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Protect route
  useEffect(() => {
    if (!authLoading && userProfile?.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [userProfile, authLoading, router]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'opdConfigs'), snap => {
      const configs = new Map<string, OpdConfig>();
      snap.forEach(doc => configs.set(doc.id, { id: doc.id, ...doc.data() } as OpdConfig));
      setOpdConfigs(configs);
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

  const filteredOpdList = opdList.filter(opd => 
    opd.namaOpd.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
            Super Admin Panel
          </h1>
          <p className="text-muted-foreground mt-1 mb-4">
            Pusat kontrol manajemen instansi, white-labeling, dan fitur platform.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/super-admin/setup-demo')} className="border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100">
              <Play className="w-3.5 h-3.5 mr-1" /> Setup Data Demo
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/permintaan-replikasi')} className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100">Permintaan Replikasi</Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/affiliates')} className="border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100">Mitra Affiliate</Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/opd')}>Master OPD</Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/laporan-langganan')}>Laporan Langganan</Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/dokumen-penagihan')}>Tagihan & Penagihan</Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/users')}>Master Pengguna</Button>
          </div>
        </div>
        <div className="w-full md:w-auto">
          <Input 
            placeholder="Cari instansi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-[300px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOpdList.map((opd) => {
          const config = opdConfigs.get(opd.id!);
          const namaAplikasi = config?.branding?.namaAplikasi || 'SIGAP';
          const isLunas = config?.paymentStatus === 'Lunas';
          
          return (
            <Card key={opd.id} className="flex flex-col hover:shadow-md transition-shadow border-border/50">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant={isLunas ? "default" : "destructive"} className="uppercase text-[10px]">
                    {config?.paymentStatus || 'Trial'}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-4 line-clamp-1" title={opd.namaOpd}>
                  {opd.namaOpd}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 mt-1">
                  <span className="font-medium text-foreground">{namaAplikasi}</span>
                  <span className="text-muted-foreground">• Paket {config?.packageName || 'Dasar'}</span>
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" /> Pengguna Aktif
                  </span>
                  <span className="font-semibold">
                    {config?.penggunaAktifSaatIni || 0} / {config?.kuotaPengguna || 50}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Jatuh Tempo
                  </span>
                  <span className="font-semibold">
                    {config?.langgananAktifHingga ? new Date(config.langgananAktifHingga.seconds * 1000).toLocaleDateString('id-ID') : '-'}
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="pt-4 border-t border-border/50">
                <Button 
                  className="w-full justify-between group" 
                  variant="outline"
                  onClick={() => router.push(`/dashboard/super-admin/${opd.id}`)}
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Kelola Instansi
                  </span>
                  <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}

        {filteredOpdList.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            Tidak ada instansi yang ditemukan.
          </div>
        )}
      </div>
    </div>
  );
}
