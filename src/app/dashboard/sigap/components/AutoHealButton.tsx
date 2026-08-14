// Lokasi: src/app/dashboard/components/AutoHealButton.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Stethoscope, Loader2, AlertTriangle } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';
import { useToast } from '@/context/ToastContext';
import ConfirmModal from '@/app/dashboard/sigap/components/ConfirmModal';

export default function AutoHealButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const { addToast } = useToast();

    const executeHeal = async () => {
        setIsConfirmOpen(false);
        setIsLoading(true);
        
        try {
            // Memanggil fungsi dari region yang tepat[cite: 7]
            const functionsInstance = getFunctions(db.app, 'asia-southeast2');
            const runAutoHeal = httpsCallable(functionsInstance, 'runAutoHeal');
            
            const result = await runAutoHeal();
            const data = result.data as any;
            
            if (data.success) {
                addToast(data.message, 'success');
            }
        } catch (error: any) {
            addToast(`Gagal: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="p-4 border border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900 rounded-xl flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-green-700 dark:text-green-500 flex items-center gap-2">
                        <Stethoscope size={18} />
                        Sistem Auto-Heal
                    </h3>
                    <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                        Pindai dan perbaiki data yang tidak sinkron (misal: counter notifikasi minus atau error cache).
                    </p>
                </div>
                <Button 
                    onClick={() => setIsConfirmOpen(true)} 
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Stethoscope className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Memperbaiki...' : 'Jalankan Diagnosis'}
                </Button>
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={executeHeal}
                title="Jalankan Auto Heal?"
                message="Sistem akan memindai seluruh database untuk mencari dan memperbaiki inkonsistensi data. Proses ini mungkin memakan waktu beberapa detik. Lanjutkan?"
                confirmText="Ya, Mulai Perbaikan"
            />
        </>
    );
}