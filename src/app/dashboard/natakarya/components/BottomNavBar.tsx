"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LayoutGrid, Briefcase, Inbox, ListChecks, Menu } from 'lucide-react';
import { DrawerTrigger } from "@/components/ui/drawer";
import { WelcomeSummary } from '@/types';

interface BottomNavBarProps {
  pathname: string;
  onLinkClick: (key: 'surat' | 'tugas' | 'none') => void;
  welcomeSummary: WelcomeSummary;
}

export default function BottomNavBar({ pathname, onLinkClick, welcomeSummary }: BottomNavBarProps) {
    const navLinks = [
        { href: '/dashboard', label: 'Beranda', icon: LayoutGrid, notifKey: 'none' as const },
        { href: '/dashboard/ruang-kerja', label: 'Ruang Kerja', icon: Briefcase, notifKey: 'none' as const },
        { href: '/dashboard/surat', label: 'Surat', icon: Inbox, notifKey: 'surat' as const },
        { href: '/dashboard/tugas', label: 'Tugas', icon: ListChecks, notifKey: 'tugas' as const },
    ];

    return (
        <motion.div 
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-16 natakarya-bottom-nav shadow-[0_-4px_20px_rgba(17,94,89,0.05)] md:hidden safe-area-bottom"
        >
            {navLinks.map(link => {
                let notifCount = 0;
                if (link.notifKey === 'surat') notifCount = welcomeSummary.suratBaruCount || 0;
                if (link.notifKey === 'tugas') notifCount = welcomeSummary.tugasBaruCount || 0;
                
                const isActive = pathname === link.href;

                return (
                    <Link 
                        key={link.href} 
                        href={link.href} 
                        onClick={() => onLinkClick(link.notifKey)} 
                        className="flex-1 h-full"
                    >
                        <motion.div 
                            whileTap={{ scale: 0.85 }} 
                            className={`relative flex flex-col items-center justify-center w-full h-full py-1 transition-colors duration-200 ${isActive ? 'text-[var(--nk-gradient-start)]' : 'text-muted-foreground hover:text-[var(--nk-gradient-start)]'}`}
                        >
                            {isActive && (
                                <motion.div layoutId="bottom-nav-glow" className="absolute w-12 h-12 bg-[var(--nk-gradient-start)]/15 rounded-full blur-md -z-10" />
                            )}
                            {notifCount > 0 && (
                                <motion.span 
                                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.5 }}
                                    className="absolute top-2 right-1/2 translate-x-3 w-4 h-4 bg-amber-500 text-amber-950 text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background shadow-sm"
                                >
                                    {notifCount > 9 ? '!' : notifCount}
                                </motion.span>
                            )}
                            <motion.div animate={{ scale: isActive ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                                <link.icon className={`w-5 h-5 mb-1 relative z-10 ${isActive ? 'fill-current opacity-20' : ''}`} />
                            </motion.div>
                            <motion.span 
                                animate={{ scale: isActive ? 1.1 : 0.95 }} 
                                className={`text-[10px] font-medium relative z-10 ${isActive ? 'font-bold' : ''}`}
                            >
                                {link.label}
                            </motion.span>
                            {isActive && <motion.span layoutId="bottom-nav-indicator" className="absolute bottom-0 w-8 h-1 bg-[var(--nk-gradient-start)] rounded-t-full shadow-[0_-2px_8px_rgba(17,94,89,0.4)]" />}
                        </motion.div>
                    </Link>
                );
            })}
            <DrawerTrigger asChild>
                <button className="flex-1 h-full">
                    <motion.div 
                        whileTap={{ scale: 0.85 }} 
                        className="flex flex-col items-center justify-center w-full h-full py-1 text-muted-foreground hover:text-[var(--nk-gradient-start)] transition-colors duration-200"
                    >
                        <Menu className="w-5 h-5 mb-1" />
                        <span className="text-[10px] font-medium">Menu</span>
                    </motion.div>
                </button>
            </DrawerTrigger>
        </motion.div>
    );
}
