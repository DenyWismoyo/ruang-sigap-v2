"use client";

import React from 'react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { navItems, userHasAccess, sections } from './Sidebar'; // Import dari Sidebar
import { UserProfile, Jabatan, OpdConfig } from '@/types';
import { motion } from 'framer-motion';

interface MobileMenuSheetProps {
  userProfile: UserProfile;
  jabatanProfile: Jabatan | null;
  opdConfig: OpdConfig | null;
  onLinkClick: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 25 } }
};

export default function MobileMenuSheet({ userProfile, jabatanProfile, opdConfig, onLinkClick }: MobileMenuSheetProps) {
  const bottomBarHrefs = ['/dashboard', '/dashboard/ruang-kerja', '/dashboard/surat', '/dashboard/tugas'];
  
  const visibleItems = navItems.filter(item => 
    !bottomBarHrefs.includes(item.href) && 
    userHasAccess(item, userProfile, jabatanProfile, opdConfig)
  );

  return (
    <div className="px-4 pb-4 pt-0 h-full">
      <ScrollArea className="h-full pr-4">
        <motion.div 
          className="space-y-6 pb-[120px]"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {sections.map(section => {
              const sectionItems = visibleItems.filter(item => item.section === section.id);
              if (sectionItems.length === 0) return null;
              
              const SectionIcon = section.icon;

              return (
                  <motion.div key={section.id} variants={itemVariants} className="relative">
                      <div className="flex items-center gap-2 mb-4 pl-1">
                          <SectionIcon size={14} className="text-muted-foreground" strokeWidth={2} />
                          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{section.title}</h3>
                      </div>
                      <div className="grid grid-cols-4 gap-y-6 gap-x-2 relative z-10">
                        {sectionItems.map((item, idx) => { 
                            const Icon = item.icon; 
                            return (
                                <motion.div key={item.href} variants={itemVariants} whileTap={{ scale: 0.92 }}>
                                    <Link 
                                      href={item.href} 
                                      onClick={onLinkClick} 
                                      className="flex flex-col items-center justify-start gap-2.5 p-2 rounded-2xl hover:bg-accent/30 active:bg-accent/50 transition-all group"
                                    >
                                      <div className="flex items-center justify-center group-hover:-translate-y-1 transition-all duration-300">
                                          <Icon className={`w-7 h-7 ${item.colorClass || 'text-primary'} group-hover:scale-110 transition-transform duration-300`} strokeWidth={1.5} />
                                      </div>
                                      <span className="text-[10px] font-medium text-center text-muted-foreground leading-tight line-clamp-2 w-full group-hover:text-foreground transition-colors">
                                          {item.label}
                                      </span>
                                    </Link>
                                </motion.div>
                            )
                        })}
                      </div>
                  </motion.div>
              );
          })}
        </motion.div>
      </ScrollArea>
    </div>
  );
}