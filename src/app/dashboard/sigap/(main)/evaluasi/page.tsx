/**
 * Directory: src/app/dashboard/sigap/(main)/evaluasi/page.tsx
 * Status: REVAMPED (Real-time Analytics)
 * Deskripsi: Halaman Dashboard Evaluasi Kinerja dengan komputasi real-time dari Firestore
 * menggunakan Recharts untuk visualisasi data yang responsif.
 */

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { Surat, Tugas, Disposisi, OPD } from '@/types';
import { useUserAuth } from '@/context/AuthContext';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData';
import { 
    TrendingUp, TrendingDown, Activity, 
    Clock, CheckCircle, AlertTriangle, BarChart2, 
    Building, Loader2
} from 'lucide-react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';

// --- Impor Komponen Shadcn ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// --- Helper Components ---
const ScoreCard = ({ 
    title, 
    value, 
    subValue, 
    trend, 
    icon: Icon, 
    colorClass 
}: { 
    title: string, 
    value: string | number, 
    subValue?: string, 
    trend?: 'up' | 'down' | 'neutral',
    icon: any, 
    colorClass: string 
}) => {
    const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;

    return (
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <h3 className="text-2xl font-bold mt-1 text-foreground">{value}</h3>
                    </div>
                    <div className={`p-2 rounded-lg bg-opacity-10 ${colorClass.replace('text-', 'bg-')}`}>
                        <Icon className={`w-5 h-5 ${colorClass}`} />
                    </div>
                </div>
                {subValue && (
                    <div className="mt-2 flex items-center text-xs">
                        <TrendIcon className={`w-3 h-3 mr-1 ${trendColor}`} />
                        <span className={`${trendColor} font-medium`}>{subValue}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function EvaluasiPage() {
    const { userProfile, loading: authLoading } = useUserAuth();
    const { opdList, isLoading: isMasterLoading } = useMasterData(true);

    // State Filter
    const [selectedOpdId, setSelectedOpdId] = useState<string>("Semua");
    const [dateRange, setDateRange] = useState<{ start: string, end: string }>({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // State Data Kinerja Agregat
    const [agregatList, setAgregatList] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(false);

    // --- 1. Tentukan Daftar OPD yang Bisa Dilihat ---
    const availableOpds = useMemo(() => {
        if (!userProfile || !opdList.length) return [];
        if (userProfile.role === 'super_admin') {
            const induk = opdList.filter(o => o.tipe === 'Induk').sort((a,b) => a.namaOpd.localeCompare(b.namaOpd));
            const sub = opdList.filter(o => o.tipe !== 'Induk').sort((a,b) => a.namaOpd.localeCompare(b.namaOpd));
            return [...induk, ...sub];
        }
        const myOpdId = userProfile.opdId;
        const myOpd = opdList.find(o => o.id === myOpdId);
        if (!myOpd) return [];
        if (myOpd.tipe === 'Induk') {
            const children = opdList.filter(o => o.idOpdInduk === myOpdId);
            return [myOpd, ...children];
        }
        return [myOpd];
    }, [userProfile, opdList]);

    useEffect(() => {
        if (availableOpds.length > 0 && selectedOpdId === "Semua" && userProfile?.role !== 'super_admin') {
            setSelectedOpdId(availableOpds[0].id!);
        }
    }, [availableOpds, selectedOpdId, userProfile]);

    // --- 2. Fetch Data Kinerja Agregat ---
    useEffect(() => {
        const fetchAgregatData = async () => {
            if (!userProfile) return;
            setLoadingData(true);
            try {
                const start = new Date(dateRange.start);
                const end = new Date(dateRange.end);
                end.setHours(23, 59, 59, 999);

                const tStart = Timestamp.fromDate(start);
                const tEnd = Timestamp.fromDate(end);

                // Build Query Conditions based on OPD
                const targetOpd = selectedOpdId === "Semua" ? null : selectedOpdId;

                const agregatConditions = [
                    where('tanggal', '>=', tStart),
                    where('tanggal', '<=', tEnd)
                ];
                
                if (targetOpd) {
                    agregatConditions.push(where('opdId', '==', targetOpd));
                } else if (userProfile.role !== 'super_admin' && availableOpds.length > 0) {
                    const targetOpds = availableOpds.map(o => o.id);
                    if (targetOpds.length <= 10) {
                        agregatConditions.push(where('opdId', 'in', targetOpds));
                    }
                }

                const agregatSnap = await getDocs(query(collection(db, 'kinerjaAgregat'), ...agregatConditions as any));
                setAgregatList(agregatSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                
            } catch (err) {
                console.error("Gagal fetch data agregat:", err);
            } finally {
                setLoadingData(false);
            }
        };

        fetchAgregatData();
    }, [selectedOpdId, dateRange, userProfile, availableOpds]);

    // --- 3. Kalkulasi Metrik (Memoized) ---
    const kpi = useMemo(() => {
        let volumeSurat = 0;
        let totalSuratRevisi = 0;
        let sumPersentaseSelesaiTepatWaktu = 0;
        let sumSLA = 0;

        const chartMap = new Map<string, { totalSurat: number, totalDisposisi: number, SLA: number }>();
        const leaderBoardMap = new Map<string, { nama: string, tugasSelesai: number, disposisiDiterima: number }>();

        agregatList.forEach(a => {
            volumeSurat += (a.totalSuratMasuk || 0);
            sumPersentaseSelesaiTepatWaktu += (a.persentasePenyelesaianTepatWaktu || 0);
            sumSLA += (a.rataRataWaktuResponsDisposisi || 0);
            
            // Assume tingkatRevisiDisposisi is percentage
            totalSuratRevisi += ((a.tingkatRevisiDisposisi || 0) / 100) * (a.totalSuratMasuk || 0);

            // Chart
            const dateStr = a.tanggal?.toDate().toISOString().split('T')[0] || new Date().toISOString().split('T')[0];
            const currentChart = chartMap.get(dateStr) || { totalSurat: 0, totalDisposisi: 0, SLA: 0 };
            currentChart.totalSurat += (a.totalSuratMasuk || 0);
            currentChart.totalDisposisi += (a.totalDisposisi || 0);
            currentChart.SLA = a.rataRataWaktuResponsDisposisi || 0; // approximate
            chartMap.set(dateStr, currentChart);

            // Leaderboard
            if (a.kinerjaPerJabatan) {
                a.kinerjaPerJabatan.forEach((k: any) => {
                    const currentL = leaderBoardMap.get(k.jabatanId) || { nama: k.namaPejabat || k.namaJabatan || 'Anonim', tugasSelesai: 0, disposisiDiterima: 0 };
                    currentL.tugasSelesai += (k.totalTugasSelesai || 0);
                    currentL.disposisiDiterima += (k.totalDisposisiDiterima || 0);
                    // Update name in case it was missing
                    if (k.namaPejabat && k.namaPejabat !== 'Anonim' && k.namaPejabat !== '-') currentL.nama = k.namaPejabat;
                    leaderBoardMap.set(k.jabatanId, currentL);
                });
            }
        });

        const rasioRevisi = volumeSurat > 0 ? (totalSuratRevisi / volumeSurat) * 100 : 0;
        const rasioTugasTepatWaktu = agregatList.length > 0 ? (sumPersentaseSelesaiTepatWaktu / agregatList.length) : 0;
        const avgResponseHours = agregatList.length > 0 ? (sumSLA / agregatList.length) : 0;

        const chartData = Array.from(chartMap.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([date, data]) => {
            return {
                date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
                "Volume Surat": data.totalSurat,
                "Disposisi": data.totalDisposisi,
                "SLA (Jam)": parseFloat(data.SLA.toFixed(1))
            };
        });

        const topPegawai = Array.from(leaderBoardMap.values())
            .sort((a, b) => b.tugasSelesai - a.tugasSelesai)
            .slice(0, 10);

        return {
            volumeSurat,
            rasioRevisi,
            rasioTugasTepatWaktu,
            avgResponseHours,
            chartData,
            topPegawai
        };
    }, [agregatList]);

    if (authLoading || isMasterLoading) {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (availableOpds.length === 0) {
         return <div className="p-8 text-center text-red-500">Anda tidak memiliki akses ke data OPD manapun.</div>;
    }

    return (
        <div className="space-y-8 animate-fadeInUp pb-20">
            {/* HEADER & FILTER */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center">
                        <BarChart2 className="mr-3 text-blue-600" size={32} />
                        Evaluasi Kinerja
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Pantau kesehatan organisasi, beban kerja, dan produktivitas tim secara real-time.
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                    {availableOpds.length > 1 && (
                        <div className="w-full sm:w-64">
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Unit Kerja (OPD)</label>
                            <Select value={selectedOpdId} onValueChange={setSelectedOpdId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih OPD" />
                                </SelectTrigger>
                                <SelectContent>
                                    {userProfile?.role === 'super_admin' && (
                                        <SelectItem value="Semua">Semua OPD (Global)</SelectItem>
                                    )}
                                    {availableOpds.map(opd => (
                                        <SelectItem key={opd.id} value={opd.id!}>
                                            {opd.tipe === 'Sub-OPD' ? `↳ ${opd.namaOpd}` : opd.namaOpd}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Dari</label>
                            <Input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-36" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Sampai</label>
                            <Input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-36" />
                        </div>
                    </div>
                </div>
            </div>

            {loadingData ? (
                <div className="py-32 flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
                    <span>Mengkalkulasi metrik secara real-time...</span>
                </div>
            ) : (
                <>
                    {/* SCORECARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <ScoreCard 
                            title="Volume Surat Masuk" 
                            value={kpi.volumeSurat} 
                            subValue="Total Surat" trend="neutral"
                            icon={Building} colorClass="text-blue-600" 
                        />
                        <ScoreCard 
                            title="Kecepatan Respons (SLA)" 
                            value={kpi.avgResponseHours > 0 && kpi.avgResponseHours < 1 ? `${(kpi.avgResponseHours * 60).toFixed(0)} Menit` : `${kpi.avgResponseHours.toFixed(1)} Jam`} 
                            subValue="Estimasi Rata-rata" trend="up" 
                            icon={Clock} colorClass="text-yellow-600" 
                        />
                        <ScoreCard 
                            title="Ketepatan Waktu Tugas" 
                            value={`${kpi.rasioTugasTepatWaktu.toFixed(0)}%`} 
                            subValue={kpi.rasioTugasTepatWaktu >= 90 ? "Optimal" : "Perlu Atensi"} trend={kpi.rasioTugasTepatWaktu >= 90 ? "up" : "down"}
                            icon={CheckCircle} colorClass="text-green-600" 
                        />
                        <ScoreCard 
                            title="Rasio Revisi Disposisi" 
                            value={`${kpi.rasioRevisi.toFixed(1)}%`} 
                            subValue="Indikator Kualitas" trend={kpi.rasioRevisi < 5 ? "up" : "down"}
                            icon={AlertTriangle} colorClass="text-red-600" 
                        />
                    </div>

                    {/* CHARTS SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-3 shadow-sm">
                            <CardHeader>
                                <CardTitle>Tren Volume Surat & Disposisi</CardTitle>
                                <CardDescription>Berdasarkan rentang tanggal yang dipilih.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={kpi.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                            <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                            <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#6b7280'}} axisLine={false} tickLine={false} />
                                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                            <Line yAxisId="left" type="monotone" dataKey="Volume Surat" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} />
                                            <Line yAxisId="left" type="monotone" dataKey="Disposisi" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                                            <Line yAxisId="right" type="monotone" dataKey="SLA (Jam)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* LEADERBOARD & TABLES */}
                    <Tabs defaultValue="pegawai" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                            <TabsTrigger value="pegawai">Leaderboard Kinerja Tim</TabsTrigger>
                            <TabsTrigger value="bottleneck">Deteksi Beban Kerja</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="pegawai" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top Performers (Periode Ini)</CardTitle>
                                    <CardDescription>Berdasarkan penyelesaian tugas dan respons disposisi aktif.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Peringkat</TableHead>
                                                <TableHead>Nama Pejabat/Staf</TableHead>
                                                <TableHead className="text-right">Disposisi Diterima</TableHead>
                                                <TableHead className="text-right">Tugas Selesai</TableHead>
                                                <TableHead className="text-center">Performa</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {kpi.topPegawai.map((p, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="font-medium text-muted-foreground">
                                                        #{idx + 1}
                                                    </TableCell>
                                                    <TableCell className="font-semibold">{p.nama}</TableCell>
                                                    <TableCell className="text-right">{p.disposisiDiterima}</TableCell>
                                                    <TableCell className="text-right font-bold text-green-600">{p.tugasSelesai}</TableCell>
                                                    <TableCell className="text-center">
                                                        {p.tugasSelesai > 0 || p.disposisiDiterima > 0 
                                                            ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aktif & Produktif</Badge>
                                                            : <span className="text-muted-foreground">-</span>
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {kpi.topPegawai.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada aktivitas tercatat di periode ini.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="bottleneck" className="mt-4">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Analisis Beban Kerja</CardTitle>
                                    <CardDescription>Peta sebaran beban tugas per jabatan.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg bg-gray-50/50">
                                        <AlertTriangle className="mx-auto h-10 w-10 text-yellow-500 mb-2 opacity-80" />
                                        <p className="font-medium">Menyusun Peta Beban Kerja...</p>
                                        <p className="text-sm mt-1">Bagian ini akan menampilkan jabatan dengan tumpukan disposisi tertinggi berdasarkan data real-time Anda.</p>
                                    </div>
                                </CardContent>
                             </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}