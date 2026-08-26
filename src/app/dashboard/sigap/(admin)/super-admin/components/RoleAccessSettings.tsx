"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { OpdConfig, OpdRoleAccess, RoleAccessKey } from '@/types';
import { Shield, Save, CheckCircle2 } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/context/ToastContext';
import { navItems } from '../../../components/Sidebar';

interface RoleAccessSettingsProps {
  opdId: string;
  opdConfig: OpdConfig | null;
}

const AVAILABLE_KEYS: { key: RoleAccessKey; label: string; description: string }[] = [
  // Ruang Kerja
  { key: 'menu_surat_masuk', label: 'Kotak Masuk Surat', description: 'Akses ke halaman utama penerimaan dan disposisi surat.' },
  { key: 'menu_ruang_kerja', label: 'Ruang Kerja Saya', description: 'Akses ke dashboard operasional harian.' },
  { key: 'menu_tugas', label: 'Tugas Saya', description: 'Akses manajemen tugas personal.' },
  { key: 'menu_logbook', label: 'Logbook Harian', description: 'Akses pengisian logbook.' },
  { key: 'menu_portal', label: 'Portal Integrasi', description: 'Akses SSO & Integrasi eksternal.' },
  
  // Produktivitas
  { key: 'menu_checklist', label: 'Checklist Pribadi', description: 'Akses fitur to-do list.' },
  { key: 'menu_bukti_kinerja', label: 'Bukti E-Kinerja', description: 'Akses pelaporan dan upload e-kinerja.' },
  { key: 'menu_kompetensi', label: 'Portofolio Kompetensi', description: 'Akses sertifikat & portofolio.' },
  { key: 'menu_surat_keluar', label: 'Surat Keluar', description: 'Akses draf & pembuatan surat keluar.' },
  { key: 'menu_delegasi', label: 'Delegasi Tugas', description: 'Akses manajemen pendelegasian wewenang.' },
  { key: 'menu_formulir', label: 'Isi Formulir', description: 'Akses untuk mengisi formulir dinamis.' },
  { key: 'menu_feedback', label: 'Survei & Feedback', description: 'Akses pengisian umpan balik.' },
  
  // Koordinasi
  { key: 'menu_notulensi', label: 'Notulensi Rapat', description: 'Akses fitur pencatatan rapat.' },
  { key: 'menu_jadwal', label: 'Jadwal Internal', description: 'Akses manajemen kalender & jadwal OPD.' },
  
  // Informasi
  { key: 'menu_upload_surat', label: 'Unggah Surat Baru', description: 'Akses untuk mendaftarkan surat masuk baru secara manual.' },
  { key: 'menu_arsip', label: 'Arsip Surat', description: 'Akses pencarian dan repositori arsip persuratan.' },
  { key: 'menu_dokumen', label: 'Repository Dokumen', description: 'Akses penyimpanan file cloud internal.' },
  { key: 'menu_knowledge', label: 'Knowledge Base', description: 'Akses pusat bantuan & SOP.' },
  { key: 'menu_tutorial', label: 'Tutorial Aplikasi', description: 'Akses video & panduan penggunaan.' },
  { key: 'menu_pengumuman', label: 'Papan Pengumuman', description: 'Akses papan informasi (broadcast).' },
  
  // Analitika
  { key: 'menu_rekap_surat', label: 'Rekap Surat', description: 'Akses laporan komprehensif persuratan.' },
  
  // Administrasi
  { key: 'menu_users', label: 'Master Pengguna', description: 'Akses manajemen user OPD.' },
  { key: 'menu_jabatan', label: 'Master Jabatan', description: 'Akses manajemen struktur & posisi OPD.' },
  { key: 'menu_templat', label: 'Templat Disposisi', description: 'Akses kelola shortcut redaksi disposisi.' },
];

const ROLES = [
  { id: 'user_pimpinan', label: 'User Pimpinan (Eselon II - IV)' },
  { id: 'user_bawahan', label: 'User Bawahan (Pelaksana/Fungsional)' },
  { id: 'staf_tu', label: 'Staf Tata Usaha' },
  { id: 'admin_opd', label: 'Admin OPD' }
] as const;

