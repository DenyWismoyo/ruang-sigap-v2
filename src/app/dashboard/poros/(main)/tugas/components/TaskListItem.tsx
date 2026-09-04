/**
 * Directory: src/app/dashboard/poros/(main)/tugas/components/TaskListItem.tsx
 * Status: REFACTORED - MODERN UX, REVIEW STATUSES & BORDERLESS MOBILE (POROS)
 * Deskripsi: Komponen Kartu Item Tugas Modern dengan Progress Checklist, Countdown Deadline, dan Status Review di tenant POROS.
 */

"use client";

import React, { useMemo, useState } from 'react';
import { Tugas, UserProfile } from '@/types';
import { useUserAuth } from '@/context/AuthContext';
import { 
  Mail, UserCheck, ChevronDown, ChevronUp, Clock, AlertCircle, 
  MessageSquare, Users, Repeat, Trash2, CheckCircle2, Play, 
  Volume2
} from 'lucide-react';
import Link from 'next/link';
import TaskReportModal from './TaskReportModal';

// Impor komponen Shadcn
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskListItemProps {
  tugas: Tugas;
  isExpanded: boolean;
  onToggleExpand: (tugasId: string) => void;
  onOpenDetail: (tugas: Tugas) => void;
  onStatusChange: (tugasId: string, newStatus: Tugas['status']) => void;
  onDeleteTask: (tugas: Tugas) => void;
  userCache: Map<string, UserProfile>;
}

const getDeadlineInfo = (deadline: Date) => {
  const now = new Date(); now.setHours(0, 0, 0, 0); 
  const deadlineDate = new Date(deadline); deadlineDate.setHours(0, 0, 0, 0);
  const diffTime = deadlineDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: `Terlewat ${Math.abs(diffDays)} hari`, color: 'text-red-600 dark:text-red-400 font-bold', icon: <AlertCircle size={13} /> };
  if (diffDays === 0) return { text: 'Hari Ini', color: 'text-amber-600 dark:text-amber-400 font-bold', icon: <Clock size={13} /> };
  if (diffDays === 1) return { text: 'Besok', color: 'text-teal-600 dark:text-teal-400 font-semibold', icon: <Clock size={13} /> };
  return { text: `Sisa ${diffDays} hari`, color: 'text-muted-foreground', icon: <Clock size={13} /> };
};

