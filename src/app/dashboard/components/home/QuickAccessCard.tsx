"use client";

import React from 'react';
import Link from 'next/link';
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
        <Link href={href}>
            <SpotlightCard color={spotColor} className="p-3 flex flex-col items-center justify-center text-center h-28 cursor-pointer !rounded-xl">
                <div className={`p-2.5 ${colorClass.replace('text-', 'bg-').replace('600', '100')} dark:bg-opacity-20 rounded-full mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                <p className="text-xs font-medium text-foreground mt-1 line-clamp-2 leading-tight relative z-10">{label}</p>
            </SpotlightCard>
        </Link>
    );
}