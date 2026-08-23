"use client";

import React, { useState, useEffect } from 'react';
import { useUserAuth } from '@/context/AuthContext';
import { KopSuratConfig, OpdConfig } from '@/types';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit2, Loader2, Save } from 'lucide-react';

export default function KopSuratPage() {
    const { opdConfig, userProfile } = useUserAuth();
    const isAdminOpd = userProfile?.role === 'admin_opd';
    const isSuperAdmin = userProfile?.role === 'super_admin';
    const [configs, setConfigs] = useState<KopSuratConfig[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [formData, setFormData] = useState<KopSuratConfig | null>(null);

    useEffect(() => {
        if (opdConfig && opdConfig.kopSuratConfigs) {
            setConfigs(opdConfig.kopSuratConfigs);
        } else {
            setConfigs([]);
        }
    }, [opdConfig]);

    if (!isAdminOpd && !isSuperAdmin) {
        return <div className="p-8 text-center text-red-500">Anda tidak memiliki akses ke halaman ini.</div>;
    }

    const handleAdd = () => {
        setFormData({
            id: `kop_${Date.now()}`,
            nama: 'Kop Surat Baru',
            headerUtama: 'PEMERINTAH DAERAH',
            subHeader: 'NAMA INSTANSI',
            alamat: 'Jl. Contoh Alamat No. 123',
            kontak: 'Telp: 021-123456',
            website: 'www.website.go.id',
            kodePos: '12345',
            garisBawah: 'tebal',
            isDefault: configs.length === 0,
        });
        setEditingIndex(-1);
    };

    const handleEdit = (index: number) => {
        setFormData({ ...configs[index] });
        setEditingIndex(index);
    };

    const handleDelete = async (index: number) => {
        if (!confirm('Hapus kop surat ini?')) return;
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

    const saveToDb = async (newConfigs: KopSuratConfig[]) => {
        if (!userProfile?.opdId) return;
        setLoading(true);
        try {
            const opdRef = doc(db, 'opdConfigs', userProfile.opdId);
            await updateDoc(opdRef, {
                kopSuratConfigs: newConfigs
            });
            setConfigs(newConfigs);
            toast.success('Kop surat berhasil disimpan!');
        } catch (error: any) {
            toast.error('Gagal menyimpan kop surat: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Manajemen Kop Surat</h1>
                    <p className="text-muted-foreground">Kelola berbagai kop surat yang dapat digunakan di Bank Template dan Surat Keluar.</p>
                </div>
                {editingIndex === null && (
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Kop Surat
                    </Button>
                )}
            </div>

            {editingIndex !== null && formData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg border shadow-sm animate-in fade-in zoom-in-95">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2">Formulir Kop Surat</h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nama Profil Kop (Untuk Pilihan)</Label>
                                <Input 
                                    value={formData.nama} 
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })} 
                                    placeholder="Contoh: Kop Standar"
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>URL Logo Kiri</Label>
                                <Input 
                                    value={formData.logoKiriUrl || ''} 
                                    onChange={e => setFormData({ ...formData, logoKiriUrl: e.target.value })} 
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>URL Logo Kanan (Opsional)</Label>
                                <Input 
                                    value={formData.logoKananUrl || ''} 
                                    onChange={e => setFormData({ ...formData, logoKananUrl: e.target.value })} 
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Header Utama</Label>
                            <Input 
                                value={formData.headerUtama} 
                                onChange={e => setFormData({ ...formData, headerUtama: e.target.value })} 
                                placeholder="PEMERINTAH KOTA XYZ"
                                className="font-bold text-center"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Sub Header (Nama Instansi)</Label>
                            <Input 
                                value={formData.subHeader} 
                                onChange={e => setFormData({ ...formData, subHeader: e.target.value })} 
                                placeholder="DINAS KOMUNIKASI DAN INFORMATIKA"
                                className="font-bold text-center text-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Alamat Lengkap</Label>
                            <Input 
                                value={formData.alamat} 
                                onChange={e => setFormData({ ...formData, alamat: e.target.value })} 
                                placeholder="Jl. Raya No 1..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Kontak (Telp/Fax)</Label>
                                <Input 
                                    value={formData.kontak} 
                                    onChange={e => setFormData({ ...formData, kontak: e.target.value })} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Website / Email</Label>
                                <Input 
                                    value={formData.website || ''} 
                                    onChange={e => setFormData({ ...formData, website: e.target.value })} 
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Kode Pos</Label>
                                <Input 
                                    value={formData.kodePos || ''} 
                                    onChange={e => setFormData({ ...formData, kodePos: e.target.value })} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Garis Pembatas</Label>
                                <Select 
                                    value={formData.garisBawah} 
                                    onValueChange={(val: any) => setFormData({ ...formData, garisBawah: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Garis" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tebal">Tebal</SelectItem>
                                        <SelectItem value="tipis">Tipis</SelectItem>
                                        <SelectItem value="ganda">Ganda</SelectItem>
                                        <SelectItem value="tidak_ada">Tanpa Garis</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="pt-4 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingIndex(null)} disabled={loading}>Batal</Button>
                            <Button onClick={handleSaveForm} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Simpan Kop Surat
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b pb-2">Preview</h2>
                        <div className="bg-white text-black p-8 rounded border shadow-sm min-h-[300px]">
                            {/* Kop Surat Preview Render */}
                            <div className="flex items-center justify-between gap-4 mb-4">
                                {formData.logoKiriUrl ? (
                                    <img src={formData.logoKiriUrl} alt="Logo Kiri" className="w-20 h-24 object-contain" />
                                ) : (
                                    <div className="w-20 h-24 bg-gray-100 flex items-center justify-center text-xs text-gray-400 text-center border-2 border-dashed">Logo Kiri</div>
                                )}
                                
                                <div className="flex-1 text-center">
                                    <div className="text-lg font-bold">{formData.headerUtama}</div>
                                    <div className="text-2xl font-bold">{formData.subHeader}</div>
                                    <div className="text-sm mt-1">{formData.alamat}</div>
                                    <div className="text-sm">
                                        {formData.kontak} {formData.website && `| ${formData.website}`} {formData.kodePos && `| Kode Pos: ${formData.kodePos}`}
                                    </div>
                                </div>

                                {formData.logoKananUrl ? (
                                    <img src={formData.logoKananUrl} alt="Logo Kanan" className="w-20 h-24 object-contain" />
                                ) : (
                                    <div className="w-20 h-24 bg-gray-50 flex items-center justify-center text-xs text-transparent"></div>
                                )}
                            </div>
                            
                            {formData.garisBawah === 'tebal' && <div className="border-b-4 border-black w-full my-2"></div>}
                            {formData.garisBawah === 'tipis' && <div className="border-b border-black w-full my-2"></div>}
                            {formData.garisBawah === 'ganda' && <div className="border-b-4 border-black border-double w-full my-2"></div>}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {configs.map((config, idx) => (
                        <div key={config.id} className="bg-card rounded-lg border shadow-sm p-4 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        {config.nama} 
                                        {config.isDefault && <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">Default</span>}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">{config.subHeader}</p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
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
                        <div className="col-span-full text-center p-12 border-2 border-dashed rounded-lg text-muted-foreground">
                            Belum ada kop surat yang dikonfigurasi.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
