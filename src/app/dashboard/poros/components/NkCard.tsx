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
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-4 md:mb-6">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {Icon && (
          <div className="p-2.5 sm:p-3 bg-[var(--nk-surface-3)] rounded-xl border border-[var(--border)] shadow-sm nk-glass-panel shrink-0">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--nk-teal-mid)]" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-3xl font-bold tracking-tight text-foreground nk-section-title truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1 pl-4 line-clamp-1 md:line-clamp-none">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end md:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
