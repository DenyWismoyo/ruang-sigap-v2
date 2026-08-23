"use client";

import React, { useEffect, useState } from 'react';
import { useUserAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { FilePlus, Edit, Trash2, Loader2, FileText, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/context/ToastContext';
import { Card, CardContent } from '@/components/ui/card';

export default function DrafSuratKeluarPage() {
    const { userProfile } = useUserAuth();
    const { addToast } = useToast();
    const [drafs, setDrafs] = useState<any[]>([]);
    const [stats, setStats] = useState({ drafting: 0, diajukan: 0, ditolak: 0, selesai: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userProfile) return;

        const fetchDrafs = async () => {
            try {
                // Fetch drafSuratInternal created by this user
                const q = query(
                    collection(db, 'drafSuratInternal'),
                    where('createdBy', '==', userProfile.uid),
                    orderBy('createdAt', 'desc')
                );
                const snapshot = await getDocs(q);
                const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDrafs(results);

                // Fetch data persetujuan untuk statistik akurat
                const qPersetujuan = query(collection(db, 'drafPersetujuan'), where('createdBy', '==', userProfile.uid));
                const snapPersetujuan = await getDocs(qPersetujuan);
                const persetujuans = snapPersetujuan.docs.map(doc => doc.data());
                
                let drafting = 0, diajukan = 0, ditolak = 0, selesai = 0;
                drafting = results.filter(d => !(d as any).status || (d as any).status === 'Drafting').length;
                
                persetujuans.forEach(p => {
                   if (p.status === 'Proses Review' || p.status === 'Menunggu') diajukan++;
                   else if (p.status === 'Revisi' || p.status === 'Ditolak') ditolak++;
                   else if (p.status === 'Selesai' || p.status === 'Disetujui') selesai++;
                });
                
                setStats({ drafting, diajukan, ditolak, selesai });
            } catch (err) {
                console.error("Gagal memuat draf", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDrafs();
    }, [userProfile]);

    const handleDelete = async (drafId: string) => {
        if (!confirm('Hapus draf ini?')) return;
        try {
            await deleteDoc(doc(db, 'drafSuratInternal', drafId));
            setDrafs(prev => prev.filter(d => d.id !== drafId));
            addToast("Draf berhasil dihapus", "success");
        } catch (err) {
            console.error(err);
            addToast("Gagal menghapus draf", "error");
        }
    };

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Dashboard Analitik */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Draf / Konsep</p>
                            <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-200">{stats.drafting}</h3>
                        </div>
                        <div className="p-3 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"><Edit size={20}/></div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Menunggu Persetujuan</p>
                            <h3 className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.diajukan}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-500"><FileText size={20}/></div>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Revisi / Ditolak</p>
                            <h3 className="text-2xl font-bold text-amber-700 dark:text-amber-300">{stats.ditolak}</h3>
                        </div>
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-500"><AlertCircle size={20}/></div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Selesai (Arsip)</p>
                            <h3 className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.selesai}</h3>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-500"><CheckCircle size={20}/></div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
                <div>
                    <h2 className="text-lg font-semibold">Draf Surat Saya</h2>
                    <p className="text-sm text-muted-foreground">Surat yang sedang Anda susun dan belum diajukan persetujuannya.</p>
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/dashboard/sigap/surat-keluar/buat">
                        <FilePlus className="mr-2 h-4 w-4" /> Buat Surat Baru
                    </Link>
                </Button>
            </div>

            {drafs.length === 0 ? (
                <div className="text-center p-16 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Belum Ada Draf</h3>
                    <p className="text-slate-500 mt-2 mb-6">Mulai buat surat keluar menggunakan bank template yang tersedia.</p>
                    <Button asChild variant="outline">
                        <Link href="/dashboard/sigap/surat-keluar/buat">Buat Surat Sekarang</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {drafs.map(draf => (
                        <Card key={draf.id} className="hover:shadow-md transition-all">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    {draf.status === 'Menunggu Persetujuan' ? (
                                        <div className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold px-2 py-1 rounded flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>
                                            Menunggu Persetujuan
                                        </div>
                                    ) : draf.status === 'Disetujui' ? (
                                        <div className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold px-2 py-1 rounded flex items-center">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Disetujui
                                        </div>
                                    ) : draf.status === 'Ditolak' ? (
                                        <div className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-semibold px-2 py-1 rounded flex items-center">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            Revisi / Ditolak
                                        </div>
                                    ) : draf.status === 'Diajukan' ? (
                                        <div className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-xs font-semibold px-2 py-1 rounded flex items-center">
                                            Diajukan
                                        </div>
                                    ) : (
                                        <div className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold px-2 py-1 rounded flex items-center">
                                            <Edit className="w-3 h-3 mr-1" />
                                            Drafting
                                        </div>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                        {draf.createdAt?.toDate ? format(draf.createdAt.toDate(), 'dd MMM yyyy', { locale: id }) : '-'}
                                    </div>
                                </div>
                                <h3 className="font-semibold text-lg line-clamp-2 min-h-[3.5rem] mb-1">{draf.perihal || 'Tanpa Perihal'}</h3>
                                <p className="text-sm text-muted-foreground mb-4">No: {draf.nomorSurat || 'Belum di-generate'}</p>
                                
                                <div className="flex gap-2 pt-3 border-t">
                                    <Button asChild variant="outline" size="sm" className="flex-1">
                                        <Link href={`/dashboard/sigap/surat-keluar/preview?id=${draf.id}`}>
                                            {draf.status === 'Drafting' || !draf.status ? (
                                                <><Edit className="h-4 w-4 mr-2" /> Lanjut Edit</>
                                            ) : (
                                                <><Eye className="h-4 w-4 mr-2" /> Lihat Dokumen</>
                                            )}
                                        </Link>
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 shrink-0" onClick={() => handleDelete(draf.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
