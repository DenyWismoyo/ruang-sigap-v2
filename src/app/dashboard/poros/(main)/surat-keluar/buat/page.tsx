// Lokasi: src/app/dashboard/surat-keluar/buat/page.tsx
// [PERBAIKAN BUILD ERROR]
// - Menambahkan import { Textarea } from "@/components/ui/textarea"; yang hilang.

"use client";

import React, { useState, useEffect } from 'react';
import { useUserAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, addDoc, Timestamp } from 'firebase/firestore';
import { BankTemplate } from '@/types';
import { Loader2, FileText, Wand2, ArrowLeft, CheckCircle, AlertTriangle, Plus, Trash2, RefreshCw, ChevronsUpDown, Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { KODE_KLASIFIKASI_SURAT } from '@/data/kode-surat';
import { DATA_PEGAWAI } from '@/data/pegawai';

// Komponen UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // [FIX] Import Textarea ditambahkan
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from '@/context/ToastContext';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// Daftar variabel standar yang kita kenali (untuk pengelompokan UI yang lebih rapi)
const STANDARD_VARS = ['no_surat', 'sifat', 'lampiran', 'perihal', 'kepada', 'di_tempat', 'tanggal', 'nama_pengirim', 'nip_pengirim', 'jabatan_pengirim', 'nama_pegawai', 'nip_pegawai', 'jabatan_pegawai', 'pangkat_pegawai', 'golongan_pegawai'];

// --- DAFTAR VARIABEL UMUM (SUGGESTION) ---
const SUGGESTED_VARIABLES = [
    { value: "{{hari}}", label: "Hari Acara" },
    { value: "{{tanggal_acara}}", label: "Tanggal Acara" },
    { value: "{{waktu}}", label: "Waktu/Jam" },
    { value: "{{tempat}}", label: "Tempat Acara" },
    { value: "{{acara}}", label: "Nama Acara/Kegiatan" },
    { value: "{{nama_pegawai}}", label: "Nama Pegawai (Untuk SK)" },
    { value: "{{jabatan_lama}}", label: "Jabatan Lama" },
    { value: "{{jabatan_baru}}", label: "Jabatan Baru" },
    { value: "{{alamat_tujuan}}", label: "Alamat Penerima" },
    { value: "{{keterangan}}", label: "Keterangan Tambahan" },
];

// --- Komponen Baris Variabel (Dipisah agar state popover independen) ---
const CustomVariableRow = ({ 
    index, 
    variable, 
    onChange, 
    onRemove 
}: { 
    index: number, 
    variable: { key: string, value: string }, 
    onChange: (index: number, field: 'key' | 'value', val: string) => void, 
    onRemove: (index: number) => void 
}) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end animate-in fade-in zoom-in-95 duration-200 border p-3 rounded-lg bg-card sm:border-none sm:p-0 sm:bg-transparent">
             <div className="flex-1 w-full sm:w-auto">
                 <Label className="text-xs text-muted-foreground mb-1 block">Kode di Template</Label>
                 
                 <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between font-mono text-sm"
                        >
                            {variable.key || "Pilih / Ketik Kode..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                            <CommandInput 
                                placeholder="Cari atau ketik kode baru..." 
                                onValueChange={(search) => {
                                    // Izinkan ketik manual jika tidak ada di list
                                    if (search && !variable.key) {
                                        // Logic ini ditangani oleh onSelect di bawah atau manual input effect jika perlu
                                    }
                                }}
                            />
                            <CommandList>
                                <CommandEmpty>
                                    <div className="p-2 text-sm text-muted-foreground">
                                        Ketik kode manual di atas...
                                    </div>
                                </CommandEmpty>
                                <CommandGroup heading="Saran Kode Umum">
                                    {SUGGESTED_VARIABLES.map((suggestion) => (
                                        <CommandItem
                                            key={suggestion.value}
                                            value={suggestion.value}
                                            onSelect={(currentValue) => {
                                                onChange(index, 'key', currentValue);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    variable.key === suggestion.value ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <span className="font-mono font-bold mr-2">{suggestion.value}</span>
                                            <span className="text-muted-foreground text-xs">({suggestion.label})</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                {/* Opsi Manual Input fallback */}
                                <CommandGroup heading="Manual">
                                     <div className="p-2">
                                         <Input 
                                            placeholder="Ketik kode manual (misal: {{kode_unik}})"
                                            value={variable.key}
                                            onChange={(e) => onChange(index, 'key', e.target.value)}
                                            className="h-8 font-mono text-xs"
                                            autoFocus
                                         />
                                     </div>
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                 </Popover>
             </div>
             
             <div className="flex-[2] w-full sm:w-auto">
                 <Label className="text-xs text-muted-foreground mb-1 block">Isi Data (Yang akan tampil di surat)</Label>
                 <Input 
                    placeholder="Contoh: Senin, 20 Mei 2025" 
                    value={variable.value} 
                    onChange={(e) => onChange(index, 'value', e.target.value)}
                 />
             </div>
             
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onRemove(index)} 
                className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                title="Hapus baris"
            >
                 <Trash2 size={18} />
             </Button>
         </div>
    );
};

export default function BuatSuratKeluarPage() {
  const { userProfile, jabatanProfile } = useUserAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const [opdTemplates, setOpdTemplates] = useState<BankTemplate[]>([]);
  const [sharedTemplates, setSharedTemplates] = useState<BankTemplate[]>([]);
  
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isReadingTemplate, setIsReadingTemplate] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // State untuk menyimpan nilai semua variabel (baik standar maupun kustom)
  // Key adalah nama variabel tanpa {{}}, value adalah isi input
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  
  // Daftar variabel yang dideteksi dari template aktif
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  
  // [FITUR BARU] Variabel Kustom Dinamis (Manual Add)
  const [customVariables, setCustomVariables] = useState<{key: string, value: string}[]>([]);

  // [FITUR BARU] AI Auto-Drafter
  const [aiPrompt, setAiPrompt] = useState('');
  const [isDraftingAI, setIsDraftingAI] = useState(false);

  // Ambil Template
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!userProfile?.opdId) return;
      setLoading(true);
      try {
        const qOpd = query(collection(db, 'bankTemplate'), where('opdId', '==', userProfile.opdId), orderBy('createdAt', 'desc'));
        const snapOpd = await getDocs(qOpd);
        const myTpls = snapOpd.docs.map(d => ({ id: d.id, ...d.data() } as BankTemplate));
        
        const qShared = query(collection(db, 'bankTemplate'), where('sharedWithOpdIds', 'array-contains', userProfile.opdId));
        const snapShared = await getDocs(qShared);
        const sharedTpls = snapShared.docs.map(d => ({ id: d.id, ...d.data() } as BankTemplate));

        setOpdTemplates(myTpls.filter(t => t.googleDriveUrl || t.content));
        setSharedTemplates(sharedTpls.filter(t => t.googleDriveUrl || t.content));
      } catch (error) {
        console.error(error);
        addToast("Gagal memuat template", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [userProfile, addToast]);

  // Efek: Saat template dipilih, baca isinya
  useEffect(() => {
    if (!selectedTemplateId || !userProfile?.nip) return;
    
    const readTemplate = async () => {
        setIsReadingTemplate(true);
        setDetectedVariables([]); // Reset
        
        // Reset values, tapi pertahankan data profil default
        const defaultValues: Record<string, string> = {
             nama_pengirim: userProfile.namaLengkap,
             nip_pengirim: userProfile.nip,
             jabatan_pengirim: jabatanProfile?.namaJabatan || '',
             tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
             di_tempat: 'di Tempat',
             sifat: 'Biasa',
             lampiran: '-'
        };
        setVariableValues(defaultValues);

        const allTpls = [...opdTemplates, ...sharedTemplates];
        const templateObj = allTpls.find(t => t.id === selectedTemplateId);

        // JIKA INTERNAL MARKDOWN TEMPLATE
        if (templateObj?.content) {
            const regex = /\{\{([^}]+)\}\}/g;
            const matches = [];
            let match;
            while ((match = regex.exec(templateObj.content)) !== null) {
                matches.push(match[1].trim());
            }
            const cleanVars = Array.from(new Set(matches)); // Unique vars
            setDetectedVariables(cleanVars);
            
            if (cleanVars.length === 0) {
                addToast("Tidak ditemukan variabel {{...}} di dalam template ini.", "info");
            } else {
                addToast(`Berhasil mendeteksi ${cleanVars.length} variabel otomatis dari Markdown!`, "success");
            }
            setIsReadingTemplate(false);
            return;
        }

        // JIKA GOOGLE DOCS TEMPLATE
        const match = templateObj?.googleDriveUrl?.match(/\/d\/([a-zA-Z0-9-_]+)/);
        const fileId = match ? match[1] : null;

        if (!fileId) {
            addToast("Gagal membaca template: tidak ada konten markdown atau link GDocs tidak valid.", "error");
            setIsReadingTemplate(false);
            return;
        }

        try {
            const response = await fetch('/api/google/read-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nip: userProfile.nip, fileId })
            });
            const result = await response.json();
            
            if (result.success) {
                // Filter out variables that are empty or system artifacts if any
                const cleanVars = result.variables.filter((v: string) => v && v.trim().length > 0);
                setDetectedVariables(cleanVars);
                
                // Jika tidak ada variabel ditemukan, beri peringatan
                if (cleanVars.length === 0) {
                    addToast("Tidak ditemukan variabel {{...}} di dalam template ini.", "info");
                } else {
                    addToast(`Berhasil mendeteksi ${cleanVars.length} variabel otomatis!`, "success");
                }

            } else {
                console.error(result.error);
                addToast("Gagal membaca template. Pastikan akun Google terhubung.", "error");
            }
        } catch (err) {
            console.error(err);
            addToast("Terjadi kesalahan saat membaca template.", "error");
        } finally {
            setIsReadingTemplate(false);
        }
    };

    readTemplate();
  }, [selectedTemplateId, userProfile, jabatanProfile, opdTemplates, sharedTemplates, addToast]);

  const handleInputChange = (key: string, value: string) => {
      setVariableValues(prev => ({ ...prev, [key]: value }));
  };

  // Handler untuk Variabel Kustom
  const addCustomVariable = () => {
      setCustomVariables([...customVariables, { key: '', value: '' }]);
  };

  const removeCustomVariable = (index: number) => {
      const newVars = [...customVariables];
      newVars.splice(index, 1);
      setCustomVariables(newVars);
  };

  const handleCustomVarChange = (index: number, field: 'key' | 'value', val: string) => {
      const newVars = [...customVariables];
      newVars[index][field] = val;
      setCustomVariables(newVars);
  };

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
        addToast("Pilih template surat terlebih dahulu.", "error");
        return;
    }
    
    // Cari File
    const allTpls = [...opdTemplates, ...sharedTemplates];
    const templateObj = allTpls.find(t => t.id === selectedTemplateId);

    const isMarkdown = !!templateObj?.content;
    const match = templateObj?.googleDriveUrl?.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const googleFileId = match ? match[1] : null;

    if (!isMarkdown && (!googleFileId || !userProfile?.googleDriveReportLink)) {
        addToast("Konfigurasi GDrive tidak lengkap untuk template ini.", "error");
        return;
    }

    setIsGenerating(true);

    try {
      // Siapkan data replace. Tambahkan {{ }} ke key agar match dengan Docs
      const replaceData: Record<string, string> = {};
      
      // 1. Variabel Otomatis (Detected)
      Object.keys(variableValues).forEach(key => {
          replaceData[`{{${key}}}`] = variableValues[key];
      });

      // 2. Variabel Kustom (Manual)
      customVariables.forEach(v => {
          if (v.key.trim()) {
              // Otomatis tambahkan {{ }} jika user lupa
              const key = v.key.trim().startsWith('{{') ? v.key.trim() : `{{${v.key.trim()}}}`;
              replaceData[key] = v.value;
          }
      });

      // JIKA MARKDOWN TEMPLATE
      if (isMarkdown && templateObj.content) {
          let finalMarkdown = templateObj.content;
          Object.keys(replaceData).forEach(key => {
              finalMarkdown = finalMarkdown.replace(new RegExp(key, 'g'), replaceData[key]);
          });
          
          try {
              const docRef = await addDoc(collection(db, 'drafSuratInternal'), {
                  opdId: userProfile?.opdId || '',
                  createdBy: userProfile?.uid || '',
                  createdAt: Timestamp.now(),
                  content: finalMarkdown,
                  nomorSurat: variableValues['no_surat'] || 'Draft',
                  perihal: variableValues['perihal'] || 'Draft Surat'
              });
              addToast("Draft surat berhasil dibuat!", "success");
              router.push(`/dashboard/poros/surat-keluar/preview?id=${docRef.id}`);
          } catch(err) {
              console.error(err);
              addToast("Gagal menyimpan draft surat.", "error");
          }
          setIsGenerating(false);
          return;
      }

      // JIKA GOOGLE DOCS TEMPLATE
      const response = await fetch('/api/google/generate-surat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nip: userProfile?.nip || '',
          templateId: googleFileId,
          folderId: userProfile?.googleDriveReportLink || '', 
          data: replaceData
        })
      });

      const result = await response.json();

      if (result.success) {
        addToast("Surat berhasil dibuat!", "success");
        window.open(result.documentUrl, '_blank');
      } else {
        throw new Error(result.error);
      }

    } catch (error: any) {
      console.error(error);
      addToast(`Gagal generate: ${error.message}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDraftAI = async () => {
      if (!aiPrompt) return;
      setIsDraftingAI(true);
      try {
          const res = await fetch('/api/ai/draft-form', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: aiPrompt, variables: detectedVariables })
          });
          const data = await res.json();
          if (res.ok && data.data) {
              setVariableValues(prev => ({ ...prev, ...data.data }));
              addToast("Form berhasil diisi oleh AI!", "success");
          } else {
              addToast(data.error || "Gagal memproses AI", "error");
          }
      } catch (err) {
          console.error(err);
          addToast("Kesalahan server AI", "error");
      } finally {
          setIsDraftingAI(false);
      }
  };

  // Pisahkan variabel untuk render UI
  const standardVarsFound = detectedVariables.filter(v => STANDARD_VARS.includes(v));
  const customVarsFound = detectedVariables.filter(v => !STANDARD_VARS.includes(v));

  // Helper untuk label input yang lebih cantik
  const getLabel = (key: string) => {
      return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    <div className="animate-fadeInUp max-w-5xl mx-auto pb-20">
      <Button variant="ghost" asChild className="mb-4 pl-0 hover:pl-2 transition-all">
          <Link href="/dashboard/ruang-kerja"><ArrowLeft size={16} className="mr-2"/> Kembali ke Dashboard</Link>
      </Button>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
            <Wand2 size={24} />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-foreground">Buat Surat Keluar</h1>
            <p className="text-muted-foreground text-sm">Otomatisasi surat dinas berdasarkan template cerdas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Kolom Kanan (Pilih Template) - Dipindah ke atas/kiri pada mobile, tapi di kanan pada desktop */}
          <div className="lg:col-span-1 order-1 lg:order-2 space-y-6">
              <Card className="sticky top-6 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10">
                  <CardHeader>
                      <CardTitle className="text-lg">Pilih Template</CardTitle>
                      <CardDescription>Pilih kop surat yang akan digunakan.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-4"><Loader2 className="animate-spin text-blue-500"/></div>
                        ) : (
                            <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId}>
                                <SelectTrigger className="w-full bg-white dark:bg-slate-950">
                                    <SelectValue placeholder="-- Pilih Template --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {opdTemplates.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>Template OPD Anda</SelectLabel>
                                            {opdTemplates.map(t => <SelectItem key={t.id} value={t.id!}>{t.judul}</SelectItem>)}
                                        </SelectGroup>
                                    )}
                                    {sharedTemplates.length > 0 && (
                                        <SelectGroup>
                                            <SelectLabel>Template Standar (Pusat)</SelectLabel>
                                            {sharedTemplates.map(t => <SelectItem key={t.id} value={t.id!}>{t.judul}</SelectItem>)}
                                        </SelectGroup>
                                    )}
                                </SelectContent>
                            </Select>
                        )}
                        
                        {!selectedTemplateId && (
                             <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Pilih Template</AlertTitle>
                                <AlertDescription>Pilih template dulu agar sistem bisa membaca variabelnya.</AlertDescription>
                            </Alert>
                        )}
                        
                        {isReadingTemplate && (
                            <div className="flex items-center justify-center p-4 text-blue-600">
                                <Loader2 className="animate-spin mr-2" /> Membaca variabel template...
                            </div>
                        )}
                        
                        {!isReadingTemplate && selectedTemplateId && detectedVariables.length > 0 && (
                             <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertTitle className="text-green-800 dark:text-green-400">Template Terbaca</AlertTitle>
                                <AlertDescription className="text-green-700 dark:text-green-300 text-xs">
                                    {detectedVariables.length} variabel ditemukan. Silakan isi form di sebelah kiri.
                                </AlertDescription>
                            </Alert>
                        )}
                  </CardContent>
                  <CardFooter>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-6 text-md shadow-lg transition-transform hover:scale-105 active:scale-95"
                        onClick={handleGenerate}
                        disabled={isGenerating || !selectedTemplateId || isReadingTemplate}
                      >
                          {isGenerating ? (
                              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Memproses...</>
                          ) : (
                              <><FileText className="mr-2 h-5 w-5" /> GENERATE SURAT</>
                          )}
                      </Button>
                  </CardFooter>
              </Card>
          </div>
          
          {/* Kolom Kiri: Form Dinamis */}
          <div className="lg:col-span-2 order-2 lg:order-1 space-y-6">
            {detectedVariables.length === 0 && !isReadingTemplate && selectedTemplateId && (
                <div className="text-center p-10 border-2 border-dashed rounded-xl text-muted-foreground">
                    <p>Tidak ditemukan variabel <code>{'{{...}}'}</code> dalam dokumen ini.</p>
                    <p className="text-sm mt-2">Pastikan Anda sudah menyisipkan kode variabel di Google Doc.</p>
                    <Button variant="outline" onClick={() => window.location.reload()} className="mt-4"><RefreshCw size={14} className="mr-2"/> Muat Ulang</Button>
                </div>
            )}

            {/* 1. AI Drafter */}
            {detectedVariables.length > 0 && (
                <Card className="border-indigo-200 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-900/10">
                    <CardHeader>
                        <CardTitle className="text-indigo-800 dark:text-indigo-400 flex items-center">
                            <Wand2 className="mr-2 h-5 w-5" /> AI Auto-Drafter
                        </CardTitle>
                        <CardDescription>
                            Ceritakan saja surat yang ingin Anda buat, AI akan mengisi form di bawah secara otomatis!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Textarea
                            placeholder="Contoh: Tolong buatkan surat undangan rapat koordinasi teknis untuk tanggal 20 Mei besok jam 9 pagi di Ruang Rapat Utama, ditujukan untuk Para Kepala Bidang."
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            rows={3}
                            className="bg-white dark:bg-slate-950 border-indigo-200"
                        />
                        <Button onClick={handleDraftAI} disabled={isDraftingAI || !aiPrompt} className="bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                            {isDraftingAI ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Wand2 className="mr-2 h-4 w-4"/>}
                            Isi Form Otomatis
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* 2. Data Pokok (Standard Vars) */}
            {standardVarsFound.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Data Pokok Surat</CardTitle>
                        <CardDescription>Isian standar yang ditemukan di template.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {standardVarsFound.map(key => {
                            if (key === 'no_surat') {
                                return (
                                    <div key={key} className="md:col-span-2">
                                        <Label className="mb-1.5 block capitalize">Nomor Surat</Label>
                                        <div className="flex gap-2">
                                            <Select 
                                                onValueChange={(val) => {
                                                    const existing = variableValues[key] || '';
                                                    let cleanExisting = existing.replace(/^\d+/, '');
                                                    if (!cleanExisting.startsWith('/')) cleanExisting = '/' + cleanExisting;
                                                    handleInputChange(key, val + (cleanExisting === '/' ? '' : cleanExisting)); 
                                                }}
                                            >
                                                <SelectTrigger className="w-[180px] shrink-0 bg-white dark:bg-slate-950">
                                                    <SelectValue placeholder="Kode Klasifikasi" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {KODE_KLASIFIKASI_SURAT.map(k => (
                                                        <SelectItem key={k.kode} value={k.kode}>
                                                            <span className="font-mono">{k.kode}</span> - {k.deskripsi}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Input 
                                                value={variableValues[key] || ''} 
                                                onChange={e => handleInputChange(key, e.target.value)}
                                                placeholder="Contoh: 005/123/456/2026"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                );
                            }

                            if (key === 'nama_pegawai') {
                                return (
                                    <div key={key} className="md:col-span-2 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-900/10">
                                        <Label className="mb-1.5 block capitalize font-bold text-blue-700 dark:text-blue-400">Pegawai Tersorot (Auto-Fill)</Label>
                                        <Select 
                                            onValueChange={(val) => {
                                                const peg = DATA_PEGAWAI.find(p => p.nip === val);
                                                if (peg) {
                                                    setVariableValues(prev => ({
                                                        ...prev,
                                                        nama_pegawai: peg.nama,
                                                        nip_pegawai: peg.nip,
                                                        jabatan_pegawai: peg.jabatan,
                                                        pangkat_pegawai: peg.pangkat,
                                                        golongan_pegawai: peg.golongan
                                                    }));
                                                    addToast(`Data ${peg.nama} otomatis diisi.`, 'success');
                                                } else {
                                                    handleInputChange(key, val);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full bg-white dark:bg-slate-950 border-blue-300">
                                                <SelectValue placeholder="-- Cari / Pilih Data Pegawai --" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DATA_PEGAWAI.map(p => (
                                                    <SelectItem key={p.nip} value={p.nip}>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{p.nama}</span>
                                                            <span className="text-xs text-muted-foreground">{p.nip} - {p.jabatan}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input 
                                            className="mt-3 bg-white"
                                            value={variableValues[key] || ''} 
                                            onChange={e => handleInputChange(key, e.target.value)}
                                            placeholder={`Atau ketik manual ${getLabel(key)}...`}
                                        />
                                        <p className="text-xs text-muted-foreground mt-2">NIP, Jabatan, Pangkat otomatis tersinkronisasi jika tersedia di template.</p>
                                    </div>
                                );
                            }

                            if (['nip_pegawai', 'jabatan_pegawai', 'pangkat_pegawai', 'golongan_pegawai'].includes(key)) {
                                return (
                                    <div key={key}>
                                        <Label className="mb-1.5 block capitalize flex justify-between">
                                            {getLabel(key)}
                                            {variableValues[key] && <span className="text-[10px] text-green-600 font-bold bg-green-100 px-1 rounded">Auto</span>}
                                        </Label>
                                        <Input 
                                            value={variableValues[key] || ''} 
                                            onChange={e => handleInputChange(key, e.target.value)}
                                            placeholder={`Isi ${getLabel(key)}...`}
                                            className={variableValues[key] ? "bg-green-50/50 border-green-200" : ""}
                                        />
                                    </div>
                                );
                            }

                            return (
                                <div key={key} className={key === 'perihal' || key === 'kepada' || key === 'isi_surat' || key === 'penutup' ? 'md:col-span-2' : ''}>
                                    <Label className="mb-1.5 block capitalize">{getLabel(key)}</Label>
                                    {key === 'isi_surat' || key === 'penutup' ? (
                                        <Textarea
                                            value={variableValues[key] || ''}
                                            onChange={e => handleInputChange(key, e.target.value)}
                                            placeholder={`Isi ${getLabel(key)}...`}
                                            rows={key === 'isi_surat' ? 6 : 3}
                                        />
                                    ) : (
                                        <Input 
                                            value={variableValues[key] || ''} 
                                            onChange={e => handleInputChange(key, e.target.value)}
                                            placeholder={`Isi ${getLabel(key)}...`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}

            {/* 2. Data Khusus (Detected Custom Vars) */}
            {customVarsFound.length > 0 && (
                <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
                    <CardHeader>
                        <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center">
                            <Wand2 size={18} className="mr-2"/> Data Khusus Template Ini
                        </CardTitle>
                        <CardDescription>
                            Variabel unik yang ditemukan di template ini.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {customVarsFound.map(key => (
                            <div key={key}>
                                <Label className="mb-1.5 block font-semibold text-foreground">
                                    {key} 
                                    <span className="ml-2 text-xs font-normal text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Variable</span>
                                </Label>
                                <Textarea 
                                    value={variableValues[key] || ''} 
                                    onChange={e => handleInputChange(key, e.target.value)}
                                    placeholder={`Masukkan konten untuk {{${key}}}...`}
                                    rows={key.includes('isi') || key.includes('konten') ? 5 : 2}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* 3. Variabel Tambahan Manual (Jika user ingin menambahkan sendiri) */}
            <Card className="border-dashed border-2 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center text-blue-700 dark:text-blue-400">
                        <Plus size={18} className="mr-2"/> Variabel Tambahan (Opsional)
                    </CardTitle>
                    <CardDescription>
                        Gunakan ini jika template Anda memiliki kode khusus (misal: <code>{'{{hari}}'}</code>, <code>{'{{tempat}}'}</code>, dll) yang belum terdeteksi.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {customVariables.length > 0 && (
                        <div className="space-y-3 mb-4">
                             {customVariables.map((v, idx) => (
                                 <CustomVariableRow 
                                    key={idx} 
                                    index={idx} 
                                    variable={v} 
                                    onChange={handleCustomVarChange} 
                                    onRemove={removeCustomVariable} 
                                 />
                             ))}
                        </div>
                    )}
                    <Button variant="outline" size="sm" onClick={addCustomVariable} className="border-blue-400 text-blue-600 hover:bg-blue-50">
                        <Plus size={16} className="mr-1"/> Tambah Variabel
                    </Button>
                </CardContent>
            </Card>
          </div>

      </div>
    </div>
  );
}
