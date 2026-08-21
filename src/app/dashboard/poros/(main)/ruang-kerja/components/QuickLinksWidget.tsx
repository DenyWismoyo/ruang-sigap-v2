"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, orderBy, limit, getDocs, addDoc, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { PersonalLink } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link as LinkIcon, Plus, Trash2, Loader2, Globe, ExternalLink, Sparkles } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/context/ToastContext';

const RECOMMENDED_AI_LINKS = [
    { id: 'ai-1', judul: 'ChatGPT', url: 'https://chatgpt.com/', deskripsi: 'Asisten AI Serbaguna (Drafting & Ide)', iconUrl: 'https://chatgpt.com/favicon.ico' },
    { id: 'ai-2', judul: 'Google Gemini', url: 'https://gemini.google.com/', deskripsi: 'Analisis Data & Ekosistem Google', iconUrl: 'https://www.gstatic.com/lamda/images/favicon_v1_150160cddff7f294ce30.svg' },
    { id: 'ai-3', judul: 'Claude', url: 'https://claude.ai/', deskripsi: 'Analisis Dokumen Panjang & PDF', iconUrl: 'https://claude.ai/favicon.ico' },
    { id: 'ai-4', judul: 'Perplexity AI', url: 'https://www.perplexity.ai/', deskripsi: 'Riset dengan Sumber & Referensi', iconUrl: 'https://www.perplexity.ai/favicon.ico' },
    { id: 'ai-5', judul: 'DeepL', url: 'https://www.deepl.com/translator', deskripsi: 'Penerjemah Dokumen Akurat', iconUrl: 'https://www.deepl.com/favicon.ico' },
    { id: 'ai-6', judul: 'NotebookLM', url: 'https://notebooklm.google.com/', deskripsi: 'Asisten Riset Dokumen & Catatan', iconUrl: 'https://notebooklm.google.com/favicon.ico' },
    { id: 'ai-7', judul: 'Gamma App', url: 'https://gamma.app/', deskripsi: 'Pembuatan Presentasi Otomatis', iconUrl: 'https://gamma.app/favicon.ico' },
    { id: 'ai-8', judul: 'Tome', url: 'https://tome.app/', deskripsi: 'Storytelling & Presentasi Interaktif', iconUrl: 'https://tome.app/favicon.ico' },
    { id: 'ai-9', judul: 'Canva Magic Studio', url: 'https://www.canva.com/', deskripsi: 'Desain Grafis dengan AI', iconUrl: 'https://www.canva.com/favicon.ico' },
    { id: 'ai-10', judul: 'QuillBot', url: 'https://quillbot.com/', deskripsi: 'Parafrase & Perbaikan Kalimat', iconUrl: 'https://quillbot.com/favicon.ico' },
    { id: 'ai-11', judul: 'Grammarly', url: 'https://www.grammarly.com/', deskripsi: 'Koreksi Tata Bahasa Otomatis', iconUrl: 'https://www.grammarly.com/favicon.ico' },
    { id: 'ai-12', judul: 'Consensus', url: 'https://consensus.app/', deskripsi: 'Pencarian Jurnal Riset Akademis', iconUrl: 'https://consensus.app/favicon.ico' },
    { id: 'ai-13', judul: 'ChatPDF', url: 'https://www.chatpdf.com/', deskripsi: 'Tanya Jawab File PDF', iconUrl: 'https://www.chatpdf.com/favicon.ico' },
    { id: 'ai-14', judul: 'Otter.ai', url: 'https://otter.ai/', deskripsi: 'Transkripsi & Notulensi Rapat', iconUrl: 'https://otter.ai/favicon.ico' },
    { id: 'ai-15', judul: 'Microsoft Copilot', url: 'https://copilot.microsoft.com/', deskripsi: 'AI Terintegrasi Office & Web', iconUrl: 'https://copilot.microsoft.com/favicon.ico' },
];
import { motion } from 'framer-motion';

