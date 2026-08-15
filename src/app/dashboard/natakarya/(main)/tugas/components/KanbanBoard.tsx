"use client";

import React from 'react';
import { Tugas, UserProfile } from '@/types';
import TaskListItem from './TaskListItem';
import { ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KanbanBoardProps {
  tugasList: Tugas[];
  onOpenDetail: (tugas: Tugas) => void;
  onStatusChange: (tugasId: string, newStatus: Tugas['status']) => void;
  onDeleteTask: (tugas: Tugas) => void;
  userCache: Map<string, UserProfile>;
}

export default function KanbanBoard({
  tugasList,
  onOpenDetail,
  onStatusChange,
  onDeleteTask,
  userCache
}: KanbanBoardProps) {
  const columns: { id: Tugas['status']; title: string; color: string }[] = [
    { id: 'Baru', title: 'Baru', color: 'bg-blue-500/10 border-blue-200 text-blue-700' },
    { id: 'Dikerjakan', title: 'Sedang Dikerjakan', color: 'bg-orange-500/10 border-orange-200 text-orange-700' },
    { id: 'Selesai', title: 'Selesai', color: 'bg-green-500/10 border-green-200 text-green-700' },
  ];

  if (tugasList.length === 0) {
    return (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-dashed border-border">
            <ClipboardList size={48} className="mx-auto text-muted-foreground/30"/>
            <p className="mt-4 font-semibold">Tidak ada tugas untuk ditampilkan.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start w-full overflow-x-auto pb-4">
      {columns.map(col => {
        const tasks = tugasList.filter(t => t.status === col.id);
        
        return (
          <div key={col.id} className="flex-1 min-w-[300px] w-full bg-card rounded-xl border border-border shadow-sm flex flex-col">
            <div className={`p-3 border-b font-semibold flex justify-between items-center ${col.color}`}>
              <span>{col.title}</span>
              <span className="bg-background px-2 py-1 rounded-md text-xs border">{tasks.length}</span>
            </div>
            
            <div className="p-3 flex-1 flex flex-col gap-3 min-h-[200px] bg-secondary/10">
              <AnimatePresence>
                {tasks.map(tugas => (
                  <motion.div
                    key={tugas.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="bg-card border border-border rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {tugas.prioritas}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {tugas.batasWaktu ? new Date(tugas.batasWaktu.toMillis()).toLocaleDateString('id-ID') : 'Tanpa batas'}
                        </div>
                      </div>
                      <h4 
                        className="font-medium text-sm mb-2 cursor-pointer hover:text-primary transition-colors line-clamp-2"
                        onClick={() => onOpenDetail(tugas)}
                      >
                        {tugas.judulTugas}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                        {tugas.deskripsi}
                      </p>
                      
                      <div className="flex justify-between items-center mt-auto border-t pt-2">
                        <div className="text-xs font-medium truncate w-[100px]">
                          {userCache.get(tugas.kepadaJabatanId)?.namaLengkap || '...'}
                        </div>
                        
                        {/* Status Actions */}
                        <div className="flex gap-1">
                          {col.id === 'Baru' && (
                            <button onClick={() => onStatusChange(tugas.id!, 'Dikerjakan')} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200 transition">
                              Mulai
                            </button>
                          )}
                          {col.id === 'Dikerjakan' && (
                            <button onClick={() => onStatusChange(tugas.id!, 'Selesai')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition">
                              Selesai
                            </button>
                          )}
                          {col.id === 'Selesai' && (
                            <button onClick={() => onStatusChange(tugas.id!, 'Dikerjakan')} className="text-xs bg-secondary text-muted-foreground px-2 py-1 rounded hover:bg-secondary/80 transition">
                              Batal
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {tasks.length === 0 && (
                  <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic border-2 border-dashed border-border/50 rounded-lg p-6">
                    Kosong
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
