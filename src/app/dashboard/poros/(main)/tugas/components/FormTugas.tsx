/**
 * Directory: src/app/dashboard/poros/(main)/tugas/components/FormTugas.tsx
 * Status: REFACTORED - DIRECT DIRECTIVE & MODERN UX (POROS)
 * Deskripsi: Form Pembuatan Tugas Modern (Instruksi Tim, Multi-Assignee, Voice Memo, Preset Deadline) di tenant POROS.
 */

"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, Timestamp, query, where, getDocs, writeBatch, doc, limit } from 'firebase/firestore'; 
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserAuth } from '@/context/AuthContext';
import { Tugas, UserProfile, Surat } from '@/types';
import { sendWhatsAppNotification } from '@/lib/whatsapp';
import { logActivity } from '@/lib/activityLogger';
import { 
  User, Search, Link as LinkIcon, X, Send, UserCheck, Users, Briefcase, 
  ChevronDown, Loader2, UserPlus, Mic, Square, Play, Trash2, Calendar, 
  Sparkles, CheckCircle2, Split, Clock, Layers
} from 'lucide-react';
import { useTugasActions } from '@/app/dashboard/poros/hooks/useTugasActions';

// --- Impor Komponen Shadcn ---
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';

interface InstructionTemplate {
  id: string;
  label: string;
  categoryGroup: string;
  prefix: string;
  kategoriTugas: NonNullable<Tugas['kategoriTugas']>;
  defaultPrioritas?: 'Rendah' | 'Sedang' | 'Tinggi';
}

const INSTRUCTION_TEMPLATES: InstructionTemplate[] = [
  {
    id: 'draft_laporan',
    label: '📝 Draf Laporan',
    categoryGroup: 'Administrasi & Laporan',
    prefix: 'Penyusunan Draf Laporan: ',
    kategoriTugas: 'Penyusunan Laporan',
    defaultPrioritas: 'Sedang',
  },
  {
    id: 'analisis_data',
    label: '📊 Analisis Data',
    categoryGroup: 'Administrasi & Laporan',
    prefix: 'Analisis Data & Evaluasi: ',
    kategoriTugas: 'Analisis Data',
    defaultPrioritas: 'Sedang',
  },
  {
    id: 'koordinasi_rapat',
    label: '👥 Koordinasi Rapat',
    categoryGroup: 'Rapat & Koordinasi',
    prefix: 'Koordinasi & Persiapan Rapat: ',
    kategoriTugas: 'Koordinasi',
    defaultPrioritas: 'Sedang',
  },
  {
    id: 'bahan_paparan',
    label: '📑 Bahan Paparan',
    categoryGroup: 'Rapat & Koordinasi',
    prefix: 'Penyusunan Slide Paparan: ',
    kategoriTugas: 'Persiapan Materi',
    defaultPrioritas: 'Sedang',
  },
  {
    id: 'verifikasi_berkas',
    label: '🔍 Verifikasi Berkas',
    categoryGroup: 'Teknis & Lapangan',
    prefix: 'Verifikasi & Validasi Dokumen: ',
    kategoriTugas: 'Teknis Lapangan',
    defaultPrioritas: 'Sedang',
  },
  {
    id: 'tinjauan_lapangan',
    label: '🛠️ Tinjauan Lapangan',
    categoryGroup: 'Teknis & Lapangan',
    prefix: 'Pemeriksaan & Tinjauan Lapangan: ',
    kategoriTugas: 'Teknis Lapangan',
    defaultPrioritas: 'Sedang',
  },
  {
    id: 'rencana_anggaran',
    label: '💰 Rencana Anggaran',
    categoryGroup: 'Perencanaan & Anggaran',
    prefix: 'Penyusunan Rencana Anggaran (RAB): ',
    kategoriTugas: 'Penyusunan Laporan',
    defaultPrioritas: 'Sedang',
  },
  {
    id: 'arahan_pimpinan',
    label: '⚡ Arahan Pimpinan',
    categoryGroup: 'Instruksi Khusus',
    prefix: 'Tindak Lanjut Arahan Pimpinan: ',
    kategoriTugas: 'Lainnya',
    defaultPrioritas: 'Tinggi',
  },
  {
    id: 'pemeliharaan_aset',
    label: '⚙️ Pemeliharaan Aset',
    categoryGroup: 'Teknis & Lapangan',
    prefix: 'Pemeliharaan & Pengecekan Sarpras: ',
    kategoriTugas: 'Teknis Lapangan',
    defaultPrioritas: 'Sedang',
  },
];

