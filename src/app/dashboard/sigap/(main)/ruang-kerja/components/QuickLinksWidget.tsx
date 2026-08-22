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
    { id: 'ai-8', judul: 'Beautiful.ai', url: 'https://www.beautiful.ai/', deskripsi: 'Desain Presentasi AI Elegan', iconUrl: 'https://www.beautiful.ai/favicon.ico' },
    { id: 'ai-9', judul: 'Canva Magic Studio', url: 'https://www.canva.com/', deskripsi: 'Desain Grafis dengan AI', iconUrl: 'https://www.canva.com/favicon.ico' },
    { id: 'ai-10', judul: 'QuillBot', url: 'https://quillbot.com/', deskripsi: 'Parafrase & Perbaikan Kalimat', iconUrl: 'https://quillbot.com/favicon.ico' },
    { id: 'ai-11', judul: 'Grammarly', url: 'https://www.grammarly.com/', deskripsi: 'Koreksi Tata Bahasa Otomatis', iconUrl: 'https://www.grammarly.com/favicon.ico' },
    { id: 'ai-12', judul: 'Consensus', url: 'https://consensus.app/', deskripsi: 'Pencarian Jurnal Riset Akademis', iconUrl: 'https://consensus.app/favicon.ico' },
    { id: 'ai-13', judul: 'ChatPDF', url: 'https://www.chatpdf.com/', deskripsi: 'Tanya Jawab File PDF', iconUrl: 'https://www.chatpdf.com/favicon.ico' },
    { id: 'ai-14', judul: 'Otter.ai', url: 'https://otter.ai/', deskripsi: 'Transkripsi & Notulensi Rapat', iconUrl: 'https://otter.ai/favicon.ico' },
    { id: 'ai-15', judul: 'Microsoft Copilot', url: 'https://copilot.microsoft.com/', deskripsi: 'AI Terintegrasi Office & Web', iconUrl: 'https://copilot.microsoft.com/favicon.ico' },
];

type QuickLinksWidgetProps = {
    variant?: 'widget' | 'modal';
    onClose?: () => void;
};

