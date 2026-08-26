import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, UploadCloud, Link as LinkIcon, Folder } from 'lucide-react';
import { RepositoryItem, OPD, UserProfile } from '@/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserAuth } from '@/context/AuthContext';

interface RepositoryItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'folder' | 'file' | 'link';
    itemToEdit?: RepositoryItem | null;
    onSubmitFolder: (nama: string, visibility: 'private' | 'opd' | 'shared', sharedWithOpdIds: string[], sharedWithUsers: string[]) => Promise<void>;
    onSubmitLink: (payload: Partial<RepositoryItem>) => Promise<void>;
    onSubmitFile: (file: File, metadata: { deskripsi?: string; tags?: string[]; visibility: 'private' | 'opd' | 'shared'; sharedWithOpdIds: string[]; sharedWithUsers: string[] }) => Promise<void>;
}

export default function RepositoryItemModal({
    isOpen, onClose, mode, itemToEdit, 
    onSubmitFolder, onSubmitLink, onSubmitFile
}: RepositoryItemModalProps) {
    const { userProfile } = useUserAuth();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form States
    const [nama, setNama] = useState('');
    const [url, setUrl] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [visibility, setVisibility] = useState<'private' | 'opd' | 'shared'>('opd');
    const [tagsInput, setTagsInput] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [sharedWithOpdIds, setSharedWithOpdIds] = useState<string[]>([]);
    const [sharedWithUsers, setSharedWithUsers] = useState<string[]>([]);
    
    const [opdList, setOpdList] = useState<OPD[]>([]);
    const [isLoadingOpds, setIsLoadingOpds] = useState(false);

    const [userList, setUserList] = useState<UserProfile[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setNama(itemToEdit.nama);
                setUrl(itemToEdit.url || '');
                setDeskripsi(itemToEdit.deskripsi || '');
                setVisibility(itemToEdit.visibility || 'opd');
                setTagsInput(itemToEdit.tags ? itemToEdit.tags.join(', ') : '');
                setSharedWithOpdIds(itemToEdit.sharedWithOpdIds || []);
                setSharedWithUsers(itemToEdit.sharedWithUsers || []);
            } else {
                setNama('');
                setUrl('');
                setDeskripsi('');
                setVisibility('opd');
                setTagsInput('');
                setFile(null);
                setSharedWithOpdIds([]);
                setSharedWithUsers([]);
            }
        }
    }, [isOpen, itemToEdit]);

    useEffect(() => {
        if (visibility === 'shared' && opdList.length === 0) {
            setIsLoadingOpds(true);
            getDocs(collection(db, 'opd')).then(snap => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as OPD));
                setOpdList(list.filter(opd => opd.id !== userProfile?.opdId));
                setIsLoadingOpds(false);
            }).catch(err => {
                console.error(err);
                setIsLoadingOpds(false);
            });
        }
        
        if ((visibility === 'shared' || visibility === 'private') && userList.length === 0 && userProfile?.opdId) {
            setIsLoadingUsers(true);
            const qUsers = query(collection(db, 'users'), where('opdId', '==', userProfile.opdId), where('status', '==', 'aktif'));
            getDocs(qUsers).then(snap => {
                const list = snap.docs.map(d => d.data() as UserProfile);
                setUserList(list.filter(u => u.uid !== userProfile.uid));
                setIsLoadingUsers(false);
            }).catch(err => {
                console.error(err);
                setIsLoadingUsers(false);
            });
        }
    }, [visibility, opdList.length, userList.length, userProfile?.opdId, userProfile?.uid]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selected = e.target.files[0];
            setFile(selected);
            if (!nama) setNama(selected.name); // Auto fill name
        }
    };

    const toggleOpdSelection = (opdId: string) => {
        setSharedWithOpdIds(prev => 
            prev.includes(opdId) ? prev.filter(id => id !== opdId) : [...prev, opdId]
        );
    };

    const toggleUserSelection = (uid: string) => {
        setSharedWithUsers(prev => 
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (visibility === 'shared' && sharedWithOpdIds.length === 0) {
            alert("Silakan pilih minimal 1 OPD tujuan untuk dibagikan.");
            return;
        }

        setIsSubmitting(true);
        try {
            const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
            const finalSharedIds = visibility === 'shared' ? sharedWithOpdIds : [];
            const finalSharedUsers = (visibility === 'shared' || visibility === 'private') ? sharedWithUsers : [];

            if (mode === 'folder') {
                await onSubmitFolder(nama, visibility, finalSharedIds, finalSharedUsers);
            } else if (mode === 'link') {
                await onSubmitLink({ nama, url, deskripsi, visibility, tags: tagsArray, sharedWithOpdIds: finalSharedIds, sharedWithUsers: finalSharedUsers });
            } else if (mode === 'file') {
                if (!file && !itemToEdit) {
                    alert("Silakan pilih file terlebih dahulu");
                    setIsSubmitting(false);
                    return;
                }
                
                if (file) {
                    await onSubmitFile(file, { deskripsi, visibility, tags: tagsArray, sharedWithOpdIds: finalSharedIds, sharedWithUsers: finalSharedUsers });
                } else if (itemToEdit) {
                    // Edit file metadata only
                    await onSubmitLink({ nama, deskripsi, visibility, tags: tagsArray, sharedWithOpdIds: finalSharedIds, sharedWithUsers: finalSharedUsers });
                }
            }
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {mode === 'folder' && <Folder className="text-yellow-500"/>}
                        {mode === 'file' && <UploadCloud className="text-blue-500"/>}
                        {mode === 'link' && <LinkIcon className="text-green-500"/>}
                        {itemToEdit ? `Edit ${mode}` : `Tambah ${mode === 'folder' ? 'Folder' : mode === 'file' ? 'File' : 'Tautan'}`}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    
                    {mode === 'file' && !itemToEdit && (
                        <div className="space-y-2">
                            <Label>Pilih File</Label>
                            <Input type="file" onChange={handleFileChange} required className="cursor-pointer" />
                            {file && <p className="text-xs text-muted-foreground">Terpilih: {file.name} ({(file.size / (1024*1024)).toFixed(2)} MB)</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>{mode === 'folder' ? 'Nama Folder' : 'Judul / Nama'}</Label>
                        <Input value={nama} onChange={e => setNama(e.target.value)} required placeholder={mode === 'folder' ? 'Cth: Laporan Keuangan 2025' : 'Masukkan judul...'} />
                    </div>

                    {mode === 'link' && (
                        <div className="space-y-2">
                            <Label>URL / Tautan Eksternal</Label>
                            <Input type="url" value={url} onChange={e => setUrl(e.target.value)} required placeholder="https://drive.google.com/..." />
                        </div>
                    )}

                    {(mode === 'link' || mode === 'file') && (
                        <div className="space-y-2">
                            <Label>Deskripsi Singkat</Label>
                            <Textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)} placeholder="Opsional..." rows={3} />
                        </div>
                    )}

                    {(mode === 'link' || mode === 'file') && (
                        <div className="space-y-2">
                            <Label>Label / Kategori (Opsional)</Label>
                            <Input 
                                placeholder="Cth: Penting, Keuangan, 2026 (Pisahkan dengan koma)" 
                                value={tagsInput} 
                                onChange={(e) => setTagsInput(e.target.value)} 
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Hak Akses / Visibilitas</Label>
                        <Select value={visibility} onValueChange={(val: any) => setVisibility(val)}>
                            <SelectTrigger className="w-full rounded-md">
                                <SelectValue placeholder="Pilih hak akses" />
                            </SelectTrigger>
                            <SelectContent position="popper" className="z-[1050] max-h-[300px]">
                                <SelectItem value="opd">Internal OPD Saja</SelectItem>
                                <SelectItem value="private">Privat (Hanya Saya)</SelectItem>
                                <SelectItem value="shared">Publik / Bagikan ke OPD Lain</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            {visibility === 'opd' && "Dokumen dapat dilihat oleh seluruh pegawai di OPD Anda."}
                            {visibility === 'private' && "Dokumen hanya dapat dilihat oleh Anda sendiri."}
                            {visibility === 'shared' && "Pilih OPD mana saja yang dapat melihat dokumen ini."}
                        </p>
                    </div>

                    {visibility === 'shared' && (
                        <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                            <Label>Pilih OPD Tujuan (Opsional)</Label>
                            {isLoadingOpds ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Memuat data OPD...
                                </div>
                            ) : (
                                <ScrollArea className="h-[120px] pr-4">
                                    <div className="space-y-2 pt-1">
                                        {opdList.map((opd) => (
                                            <div key={opd.id} className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer" onClick={() => toggleOpdSelection(opd.id!)}>
                                                <Checkbox
                                                    checked={sharedWithOpdIds.includes(opd.id!)}
                                                    onCheckedChange={() => toggleOpdSelection(opd.id!)}
                                                    className="mt-0.5"
                                                />
                                                <div className="space-y-1 flex-1 leading-none">
                                                    <Label className="text-sm font-medium cursor-pointer">
                                                        {opd.namaOpd}
                                                    </Label>
                                                </div>
                                            </div>
                                        ))}
                                        {opdList.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">Tidak ada OPD lain yang tersedia.</p>
                                        )}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    )}

                    {(visibility === 'shared' || visibility === 'private') && (
                        <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                            <Label>Bagikan Spesifik ke Pegawai di OPD (Opsional)</Label>
                            {isLoadingUsers ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                    <Loader2 className="w-4 h-4 animate-spin" /> Memuat data Pegawai...
                                </div>
                            ) : (
                                <ScrollArea className="h-[120px] pr-4">
                                    <div className="space-y-2 pt-1">
                                        {userList.map((user) => (
                                            <div key={user.uid} className="flex flex-row items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors cursor-pointer" onClick={() => toggleUserSelection(user.uid)}>
                                                <Checkbox
                                                    checked={sharedWithUsers.includes(user.uid)}
                                                    onCheckedChange={() => toggleUserSelection(user.uid)}
                                                    className="mt-0.5"
                                                />
                                                <div className="flex flex-col">
                                                    <Label className="text-sm font-medium cursor-pointer">{user.namaLengkap}</Label>
                                                    <span className="text-xs text-muted-foreground">{user.jabatanId}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {userList.length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-4">Tidak ada pegawai lain di OPD Anda.</p>
                                        )}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    )}

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
                        <Button type="submit" className="bg-gradient-to-r from-[var(--nk-teal-mid)] to-[var(--nk-teal-dark)] text-white shadow-md hover:shadow-lg border-0 transition-all" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Menyimpan...</> : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
