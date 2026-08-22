import React, { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SigapHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function SigapHelpModal({ isOpen, onClose, title, children }: SigapHelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <HelpCircle className="mr-3 text-primary" />
            Bantuan: {title}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] -mx-6 px-6">
          <div className="space-y-4 text-foreground/90">
            {children}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Saya Mengerti</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
