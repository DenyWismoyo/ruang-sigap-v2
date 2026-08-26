"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useUserAuth } from '@/context/AuthContext';
import { useRepository } from './hooks/useRepository';
import { RepositoryItem } from '@/types';
import DocumentPreviewModal from './components/DocumentPreviewModal';
import { 
    Folder, FileText, Plus, Search, UploadCloud, Star,
    FileSpreadsheet, FileVideo, FileImage, FileArchive, 
    MoreVertical, Edit, Trash2, Link as LinkIcon, Download,
    LayoutGrid, List as ListIcon, Lock, Eye, Share2, FolderArchive
} from 'lucide-react';
import { logActivity } from '@/lib/activityLogger';

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import StorageIndicator from './components/StorageIndicator';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SigapPageHeader from '@/app/dashboard/sigap/components/SigapPageHeader';
import SigapEmptyState from '@/app/dashboard/sigap/components/SigapEmptyState';
import ConfirmModal from '@/app/dashboard/sigap/components/ConfirmModal';
import RepositoryBreadcrumbs from './components/RepositoryBreadcrumbs';
import RepositoryItemModal from './components/RepositoryItemModal';

// Helper icon
const getItemIcon = (item: RepositoryItem) => {
    if (item.tipe === "folder") return <Folder size={32} className="text-yellow-500 flex-shrink-0" fill="currentColor" fillOpacity={0.2}/>;
    if (item.tipe === "file") {
        switch (item.tipeDokumen) {
            case "sheet": return <FileSpreadsheet size={32} className="text-green-500 flex-shrink-0" />;
            case "doc": return <FileText size={32} className="text-blue-500 flex-shrink-0" />;
            case "pdf": return <FileText size={32} className="text-red-500 flex-shrink-0" />;
            case "video": return <FileVideo size={32} className="text-purple-500 flex-shrink-0" />;
            case "image": return <FileImage size={32} className="text-indigo-500 flex-shrink-0" />;
            case "zip": return <FileArchive size={32} className="text-yellow-600 flex-shrink-0" />;
            default: return <FileText size={32} className="text-gray-500 flex-shrink-0" />;
        }
    }
    return <LinkIcon size={32} className="text-emerald-500 flex-shrink-0" />;
};

const getVisibilityIcon = (visibility: string) => {
    if (visibility === 'private') return <span title="Privat"><Lock size={12} className="text-red-400" /></span>;
    if (visibility === 'shared') return <span title="Dibagikan"><Share2 size={12} className="text-green-500" /></span>;
    return <span title="Internal OPD"><Eye size={12} className="text-blue-400" /></span>;
};

