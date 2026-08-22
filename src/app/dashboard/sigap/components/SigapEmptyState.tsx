import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface SigapEmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export default function SigapEmptyState({ title, description, icon: Icon, action }: SigapEmptyStateProps) {
  return (
    <div className="sg-empty-state">
      {Icon && <Icon size={48} className="mx-auto text-muted-foreground/50 mb-4" />}
      <p className="font-semibold">{title}</p>
      <p className="text-sm mt-1 mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
