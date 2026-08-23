"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Stamp, Hash } from 'lucide-react';

export default function PengaturanSuratKeluarLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    const getActiveTab = () => {
        if (pathname?.includes('/pengaturan/penomoran')) return 'penomoran';
        return 'kop-surat';
    };

    const handleTabChange = (value: string) => {
        if (value === 'penomoran') router.push('/dashboard/sigap/surat-keluar/pengaturan/penomoran');
        else router.push('/dashboard/sigap/surat-keluar/pengaturan/kop-surat');
    };

    return (
        <div className="w-full flex flex-col space-y-4">
            <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="kop-surat">
                        <Stamp className="w-4 h-4 mr-2" /> Kop Surat OPD
                    </TabsTrigger>
                    <TabsTrigger value="penomoran">
                        <Hash className="w-4 h-4 mr-2" /> Format Penomoran
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            
            <div className="pt-2">
                {children}
            </div>
        </div>
    );
}
