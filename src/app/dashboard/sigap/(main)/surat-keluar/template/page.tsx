// Lokasi: src/app/dashboard/bank-templat/page.tsx
// [MODIFIKASI PANDUAN LENGKAP]
// - Memperbarui TemplateGuideModal dengan daftar variabel yang sangat lengkap.
// - Mengelompokkan variabel (Pokok, Penandatangan, Undangan/Khusus).
// - Menambahkan tips "Variabel Kustom".

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp, orderBy, getDocs, or } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { BankTemplate, OPD } from '@/types';
import { Plus, Search, Edit, Trash2, Save, Building, FileText, ExternalLink, Files, HelpCircle, Loader2, CheckSquare, Square, BookOpen, Copy, Check, AlertTriangle, Send, Eye, Wand2 } from 'lucide-react';
import ConfirmModal from '@/app/dashboard/sigap/components/ConfirmModal'; 
import SigapEmptyState from '@/app/dashboard/sigap/components/SigapEmptyState';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MDEditor = dynamic(() => import('@uiw/react-md-editor').then((mod) => mod.default), { ssr: false });
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// --- Impor Komponen Shadcn ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  CardContent,
} from "@/components/ui/card";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from '@/context/ToastContext'; // Impor Toast

// --- Komponen Modal Panduan Variabel (DIPERBARUI) ---
const TemplateGuideModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const { addToast } = useToast();
    
    // Daftar variabel dikelompokkan
    const variableGroups = [
        {
            title: "Data Pokok Surat",
            vars: [
                { code: '{{no_surat}}', desc: 'Nomor Surat (Contoh: 800/123/2024)' },
                { code: '{{sifat}}', desc: 'Sifat (Biasa/Penting/Rahasia)' },
                { code: '{{lampiran}}', desc: 'Jumlah lampiran' },
                { code: '{{perihal}}', desc: 'Perihal / Hal surat' },
                { code: '{{kepada}}', desc: 'Nama/Jabatan Tujuan' },
                { code: '{{di_tempat}}', desc: 'Lokasi Tujuan (Contoh: di Tempat)' },
                { code: '{{tanggal}}', desc: 'Tanggal Surat (Format: 20 Mei 2025)' },
                { code: '{{isi_surat}}', desc: 'Isi Paragraf Utama' },
                { code: '{{penutup}}', desc: 'Kalimat Penutup' },
            ]
        },
        {
            title: "Penandatangan",
            vars: [
                { code: '{{nama_pengirim}}', desc: 'Nama Pejabat' },
                { code: '{{nip_pengirim}}', desc: 'NIP Pejabat' },
                { code: '{{jabatan_pengirim}}', desc: 'Jabatan Pejabat (Kop TTD)' },
            ]
        },
        {
            title: "Variabel Khusus (Opsional)",
            vars: [
                { code: '{{hari}}', desc: 'Hari Acara (Misal: Senin)' },
                { code: '{{waktu}}', desc: 'Waktu Acara (Misal: 09.00 WIB)' },
                { code: '{{tempat}}', desc: 'Tempat Acara' },
                { code: '{{acara}}', desc: 'Nama Kegiatan/Acara' },
                { code: '{{kustom_1}}', desc: 'Anda bisa buat variabel sendiri!' },
            ]
        }
    ];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast(`Kode ${text} disalin!`, 'success');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl bg-card border-border flex flex-col max-h-[90vh] p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/30">
                    <DialogTitle className="flex items-center text-xl">
                        <BookOpen className="mr-2 text-blue-600" />
                        Panduan & Daftar Kode Variabel (Placeholder)
                    </DialogTitle>
                    <DialogDescription>
                        Gunakan kode ini di dalam Google Doc Anda agar sistem dapat mengisinya secara otomatis.
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm">
                            <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 text-base">Cara Kerja "Template Pintar":</h4>
                            <ol className="list-decimal pl-5 space-y-2 text-blue-700 dark:text-blue-200">
                                <li>Buka file Template di <strong>Google Docs</strong>.</li>
                                <li>Di tempat yang datanya ingin diubah otomatis, ketik kode dalam kurung kurawal ganda. <br/>Contoh: <em>"Yth. {'{{kepada}}'} di Tempat"</em>.</li>
                                <li>Sistem akan mencari teks <code>{'{{kepada}}'}</code> dan menggantinya dengan inputan dari form "Buat Surat".</li>
                                <li><strong>FITUR BARU:</strong> Anda bebas membuat kode sendiri (misal: <code>{'{{nama_pelanggar}}'}</code>) dan menambahkannya saat mengisi form surat nanti!</li>
                            </ol>
                        </div>

                        <div className="space-y-6">
                            {variableGroups.map((group, idx) => (
                                <div key={idx}>
                                    <h4 className="font-bold text-foreground mb-3 border-b pb-1 border-border">{group.title}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {group.vars.map((v, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => copyToClipboard(v.code)}
                                                className="flex flex-col justify-center p-3 rounded-lg border border-border bg-card hover:bg-accent cursor-pointer group transition-all hover:border-primary shadow-sm"
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <code className="text-sm font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{v.code}</code>
                                                    <Copy size={14} className="text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-xs text-muted-foreground">{v.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </ScrollArea>
                <DialogFooter className="p-4 border-t border-border bg-muted/30">
                    <Button onClick={onClose}>Tutup Panduan</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// ... (SISA KODE: Komponen Utama BankTemplatePage sama seperti sebelumnya, pastikan TemplateGuideModal dipanggil dengan benar) ...

// --- Komponen Utama ---
export default function BankTemplatePage() {
    const { userProfile } = useUserAuth();
    const router = useRouter();
    
    // ... (State dan Fetch Logic sama seperti file sebelumnya) ...
    const [localOpdList, setLocalOpdList] = useState<OPD[]>([]);
    const [opdTemplates, setOpdTemplates] = useState<BankTemplate[]>([]);
    const [sharedTemplates, setSharedTemplates] = useState<BankTemplate[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<BankTemplate | null>(null);
    const [formState, setFormState] = useState({ judul: '', url: '', deskripsi: '', kategori: 'Surat Keluar', content: '', editorMode: 'google_doc' as 'google_doc' | 'internal', useKopSuratOpd: true });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    
    const [selectedOpds, setSelectedOpds] = useState<string[]>([]);
    const [isGlobalTemplate, setIsGlobalTemplate] = useState(false);
    
    const [isGuideOpen, setIsGuideOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isProcessing?: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    const isAdmin = useMemo(() => userProfile?.role === 'admin_opd' || userProfile?.role === 'staf_tu' || userProfile?.role === 'super_admin', [userProfile]);

    const { addToast } = useToast();

    useEffect(() => {
        if (!userProfile?.opdId) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const qOpd = query(collection(db, 'bankTemplate'), where('opdId', '==', userProfile.opdId), orderBy('createdAt', 'desc'));
        const unsubscribeOpd = onSnapshot(qOpd, (snap) => {
            setOpdTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankTemplate)));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching OPD templates:", error);
            setLoading(false);
        });

        const qShared = query(
            collection(db, 'bankTemplate'), 
            or(
                where('sharedWithOpdIds', 'array-contains', userProfile.opdId),
                where('isGlobal', '==', true)
            )
        );
        const unsubscribeShared = onSnapshot(qShared, (snap) => {
            const sharedData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankTemplate));
            setSharedTemplates(sharedData.filter(t => t.opdId !== userProfile.opdId));
        }, (error) => {
            console.error("Error fetching shared templates:", error);
        });

        if (userProfile.role === 'super_admin') {
            getDocs(collection(db, 'opd')).then(snap => {
                setLocalOpdList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OPD)));
            }).catch(error => {
                console.error("Error fetching OPD list:", error);
            });
        }

        return () => {
            unsubscribeOpd();
            unsubscribeShared();
        };
    }, [userProfile]);

    const allTemplates = useMemo(() => {
        let combined = [...opdTemplates, ...sharedTemplates];
        if (searchTerm) {
            combined = combined.filter(t => 
                t.judul.toLowerCase().includes(searchTerm.toLowerCase()) || 
                t.kategori.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return combined;
    }, [opdTemplates, sharedTemplates, searchTerm]);

    const openModal = (template: BankTemplate | null) => {
        setTemplateToEdit(template);
        setFormState(template ? { 
            judul: template.judul, 
            url: template.googleDriveUrl || '', 
            deskripsi: template.deskripsi || '', 
            kategori: template.kategori,
            content: template.content || '',
            editorMode: template.content ? 'internal' : 'google_doc',
            useKopSuratOpd: template.useKopSuratOpd !== false
        } : { judul: '', url: '', deskripsi: '', kategori: 'Surat Keluar', content: '', editorMode: 'google_doc', useKopSuratOpd: true });
        setSelectedOpds(template?.sharedWithOpdIds || []);
        setIsGlobalTemplate(template?.isGlobal || false); 
        setIsModalOpen(true);
    };

    const handleToggleGlobal = (checked: boolean) => {
        setIsGlobalTemplate(checked);
        if (checked) {
            setSelectedOpds(localOpdList.map(opd => opd.id!));
        } else {
            setSelectedOpds([]);
        }
    };

    const handleOpdCheckChange = (opdId: string) => {
        if (selectedOpds.includes(opdId)) {
            setSelectedOpds(prev => prev.filter(id => id !== opdId));
            setIsGlobalTemplate(false); 
        } else {
            setSelectedOpds(prev => [...prev, opdId]);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile || !formState.judul || !formState.kategori) {
            addToast("Judul dan Kategori wajib diisi.", "error");
            return;
        }

        if (formState.editorMode === 'google_doc' && !formState.url) {
            addToast("Link Google Docs wajib diisi jika mode Google Doc dipilih.", "error");
            return;
        }

        if (formState.editorMode === 'google_doc' && formState.url && !formState.url.includes('docs.google.com/document')) {
             addToast("Harap masukkan Link Google Docs yang valid (https://docs.google.com/document/d/...).", "error");
             return;
        }

        setIsProcessing(true);
        try {
            const superAdminPayload = userProfile.role === 'super_admin' ? { 
                sharedWithOpdIds: selectedOpds,
                isGlobal: isGlobalTemplate
            } : {};
            
            const payload = {
                judul: formState.judul,
                deskripsi: formState.deskripsi,
                kategori: formState.kategori,
                googleDriveUrl: formState.editorMode === 'google_doc' ? formState.url : '',
                content: formState.editorMode === 'internal' ? formState.content : '',
                useKopSuratOpd: formState.useKopSuratOpd, // NEW
                opdId: userProfile.opdId,
                createdBy: userProfile.uid,
                ...superAdminPayload
            };

            if (templateToEdit) {
                const linkRef = doc(db, 'bankTemplate', templateToEdit.id!);
                await updateDoc(linkRef, payload);
                addToast("Templat berhasil diperbarui.", "success");
            } else {
                await addDoc(collection(db, 'bankTemplate'), {
                    ...payload,
                    createdAt: Timestamp.now(),
                });
                addToast("Templat berhasil ditambahkan.", "success");
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Gagal menyimpan templat:", error);
            addToast("Gagal menyimpan templat.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Template',
            message: 'Apakah Anda yakin ingin menghapus templat ini?',
            onConfirm: async () => {
                setConfirmModal(prev => ({...prev, isProcessing: true}));
                try {
                    await deleteDoc(doc(db, 'bankTemplate', id));
                    addToast("Templat berhasil dihapus.", "success");
                } catch (error) {
                    console.error(error);
                    addToast("Gagal menghapus templat.", "error");
                } finally {
                     setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, isProcessing: false });
                }
            }
        });
    };

    const handleOptimizeAI = async () => {
        if (!formState.content) {
            addToast("Isi template internal masih kosong.", "error");
            return;
        }
        setIsProcessingAI(true);
        try {
            const res = await fetch('/api/ai/grammar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: formState.content })
            });

            const data = await res.json();
            if (res.ok && data.content) {
                setFormState(prev => ({ ...prev, content: data.content }));
                addToast("Tata bahasa berhasil disempurnakan oleh AI!", "success");
            } else {
                throw new Error(data.error || "Terjadi kesalahan pada AI.");
            }
        } catch (error: any) {
            console.error(error);
            addToast(error.message || "Gagal menghubungi layanan AI.", "error");
        } finally {
            setIsProcessingAI(false);
        }
    };
    
    return (
        <div className="animate-fadeInUp">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <Files size={28} className="mr-3 text-green-600"/>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Bank Template & Kop Surat</h1>
                        <p className="text-sm text-muted-foreground">Kelola template surat dinas. Admin OPD upload Kop Surat masing-masing di sini.</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input 
                            placeholder="Cari nama template..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-9 bg-background/50 border-border"
                        />
                    </div>
                    <Button variant="outline" onClick={() => setIsGuideOpen(true)}>
                        <BookOpen size={18} className="mr-2"/> Panduan & Variabel
                    </Button>
                    {isAdmin && (
                        <Button onClick={() => router.push('/dashboard/sigap/surat-keluar/template/editor')} className="bg-green-600 hover:bg-green-700">
                            <Plus size={18} className="mr-2"/> Tambah Template
                        </Button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="animate-spin h-8 w-8 text-primary" />
                </div>
            ) : allTemplates.length === 0 ? (
                <SigapEmptyState 
                    icon={Files}
                    title={searchTerm ? "Pencarian Tidak Ditemukan" : "Belum Ada Template"}
                    description={searchTerm ? "Coba gunakan kata kunci lain." : "Tambahkan template baru untuk mempermudah pembuatan surat."}
                    action={isAdmin && !searchTerm ? (
                        <Button className="bg-green-600 hover:bg-green-700 mt-4" onClick={() => router.push('/dashboard/sigap/surat-keluar/template/editor')}>
                            <Plus size={18} className="mr-2"/> Buat Template Pertama
                        </Button>
                    ) : undefined}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                    {allTemplates.map(template => {
                        const isShared = template.opdId !== userProfile?.opdId;
                        return (
                            <Card key={template.id} className={`flex flex-col justify-between border-l-4 ${isShared ? 'border-l-purple-500 bg-purple-50/10 dark:bg-purple-900/10' : 'border-l-blue-500'}`}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="min-w-0 flex-1 pr-2">
                                            <CardTitle className="text-lg truncate" title={template.judul}>{template.judul}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <span className="bg-muted px-2 py-0.5 rounded text-xs font-semibold">{template.kategori}</span>
                                                {isShared && <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-0.5 rounded text-xs">Global</span>}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                {template.deskripsi && (
                                    <CardContent className="py-0 text-sm text-muted-foreground pb-4 line-clamp-2" title={template.deskripsi}>
                                        {template.deskripsi}
                                    </CardContent>
                                )}
                                <CardFooter className="flex flex-col sm:flex-row justify-between gap-2 border-t pt-4 bg-muted/20">
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <Button size="sm" className="w-full sm:w-auto" onClick={() => router.push(`/dashboard/sigap/surat-keluar/buat?templateId=${template.id}`)}>
                                            <Send size={14} className="mr-2"/> Gunakan
                                        </Button>
                                        
                                        {template.googleDriveUrl && (
                                            <Button variant="outline" size="sm" onClick={() => setPreviewUrl(template.googleDriveUrl!)} className="w-full sm:w-auto px-2" title="Pratinjau Google Doc">
                                                <Eye size={16}/>
                                            </Button>
                                        )}
                                        {template.googleDriveUrl && (
                                            <Button variant="outline" size="sm" asChild className="w-full sm:w-auto px-2" title="Buka di Tab Baru">
                                                <a href={template.googleDriveUrl} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink size={16}/>
                                                </a>
                                            </Button>
                                        )}
                                        {template.content && (
                                            <Button variant="outline" size="sm" onClick={() => {
                                                router.push(`/dashboard/sigap/surat-keluar/template/editor?id=${template.id}`);
                                            }} className="w-full sm:w-auto px-2" title="Lihat Teks Internal">
                                                <FileText size={16}/>
                                            </Button>
                                        )}
                                    </div>
                                    {(userProfile?.role === 'super_admin' || userProfile?.opdId === template.opdId) && (
                                        <div className="flex gap-1 self-end sm:self-auto">
                                            <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/sigap/surat-keluar/template/editor?id=${template.id}`)} title="Edit">
                                                <Edit size={16} className="text-yellow-600"/>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id!)} title="Hapus">
                                                <Trash2 size={16} className="text-red-600"/>
                                            </Button>
                                        </div>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            
            <TemplateGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

            {/* Modal Preview Iframe */}
            <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
                <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col bg-background/95 backdrop-blur-sm border-border">
                    <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between">
                        <div>
                            <DialogTitle>Pratinjau Template</DialogTitle>
                            <DialogDescription>Melihat isi dokumen Google Docs langsung dari aplikasi.</DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 relative bg-white overflow-hidden rounded-b-lg">
                        {previewUrl && (
                            <iframe 
                                src={previewUrl.replace('/edit', '/preview')} 
                                className="w-full h-full border-0 absolute inset-0"
                                allow="autoplay"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({...prev, isOpen: false}))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                isProcessing={confirmModal.isProcessing}
            />
        </div>
    );
}