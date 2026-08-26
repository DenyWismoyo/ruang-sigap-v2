"use client";

import React, { useState, useEffect } from 'react';
import { db, app } from '@/lib/firebase';
import { doc, setDoc, Timestamp, collection, getDocs, writeBatch } from 'firebase/firestore';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useUserAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Loader2, ShieldCheck, Play, ArrowLeft, Building, Users, Briefcase, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Initialize secondary auth for user creation without logging out super_admin
const appName = "seederDemoApp";
let secondaryApp;
try {
  secondaryApp = initializeApp(app.options, appName);
} catch (error) {
  secondaryApp = app; 
}
const secondaryAuth = getAuth(secondaryApp);

const DEMO_PASSWORD = "DemoPassword@123";
const OPD_SLUG = "dinas-kominfo-demo-" + Math.floor(Math.random() * 10000);

const DEMO_TEMPLATE = {
  opd: {
    id: OPD_SLUG,
    namaOpd: 'Dinas Komunikasi dan Informatika - Demo',
    alamat: 'Jl. Jenderal Sudirman No. 1 - DEMO',
    tipe: 'Induk',
    status: 'aktif'
  },
  opd_config: {
    paket: 'profesional',
    maxUsers: 50,
    hargaPerUser: 0,
    status: 'aktif',
    features: {
      aiSuratReader: true,
      aiNotulensi: true,
      analyticKinerja: true,
      manajemenAset: false,
      persetujuanDraf: true,
      formBuilder: false,
      lintasOpd: false
    }
  },
  jabatans: [
    { slug: 'kepala-dinas', nama: 'Kepala Dinas', level: 1, idAtasan: null, tipe: 'struktural', eselon: 'II/b' },
    { slug: 'sekretaris', nama: 'Sekretaris', level: 2, idAtasan: 'kepala-dinas', tipe: 'struktural', eselon: 'III/a' },
    { slug: 'kabid-informatika', nama: 'Kepala Bidang Informatika', level: 2, idAtasan: 'kepala-dinas', tipe: 'struktural', eselon: 'III/b' },
    { slug: 'kabid-persandian', nama: 'Kepala Bidang Persandian', level: 2, idAtasan: 'kepala-dinas', tipe: 'struktural', eselon: 'III/b' },
    { slug: 'kasubbag-umum', nama: 'Kasubbag Umum & Kepegawaian', level: 3, idAtasan: 'sekretaris', tipe: 'struktural', eselon: 'IV/a' },
    { slug: 'staf-tu', nama: 'Staf Tata Usaha', level: 4, idAtasan: 'kasubbag-umum', tipe: 'pelaksana', eselon: null },
    { slug: 'staf-pelaksana-1', nama: 'Staf Pelaksana Informatika', level: 4, idAtasan: 'kabid-informatika', tipe: 'pelaksana', eselon: null },
    { slug: 'staf-pelaksana-2', nama: 'Staf Pelaksana Persandian', level: 4, idAtasan: 'kabid-persandian', tipe: 'pelaksana', eselon: null },
  ],
  users: [
    { nip: '198001012000031001', nama: 'Ir. Budi Santoso, M.T.', jabatanRef: 'kepala-dinas', role: 'admin_opd', email: 'kepala.demo@sigap.id' },
    { nip: '198202022005012002', nama: 'Dr. Ani Rahayu, M.Si.', jabatanRef: 'sekretaris', role: 'user', email: 'sekretaris.demo@sigap.id' },
    { nip: '198503032010011003', nama: 'Hendra Wijaya, S.Kom.', jabatanRef: 'kabid-informatika', role: 'user', email: 'kabid.informatika.demo@sigap.id' },
    { nip: '198804042012022004', nama: 'Siti Nurhaliza, S.H.', jabatanRef: 'kabid-persandian', role: 'user', email: 'kabid.persandian.demo@sigap.id' },
    { nip: '199005052015031005', nama: 'Ahmad Fauzi, S.E.', jabatanRef: 'kasubbag-umum', role: 'user', email: 'kasubbag.umum.demo@sigap.id' },
    { nip: '199506062018012006', nama: 'Dewi Lestari, A.Md.', jabatanRef: 'staf-tu', role: 'staf_tu', email: 'staf.tu.demo@sigap.id' },
    { nip: '199607072019021007', nama: 'Rizky Pratama', jabatanRef: 'staf-pelaksana-1', role: 'user', email: 'staf1.demo@sigap.id' },
    { nip: '199808082020032008', nama: 'Maya Sari', jabatanRef: 'staf-pelaksana-2', role: 'user', email: 'staf2.demo@sigap.id' },
  ]
};

