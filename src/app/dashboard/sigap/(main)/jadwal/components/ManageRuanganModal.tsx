"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { OPD } from '@/types';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ManageRuanganModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageRuanganModal({ isOpen, onClose }: ManageRuanganModalProps) {
    const { userProfile } = useUserAuth();
    const [ruanganList, setRuanganList] = useState<string[]>([]);
    const [newRuangan, setNewRuangan] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (isOpen && userProfile?.opdId) {
            fetchRuangan();
        }
    }, [isOpen, userProfile]);

    const fetchRuangan = async () => {
        setIsFetching(true);
        try {
            const snap = await getDoc(doc(db, 'opd', userProfile!.opdId));
            if (snap.exists()) {
                const opdData = snap.data() as OPD;
                setRuanganList(opdData.daftarRuangan || []);
            }
        } catch (error) {
            console.error("Gagal memuat ruangan:", error);
        } finally {
            setIsFetching(false);
        }
    };

    const handleAdd = async () => {
        if (!newRuangan.trim()) return;
        if (ruanganList.includes(newRuangan.trim())) return; // Prevent duplicate
        
        setLoading(true);
        try {
            const updatedList = [...ruanganList, newRuangan.trim()];
            await updateDoc(doc(db, 'opd', userProfile!.opdId), {
                daftarRuangan: updatedList
            });
            setRuanganList(updatedList);
            setNewRuangan('');
        } catch (error) {
            console.error("Gagal menambah ruangan:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (ruanganToDelete: string) => {
        setLoading(true);
        try {
            const updatedList = ruanganList.filter(r => r !== ruanganToDelete);
            await updateDoc(doc(db, 'opd', userProfile!.opdId), {
                daftarRuangan: updatedList
            });
            setRuanganList(updatedList);
        } catch (error) {
            console.error("Gagal menghapus ruangan:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">Kelola Daftar Ruangan</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        Tambahkan daftar ruangan yang ada di instansi Anda. Ruangan ini akan otomatis muncul sebagai pilihan dropdown saat membuat jadwal.
                    </p>
                    
                    <div className="flex space-x-2">
                        <Input 
                            value={newRuangan}
                            onChange={(e) => setNewRuangan(e.target.value)}
                            placeholder="Contoh: Ruang Rapat Utama"
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <Button onClick={handleAdd} disabled={loading || !newRuangan.trim()} className="sg-btn sg-btn-primary">
                            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div className="mt-4 border border-border/40 rounded-[var(--radius)] divide-y divide-border/40 max-h-[40vh] overflow-y-auto">
                        {isFetching ? (
                            <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : ruanganList.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground bg-accent/10">Belum ada ruangan yang ditambahkan.</div>
                        ) : (
                            ruanganList.map((ruangan, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 hover:bg-accent/30 transition-colors">
                                    <span className="font-medium text-sm text-foreground">{ruangan}</span>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ruangan)} disabled={loading} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 h-8 w-8">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
