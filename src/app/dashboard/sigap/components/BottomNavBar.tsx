"use client";

import React from 'react';
import Link from 'next/link';
import { LayoutGrid, Briefcase, Inbox, Sparkles, Menu } from 'lucide-react';
import { DrawerTrigger } from "@/components/ui/drawer";
import { WelcomeSummary } from '@/types';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { RoleAccessKey } from '@/types';
import { useRuangKerjaFeed } from '@/app/dashboard/sigap/hooks/useRuangKerjaFeed';
import { differenceInDays } from 'date-fns';

interface BottomNavBarProps {
  pathname: string;
  onLinkClick: (key: 'surat' | 'tugas' | 'none') => void;
  welcomeSummary: WelcomeSummary;
}

export default function BottomNavBar({ pathname, onLinkClick, welcomeSummary }: BottomNavBarProps) {
    const { hasAccess } = useRoleAccess();
    const { feedItems } = useRuangKerjaFeed();

    // Hitung disposisi overdue (> 2 hari) untuk badge tab Aksi Cepat
    const overdueCount = React.useMemo(() => {
        const pending = (feedItems || []).filter(
            (i) => i.type === 'surat_disposisi' && (i as any).disposisi?.status !== 'Selesai'
        );
        return pending.filter((i) => {
            if (i.type !== 'surat_disposisi' || !(i as any).disposisi?.tanggalDisposisi) return false;
            let t: Date;
            try {
                t = typeof (i as any).disposisi.tanggalDisposisi.toDate === 'function'
                    ? (i as any).disposisi.tanggalDisposisi.toDate()
                    : new Date((i as any).disposisi.tanggalDisposisi.seconds * 1000);
            } catch {
                t = new Date();
            }
            return differenceInDays(new Date(), t) >= 2;
        }).length;
    }, [feedItems]);

    const navLinks: { 
        href: string; 
        label: string; 
        icon: any; 
        notifKey: 'none' | 'surat' | 'tugas' | 'aksi_cepat'; 
        roleAccessKey?: RoleAccessKey;
        isQuickAction?: boolean;
    }[] = [
        { href: '/dashboard', label: 'Beranda', icon: LayoutGrid, notifKey: 'none' },
        { href: '/dashboard/ruang-kerja', label: 'Ruang Kerja', icon: Briefcase, notifKey: 'none', roleAccessKey: 'menu_ruang_kerja' },
        { href: '/dashboard/surat', label: 'Surat', icon: Inbox, notifKey: 'surat', roleAccessKey: 'menu_surat_masuk' },
        { href: '#aksi-cepat', label: 'Aksi Cepat', icon: Sparkles, notifKey: 'aksi_cepat', isQuickAction: true },
    ];

    const visibleLinks = navLinks.filter(link => {
        if (!link.roleAccessKey) return true;
        return hasAccess(link.roleAccessKey);
    });

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-[var(--bottom-nav-height)] pb-[env(safe-area-inset-bottom,0px)] bg-card/95 backdrop-blur-lg border-t border-border/20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
            {visibleLinks.map(link => {
                let notifCount = 0;
                if (link.notifKey === 'surat') notifCount = welcomeSummary.suratBaruCount || 0;
                if (link.notifKey === 'aksi_cepat') notifCount = overdueCount;
                
                const isActive = pathname === link.href;

                if (link.isQuickAction) {
                    return (
                        <button
                            key={link.href}
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('sigap:toggle-quick-action-hub'))}
                            className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-95 group"
                            title="Buka Menu Akses Cepat (Swipe, Upload, Copilot, Tools)"
                        >
                            {notifCount > 0 && (
                                <span className="absolute top-2 right-1/2 translate-x-3 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card animate-pulse">
                                    {notifCount > 9 ? '!' : notifCount}
                                </span>
                            )}
                            <div className="w-5 h-5 mb-1 flex items-center justify-center rounded-full text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">{link.label}</span>
                        </button>
                    );
                }

                return (
                    <Link 
                        key={link.href} 
                        href={link.href} 
                        onClick={() => onLinkClick(link.notifKey as any)} 
                        className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 active:scale-95 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                    >
                        {notifCount > 0 && (
                            <span className="absolute top-2 right-1/2 translate-x-3 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-card animate-pulse">
                                {notifCount > 9 ? '!' : notifCount}
                            </span>
                        )}
                        <link.icon className={`w-5 h-5 mb-1 transition-transform ${isActive ? 'text-primary scale-110' : ''}`} />
                        <span className="text-[10px] font-medium">{link.label}</span>
                        {isActive && <span className="absolute bottom-0 w-12 h-1 bg-primary rounded-full" />}
                    </Link>
                );
            })}
            <DrawerTrigger asChild>
                <button className="flex flex-col items-center justify-center flex-1 h-full py-1 text-muted-foreground hover:text-primary transition-all duration-200 active:scale-95">
                    <Menu className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Menu</span>
                </button>
            </DrawerTrigger>
        </div>
    );
}