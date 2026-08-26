import React from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';
import { RepositoryItem } from '@/types';

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: RepositoryItem | null;
}

export default function DocumentPreviewModal({ isOpen, onClose, item }: DocumentPreviewModalProps) {
    if (!item) return null;

    const isImage = item.nama.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isPDF = item.nama.match(/\.(pdf)$/i);
    const canPreview = isImage || isPDF;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0 overflow-hidden bg-background">
                <DialogHeader className="p-4 border-b bg-card shrink-0 flex flex-row items-center justify-between">
                    <DialogTitle className="flex items-center gap-2 truncate">
                        {isImage ? <ImageIcon className="text-blue-500 w-5 h-5" /> : <FileText className="text-red-500 w-5 h-5" />}
                        <span className="truncate">{item.nama}</span>
                    </DialogTitle>
                    <div className="flex gap-2">
                        {item.url && (
                            <>
                                <a href={item.url} target="_blank" rel="noreferrer">
                                    <Button variant="outline" size="sm">
                                        <ExternalLink className="w-4 h-4 mr-2" /> Buka Tab
                                    </Button>
                                </a>
                                <a href={item.url} download>
                                    <Button className="sg-btn-primary" size="sm">
                                        <Download className="w-4 h-4 mr-2" /> Unduh
                                    </Button>
                                </a>
                            </>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
                    {canPreview && item.url ? (
                        isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.url} alt={item.nama} className="max-w-full max-h-full object-contain rounded shadow-sm" />
                        ) : (
                            <iframe src={`${item.url}#view=FitH`} className="w-full h-full rounded shadow-sm border-0" title={item.nama} />
                        )
                    ) : (
                        <div className="text-center text-muted-foreground flex flex-col items-center">
                            <FileText className="w-16 h-16 mb-4 opacity-20" />
                            <p>Pratinjau tidak tersedia untuk jenis file ini.</p>
                            <p className="text-sm mt-1">Silakan unduh file untuk melihatnya.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
