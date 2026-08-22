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
        <h1 className="text-3xl font-bold flex items-center">
          {Icon && <Icon size={28} className="mr-3 text-primary" />}
          <span className="sg-text-gradient">{title}</span>
        </h1>
        {description && <p className="sg-page-subtitle">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
      {actions && <div className="sg-page-actions">{actions}</div>}
    </div>
  );
}
