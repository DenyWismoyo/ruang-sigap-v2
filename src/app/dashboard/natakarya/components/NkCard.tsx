import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NkCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  withHover?: boolean;
}

export function NkCard({ children, className, withHover = false, ...props }: NkCardProps) {
  return (
    <motion.div
      className={cn(
        'nk-card',
        withHover && 'hover:-translate-y-1 hover:shadow-md transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function NkPageHeader({ title, subtitle, icon: Icon, actions }: { title: string, subtitle?: string, icon?: any, actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-3 bg-[var(--nk-surface-3)] rounded-xl border border-[var(--border)] shadow-sm nk-glass-panel">
            <Icon className="w-6 h-6 text-[var(--nk-teal-mid)]" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground nk-section-title relative pl-4">
            {title}
            <span className="absolute left-0 top-[10%] bottom-[10%] w-[3px] bg-[var(--nk-gold)] rounded-full"></span>
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 pl-4">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
