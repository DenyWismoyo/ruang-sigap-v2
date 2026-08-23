/**
 * Directory: src/app/dashboard/poros/(main)/talenta/components/PlanCreationModal.tsx
 * History Update:
 * - 2024-11-28: Initial creation. Modal for creating Individual Development Plan (IDP).
 * - 2026-08-23: Implementasi penyimpanan nyata Firestore ke koleksi 'idp_plans'.
 */

"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Target, BookOpen } from 'lucide-react';
import { KompetensiItem, UserProfile } from '@/types';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

interface PlanCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: UserProfile | undefined;
    gaps: KompetensiItem[];
}

export default function PlanCreationModal({ isOpen, onClose, employee, gaps }: PlanCreationModalProps) {
    const { userProfile } = useAuth();
    const { addToast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [program, setProgram] = useState('');
    const [targetWaktu, setTargetWaktu] = useState('');
    const [prioritas, setPrioritas] = useState('Tinggi');
    
    // Auto-fill saran program berdasarkan gap terbesar (gap negatif terbesar)
    const sortedGaps = [...gaps].sort((a, b) => (a.aktual - a.standar) - (b.aktual - b.standar));
    const criticalGap = sortedGaps[0];
    
    const suggestedProgram = criticalGap 
        ? `Pelatihan Intensif: ${criticalGap.aspek} (Gap: ${criticalGap.standar - criticalGap.aktual} Level)` 
        : 'Mentoring & Coaching';

    const handleClose = () => {
        if (!isProcessing) {
            setProgram('');
            setTargetWaktu('');
            setPrioritas('Tinggi');
            onClose();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employee || !program || !targetWaktu) {
            addToast("Harap lengkapi semua data program dan target waktu.", "error");
            return;
        }

        setIsProcessing(true);
        try {
            const planPayload = {
                employeeUid: employee.uid || "",
                employeeNip: employee.nip || "",
                employeeName: employee.namaLengkap || "",
                employeeJabatanId: employee.jabatanId || "",
                opdId: userProfile?.opdId || employee.opdId || "",
                createdByUid: userProfile?.uid || "",
                createdByName: userProfile?.namaLengkap || "",
                program,
                targetWaktu,
                prioritas,
                gaps: gaps.map(g => ({
                    aspek: g.aspek,
                    standar: g.standar,
                    aktual: g.aktual,
                    gap: g.standar - g.aktual
                })),
                status: 'Direncanakan',
                createdAt: serverTimestamp() as Timestamp,
                updatedAt: serverTimestamp() as Timestamp,
            };

            await addDoc(collection(db, 'idp_plans'), planPayload);

            addToast(`Rencana Pengembangan untuk ${employee.namaLengkap} berhasil disimpan!`, 'success');
            handleClose();
        } catch (error: any) {
            console.error("Gagal menyimpan IDP plan:", error);
            addToast(`Gagal menyimpan: ${error.message || "Terjadi kesalahan sistem"}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Buat Individual Development Plan (IDP)
                    </DialogTitle>
                    <DialogDescription>
                        Susun rencana pengembangan untuk {employee?.namaLengkap ? <strong>{employee.namaLengkap}</strong> : 'pegawai'} guna menutup <strong>{gaps.length} Gap Kompetensi</strong>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* Ringkasan Gap */}
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
                        <p className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Gap Prioritas:</p>
                        <ul className="list-disc list-inside text-blue-700 dark:text-blue-200 space-y-1">
                            {gaps.length > 0 ? gaps.map((g, idx) => (
                                <li key={idx}>
                                    <span className="font-medium">{g.aspek}</span>: Kurang {g.standar - g.aktual} level
                                </li>
                            )) : <li>Tidak ada gap signifikan. Fokus pada penguatan kekuatan.</li>}
                        </ul>
                    </div>

                    {/* Input Program */}
                    <div className="space-y-2">
                        <Label>Program Pengembangan / Intervensi</Label>
                        <div className="flex gap-2">
                            <Input 
                                value={program} 
                                onChange={e => setProgram(e.target.value)} 
                                placeholder="Contoh: Diklat Kepemimpinan / Mentoring"
                                required
                            />
                            <Button type="button" variant="outline" size="icon" title="Gunakan Saran Otomatis" onClick={() => setProgram(suggestedProgram)}>
                                <BookOpen size={16} className="text-muted-foreground" />
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Klik ikon buku untuk menggunakan saran otomatis berdasarkan gap.</p>
                    </div>

                    {/* Grid Input Lainnya */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Target Penyelesaian</Label>
                            <Select value={targetWaktu} onValueChange={setTargetWaktu}>
                                <SelectTrigger><SelectValue placeholder="Pilih Kuartal" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Q1 2025">Q1 2025 (Jan-Mar)</SelectItem>
                                    <SelectItem value="Q2 2025">Q2 2025 (Apr-Jun)</SelectItem>
                                    <SelectItem value="Q3 2025">Q3 2025 (Jul-Sep)</SelectItem>
                                    <SelectItem value="Q4 2025">Q4 2025 (Okt-Des)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Prioritas</Label>
                            <Select value={prioritas} onValueChange={setPrioritas}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Tinggi">Tinggi</SelectItem>
                                    <SelectItem value="Sedang">Sedang</SelectItem>
                                    <SelectItem value="Rendah">Rendah</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isProcessing}>Batal</Button>
                        <Button type="submit" disabled={isProcessing || !program || !targetWaktu} className="bg-blue-600 hover:bg-blue-700">
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>} Simpan Rencana
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
