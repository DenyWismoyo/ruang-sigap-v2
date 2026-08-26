import React from 'react';
import { Progress } from "@/components/ui/progress";
import { HardDrive } from 'lucide-react';

interface StorageIndicatorProps {
    usedBytes: number;
    maxBytes: number;
}

export default function StorageIndicator({ usedBytes, maxBytes }: StorageIndicatorProps) {
    const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(0);
    const percent = Math.min((usedBytes / maxBytes) * 100, 100);

    let colorClass = "bg-primary";
    if (percent > 85) colorClass = "bg-red-500";
    else if (percent > 60) colorClass = "bg-yellow-500";

    return (
        <div className="flex flex-col space-y-2 p-4 border rounded-[var(--radius)] bg-card shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                    <HardDrive className="w-4 h-4" />
                    <span>Penyimpanan Pribadi</span>
                </div>
                <span className="text-sm font-semibold">{usedMB} MB / {maxMB} MB</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-500 ease-out ${colorClass}`} style={{ width: `${percent}%` }}></div>
            </div>
            {percent > 90 && <p className="text-xs text-red-500 font-medium">Penyimpanan Anda hampir penuh.</p>}
        </div>
    );
}
