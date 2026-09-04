/**
 * Directory: src/app/dashboard/sigap/(main)/tugas/page.tsx
 * Status: REFACTORED - DIRECT DIRECTIVE & MODERN KANBAN/LIST VIEW
 * Deskripsi: Halaman Manajemen Tugas (Pusat Komando).
 * Mendukung View Switcher (List vs Kanban), Tab Menunggu Review, Filter Chip, dan Mobile-First UX.
 */

"use client";

import React, { useState } from 'react';
import { useUserAuth } from '@/context/AuthContext'; 
import { useToast } from '@/context/ToastContext'; 
import { Tugas } from '@/types'; 
import FormTugas from './components/FormTugas';
import TaskDetailModal from './components/TaskDetailModal';
import TaskReportModal from './components/TaskReportModal';
import KanbanBoard from './components/KanbanBoard';
import { 
  Plus, Filter, HelpCircle, ClipboardCheck, LayoutList, 
  Kanban, CheckCircle2, Clock, AlertCircle, Sparkles 
} from 'lucide-react';
import TaskList from './components/TaskList';
import ConfirmModal from '@/app/dashboard/sigap/components/ConfirmModal'; 
import { SkeletonCard } from '@/app/dashboard/sigap/components/skeletons/SkeletonCard'; 
import SigapPageHeader from '@/app/dashboard/sigap/components/SigapPageHeader';
import SigapHelpModal from '@/app/dashboard/sigap/components/SigapHelpModal';

// Hooks SSOT
import { useTugasData, TaskStatusFilter, TaskAssignmentFilter, TaskTypeFilter } from '@/app/dashboard/sigap/hooks/useTugasData';
import { useTugasActions } from '@/app/dashboard/sigap/hooks/useTugasActions';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData';

// UI Components
import { Button } from "@/components/ui/button"; 
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs"; 

// Modal Bantuan Halaman
const BantuanHalamanModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  return (
    <SigapHelpModal isOpen={isOpen} onClose={onClose} title="Pusat Komando Tugas">
      <div className="space-y-3 text-sm">
        <h3 className="font-semibold text-base">Apa Kegunaan Menu Ini?</h3>
        <p>Pusat Komando Tugas adalah tempat Anda mengelola seluruh pekerjaan, baik instruksi cepat yang Anda berikan ke tim maupun tugas mandiri Anda.</p>
        <h4 className="font-semibold text-sm">Alur Penugasan & Review:</h4>
        <ul className="list-disc pl-5 space-y-1 text-xs">
          <li><strong>Instruksi Baru:</strong> Tugas dibuat oleh atasan atau staf secara mandiri.</li>
          <li><strong>Sedang Dikerjakan:</strong> Pelaksana memulai pengerjaan dan mengisi checklist.</li>
          <li><strong>Menunggu Review:</strong> Pelaksana mengirimkan laporan hasil kerja untuk diverifikasi atasan.</li>
          <li><strong>Selesai:</strong> Tugas telah disetujui atasan dan otomatis masuk ke logbook kinerja.</li>
        </ul>
      </div>
    </SigapHelpModal>
  );
};

