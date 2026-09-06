import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface NkEmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export default function NkEmptyState({ title, description, icon: Icon, action }: NkEmptyStateProps) {
  return (
    <div className="nk-empty-state p-8 md:p-12">
      {Icon && <Icon size={48} className="mx-auto text-[var(--nk-teal-light)]/60 mb-4" />}
      <p className="font-bold text-foreground text-base md:text-lg">{title}</p>
      <p className="text-xs md:text-sm text-muted-foreground mt-1 mb-5 max-w-md text-center">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
