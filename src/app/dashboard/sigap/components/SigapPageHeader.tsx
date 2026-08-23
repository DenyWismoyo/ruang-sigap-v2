import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface SigapPageHeaderProps {
  title: string;
  icon?: LucideIcon;
  description?: string;
  actions?: ReactNode;
  children?: ReactNode;
}

export default function SigapPageHeader({ title, icon: Icon, description, actions, children }: SigapPageHeaderProps) {
  return (
    <div className="sg-page-header">
      <div className="flex-1">
        <h1 className="text-xl md:text-3xl font-bold flex items-center leading-tight">
          {Icon && <Icon className="w-6 h-6 md:w-7 md:h-7 mr-2 md:mr-3 text-primary flex-shrink-0" />}
          <span className="sg-text-gradient">{title}</span>
        </h1>
        {description && <p className="text-xs md:text-sm text-muted-foreground mt-0.5 md:mt-1">{description}</p>}
        {children && <div className="mt-3 md:mt-4">{children}</div>}
      </div>
      {actions && <div className="sg-page-actions">{actions}</div>}
    </div>
  );
}
