"use client";

import React, { useState, useEffect } from 'react';
import { useUserAuth } from '@/context/AuthContext';
import { FormatPenomoranConfig, OpdConfig } from '@/types';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit2, Loader2, Save, Info } from 'lucide-react';

export default function PenomoranPage() {
    const { opdConfig, userProfile } = useUserAuth();
    const isAdminOpd = userProfile?.role === 'admin_opd';
    const isSuperAdmin = userProfile?.role === 'super_admin';
    const [configs, setConfigs] = useState<FormatPenomoranConfig[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormatPenomoranConfig | null>(null);

    useEffect(() => {
        if (opdConfig && opdConfig.penomoranConfigs) {
            setConfigs(opdConfig.penomoranConfigs);
        } else {
            setConfigs([]);
        }
    }, [opdConfig]);

    if (!isAdminOpd && !isSuperAdmin) {
        return <div className="p-8 text-center text-red-500">Anda tidak memiliki akses ke halaman ini.</div>;
    }

    const handleAdd = () => {
        setFormData({
            id: `format_${Date.now()}`,
            nama: 'Format Surat Dinas Biasa',
            format: '{kode_klasifikasi}/{no_urut}/{kode_opd}/{tahun}',
            kodeKlasifikasiLainnya: '000',
            isDefault: configs.length === 0,
        });
        setEditingIndex(-1);
    };

    const handleEdit = (index: number) => {
        setFormData({ ...configs[index] });
        setEditingIndex(index);
    };

    const handleDelete = async (index: number) => {
        if (!confirm('Hapus format penomoran ini?')) return;
        const newConfigs = configs.filter((_, i) => i !== index);
        await saveToDb(newConfigs);
    };

    const handleSaveForm = async () => {
        if (!formData || !userProfile) return;
        
        let newConfigs = [...configs];
        
        // If this one is default, remove default from others
        if (formData.isDefault) {
            newConfigs = newConfigs.map(c => ({ ...c, isDefault: false }));
        }

        if (editingIndex === -1) {
            newConfigs.push(formData);
        } else if (editingIndex !== null) {
            newConfigs[editingIndex] = formData;
        }

        await saveToDb(newConfigs);
        setEditingIndex(null);
    };

    const saveToDb = async (newConfigs: FormatPenomoranConfig[]) => {
        if (!userProfile?.opdId) return;
        setLoading(true);
        try {
            const opdRef = doc(db, 'opdConfigs', userProfile.opdId);
            await updateDoc(opdRef, {
                penomoranConfigs: newConfigs
            });
            setConfigs(newConfigs);
            toast.success('Format Penomoran berhasil disimpan!');
        } catch (error: any) {
            toast.error('Gagal menyimpan format penomoran: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getPreview = (formatStr: string, fallback: string = '000') => {
        let preview = formatStr || '';
        preview = preview.replace('{kode_klasifikasi}', '800'); // Contoh kepegawaian
        preview = preview.replace('{no_urut}', '0123'); // Contoh urut
        preview = preview.replace('{kode_opd}', 'KOMINFO'); 
        preview = preview.replace('{tahun}', new Date().getFullYear().toString());
        preview = preview.replace('{bulan}', (new Date().getMonth() + 1).toString().padStart(2, '0'));
        preview = preview.replace('{tanggal}', new Date().getDate().toString().padStart(2, '0'));
        
        return preview;
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Manajemen Format Penomoran</h1>
                    <p className="text-muted-foreground">Kelola berbagai format penomoran otomatis yang akan digunakan di Surat Keluar.</p>
                </div>
                {editingIndex === null && (
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Format Baru
                    </Button>
                )}
            </div>

            {editingIndex !== null && formData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border shadow-sm animate-in fade-in zoom-in-95">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2">Formulir Format Penomoran</h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nama Profil Penomoran</Label>
                                <Input 
                                    value={formData.nama} 
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })} 
                                    placeholder="Contoh: Surat Edaran"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Jadikan Default</Label>
                                <div className="flex items-center h-10">
                                    <Checkbox 
                                        checked={formData.isDefault}
                                        onCheckedChange={c => setFormData({ ...formData, isDefault: c === true })}
                                    />
                                    <span className="ml-2 text-sm">Ya, jadikan default</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Struktur Format Nomor</Label>
                            <Input 
                                value={formData.format} 
                                onChange={e => setFormData({ ...formData, format: e.target.value })} 
                                placeholder="{kode_klasifikasi}/{no_urut}/{kode_opd}/{tahun}"
                            />
                            <div className="bg-muted p-3 text-xs rounded text-muted-foreground mt-2">
                                <strong>Tag yang tersedia:</strong><br/>
                                <span className="font-mono text-primary">{'{kode_klasifikasi}'}</span> = Kode dari klasifikasi surat (misal: 800)<br/>
                                <span className="font-mono text-primary">{'{no_urut}'}</span> = Nomor auto-increment 4 digit (misal: 0123)<br/>
                                <span className="font-mono text-primary">{'{kode_opd}'}</span> = Kode OPD Anda<br/>
                                <span className="font-mono text-primary">{'{tahun}'}</span> = Tahun berjalan (misal: {new Date().getFullYear()})<br/>
                                <span className="font-mono text-primary">{'{bulan}'}</span> = Bulan berjalan (misal: 08)<br/>
                                <span className="font-mono text-primary">{'{tanggal}'}</span> = Tanggal berjalan (misal: 15)
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Kode Klasifikasi Fallback</Label>
                            <Input 
                                value={formData.kodeKlasifikasiLainnya || ''} 
                                onChange={e => setFormData({ ...formData, kodeKlasifikasiLainnya: e.target.value })} 
                                placeholder="000"
                            />
                            <p className="text-xs text-muted-foreground">Digunakan jika surat tidak memiliki klasifikasi yang valid.</p>
                        </div>
                        
                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingIndex(null)} disabled={loading}>Batal</Button>
                            <Button onClick={handleSaveForm} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Simpan Format
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2">Preview Nomor Ter-Generate</h2>
                        <div className="bg-white text-black p-8 rounded border shadow-sm min-h-[150px] flex items-center justify-center">
                            <div className="text-center space-y-2">
                                <p className="text-sm text-gray-500 uppercase tracking-widest">Contoh Hasil</p>
                                <div className="text-3xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 inline-block px-4">
                                    {getPreview(formData.format, formData.kodeKlasifikasiLainnya)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {configs.map((config, idx) => (
                        <div key={config.id} className="bg-card rounded-lg border shadow-sm p-4 hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    {config.nama} 
                                    {config.isDefault && <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">Default</span>}
                                </h3>
                                <p className="text-sm font-mono text-muted-foreground mt-1">{config.format}</p>
                            </div>
                            <div className="bg-muted px-4 py-2 rounded text-sm font-semibold text-primary shrink-0 text-center min-w-[200px]">
                                {getPreview(config.format)}
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(idx)}>
                                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(idx)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {configs.length === 0 && (
                        <div className="text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                            Belum ada format penomoran yang dikonfigurasi.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
