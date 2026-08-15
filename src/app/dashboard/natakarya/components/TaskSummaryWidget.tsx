// Lokasi: src/app/dashboard/components/TaskSummaryWidget.tsx
// [MODIFIKASI TUGAS 2]
// - Komponen ini sekarang menjadi interaktif.
// - Mengganti `TaskItem` lokal dengan `TaskListItem` yang diimpor.
// - Menambahkan state untuk `expandedTaskId`, `selectedTask`, dan `confirmModal`.
// - Menambahkan prop `userCache`.
// - Menyalin handler `handleStatusChange` dan `handleDeleteTask` dari `tugas/page.tsx`.

"use client";

import React, { useMemo, useState } from 'react';
import { Tugas, UserProfile } from '@/types';
import { useUserAuth } from '@/context/AuthContext';
import { CheckSquare } from 'lucide-react';

// --- Impor Baru ---
import TaskListItem from '@/app/dashboard/(main)/tugas/components/TaskListItem';
import TaskDetailModal from '@/app/dashboard/(main)/tugas/components/TaskDetailModal';
import ConfirmModal from './ConfirmModal';
import { useToast } from '@/context/ToastContext';
import { db } from '@/lib/firebase';
import { doc, writeBatch, Timestamp, deleteDoc } from 'firebase/firestore';
import { logActivity } from '@/lib/activityLogger'; // Asumsi path
// --- Akhir Impor Baru ---

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TaskSummaryWidgetProps {
    tasks: Tugas[];
    userCache: Map<string, UserProfile>; // Prop baru
}

