"use client";

import React from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import SmartLink from '@/components/ui/smart-link';
import { sections, userHasAccess } from './Sidebar'; // Import dari Sidebar
import { UserProfile, Jabatan, OpdConfig, WelcomeSummary } from '@/types';

interface MegaMenuPanelProps {
  sectionId: string;
  onClose: () => void;
  navItems: any[];
  userProfile: UserProfile;
  jabatanProfile: Jabatan | null;
  opdConfig: OpdConfig | null;
  welcomeSummary: WelcomeSummary;
  pathname: string;
  resetNotificationCount: (key: 'surat' | 'tugas') => void;
}

export default function MegaMenuPanel({ 
  sectionId, onClose, navItems, userProfile, jabatanProfile, opdConfig, welcomeSummary, pathname, resetNotificationCount
}: MegaMenuPanelProps) {
  
  const section = sections.find(s => s.id === sectionId);
  if (!section) return null;
  
  const itemsInSection = navItems.filter(item => 
    item.section === section.id && 
    userHasAccess(item, userProfile, jabatanProfile, opdConfig)
  );
  
  const containerVariants = {
      hidden: { opacity: 0 },
      show: {
          opacity: 1,
          transition: { staggerChildren: 0.04 }
      }
  };

  const itemVariants = {
      hidden: { opacity: 0, x: -10 },
      show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="w-64 bg-popover shadow-2xl border-r border-border flex flex-col h-screen z-50">
      <div className="p-4 h-16 flex items-center justify-between border-b border-border bg-muted/30">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <motion.div initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                <section.icon className="w-5 h-5 text-primary"/>
            </motion.div>
            {section.title}
        </h3>
        <button onClick={onClose} className="p-1.5 text-muted-foreground rounded-md hover:bg-accent hover:text-foreground transition-colors">
            <X size={18} />
        </button>
      </div>
      <motion.nav 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar"
      >
        {itemsInSection.map(item => {
            const notifCount = item.notificationKey ? (welcomeSummary as any)[item.notificationKey] || 0 : 0;
            const isActive = pathname === item.href;
            return (
                <motion.div key={item.href} variants={itemVariants} whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
                    <SmartLink 
                        href={item.href} 
                        onClick={() => { 
                            if (item.notificationKey === 'suratBaruCount') resetNotificationCount('surat'); 
                            else if (item.notificationKey === 'tugasBaruCount') resetNotificationCount('tugas'); 
                            onClose(); 
                        }} 
                        className={`relative flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-sm font-medium group ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        {isActive && (
                            <motion.span layoutId="mega-menu-active-bg" className="absolute inset-0 bg-primary/10 rounded-lg -z-10" />
                        )}
                        <div className="flex items-center">
                            <item.icon className={`w-4 h-4 mr-3 transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
                            <span className="relative z-10">{item.label}</span>
                        </div>
                        {notifCount > 0 && (
                            <span className="relative z-10 flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm">
                                {notifCount > 9 ? '9+' : notifCount}
                            </span>
                        )}
                    </SmartLink>
                </motion.div>
            );
        })}
      </motion.nav>
    </div>
  );
}