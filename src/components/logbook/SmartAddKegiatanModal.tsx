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
import { Send, Sparkles, Loader2, CheckCircle2, ChevronRight, FileText, Zap, BookOpen, Target } from 'lucide-react';
import { LogbookKegiatan, UserProfile } from '@/types';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToastContext } from '@/context/ToastContext';
import { AktivitasCombobox } from '@/components/ekinerja/AktivitasCombobox';
import { AktivitasSolo, detectAktivitasFromLogbookText, getAktivitasSoloById } from '@/data/masterAktivitasSolo';
import { cn } from '@/lib/utils';

export interface SmartAddKegiatanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveUmum: (text: string, waktuMulai?: string, waktuSelesai?: string, aktivitasId?: number, aktivitasNama?: string, rhkId?: string, rhkNama?: string) => void;
    onSaveTindakLanjut: (kegiatan: Partial<LogbookKegiatan>) => Promise<void>;
    userProfile: UserProfile | null;
    tenant?: 'sigap' | 'poros';
}

export function SmartAddKegiatanModal({
    isOpen,
    onClose,
    onSaveUmum,
    onSaveTindakLanjut,
    userProfile,
    tenant = 'sigap',
}: SmartAddKegiatanModalProps) {
    const isPoros = tenant === 'poros';
    const { addToast } = useToastContext();
    const [activeTab, setActiveTab] = useState("umum");
    
    // Helper format waktu HH:mm
    const getCurrentTimes = () => {
        const now = new Date();
        const pad = (num: number) => String(num).padStart(2, '0');
        const start = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const endD = new Date(now.getTime() + 60 * 60 * 1000);
        const end = `${pad(endD.getHours())}:${pad(endD.getMinutes())}`;
        return { start, end };
    };

    // Kamus Kepwal Status & Selected Activity
    const isKamusKepwalEnabled = userProfile?.useKamusAktivitasKepwal !== false;
    const [selectedAktivitas, setSelectedAktivitas] = useState<AktivitasSolo | undefined>(undefined);

    // State Tab Umum
    const [textUmum, setTextUmum] = useState('');
    const [jamMulaiUmum, setJamMulaiUmum] = useState('');
    const [jamSelesaiUmum, setJamSelesaiUmum] = useState('');
    const [selectedRhkId, setSelectedRhkId] = useState<string>('');
    const [isPolishing, setIsPolishing] = useState(false);

    const handlePolishUmum = async () => {
        if (!textUmum.trim() || isPolishing) return;
        setIsPolishing(true);
        try {
            const res = await fetch('/api/ai/polish-kegiatan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: textUmum,
                    userJabatan: userProfile?.namaJabatan,
                    currentAktivitasId: selectedAktivitas?.id,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.polishedText) {
                    setTextUmum(data.polishedText);
                }
                if (data.aktivitasId) {
                    const matched = getAktivitasSoloById(Number(data.aktivitasId));
                    if (matched) setSelectedAktivitas(matched);
                }
                addToast('✨ Bahasa kegiatan disempurnakan sesuai naskah dinas formal!', 'success');
            }
        } catch (e) {
            console.warn("Gagal poles bahasa:", e);
        } finally {
            setIsPolishing(false);
        }
    };

    // State Tab Tindak Lanjut
    const [pendingDisposisi, setPendingDisposisi] = useState<any[]>([]);
    const [selectedDisposisiId, setSelectedDisposisiId] = useState<string>('');
    const [tindakanSingkat, setTindakanSingkat] = useState('');
    const [hasilTindakan, setHasilTindakan] = useState('');
    const [jamMulaiTL, setJamMulaiTL] = useState('');
    const [jamSelesaiTL, setJamSelesaiTL] = useState('');
    const [kategoriTerpilih, setKategoriTerpilih] = useState<LogbookKegiatan['kategori']>('Disposisi');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            const times = getCurrentTimes();
            setTextUmum('');
            setSelectedAktivitas(undefined);
            setJamMulaiUmum(times.start);
            setJamSelesaiUmum(times.end);
            setSelectedDisposisiId('');
            setSelectedRhkId('');
            setTindakanSingkat('');
            setHasilTindakan('');
            setJamMulaiTL(times.start);
            setJamSelesaiTL(times.end);
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

            const matched = isKamusKepwalEnabled ? detectAktivitasFromLogbookText(selectedDisp.suratPerihal || hasilTindakan) : null;
            const selectedRhkTL = userProfile?.rhkBknList?.find(r => r.id === selectedRhkId);

            // Panggil fungsi onSaveTindakLanjut dari parent untuk logbook
            await onSaveTindakLanjut({
                deskripsi: hasilTindakan,
                selesai: true,
                kategori: kategoriTerpilih,
                sumber: 'laporan_tindak_lanjut',
                suratTerkaitId: selectedDisp.suratId,
                suratPerihal: selectedDisp.suratPerihal,
                disposisiTerkaitId: selectedDisp.id,
                waktuMulai: jamMulaiTL,
                waktuSelesai: jamSelesaiTL,
                createdAt: new Date().toISOString(),
                aktivitasId: matched?.id,
                aktivitasNama: matched?.nama,
                rhkId: selectedRhkTL?.id,
                rhkNama: selectedRhkTL?.rencanaHasilKerja,
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
            <DialogContent className={cn("sm:max-w-xl bg-card border-border", isPoros && "nk-card")}>
                 <DialogHeader>
                    <DialogTitle className={cn("text-base font-semibold", isPoros && "text-[var(--nk-deep)] dark:text-[var(--nk-teal-accent)]")}>
                        Tambah Kegiatan Baru
                    </DialogTitle>
                 </DialogHeader>

                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="umum">Kegiatan Umum</TabsTrigger>
                        <TabsTrigger value="tindak-lanjut">Tindak Lanjut Surat</TabsTrigger>
                    </TabsList>

                    <TabsContent value="umum" className="pt-4">
                        <form 
                            onSubmit={(e) => { 
                                e.preventDefault(); 
                                if (textUmum.trim()) { 
                                    const selectedRhk = userProfile?.rhkBknList?.find(r => r.id === selectedRhkId);
                                    onSaveUmum(
                                        textUmum.trim(), 
                                        jamMulaiUmum, 
                                        jamSelesaiUmum,
                                        selectedAktivitas?.id,
                                        selectedAktivitas?.nama,
                                        selectedRhk?.id,
                                        selectedRhk?.rencanaHasilKerja
                                    ); 
                                } 
                                onClose(); 
                            }} 
                            className="space-y-3"
                        >
                            {/* SMART SELECT KAMUS AKTIVITAS */}
                            {isKamusKepwalEnabled && (
                                <div className={cn(
                                    "space-y-1.5 p-2.5 rounded-lg border",
                                    isPoros ? "border-[var(--nk-teal-subtle)] bg-[var(--nk-teal-glow)]" : "border-border/80 bg-muted/20"
                                )}>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground/90">
                                            <BookOpen size={14} className={isPoros ? "text-[var(--nk-teal-mid)]" : "text-primary"} /> Kamus 152 Aktivitas Kepwal Solo (Smart Select)
                                        </Label>
                                        <Badge variant="outline" className={cn("text-[10px]", isPoros ? "bg-[var(--nk-teal-glow)] text-[var(--nk-teal-accent)] border-[var(--nk-teal-subtle)]" : "bg-primary/10 text-primary border-primary/30")}>
                                            Kepwal 786/154/2020
                                        </Badge>
                                    </div>
                                    <AktivitasCombobox
                                        value={selectedAktivitas?.id}
                                        onChange={(akt) => {
                                            setSelectedAktivitas(akt);
                                            if (akt) {
                                                if (!textUmum.trim()) {
                                                    setTextUmum(akt.nama);
                                                } else if (!textUmum.includes(akt.nama)) {
                                                    setTextUmum(`[${akt.nama}] ${textUmum}`);
                                                }
                                            }
                                        }}
                                        placeholder="Cari & pilih aktivitas resmi BKPSDM Solo..."
                                        showQuickPills={true}
                                    />
                                </div>
                            )}

                            {/* RHK SKP BKN SMART SELECT */}
                            {userProfile?.rhkBknList && userProfile.rhkBknList.length > 0 && (
                                <div className={cn(
                                    "space-y-1.5 p-2.5 rounded-lg border",
                                    isPoros ? "border-[var(--nk-teal-subtle)] bg-[var(--nk-teal-glow)]" : "border-border/80 bg-muted/20"
                                )}>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground/90">
                                            <Target size={14} className={isPoros ? "text-[var(--nk-teal-mid)]" : "text-blue-600"} /> Tautkan ke RHK SKP BKN (Opsional)
                                        </Label>
                                        <Badge variant="outline" className={cn("text-[10px]", isPoros ? "bg-[var(--nk-teal-glow)] text-[var(--nk-teal-accent)] border-[var(--nk-teal-subtle)]" : "bg-blue-50 text-blue-700 border-blue-200")}>
                                            PermenPANRB 6
                                        </Badge>
                                    </div>
                                    <select
                                        value={selectedRhkId}
                                        onChange={(e) => setSelectedRhkId(e.target.value)}
                                        className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 text-foreground"
                                    >
                                        <option value="">-- Tidak Ditautkan ke RHK Spesifik --</option>
                                        {userProfile.rhkBknList.map(rhk => (
                                            <option key={rhk.id} value={rhk.id}>
                                                [{rhk.jenis}] {rhk.rencanaHasilKerja}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Uraian Kegiatan */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-foreground/80">
                                        Uraian Kegiatan Harian
                                    </Label>
                                    {textUmum.trim().length >= 3 && (
                                        <button
                                            type="button"
                                            onClick={handlePolishUmum}
                                            disabled={isPolishing}
                                            className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 transition-colors"
                                            title="Poles bahasa menjadi tata naskah dinas formal baku ASN via AI"
                                        >
                                            {isPolishing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} className="text-amber-500" />}
                                            Poles Bahasa Birokrasi
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input 
                                        type="text" 
                                        value={textUmum} 
                                        onChange={e => setTextUmum(e.target.value)} 
                                        placeholder="Tulis detail kegiatan harian Anda..." 
                                        autoFocus={!isKamusKepwalEnabled}
                                    />
                                    <Button 
                                        type="submit" 
                                        disabled={!textUmum.trim()} 
                                        size="icon"
                                        className={cn(isPoros && "bg-[var(--nk-teal-mid)] hover:bg-[var(--nk-deep)] text-white")}
                                    >
                                        <Send size={18}/>
                                    </Button>
                                </div>
                            </div>

                            {/* Real-time Smart Match Suggestion */}
                            {isKamusKepwalEnabled && !selectedAktivitas && textUmum.trim().length >= 3 && (() => {
                                const matched = detectAktivitasFromLogbookText(textUmum);
                                if (!matched) return null;
                                return (
                                    <div className={cn(
                                        "flex items-center justify-between p-2 rounded-md border text-xs animate-in fade-in-50",
                                        isPoros 
                                            ? "bg-[var(--nk-teal-glow)] border-[var(--nk-teal-subtle)]" 
                                            : "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200/70"
                                    )}>
                                        <div className="flex items-center gap-1.5 text-muted-foreground truncate">
                                            <Sparkles size={13} className={isPoros ? "text-[var(--nk-teal-accent)]" : "text-blue-500"} />
                                            <span>Saran kamus Kepwal:</span>
                                            <span className={cn("font-semibold truncate", isPoros ? "text-[var(--nk-teal-accent)]" : "text-blue-700 dark:text-blue-300")}>
                                                {matched.nama} (+{matched.nilaiPoin}p)
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAktivitas(matched)}
                                            className={cn(
                                                "text-[11px] font-semibold hover:underline shrink-0 ml-2",
                                                isPoros ? "text-[var(--nk-teal-accent)]" : "text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                            )}
                                        >
                                            + Terapkan
                                        </button>
                                    </div>
                                );
                            })()}

                            <div className="grid grid-cols-2 gap-3 pt-1">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Jam Mulai</Label>
                                    <Input 
                                        type="time" 
                                        value={jamMulaiUmum} 
                                        onChange={e => setJamMulaiUmum(e.target.value)} 
                                        className="h-8 text-xs bg-background" 
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Jam Selesai</Label>
                                    <Input 
                                        type="time" 
                                        value={jamSelesaiUmum} 
                                        onChange={e => setJamSelesaiUmum(e.target.value)} 
                                        className="h-8 text-xs bg-background" 
                                    />
                                </div>
                            </div>

                            {userProfile?.customAktivitasList && userProfile.customAktivitasList.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                                        <Sparkles size={12} className={isPoros ? "text-[var(--nk-teal-accent)]" : "text-primary"} /> Kamus Aktivitas Rutin Anda:
                                    </Label>
                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                                        {userProfile.customAktivitasList.map((akt, idx) => (
                                            <Badge
                                                key={idx}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-primary/10 hover:border-primary/40 text-xs font-normal py-1 px-2 transition-colors"
                                                onClick={() => setTextUmum(akt)}
                                            >
                                                + {akt}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </form>
                    </TabsContent>

                    <TabsContent value="tindak-lanjut" className="pt-4 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold flex items-center gap-1.5 text-foreground/80">
                                <FileText size={16} className={isPoros ? "text-[var(--nk-teal-accent)]" : "text-blue-500"} /> Pilih Surat / Disposisi yang Ditindaklanjuti
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
                                        <span className={cn("font-semibold", isPoros ? "text-[var(--nk-teal-accent)]" : "text-primary")}>{kategoriTerpilih}</span>
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Jam Mulai</Label>
                                        <Input 
                                            type="time" 
                                            value={jamMulaiTL} 
                                            onChange={e => setJamMulaiTL(e.target.value)} 
                                            className="h-8 text-xs bg-background" 
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-muted-foreground">Jam Selesai</Label>
                                        <Input 
                                            type="time" 
                                            value={jamSelesaiTL} 
                                            onChange={e => setJamSelesaiTL(e.target.value)} 
                                            className="h-8 text-xs bg-background" 
                                        />
                                    </div>
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isSaving || !hasilTindakan.trim()} 
                                    className={cn("w-full font-bold", isPoros && "bg-[var(--nk-teal-mid)] hover:bg-[var(--nk-deep)] text-white")}
                                >
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

export default SmartAddKegiatanModal;
