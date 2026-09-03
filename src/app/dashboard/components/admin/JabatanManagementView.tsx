// Lokasi: src/app/dashboard/jabatan/page.tsx
// [UPDATE] Menyempurnakan fitur Import Jabatan via CSV (PapaParse).
// [UPDATE] Menambahkan fitur BULK DELETE & BULK EDIT (Hapus & Edit Massal) khusus Super Admin menggunakan Batch.
// [FASE B EKSEKUSI] Menambahkan akses tambah jabatan Sub-OPD untuk Admin Induk.
// [OPTIMISTIC UPDATE] Data yang baru ditambah/diedit langsung muncul tanpa refresh halaman.

"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore'; 
import { Jabatan, OPD, UserProfile } from '@/types';
import { useUserAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData'; 
import { useQueryClient } from '@tanstack/react-query'; // <-- Import React Query Client
import { Upload, Download, Save, Archive, ArchiveRestore, Users, Edit, Loader2, FileSpreadsheet, CheckCircle, X, Trash2, PencilLine, Network, ChevronRight, ChevronDown, GripVertical, User } from 'lucide-react'; 
import Papa from 'papaparse'; 

// --- Impor Komponen Shadcn ---
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import ConfirmModal from '@/app/dashboard/sigap/components/ConfirmModal'; 

interface JabatanManagementViewProps {
  tenant: 'sigap' | 'poros';
}

const PohonJabatanItem = ({ 
    jabatan, 
    allJabatans, 
    levelMap, 
    onEdit,
    userList,
    isEditMode,
    onDropJabatan
}: { 
    jabatan: Jabatan, 
    allJabatans: Jabatan[], 
    levelMap: Record<string, Jabatan[]>, 
    onEdit: (j: Jabatan) => void,
    userList: any[],
    isEditMode: boolean,
    onDropJabatan: (draggedId: string, targetId: string) => void
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);
    const children = levelMap[jabatan.id!] || [];
    const pengisiJabatan = userList.filter(u => u.jabatanId === jabatan.id);

    const handleDragStart = (e: React.DragEvent) => {
        if (!isEditMode) return;
        e.dataTransfer.setData('text/plain', jabatan.id!);
        e.stopPropagation();
    };

    const handleDragOver = (e: React.DragEvent) => {
        if (!isEditMode) return;
        e.preventDefault();
        setIsDragOver(true);
        e.stopPropagation();
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!isEditMode) return;
        e.preventDefault();
        setIsDragOver(false);
        e.stopPropagation();
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== jabatan.id) {
            onDropJabatan(draggedId, jabatan.id!);
        }
    };

    return (
        <div className="flex flex-col mb-2">
            <div 
                draggable={isEditMode}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex items-center gap-2 py-2 px-3 rounded-md group transition-all ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:bg-muted/80' : 'hover:bg-muted/50'} ${isDragOver ? 'bg-primary/10 border-2 border-primary border-dashed' : 'border-2 border-transparent'}`}
            >
                <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className={`p-1 rounded hover:bg-muted ${children.length === 0 ? 'invisible' : ''}`}
                >
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className="flex flex-col flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {isEditMode && <GripVertical size={14} className="text-muted-foreground mr-1" />}
                        <span className="font-semibold text-foreground">{jabatan.namaJabatan}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900/50 dark:text-blue-300">
                            Lv. {jabatan.level}
                        </span>
                        {jabatan.tipeJabatan && (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full dark:bg-gray-800 dark:text-gray-300">
                                {jabatan.tipeJabatan === 'struktural' ? jabatan.eselon : jabatan.jenjangFungsional}
                            </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${jabatan.status === 'aktif' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                            {jabatan.status}
                        </span>
                        
                        {/* PENGISI JABATAN */}
                        {pengisiJabatan.length > 0 && (
                            <div className="flex items-center gap-1 ml-2">
                                {pengisiJabatan.map(u => (
                                    <span key={u.uid} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                        <User size={10} />
                                        {u.namaLengkap}
                                    </span>
                                ))}
                            </div>
                        )}
                        {/* PLT */}
                        {jabatan.pltUserId && (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                                <Users size={10} />
                                Plt/Plh
                            </span>
                        )}
                    </div>
                </div>
                {!isEditMode && (
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(jabatan)} className="h-7 px-2 text-yellow-600">
                            <Edit size={14} className="mr-1"/> Edit
                        </Button>
                    </div>
                )}
            </div>
            {isExpanded && children.length > 0 && (
                <div className="ml-6 pl-4 border-l-2 border-border/50">
                    {children.map(child => (
                        <PohonJabatanItem 
                            key={child.id} 
                            jabatan={child} 
                            allJabatans={allJabatans} 
                            levelMap={levelMap} 
                            onEdit={onEdit} 
                            userList={userList}
                            isEditMode={isEditMode}
                            onDropJabatan={onDropJabatan}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function JabatanManagementView({ tenant }: JabatanManagementViewProps) {
    const { userProfile } = useUserAuth();
    const { addToast } = useToast();
    const queryClient = useQueryClient(); // <-- Inisialisasi Query Client
    
    // --- STATE LOKAL UI ---
    const [tableOpdFilter, setTableOpdFilter] = useState('Semua');
    const [selectedOpdInForm, setSelectedOpdInForm] = useState('');
    
    // --- DATA FETCHING (SSOT) ---
    const { 
        jabatanMap, 
        userMap, 
        opdList, 
        isLoading: isMasterLoading 
    } = useMasterData(true, tableOpdFilter !== 'Semua' ? tableOpdFilter : null);

    // Konversi Map ke Array
    const jabatanList = useMemo(() => Array.from(jabatanMap.values()), [jabatanMap]);
    const userList = useMemo(() => Array.from(userMap.values()), [userMap]);

    // [FASE B EKSEKUSI] Identifikasi apakah user adalah Admin Induk
    const isAdminInduk = useMemo(() => {
        if (userProfile?.role !== 'admin_opd') return false;
        const myOpd = opdList.find(o => o.id === userProfile.opdId);
        return myOpd?.tipe === 'Induk';
    }, [userProfile, opdList]);

    // --- STATE UNTUK BULK ACTIONS (BATCH) ---
    const [selectedJabatanIds, setSelectedJabatanIds] = useState<string[]>([]);
    const [showArchived, setShowArchived] = useState(false);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [bulkEditFields, setBulkEditFields] = useState({
        updateLevel: false,
        updateAtasan: false,
        updateStatus: false,
    });
    const [bulkEditValues, setBulkEditValues] = useState<{
        level: number;
        idAtasan: string | null;
        status: 'aktif' | 'nonaktif';
    }>({
        level: 9,
        idAtasan: null,
        status: 'aktif'
    });

    useEffect(() => {
        if ((userProfile?.role === 'admin_opd' || userProfile?.role === 'staf_tu') && userProfile.opdId && tableOpdFilter === 'Semua') {
            setTableOpdFilter(userProfile.opdId);
            setSelectedOpdInForm(userProfile.opdId);
        }
    }, [userProfile, tableOpdFilter]);

    useEffect(() => {
        setSelectedJabatanIds([]);
    }, [tableOpdFilter]);

    // --- STATE FORM & MODAL ---
    const [namaJabatan, setNamaJabatan] = useState('');
    const [level, setLevel] = useState<number>(9);
    const [idAtasan, setIdAtasan] = useState<string | null>(null);
    const [tipeJabatan, setTipeJabatan] = useState<'struktural' | 'fungsional' | 'pelaksana' | ''>('');
    const [eselon, setEselon] = useState<string>('');
    const [jenjangFungsional, setJenjangFungsional] = useState<string>('');
    const [klasterStruktur, setKlasterStruktur] = useState<'asn' | 'blud' | 'umum'>('umum');
    const [allowCrossClusterDisposisi, setAllowCrossClusterDisposisi] = useState<boolean>(false);
    const [klasterFilter, setKlasterFilter] = useState<'semua' | 'asn' | 'blud' | 'umum'>('semua');
    const [error, setError] = useState('');
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentJabatan, setCurrentJabatan] = useState<Jabatan | null>(null);

    const [isPltModalOpen, setIsPltModalOpen] = useState(false);
    const [pltJabatan, setPltJabatan] = useState<Jabatan | null>(null);
    const [selectedPltUser, setSelectedPltUser] = useState('');
    const [pltStartDate, setPltStartDate] = useState('');
    const [pltEndDate, setPltEndDate] = useState('');
    const [isPltProcessing, setIsPltProcessing] = useState(false); 

    // --- STATE DRAG & DROP POHON ---
    const [isTreeEditMode, setIsTreeEditMode] = useState(false);
    const handleDropJabatan = async (draggedId: string, targetId: string) => {
        if (draggedId === targetId) return;

        let isCycle = false;
        let currentParentId = targetId;
        const visited = new Set<string>();

        while (currentParentId && currentParentId !== 'none') {
            if (currentParentId === draggedId) {
                isCycle = true;
                break;
            }
            if (visited.has(currentParentId)) break;
            visited.add(currentParentId);

            const parentJabatan = jabatanList.find(j => j.id === currentParentId);
            if (!parentJabatan || !parentJabatan.idAtasan) break;
            currentParentId = parentJabatan.idAtasan;
        }

        if (isCycle) {
            addToast("Gagal: Anda tidak bisa memindahkan atasan ke bawah bawahannya sendiri.", "error");
            return;
        }

        const draggedJabatan = jabatanList.find(j => j.id === draggedId);
        if (!draggedJabatan) return;

        try {
            await updateDoc(doc(db, "jabatan", draggedId), {
                idAtasan: targetId
            });

            queryClient.setQueryData(['master', 'opdData', draggedJabatan.opdId], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    jabatans: oldData.jabatans.map((j: any) => j.id === draggedId ? { ...j, idAtasan: targetId } : j)
                };
            });
            setTimeout(() => queryClient.invalidateQueries({ queryKey: ['master', 'opdData', draggedJabatan.opdId] }), 3000);

            addToast("Hierarki jabatan berhasil diperbarui.", "success");
        } catch (error) {
            console.error(error);
            addToast("Gagal memperbarui hierarki jabatan.", "error");
        }
    };

    // --- STATE IMPORT CSV ---
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importOpdId, setImportOpdId] = useState('');
    const [importData, setImportData] = useState<any[]>([]);
    const [isImportProcessing, setIsImportProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isProcessing?: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    // --- COMPUTED DATA ---
    const sortedOpdListForFilter = useMemo(() => {
        const indukOpds = opdList.filter(o => o.tipe === 'Induk').sort((a, b) => a.namaOpd.localeCompare(b.namaOpd));
        const result: OPD[] = [];
        indukOpds.forEach(induk => {
            result.push(induk);
            const sub = opdList.filter(o => o.idOpdInduk === induk.id).sort((a, b) => a.namaOpd.localeCompare(b.namaOpd));
            result.push(...sub);
        });
        const usedIds = new Set(result.map(r => r.id));
        opdList.forEach(o => { if (!usedIds.has(o.id)) result.push(o); });
        
        if (userProfile?.role === 'admin_opd') {
             const myOpdId = userProfile.opdId;
             return result.filter(o => o.id === myOpdId || o.idOpdInduk === myOpdId);
        }
        return result;
    }, [opdList, userProfile]);

    const filteredJabatanForTable = useMemo(() => {
        if (userProfile?.role === 'super_admin' && tableOpdFilter === 'Semua') return [];
        let list = [...jabatanList];
        if (klasterFilter !== 'semua') {
            list = list.filter(j => (j.klasterStruktur || 'umum') === klasterFilter);
        }
        return list.sort((a, b) => a.level - b.level);
    }, [jabatanList, tableOpdFilter, userProfile, klasterFilter]);
    
    const hierarchyMap = useMemo(() => {
        const map: Record<string, Jabatan[]> = {};
        filteredJabatanForTable.forEach(j => {
            const parentId = j.idAtasan || 'root';
            if (!map[parentId]) map[parentId] = [];
            map[parentId].push(j);
        });
        return map;
    }, [filteredJabatanForTable]);

    const rootJabatans = hierarchyMap['root'] || [];

    const potentialAtasanList = useMemo(() => {
        if (!selectedOpdInForm) return [];
        return jabatanList.filter(j => j.level < level);
    }, [jabatanList, level, selectedOpdInForm]);

    const selectedOpdsInfo = useMemo(() => {
        const opdIds = new Set(
            filteredJabatanForTable
                .filter(j => selectedJabatanIds.includes(j.id!))
                .map(j => j.opdId)
        );
        return {
            isSingleOpd: opdIds.size === 1,
            opdId: opdIds.size === 1 ? Array.from(opdIds)[0] : null
        };
    }, [selectedJabatanIds, filteredJabatanForTable]);

    const getPltUserName = (jabatan: Jabatan) => {
        if (!jabatan.pltUserId) return <span className="text-muted-foreground">-</span>;
        const user = userList.find(u => u.uid === jabatan.pltUserId);
        return user ? user.namaLengkap : '(User Tidak Ditemukan)';
    };

    // --- HANDLERS ---

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!namaJabatan || !selectedOpdInForm) {
            setError("Nama Jabatan dan OPD wajib diisi."); return;
        }
        try {
            const newJabatanData: any = {
                namaJabatan,
                level: Number(level),
                opdId: selectedOpdInForm,
                idAtasan: idAtasan || null,
                status: 'aktif',
                tipeJabatan: tipeJabatan || null,
                eselon: tipeJabatan === 'struktural' ? eselon : null,
                jenjangFungsional: tipeJabatan === 'fungsional' ? jenjangFungsional : null,
                klasterStruktur: klasterStruktur || 'umum',
                allowCrossClusterDisposisi: allowCrossClusterDisposisi || false
            };
            const docRef = await addDoc(collection(db, 'jabatan'), newJabatanData);

            // --- [OPTIMISTIC UPDATE] ---
            const newJabatan = {
                id: docRef.id,
                ...newJabatanData
            };

            queryClient.setQueryData(['master', 'opdData', selectedOpdInForm], (oldData: any) => {
                if (!oldData) return oldData;
                return { ...oldData, jabatans: [...oldData.jabatans, newJabatan] };
            });

            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ['master', 'opdData', selectedOpdInForm] });
            }, 3000);
            // ---------------------------

            setNamaJabatan('');
            setKlasterStruktur('umum');
            setAllowCrossClusterDisposisi(false);
            addToast('Jabatan baru berhasil ditambahkan.', 'success'); 
        } catch (err) {
            setError('Gagal menambahkan jabatan baru.');
            console.error(err);
        }
    };
    
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentJabatan || !currentJabatan.id) return;
        try {
            const jabatanRef = doc(db, "jabatan", currentJabatan.id);
            await updateDoc(jabatanRef, {
                namaJabatan: currentJabatan.namaJabatan,
                level: Number(currentJabatan.level),
                opdId: currentJabatan.opdId,
                idAtasan: currentJabatan.idAtasan || null,
                tipeJabatan: currentJabatan.tipeJabatan || null,
                eselon: currentJabatan.tipeJabatan === 'struktural' ? currentJabatan.eselon : null,
                jenjangFungsional: currentJabatan.tipeJabatan === 'fungsional' ? currentJabatan.jenjangFungsional : null,
                klasterStruktur: currentJabatan.klasterStruktur || 'umum',
                allowCrossClusterDisposisi: currentJabatan.allowCrossClusterDisposisi || false
            });

            // --- [OPTIMISTIC UPDATE] ---
            queryClient.setQueryData(['master', 'opdData', currentJabatan.opdId], (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    jabatans: oldData.jabatans.map((j: any) => j.id === currentJabatan.id ? { 
                        ...j, 
                        namaJabatan: currentJabatan.namaJabatan, 
                        level: Number(currentJabatan.level), 
                        idAtasan: currentJabatan.idAtasan || null,
                        klasterStruktur: currentJabatan.klasterStruktur || 'umum',
                        allowCrossClusterDisposisi: currentJabatan.allowCrossClusterDisposisi || false
                    } : j)
                };
            });

            setTimeout(() => queryClient.invalidateQueries({ queryKey: ['master', 'opdData', currentJabatan.opdId] }), 3000);
            // ---------------------------

            setIsEditModalOpen(false);
            setCurrentJabatan(null);
            addToast('Jabatan berhasil diperbarui.', 'success'); 
        } catch (err) {
            setError("Gagal memperbarui jabatan.");
        }
    };

    const handleArchive = (id: string, currentStatus?: 'aktif' | 'nonaktif') => {
        const action = currentStatus === 'aktif' ? 'mengarsipkan' : 'mengaktifkan kembali';
        const newStatus = currentStatus === 'aktif' ? 'nonaktif' : 'aktif';
        setConfirmModal({
            isOpen: true,
            title: `Konfirmasi ${action}`,
            message: `Apakah Anda yakin ingin ${action} jabatan ini?`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isProcessing: true }));
                try {
                    await updateDoc(doc(db, "jabatan", id), { status: newStatus });

                    // Jika kita tahu OPD-nya (berdasarkan id dari list):
                    const targetJabatan = jabatanList.find(j => j.id === id);
                    if (targetJabatan) {
                        queryClient.setQueryData(['master', 'opdData', targetJabatan.opdId], (oldData: any) => {
                            if (!oldData) return oldData;
                            return {
                                ...oldData,
                                jabatans: oldData.jabatans.map((j: any) => j.id === id ? { ...j, status: newStatus } : j)
                            };
                        });
                        setTimeout(() => queryClient.invalidateQueries({ queryKey: ['master', 'opdData', targetJabatan.opdId] }), 3000);
                    }

                    addToast(`Jabatan berhasil di-${action}.`, 'success'); 
                } catch (err) {
                    addToast(`Gagal ${action} jabatan.`, 'error');
                } finally {
                    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, isProcessing: false });
                }
            }
        });
    };

    // --- HANDLERS BATCH / BULK ---
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = filteredJabatanForTable.map(j => j.id!);
            setSelectedJabatanIds(allIds);
        } else {
            setSelectedJabatanIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        setSelectedJabatanIds(prev => 
            checked ? [...prev, id] : prev.filter(pid => pid !== id)
        );
    };

    const handleBulkDelete = () => {
        if (selectedJabatanIds.length === 0) return;

        setConfirmModal({
            isOpen: true,
            title: `Hapus Permanen ${selectedJabatanIds.length} Jabatan`,
            message: `PERINGATAN: Anda akan menghapus ${selectedJabatanIds.length} jabatan secara PERMANEN (Batch Delete). Tindakan ini tidak dapat dibatalkan. Pastikan tidak ada pengguna aktif yang menduduki jabatan ini. Lanjutkan?`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isProcessing: true }));
                try {
                    const batch = writeBatch(db);
                    selectedJabatanIds.forEach(id => {
                        const ref = doc(db, 'jabatan', id);
                        batch.delete(ref);
                    });
                    
                    await batch.commit();

                    // Force refetch master data after bulk
                    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['master', 'opdData'] }), 2000);

                    addToast(`Berhasil menghapus ${selectedJabatanIds.length} jabatan secara permanen.`, 'success');
                    setSelectedJabatanIds([]); 
                } catch (err) {
                    console.error(err);
                    addToast(`Gagal menghapus data massal.`, 'error');
                } finally {
                    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, isProcessing: false });
                }
            }
        });
    };

    const handleBulkEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedJabatanIds.length === 0) return;

        if (!bulkEditFields.updateLevel && !bulkEditFields.updateAtasan && !bulkEditFields.updateStatus) {
            addToast('Pilih minimal satu atribut yang ingin diubah massal.', 'error');
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: `Konfirmasi Edit Massal`,
            message: `Anda akan menerapkan perubahan pada ${selectedJabatanIds.length} jabatan (Batch Update). Lanjutkan?`,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isProcessing: true }));
                try {
                    const batch = writeBatch(db);
                    selectedJabatanIds.forEach(id => {
                        const ref = doc(db, 'jabatan', id);
                        const updateData: any = {};
                        
                        if (bulkEditFields.updateLevel) updateData.level = Number(bulkEditValues.level);
                        if (bulkEditFields.updateAtasan) updateData.idAtasan = bulkEditValues.idAtasan;
                        if (bulkEditFields.updateStatus) updateData.status = bulkEditValues.status;

                        batch.update(ref, updateData);
                    });
                    
                    await batch.commit();

                    // Force refetch after bulk update
                    setTimeout(() => queryClient.invalidateQueries({ queryKey: ['master', 'opdData'] }), 2000);

                    addToast(`Berhasil memperbarui ${selectedJabatanIds.length} jabatan secara massal.`, 'success');
                    setSelectedJabatanIds([]);
                    setIsBulkEditModalOpen(false);
                    // Reset fields
                    setBulkEditFields({ updateLevel: false, updateAtasan: false, updateStatus: false });
                } catch (err) {
                    console.error(err);
                    addToast(`Gagal mengedit data massal.`, 'error');
                } finally {
                    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, isProcessing: false });
                }
            }
        });
    };

    // --- HANDLERS PLT ---
    const openEditModal = (jabatan: Jabatan) => { setCurrentJabatan(jabatan); setIsEditModalOpen(true); };
    const openPltModal = (jabatan: Jabatan) => { setPltJabatan(jabatan); setSelectedPltUser(jabatan.pltUserId || ''); setPltStartDate(jabatan.pltMulaiTanggal?.toDate().toISOString().split('T')[0] || ''); setPltEndDate(jabatan.pltSelesaiTanggal?.toDate().toISOString().split('T')[0] || ''); setIsPltModalOpen(true); };
    
    const handleSetPlt = async (e: React.FormEvent) => {
        e.preventDefault(); if (!pltJabatan) return; setIsPltProcessing(true);
        try {
            await updateDoc(doc(db, 'jabatan', pltJabatan.id!), { pltUserId: selectedPltUser, pltMulaiTanggal: Timestamp.fromDate(new Date(pltStartDate)), pltSelesaiTanggal: Timestamp.fromDate(new Date(pltEndDate)) });
            setTimeout(() => queryClient.invalidateQueries({ queryKey: ['master', 'opdData', pltJabatan.opdId] }), 2000);
            setIsPltModalOpen(false); addToast('Plt. berhasil ditunjuk.', 'success');
        } catch (err) { addToast("Gagal.", "error"); } finally { setIsPltProcessing(false); }
    };
    const handleClearPlt = async (id: string) => {
        try { 
            await updateDoc(doc(db, 'jabatan', id), { pltUserId: null, pltMulaiTanggal: null, pltSelesaiTanggal: null }); 
            const targetJabatan = jabatanList.find(j => j.id === id);
            if (targetJabatan) setTimeout(() => queryClient.invalidateQueries({ queryKey: ['master', 'opdData', targetJabatan.opdId] }), 2000);
            setIsPltModalOpen(false); addToast('Plt. dihapus.', 'success'); 
        } catch (err) { addToast("Gagal.", "error"); }
    };

    // --- LOGIKA EXPORT CSV ---
    const handleExportCSV = () => {
        if (filteredJabatanForTable.length === 0) {
            addToast("Tidak ada data jabatan untuk diekspor.", "error");
            return;
        }

        const dataToExport = filteredJabatanForTable.map(j => ({
            namaJabatan: j.namaJabatan,
            level: j.level,
            namaOpd: opdList.find(o => o.id === j.opdId)?.namaOpd || '-',
            tipeJabatan: j.tipeJabatan || '-',
            eselon: j.eselon || '-',
            jenjangFungsional: j.jenjangFungsional || '-',
            klasterStruktur: j.klasterStruktur || 'umum',
            allowCrossClusterDisposisi: j.allowCrossClusterDisposisi ? 'Ya' : 'Tidak',
            status: j.status || 'aktif'
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `data_jabatan_${tableOpdFilter !== 'Semua' ? tableOpdFilter : 'semua'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast("Data jabatan berhasil diekspor ke CSV.", "success");
    };

    // --- LOGIKA IMPORT CSV ---
    const handleDownloadTemplate = () => {
        const contohOpd = opdList.length > 0 ? opdList[0].namaOpd : "Dinas Pendidikan";
        
        const csvContent = `namaJabatan,level,namaOpd,klasterStruktur\nKepala Dinas,2,${contohOpd},umum\nSekretaris Dinas,3,${contohOpd},umum\nKepala Bidang A,3,${contohOpd},asn\nStaf Pelaksana,9,${contohOpd},umum`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'template_jabatan.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    setImportData(results.data);
                },
                error: (error) => {
                    addToast(`Gagal membaca file: ${error.message}`, 'error');
                }
            });
        }
    };

    const handleImportSubmit = async () => {
        const targetOpdDropdown = userProfile?.role === 'admin_opd' ? userProfile.opdId : importOpdId;
        
        if (importData.length === 0) {
            addToast("Tidak ada data untuk diimpor.", "error");
            return;
        }

        setIsImportProcessing(true);
        const batch = writeBatch(db);
        let successCount = 0;
        let errorCount = 0;

        try {
            importData.forEach((row: any) => {
                if (row.namaJabatan && row.level) {
                    let finalOpdId = targetOpdDropdown;

                    if (userProfile?.role === 'super_admin' && row.namaOpd) {
                        const matchedOpd = opdList.find(
                            o => o.namaOpd.trim().toLowerCase() === row.namaOpd.trim().toLowerCase()
                        );
                        if (matchedOpd) {
                            finalOpdId = matchedOpd.id!;
                        }
                    }

                    if (!finalOpdId) {
                        errorCount++;
                        return; 
                    }

                    const docRef = doc(collection(db, "jabatan"));
                    const parsedKlaster = (row.klasterStruktur || '').toLowerCase().trim();
                    const validKlaster = ['asn', 'blud', 'umum'].includes(parsedKlaster) 
                        ? parsedKlaster 
                        : (row.namaJabatan.toLowerCase().includes('blud') ? 'blud' : 'umum');

                    batch.set(docRef, {
                        namaJabatan: row.namaJabatan.trim(),
                        level: Number(row.level),
                        opdId: finalOpdId,
                        idAtasan: null, 
                        status: 'aktif',
                        klasterStruktur: validKlaster,
                        allowCrossClusterDisposisi: false
                    });
                    successCount++;
                }
            });

            if (successCount > 0) {
                await batch.commit();
                setTimeout(() => queryClient.invalidateQueries({ queryKey: ['master', 'opdData'] }), 2500);
                addToast(`Berhasil mengimpor ${successCount} jabatan via Batch! ${errorCount > 0 ? `(${errorCount} baris gagal krn OPD tdk dtmkn)` : ''}`, 'success');
                setIsImportModalOpen(false);
                setImportData([]);
                if(fileInputRef.current) fileInputRef.current.value = '';
            } else {
                addToast("Data tidak valid. Pastikan header kolom: namaJabatan, level, dan OPD tersedia.", "error");
            }
        } catch (error) {
            console.error(error);
            addToast("Gagal mengimpor data.", "error");
        } finally {
            setIsImportProcessing(false);
        }
    };

    // --- RENDER UI ---

    if (isMasterLoading) return <div className="text-center p-8 text-muted-foreground"><Loader2 className="animate-spin mx-auto h-8 w-8 mb-2"/>Memuat data jabatan...</div>;

    const isPoros = tenant === 'poros';
    const cardClass = isPoros ? 'nk-card p-6 mb-6' : 'bg-card p-6 mb-6 rounded-xl shadow-md border border-border';
    const tableWrapperClass = isPoros ? 'nk-table-wrapper' : 'w-full overflow-hidden rounded-xl border border-border shadow-sm';

    return (
        <div className="animate-fadeInUp pb-20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Manajemen Jabatan</h1>
                    <p className="text-muted-foreground mt-2">Kelola data level, posisi hierarki, dan Plt. di lingkungan kerja Anda.</p>
                </div>
                <div className="flex items-center gap-3 mt-4 md:mt-0 flex-wrap">
                    {isAdminInduk && (
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 text-xs md:text-sm flex items-center gap-1.5">
                            <Users size={16} /> Mode Admin Induk
                        </div>
                    )}
                    <Button onClick={handleExportCSV} variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        <Download size={16} className="mr-2" /> Ekspor
                    </Button>
                    <Button onClick={() => setIsImportModalOpen(true)} variant="outline">
                        <Upload size={16} className="mr-2" /> Impor
                    </Button>
                </div>
            </div>

            <div className={cardClass}>
                <h2 className="text-xl font-semibold text-foreground border-b pb-2 mb-4">Tambah Jabatan Baru</h2>
                {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
                <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div><Label htmlFor="namaJabatan">Nama Jabatan</Label><Input id="namaJabatan" value={namaJabatan} onChange={e => setNamaJabatan(e.target.value)} required/></div>
                    <div><Label htmlFor="level">Level (1=Tertinggi)</Label><Input id="level" type="number" value={level} onChange={e => setLevel(Number(e.target.value))} required/></div>
                    <div>
                        <Label htmlFor="opdForm">OPD</Label>
                        {/* [FASE B EKSEKUSI] Menghapus kondisi disabled sembarangan, diizinkan untuk Admin Induk */}
                        <Select 
                            value={selectedOpdInForm} 
                            onValueChange={setSelectedOpdInForm} 
                            disabled={userProfile?.role === 'staf_tu' || (userProfile?.role === 'admin_opd' && !isAdminInduk)}
                        >
                            <SelectTrigger id="opdForm"><SelectValue placeholder="Pilih OPD" /></SelectTrigger>
                            <SelectContent>
                                {sortedOpdListForFilter.map(opd => (
                                    <SelectItem key={opd.id} value={opd.id!}>{opd.tipe === 'Sub-OPD' ? ` - ${opd.namaOpd}` : opd.namaOpd}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Dropdown Atasan */}
                    <div>
                        <Label>Atasan Langsung (Opsional)</Label>
                        <Select value={idAtasan || "none"} onValueChange={(val) => setIdAtasan(val === "none" ? null : val)}>
                             <SelectTrigger><SelectValue placeholder="Pilih Atasan..." /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="none">-- Tidak Ada Atasan --</SelectItem>
                                {potentialAtasanList.map(j => <SelectItem key={j.id} value={j.id!}>{j.namaJabatan}</SelectItem>)}
                             </SelectContent>
                        </Select>
                    </div>
                    {/* Birokrasi Fields */}
                    <div>
                        <Label>Tipe Jabatan (Opsional)</Label>
                        <Select value={tipeJabatan} onValueChange={(val: any) => setTipeJabatan(val)}>
                            <SelectTrigger><SelectValue placeholder="Pilih Tipe Jabatan" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- Tidak Diatur --</SelectItem>
                                <SelectItem value="struktural">Struktural (Pejabat)</SelectItem>
                                <SelectItem value="fungsional">Fungsional (JFT)</SelectItem>
                                <SelectItem value="pelaksana">Pelaksana (Staf JFU)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {tipeJabatan === 'struktural' && (
                        <div>
                            <Label>Eselon</Label>
                            <Select value={eselon} onValueChange={setEselon}>
                                <SelectTrigger><SelectValue placeholder="Pilih Eselon" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="I/a">I/a</SelectItem><SelectItem value="I/b">I/b</SelectItem>
                                    <SelectItem value="II/a">II/a</SelectItem><SelectItem value="II/b">II/b</SelectItem>
                                    <SelectItem value="III/a">III/a</SelectItem><SelectItem value="III/b">III/b</SelectItem>
                                    <SelectItem value="IV/a">IV/a</SelectItem><SelectItem value="IV/b">IV/b</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {tipeJabatan === 'fungsional' && (
                        <div>
                            <Label>Jenjang Fungsional</Label>
                            <Select value={jenjangFungsional} onValueChange={setJenjangFungsional}>
                                <SelectTrigger><SelectValue placeholder="Pilih Jenjang" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Utama">Utama</SelectItem>
                                    <SelectItem value="Madya">Madya</SelectItem>
                                    <SelectItem value="Muda">Muda</SelectItem>
                                    <SelectItem value="Pertama">Pertama</SelectItem>
                                    <SelectItem value="Penyelia">Penyelia</SelectItem>
                                    <SelectItem value="Mahir">Mahir</SelectItem>
                                    <SelectItem value="Terampil">Terampil</SelectItem>
                                    <SelectItem value="Pemula">Pemula</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {/* Klaster Struktur Organisasi */}
                    <div>
                        <Label>Klaster Struktur (Opsional)</Label>
                        <Select value={klasterStruktur} onValueChange={(val: 'asn' | 'blud' | 'umum') => setKlasterStruktur(val)}>
                            <SelectTrigger><SelectValue placeholder="Pilih Klaster" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="umum">Umum / Lintas Jalur (Standar)</SelectItem>
                                <SelectItem value="asn">Struktur ASN (Pemerintahan)</SelectItem>
                                <SelectItem value="blud">Struktur BLUD (Operasional)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {klasterStruktur !== 'umum' && (
                        <div className="flex items-center space-x-2 py-2">
                            <Checkbox 
                                id="allowCrossClusterAdd" 
                                checked={allowCrossClusterDisposisi} 
                                onCheckedChange={(v) => setAllowCrossClusterDisposisi(!!v)} 
                            />
                            <Label htmlFor="allowCrossClusterAdd" className="text-xs cursor-pointer">
                                Izinkan Disposisi Lintas Klaster
                            </Label>
                        </div>
                    )}
                    <div className="md:col-span-2 lg:col-span-3 mt-2"><Button type="submit" className="w-full"><Save size={16} className="mr-2" /> Simpan</Button></div>
                </form>
            </div>
            
            {/* Tabel Jabatan */}
            <div className={cardClass.replace('p-6', 'p-0 mt-8')}>
                <Tabs defaultValue="tabel" className="w-full">
                    <div className="p-6 border-b border-border flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-muted/20">
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Daftar Jabatan</h2>
                            <p className="text-sm text-muted-foreground mt-1">Total: {filteredJabatanForTable.length} Jabatan</p>
                            <TabsList className="mt-4">
                                <TabsTrigger value="tabel">Mode Tabel</TabsTrigger>
                                <TabsTrigger value="pohon">Mode Pohon <Network size={14} className="ml-2"/></TabsTrigger>
                            </TabsList>
                        </div>
                    
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="showArchived" checked={showArchived} onCheckedChange={() => setShowArchived(!showArchived)} />
                            <Label htmlFor="showArchived" className="text-sm font-medium cursor-pointer">Tampilkan Non-Aktif</Label>
                        </div>
                        <div className='w-full md:w-44'>
                            <Label htmlFor="klasterFilter" className="mb-1 block text-xs">Filter Klaster</Label>
                            <Select value={klasterFilter} onValueChange={(v: any) => setKlasterFilter(v)}>
                                <SelectTrigger id="klasterFilter"><SelectValue placeholder="Semua Struktur" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="semua">-- Semua Struktur --</SelectItem>
                                    <SelectItem value="asn">Struktur ASN</SelectItem>
                                    <SelectItem value="blud">Struktur BLUD</SelectItem>
                                    <SelectItem value="umum">Struktur Umum</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='w-full md:w-56'>
                            <Label htmlFor="opdFilter" className="mb-1 block text-xs">Filter OPD</Label>
                            <Select value={tableOpdFilter} onValueChange={setTableOpdFilter}>
                                <SelectTrigger id="opdFilter"><SelectValue placeholder="Pilih OPD" /></SelectTrigger>
                                <SelectContent>
                                    {userProfile?.role === 'super_admin' && (
                                        <SelectItem value="Semua">-- Semua OPD --</SelectItem>
                                    )}
                                    {sortedOpdListForFilter.map(opd => (
                                        <SelectItem key={opd.id} value={opd.id!}>{opd.tipe === 'Sub-OPD' ? ` - ${opd.namaOpd}` : opd.namaOpd}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-background">
                    <TabsContent value="tabel" className="m-0 space-y-4">
                        {selectedJabatanIds.length > 0 && (
                            <div className="mb-4 p-3 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
                                <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                    Terpilih: {selectedJabatanIds.length} Jabatan
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setIsBulkEditModalOpen(true)} className="bg-white hover:bg-gray-50 border-blue-200 text-blue-700">
                                        <PencilLine size={14} className="mr-2" /> Edit Massal
                                    </Button>
                                    {userProfile?.role === 'super_admin' && (
                                        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                                            <Trash2 size={14} className="mr-2" /> Hapus Massal
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className={tableWrapperClass}>
                            <table className="w-full text-left">
                                <thead className="bg-muted/50">
                                    <tr className="border-b border-border">
                                        {userProfile?.role === 'super_admin' && (
                                            <th className="p-3 w-10 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 cursor-pointer rounded border-gray-300"
                                                    checked={selectedJabatanIds.length === filteredJabatanForTable.length && filteredJabatanForTable.length > 0}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                />
                                            </th>
                                        )}
                                        <th className="p-3 font-medium text-muted-foreground">Nama Jabatan</th>
                                        <th className="p-3 font-medium text-muted-foreground">Level</th>
                                        <th className="p-3 font-medium text-muted-foreground">Atasan</th>
                                        <th className="p-3 font-medium text-muted-foreground">Plt./Plh.</th>
                                        <th className="p-3 font-medium text-muted-foreground">Status</th>
                                        <th className="p-3 font-medium text-muted-foreground text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredJabatanForTable.map(jabatan => (
                                        <tr key={jabatan.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                            {userProfile?.role === 'super_admin' && (
                                                <td className="p-3 text-center">
                                                    <input 
                                                        type="checkbox"
                                                        className="w-4 h-4 cursor-pointer rounded border-gray-300"
                                                        checked={selectedJabatanIds.includes(jabatan.id!)}
                                                        onChange={(e) => handleSelectOne(jabatan.id!, e.target.checked)}
                                                    />
                                                </td>
                                            )}
                                            <td className="p-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span>{jabatan.namaJabatan}</span>
                                                    {jabatan.klasterStruktur === 'asn' && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 rounded border border-blue-200">ASN</span>
                                                    )}
                                                    {jabatan.klasterStruktur === 'blud' && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded border border-emerald-200">BLUD</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">{jabatan.level}</td>
                                            <td className="p-3 text-muted-foreground">{jabatanMap.get(jabatan.idAtasan || '')?.namaJabatan || '-'}</td>
                                            <td className="p-3 text-muted-foreground">{getPltUserName(jabatan)}</td>
                                            <td className="p-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${jabatan.status === 'aktif' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-gray-100 text-gray-800'}`}>{jabatan.status}</span></td>
                                            <td className="flex items-center justify-center p-3 space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => openPltModal(jabatan)} title="Tunjuk Plt"><Users size={18} className="text-teal-600"/></Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEditModal(jabatan)} title="Edit"><Edit size={18} className="text-yellow-600"/></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleArchive(jabatan.id!, jabatan.status)} title="Arsipkan">{jabatan.status === 'aktif' ? <Archive size={18} className="text-red-600"/> : <ArchiveRestore size={18} className="text-green-600"/>}</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>
                    
                    <TabsContent value="pohon" className="m-0 mt-4 p-4 border rounded-lg bg-card min-h-[400px]">
                        <div className="flex justify-end mb-4">
                            <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-lg border">
                                <Checkbox id="dndMode" checked={isTreeEditMode} onCheckedChange={(v) => setIsTreeEditMode(!!v)} />
                                <Label htmlFor="dndMode" className="cursor-pointer font-medium text-sm">Aktifkan Edit Drag & Drop</Label>
                            </div>
                        </div>
                        {rootJabatans.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Network size={48} className="mb-4 opacity-20" />
                                <p>Belum ada hierarki jabatan yang terbentuk.</p>
                                <p className="text-sm">Silakan edit jabatan dan atur <strong>Atasan Langsung</strong>.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {rootJabatans.map(j => (
                                    <PohonJabatanItem 
                                        key={j.id} 
                                        jabatan={j} 
                                        allJabatans={filteredJabatanForTable} 
                                        levelMap={hierarchyMap} 
                                        onEdit={openEditModal} 
                                        userList={userList}
                                        isEditMode={isTreeEditMode}
                                        onDropJabatan={handleDropJabatan}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
        </div>

        {/* Modal Bulk Edit */}
            <Dialog open={isBulkEditModalOpen} onOpenChange={setIsBulkEditModalOpen}>
                <DialogContent className="sm:max-w-xl bg-card border-border">
                    <DialogHeader>
                        <DialogTitle>Edit Massal {selectedJabatanIds.length} Jabatan</DialogTitle>
                        <DialogDescription>Aktifkan centang pada atribut yang ingin Anda ubah untuk seluruh jabatan yang dipilih.</DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleBulkEditSubmit} className="space-y-6 mt-4">
                        <div className="flex items-start space-x-4 p-4 border rounded-lg bg-muted/20">
                            <input 
                                type="checkbox" id="checkLevel" className="mt-1 w-5 h-5 cursor-pointer"
                                checked={bulkEditFields.updateLevel}
                                onChange={(e) => setBulkEditFields(prev => ({...prev, updateLevel: e.target.checked}))}
                            />
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="checkLevel" className="cursor-pointer font-semibold text-base">Ubah Level</Label>
                                <Input 
                                    type="number" 
                                    disabled={!bulkEditFields.updateLevel}
                                    value={bulkEditValues.level} 
                                    onChange={e => setBulkEditValues(prev => ({...prev, level: Number(e.target.value)}))} 
                                />
                            </div>
                        </div>

                        <div className="flex items-start space-x-4 p-4 border rounded-lg bg-muted/20">
                            <input 
                                type="checkbox" id="checkAtasan" className="mt-1 w-5 h-5 cursor-pointer"
                                disabled={!selectedOpdsInfo.isSingleOpd}
                                checked={bulkEditFields.updateAtasan}
                                onChange={(e) => setBulkEditFields(prev => ({...prev, updateAtasan: e.target.checked}))}
                            />
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="checkAtasan" className={`font-semibold text-base ${!selectedOpdsInfo.isSingleOpd ? 'text-muted-foreground' : 'cursor-pointer'}`}>Ubah Atasan</Label>
                                {!selectedOpdsInfo.isSingleOpd ? (
                                    <p className="text-xs text-red-500">Edit massal atasan hanya dapat dilakukan jika semua jabatan yang dipilih berasal dari OPD yang sama.</p>
                                ) : (
                                    <Select 
                                        disabled={!bulkEditFields.updateAtasan}
                                        value={bulkEditValues.idAtasan || "none"} 
                                        onValueChange={(v) => setBulkEditValues(prev => ({...prev, idAtasan: v === "none" ? null : v}))}
                                    >
                                        <SelectTrigger><SelectValue placeholder="-- Pilih Atasan --" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Tidak Ada Atasan --</SelectItem>
                                            {jabatanList
                                                .filter(j => j.opdId === selectedOpdsInfo.opdId)
                                                .map(j => <SelectItem key={j.id} value={j.id!}>{j.namaJabatan}</SelectItem>)
                                            }
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start space-x-4 p-4 border rounded-lg bg-muted/20">
                            <input 
                                type="checkbox" id="checkStatus" className="mt-1 w-5 h-5 cursor-pointer"
                                checked={bulkEditFields.updateStatus}
                                onChange={(e) => setBulkEditFields(prev => ({...prev, updateStatus: e.target.checked}))}
                            />
                            <div className="flex-1 space-y-2">
                                <Label htmlFor="checkStatus" className="cursor-pointer font-semibold text-base">Ubah Status</Label>
                                <Select 
                                    disabled={!bulkEditFields.updateStatus}
                                    value={bulkEditValues.status} 
                                    onValueChange={(v: 'aktif'|'nonaktif') => setBulkEditValues(prev => ({...prev, status: v}))}
                                >
                                    <SelectTrigger><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aktif">Aktif</SelectItem>
                                        <SelectItem value="nonaktif">Nonaktif (Arsip)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsBulkEditModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={!bulkEditFields.updateLevel && !bulkEditFields.updateAtasan && !bulkEditFields.updateStatus}>
                                Terapkan Perubahan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            {/* Modal Edit Satuan */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-lg bg-card border-border">
                    <DialogHeader><DialogTitle>Edit Jabatan</DialogTitle></DialogHeader>
                    {currentJabatan && (
                        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                            <div><Label>Nama Jabatan</Label><Input value={currentJabatan.namaJabatan} onChange={e => setCurrentJabatan({ ...currentJabatan, namaJabatan: e.target.value })} required/></div>
                            <div><Label>Level</Label><Input type="number" value={currentJabatan.level} onChange={e => setCurrentJabatan({ ...currentJabatan, level: Number(e.target.value) })} required/></div>
                            <div>
                                <Label>Atasan Langsung</Label>
                                <Select value={currentJabatan.idAtasan || "none"} onValueChange={(v) => setCurrentJabatan({ ...currentJabatan, idAtasan: v === "none" ? null : v })}>
                                    <SelectTrigger><SelectValue placeholder="-- Pilih Atasan --" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Tidak Ada Atasan --</SelectItem>
                                        {jabatanList
                                            .filter(j => j.opdId === currentJabatan.opdId && j.level < currentJabatan.level && j.id !== currentJabatan.id)
                                            .map(j => <SelectItem key={j.id} value={j.id!}>{j.namaJabatan}</SelectItem>)
                                        }
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {/* Birokrasi Fields */}
                            <div>
                                <Label>Tipe Jabatan</Label>
                                <Select value={currentJabatan.tipeJabatan || "none"} onValueChange={(val: any) => setCurrentJabatan({ ...currentJabatan, tipeJabatan: val === "none" ? undefined : val })}>
                                    <SelectTrigger><SelectValue placeholder="Pilih Tipe Jabatan" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">-- Tidak Diatur --</SelectItem>
                                        <SelectItem value="struktural">Struktural (Pejabat)</SelectItem>
                                        <SelectItem value="fungsional">Fungsional (JFT)</SelectItem>
                                        <SelectItem value="pelaksana">Pelaksana (Staf JFU)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {currentJabatan.tipeJabatan === 'struktural' && (
                                <div>
                                    <Label>Eselon</Label>
                                    <Select value={currentJabatan.eselon || ""} onValueChange={(val: any) => setCurrentJabatan({ ...currentJabatan, eselon: val })}>
                                        <SelectTrigger><SelectValue placeholder="Pilih Eselon" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="I/a">I/a</SelectItem><SelectItem value="I/b">I/b</SelectItem>
                                            <SelectItem value="II/a">II/a</SelectItem><SelectItem value="II/b">II/b</SelectItem>
                                            <SelectItem value="III/a">III/a</SelectItem><SelectItem value="III/b">III/b</SelectItem>
                                            <SelectItem value="IV/a">IV/a</SelectItem><SelectItem value="IV/b">IV/b</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            {currentJabatan.tipeJabatan === 'fungsional' && (
                                <div>
                                    <Label>Jenjang Fungsional</Label>
                                    <Select value={currentJabatan.jenjangFungsional || ""} onValueChange={(val: any) => setCurrentJabatan({ ...currentJabatan, jenjangFungsional: val })}>
                                        <SelectTrigger><SelectValue placeholder="Pilih Jenjang" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Utama">Utama</SelectItem>
                                            <SelectItem value="Madya">Madya</SelectItem>
                                            <SelectItem value="Muda">Muda</SelectItem>
                                            <SelectItem value="Pertama">Pertama</SelectItem>
                                            <SelectItem value="Penyelia">Penyelia</SelectItem>
                                            <SelectItem value="Mahir">Mahir</SelectItem>
                                            <SelectItem value="Terampil">Terampil</SelectItem>
                                            <SelectItem value="Pemula">Pemula</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Klaster Struktur Organisasi Edit */}
                            <div>
                                <Label>Klaster Struktur Organisasi</Label>
                                <Select 
                                    value={currentJabatan.klasterStruktur || "umum"} 
                                    onValueChange={(val: 'asn' | 'blud' | 'umum') => setCurrentJabatan({ ...currentJabatan, klasterStruktur: val })}
                                >
                                    <SelectTrigger><SelectValue placeholder="Pilih Klaster" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="umum">Umum / Lintas Jalur (Standar)</SelectItem>
                                        <SelectItem value="asn">Struktur ASN (Pemerintahan)</SelectItem>
                                        <SelectItem value="blud">Struktur BLUD (Operasional)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {(currentJabatan.klasterStruktur === 'asn' || currentJabatan.klasterStruktur === 'blud') && (
                                <div className="flex items-center space-x-2 py-1">
                                    <Checkbox 
                                        id="allowCrossClusterEdit" 
                                        checked={!!currentJabatan.allowCrossClusterDisposisi} 
                                        onCheckedChange={(v) => setCurrentJabatan({ ...currentJabatan, allowCrossClusterDisposisi: !!v })} 
                                    />
                                    <Label htmlFor="allowCrossClusterEdit" className="text-xs cursor-pointer">
                                        Izinkan Disposisi Lintas Klaster
                                    </Label>
                                </div>
                            )}

                            <DialogFooter><Button type="submit">Simpan Perubahan</Button></DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Modal Plt */}
            <Dialog open={isPltModalOpen} onOpenChange={setIsPltModalOpen}>
                <DialogContent className="sm:max-w-lg bg-card border-border">
                    <DialogHeader><DialogTitle>Penugasan Plt./Plh.</DialogTitle></DialogHeader>
                    <form onSubmit={handleSetPlt} className="space-y-4">
                         <div>
                            <Label>Pilih Pengguna</Label>
                            <Select value={selectedPltUser} onValueChange={setSelectedPltUser}>
                                <SelectTrigger><SelectValue placeholder="Pilih user..."/></SelectTrigger>
                                <SelectContent>
                                    {userList.map(u => <SelectItem key={u.uid} value={u.uid}>{u.namaLengkap}</SelectItem>)}
                                </SelectContent>
                            </Select>
                         </div>
                         <div className='grid grid-cols-2 gap-4'>
                            <div><Label>Mulai</Label><Input type="date" value={pltStartDate} onChange={e=>setPltStartDate(e.target.value)} required/></div>
                            <div><Label>Selesai</Label><Input type="date" value={pltEndDate} onChange={e=>setPltEndDate(e.target.value)} required/></div>
                         </div>
                         <DialogFooter className='justify-between'>
                            {pltJabatan?.pltUserId && <Button type="button" variant="destructive" onClick={() => handleClearPlt(pltJabatan.id!)}>Hapus Penugasan</Button>}
                            <Button type="submit" disabled={isPltProcessing}>{isPltProcessing && <Loader2 className='mr-2 animate-spin'/>} Simpan</Button>
                         </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            {/* Modal Import */}
             <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                 <DialogContent className="bg-card border-border sm:max-w-3xl">
                     <DialogHeader>
                         <DialogTitle className="flex items-center gap-2"><FileSpreadsheet className="text-green-600"/> Import Jabatan (CSV)</DialogTitle>
                     </DialogHeader>
                     
                     <div className='space-y-4 py-2'>
                        {userProfile?.role === 'super_admin' && (
                            <div>
                                <Label>OPD Target (Default / Fallback)</Label>
                                <Select value={importOpdId || (tableOpdFilter !== 'Semua' ? tableOpdFilter : '')} onValueChange={setImportOpdId}>
                                    <SelectTrigger><SelectValue placeholder="Pilih OPD (Opsional jika diisi di CSV)" /></SelectTrigger>
                                    <SelectContent>
                                        {sortedOpdListForFilter.map(opd => (
                                            <SelectItem key={opd.id} value={opd.id!}>{opd.namaOpd}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Jika baris CSV memiliki kolom <strong>namaOpd</strong> yang cocok, OPD tersebut akan digunakan. Jika kosong/tidak cocok, data akan dimasukkan ke OPD yang dipilih di sini.
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 border border-dashed rounded-lg bg-muted/30">
                            <div className="flex-1 w-full">
                                <Label>Upload File CSV</Label>
                                <Input 
                                    type="file" 
                                    accept=".csv" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="mt-1"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Pastikan ada kolom: <strong>namaJabatan, level</strong>. Kolom <strong>namaOpd</strong> opsional (Khusus Super Admin).</p>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="mt-6 sm:mt-0">
                                <Download size={16} className="mr-2"/> Template
                            </Button>
                        </div>

                        {importData.length > 0 && (
                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted px-3 py-2 text-xs font-bold border-b flex justify-between items-center">
                                    <span>Preview ({importData.length} baris)</span>
                                    <Button variant="ghost" size="sm" onClick={() => { setImportData([]); if(fileInputRef.current) fileInputRef.current.value = ''; }} className="h-6 text-xs text-red-500"><X size={14} className="mr-1"/> Batal</Button>
                                </div>
                                <ScrollArea className="h-40">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="h-8 text-xs">Nama Jabatan</TableHead>
                                                <TableHead className="h-8 text-xs">Level</TableHead>
                                                <TableHead className="h-8 text-xs">Nama OPD (Di CSV)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {importData.slice(0, 10).map((row, i) => (
                                                <TableRow key={i} className="h-8">
                                                    <TableCell className="py-1 text-xs">{row.namaJabatan}</TableCell>
                                                    <TableCell className="py-1 text-xs">{row.level}</TableCell>
                                                    <TableCell className="py-1 text-xs text-muted-foreground">{row.namaOpd || '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                            {importData.length > 10 && <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground">... dan {importData.length - 10} lainnya</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </ScrollArea>
                            </div>
                        )}
                     </div>

                     <DialogFooter>
                         <Button variant="outline" onClick={()=>setIsImportModalOpen(false)}>Tutup</Button>
                         <Button onClick={handleImportSubmit} disabled={isImportProcessing || importData.length === 0} className="bg-green-600 hover:bg-green-700">
                             {isImportProcessing ? <Loader2 className="mr-2 animate-spin"/> : <CheckCircle className="mr-2 h-4 w-4"/>} 
                             Proses Import Batch
                         </Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>

             <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal(prev => ({...prev, isOpen: false}))} onConfirm={confirmModal.onConfirm} title={confirmModal.title} message={confirmModal.message} isProcessing={confirmModal.isProcessing} />
        </div>
    );
}