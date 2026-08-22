"use client";

import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Disposisi, Surat } from '@/types';
import { useUserAuth } from '@/context/AuthContext';

export default function HealMultiPenerimaPage() {
    const { userProfile } = useUserAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [finished, setFinished] = useState(false);

    const addLog = (msg: string) => {
        setLogs(prev => [...prev, msg]);
    };

    const runHeal = async () => {
        if (!userProfile) {
            addLog("Error: Sesi tidak valid.");
            return;
        }

        setIsProcessing(true);
        setLogs([]);
        setFinished(false);

        try {
            addLog("Mencari semua surat dengan status Selesai...");
            const suratQ = query(collection(db, 'surat'), where('statusPenyelesaian', '==', 'Selesai'));
            const suratSnap = await getDocs(suratQ);
            
            addLog(`Ditemukan ${suratSnap.docs.length} surat berstatus Selesai.`);

            let fixedCount = 0;
            const batch = writeBatch(db);

            for (const suratDoc of suratSnap.docs) {
                const suratData = suratDoc.data() as Surat;
                const suratId = suratDoc.id;

                const disposisiQ = query(collection(db, 'disposisi'), where('suratId', '==', suratId));
                const disposisiSnap = await getDocs(disposisiQ);

                let allFinished = true;
                
                disposisiSnap.forEach((docSnap) => {
                    const d = docSnap.data() as Disposisi;
                    if (d.status === 'Dikembalikan' || d.isInformational) return;
                    
                    const kepada = d.kepadaJabatanId || [];
                    const selesai = d.penerimaSelesai || [];
                    
                    const dFinished = kepada.every(jabId => selesai.includes(jabId));
                    if (!dFinished) {
                        allFinished = false;
                    }
                });

                if (!allFinished) {
                    addLog(`🔧 Surat [${suratData.perihal}] belum sepenuhnya selesai. Mengubah ke Proses Tindak Lanjut.`);
                    const sRef = doc(db, 'surat', suratId);
                    batch.update(sRef, { statusPenyelesaian: 'Proses Tindak Lanjut' });
                    fixedCount++;
                }
            }

            if (fixedCount > 0) {
                addLog(`Menyimpan perubahan untuk ${fixedCount} surat...`);
                await batch.commit();
                addLog(`✅ Berhasil memperbaiki ${fixedCount} surat.`);
            } else {
                addLog("✨ Tidak ada surat yang perlu diperbaiki.");
            }

        } catch (error: any) {
            console.error(error);
            addLog(`❌ Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
            setFinished(true);
        }
    };

    return (
        <div className="p-6 md:p-8 animate-in fade-in max-w-4xl mx-auto">
            <Card className="border-border">
                <CardHeader>
                    <CardTitle className="text-2xl text-blue-600">Alat Pemulihan: Surat Multi-Penerima</CardTitle>
                    <CardDescription>
                        Script ini akan memindai seluruh surat yang berstatus "Selesai", dan memeriksanya kembali.
                        Jika ternyata masih ada penerima disposisi yang belum melapor, status surat akan 
                        dikembalikan menjadi "Proses Tindak Lanjut" sehingga muncul kembali di feed mereka.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Button 
                        onClick={runHeal} 
                        disabled={isProcessing}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full md:w-auto"
                    >
                        {isProcessing ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
                        ) : (
                            "Jalankan Auto-Heal"
                        )}
                    </Button>

                    <div className="bg-zinc-950 rounded-xl p-4 font-mono text-sm text-green-400 h-64 overflow-y-auto shadow-inner">
                        <div className="text-zinc-500 mb-2">--- Terminal Logs ---</div>
                        {logs.length === 0 && <div className="text-zinc-700 italic">Menunggu aksi...</div>}
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1">{log}</div>
                        ))}
                        {finished && (
                            <div className="mt-4 flex items-center text-blue-400 font-semibold">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Proses Selesai.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
