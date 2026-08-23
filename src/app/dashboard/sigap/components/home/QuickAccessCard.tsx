"use client";

import React from 'react';
import Link from 'next/link';

interface QuickAccessCardProps {
  href: string;
  label: string;
  icon: React.ElementType;
  colorClass: string;
}

export default function QuickAccessCard({ href, label, icon: Icon, colorClass }: QuickAccessCardProps) {
    return (
        <Link href={href} className="group block">
            <div className="flex flex-col items-center justify-start md:justify-center gap-2.5 md:gap-3 p-2 md:p-3 rounded-[var(--radius)] hover:bg-accent/50 active:bg-accent/70 transition-all">
                <div className="flex items-center justify-center group-hover:-translate-y-1 transition-all duration-300">
                    <Icon className={`w-7 h-7 md:w-8 md:h-8 ${colorClass || 'text-primary'} group-hover:scale-110 transition-transform duration-300`} strokeWidth={1.5} />
                </div>
                <p className="text-[10px] md:text-xs font-medium text-center text-muted-foreground md:text-foreground leading-tight line-clamp-2 w-full group-hover:text-foreground transition-colors">{label}</p>
            </div>
        </Link>
    );
}