"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserAuth } from '@/context/AuthContext';
import { Mail, ClipboardSignature, Files, Settings } from 'lucide-react';

export default function SuratKeluarLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { userProfile } = useUserAuth();

    const isAdmin = userProfile?.role === 'admin_opd' || userProfile?.role === 'super_admin';

    // Helper untuk menentukan active tab berdasarkan pathname
    const getActiveTab = () => {
        if (pathname?.includes('/surat-keluar/persetujuan')) return 'persetujuan';
        if (pathname?.includes('/surat-keluar/template')) return 'template';
        if (pathname?.includes('/surat-keluar/pengaturan')) return 'pengaturan';
        return 'draf';
    };

    const handleTabChange = (value: string) => {
        switch (value) {
            case 'draf':
                router.push('/dashboard/sigap/surat-keluar');
                break;
            case 'persetujuan':
                router.push('/dashboard/sigap/surat-keluar/persetujuan');
                break;
            case 'template':
                router.push('/dashboard/sigap/surat-keluar/template');
                break;
            case 'pengaturan':
                router.push('/dashboard/sigap/surat-keluar/pengaturan');
                break;
        }
    };

    // Jangan tampilkan tab jika di mode "Buat" atau "Preview" atau "Editor Template" yang butuh full-screen
    const isFullScreenMode = pathname?.includes('/surat-keluar/buat') || 
                             pathname?.includes('/surat-keluar/preview') ||
                             pathname?.includes('/surat-keluar/template/editor') || 
                             pathname?.match(/\/persetujuan\/[a-zA-Z0-9]+$/); // hide on detail persetujuan

    return (
        <div className="w-full flex flex-col min-h-screen space-y-4">
            {!isFullScreenMode && (
                <div className="flex flex-col space-y-4 pt-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Manajemen Surat Keluar</h1>
                        <p className="text-sm text-muted-foreground">Pusat pembuatan, persetujuan, dan konfigurasi surat keluar.</p>
                    </div>

                    <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full border-b pb-[1px]">
                        <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-2 justify-start overflow-x-auto w-full border-b border-border/40 pb-2 mb-[-3px]">
                            <TabsTrigger 
                                value="draf" 
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2"
                            >
                                <Mail className="w-4 h-4 mr-2" /> Draf & Surat Keluar
                            </TabsTrigger>
                            <TabsTrigger 
                                value="persetujuan" 
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2"
                            >
                                <ClipboardSignature className="w-4 h-4 mr-2" /> Persetujuan Draf
                            </TabsTrigger>
                            <TabsTrigger 
                                value="template" 
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2"
                            >
                                <Files className="w-4 h-4 mr-2" /> Bank Template
                            </TabsTrigger>
                            {isAdmin && (
                                <TabsTrigger 
                                    value="pengaturan" 
                                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none px-4 py-2"
                                >
                                    <Settings className="w-4 h-4 mr-2" /> Pengaturan
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </Tabs>
                </div>
            )}
            
            <div className={isFullScreenMode ? "" : "pt-4"}>
                {children}
            </div>
        </div>
    );
}