interface FormTugasProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTaskId: string) => void;
  userCache: Map<string, UserProfile>;
  suratTerkait?: {
    id: string;
    perihal: string;
    klasifikasi?: 'Biasa' | 'Penting' | 'Segera' | 'Rahasia';
  } | null;
  initialData?: {
    judulTugas: string;
    deskripsi: string;
  };
}

export default function FormTugas({ isOpen, onClose, onSuccess, userCache, suratTerkait, initialData }: FormTugasProps) {
  const { userProfile, actingJabatanProfile, jabatanProfile } = useUserAuth();
  const effectiveJabatan = actingJabatanProfile || jabatanProfile;
  const { createNewTask, createBatchTasks } = useTugasActions();

  const isPimpinanOrAdmin = useMemo(() => {
    if (!effectiveJabatan) return false;
    const isLevelPimpinan = effectiveJabatan.level !== undefined && effectiveJabatan.level <= 6;
    const isAdminRole = userProfile?.role === 'admin_opd' || userProfile?.role === 'super_admin';
    return isLevelPimpinan || isAdminRole;
  }, [effectiveJabatan, userProfile]);

  const [mode, setMode] = useState<'delegasi' | 'mandiri'>('delegasi');
  
  const [judulTugas, setJudulTugas] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategoriTugas, setKategoriTugas] = useState<Tugas['kategoriTugas']>('Lainnya');
  const [prioritas, setPrioritas] = useState<'Rendah' | 'Sedang' | 'Tinggi'>('Sedang');
  const [batasWaktu, setBatasWaktu] = useState<Date | undefined>(undefined);

  // Soft Template States
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [selectedStaffList, setSelectedStaffList] = useState<UserProfile[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<'kolaborasi' | 'split'>('kolaborasi');
  
  const [linkedSurat, setLinkedSurat] = useState<Surat | null>(null);
  const [suratSearch, setSuratSearch] = useState('');
  const [suratResults, setSuratResults] = useState<Surat[]>([]);
  const [suratPopoverOpen, setSuratPopoverOpen] = useState(false);

  const [stafSearch, setStafSearch] = useState('');
  const [stafPopoverOpen, setStafPopoverOpen] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrlPreview, setAudioUrlPreview] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setQuickDeadline = (type: 'today' | 'tomorrow' | '3days' | 'weekend') => {
    const d = new Date();
    if (type === 'today') {
      d.setHours(17, 0, 0, 0);
    } else if (type === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      d.setHours(17, 0, 0, 0);
    } else if (type === '3days') {
      d.setDate(d.getDate() + 3);
      d.setHours(17, 0, 0, 0);
    } else if (type === 'weekend') {
      const day = d.getDay();
      const diff = (day === 0 ? 0 : 5 - day);
      d.setDate(d.getDate() + (diff > 0 ? diff : 7));
      d.setHours(17, 0, 0, 0);
    }
    setBatasWaktu(d);
  };

  const handleSelectTemplate = useCallback((template: InstructionTemplate) => {
    setSelectedTemplateId(template.id);
    
    // Set title prefix cleanly
    setJudulTugas(prev => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return template.prefix;
      }
      // Check if the current title already starts with another template prefix
      const existingPrefix = INSTRUCTION_TEMPLATES.find(t => trimmed.startsWith(t.prefix.trim()) || trimmed.startsWith(t.prefix));
      if (existingPrefix) {
        // Replace the prefix
        const coreText = trimmed.replace(existingPrefix.prefix, '').replace(existingPrefix.prefix.trim(), '').trim();
        return `${template.prefix}${coreText}`;
      }
      // Prepend prefix to existing custom text
      return `${template.prefix}${trimmed}`;
    });

    // Sync category
    setKategoriTugas(template.kategoriTugas);

    // Sync default priority if set
    if (template.defaultPrioritas) {
      setPrioritas(template.defaultPrioritas);
    }
  }, []);

  const resetForm = useCallback(() => {
    setJudulTugas('');
    setDeskripsi('');
    setBatasWaktu(undefined);
    setKategoriTugas('Lainnya');
    setPrioritas('Sedang');
    setSelectedTemplateId(null);
    setError('');
    setLinkedSurat(null);
    setSuratSearch('');
    setSuratResults([]);
    setSelectedStaffList([]);
    setAssignmentMode('kolaborasi');
    setStafSearch('');
    setMode(isPimpinanOrAdmin ? 'delegasi' : 'mandiri');
    setAudioBlob(null);
    if (audioUrlPreview) URL.revokeObjectURL(audioUrlPreview);
    setAudioUrlPreview(null);
    setIsRecording(false);
    setRecordingDuration(0);
  }, [isPimpinanOrAdmin]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
      if (suratTerkait) {
        setLinkedSurat(suratTerkait as Surat);
        setJudulTugas(`Tindak Lanjut: ${suratTerkait.perihal}`);
        if (suratTerkait.klasifikasi === 'Penting' || suratTerkait.klasifikasi === 'Segera') setPrioritas('Tinggi');
        setMode('delegasi');
      }
      if (initialData) {
        setJudulTugas(initialData.judulTugas);
        setDeskripsi(initialData.deskripsi);
      }
    }
  }, [isOpen, suratTerkait, initialData, resetForm]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrlPreview(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Gagal mengakses mikrofon:", err);
      setError("Gagal mengakses mikrofon. Pastikan izin mikrofon telah diberikan.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    if (audioUrlPreview) URL.revokeObjectURL(audioUrlPreview);
    setAudioUrlPreview(null);
    setRecordingDuration(0);
  };

  const stafSearchResults = useMemo(() => {
    if (!effectiveJabatan || userCache.size === 0) return [];
    const searchLower = stafSearch.toLowerCase();
    const currentSelectedUids = new Set(selectedStaffList.map(u => u.uid));
    const isAdminOpd = userProfile?.role === 'admin_opd';

    const results: UserProfile[] = [];
    userCache.forEach(user => {
      const isBawahan = user.level && effectiveJabatan.level && user.level > effectiveJabatan.level;
      if (
        user.opdId === effectiveJabatan.opdId &&
        (isBawahan || isAdminOpd || user.uid !== userProfile?.uid) &&
        user.status === 'aktif' &&
        !currentSelectedUids.has(user.uid) &&
        (stafSearch.length < 1 || user.namaLengkap.toLowerCase().includes(searchLower) || user.namaJabatan?.toLowerCase().includes(searchLower))
      ) {
        results.push(user);
      }
    });
    return results.slice(0, 15);
  }, [stafSearch, effectiveJabatan, userCache, selectedStaffList, userProfile]);

  useEffect(() => {
    const fetchSurat = async () => {
      if (suratSearch.length < 3 || !userProfile?.opdId) {
        setSuratResults([]);
        return;
      }
      try {
        const q = query(
          collection(db, 'surat'),
          where('opdId', '==', userProfile.opdId),
          where('searchKeywords', 'array-contains', suratSearch.toLowerCase()),
          limit(5)
        );
        const snapshot = await getDocs(q);
        setSuratResults(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Surat)));
      } catch (error) {
        console.error("Error fetching surat:", error);
      }
    };
    const debounce = setTimeout(fetchSurat, 300);
    return () => clearTimeout(debounce);
  }, [suratSearch, userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!judulTugas || !deskripsi || !userProfile || !effectiveJabatan) {
      setError('Harap lengkapi Judul dan Deskripsi Tugas.');
      return;
    }

    if (mode === 'delegasi' && selectedStaffList.length === 0) {
      setError('Harap pilih minimal 1 staf pelaksana tugas.');
      return;
    }

    setLoading(true);

    try {
      let uploadedAudioUrl = '';
      if (audioBlob) {
        const audioStorageRef = ref(storage, `tugas_audio/${userProfile.opdId}/${Date.now()}_directive.webm`);
        await uploadBytes(audioStorageRef, audioBlob);
        uploadedAudioUrl = await getDownloadURL(audioStorageRef);
      }

      if (mode === 'mandiri') {
        const taskPayload = {
          judulTugas,
          deskripsi,
          kepadaJabatanId: effectiveJabatan.id!,
          kepadaJabatanNama: userProfile.namaLengkap,
          collaboratorIds: [],
          kategoriTugas,
          prioritas,
          batasWaktu: batasWaktu ? Timestamp.fromDate(batasWaktu) : null,
          isDelegated: false,
          instruksiTipe: 'mandiri' as const,
          audioUrl: uploadedAudioUrl || undefined,
          suratId: linkedSurat?.id,
          suratPerihal: linkedSurat?.perihal,
        };

        const resId = await createNewTask(taskPayload, userProfile, [userProfile]);
        if (resId) {
          onSuccess(resId);
          onClose();
        }
        return;
      }

      if (assignmentMode === 'split' && selectedStaffList.length > 1) {
        const templatePayload = {
          judulTugas,
          deskripsi,
          kategoriTugas,
          prioritas,
          batasWaktu: batasWaktu ? Timestamp.fromDate(batasWaktu) : null,
          audioUrl: uploadedAudioUrl || undefined,
          suratId: linkedSurat?.id,
          suratPerihal: linkedSurat?.perihal,
        };

        const createdIds = await createBatchTasks(templatePayload, userProfile, selectedStaffList);
        if (createdIds && createdIds.length > 0) {
          onSuccess(createdIds[0]);
          onClose();
        }
      } else {
        const primaryAssignee = selectedStaffList[0];
        const collaborators = selectedStaffList.slice(1);

        const taskPayload = {
          judulTugas,
          deskripsi,
          kepadaJabatanId: primaryAssignee.jabatanId,
          kepadaJabatanNama: primaryAssignee.namaLengkap,
          collaboratorIds: collaborators.map(c => c.jabatanId),
          kategoriTugas,
          prioritas,
          batasWaktu: batasWaktu ? Timestamp.fromDate(batasWaktu) : null,
          isDelegated: true,
          instruksiTipe: 'delegasi_langsung' as const,
          audioUrl: uploadedAudioUrl || undefined,
          suratId: linkedSurat?.id,
          suratPerihal: linkedSurat?.perihal,
        };

        const resId = await createNewTask(taskPayload, userProfile, selectedStaffList);
        if (resId) {
          onSuccess(resId);
          onClose();
        }
      }
    } catch (err: any) {
      console.error("Gagal submit tugas:", err);
      setError(err.message || 'Terjadi kesalahan sistem saat membuat tugas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-[95vh] sm:h-auto sm:max-h-[92vh] sm:max-w-2xl nk-card border-[var(--nk-teal-light)]/20 shadow-[var(--nk-shadow-lg)] flex flex-col p-0 gap-0 overflow-hidden">
        
        {/* Header Dialog */}
        <DialogHeader className="p-4 md:p-6 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Buat Instruksi & Tugas Baru
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Instruksikan pekerjaan langsung ke tim atau catat to-do mandiri
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher */}
          {!suratTerkait && (
            <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-muted/60 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setMode('delegasi')}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'delegasi'
                    ? 'bg-background text-primary shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="w-4 h-4 text-teal-600" />
                <span>Tugaskan Tim / Bawahan</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('mandiri')}
                className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'mandiri'
                    ? 'bg-background text-primary shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Catatan Mandiri (Pribadi)</span>
              </button>
            </div>
          )}
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
            <div className="space-y-4 md:space-y-5">
              
              {error && (
                <div className="p-3 text-xs md:text-sm text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Judul Tugas & Dropdown Select Soft Template */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="judulTugas" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span>Judul Instruksi / Tugas</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  {selectedTemplateId && (
                    <button
                      type="button"
                      onClick={() => setSelectedTemplateId(null)}
                      className="text-[11px] font-medium text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      Reset Templat
                    </button>
                  )}
                </div>

                {/* Dropdown Select Soft Template */}
                <Select
                  value={selectedTemplateId || 'none'}
                  onValueChange={(val) => {
                    if (val === 'none') {
                      setSelectedTemplateId(null);
                      return;
                    }
                    const tmpl = INSTRUCTION_TEMPLATES.find(t => t.id === val);
                    if (tmpl) handleSelectTemplate(tmpl);
                  }}
                >
                  <SelectTrigger className="h-9 text-xs bg-muted/20 border-dashed border-border hover:bg-muted/40 font-normal">
                    <div className="flex items-center gap-2 truncate text-muted-foreground">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">
                        {selectedTemplateId 
                          ? INSTRUCTION_TEMPLATES.find(t => t.id === selectedTemplateId)?.label 
                          : "Pilih Soft Templat / Jenis Instruksi Cepat (Opsional)..."}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    <SelectItem value="none" className="text-xs text-muted-foreground italic">
                      -- Tanpa Templat (Kustom Mandiri) --
                    </SelectItem>
                    {Object.entries(
                      INSTRUCTION_TEMPLATES.reduce<Record<string, InstructionTemplate[]>>((acc, item) => {
                        acc[item.categoryGroup] = acc[item.categoryGroup] || [];
                        acc[item.categoryGroup].push(item);
                        return acc;
                      }, {})
                    ).map(([group, templates]) => (
                      <SelectGroup key={group}>
                        <SelectLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1 bg-muted/40 border-y border-border/40">
                          {group}
                        </SelectLabel>
                        {templates.map(tmpl => (
                          <SelectItem key={tmpl.id} value={tmpl.id} className="text-xs cursor-pointer py-1.5">
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span className="font-semibold text-foreground">{tmpl.label}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">({tmpl.kategoriTugas})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>

                {/* Kolom Input Judul Tugas */}
                <Input
                  id="judulTugas"
                  type="text"
                  placeholder="Contoh: Susun Laporan Realisasi Anggaran Triwulan I"
                  value={judulTugas}
                  onChange={e => {
                    setJudulTugas(e.target.value);
                    if (selectedTemplateId && !e.target.value.includes(':')) {
                      setSelectedTemplateId(null);
                    }
                  }}
                  className="font-medium text-sm md:text-base h-11"
                  required
                />
              </div>

              {/* 2. Pemilihan Staf Pelaksana (Khusus Mode Delegasi) */}
              {mode === 'delegasi' && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-xl border border-border/60">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Staf Pelaksana <span className="text-red-500">*</span>
                    </Label>
                    {selectedStaffList.length > 1 && (
                      <div className="flex items-center gap-1 bg-background px-2 py-0.5 rounded-md border border-border text-[11px]">
                        <button
                          type="button"
                          onClick={() => setAssignmentMode('kolaborasi')}
                          className={`px-1.5 py-0.5 rounded ${assignmentMode === 'kolaborasi' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'}`}
                        >
                          Kolaborasi
                        </button>
                        <button
                          type="button"
                          onClick={() => setAssignmentMode('split')}
                          className={`px-1.5 py-0.5 rounded ${assignmentMode === 'split' ? 'bg-primary text-primary-foreground font-bold' : 'text-muted-foreground'}`}
                        >
                          Split Tiket ({selectedStaffList.length})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Selected Staff Tags */}
                  <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center">
                    {selectedStaffList.map((staff, idx) => (
                      <Badge
                        key={staff.uid}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 gap-1 text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                      >
                        <span className="font-semibold">{idx === 0 && assignmentMode === 'kolaborasi' ? '👑 ' : ''}{staff.namaLengkap}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedStaffList(prev => prev.filter(s => s.uid !== staff.uid))}
                          className="hover:bg-teal-200 dark:hover:bg-teal-800 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}

                    <Popover open={stafPopoverOpen} onOpenChange={setStafPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-dashed text-xs gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>+ Tambah Staf</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Cari nama atau jabatan staf..."
                            value={stafSearch}
                            onValueChange={setStafSearch}
                          />
                          <CommandList className="max-h-56">
                            <CommandEmpty>Staf tidak ditemukan.</CommandEmpty>
                            {stafSearchResults.map(user => (
                              <CommandItem
                                key={user.uid}
                                value={`${user.namaLengkap} ${user.namaJabatan}`}
                                onSelect={() => {
                                  setSelectedStaffList(prev => [...prev, user]);
                                  setStafSearch('');
                                  setStafPopoverOpen(false);
                                }}
                                className="cursor-pointer py-2"
                              >
                                <div>
                                  <p className="font-medium text-xs text-foreground">{user.namaLengkap}</p>
                                  <p className="text-[11px] text-muted-foreground">{user.namaJabatan}</p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* 3. Deskripsi / Instruksi Kerja (Minimal & Bersih) */}
              <div className="space-y-1.5">
                <Label htmlFor="deskripsi" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span>Rincian Instruksi / Catatan</span>
                  <span className="text-muted-foreground/70 font-normal text-[11px] lowercase">(opsional)</span>
                </Label>
                <Textarea
                  id="deskripsi"
                  placeholder="Tuliskan catatan arahan atau petunjuk teknis tambahan jika ada..."
                  value={deskripsi}
                  onChange={e => setDeskripsi(e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>

              {/* 4. Voice Memo / Audio Directive */}
              <div className="p-3 bg-muted/20 rounded-xl border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-rose-500" />
                    <span>Arahan Suara (Voice Memo)</span>
                  </Label>
                  {isRecording && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-600" />
                      Merekam: {recordingDuration}s
                    </span>
                  )}
                </div>

                {!audioUrlPreview ? (
                  <div>
                    {!isRecording ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startRecording}
                        className="text-xs gap-1.5 border-rose-200 text-rose-700 dark:text-rose-400 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>Rekam Arahan Suara (Maks 60 detik)</span>
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={stopRecording}
                        className="text-xs gap-1.5"
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>Selesai Rekam</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border">
                    <audio src={audioUrlPreview} controls className="h-8 flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={deleteRecording}
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* 5. Batas Waktu / Deadline Cepat */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Batas Waktu (Tenggat Pengerjaan)</span>
                  </Label>
                  {batasWaktu && (
                    <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                      {batasWaktu.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickDeadline('today')}
                    className="text-xs h-7 px-2.5 rounded-full"
                  >
                    Hari Ini (17:00)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickDeadline('tomorrow')}
                    className="text-xs h-7 px-2.5 rounded-full"
                  >
                    Besok
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickDeadline('3days')}
                    className="text-xs h-7 px-2.5 rounded-full"
                  >
                    3 Hari Lagi
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickDeadline('weekend')}
                    className="text-xs h-7 px-2.5 rounded-full"
                  >
                    Akhir Pekan
                  </Button>
                </div>

                <DatePicker
                  date={batasWaktu}
                  setDate={setBatasWaktu}
                  className="w-full h-10 text-xs"
                />
              </div>

              {/* 6. Kategori & Prioritas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Kategori Tugas
                  </Label>
                  <Select
                    value={kategoriTugas}
                    onValueChange={(val: any) => setKategoriTugas(val)}
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Penyusunan Laporan">Penyusunan Laporan</SelectItem>
                      <SelectItem value="Analisis Data">Analisis Data</SelectItem>
                      <SelectItem value="Persiapan Materi">Persiapan Materi</SelectItem>
                      <SelectItem value="Koordinasi">Koordinasi</SelectItem>
                      <SelectItem value="Teknis Lapangan">Teknis Lapangan</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Prioritas
                  </Label>
                  <Select
                    value={prioritas}
                    onValueChange={(val: any) => setPrioritas(val)}
                  >
                    <SelectTrigger className="h-10 text-xs">
                      <SelectValue placeholder="Pilih Prioritas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Rendah">🟢 Rendah</SelectItem>
                      <SelectItem value="Sedang">🟡 Sedang</SelectItem>
                      <SelectItem value="Tinggi">🔴 Tinggi (Mendesak)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 7. Tautkan Surat (Opsional) */}
              {!initialData && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tautkan Surat Masuk (Opsional)
                  </Label>
                  {linkedSurat ? (
                    <div className="flex items-center justify-between p-2.5 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-800">
                      <div className="truncate pr-2">
                        <p className="text-xs font-semibold text-teal-900 dark:text-teal-300 truncate">{linkedSurat.perihal}</p>
                        <p className="text-[11px] text-teal-700/80 dark:text-teal-400 truncate">{linkedSurat.nomorSurat}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-teal-600"
                        onClick={() => { setLinkedSurat(null); setSuratSearch(''); }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Popover open={suratPopoverOpen} onOpenChange={setSuratPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Input
                          placeholder="Ketik minimal 3 huruf perihal surat..."
                          value={suratSearch}
                          onChange={e => {
                            setSuratSearch(e.target.value);
                            setSuratPopoverOpen(e.target.value.length >= 3);
                          }}
                          className="text-xs h-9"
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-0" align="start">
                        <Command>
                          <CommandList>
                            {suratResults.map(s => (
                              <CommandItem
                                key={s.id}
                                onSelect={() => {
                                  setLinkedSurat(s);
                                  setSuratResults([]);
                                  setSuratSearch('');
                                  setSuratPopoverOpen(false);
                                }}
                                className="cursor-pointer py-2"
                              >
                                <div>
                                  <p className="text-xs font-semibold text-foreground">{s.perihal}</p>
                                  <p className="text-[11px] text-muted-foreground">{s.nomorSurat}</p>
                                </div>
                              </CommandItem>
                            ))}
                            <CommandEmpty>{suratSearch.length < 3 ? 'Ketik min 3 karakter' : 'Surat tidak ditemukan.'}</CommandEmpty>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}

            </div>
          </ScrollArea>

          {/* Footer Aksi */}
          <div className="p-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="text-xs h-9 px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || isRecording}
              className="text-xs h-9 px-5 font-semibold gap-1.5 bg-[var(--nk-teal-mid)] hover:opacity-90 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{mode === 'delegasi' ? (assignmentMode === 'split' && selectedStaffList.length > 1 ? `Kirim ${selectedStaffList.length} Tugas` : 'Kirim Instruksi Tugas') : 'Simpan Tugas Mandiri'}</span>
                </>
              )}
            </Button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}
