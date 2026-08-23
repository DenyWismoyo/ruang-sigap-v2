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
import { Loader2, UploadCloud, Link as LinkIcon, Folder } from 'lucide-react';
import { RepositoryItem } from '@/types';

interface RepositoryItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'folder' | 'file' | 'link';
    itemToEdit?: RepositoryItem | null;
    onSubmitFolder: (nama: string, visibility: 'private' | 'opd' | 'shared') => Promise<void>;
    onSubmitLink: (payload: Partial<RepositoryItem>) => Promise<void>;
    onSubmitFile: (file: File, metadata: { deskripsi?: string; tags?: string[]; visibility: 'private' | 'opd' | 'shared' }) => Promise<void>;
}

export default function RepositoryItemModal({
    isOpen, onClose, mode, itemToEdit, 
    onSubmitFolder, onSubmitLink, onSubmitFile
}: RepositoryItemModalProps) {
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form States
    const [nama, setNama] = useState('');
    const [url, setUrl] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [visibility, setVisibility] = useState<'private' | 'opd' | 'shared'>('opd');
    const [tagsInput, setTagsInput] = useState('');
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setNama(itemToEdit.nama);
                setUrl(itemToEdit.url || '');
                setDeskripsi(itemToEdit.deskripsi || '');
                setVisibility(itemToEdit.visibility || 'opd');
                setTagsInput(itemToEdit.tags ? itemToEdit.tags.join(', ') : '');
            } else {
                setNama('');
                setUrl('');
                setDeskripsi('');
                setVisibility('opd');
                setTagsInput('');
                setFile(null);
            }
        }
    }, [isOpen, itemToEdit]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selected = e.target.files[0];
            if (selected.size > 10 * 1024 * 1024) {
                alert("Maksimal ukuran file adalah 10 MB.");
                e.target.value = '';
                return;
            }
            setFile(selected);
            if (!nama) setNama(selected.name); // Auto fill name
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);

            if (mode === 'folder') {
                await onSubmitFolder(nama, visibility);
            } else if (mode === 'link') {
                await onSubmitLink({ nama, url, deskripsi, visibility, tags: tagsArray });
            } else if (mode === 'file') {
                if (!file && !itemToEdit) {
                    alert("Silakan pilih file terlebih dahulu");
                    setIsSubmitting(false);
                    return;
                }
                
                if (file) {
                    await onSubmitFile(file, { deskripsi, visibility, tags: tagsArray });
                } else if (itemToEdit) {
                    // Edit file metadata only
                    await onSubmitLink({ nama, deskripsi, visibility, tags: tagsArray });
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
                            <Label>Pilih File (Max 10MB)</Label>
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
                                <SelectItem value="shared">Publik / Dibagikan</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            {visibility === 'opd' && "Dokumen dapat dilihat oleh seluruh pegawai di OPD Anda."}
                            {visibility === 'private' && "Dokumen hanya dapat dilihat oleh Anda sendiri."}
                            {visibility === 'shared' && "Dokumen dapat dilihat oleh pihak luar yang diizinkan."}
                        </p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
                        <Button type="submit" className="sg-btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Menyimpan...</> : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