export default function RoleAccessSettings({ opdId, opdConfig }: RoleAccessSettingsProps) {
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const getDefaultKeys = (roleId: string): RoleAccessKey[] => {
    return navItems
      .filter(item => {
        if (!item.roleAccessKey) return false;
        if (roleId === 'user_pimpinan') return item.allowedRoles.includes('user') || item.href === '/dashboard/tugas/delegasi' || item.href === '/dashboard/evaluasi';
        if (roleId === 'user_bawahan') return item.allowedRoles.includes('user') && item.href !== '/dashboard/tugas/delegasi';
        if (roleId === 'staf_tu') return item.allowedRoles.includes('staf_tu');
        if (roleId === 'admin_opd') return item.allowedRoles.includes('admin_opd');
        return false;
      })
      .map(item => item.roleAccessKey as RoleAccessKey);
  };

  const [accessState, setAccessState] = useState<OpdRoleAccess>(() => {
    const existing = opdConfig?.roleAccessConfig;
    
    return {
      user_pimpinan: existing?.user_pimpinan ?? existing?.user ?? getDefaultKeys('user_pimpinan'),
      user_bawahan: existing?.user_bawahan ?? existing?.user ?? getDefaultKeys('user_bawahan'),
      user: existing?.user ?? getDefaultKeys('user_pimpinan'),
      staf_tu: existing?.staf_tu ?? getDefaultKeys('staf_tu'),
      admin_opd: existing?.admin_opd ?? getDefaultKeys('admin_opd'),
    };
  });

  const handleToggle = (role: keyof OpdRoleAccess, key: RoleAccessKey, isChecked: boolean) => {
    setAccessState(prev => {
      const currentRoleKeys = prev[role] || [];
      let newRoleKeys: RoleAccessKey[];
      
      if (isChecked) {
        if (!currentRoleKeys.includes(key)) {
          newRoleKeys = [...currentRoleKeys, key];
        } else {
          newRoleKeys = currentRoleKeys;
        }
      } else {
        newRoleKeys = currentRoleKeys.filter(k => k !== key);
      }
      
      return { ...prev, [role]: newRoleKeys };
    });
  };

  const handleResetDefault = () => {
    if (confirm('Anda yakin ingin mengembalikan semua akses role ke pengaturan awal/bawaan?')) {
      setAccessState({
        user_pimpinan: getDefaultKeys('user_pimpinan'),
        user_bawahan: getDefaultKeys('user_bawahan'),
        user: getDefaultKeys('user_pimpinan'), // fallback backwards compat
        staf_tu: getDefaultKeys('staf_tu'),
        admin_opd: getDefaultKeys('admin_opd'),
      });
      addToast('Pengaturan akses dikembalikan ke bawaan, jangan lupa klik Simpan.', 'info');
    }
  };

  const handleSave = async () => {
    if (!opdId) return;
    setIsSaving(true);
    try {
      const configRef = doc(db, 'opdConfigs', opdId);
      await updateDoc(configRef, {
        roleAccessConfig: accessState
      });
      addToast('Pengaturan akses role berhasil disimpan', 'success');
    } catch (error: any) {
      console.error('Error saving role access:', error);
      addToast('Gagal menyimpan pengaturan: ' + error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/20 border-b border-border/50">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="w-5 h-5" />
          <CardTitle className="text-lg">Kustomisasi Akses Layout & Menu</CardTitle>
        </div>
        <CardDescription>
          Atur tampilan dan akses ke menu tertentu berdasarkan role pengguna di OPD ini.
          Nonaktifkan switch untuk menyembunyikan menu tersebut dari sidebar.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
          {ROLES.map(roleItem => (
            <div key={roleItem.id} className="p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                {roleItem.label}
              </h3>
              
              <div className="space-y-5">
                {AVAILABLE_KEYS.map(item => {
                  const roleKeys = accessState[roleItem.id as keyof OpdRoleAccess] || [];
                  const isChecked = roleKeys.includes(item.key);
                  
                  return (
                    <div key={item.key} className="flex flex-row items-start space-x-3">
                      <Switch
                        id={`${roleItem.id}-${item.key}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleToggle(roleItem.id as keyof OpdRoleAccess, item.key, checked)}
                        className="mt-0.5"
                      />
                      <div className="space-y-1 leading-none">
                        <Label 
                          htmlFor={`${roleItem.id}-${item.key}`}
                          className="font-medium cursor-pointer"
                        >
                          {item.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/30 border-t border-border flex justify-end p-4 gap-3">
        <Button variant="outline" onClick={handleResetDefault} disabled={isSaving} className="text-muted-foreground hover:text-foreground">
          Reset Default
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <span className="animate-spin text-lg">⏳</span> : <Save className="w-4 h-4" />}
          Simpan Akses Role
        </Button>
      </CardFooter>
    </Card>
  );
}
