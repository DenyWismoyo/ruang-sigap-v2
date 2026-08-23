"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, ArrowLeft, Printer, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/context/ToastContext';
import { useUserAuth } from '@/context/AuthContext';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { marked } from 'marked';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function PreviewSuratPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams?.get('id');
    const { addToast } = useToast();
    const { opdConfig } = useUserAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [surat, setSurat] = useState<any>(null);
    const [content, setContent] = useState('');
    const [kopSuratHtml, setKopSuratHtml] = useState('');

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
                    const data = docSnap.data();
                    setSurat({ id: docSnap.id, ...data });
                    
                    let finalContent = data.content || '';
                    // Deteksi jika masih berbentuk Markdown murni, konversi ke HTML
                    if (finalContent && !finalContent.trim().startsWith('<')) {
                        finalContent = await marked.parse(finalContent);
                    }
                    setContent(finalContent);
                    
                    if (data.kopSuratId && opdConfig?.kopSuratConfigs) {
                        const kop = opdConfig.kopSuratConfigs.find((k: any) => k.id === data.kopSuratId);
                        if (kop) {
                            const html = `
                                <div style="text-align: center; font-family: 'Times New Roman', Times, serif; line-height: 1.2;">
                                    <h3 style="margin: 0; font-size: 16pt; text-transform: uppercase;">${kop.headerUtama}</h3>
                                    <h1 style="margin: 0; font-size: 18pt; font-weight: bold; text-transform: uppercase;">${kop.subHeader}</h1>
                                    <p style="margin: 4px 0; font-size: 11pt;">${kop.alamat}</p>
                                    <p style="margin: 0; font-size: 11pt;">${kop.kontak} ${kop.website ? ' | ' + kop.website : ''} ${kop.kodePos ? ' | Kode Pos: ' + kop.kodePos : ''}</p>
                                </div>
                            `;
                            setKopSuratHtml(html);
                        }
                    }
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
    }, [id, addToast, opdConfig]);

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
                status: 'Diajukan',
                sifat: 'Biasa',
                kopSuratId: surat.kopSuratId || null,
                penomoranConfigId: surat.penomoranConfigId || null,
                generatedNomorSurat: surat.generatedNomorSurat || null
            });
            
            // Perbarui status draf internal menjadi "Menunggu Persetujuan"
            await updateDoc(doc(db, 'drafSuratInternal', id), {
                status: 'Menunggu Persetujuan'
            });
            
            addToast("Draf Persetujuan berhasil dibuat!", "success");
            router.push('/dashboard/sigap/surat-keluar/persetujuan');
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
                    <Link href="/dashboard/sigap/surat-keluar">Kembali ke Daftar Draf</Link>
                </Button>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 20mm;
                    }
                    body * {
                        visibility: hidden;
                    }
                    .print-section, .print-section * {
                        visibility: visible;
                    }
                    .print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background-color: white !important;
                        color: black !important;
                    }
                    body {
                        background-color: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            `}</style>
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
                <div className="bg-white text-black rounded-b-md">
                    <ReactQuill 
                        theme="snow"
                        value={content}
                        onChange={setContent}
                        className="h-[500px] mb-12"
                        modules={{
                            toolbar: [
                                [{ 'header': [1, 2, 3, false] }],
                                ['bold', 'italic', 'underline', 'strike'],
                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                [{ 'align': [] }],
                                ['clean']
                            ],
                        }}
                    />
                </div>
            </div>

            {/* Print Section */}
            <div className="hidden print:block print-section p-8" ref={printRef}>
                 {kopSuratHtml && (
                     <div 
                         className="mb-8 border-b-4 border-double border-black pb-4" 
                         dangerouslySetInnerHTML={{ __html: kopSuratHtml }} 
                     />
                 )}
                 <div 
                     className="prose max-w-none text-black quill-print-content"
                     dangerouslySetInnerHTML={{ __html: content }} 
                 />
            </div>
            </div>
        </>
    );
}
