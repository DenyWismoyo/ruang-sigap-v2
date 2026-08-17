# LAMPIRAN CIPTAAN: CUPLIKAN SOURCE CODE
**Judul Ciptaan:** POROS (sebelumnya Ruang Sigap)
**Jenis Ciptaan:** Program Komputer

---

## 1. Struktur Data Model Utama (Types & Schema)
*File: `src/types/index.ts`*
*Deskripsi: Mendefinisikan struktur data kompleks untuk sistem Multi-Tenant (OPD), RBAC (Role-Based Access Control), dan modul tata naskah.*

```typescript
export type AppTheme = 'sigap' | 'poros';

// Definisi Role Dinamis
export type FunctionalRole = 
  | 'pengurus_barang' 
  | 'notulis_rapat' 
  | 'bendahara' 
  | 'petugas_pelayanan' 
  | 'pengelola_tapem' 
  | 'operator_surat'
  | 'petugas_kelurahan'
  | 'petugas_kecamatan';

// Entitas Pengguna (User Profile)
export interface UserProfile { 
  id?: string; 
  uid: string; 
  namaLengkap: string; 
  nip: string; 
  email: string; 
  opdId: string; 
  opdIndukId?: string | null; 
  jabatanId: string; 
  role: 'user' | 'admin_opd' | 'super_admin' | 'staf_tu'; 
  status: 'aktif' | 'nonaktif'; 
  additionalRoles?: FunctionalRole[]; 
  app_theme?: AppTheme;
}

// Entitas Organisasi (Multi-Tenant)
export interface OpdConfig { 
  id?: string; 
  packageName: 'Dasar' | 'Profesional' | 'Enterprise' | 'Custom'; 
  langgananAktifHingga: any; 
  kuotaPengguna: number; 
  penggunaAktifSaatIni: number; 
  features: { 
    aiSuratReader: boolean; 
    aiNotulensi: boolean; 
    analitika: boolean; 
    manajemenAset: boolean; 
    persetujuanDraf: boolean; 
    formBuilder: boolean; 
  }; 
  default_theme?: AppTheme; 
}

// Entitas Tata Naskah (Surat)
export interface Surat { 
  id: string; 
  nomorSurat: string; 
  perihal: string; 
  pengirim: string; 
  tanggalSurat: any; 
  tanggalDiterima: any; 
  fileUrl: string; 
  klasifikasi: 'Biasa' | 'Penting' | 'Segera' | 'Rahasia'; 
  statusPenyelesaian: "Baru" | "Didisposisikan" | "Proses Tindak Lanjut" | "Selesai" | "Diarsipkan"; 
  createdBy: string; 
  opdId: string; 
}

// Entitas Tugas / Task Management
export interface Tugas { 
  id?: string; 
  opdId: string; 
  judulTugas: string; 
  deskripsi: string; 
  dariJabatanId: string; 
  kepadaJabatanId: string; 
  status: 'Baru' | 'Dikerjakan' | 'Selesai' | 'Dibatalkan'; 
  prioritas: 'Tinggi' | 'Sedang' | 'Rendah'; 
}
```

---

## 2. Logika Akses Antarmuka & Routing (RBAC)
*File: `src/app/dashboard/sigap/components/Sidebar.tsx`*
*Deskripsi: Mengatur akses menu secara dinamis berdasarkan jabatan, role tambahan, dan paket berlangganan OPD.*

```tsx
import React, { memo, useMemo } from 'react';
import { LayoutDashboard, Mail, ClipboardCheck, Users, Archive, FileText } from 'lucide-react';

export const userHasAccess = (item: NavItem, userProfile: UserProfile, jabatanProfile: Jabatan | null, opdConfig: OpdConfig | null) => {
     const isPimpinan = jabatanProfile && jabatanProfile.level <= 5;
     let roleMatch = item.allowedRoles.includes(userProfile.role);
     
     if (['/dashboard/evaluasi', '/dashboard/tugas/delegasi'].includes(item.href) && isPimpinan) roleMatch = true;
     
     if (!roleMatch && item.allowedAdditionalRoles && userProfile.additionalRoles) {
         const hasAdditional = item.allowedAdditionalRoles.some(role => userProfile.additionalRoles?.includes(role));
         if (hasAdditional) roleMatch = true;
     }
     
     if (!roleMatch) return false;
     
     if (item.featureFlag) {
         if (userProfile.role === 'super_admin') return true;
         return opdConfig?.features?.[item.featureFlag as keyof typeof opdConfig.features] === true;
     }
     return true;
};

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: ['user', 'staf_tu', 'admin_opd', 'super_admin'], section: 'ruangKerja', colorClass: 'text-cyan-600' },
  { href: '/dashboard/surat', label: 'Kotak Masuk Surat', icon: Mail, allowedRoles: ['user', 'staf_tu', 'admin_opd', 'super_admin'], section: 'ruangKerja', notificationKey: 'suratBaruCount', colorClass: 'text-cyan-600' }, 
  { href: '/dashboard/tugas/delegasi', label: 'Delegasi Tugas', icon: Users, allowedRoles: ['admin_opd', 'super_admin'], section: 'produktivitas', colorClass: 'text-green-600' },
  { href: '/dashboard/skw', label: 'Layanan SKW', icon: FileText, allowedRoles: ['admin_opd', 'super_admin'], allowedAdditionalRoles: ['petugas_kelurahan', 'petugas_kecamatan'], section: 'koordinasi', colorClass: 'text-orange-600' },
  { href: '/dashboard/arsip', label: 'Arsip Surat', icon: Archive, allowedRoles: ['user', 'staf_tu', 'admin_opd', 'super_admin'], allowedAdditionalRoles: ['operator_surat'], section: 'informasi', colorClass: 'text-yellow-600' }
];
```

---

## 3. Integrasi Kecerdasan Buatan (AI Cloud Function)
*File: `src/aiFunctions.ts`*
*Deskripsi: Menangani ekstraksi data dari surat fisik/scan menggunakan Google Gemini AI API secara aman melalui backend.*

```typescript
import * as functions from "firebase-functions/v1";

export const extractSuratDataAI = functions.region("asia-southeast2").runWith({
    timeoutSeconds: 60,
    memory: "512MB"
}).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Harus login untuk menggunakan AI.");
    }

    const { base64Image } = data;
    const apiKey = process.env.GEMINI_API_KEY; 

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
        
        const promptText = `
              Anda adalah sekretaris ahli birokrasi. Analisis gambar surat ini untuk mengekstrak metadata.
              Ekstrak data dalam format JSON berikut: nomorSurat, perihal, pengirim, tanggalSurat, jenisSurat, detailAgenda.
        `;

        const payload = {
            contents: [{
                parts: [
                    { text: promptText },
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const textPart = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        return JSON.parse(textPart);

    } catch (error: any) {
        throw new functions.https.HttpsError("internal", error.message);
    }
});
```
