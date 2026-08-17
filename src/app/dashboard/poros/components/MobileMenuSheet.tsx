"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { navItems, userHasAccess } from './Sidebar'; // Import dari Sidebar
import { UserProfile, Jabatan, OpdConfig } from '@/types';

interface MobileMenuSheetProps {
  userProfile: UserProfile;
  jabatanProfile: Jabatan | null;
  opdConfig: OpdConfig | null;
  onLinkClick: () => void;
}

export default function MobileMenuSheet({ userProfile, jabatanProfile, opdConfig, onLinkClick }: MobileMenuSheetProps) {
  const bottomBarHrefs = ['/dashboard', '/dashboard/ruang-kerja', '/dashboard/surat', '/dashboard/tugas'];
  
  const visibleItems = navItems.filter(item => 
    !bottomBarHrefs.includes(item.href) && 
    userHasAccess(item, userProfile, jabatanProfile, opdConfig)
  );

  const containerVariants = {
      hidden: { opacity: 0 },
      show: {
          opacity: 1,
          transition: { staggerChildren: 0.05 }
      }
  };

  const itemVariants = {
      hidden: { opacity: 0, scale: 0.8, y: 10 },
      show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-4 pt-0">
      <ScrollArea className="h-[60vh] pr-4">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-4 gap-y-6 gap-x-2">
          {visibleItems.map(item => { 
              const Icon = item.icon; 
              return (
                  <motion.div key={item.href} variants={itemVariants} whileTap={{ scale: 0.9, opacity: 0.7 }}>
                      <Link 
                        href={item.href} 
                        onClick={onLinkClick} 
                        className="flex flex-col items-center justify-start gap-2 p-2 rounded-xl hover:bg-accent active:bg-accent/80 transition-colors group h-full"
                      >
                        <motion.div whileHover={{ scale: 1.2, rotate: 5 }} className={`flex items-center justify-center w-12 h-12 rounded-2xl shadow-sm group-hover:shadow-md transition-all ${item.colorClass?.replace('text-', 'bg-').replace('600', '100')} dark:bg-opacity-20`}>
                            <Icon className={`w-6 h-6 ${item.colorClass || 'text-primary'}`} />
                        </motion.div>
                        <span className="text-[10px] font-medium text-center text-foreground leading-tight line-clamp-2 w-full">
                            {item.label}
                        </span>
                      </Link>
                  </motion.div>
              )
          })}
        </motion.div>
      </ScrollArea>
    </div>
  );
}
