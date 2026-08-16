"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Loader2, CheckCircle2, ChevronRight, FileText, Zap } from 'lucide-react';
import { LogbookKegiatan, UserProfile } from '@/types';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToastContext } from '@/context/ToastContext';

interface SmartAddKegiatanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveUmum: (text: string) => void;
    onSaveTindakLanjut: (kegiatan: Partial<LogbookKegiatan>) => Promise<void>;
    userProfile: UserProfile | null;
}

export function SmartAddKegiatanModal({ isOpen, onClose, onSaveUmum, onSaveTindakLanjut, userProfile }: SmartAddKegiatanModalProps) {
    const { addToast } = useToastContext();
    const [activeTab, setActiveTab] = useState("umum");
    
    // State Tab Umum
    const [textUmum, setTextUmum] = useState('');

    // State Tab Tindak Lanjut
    const [pendingDisposisi, setPendingDisposisi] = useState<any[]>([]);
    const [selectedDisposisiId, setSelectedDisposisiId] = useState<string>('');
    const [tindakanSingkat, setTindakanSingkat] = useState('');
    const [hasilTindakan, setHasilTindakan] = useState('');
    const [kategoriTerpilih, setKategoriTerpilih] = useState<LogbookKegiatan['kategori']>('Disposisi');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setTextUmum('');
            setSelectedDisposisiId('');
            setTindakanSingkat('');
            setHasilTindakan('');
            fetchPendingDisposisi();
        }
    }, [isOpen]);

    const fetchPendingDisposisi = async () => {
        if (!userProfile?.jabatanId) return;
        try {
            // Ambil disposisi yang ditugaskan ke jabatan user ini
            const q = query(
                collection(db, 'disposisi'),
                where('kepadaJabatanId', 'array-contains', userProfile.jabatanId)
            );
            const snapshot = await getDocs(q);
            const allDispo = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
            
            // Filter hanya yang belum selesai (jabatanId belum ada di penerimaSelesai)
            const pendingDispo = allDispo.filter((d: any) => !d.penerimaSelesai?.includes(userProfile.jabatanId));
            
            if (pendingDispo.length === 0) {
                setPendingDisposisi([]);
                return;
            }

            // Gabungkan dengan data surat agar judul dan pengirimnya muncul
            const enrichedPending = await Promise.all(pendingDispo.map(async (d: any) => {
                try {
                    const suratDoc = await getDoc(doc(db, 'surat', d.suratId));
                    if (suratDoc.exists()) {
                        const suratData = suratDoc.data();
                        return {
                            ...d,
                            suratPerihal: suratData.perihal || 'Tanpa Perihal',
                            suratAsal: suratData.pengirim || 'Tidak Diketahui',
                            instruksiPimpinan: d.instruksi || ''
                        };
                    }
                } catch (e) {
                    console.error("Error fetching surat for dispo:", e);
                }
                return null;
            }));

            setPendingDisposisi(enrichedPending.filter(Boolean));
        } catch (error) {
            console.error("Error fetching pending disposisi:", error);
        }
    };

    const handleGenerateAI = async () => {
        if (!selectedDisposisiId || !tindakanSingkat.trim()) {
            addToast('Pilih surat/disposisi dan tuliskan tindakan singkat terlebih dahulu.', 'info');
            return;
        }

        const selectedDisp = pendingDisposisi.find(d => d.id === selectedDisposisiId);
        if (!selectedDisp) return;

        setIsGenerating(true);
        try {
            const response = await fetch('/api/ai/generate-laporan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    suratPerihal: selectedDisp.suratPerihal,
                    suratPengirim: selectedDisp.suratAsal,
                    disposisiInstruksi: selectedDisp.instruksiPimpinan,
                    tindakanSingkat: tindakanSingkat,
                    userNama: userProfile?.namaLengkap,
                    userJabatan: userProfile?.jabatanId
                })
            });

            if (!response.ok) throw new Error('Gagal menghubungi AI');
            const data = await response.json();
            
            setHasilTindakan(data.hasilTindakan || '');
            if (data.kategori) setKategoriTerpilih(data.kategori);
            
            addToast('Draf berhasil dibuat oleh Copilot!', 'success');
        } catch (error) {
            console.error('AI error:', error);
            addToast('Gagal merumuskan dengan AI', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveTindakLanjut = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDisposisiId || !hasilTindakan.trim()) return;

        const selectedDisp = pendingDisposisi.find(d => d.id === selectedDisposisiId);
        if (!selectedDisp) return;

        setIsSaving(true);
        try {
            // Update dokumen laporanTindakLanjut di Firestore menjadi selesai
            await setDoc(doc(db, 'laporanTindakLanjut', selectedDisposisiId), {
                isDone: true,
                hasilTindakan: hasilTindakan,
                tanggalSelesai: new Date().toISOString()
            }, { merge: true });

            // Panggil fungsi onSaveTindakLanjut dari parent untuk logbook
            await onSaveTindakLanjut({
                deskripsi: hasilTindakan,
                selesai: true,
                kategori: kategoriTerpilih,
                sumber: 'laporan_tindak_lanjut',
                suratTerkaitId: selectedDisp.suratId,
                suratPerihal: selectedDisp.suratPerihal,
                disposisiTerkaitId: selectedDisp.id,
            });

            addToast('Tindak lanjut berhasil disimpan dan dicatat ke logbook.', 'success');
            onClose();
        } catch (error) {
            console.error('Error saving tindak lanjut:', error);
            addToast('Terjadi kesalahan saat menyimpan.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-card border-border">
                 <DialogHeader>
                    <DialogTitle>Tambah Kegiatan Baru</DialogTitle>
                 </DialogHeader>

                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="umum">Kegiatan Umum</TabsTrigger>
                        <TabsTrigger value="tindak-lanjut">Tindak Lanjut Surat</TabsTrigger>
                    </TabsList>

                    <TabsContent value="umum" className="pt-4">
                        <form onSubmit={(e) => { e.preventDefault(); if (textUmum.trim()) { onSaveUmum(textUmum.trim()); } onClose(); }} className="flex gap-2">
                            <Input type="text" value={textUmum} onChange={e => setTextUmum(e.target.value)} placeholder="Tulis kegiatan harian Anda..." autoFocus />
                            <Button type="submit" disabled={!textUmum.trim()} size="icon"><Send size={18}/></Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="tindak-lanjut" className="pt-4 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground/80">
                                <FileText size={16} className="text-blue-500" /> Pilih Surat / Disposisi yang Ditindaklanjuti
                            </Label>
                            <Select value={selectedDisposisiId} onValueChange={setSelectedDisposisiId}>
                                <SelectTrigger className="w-full bg-background border-border">
                                    <SelectValue placeholder="Pilih surat yang ingin dilaporkan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {pendingDisposisi.length === 0 ? (
                                        <SelectItem value="empty" disabled>Tidak ada surat menunggu</SelectItem>
                                    ) : (
                                        pendingDisposisi.map(disp => (
                                            <SelectItem key={disp.id} value={disp.id} className="py-2.5 cursor-pointer">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm line-clamp-1">{disp.suratPerihal}</span>
                                                    <span className="text-xs text-muted-foreground flex items-center mt-0.5">
                                                        <ChevronRight size={12} className="mr-0.5" /> Dari: {disp.suratAsal}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedDisposisiId && (
                            <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 pt-2">
                                <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground/80">
                                    <Zap size={16} className="text-amber-500" /> Ringkasan Tindakan Singkat
                                </Label>
                                
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {['Sudah dibaca & dipelajari', 'Telah didistribusikan ke staf', 'Menghubungi pengirim', 'Membuat konsep balasan', 'Diarsipkan'].map(suggestion => (
                                        <Badge 
                                            key={suggestion}
                                            variant="outline" 
                                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors font-normal py-0.5"
                                            onClick={() => setTindakanSingkat(prev => prev ? prev + ', ' + suggestion : suggestion)}
                                        >
                                            + {suggestion}
                                        </Badge>
                                    ))}
                                </div>

                                <Input 
                                    placeholder="Atau ketik sendiri tindakan Anda di sini (misal: sudah hubungi pelapor)..."
                                    value={tindakanSingkat}
                                    onChange={(e) => setTindakanSingkat(e.target.value)}
                                    className="bg-background"
                                />
                                <div className="flex justify-end mt-2 pt-2">
                                    <Button 
                                        type="button" 
                                        onClick={handleGenerateAI}
                                        disabled={isGenerating || !tindakanSingkat.trim()}
                                        className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md border-0 w-full sm:w-auto"
                                    >
                                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-amber-100" />}
                                        ✨ Generate Draft Profesional
                                    </Button>
                                </div>
                            </div>
                        )}

                        {hasilTindakan !== '' && (
                            <form onSubmit={handleSaveTindakLanjut} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 bg-muted/30 p-3.5 rounded-lg border border-border mt-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground/80">
                                        <CheckCircle2 size={16} className="text-green-500" /> Hasil Tindakan (Draf AI)
                                    </Label>
                                    <Textarea 
                                        rows={4} 
                                        value={hasilTindakan}
                                        onChange={(e) => setHasilTindakan(e.target.value)}
                                        className="bg-background font-medium text-sm leading-relaxed"
                                    />
                                    <p className="text-xs text-muted-foreground flex justify-between items-center px-1">
                                        <span>Silakan edit jika ada yang kurang sesuai sebelum disimpan.</span>
                                        <span className="font-semibold text-primary">{kategoriTerpilih}</span>
                                    </p>
                                </div>
                                <Button type="submit" disabled={isSaving || !hasilTindakan.trim()} className="w-full font-bold">
                                    {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Send size={16} className="mr-2" />}
                                    Simpan & Catat ke Logbook
                                </Button>
                            </form>
                        )}
                    </TabsContent>
                 </Tabs>

            </DialogContent>
        </Dialog>
    );
}
