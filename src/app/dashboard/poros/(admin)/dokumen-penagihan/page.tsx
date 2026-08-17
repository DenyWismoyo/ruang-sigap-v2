'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Tagihan } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { SpkPdf, BastPdf, InvoicePdf, KwitansiPdf, FakturPajakPdf } from './components/BillingPdfs';
import { FileText, CheckCircle, Download, FileSignature, Receipt, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function DokumenPenagihanPage() {
    const [tagihanList, setTagihanList] = useState<Tagihan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'tagihan'), orderBy('tanggalDibuat', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tagihan));
            setTagihanList(list);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const toggleDokumenStatus = async (tagihan: Tagihan, docType: keyof Required<Tagihan>['dokumenKelengkapan']) => {
        const currentStatus = tagihan.dokumenKelengkapan?.[docType] || false;
        const newDokumenKelengkapan = {
            ...(tagihan.dokumenKelengkapan || { spk: false, bast: false, invoice: false, kwitansi: false, fakturPajak: false }),
            [docType]: !currentStatus
        };

        try {
            await updateDoc(doc(db, 'tagihan', tagihan.id!), {
                dokumenKelengkapan: newDokumenKelengkapan
            });
        } catch (error) {
            console.error("Gagal update dokumen", error);
        }
    };

    const isAllComplete = (tagihan: Tagihan) => {
        const d = tagihan.dokumenKelengkapan;
        if (!d) return false;
        return d.spk && d.bast && d.invoice && d.kwitansi && d.fakturPajak;
    };

    const DocButton = ({ tagihan, type, label, icon: Icon, PdfComponent }: any) => {
        const isComplete = tagihan.dokumenKelengkapan?.[type] || false;
        return (
            <div className="flex flex-col items-center gap-2 p-3 border rounded-xl bg-gray-50/50 dark:bg-slate-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-slate-800">
                <div className="flex w-full items-center justify-between mb-1">
                    <span className="text-xs font-semibold flex items-center gap-1"><Icon size={14} className="text-gray-500" /> {label}</span>
                    <button 
                        onClick={() => toggleDokumenStatus(tagihan, type)}
                        className={`p-1 rounded-full ${isComplete ? 'text-green-600 bg-green-100' : 'text-gray-400 bg-gray-200'}`}
                        title={isComplete ? "Tandai Belum Lengkap" : "Tandai Lengkap"}
                    >
                        <CheckCircle size={16} />
                    </button>
                </div>
                
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <PDFDownloadLink
                                    document={<PdfComponent tagihan={tagihan} />}
                                    fileName={`${label.replace(/\s+/g, '_')}_${tagihan.namaOpd}_${tagihan.bulanTagihan}_${tagihan.tahunTagihan}.pdf`}
                                >
                                    {({ loading }) => (
                                        <Button variant={isComplete ? "default" : "outline"} size="sm" className={`w-full text-xs h-8 ${isComplete ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`} disabled={loading}>
                                            {loading ? 'Menyiapkan...' : <><Download size={12} className="mr-1"/> Download PDF</>}
                                        </Button>
                                    )}
                                </PDFDownloadLink>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>Generate & Download PDF Resmi {label}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                    <FileText className="text-blue-600" /> Manajemen Dokumen Penagihan (B2G)
                </h1>
                <p className="text-muted-foreground mt-1">
                    Pusat kendali Super Admin untuk mengelola dan men-generate dokumen resmi persyaratan pencairan dana tagihan OPD.
                </p>
            </div>

            <div className="nk-card overflow-hidden">
                <div className="p-4 border-b border-white/10 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Receipt size={18} /> Daftar Tagihan & Kelengkapan Dokumen
                    </h2>
                </div>
                <div className="p-4 space-y-6">
                    {loading ? (
                        <div className="text-center p-8 text-gray-500">Memuat data tagihan...</div>
                    ) : tagihanList.length === 0 ? (
                        <div className="text-center p-8 text-gray-500">Belum ada tagihan yang dibuat.</div>
                    ) : (
                        tagihanList.map(tagihan => {
                            const complete = isAllComplete(tagihan);
                            return (
                                <div key={tagihan.id} className={`border rounded-xl p-4 transition-all ${complete ? 'border-green-300 bg-green-50/30' : 'border-gray-200 dark:border-slate-700'}`}>
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg">{tagihan.namaOpd}</h3>
                                            <div className="text-sm text-gray-500 flex gap-4 mt-1">
                                                <span>Periode: {tagihan.bulanTagihan}/{tagihan.tahunTagihan}</span>
                                                <span>Paket: {tagihan.packageName}</span>
                                                <span className="font-semibold text-blue-600">Total: Rp {tagihan.totalTagihan.toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {complete ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full flex items-center gap-1">
                                                    <CheckCircle size={16} /> SIAP DITAGIHKAN
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-full flex items-center gap-1">
                                                    <AlertCircle size={16} /> DOKUMEN BELUM LENGKAP
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <DocButton tagihan={tagihan} type="spk" label="SPK" icon={FileSignature} PdfComponent={SpkPdf} />
                                        <DocButton tagihan={tagihan} type="bast" label="BAST" icon={FileText} PdfComponent={BastPdf} />
                                        <DocButton tagihan={tagihan} type="invoice" label="Invoice Resmi" icon={Receipt} PdfComponent={InvoicePdf} />
                                        <DocButton tagihan={tagihan} type="kwitansi" label="Kwitansi" icon={FileSpreadsheet} PdfComponent={KwitansiPdf} />
                                        <DocButton tagihan={tagihan} type="fakturPajak" label="Faktur Pajak" icon={FileText} PdfComponent={FakturPajakPdf} />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
