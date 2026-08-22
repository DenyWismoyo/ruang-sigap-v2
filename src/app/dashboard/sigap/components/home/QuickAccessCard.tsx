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
            {/* Desktop View */}
            <div className="hidden md:flex flex-col items-center justify-center text-center p-3 bg-card text-card-foreground rounded-xl shadow-sm border border-border h-28 hover:-translate-y-1 transition-all duration-300">
                <div className={`p-2.5 ${colorClass.replace('text-', 'bg-').replace('600', '100')} dark:bg-opacity-20 rounded-full mb-2 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                <p className="text-xs font-medium text-foreground mt-1 line-clamp-2 leading-tight">{label}</p>
            </div>

            {/* Mobile View (No Wrapper Minimalist) */}
            <div className="flex md:hidden flex-col items-center justify-start gap-2.5 p-2 rounded-2xl hover:bg-accent/30 active:bg-accent/50 transition-all">
                <div className="flex items-center justify-center group-hover:-translate-y-1 transition-all duration-300">
                    <Icon className={`w-7 h-7 ${colorClass || 'text-primary'} group-hover:scale-110 transition-transform duration-300`} strokeWidth={1.5} />
                </div>
                <p className="text-[10px] font-medium text-center text-muted-foreground leading-tight line-clamp-2 w-full group-hover:text-foreground transition-colors">{label}</p>
            </div>
        </Link>
    );
}