export default function RepositoryDokumenPage() {
    const { userProfile } = useUserAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Gunakan Custom Hook
    const repo = useRepository(userProfile);
    
    // UI States
    const [activeZone, setActiveZone] = useState<'opd' | 'private' | 'shared' | 'trash'>('opd');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<{ id: string | null; nama: string }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Modal States
    const [modalState, setModalState] = useState<{ isOpen: boolean; mode: 'folder' | 'link' | 'file'; item: RepositoryItem | null }>({
        isOpen: false, mode: 'folder', item: null
    });
    
    // Confirm Modal
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: () => {}, isProcessing: false
    });

    // Drag & Drop States
    const [isDraggingOverFile, setIsDraggingOverFile] = useState(false);
    const [draggedItem, setDraggedItem] = useState<RepositoryItem | null>(null);
    const [dragOverTargetFolderId, setDragOverTargetFolderId] = useState<string | null>(null);

    // Preview State
    const [previewItem, setPreviewItem] = useState<RepositoryItem | null>(null);

    // Multi-Select State
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

    // Filter States
    const [filterTipe, setFilterTipe] = useState<'all' | 'folder' | 'file' | 'link'>('all');
    const [filterAkses, setFilterAkses] = useState<'all' | 'private' | 'shared' | 'opd'>('all');

    // Cek URL Param untuk Fitur Share Link
    const itemIdFromUrl = searchParams.get('itemId');
    const [hasHandledUrlParam, setHasHandledUrlParam] = useState(false);

    useEffect(() => {
        if (itemIdFromUrl && repo.items.length > 0 && !hasHandledUrlParam) {
            const item = repo.items.find(i => i.id === itemIdFromUrl);
            if (item) {
                if (item.tipe === 'folder') {
                    setCurrentFolderId(item.id!);
                } else {
                    setPreviewItem(item);
                }
            } else {
                toast.error("Dokumen tidak ditemukan atau Anda tidak memiliki akses.");
            }
            setHasHandledUrlParam(true);
        }
    }, [itemIdFromUrl, repo.items, hasHandledUrlParam]);

    // Navigasi & Filter Data
    const currentItems = useMemo(() => {
        const zoneItems = repo.items.filter(item => {
            if (activeZone === 'trash') return item.isDeleted === true;
            if (item.isDeleted) return false;

            if (activeZone === 'private') return item.visibility === 'private' && item.createdBy === userProfile?.uid;
            if (activeZone === 'shared') return item.visibility === 'shared';
            return item.visibility === 'opd';
        });

        return zoneItems.filter(item => {
            if (searchTerm) return true; 
            return item.parentId === currentFolderId;
        }).filter(item => {
            const searchLower = searchTerm.toLowerCase();
            const matchName = item.nama.toLowerCase().includes(searchLower) || 
                              (item.aiClassification && item.aiClassification.toLowerCase().includes(searchLower)) ||
                              (item.aiSummary && item.aiSummary.toLowerCase().includes(searchLower));
            
            const matchTipe = filterTipe === 'all' || item.tipe === filterTipe;
            const matchAkses = filterAkses === 'all' || item.visibility === filterAkses;
            return matchName && matchTipe && matchAkses;
        }).sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            if (a.tipe === 'folder' && b.tipe !== 'folder') return -1;
            if (a.tipe !== 'folder' && b.tipe === 'folder') return 1;
            return a.nama.localeCompare(b.nama);
        });
    }, [repo.items, currentFolderId, searchTerm, filterTipe, filterAkses, activeZone, userProfile]);

    const handleNavigate = (folderId: string | null, folderName: string) => {
        if (folderId === currentFolderId) return;
        
        setCurrentFolderId(folderId);
        setSearchTerm('');
        
        if (!folderId) {
            setFolderPath([]);
        } else {
            const index = folderPath.findIndex(p => p.id === folderId);
            if (index !== -1) {
                setFolderPath(prev => prev.slice(0, index + 1));
            } else {
                setFolderPath(prev => [...prev, { id: folderId, nama: folderName }]);
            }
        }
    };

    const handleItemClick = (item: RepositoryItem) => {
        if (item.tipe === 'folder') {
            handleNavigate(item.id!, item.nama);
        } else if (item.tipe === 'file' || item.tipe === 'link') {
            if (item.url) {
                if (item.tipe === 'file') {
                    setPreviewItem(item);
                } else {
                    window.open(item.url, '_blank', 'noopener,noreferrer');
                }
            }
        }
    };

    const handleDelete = (item: RepositoryItem) => {
        setConfirmModal({
            isOpen: true,
            title: `Hapus ${item.tipe === 'folder' ? 'Folder' : item.tipe === 'file' ? 'File' : 'Tautan'}`,
            message: `Apakah Anda yakin ingin menghapus "${item.nama}"? ${item.tipe === 'folder' ? 'Folder harus kosong sebelum dihapus.' : 'Tindakan ini tidak dapat dibatalkan.'}`,
            isProcessing: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isProcessing: true }));
                const success = await repo.deleteItem(item);
                if (success) {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
                setConfirmModal(prev => ({ ...prev, isProcessing: false }));
            }
        });
    };

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedItemIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedItemIds.length === currentItems.length) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(currentItems.map(item => item.id!));
        }
    };

    const handleBulkDelete = () => {
        const itemsToDelete = currentItems.filter(item => selectedItemIds.includes(item.id!));
        if (itemsToDelete.length === 0) return;

        setConfirmModal({
            isOpen: true,
            title: `Hapus ${itemsToDelete.length} Item`,
            message: `Apakah Anda yakin ingin menghapus ${itemsToDelete.length} item yang dipilih? Folder yang ikut terhapus harus dalam keadaan kosong. Tindakan ini tidak dapat dibatalkan.`,
            isProcessing: false,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isProcessing: true }));
                let successCount = 0;
                for (const item of itemsToDelete) {
                    const success = await repo.deleteItem(item);
                    if (success) successCount++;
                }
                setConfirmModal(prev => ({ ...prev, isOpen: false, isProcessing: false }));
                setSelectedItemIds([]);
            }
        });
    };

    const handleDragOverFile = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.types.includes('Files') && repo.canCreate && activeZone !== 'trash') {
            setIsDraggingOverFile(true);
        }
    };
    
    const handleDragLeaveFile = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverFile(false);
    };
    
    const handleDropFile = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverFile(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && repo.canCreate && activeZone !== 'trash') {
            const files = Array.from(e.dataTransfer.files);
            for (const file of files) {
                await repo.uploadFile(file, currentFolderId, { visibility: 'opd' });
            }
        }
    };

    const handleDragStartInternal = (e: React.DragEvent, item: RepositoryItem) => {
        if (activeZone !== 'trash') {
            setDraggedItem(item);
            e.dataTransfer.effectAllowed = "move";
        }
    };

    const handleDragOverInternal = (e: React.DragEvent, targetFolderId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (draggedItem && draggedItem.id !== targetFolderId && repo.canManageItem(draggedItem) && activeZone !== 'trash') {
            setDragOverTargetFolderId(targetFolderId);
            e.dataTransfer.dropEffect = "move";
        }
    };

    const handleDragLeaveInternal = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverTargetFolderId(null);
    };

    const handleDropInternal = async (e: React.DragEvent, targetFolderId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverTargetFolderId(null);
        
        if (draggedItem && draggedItem.id !== targetFolderId && repo.canManageItem(draggedItem) && activeZone !== 'trash') {
            await repo.moveItem(draggedItem.id!, targetFolderId);
        }
        setDraggedItem(null);
    };

    return (
        <div 
            className="flex flex-col h-full bg-background relative overflow-hidden"
            onDragOver={handleDragOverFile}
            onDragLeave={handleDragLeaveFile}
            onDrop={handleDropFile}
        >
            {isDraggingOverFile && (
                <div className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-primary m-4 rounded-3xl">
                    <div className="text-center">
                        <UploadCloud className="w-24 h-24 mx-auto text-primary animate-bounce mb-4" />
                        <h2 className="text-3xl font-bold text-primary">Lepaskan File di Sini</h2>
                        <p className="text-muted-foreground mt-2">File akan diunggah ke folder saat ini.</p>
                    </div>
                </div>
            )}

            <SigapPageHeader 
                title="Repository Dokumen" 
                description="Pusat penyimpanan dan pengelolaan dokumen, file, dan tautan penting OPD."
                icon={FolderArchive}
            />

            <div className="flex-1 overflow-auto p-3 md:p-6 pb-[calc(4.5rem+env(safe-area-bottom,0px))] md:pb-6 space-y-4 md:space-y-6">
                
                <div className="flex flex-col gap-4">
                    <Tabs value={activeZone} onValueChange={(val) => { setActiveZone(val as any); setCurrentFolderId(null); setFolderPath([]); }}>
                        <TabsList className="grid w-full grid-cols-4 md:max-w-xl h-auto p-1 bg-muted/50 rounded-md">
                            <TabsTrigger value="opd" className="py-2 rounded-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium text-xs md:text-sm transition-all">Arsip OPD</TabsTrigger>
                            <TabsTrigger value="private" className="py-2 rounded-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium text-xs md:text-sm transition-all">Pribadi</TabsTrigger>
                            <TabsTrigger value="shared" className="py-2 rounded-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium text-xs md:text-sm transition-all">Dibagikan</TabsTrigger>
                            <TabsTrigger value="trash" className="py-2 rounded-sm data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-medium text-xs md:text-sm transition-all">Sampah</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    {activeZone === 'trash' && (
                        <div className="bg-red-50 text-red-800 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-200">
                            <Trash2 size={16} /> Item di dalam Tong Sampah akan dihapus secara permanen setelah 30 hari.
                        </div>
                    )}
                    
                    {activeZone === 'private' && (
                        <div className="w-full md:max-w-xl animate-in fade-in slide-in-from-top-2">
                            <StorageIndicator usedBytes={repo.privateStorageUsed} maxBytes={repo.PRIVATE_QUOTA_BYTES} />
                        </div>
                    )}
                </div>

                <div className="sg-filter-bar justify-between">
                    
                    <div className="w-full md:w-1/2 relative flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input 
                                placeholder="Cari dokumen, folder, atau tautan..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="pl-9 bg-background/50 border-border h-9"
                            />
                        </div>
                        <Select value={filterTipe} onValueChange={(val: any) => setFilterTipe(val)}>
                            <SelectTrigger className="w-32 bg-background/50 h-9">
                                <SelectValue placeholder="Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                <SelectItem value="folder">Folder</SelectItem>
                                <SelectItem value="file">File</SelectItem>
                                <SelectItem value="link">Tautan</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterAkses} onValueChange={(val: any) => setFilterAkses(val)}>
                            <SelectTrigger className="w-32 bg-background/50 h-9">
                                <SelectValue placeholder="Akses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Akses</SelectItem>
                                <SelectItem value="private">Privat</SelectItem>
                                <SelectItem value="opd">Internal OPD</SelectItem>
                                <SelectItem value="shared">Publik</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="flex w-full md:w-auto items-center gap-2 justify-between md:justify-end">
                        <div className="flex bg-muted/50 rounded-md p-1 mr-2">
                            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}><ListIcon size={16}/></button>
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-sm transition-all ${viewMode === 'grid' ? 'bg-background shadow-sm text-blue-600' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid size={16}/></button>
                        </div>
                        
                        {repo.canCreate && activeZone !== 'trash' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="sg-btn-primary shadow-sm"><Plus className="w-4 h-4 mr-2" /> Tambah Baru</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'folder', item: null })}>
                                        <Folder className="mr-2 h-4 w-4 text-yellow-500" /> Buat Folder
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'file', item: null })}>
                                        <FileText className="mr-2 h-4 w-4 text-blue-500" /> Unggah File Baru
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setModalState({ isOpen: true, mode: 'link', item: null })}>
                                        <LinkIcon className="mr-2 h-4 w-4 text-emerald-500" /> Tambah Tautan Luar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {selectedItemIds.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                        <div className="flex items-center gap-3">
                            <span className="text-blue-700 dark:text-blue-300 font-medium">{selectedItemIds.length} item dipilih</span>
                            <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="h-8 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40">Pilih Semua</Button>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedItemIds([])} className="h-8 text-xs text-muted-foreground hover:bg-blue-100 dark:hover:bg-blue-900/40">Batal</Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="h-8">
                                <Trash2 className="w-4 h-4 mr-2" /> Hapus Massal
                            </Button>
                        </div>
                    </div>
                )}

                {!searchTerm && activeZone !== 'trash' && (
                    <div className="px-1">
                        <RepositoryBreadcrumbs 
                            path={folderPath} 
                            onNavigate={(index) => {
                                if (index === -1) handleNavigate(null, '');
                                else handleNavigate(folderPath[index].id, folderPath[index].nama);
                            }} 
                        />
                    </div>
                )}

                {Object.keys(repo.uploadProgress).length > 0 && (
                    <div className="flex flex-col gap-2">
                        {Object.entries(repo.uploadProgress).map(([id, progress]) => (
                            <div key={id} className="bg-blue-50 border border-blue-100 p-3 rounded-md animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between text-xs text-blue-800 mb-1 font-medium">
                                    <span>Mengunggah file...</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-1.5">
                                    <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {repo.loading ? (
                    <div className="flex justify-center items-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : currentItems.length === 0 ? (
                    <SigapEmptyState 
                        icon={FolderArchive}
                        title={searchTerm ? "Pencarian Tidak Ditemukan" : "Folder Kosong"}
                        description={searchTerm ? "Coba gunakan kata kunci lain." : "Belum ada dokumen atau folder di sini."}
                        action={repo.canCreate && !searchTerm && activeZone !== 'trash' ? (
                            <Button className="sg-btn-primary" onClick={() => setModalState({ isOpen: true, mode: 'folder', item: null })}>
                                Buat Folder Pertama
                            </Button>
                        ) : undefined}
                    />
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "space-y-2"}>
                        {currentItems.map((item) => (
                            <div 
                                key={item.id}
                                draggable={repo.canManageItem(item) && activeZone !== 'trash'}
                                onDragStart={(e) => handleDragStartInternal(e, item)}
                                onDragEnd={() => setDraggedItem(null)}
                                onDragOver={(e) => item.tipe === 'folder' && handleDragOverInternal(e, item.id!)}
                                onDragLeave={(e) => item.tipe === 'folder' && handleDragLeaveInternal(e)}
                                onDrop={(e) => item.tipe === 'folder' && handleDropInternal(e, item.id!)}
                                className={`group relative sg-glass-panel sg-mobile-borderless hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 ${
                                    viewMode === 'grid' ? 'flex flex-col items-center p-4 text-center h-40 justify-center' : 'flex items-center justify-between p-3'
                                } ${dragOverTargetFolderId === item.id ? 'border-blue-500 ring-2 ring-blue-500/50 bg-blue-50 dark:bg-blue-900/20' : ''} ${selectedItemIds.includes(item.id!) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 ring-1 ring-blue-500/50' : ''}`}
                            >
                                <div className={`absolute top-2 left-2 z-10 transition-opacity ${selectedItemIds.includes(item.id!) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <div 
                                        className={`w-5 h-5 rounded-sm border flex items-center justify-center cursor-pointer transition-colors ${selectedItemIds.includes(item.id!) ? 'bg-blue-600 border-blue-600' : 'bg-background/80 border-muted-foreground hover:border-blue-600'}`}
                                        onClick={(e) => toggleSelection(e, item.id!)}
                                    >
                                        {selectedItemIds.includes(item.id!) && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleItemClick(item)} 
                                    className={`flex focus:outline-none ${viewMode === 'grid' ? 'flex-col items-center gap-3 w-full' : 'items-center gap-4 flex-1 min-w-0 text-left pl-6'}`}
                                >
                                    <div className="relative">
                                        <div className={`p-3 rounded-xl shadow-sm ${item.tipe === 'folder' ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-primary/10'}`}>
                                            {getItemIcon(item)}
                                        </div>
                                        {item.isFavorite && (
                                            <div className={`absolute ${viewMode === 'grid' ? '-top-1 -right-1' : '-top-2 -right-2'} text-yellow-400 bg-background rounded-full p-0.5 shadow-sm`}>
                                                <Star className="w-4 h-4 fill-yellow-400" />
                                            </div>
                                        )}
                                        {/* Status Icon */}
                                        <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 shadow-sm border border-border">
                                            {getVisibilityIcon(item.visibility)}
                                        </div>
                                    </div>
                                    <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'w-full px-2' : ''}`}>
                                        <div className="flex items-center gap-2 mb-1 w-full overflow-hidden">
                                            <p className={`font-semibold text-sm ${item.tipe !== 'folder' ? 'text-primary' : 'text-foreground'} truncate`} title={item.nama}>
                                                {item.nama}
                                            </p>
                                            {item.aiClassification && (
                                                <span className="hidden md:inline-flex shrink-0 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-semibold tracking-wide border border-blue-200" title={item.aiSummary}>
                                                    ✨ {item.aiClassification}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs text-muted-foreground truncate w-full ${viewMode === 'grid' ? 'mt-1' : ''}`}>
                                            {item.tipe === 'folder' 
                                                ? `${repo.items.filter(i => i.parentId === item.id).length} item` 
                                                : item.deskripsi || item.aiSummary || (item.tipe === 'link' ? item.url : 'File Dokumen')}
                                        </p>
                                        {item.tags && item.tags.length > 0 && (
                                            <div className={`flex flex-wrap gap-1 mt-1.5 ${viewMode === 'grid' ? 'justify-center' : ''}`}>
                                                {item.tags.map((tag, idx) => (
                                                    <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {viewMode === 'list' && (
                                            <div className="flex items-center gap-3 mt-1">
                                                {item.deskripsi && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{item.deskripsi}</span>}
                                                <span className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
                                                    Oleh: {repo.users.get(item.createdBy) || 'Unknown'}
                                                </span>
                                                {item.fileSize && <span className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">{(item.fileSize / 1024 / 1024).toFixed(1)} MB</span>}
                                            </div>
                                        )}
                                    </div>
                                </button>
                                
                                <div className={`${viewMode === 'grid' ? 'absolute top-2 right-2' : ''}`}>
                                    {repo.canManageItem(item) ? (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                    <MoreVertical size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {activeZone === 'trash' ? (
                                                    <>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); repo.restoreItem(item.id!); }}>
                                                            Pulihkan Item
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); repo.hardDeleteItem(item); }} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Hapus Permanen
                                                        </DropdownMenuItem>
                                                    </>
                                                ) : (
                                                    <>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); repo.toggleFavorite(item.id!, !!item.isFavorite); }}>
                                                            <Star className={`mr-2 h-4 w-4 ${item.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} /> {item.isFavorite ? 'Hapus dari Favorit' : 'Jadikan Favorit'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={async (e) => {
                                                            const url = `${window.location.origin}/dashboard/sigap/dokumen?itemId=${item.id}`;
                                                            navigator.clipboard.writeText(url);
                                                            toast.success("Tautan disalin ke clipboard!");
                                                            if (userProfile) {
                                                                await logActivity(item.id!, userProfile.namaLengkap, "Menyalin Tautan Dokumen", `Tautan disalin untuk file: ${item.nama}`, "repository");
                                                            }
                                                        }}>
                                                            <LinkIcon className="w-4 h-4 mr-2" /> Salin Tautan
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setModalState({ isOpen: true, mode: item.tipe as any, item }); }}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(item); }} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                                                            <Trash2 className="mr-2 h-4 w-4" /> Hapus ke Tong Sampah
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    ) : (
                                        item.tipe !== 'folder' && item.url && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 group-hover:opacity-100" onClick={async () => {
                                                if (userProfile) {
                                                    await logActivity(item.id!, userProfile.namaLengkap, "Mengunduh Dokumen", `Mengunduh file: ${item.nama}`, "repository");
                                                }
                                                window.open(item.url, '_blank');
                                            }}>
                                                <Download size={16} />
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            <DocumentPreviewModal
                isOpen={!!previewItem}
                onClose={() => setPreviewItem(null)}
                item={previewItem}
            />

            <RepositoryItemModal 
                isOpen={modalState.isOpen}
                mode={modalState.mode}
                itemToEdit={modalState.item}
                onClose={() => setModalState({ isOpen: false, mode: 'folder', item: null })}
                onSubmitFolder={async (nama, visibility, sharedWithOpdIds, sharedWithUsers) => {
                    if (modalState.item) {
                        await repo.updateItem(modalState.item.id!, { nama, visibility, sharedWithOpdIds, sharedWithUsers });
                    } else {
                        await repo.createFolder(nama, currentFolderId, visibility, sharedWithOpdIds, sharedWithUsers);
                    }
                }}
                onSubmitLink={async (payload) => {
                    if (modalState.item) {
                        await repo.updateItem(modalState.item.id!, payload);
                    } else {
                        await repo.createLink({ ...payload, parentId: currentFolderId });
                    }
                }}
                onSubmitFile={async (file, metadata) => {
                    if (!modalState.item) {
                        await repo.uploadFile(file, currentFolderId, metadata);
                    }
                }}
            />

            <ConfirmModal 
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onClose={() => !confirmModal.isProcessing && setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                isProcessing={confirmModal.isProcessing}
            />

        </div>
    );
}