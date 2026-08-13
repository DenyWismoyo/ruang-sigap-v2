"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SpotlightCard } from '@/components/SpotlightCard';

interface QuickAccessCardProps {
  href: string;
  label: string;
  icon: React.ElementType;
  colorClass: string;
}

export default function QuickAccessCard({ href, label, icon: Icon, colorClass }: QuickAccessCardProps) {
    let spotColor: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate' = 'indigo';
    if (colorClass.includes('green')) spotColor = 'emerald';
    else if (colorClass.includes('yellow') || colorClass.includes('orange')) spotColor = 'amber';
    else if (colorClass.includes('red') || colorClass.includes('pink')) spotColor = 'rose';
    else if (colorClass.includes('gray')) spotColor = 'slate';

    return (
        <Link href={href} className="block group">
            <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                <SpotlightCard color={spotColor} className="p-3 flex flex-col items-center justify-center text-center h-28 cursor-pointer !rounded-xl">
                    <div className={`p-2.5 ${colorClass.replace('text-', 'bg-').replace('600', '100')} dark:bg-opacity-20 rounded-full mb-2 group-hover:scale-110 transition-transform`}>
                        <motion.div whileHover={{ rotate: 15 }} transition={{ type: "spring", stiffness: 200, damping: 10 }}>
                            <Icon className={`w-5 h-5 ${colorClass}`} />
                        </motion.div>
                    </div>
                    <p className="text-xs font-medium text-foreground mt-1 line-clamp-2 leading-tight relative z-10">{label}</p>
                </SpotlightCard>
            </motion.div>
        </Link>
    );
}