"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft, Printer, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/context/ToastContext';
import MDEditor from '@uiw/react-md-editor';
import Link from 'next/link';

export default function PreviewSuratPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams?.get('id');
    const { addToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [surat, setSurat] = useState<any>(null);
    const [content, setContent] = useState('');

    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const fetchSurat = async () => {
            try {
                const docRef = doc(db, 'drafSuratInternal', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSurat({ id: docSnap.id, ...docSnap.data() });
                    setContent(docSnap.data().content || '');
                } else {
                    addToast("Draft surat tidak ditemukan", "error");
                }
            } catch (err) {
                console.error(err);
                addToast("Gagal memuat surat", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchSurat();
    }, [id, addToast]);

    const handleSave = async () => {
        if (!id) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, 'drafSuratInternal', id), {
                content
            });
            addToast("Perubahan berhasil disimpan", "success");
        } catch (err) {
            console.error(err);
            addToast("Gagal menyimpan perubahan", "error");
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleAjukanPersetujuan = async () => {
        if (!id || !surat) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'drafPersetujuan'), {
                judul: surat.perihal || 'Draft Surat Keluar',
                deskripsi: `Nomor: ${surat.nomorSurat || '-'}`,
                kategori: 'Surat Keluar',
                opdId: surat.opdId,
                createdBy: surat.createdBy,
                createdAt: Timestamp.now(),
                content: content,
                status: 'Drafting',
                sifat: 'Biasa'
            });
            addToast("Draf Persetujuan berhasil dibuat!", "success");
            router.push('/dashboard/poros/draf-persetujuan');
        } catch (err) {
            console.error(err);
            addToast("Gagal mengajukan persetujuan", "error");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>;
    }

    if (!surat) {
        return (
            <div className="p-8 text-center">
                <p>Surat tidak ditemukan.</p>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/dashboard/poros/surat-keluar/buat">Kembali</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                <Button variant="ghost" onClick={() => router.back()} className="pl-0 hover:pl-2 transition-all">
                    <ArrowLeft size={16} className="mr-2"/> Kembali
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save size={16} className="mr-2" />}
                        Simpan Perubahan
                    </Button>
                    <Button onClick={handlePrint} variant="secondary" className="bg-slate-200 hover:bg-slate-300 text-slate-800">
                        <Printer size={16} className="mr-2" /> Cetak PDF
                    </Button>
                    <Button onClick={handleAjukanPersetujuan} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
                        <Send size={16} className="mr-2" /> Ajukan Persetujuan
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-sm print:hidden">
                <h2 className="text-lg font-semibold mb-2">Finalisasi Surat</h2>
                <p className="text-sm text-muted-foreground mb-4">
                    Anda dapat melakukan pengeditan terakhir pada editor di bawah ini. Setelah selesai, klik Simpan lalu Cetak.
                </p>
                <div data-color-mode="light">
                    <MDEditor
                        value={content}
                        onChange={(val) => setContent(val || '')}
                        height={600}
                        preview="edit"
                    />
                </div>
            </div>

            {/* Print Section */}
            <div className="hidden print:block bg-white text-black p-8" ref={printRef}>
                 <div data-color-mode="light">
                    <MDEditor.Markdown source={content} style={{ backgroundColor: 'white', color: 'black' }} />
                 </div>
            </div>
        </div>
    );
}