export default function TaskSummaryWidget({ tasks, userCache }: TaskSummaryWidgetProps) {
    const { userProfile, actingJabatanProfile } = useUserAuth();
    const { addToast } = useToast();

    // --- State Baru ---
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Tugas | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ 
        isOpen: boolean; 
        title: string; 
        message: string; 
        onConfirm: () => void; 
        isProcessing?: boolean; 
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, isProcessing: false });
    // --- Akhir State Baru ---

    const now = new Date();

    const sortedTasks = [...tasks].sort((a, b) => {
        const aOverdue = a.batasWaktu && a.batasWaktu.toDate() < now;
        const bOverdue = b.batasWaktu && b.batasWaktu.toDate() < now;
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        if (a.batasWaktu && b.batasWaktu) {
            return a.batasWaktu.toMillis() - b.batasWaktu.toMillis();
        }
        if (a.batasWaktu) return -1;
        if (b.batasWaktu) return 1;

        return b.tanggalDibuat.toMillis() - a.tanggalDibuat.toMillis();
    });
    
    // --- Handler Baru (Disalin dari tugas/page.tsx) ---
    const handleStatusChange = async (tugasId: string, newStatus: Tugas['status']) => {
        const task = tasks.find(t => t.id === tugasId);
        if (!task || !actingJabatanProfile || !userProfile || userCache.size === 0) return;
        
        const confirmAction = async () => {
          setConfirmModal(prev => ({ ...prev, isProcessing: true }));
          try {
            const batch = writeBatch(db);
            const tugasRef = doc(db, 'tugas', tugasId);
            const updateData: { status: Tugas['status'], tanggalSelesai?: Timestamp | null } = { status: newStatus };
            let logMessage = '';
            
            if (newStatus === 'Selesai') {
              updateData.tanggalSelesai = Timestamp.now();
              logMessage = `Menyelesaikan tugas: "${task.judulTugas}"`;
            } else if (newStatus === 'Dikerjakan' && task.status === 'Selesai') {
              updateData.tanggalSelesai = null;
              logMessage = `Membuka kembali (revisi) tugas: "${task.judulTugas}"`;
            } else {
              logMessage = `Mengubah status tugas menjadi "${newStatus}"`;
            }
            
            batch.update(tugasRef, updateData);

            if(task.suratId) {
                const actorName = `${userProfile.namaLengkap} (${actingJabatanProfile.namaJabatan})`;
                await logActivity(task.suratId, actorName, logMessage);
            }
            await batch.commit();
            addToast(`Status tugas diubah menjadi "${newStatus}".`, 'success');
          } catch (error) {
            console.error("Gagal memperbarui status tugas:", error);
            addToast("Gagal memperbarui status tugas.", "error");
          } finally {
            setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, isProcessing: false });
          }
        };

        if (newStatus === 'Selesai') {
            setConfirmModal({
                isOpen: true, title: 'Konfirmasi Selesai', message: 'Apakah Anda yakin ingin menyelesaikan tugas ini?', onConfirm: confirmAction, isProcessing: false
            });
        } else {
            await confirmAction();
        }
    };

    const handleDeleteTask = (taskToDelete: Tugas) => {
        if (!taskToDelete.id) return;
        setConfirmModal({
            isOpen: true, title: "Hapus Tugas", message: `Apakah Anda yakin ingin menghapus tugas "${taskToDelete.judulTugas}"?`, isProcessing: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({...prev, isProcessing: true}));
                try {
                    await deleteDoc(doc(db, 'tugas', taskToDelete.id!));
                    if(taskToDelete.suratId && userProfile && actingJabatanProfile){
                        const actorName = `${userProfile.namaLengkap} (${actingJabatanProfile.namaJabatan})`;
                        await logActivity(taskToDelete.suratId, actorName, `Menghapus tugas: "${taskToDelete.judulTugas}"`);
                    }
                    addToast("Tugas berhasil dihapus.", "success");
                } catch(error) {
                    console.error("Gagal menghapus tugas: ", error);
                    addToast("Gagal menghapus tugas.", "error");
                } finally {
                    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, isProcessing: false });
                }
            }
        })
    }
    // --- Akhir Handler Baru ---

    if (!userProfile) return null;
    
    return (
        <Card className="flex flex-col h-fit rounded-2xl shadow-[0_4px_20px_-4px_rgba(17,94,89,0.1)] border border-[var(--nk-gradient-start)]/10 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--nk-gradient-start)] to-[var(--nk-gradient-end)] opacity-80"></div>
            <CardHeader className="bg-gradient-to-r from-[var(--nk-gradient-start)]/5 to-transparent border-b border-border/50 p-4">
                <CardTitle className="text-xl font-bold font-heading flex items-center gap-2">
                    <div className="p-2 bg-[var(--nk-gradient-start)]/10 rounded-xl">
                        <CheckSquare className="w-5 h-5 text-[var(--nk-gradient-start)]" />
                    </div>
                    Tugas Aktif Saya
                </CardTitle>
                <CardDescription className="ml-11">
                    Semua tugas dengan status "Baru" dan "Dikerjakan".
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                {sortedTasks.length > 0 ? (
                    // --- Logika Render Diganti ---
                    <div className="space-y-3">
                        {sortedTasks.map(task => (
                            <TaskListItem
                                key={task.id}
                                tugas={task}
                                isExpanded={expandedTaskId === task.id}
                                onToggleExpand={(id) => setExpandedTaskId(prev => (prev === id ? null : id))}
                                onOpenDetail={setSelectedTask}
                                onStatusChange={handleStatusChange}
                                onDeleteTask={handleDeleteTask}
                                userCache={userCache}
                            />
                        ))}
                    </div>
                    // --- Akhir Logika Render ---
                ) : (
                    <div className="text-center py-16 flex flex-col items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                        <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-[var(--nk-gradient-start)]/5 to-[var(--nk-gradient-end)]/5 flex items-center justify-center border border-[var(--nk-gradient-start)]/10 shadow-inner relative">
                            <div className="absolute inset-0 bg-[var(--nk-gradient-start)]/5 blur-xl rounded-full"></div>
                            <CheckSquare size={48} className="text-[var(--nk-gradient-start)]/40 relative z-10" />
                        </div>
                        <p className="font-heading font-semibold text-foreground/70 text-lg">Kosong</p>
                        <p className="text-sm text-muted-foreground mt-1">Tidak ada tugas aktif.</p>
                    </div>
                )}
            </CardContent>
            
            {/* --- Modal-modal yang Diperlukan --- */}
            <TaskDetailModal
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                tugas={selectedTask}
                userCache={userCache}
            />
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false, isProcessing: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isProcessing={confirmModal.isProcessing}
            />
            {/* --- Akhir Modal --- */}
        </Card>
    );
}
