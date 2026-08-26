import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RepositoryBreadcrumbsProps {
    path: { id: string | null; nama: string }[];
    onNavigate: (index: number) => void;
}

export default function RepositoryBreadcrumbs({ path, onNavigate }: RepositoryBreadcrumbsProps) {
    return (
        <div className="flex items-center space-x-1 overflow-x-auto pb-2 scrollbar-hide text-sm">
            <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 flex-shrink-0 ${path.length === 0 ? 'text-primary font-bold' : 'text-muted-foreground'}`}
                onClick={() => onNavigate(-1)}
            >
                <Home size={16} className="mr-1" />
                Root
            </Button>
            
            {path.map((segment, idx) => (
                <React.Fragment key={segment.id || `root-${idx}`}>
                    <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
                    <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 px-2 flex-shrink-0 ${idx === path.length - 1 ? 'text-primary font-bold' : 'text-muted-foreground'}`}
                        onClick={() => onNavigate(idx)}
                    >
                        {segment.nama}
                    </Button>
                </React.Fragment>
            ))}
        </div>
    );
}