export default function QuickLinksWidget() {
    const { userProfile } = useUserAuth();
    const { addToast } = useToast();
    
    
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newLink, setNewLink] = useState({ judul: '', url: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const queryClient = useQueryClient();
    const { data: links = [], isLoading: loading } = useQuery({
        queryKey: ['personalLinks', userProfile?.uid],
        queryFn: async () => {
            if (!userProfile?.uid) return [];
            const q = query(
                collection(db, 'personalLinks'), 
                where('userId', '==', userProfile.uid),
                orderBy('createdAt', 'desc'),
                limit(10)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PersonalLink));
        },
        enabled: !!userProfile?.uid,
        staleTime: 1000 * 60 * 5, // 5 menit cache
    });

    const handleAddLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLink.judul || !newLink.url || !userProfile) return;

        // Auto-fix URL jika lupa http/https
        let urlToSave = newLink.url;
        if (!/^https?:\/\//i.test(urlToSave)) {
            urlToSave = 'https://' + urlToSave;
        }

        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'personalLinks'), {
                userId: userProfile.uid,
                judul: newLink.judul,
                url: urlToSave,
                kategori: 'Quick Link',
                urutan: 0,
                createdAt: Timestamp.now()
            });
            addToast("Tautan berhasil ditambahkan", "success");
            setNewLink({ judul: '', url: '' });
            setIsAddOpen(false);
        } catch (error) {
            console.error("Error adding link:", error);
            addToast("Gagal menambahkan tautan", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Hapus tautan ini?")) return;
        try {
            await deleteDoc(doc(db, 'personalLinks', id));
            addToast("Tautan dihapus", "success");
        } catch (error) {
             console.error("Error deleting link:", error);
             addToast("Gagal menghapus tautan", "error");
        }
    }

    return (
        <Card className="shadow-none md:shadow-[var(--nk-shadow-sm)] border-x-0 border-t-0 border-b md:border border-border/20 md:border-[var(--border)] flex flex-col bg-transparent md:nk-card rounded-none md:rounded-xl">
            <CardHeader className="px-4 py-3 md:p-4 md:py-3 md:bg-muted/30 border-b border-border/20 md:border-[var(--border)] flex-shrink-0 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Globe size={16} className="text-cyan-600" /> Portal Pintar
                </CardTitle>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs hover:bg-background">
                            <Plus size={12} className="mr-1" /> Tambah
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border-border">
                        <DialogHeader>
                            <DialogTitle>Tambah Tautan Cepat</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddLink} className="space-y-4 pt-2">
                            <div>
                                <Label htmlFor="judul">Nama Tautan</Label>
                                <Input 
                                    id="judul" 
                                    value={newLink.judul} 
                                    onChange={e => setNewLink({...newLink, judul: e.target.value})}
                                    placeholder="Contoh: Website SIPD / Drive Tim" 
                                    required 
                                />
                            </div>
                            <div>
                                <Label htmlFor="url">URL Website</Label>
                                <Input 
                                    id="url" 
                                    value={newLink.url} 
                                    onChange={e => setNewLink({...newLink, url: e.target.value})}
                                    placeholder="www.example.com" 
                                    required 
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Plus className="mr-2 h-4 w-4"/>}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
                <Tabs defaultValue="rekomendasi" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/30 border-b border-border/50 rounded-none h-9">
                        <TabsTrigger value="rekomendasi" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Sparkles size={12} className="mr-1.5 text-amber-500" />
                            Rekomendasi AI
                        </TabsTrigger>
                        <TabsTrigger value="pribadi" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            Tautan Pribadi
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="rekomendasi" className="m-0 border-none outline-none">
                        <ScrollArea className="h-[210px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                                {RECOMMENDED_AI_LINKS.map(link => (
                                    <div key={link.id} className="group relative flex flex-col p-2.5 rounded-lg border border-border bg-background hover:border-amber-500/30 hover:shadow-sm hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all cursor-pointer" onClick={() => window.open(link.url, '_blank')}>
                                        <div className="flex items-center gap-2.5 mb-1.5">
                                            <div className="w-7 h-7 rounded-md bg-amber-100/50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 overflow-hidden">
                                                <img 
                                                    src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`} 
                                                    alt="icon" 
                                                    className="w-4 h-4 object-contain"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            </div>
                                            <span className="text-sm font-semibold truncate text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{link.judul}</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground line-clamp-1 leading-tight">{link.deskripsi}</p>
                                        <ExternalLink size={12} className="absolute right-2.5 top-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="pribadi" className="m-0 border-none outline-none">
                        <ScrollArea className="h-[210px]">
                    {loading ? (
                         <div className="flex justify-center items-center h-full p-4"><Loader2 className="animate-spin h-5 w-5 text-muted-foreground"/></div>
                    ) : links.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground text-xs gap-1">
                            <LinkIcon size={24} className="opacity-20 mb-1" />
                            <p>Belum ada tautan tersimpan.</p>
                        </div>
                    ) : (
                        <motion.div 
                            className="grid grid-cols-2 gap-2 p-3"
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                            }}
                        >
                            {links.map(link => (
                                <motion.div key={link.id} variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }} className="group relative flex items-center p-2 rounded-md border border-border bg-background hover:border-primary/50 hover:shadow-sm transition-all">
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center min-w-0 gap-2.5" title={link.url}>
                                        <div className="w-7 h-7 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center flex-shrink-0 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800 overflow-hidden">
                                            {/* Menggunakan Google Favicon Service untuk ikon otomatis */}
                                            <img 
                                                src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`} 
                                                alt="icon" 
                                                className="w-4 h-4 object-contain"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                            <ExternalLink size={12} className="absolute opacity-0" /> 
                                        </div>
                                        <span className="text-xs font-medium truncate text-foreground group-hover:text-primary transition-colors">{link.judul}</span>
                                    </a>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); handleDelete(link.id!); }}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 transition-all bg-background/90 rounded-md shadow-sm border border-border"
                                        title="Hapus Tautan"
                            {loading ? (
                                <div className="flex justify-center items-center h-full p-4"><Loader2 className="animate-spin h-5 w-5 text-muted-foreground"/></div>
                            ) : links.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground text-xs gap-1">
                                    <LinkIcon size={24} className="opacity-20 mb-1" />
                                    <p>Belum ada tautan tersimpan.</p>
                                </div>
                            ) : (
                                <motion.div 
                                    className="grid grid-cols-2 gap-2 p-3"
                                    initial="hidden"
                                    animate="show"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
                                    }}
                                >
                                    {links.map(link => (
                                        <motion.div key={link.id} variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }} className="group relative flex items-center p-2 rounded-md border border-border bg-background hover:border-primary/50 hover:shadow-sm transition-all">
                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center min-w-0 gap-2.5" title={link.url}>
                                                <div className="w-7 h-7 rounded-full bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center flex-shrink-0 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-800 overflow-hidden">
                                                    <img 
                                                        src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`} 
                                                        alt="icon" 
                                                        className="w-4 h-4 object-contain"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                    <ExternalLink size={12} className="absolute opacity-0" /> 
                                                </div>
                                                <span className="text-xs font-medium truncate text-foreground group-hover:text-primary transition-colors">{link.judul}</span>
                                            </a>
                                            <button 
                                                onClick={(e) => { e.preventDefault(); handleDelete(link.id!); }}
                                                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-red-500 transition-all bg-background/90 rounded-md shadow-sm border border-border"
                                                title="Hapus Tautan"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
