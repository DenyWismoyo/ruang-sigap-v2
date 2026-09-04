/**
 * Directory: src/app/dashboard/sigap/(main)/tugas/components/KanbanBoard.tsx
 * Status: NEW COMPONENT - KANBAN BOARD FOR SIGAP
 * Deskripsi: Visual Kanban Board (Baru, Dikerjakan, Menunggu Review, Selesai) dengan drag/click status dan interaksi cepat.
 */

"use client";

import React from 'react';
import { Tugas, UserProfile } from '@/types';
import { 
  Clock, AlertCircle, UserCheck, MessageSquare, Volume2, Mail, 
  CheckCircle2, Play, RotateCcw, Plus 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface KanbanBoardProps {
  tasks: Tugas[];
  onOpenDetail: (tugas: Tugas) => void;
  onStatusChange: (tugasId: string, newStatus: Tugas['status']) => void;
  userCache: Map<string, UserProfile>;
}

const getDeadlineText = (deadline: Date) => {
  const now = new Date(); now.setHours(0, 0, 0, 0); 
  const deadlineDate = new Date(deadline); deadlineDate.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: `Terlewat ${Math.abs(diffDays)}h`, color: 'text-red-600 dark:text-red-400' };
  if (diffDays === 0) return { text: 'Hari Ini', color: 'text-amber-600 dark:text-amber-400 font-bold' };
  return { text: `Sisa ${diffDays}h`, color: 'text-muted-foreground' };
};

export default function KanbanBoard({ tasks, onOpenDetail, onStatusChange, userCache }: KanbanBoardProps) {
  const columns: { id: string; title: string; filterStatuses: Tugas['status'][]; color: string }[] = [
    { id: 'todo', title: 'Perlu Dikerjakan', filterStatuses: ['Baru', 'Revisi'], color: 'border-blue-500 text-blue-700 dark:text-blue-400' },
    { id: 'inprogress', title: 'Sedang Proses', filterStatuses: ['Dikerjakan'], color: 'border-amber-500 text-amber-700 dark:text-amber-400' },
    { id: 'review', title: 'Menunggu Review', filterStatuses: ['Menunggu Review'], color: 'border-purple-500 text-purple-700 dark:text-purple-400' },
    { id: 'done', title: 'Selesai', filterStatuses: ['Selesai'], color: 'border-emerald-500 text-emerald-700 dark:text-emerald-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 overflow-x-auto">
      {columns.map(col => {
        const colTasks = tasks.filter(t => col.filterStatuses.includes(t.status));
        return (
          <div key={col.id} className="flex flex-col bg-muted/30 rounded-2xl p-3 border border-border min-w-[260px]">
            
            {/* Header Kolom */}
            <div className={`flex items-center justify-between pb-2 mb-3 border-b-2 ${col.color}`}>
              <span className="font-bold text-xs uppercase tracking-wider">{col.title}</span>
              <Badge variant="secondary" className="text-xs px-2 py-0.5 font-bold">
                {colTasks.length}
              </Badge>
            </div>

            {/* List Kartu Tugas */}
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[70vh] pr-1">
              {colTasks.length > 0 ? (
                colTasks.map(task => {
                  const penanggungJawab = userCache.get(task.kepadaJabatanId);
                  const dl = task.batasWaktu ? getDeadlineText(task.batasWaktu.toDate()) : null;
                  const totalSub = task.subTugas?.length || 0;
                  const completedSub = task.subTugas?.filter(s => s.selesai).length || 0;
                  const progress = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : 0;

                  return (
                    <div
                      key={task.id}
                      onClick={() => onOpenDetail(task)}
                      className="p-3 bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <Badge
                          variant={task.prioritas === 'Tinggi' ? 'destructive' : 'outline'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {task.prioritas}
                        </Badge>
                        {task.audioUrl && (
                          <Volume2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        {task.status === 'Revisi' && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0">Revisi</Badge>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-foreground leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {task.judulTugas}
                      </h4>

                      {/* Subtask Progress */}
                      {totalSub > 0 && (
                        <div className="space-y-1">
                          <Progress value={progress} className="h-1 bg-muted/60" />
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>Checklist</span>
                            <span>{completedSub}/{totalSub}</span>
                          </div>
                        </div>
                      )}

                      {/* Footer Kartu */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
                        <span className="truncate max-w-[120px] font-medium text-foreground">
                          {penanggungJawab?.namaLengkap?.split(' ')[0] || task.kepadaJabatanNama || '...'}
                        </span>
                        {dl && (
                          <span className={`flex items-center gap-1 ${dl.color}`}>
                            <Clock className="w-3 h-3" />
                            <span>{dl.text}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                  Tidak ada tugas
                </div>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}