export default function QuickLinksWidget({ variant = 'widget', onClose }: QuickLinksWidgetProps) {
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

    const isModal = variant === 'modal';

    return (
        <Card className={isModal 
            ? "shadow-2xl border border-white/20 dark:border-white/10 flex flex-col bg-background/70 dark:bg-background/40 backdrop-blur-3xl rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5" 
            : "shadow-none md:shadow-sm border-x-0 border-t-0 border-b md:border border-border/20 md:border-border flex flex-col bg-transparent md:bg-card rounded-none md:rounded-xl"
        }>
            <CardHeader className={`px-4 py-3 md:p-4 md:py-3 ${isModal ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10' : 'md:bg-muted/30 border-b border-border/20 md:border-border'} flex-shrink-0 flex flex-row items-center justify-between space-y-0`}>
                <CardTitle className="text-base font-bold flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                    <Sparkles size={18} className="text-amber-500" /> Portal Pintar
                </CardTitle>
                
                <div className="flex items-center gap-2">
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button variant={isModal ? "secondary" : "ghost"} size="sm" className={`h-7 px-2.5 text-xs rounded-full ${isModal ? 'bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-black/40 shadow-sm backdrop-blur-md' : 'hover:bg-background'}`}>
                                <Plus size={14} className="mr-1" /> Tambah
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
                
                {isModal && onClose && (
                    <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors ml-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </Button>
                )}
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden flex flex-col">
                <Tabs defaultValue="rekomendasi" className="w-full flex flex-col">
                    <TabsList className={`grid w-full grid-cols-2 p-1.5 ${isModal ? 'bg-black/5 dark:bg-white/5 m-3 mb-1 rounded-xl w-[calc(100%-24px)]' : 'bg-muted/40 border-b border-border/30 rounded-none'} h-12 shrink-0`}>
                        <TabsTrigger value="rekomendasi" className="text-[13px] font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all">
                            <Sparkles size={14} className="mr-2 text-amber-500" />
                            Rekomendasi AI
                        </TabsTrigger>
                        <TabsTrigger value="pribadi" className="text-[13px] font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground transition-all">
                            Tautan Pribadi
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="rekomendasi" className="m-0 border-none outline-none flex-1">
                        <ScrollArea className={isModal ? "h-[60vh] md:h-[400px]" : "h-[280px]"}>
                            <div className="flex flex-col gap-2.5 p-3">
                                {RECOMMENDED_AI_LINKS.map(link => (
                                    <div 
                                        key={link.id} 
                                        onClick={() => window.open(link.url, '_blank')}
                                        className="group relative flex items-center gap-3.5 p-3 rounded-xl border border-border/60 bg-card hover:border-amber-400/50 hover:shadow-[0_4px_12px_rgba(251,191,36,0.08)] dark:hover:shadow-[0_4px_12px_rgba(251,191,36,0.03)] hover:bg-amber-50/20 dark:hover:bg-amber-950/10 transition-all duration-300 cursor-pointer overflow-hidden"
                                    >
                                        <div className="w-10 h-10 rounded-[10px] bg-amber-100/60 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 shadow-inner">
                                            <img 
                                                src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`} 
                                                alt="icon" 
                                                className="w-5 h-5 object-contain"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                                            <span className="text-sm font-bold text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors leading-tight mb-1">{link.judul}</span>
                                            <span className="text-xs text-muted-foreground truncate leading-tight">{link.deskripsi}</span>
                                        </div>
                                        <ExternalLink size={14} className="text-muted-foreground/40 group-hover:text-amber-500 transition-colors shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="pribadi" className="m-0 border-none outline-none flex-1">
                        <ScrollArea className={isModal ? "h-[60vh] md:h-[400px]" : "h-[280px]"}>
                    {loading ? (
                         <div className="flex justify-center items-center h-full p-4"><Loader2 className="animate-spin h-5 w-5 text-muted-foreground"/></div>
                    ) : links.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground text-xs gap-2">
                            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-1">
                                <LinkIcon size={20} className="text-muted-foreground/50" />
                            </div>
                            <p className="font-medium">Belum ada tautan tersimpan.</p>
                            <p className="text-[10px] opacity-70">Klik "Tambah" untuk menyimpan tautan penting Anda.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2.5 p-4">
                            {links.map(link => (
                                <div key={link.id} className="group relative flex items-center gap-3.5 p-3 rounded-xl border border-border/60 bg-card hover:border-cyan-400/40 hover:shadow-[0_4px_12px_rgba(6,182,212,0.08)] dark:hover:shadow-[0_4px_12px_rgba(6,182,212,0.04)] hover:bg-cyan-50/20 dark:hover:bg-cyan-950/10 transition-all duration-300">
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center min-w-0 gap-3.5 outline-none" title={link.url}>
                                        <div className="w-10 h-10 rounded-[10px] bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center flex-shrink-0 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/60 shadow-inner">
                                            <img 
                                                src={`https://www.google.com/s2/favicons?domain=${link.url}&sz=64`} 
                                                alt="icon" 
                                                className="w-5 h-5 object-contain"
                                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                            />
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                                            <span className="text-sm font-bold text-foreground group-hover:text-cyan-700 dark:group-hover:text-cyan-400 transition-colors leading-tight mb-1 truncate">{link.judul}</span>
                                            <span className="text-xs text-muted-foreground truncate leading-tight opacity-70">{link.url.replace(/^https?:\/\//i, '')}</span>
                                        </div>
                                    </a>
                                    <button 
                                        onClick={(e) => { e.preventDefault(); handleDelete(link.id!); }}
                                        className="p-2 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        title="Hapus Tautan"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                         </div>
                     )}
                  </ScrollArea>
               </TabsContent>
            </Tabs>
            </CardContent>
        </Card>
    );
}