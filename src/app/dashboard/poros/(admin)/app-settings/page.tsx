"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useToastContext } from '@/context/ToastContext';
import { Button } from '@/components/ui/button';

export default function AppSettingsPage() {
  const [opdList, setOpdList] = useState<any[]>([]);
  const { addToast } = useToastContext();

  useEffect(() => {
    const fetchOpd = async () => {
      const snap = await getDocs(collection(db, 'opdConfigs'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOpdList(list);
    };
    fetchOpd();
  }, []);

  const updateOpdTheme = async (opdId: string, theme: string) => {
    try {
      await updateDoc(doc(db, 'opdConfigs', opdId), { default_theme: theme });
      addToast('Tema OPD berhasil diperbarui. Pengguna perlu login ulang agar efek terlihat.', 'success');
      setOpdList(prev => prev.map(o => o.id === opdId ? { ...o, default_theme: theme } : o));
    } catch (e: any) {
      addToast(e.message, 'error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">⚙️ Pengaturan Aplikasi Lanjutan</h1>
      <div className="nk-card p-4 rounded-lg shadow-[var(--nk-shadow-sm)] border border-[var(--border)]">
        <h2 className="text-xl font-semibold mb-4">Pengaturan Tema Per-OPD</h2>
        <div className="space-y-4">
          {opdList.map(opd => (
            <div key={opd.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-md">
              <div>
                <p className="font-medium text-lg">{opd.namaInstansi || opd.id}</p>
                <p className="text-sm text-muted-foreground">Tema Aktif: <span className="font-bold">{opd.default_theme || 'sigap'}</span></p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={opd.default_theme === 'sigap' || !opd.default_theme ? 'default' : 'outline'}
                  onClick={() => updateOpdTheme(opd.id, 'sigap')}
                >
                  SIGAP (Klasik)
                </Button>
                <Button 
                  variant={opd.default_theme === 'poros' ? 'default' : 'outline'}
                  onClick={() => updateOpdTheme(opd.id, 'poros')}
                >
                  Poros (Modern)
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