export default function TugasSayaPage() {
  const { userProfile, loading: authLoading } = useUserAuth();
  const { addToast } = useToast();

  // 1. State Filter & View Mode
  const [activeStatusTab, setActiveStatusTab] = useState<TaskStatusFilter>('Semua');
  const [assignmentFilter, setAssignmentFilter] = useState<TaskAssignmentFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // 2. State UI Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isBantuanOpen, setIsBantuanOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tugas | null>(null);
  const [reportTask, setReportTask] = useState<Tugas | null>(null);

  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void; 
    isProcessing?: boolean; 
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, isProcessing: false });

  // 3. Hooks SSOT
  const { filteredTasks, allTasks, taskCounts, isLoading: isTasksLoading } = useTugasData({
    statusFilter: activeStatusTab,
    assignmentFilter,
    typeFilter
  });
  
  const { updateTaskStatus, deleteTask, isProcessing: isActionProcessing } = useTugasActions();
  const { userMap, isLoading: isCacheLoading } = useMasterData(true);

  // --- Handlers ---
  const handleStatusChange = async (tugasId: string, newStatus: Tugas['status']) => {
    const task = allTasks.find(t => t.id === tugasId);
    if (!task) return;

    if (newStatus === 'Selesai') {
      const isMandiri = task.dariJabatanId === task.kepadaJabatanId;
      if (!isMandiri) {
        setReportTask(task);
        return;
      }
      setConfirmModal({
        isOpen: true, 
        title: 'Selesaikan Tugas Mandiri', 
        message: `Apakah Anda yakin telah menyelesaikan tugas "${task.judulTugas}"?`, 
        onConfirm: async () => {
          await updateTaskStatus(task, 'Selesai');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        },
        isProcessing: isActionProcessing
      });
    } else {
      await updateTaskStatus(task, newStatus);
    }
  };

  const handleDeleteTask = (task: Tugas) => {
    setConfirmModal({
      isOpen: true, 
      title: "Hapus Tugas", 
      message: `Apakah Anda yakin ingin menghapus tugas "${task.judulTugas}"?`, 
      onConfirm: async () => {
        await deleteTask(task);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      isProcessing: isActionProcessing
    });
  };

  const isLoading = authLoading || isTasksLoading || isCacheLoading;

  const renderSkeleton = () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );

  return (
    <div className="sg-page">
      {/* Header */}
      <SigapPageHeader 
        title="Pusat Komando Tugas"
        icon={ClipboardCheck}
        actions={
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* View Mode Switcher (Desktop) */}
            <div className="hidden md:flex items-center bg-muted/60 p-1 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Tampilan List"
              >
                <LayoutList className="w-4 h-4" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'kanban' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Tampilan Kanban Board"
              >
                <Kanban className="w-4 h-4" />
                <span>Kanban</span>
              </button>
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsBantuanOpen(true)} 
              title="Bantuan" 
              className="text-muted-foreground hover:text-primary hidden md:inline-flex"
            >
              <HelpCircle size={20} />
            </Button>

            <Button 
              onClick={() => setIsFormModalOpen(true)} 
              className="flex-1 md:flex-none md:w-auto sg-btn sg-btn-primary shadow-md hover:shadow-lg transition-all"
            >
              <Plus size={16} className="mr-2" /> Buat Instruksi / Tugas
            </Button>
          </div>
        }
      />
      
      {/* Filter Horizontal Chips (Mobile & Desktop) */}
      <div className="px-4 md:px-0 mb-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
          
          {/* Assignment Filter Chips */}
          {['all', 'toMe', 'byMe'].map((val) => (
            <button
              key={`assign-${val}`}
              onClick={() => setAssignmentFilter(val as TaskAssignmentFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
                assignmentFilter === val 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }`}
            >
              {val === 'all' ? 'Semua Penugasan' : val === 'toMe' ? 'Ditugaskan ke Saya' : 'Diberikan oleh Saya'}
            </button>
          ))}

          <div className="w-px h-5 bg-border mx-1 shrink-0"></div>

          {/* Type Filter Chips */}
          {['all', 'internal', 'surat'].map((val) => (
            <button
              key={`type-${val}`}
              onClick={() => setTypeFilter(val as TaskTypeFilter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all shrink-0 ${
                typeFilter === val 
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-transparent shadow-sm' 
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              }`}
            >
              {val === 'all' ? 'Semua Tipe' : val === 'internal' ? 'Instruksi Mandiri/Tim' : 'Terkait Surat'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Tabs Status (List View) or Kanban Board */}
      {viewMode === 'list' ? (
        <Tabs value={activeStatusTab} onValueChange={(v) => setActiveStatusTab(v as TaskStatusFilter)} className="w-full">
          
          {/* Tab List Status Bar */}
          <div className="px-4 md:px-0 overflow-x-auto pb-1 scrollbar-none">
            <TabsList className="w-full md:w-auto inline-flex h-11 p-1 bg-muted/60 rounded-xl border border-border">
              <TabsTrigger value="Semua" className="text-xs font-semibold rounded-lg gap-1.5 px-3">
                Semua <span className="bg-muted px-1.5 py-0.2 rounded-full text-[10px]">{taskCounts['Semua']}</span>
              </TabsTrigger>
              <TabsTrigger value="Baru" className="text-xs font-semibold rounded-lg gap-1.5 px-3">
                Baru <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded-full text-[10px] font-bold">{taskCounts['Baru']}</span>
              </TabsTrigger>
              <TabsTrigger value="Dikerjakan" className="text-xs font-semibold rounded-lg gap-1.5 px-3">
                Proses <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full text-[10px] font-bold">{taskCounts['Dikerjakan']}</span>
              </TabsTrigger>
              <TabsTrigger value="Menunggu Review" className="text-xs font-semibold rounded-lg gap-1.5 px-3">
                Review <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded-full text-[10px] font-bold">{taskCounts['Menunggu Review']}</span>
              </TabsTrigger>
              <TabsTrigger value="Selesai" className="text-xs font-semibold rounded-lg gap-1.5 px-3">
                Selesai <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full text-[10px] font-bold">{taskCounts['Selesai']}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="mt-4">
            {isLoading ? renderSkeleton() : (
              <TaskList 
                tugasList={filteredTasks} 
                onOpenDetail={setSelectedTask} 
                onStatusChange={handleStatusChange} 
                onDeleteTask={handleDeleteTask}
                userCache={userMap} 
              />
            )}
          </div>
        </Tabs>
      ) : (
        <div className="px-4 md:px-0 mt-4">
          {isLoading ? renderSkeleton() : (
            <KanbanBoard
              tasks={filteredTasks}
              onOpenDetail={setSelectedTask}
              onStatusChange={handleStatusChange}
              userCache={userMap}
            />
          )}
        </div>
      )}
      
      {/* Modals */}
      <FormTugas 
        isOpen={isFormModalOpen} 
        onClose={() => setIsFormModalOpen(false)} 
        onSuccess={(newId) => { 
          addToast("Tugas / Instruksi berhasil diterbitkan!", "success");
        }} 
        userCache={userMap} 
      />
      
      <TaskDetailModal 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        tugas={selectedTask} 
        userCache={userMap} 
      />

      <TaskReportModal
        isOpen={!!reportTask}
        onClose={() => setReportTask(null)}
        tugas={reportTask}
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen} 
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false, isProcessing: false })} 
        onConfirm={confirmModal.onConfirm} 
        title={confirmModal.title} 
        message={confirmModal.message}
        isProcessing={confirmModal.isProcessing || isActionProcessing}
      />

      <BantuanHalamanModal isOpen={isBantuanOpen} onClose={() => setIsBantuanOpen(false)} />
    </div>
  );
}