export default function SetupDemoPage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useUserAuth();
  const [step, setStep] = useState(1);
  const [logs, setLogs] = useState<{message: string, status: 'info'|'success'|'error'}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Protect route
  useEffect(() => {
    if (!authLoading && userProfile?.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [userProfile, authLoading, router]);

  const addLog = (message: string, status: 'info'|'success'|'error' = 'info') => {
    setLogs(prev => [...prev, { message, status }]);
  };

  const handleStartSeed = async () => {
    setStep(2);
    setIsProcessing(true);
    setLogs([]);

    try {
      addLog("Memulai proses seeder...", 'info');
      
      // 1. CREATE OPD & CONFIG
      addLog("Membuat Data OPD...", 'info');
      const opdRef = doc(db, 'opd', DEMO_TEMPLATE.opd.id);
      await setDoc(opdRef, DEMO_TEMPLATE.opd);
      
      const configRef = doc(db, 'opd_config', DEMO_TEMPLATE.opd.id);
      await setDoc(configRef, {
        ...DEMO_TEMPLATE.opd_config,
        opdId: DEMO_TEMPLATE.opd.id,
        namaOpd: DEMO_TEMPLATE.opd.namaOpd
      });
      addLog("OPD dan Konfigurasi berhasil dibuat.", 'success');

      // 2. CREATE JABATAN
      addLog("Membuat Struktur Jabatan...", 'info');
      const jabatanIds: Record<string, string> = {}; // map slug -> new firebase ID
      
      for (const j of DEMO_TEMPLATE.jabatans) {
        const jabRef = doc(collection(db, 'jabatan'));
        jabatanIds[j.slug] = jabRef.id;
        
        await setDoc(jabRef, {
          namaJabatan: j.nama,
          level: j.level,
          opdId: DEMO_TEMPLATE.opd.id,
          idAtasan: j.idAtasan ? jabatanIds[j.idAtasan] : null,
          tipeJabatan: j.tipe,
          eselon: j.eselon,
          status: 'aktif'
        });
        addLog(`Jabatan '${j.nama}' dibuat.`, 'info');
      }
      addLog("Semua jabatan berhasil dibuat.", 'success');

      // 3. CREATE USERS
      addLog("Mendaftarkan Akun Pengguna...", 'info');
      for (const u of DEMO_TEMPLATE.users) {
        let uid = "";
        try {
          const userCred = await createUserWithEmailAndPassword(secondaryAuth, u.email, DEMO_PASSWORD);
          uid = userCred.user.uid;
        } catch (err: any) {
          if (err.code === 'auth/email-already-in-use') {
             // Sign in to retrieve UID
             try {
                const existingUserCred = await signInWithEmailAndPassword(secondaryAuth, u.email, DEMO_PASSWORD);
                uid = existingUserCred.user.uid;
                addLog(`Akun '${u.email}' sudah terdaftar. Menggunakan akun yang ada.`, 'info');
             } catch (signInErr: any) {
                addLog(`Akun '${u.email}' sudah ada, tetapi gagal login: ${signInErr.message}`, 'error');
                continue; // Skip this user
             }
          } else {
             addLog(`Gagal mendaftar '${u.email}': ${err.message}`, 'error');
             continue; // Skip this user
          }
        }
        
        if (uid) {
           await setDoc(doc(db, 'users', u.nip), {
             uid: uid,
             nip: u.nip,
             namaLengkap: u.nama,
             email: u.email,
             opdId: DEMO_TEMPLATE.opd.id,
             jabatanId: jabatanIds[u.jabatanRef],
             role: u.role,
             status: 'aktif',
             createdAt: Timestamp.now()
           });
           addLog(`Profil '${u.nama}' (${u.email}) berhasil disimpan.`, 'success');
        }
      }
      
      addLog("🎉 Setup Demo Selesai!", 'success');
    } catch (error: any) {
      addLog(`KESALAHAN FATAL: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
      setStep(3);
    }
  };

  if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (userProfile?.role !== 'super_admin') return null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/super-admin')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Play className="w-6 h-6 text-emerald-600" />
            Setup Data Demo
          </h1>
          <p className="text-muted-foreground text-sm">Generate struktur OPD, Jabatan, dan User secara instan.</p>
        </div>
      </div>

      {step === 1 && (
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Preview Struktur Demo</h2>
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-semibold">{DEMO_TEMPLATE.opd.namaOpd}</div>
                <div className="text-sm text-muted-foreground">Otomatis generate OPD dan Konfigurasi Paket.</div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Briefcase className="w-5 h-5 text-violet-600" />
                <span className="font-semibold">Jabatan & Akun ({DEMO_TEMPLATE.users.length} Data)</span>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Nama Pejabat</TableHead>
                      <TableHead>Jabatan & Level</TableHead>
                      <TableHead>Role Sistem</TableHead>
                      <TableHead>Email Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {DEMO_TEMPLATE.users.map((u, i) => {
                      const jab = DEMO_TEMPLATE.jabatans.find(j => j.slug === u.jabatanRef);
                      return (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{u.nama}</TableCell>
                          <TableCell>
                            <div>{jab?.nama}</div>
                            <Badge variant="outline" className="mt-1 text-xs">Level {jab?.level}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.role === 'admin_opd' ? 'default' : 'secondary'}>{u.role}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{u.email}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-3 text-sm text-muted-foreground bg-blue-50 p-3 rounded-md dark:bg-blue-900/20 border border-blue-100">
                <span className="font-semibold">Password Default:</span> <code>{DEMO_PASSWORD}</code>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={handleStartSeed} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <Play className="w-4 h-4 mr-2" />
                Jalankan Seeder Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}

      {(step === 2 || step === 3) && (
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            {isProcessing ? 'Sedang Mengeksekusi...' : 'Proses Selesai'}
          </h2>
          
          <div className="bg-slate-950 text-emerald-400 font-mono text-sm p-4 rounded-md h-[400px] overflow-y-auto space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className={
                log.status === 'error' ? 'text-red-400' : 
                log.status === 'success' ? 'text-emerald-300 font-bold' : ''
              }>
                <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log.message}
              </div>
            ))}
            {isProcessing && <div className="animate-pulse">_</div>}
          </div>

          {step === 3 && (
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.push('/dashboard/super-admin')}>Kembali ke Panel</Button>
              <Button onClick={() => router.push('/dashboard/opd')}>Lihat Master OPD</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
