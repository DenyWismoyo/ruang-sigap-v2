"use client";

import React from 'react';
import { Bot, Link, Search } from 'lucide-react';

export function MockFABs() {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-3 z-50 pointer-events-none">
      
      {/* Portal Pintar FAB */}
      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden group">
        <Link className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors" />
      </div>

      {/* Sigap Copilot FAB */}
      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center relative overflow-hidden group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
        <Bot className="w-5 h-5 text-white relative z-10" />
      </div>
      
    </div>
  );
}
