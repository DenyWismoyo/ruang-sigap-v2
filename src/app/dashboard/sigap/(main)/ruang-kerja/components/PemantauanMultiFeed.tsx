import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, CheckCircle2, Circle, Clock, Check } from 'lucide-react';
import { PemantauanItem } from '@/app/dashboard/sigap/hooks/usePemantauanMulti';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PemantauanMultiFeedProps {
    items: PemantauanItem[];
    isLoading: boolean;
}

export default function PemantauanMultiFeed({ items, isLoading }: PemantauanMultiFeedProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <Skeleton className="h-6 w-3/4 mb-4" />
                            <Skeleton className="h-4 w-1/2 mb-6" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <Card className="border-dashed bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                    <CheckCircle2 className="w-12 h-12 mb-4 text-primary/30" />
                    <p className="font-medium">Tidak Ada Disposisi Multi</p>
                    <p className="text-sm">Semua pantauan disposisi Anda sudah selesai atau kosong.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((item) => {
                const { disposisi, surat } = item;
                const kepada = disposisi.kepadaJabatanId || [];
                const diterima = disposisi.penerimaDiterima || [];
                const selesai = disposisi.penerimaSelesai || [];
                const dikembalikan = disposisi.penerimaDikembalikan || [];
                
                // Menghitung progress keseluruhan
                const totalSelesai = selesai.length;
                const totalTarget = kepada.length;
                const isAllSelesai = totalSelesai === totalTarget;

                // Urutkan snapshot sesuai kepada (atau urutan asli)
                const snapshots = disposisi.penerimaSnapshot || [];

                return (
                    <Card key={disposisi.id} className={`transition-all duration-300 border-l-4 ${isAllSelesai ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
                        <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <Badge variant={isAllSelesai ? "default" : "secondary"} className={isAllSelesai ? "bg-emerald-500 hover:bg-emerald-600 mb-2" : "bg-amber-100 text-amber-800 hover:bg-amber-200 mb-2"}>
                                        {isAllSelesai ? 'Selesai 100%' : 'Sedang Diproses'}
                                    </Badge>
                                    <CardTitle className="text-lg leading-tight flex items-start gap-2">
                                        <FileText className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                        <span>{surat?.perihal || "Surat Tanpa Perihal"}</span>
                                    </CardTitle>
                                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Disposisi: {disposisi.tanggalDisposisi ? format(disposisi.tanggalDisposisi.toDate(), 'dd MMM yyyy, HH:mm', { locale: id }) : '-'}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-foreground">
                                        {totalSelesai}<span className="text-sm text-muted-foreground font-normal">/{totalTarget}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">Selesai</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/40">
                                {snapshots.map((snap) => {
                                    const isDone = selesai.includes(snap.jabatanId);
                                    const isAccepted = diterima.includes(snap.jabatanId);
                                    const isReturned = dikembalikan.includes(snap.jabatanId);
                                    
                                    let statusColor = "text-muted-foreground";
                                    let statusIcon = <Circle className="w-4 h-4" />;
                                    let statusText = "Belum Dibuka";

                                    if (isDone) {
                                        statusColor = "text-emerald-500";
                                        statusIcon = <CheckCircle2 className="w-4 h-4" />;
                                        statusText = "Selesai";
                                    } else if (isReturned) {
                                        statusColor = "text-red-500";
                                        statusIcon = <Circle className="w-4 h-4" />;
                                        statusText = "Dikembalikan";
                                    } else if (isAccepted) {
                                        statusColor = "text-amber-500";
                                        statusIcon = <Check className="w-4 h-4" />;
                                        statusText = "Sedang Dikerjakan";
                                    }

                                    return (
                                        <div key={snap.jabatanId} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                                            <div>
                                                <p className="text-sm font-medium">{snap.nama}</p>
                                                <p className="text-xs text-muted-foreground">{snap.namaJabatan || snap.golongan}</p>
                                            </div>
                                            <div className={`flex items-center gap-2 text-sm font-medium ${statusColor}`}>
                                                {statusText} {statusIcon}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