export default function TaskListItem({ 
  tugas, isExpanded, onToggleExpand, onOpenDetail, onStatusChange, onDeleteTask, userCache 
}: TaskListItemProps) {
  const { actingJabatanProfile, jabatanProfile } = useUserAuth();
  const effectiveJabatan = actingJabatanProfile || jabatanProfile;

  const [isReportOpen, setIsReportOpen] = useState(false);

  const penanggungJawab = useMemo(() => userCache.get(tugas.kepadaJabatanId), [tugas.kepadaJabatanId, userCache]);
  const deadlineInfo = tugas.batasWaktu ? getDeadlineInfo(tugas.batasWaktu.toDate()) : null;
  
  const isAssigner = effectiveJabatan?.id === tugas.dariJabatanId;
  const isAssignee = effectiveJabatan?.id === tugas.kepadaJabatanId;
  const isCollaborator = tugas.collaboratorIds?.includes(effectiveJabatan?.id || '');
  const isMandiri = tugas.dariJabatanId === tugas.kepadaJabatanId;

  const canMarkDone = isAssignee && tugas.status !== 'Selesai';
  const canReopen = (isAssignee || isCollaborator || isAssigner) && tugas.status === 'Selesai';

  const progress = useMemo(() => {
    if (!tugas.subTugas || tugas.subTugas.length === 0) return 0;
    const completed = tugas.subTugas.filter(st => st.selesai).length;
    return Math.round((completed / tugas.subTugas.length) * 100);
  }, [tugas.subTugas]);

  const canDelete = isAssigner || (isAssignee && (tugas.status === 'Baru' || tugas.status === 'Selesai'));

  const handleCheckboxClick = () => {
    if (tugas.status === 'Selesai') {
      onStatusChange(tugas.id!, 'Dikerjakan');
    } else {
      if (isMandiri) {
        onStatusChange(tugas.id!, 'Selesai');
      } else {
        setIsReportOpen(true);
      }
    }
  };

  const getStatusBadge = (status: Tugas['status']) => {
    switch (status) {
      case 'Baru':
        return <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 text-[10px] px-2 py-0.5">Baru</Badge>;
      case 'Dikerjakan':
        return <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 text-[10px] px-2 py-0.5">Dikerjakan</Badge>;
      case 'Menunggu Review':
        return <Badge className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 text-[10px] px-2 py-0.5 animate-pulse">Menunggu Review</Badge>;
      case 'Revisi':
        return <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 text-[10px] px-2 py-0.5">Perlu Revisi</Badge>;
      case 'Selesai':
        return <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 text-[10px] px-2 py-0.5">Selesai</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{status}</Badge>;
    }
  };

  return (
    <>
      <Card className={`nk-card border-[var(--nk-teal-light)]/20 transition-all duration-200 hover:shadow-sm ${
        tugas.status === 'Selesai' ? 'bg-muted/40 opacity-80' : ''
      }`}>
        <CardHeader className="flex flex-row items-start p-3 md:p-4 gap-3">
          
          <div className="pt-0.5 shrink-0">
            <Checkbox
              id={`check-${tugas.id}`}
              checked={tugas.status === 'Selesai'}
              onCheckedChange={handleCheckboxClick}
              disabled={!canMarkDone && !canReopen}
              className="rounded-md h-5 w-5 border-muted-foreground/40 data-[state=checked]:bg-[var(--nk-teal-mid)] data-[state=checked]:border-[var(--nk-teal-mid)]"
            />
          </div>

          <div 
            className="flex-1 min-w-0 cursor-pointer select-none space-y-1.5"
            onClick={() => onToggleExpand(tugas.id!)}
          >
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(tugas.status)}
              {tugas.prioritas === 'Tinggi' && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Mendesak</Badge>
              )}
              {tugas.audioUrl && (
                <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 text-rose-600 border-rose-200 bg-rose-50/50 dark:bg-rose-950/30">
                  <Volume2 className="w-3 h-3" />
                  <span>Audio</span>
                </Badge>
              )}
              {tugas.suratId && (
                <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 text-teal-600 border-teal-200 bg-teal-50/50 dark:bg-teal-950/30">
                  <Mail className="w-3 h-3" />
                  <span>Surat</span>
                </Badge>
              )}
            </div>

            <CardTitle className={`text-sm md:text-base font-semibold leading-snug line-clamp-2 ${
              tugas.status === 'Selesai' ? 'text-muted-foreground line-through' : 'text-foreground'
            }`}>
              {tugas.judulTugas}
            </CardTitle>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-medium">
                <UserCheck className="w-3.5 h-3.5" />
                <span>PJ: {penanggungJawab?.namaLengkap || tugas.kepadaJabatanNama || '...'}</span>
              </span>
              
              {tugas.collaboratorIds && tugas.collaboratorIds.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>+{tugas.collaboratorIds.length}</span>
                </span>
              )}

              {tugas.status !== 'Selesai' && deadlineInfo && (
                <span className={`flex items-center gap-1 font-medium ${deadlineInfo.color}`}>
                  {deadlineInfo.icon}
                  <span>{deadlineInfo.text}</span>
                </span>
              )}
            </div>

            {tugas.subTugas && tugas.subTugas.length > 0 && (
              <div className="flex items-center gap-2 pt-1 max-w-xs">
                <Progress value={progress} className="h-1.5 flex-1 bg-muted/60" />
                <span className="text-[10px] font-medium text-muted-foreground">{progress}%</span>
              </div>
            )}
          </div>

          <div className="shrink-0 pt-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => onToggleExpand(tugas.id!)}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>

        </CardHeader>

        {isExpanded && (
          <CardContent className="p-3 md:p-4 pt-0 border-t border-border/60 mt-1 space-y-3 bg-muted/10">
            
            <div className="pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Petunjuk / Deskripsi
              </h4>
              <p className="text-xs md:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {tugas.deskripsi}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60">
              
              <div className="flex flex-wrap items-center gap-1.5">
                {tugas.status === 'Baru' && isAssignee && (
                  <Button
                    size="sm"
                    onClick={() => onStatusChange(tugas.id!, 'Dikerjakan')}
                    className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Mulai Kerjakan</span>
                  </Button>
                )}

                {(tugas.status === 'Dikerjakan' || tugas.status === 'Revisi') && isAssignee && (
                  <Button
                    size="sm"
                    onClick={() => setIsReportOpen(true)}
                    className="text-xs h-8 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isMandiri ? 'Selesaikan Tugas' : 'Kirim Laporan Hasil'}</span>
                  </Button>
                )}

                {tugas.status === 'Selesai' && (isAssigner || isAssignee) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(tugas.id!, 'Dikerjakan')}
                    className="text-xs h-8 gap-1.5"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Buka Kembali</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenDetail(tugas)}
                  className="text-xs h-8 gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Detail & Diskusi</span>
                </Button>

                {tugas.suratId && (
                  <Button asChild variant="ghost" size="sm" className="text-xs h-8 gap-1 text-teal-600">
                    <Link href={`/dashboard/poros/surat/${tugas.suratId}`}>
                      <Mail className="w-3.5 h-3.5" />
                      <span>Lihat Surat</span>
                    </Link>
                  </Button>
                )}
              </div>

              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteTask(tugas)}
                  className="text-xs h-8 gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hapus</span>
                </Button>
              )}

            </div>

          </CardContent>
        )}
      </Card>

      <TaskReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        tugas={tugas}
      />
    </>
  );
}
