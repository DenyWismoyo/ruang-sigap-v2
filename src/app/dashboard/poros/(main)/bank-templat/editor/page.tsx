"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, updateDoc, collection, Timestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { BankTemplate, OPD } from '@/types';
import { markdownTemplates } from '@/data/markdown-templates';
import { Save, Loader2, ArrowLeft, Building, Wand2, HelpCircle, FileText } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useToast } from '@/context/ToastContext';

const MDEditor = dynamic(() => import('@uiw/react-md-editor').then((mod) => mod.default), { ssr: false });
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

function EditorContent() {
    const { userProfile } = useUserAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const templateId = searchParams?.get('id');
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    
    const [localOpdList, setLocalOpdList] = useState<OPD[]>([]);
    
    const [formState, setFormState] = useState({ 
        judul: '', 
        url: '', 
        deskripsi: '', 
        kategori: 'Surat Keluar', 
        content: '', 
        editorMode: 'google_doc' as 'google_doc' | 'internal' 
    });
    
    const [selectedOpds, setSelectedOpds] = useState<string[]>([]);
    const [isGlobalTemplate, setIsGlobalTemplate] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                if (userProfile?.role === 'super_admin') {
                    const snap = await getDocs(collection(db, 'opd'));
                    setLocalOpdList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as OPD)));
                }

                if (templateId) {
                    const docRef = doc(db, 'bankTemplate', templateId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data() as BankTemplate;
                        setFormState({
                            judul: data.judul,
                            url: data.googleDriveUrl || '',
                            deskripsi: data.deskripsi || '',
                            kategori: data.kategori,
                            content: data.content || '',
                            editorMode: data.content ? 'internal' : 'google_doc'
                        });
                        setSelectedOpds(data.sharedWithOpdIds || []);
                        setIsGlobalTemplate(data.isGlobal || false);
                    } else {
                        addToast("Template tidak ditemukan", "error");
                        router.push('/dashboard/poros/bank-templat');
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                addToast("Gagal memuat data", "error");
            } finally {
                setLoading(false);
            }
        };

        if (userProfile) {
            fetchInitialData();
        }
    }, [templateId, userProfile, router, addToast]);

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

    const handleLoadTemplate = async (tplId: string) => {
        const tpl = markdownTemplates.find(t => t.id === tplId);
        if (!tpl) return;
        
        if (formState.content.trim().length > 0) {
            if (!window.confirm("Perhatian: Teks editor saat ini akan ditimpa oleh kerangka dasar. Lanjutkan?")) {
                return;
            }
        }
        
        let finalContent = tpl.konten;

        if (tplId !== 'kop-surat' && userProfile?.opdId) {
            try {
                const q = query(
                    collection(db, 'bankTemplate'),
                    where('opdId', '==', userProfile.opdId),
                    where('kategori', '==', 'Kop Surat Saja'),
                    limit(1)
                );
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const masterKop = snapshot.docs[0].data().content || '';
                    if (masterKop) {
                        finalContent = masterKop + '\n\n' + finalContent;
                    }
                }
            } catch (err) {
                console.error("Gagal mencari master kop surat:", err);
            }
        }
        
        setFormState(prev => ({ ...prev, content: finalContent, kategori: tpl.kategori }));
        addToast(`Kerangka "${tpl.nama}" berhasil dimuat.`, "success");
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
            
            // Ekstrak variabel dari content
            let extractedVariables: string[] = [];
            if (formState.editorMode === 'internal' && formState.content) {
                const matches = formState.content.match(/{{(.*?)}}/g);
                if (matches) {
                    extractedVariables = Array.from(new Set(matches.map(m => m.replace(/{{|}}/g, '').trim())));
                }
            }

            const payload = {
                judul: formState.judul,
                deskripsi: formState.deskripsi,
                kategori: formState.kategori,
                googleDriveUrl: formState.editorMode === 'google_doc' ? formState.url : '',
                content: formState.editorMode === 'internal' ? formState.content : '',
                variables: extractedVariables,
                opdId: userProfile.opdId,
                createdBy: userProfile.uid,
                ...superAdminPayload
            };

            if (templateId) {
                const linkRef = doc(db, 'bankTemplate', templateId);
                await updateDoc(linkRef, payload);
                addToast("Templat berhasil diperbarui.", "success");
            } else {
                await addDoc(collection(db, 'bankTemplate'), {
                    ...payload,
                    createdAt: Timestamp.now(),
                });
                addToast("Templat berhasil ditambahkan.", "success");
            }
            router.push('/dashboard/poros/bank-templat');
        } catch (error) {
            console.error("Gagal menyimpan templat:", error);
            addToast("Gagal menyimpan templat.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
        );
    }

    return (
        <div className="animate-fadeInUp max-w-6xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/poros/bank-templat')}>
                    <ArrowLeft size={18} />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">{templateId ? 'Edit Template' : 'Buat Template Baru'}</h1>
                    <p className="text-sm text-muted-foreground">Desain dan konfigurasikan template surat Anda.</p>
                </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Kolom Kiri: Metadata */}
                <div className="space-y-6 lg:col-span-1">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div>
                                <Label htmlFor="judul">Judul Template</Label>
                                <Input id="judul" value={formState.judul} onChange={e => setFormState({...formState, judul: e.target.value})} placeholder="Contoh: Surat Undangan Rapat" required/>
                            </div>
                            <div>
                                <Label htmlFor="kategori">Kategori</Label>
                                <Select value={formState.kategori} onValueChange={(value) => setFormState({...formState, kategori: value})}>
                                    <SelectTrigger id="kategori">
                                        <SelectValue placeholder="Pilih kategori surat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Surat Keluar">Surat Keluar (Umum)</SelectItem>
                                        <SelectItem value="Nota Dinas">Nota Dinas</SelectItem>
                                        <SelectItem value="Surat Keputusan (SK)">Surat Keputusan (SK)</SelectItem>
                                        <SelectItem value="Surat Tugas">Surat Tugas</SelectItem>
                                        <SelectItem value="Undangan">Undangan</SelectItem>
                                        <SelectItem value="Surat Edaran">Surat Edaran</SelectItem>
                                        <SelectItem value="Laporan">Laporan</SelectItem>
                                        <SelectItem value="Kop Surat">Kop Surat Saja</SelectItem>
                                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="deskripsi">Deskripsi (Opsional)</Label>
                                <Input id="deskripsi" value={formState.deskripsi} onChange={e => setFormState({...formState, deskripsi: e.target.value})} placeholder="Deskripsi singkat..."/>
                            </div>

                            {userProfile?.role === 'super_admin' && (
                                <div className="p-4 border rounded-lg bg-muted/30 space-y-3 mt-4">
                                    <Label className="font-bold flex items-center gap-2">
                                        <Building size={16}/> Distribusi Template
                                    </Label>
                                    
                                    <div className="flex items-center space-x-2 border-b pb-3 mb-2">
                                        <Checkbox id="global-check" checked={isGlobalTemplate} onCheckedChange={handleToggleGlobal} />
                                        <Label htmlFor="global-check" className="cursor-pointer font-semibold">Bagikan ke SEMUA OPD (Global)</Label>
                                    </div>
                                    
                                    {!isGlobalTemplate && (
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {localOpdList.map(opd => (
                                                <div key={opd.id} className="flex items-center gap-2">
                                                    <Checkbox 
                                                        id={opd.id} 
                                                        checked={selectedOpds.includes(opd.id!)} 
                                                        onCheckedChange={() => handleOpdCheckChange(opd.id!)}
                                                    />
                                                    <Label htmlFor={opd.id} className="text-sm font-normal cursor-pointer">{opd.namaOpd}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="pt-4 border-t">
                                <Button type="submit" className="w-full" disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4"/>} Simpan Template
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Kolom Kanan: Kanvas Editor */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-full flex flex-col">
                        <CardContent className="pt-6 flex-1 flex flex-col space-y-4">
                            
                            <div className="flex justify-between items-center bg-muted/50 p-2 rounded-lg">
                                <div className="flex gap-2 w-full max-w-sm">
                                    <Button type="button" variant={formState.editorMode === 'google_doc' ? 'default' : 'outline'} className="flex-1 text-xs sm:text-sm" onClick={() => setFormState({...formState, editorMode: 'google_doc'})}>
                                        Link GDocs
                                    </Button>
                                    <Button type="button" variant={formState.editorMode === 'internal' ? 'default' : 'outline'} className={`flex-1 text-xs sm:text-sm ${formState.editorMode === 'internal' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0' : ''}`} onClick={() => setFormState({...formState, editorMode: 'internal'})}>
                                        Editor Internal
                                    </Button>
                                </div>
                            </div>

                            {formState.editorMode === 'google_doc' ? (
                                <div className="space-y-4 flex-1">
                                    <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                        <HelpCircle className="h-4 w-4" />
                                        <AlertDescription className="text-sm">
                                            Pastikan dokumen Google Doc memiliki akses <strong>"Anyone with link can VIEW"</strong>.
                                        </AlertDescription>
                                    </Alert>
                                    <div className="space-y-2">
                                        <Label htmlFor="url">URL Google Document</Label>
                                        <Input id="url" value={formState.url} onChange={e => setFormState({...formState, url: e.target.value})} placeholder="https://docs.google.com/document/d/..." className="h-12"/>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col space-y-2" data-color-mode="light">
                                    <div className="flex justify-between items-center mb-1">
                                        <Label htmlFor="internal-content">Isi Template Markdown</Label>
                                        <div className="flex gap-2">
                                            <Select onValueChange={handleLoadTemplate}>
                                                <SelectTrigger className="h-8 w-[180px] bg-white text-xs">
                                                    <FileText className="w-3 h-3 mr-2" />
                                                    <SelectValue placeholder="Muat Kerangka Dasar" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {markdownTemplates.map(t => (
                                                        <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>

                                            <Button type="button" size="sm" variant="outline" className="h-8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200" onClick={handleOptimizeAI} disabled={isProcessingAI}>
                                                {isProcessingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Wand2 className="w-4 h-4 mr-2"/>}
                                                Sempurnakan dengan AI
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-2 items-center">
                                        <span className="text-xs text-muted-foreground mr-2">Pintas Variabel:</span>
                                        {['no_surat', 'tanggal', 'nama_pegawai', 'nip_pegawai', 'jabatan', 'tempat', 'acara', 'perihal', 'kepada'].map(v => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => setFormState(prev => ({...prev, content: prev.content + ` {{${v}}}`}))}
                                                className="px-2 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 border rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-mono"
                                            >
                                                {`{{${v}}}`}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex-1 min-h-[500px]">
                                        <MDEditor
                                            value={formState.content}
                                            onChange={(val) => setFormState({ ...formState, content: val || '' })}
                                            height={500}
                                            className="w-full h-full overflow-hidden rounded-lg shadow-sm border"
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
}

export default function TemplateEditorPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-[60vh]"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>}>
            <EditorContent />
        </Suspense>
    );
}
