"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface QuickAccessCardProps {
  href: string;
  label: string;
  icon: React.ElementType;
  colorClass: string;
}

export default function QuickAccessCard({ href, label, icon: Icon }: QuickAccessCardProps) {
    return (
        <Link href={href} className="block group">
            <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <div className="relative p-1 md:p-3 flex flex-col items-center justify-center text-center h-24 md:h-28 cursor-pointer bg-transparent md:bg-[var(--nk-surface-2)] md:backdrop-blur-md md:rounded-2xl md:border md:border-[var(--nk-glass-border)] md:shadow-[0_4px_20px_rgb(0,0,0,0.03)] group-hover:shadow-[var(--nk-shadow-md)] transition-shadow">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--nk-teal-light)] to-[var(--nk-teal-mid)] opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"></div>
                    <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[var(--nk-surface-3)] border border-[var(--nk-glass-border)] rounded-xl mb-1.5 md:mb-2 group-hover:scale-110 transition-transform relative">
                        <div className="absolute inset-0 bg-[var(--nk-teal-light)] opacity-0 group-hover:opacity-20 blur-md rounded-xl transition-opacity"></div>
                        <motion.div whileHover={{ rotate: 10 }} transition={{ type: "spring", stiffness: 200, damping: 10 }} className="relative z-10">
                            <Icon className="w-6 h-6 text-[var(--nk-teal-mid)]" />
                        </motion.div>
                    </div>
                    <p className="text-xs font-semibold text-foreground mt-1 line-clamp-2 leading-tight relative z-10 group-hover:text-[var(--nk-teal-mid)] transition-colors">{label}</p>
                </div>
            </motion.div>
        </Link>
    );
}
