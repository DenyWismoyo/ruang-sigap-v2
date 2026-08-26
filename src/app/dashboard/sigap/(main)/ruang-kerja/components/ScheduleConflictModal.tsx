import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CombinedAgendaItem } from '@/app/dashboard/sigap/(main)/ruang-kerja/page';
import { Surat } from '@/types';

interface ScheduleConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  suratToProcess: Surat | null;
  conflicts: CombinedAgendaItem[];
  onRedisposisi: () => void;
  onForceExecute: () => void;
}

export default function ScheduleConflictModal({
  isOpen,
  onClose,
  suratToProcess,
  conflicts,
  onRedisposisi,
  onForceExecute
}: ScheduleConflictModalProps) {
  if (!isOpen || !suratToProcess) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="bg-amber-50 dark:bg-amber-950/30 p-6 flex flex-col items-center justify-center border-b border-amber-200/50 dark:border-amber-900/50 relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X size={20} className="text-amber-700 dark:text-amber-400" />
            </button>
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-amber-800 dark:text-amber-300 text-center">
              Konflik Jadwal Terdeteksi!
            </h2>
            <p className="text-sm text-amber-700/80 dark:text-amber-400/80 text-center mt-2 max-w-sm">
              Anda memiliki agenda lain yang waktunya bersamaan atau berdekatan (± 1 jam) dengan surat undangan ini.
            </p>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-foreground mb-3">Agenda yang Bertabrakan:</h3>
            <div className="space-y-3">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="p-4 rounded-xl border border-border/50 bg-muted/30">
                  <p className="font-medium text-sm text-foreground line-clamp-2 mb-2">
                    {conflict.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock size={14} className="text-primary" />
                      <span>{conflict.time}</span>
                    </div>
                    {conflict.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-primary" />
                        <span className="line-clamp-1">{conflict.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <h4 className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                Surat yang Sedang Diproses:
              </h4>
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {suratToProcess.perihal}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Clock size={14} className="text-primary" />
                <span>
                  {suratToProcess.detailAgenda?.tanggal.toDate().toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })} • {suratToProcess.detailAgenda?.jam}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 pt-4 bg-muted/30 border-t border-border flex flex-col sm:flex-row items-center gap-3">
            <Button 
              variant="default" 
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onRedisposisi}
            >
              Disposisikan Ulang
            </Button>
            <Button 
              variant="outline" 
              className="w-full sm:flex-1 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-950/30"
              onClick={onForceExecute}
            >
              Tetap Lanjut Sendiri
            </Button>
            <Button 
              variant="ghost" 
              className="w-full sm:w-auto"
              onClick={onClose}
            >
              Batal
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
