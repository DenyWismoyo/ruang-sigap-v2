/**
 * Directory: src/app/dashboard/tugas/page.tsx
 * Status: FINAL SSOT
 * Deskripsi: Halaman Manajemen Tugas (Pusat Komando).
 * Menggunakan Hooks: useTugasData (Read), useTugasActions (Write), useMasterData (Cache).
 */

"use client";

import React, { useState, useMemo } from 'react';
import { useUserAuth } from '@/context/AuthContext'; 
import { useToast } from '@/context/ToastContext'; 
import { Tugas } from '@/types'; 
import FormTugas from './components/FormTugas';
import TaskDetailModal from './components/TaskDetailModal';
import { Plus, Filter, HelpCircle, ClipboardCheck, BookOpen, ListChecks } from 'lucide-react';
import TaskList from './components/TaskList';
import ConfirmModal from '@/app/dashboard/sigap/components/ConfirmModal'; 
import { SkeletonCard } from '@/app/dashboard/sigap/components/skeletons/SkeletonCard'; 
import SigapPageHeader from '@/app/dashboard/sigap/components/SigapPageHeader';
import SigapHelpModal from '@/app/dashboard/sigap/components/SigapHelpModal';
import Link from 'next/link';

// Hooks SSOT
import { useTugasData, TaskStatusFilter, TaskAssignmentFilter, TaskTypeFilter } from '@/app/dashboard/sigap/hooks/useTugasData';
import { useTugasActions } from '@/app/dashboard/sigap/hooks/useTugasActions';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData';

// UI Components
import { Button } from "@/components/ui/button"; 
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"; 
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs"; 
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"; 
import { Label } from '@/components/ui/label';
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Komponen Modal Bantuan ---
const BantuanHalamanModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    return (
        <SigapHelpModal isOpen={isOpen} onClose={onClose} title="Pusat Komando Tugas">
            <h3 className="font-semibold text-lg">Apa Kegunaan Menu Ini?</h3>
            <p>Pusat Komando Tugas adalah tempat Anda mengelola seluruh pekerjaan, baik yang Anda terima dari atasan maupun yang Anda delegasikan ke tim.</p>
            {/* ... Konten bantuan lainnya ... */}
        </SigapHelpModal>
    );
};

// Removed ShortcutNav

export default function TugasSayaPage() {
  const { userProfile, loading: authLoading } = useUserAuth();
  const { addToast } = useToast();

  // 1. State Filter
  const [activeStatusTab, setActiveStatusTab] = useState<TaskStatusFilter>('Baru');
  const [assignmentFilter, setAssignmentFilter] = useState<TaskAssignmentFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>('all');

  // 2. State UI Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isBantuanOpen, setIsBantuanOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Tugas | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isProcessing?: boolean; }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, isProcessing: false });

  // 3. Hooks SSOT
  // Fetch Data Tugas
  const { filteredTasks, taskCounts, isLoading: isTasksLoading } = useTugasData({
      statusFilter: activeStatusTab,
      assignmentFilter,
      typeFilter
  });
  
  // Actions (Update/Delete)
  const { updateTaskStatus, deleteTask, isProcessing: isActionProcessing } = useTugasActions();

  // Data Master (User Cache)
  const { userMap, isLoading: isCacheLoading } = useMasterData(true);

  // --- Handlers ---

  const handleStatusChange = async (tugasId: string, newStatus: Tugas['status']) => {
    const task = filteredTasks.find(t => t.id === tugasId);
    if (!task) return;

    const executeChange = async () => {
        const success = await updateTaskStatus(task, newStatus);
        if (success) setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    if (newStatus === 'Selesai') {
        setConfirmModal({
            isOpen: true, 
            title: 'Konfirmasi Selesai', 
            message: 'Apakah Anda yakin ingin menyelesaikan tugas ini?', 
            onConfirm: executeChange,
            isProcessing: isActionProcessing
        });
    } else {
        executeChange();
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
  }

  const isLoading = authLoading || isTasksLoading || isCacheLoading;

  // Skeleton UI
  const renderSkeleton = () => (
      <div className="space-y-3">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
  );

  return (
    <div className="sg-page">
      {/* Header */}
      <SigapPageHeader 
          title="Tugas"
          icon={ClipboardCheck}
          actions={
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <Button variant="ghost" size="icon" onClick={() => setIsBantuanOpen(true)} title="Bantuan" className="text-muted-foreground hover:text-primary hidden md:inline-flex">
                      <HelpCircle size={20} />
                  </Button>
                  <Button onClick={() => setIsFormModalOpen(true)} className="flex-1 md:flex-none md:w-auto sg-btn sg-btn-primary">
                      <Plus size={16} className="mr-2" /> Tugas Baru
                  </Button>
              </div>
          }
      />
      
      {/* Filter Pills (Mobile & Desktop) */}
      <div className="px-4 md:px-0 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full md:w-auto">
              <span className="text-sm font-semibold text-muted-foreground mr-2 hidden md:block">Tampilkan:</span>
              
              {/* Pills for Assignment Filter */}
              {['all', 'toMe', 'byMe'].map((val) => (
                  <button
                      key={`assign-${val}`}
                      onClick={() => setAssignmentFilter(val as TaskAssignmentFilter)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap border transition-colors flex-shrink-0 ${
                          assignmentFilter === val 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      }`}
                  >
                      {val === 'all' ? 'Semua Penugasan' : val === 'toMe' ? 'Tugas Untuk Saya' : 'Tugas Dari Saya'}
                  </button>
              ))}

              <div className="w-px h-5 bg-border mx-1 hidden md:block"></div>

              {/* Pills for Type Filter */}
              {['all', 'surat', 'internal'].map((val) => (
                  <button
                      key={`type-${val}`}
                      onClick={() => setTypeFilter(val as TaskTypeFilter)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap border transition-colors flex-shrink-0 ${
                          typeFilter === val 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                      }`}
                  >
                      {val === 'all' ? 'Semua Tipe' : val === 'surat' ? 'Terkait Surat' : 'Internal'}
                  </button>
              ))}
          </div>
      </div>

      {/* Tabs Status */}
      <Tabs value={activeStatusTab} onValueChange={(v) => setActiveStatusTab(v as TaskStatusFilter)} className="w-full">
        <div className="px-4 md:px-0">
            <TabsList className="w-full md:w-[500px] grid grid-cols-4 h-12 p-1 bg-muted/50 rounded-lg">
                <TabsTrigger value="Baru" className="flex items-center justify-center gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    Baru <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-bold">{taskCounts['Baru']}</span>
                </TabsTrigger>
                <TabsTrigger value="Dikerjakan" className="flex items-center justify-center gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    Proses <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-bold">{taskCounts['Dikerjakan']}</span>
                </TabsTrigger>
                <TabsTrigger value="Selesai" className="flex items-center justify-center gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    Selesai <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-bold">{taskCounts['Selesai']}</span>
                </TabsTrigger>
                <TabsTrigger value="Semua" className="flex items-center justify-center gap-1.5 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    Semua <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-full text-[10px] font-bold">{taskCounts['Semua']}</span>
                </TabsTrigger>
            </TabsList>
        </div>
        
        <div className="mt-6">
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
      
      {/* Modals */}
      <FormTugas 
        isOpen={isFormModalOpen} 
        onClose={() => setIsFormModalOpen(false)} 
        onSuccess={(newId) => { 
            addToast("Tugas baru berhasil dibuat!", "success");
            // Tidak perlu refresh manual, useTugasData realtime akan update
        }} 
        userCache={userMap} 
      />
      
      <TaskDetailModal 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        tugas={selectedTask} 
        userCache={userMap} 
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