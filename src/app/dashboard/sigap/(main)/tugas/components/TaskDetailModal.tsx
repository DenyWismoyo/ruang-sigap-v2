/**
 * Directory: src/app/dashboard/sigap/(main)/tugas/components/TaskDetailModal.tsx
 * Status: REFACTORED - FULL LIFECYCLE & REVIEW APPROVAL SUPPORT
 * Deskripsi: Modal Detail Tugas dengan Checklist, Audio Directive, Verifikasi Atasan, dan Komentar.
 */

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUserAuth } from '@/context/AuthContext';
import { Tugas, TugasKomentar, UserProfile, SubTugas, Surat, TugasLampiran } from '@/types';
import { 
  X, Trash2, Plus, MessageSquare, Link as LinkIcon, Mail, Loader2, Send, 
  CheckCircle2, Clock, AlertTriangle, FileText, CheckSquare, Play, RotateCcw,
  Volume2, ExternalLink, UserCheck, ShieldAlert
} from 'lucide-react';
import { formatDateRelative } from '@/lib/utils';
import CachedPdfViewer from '../../surat/[id]/components/CachedPdfViewer';
import { useTugasActions } from '@/app/dashboard/sigap/hooks/useTugasActions';
import TaskReportModal from './TaskReportModal';

// Shadcn Components
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tugas: Tugas | null;
  userCache: Map<string, UserProfile>;
}

export default function TaskDetailModal({ isOpen, onClose, tugas, userCache }: TaskDetailModalProps) {
  const { userProfile, actingJabatanProfile, jabatanProfile } = useUserAuth();
  const effectiveJabatan = actingJabatanProfile || jabatanProfile;
  
  const { 
    addSubTask, toggleSubTask, removeSubTask, 
    addComment, addAttachment, updateTaskStatus,
    approveTask, requestTaskRevision, isProcessing 
  } = useTugasActions();
  
  const [komentar, setKentar] = useState('');
  const [daftarKomentar, setDaftarKomentar] = useState<TugasKomentar[]>([]);
  const [newSubTaskText, setNewSubTaskText] = useState('');
  const [activeTab, setActiveTab] = useState<'rincian' | 'checklist' | 'komentar' | 'lampiran'>('rincian');

  // Revision Form State
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Link Attachment State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);

  // Subscribe Komentar Realtime
  useEffect(() => {
    if (!tugas?.id) return;
    const q = query(collection(db, 'komentarTugas'), where('tugasId', '==', tugas.id), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setDaftarKomentar(snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      } as TugasKomentar)));
    });
    return () => unsub();
  }, [tugas?.id]);

  if (!tugas) return null;

  const isAssigner = effectiveJabatan?.id === tugas.dariJabatanId;
  const isAssignee = effectiveJabatan?.id === tugas.kepadaJabatanId;
  const isCollaborator = tugas.collaboratorIds?.includes(effectiveJabatan?.id || '');
  const canPerformAction = isAssignee || isCollaborator || isAssigner;

  // Subtask Progress
  const totalSubtasks = tugas.subTugas?.length || 0;
  const completedSubtasks = tugas.subTugas?.filter(st => st.selesai).length || 0;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleAddSubTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubTaskText.trim() || !tugas.id) return;
    const newSub: SubTugas = {
      id: `sub_${Date.now()}`,
      teks: newSubTaskText.trim(),
      selesai: false,
    };
    await addSubTask(tugas.id, newSub);
    setNewSubTaskText('');
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!komentar.trim() || !tugas.id) return;
    await addComment(tugas.id, komentar.trim());
    setKentar('');
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim() || !linkName.trim() || !tugas.id) return;
    const attachment: TugasLampiran = {
      name: linkName.trim(),
      url: linkUrl.trim(),
      uploadedAt: Timestamp.now(),
      type: 'link',
    };
    await addAttachment(tugas.id, attachment);
    setLinkUrl('');
    setLinkName('');
    setShowLinkForm(false);
  };

  const handleApprove = async () => {
    await approveTask(tugas);
  };

  const handleSendRevision = async () => {
    if (!revisionNote.trim()) return;
    await requestTaskRevision(tugas, revisionNote.trim());
    setIsRevisionOpen(false);
    setRevisionNote('');
  };

  const getStatusBadge = (status: Tugas['status']) => {
    switch (status) {
      case 'Baru':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200">Baru</Badge>;
      case 'Dikerjakan':
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200">Sedang Dikerjakan</Badge>;
      case 'Menunggu Review':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 animate-pulse">Menunggu Review Atasan</Badge>;
      case 'Revisi':
        return <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200">Perlu Revisi</Badge>;
      case 'Selesai':
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200">Selesai</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-full h-[95vh] sm:h-auto sm:max-h-[92vh] sm:max-w-2xl bg-card border-border flex flex-col p-0 gap-0 shadow-2xl overflow-hidden">
          
          {/* Header Modal */}
          <DialogHeader className="p-4 md:p-5 border-b border-border bg-muted/20">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(tugas.status)}
                  <Badge variant="outline" className="text-[11px]">{tugas.kategoriTugas || 'Umum'}</Badge>
                  <Badge variant={tugas.prioritas === 'Tinggi' ? 'destructive' : 'secondary'} className="text-[11px]">
                    Prioritas {tugas.prioritas}
                  </Badge>
                </div>
                <DialogTitle className="text-base md:text-lg font-bold text-foreground leading-snug">
                  {tugas.judulTugas}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>Dari: <strong>{tugas.dariJabatanNama || 'Atasan'}</strong></span>
                  <span>•</span>
                  <span>PJ: <strong>{tugas.kepadaJabatanNama || 'Staf'}</strong></span>
                  {tugas.batasWaktu && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                        <Clock className="w-3 h-3" />
                        Tenggat: {tugas.batasWaktu.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 mt-3 border-t border-border pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('rincian')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'rincian' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Rincian & Hasil
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('checklist')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'checklist' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Checklist ({completedSubtasks}/{totalSubtasks})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('komentar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'komentar' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Diskusi ({daftarKomentar.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('lampiran')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'lampiran' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Lampiran ({tugas.lampiran?.length || 0})</span>
              </button>
            </div>
          </DialogHeader>

          {/* Modal Content Body */}
          <ScrollArea className="flex-1 overflow-y-auto p-4 md:p-5">
            
            {/* TAB 1: RINCIAN & LAPORAN HASIL */}
            {activeTab === 'rincian' && (
              <div className="space-y-4">
                
                {/* Audio Memo Directive */}
                {tugas.audioUrl && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-800 space-y-2">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold">
                      <Volume2 className="w-4 h-4" />
                      <span>Rekaman Arahan Suara Pimpinan</span>
                    </div>
                    <audio src={tugas.audioUrl} controls className="w-full h-8" />
                  </div>
                )}

                {/* Deskripsi Instruksi */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Instruksi Kerja
                  </Label>
                  <div className="p-3.5 bg-muted/40 rounded-xl border border-border text-xs md:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {tugas.deskripsi}
                  </div>
                </div>

                {/* Catatan Revisi jika ada */}
                {tugas.catatanRevisi && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-900/30 rounded-xl border border-rose-300 dark:border-rose-700 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      Catatan Perbaikan / Revisi dari Atasan:
                    </p>
                    <p className="pl-5 leading-relaxed">{tugas.catatanRevisi}</p>
                  </div>
                )}

                {/* Laporan Hasil Pengerjaan */}
                {tugas.laporanHasil && (
                  <div className="p-4 bg-emerald-50/70 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Laporan Hasil Pengerjaan Staf</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {tugas.laporanHasil.diserahkanPada?.toDate().toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {tugas.laporanHasil.ringkasan}
                    </p>
                    {tugas.laporanHasil.buktiUrl && (
                      <div className="pt-2">
                        <a
                          href={tugas.laporanHasil.buktiUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka Bukti Dokumen / File</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            {/* TAB 2: CHECKLIST SUB-TUGAS */}
            {activeTab === 'checklist' && (
              <div className="space-y-4">
                {totalSubtasks > 0 && (
                  <div className="space-y-1.5 bg-muted/30 p-3 rounded-xl border border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-muted-foreground">Progres Pengerjaan</span>
                      <span className="font-bold text-foreground">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}

                {/* List Items */}
                <div className="space-y-2">
                  {tugas.subTugas && tugas.subTugas.length > 0 ? (
                    tugas.subTugas.map(st => (
                      <div
                        key={st.id}
                        className="flex items-center justify-between p-2.5 bg-card rounded-lg border border-border text-xs"
                      >
                        <div className="flex items-center gap-2.5 flex-1">
                          <Checkbox
                            id={`st-${st.id}`}
                            checked={st.selesai}
                            onCheckedChange={() => toggleSubTask(tugas.id!, tugas.subTugas || [], st.id)}
                          />
                          <Label
                            htmlFor={`st-${st.id}`}
                            className={`cursor-pointer leading-tight ${st.selesai ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}
                          >
                            {st.teks}
                          </Label>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubTask(tugas.id!, st)}
                          className="h-6 w-6 text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Belum ada item checklist.</p>
                  )}
                </div>

                {/* Add Subtask Form */}
                <form onSubmit={handleAddSubTask} className="flex gap-2">
                  <Input
                    placeholder="Tambah item checklist baru..."
                    value={newSubTaskText}
                    onChange={e => setNewSubTaskText(e.target.value)}
                    className="text-xs h-9"
                  />
                  <Button type="submit" size="sm" className="h-9 px-3 text-xs gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </Button>
                </form>
              </div>
            )}

            {/* TAB 3: DISKUSI / KOMENTAR */}
            {activeTab === 'komentar' && (
              <div className="space-y-4">
                <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                  {daftarKomentar.length > 0 ? (
                    daftarKomentar.map(k => (
                      <div key={k.id} className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{k.userName} ({k.userJabatan})</span>
                          <span className="text-[10px] text-muted-foreground">{k.timestamp ? formatDateRelative(k.timestamp) : ''}</span>
                        </div>
                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{k.komentar}</p>
                      </div>
                    ))
                  ) : (

                    <p className="text-xs text-muted-foreground text-center py-6">Belum ada komentar atau catatan diskusi.</p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2 pt-2 border-t border-border">
                  <Input
                    placeholder="Tulis pesan atau perkembangan..."
                    value={komentar}
                    onChange={e => setKentar(e.target.value)}
                    className="text-xs h-9"
                  />
                  <Button type="submit" size="sm" className="h-9 px-3 text-xs gap-1">
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim</span>
                  </Button>
                </form>
              </div>
            )}

            {/* TAB 4: LAMPIRAN & TAUTAN */}
            {activeTab === 'lampiran' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {tugas.lampiran && tugas.lampiran.length > 0 ? (
                    tugas.lampiran.map((lamp, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border text-xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <LinkIcon className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-medium text-foreground truncate">{lamp.name}</span>
                        </div>
                        <a
                          href={lamp.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 font-semibold text-xs shrink-0"
                        >
                          <span>Buka</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-6">Belum ada lampiran atau tautan referensi.</p>
                  )}
                </div>

                {!showLinkForm ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLinkForm(true)}
                    className="text-xs h-8 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tautkan Dokumen / Link Baru</span>
                  </Button>
                ) : (
                  <form onSubmit={handleAddLink} className="p-3 bg-muted/40 rounded-xl border border-border space-y-2">
                    <Input
                      placeholder="Nama Dokumen (Contoh: Draft Google Sheet)"
                      value={linkName}
                      onChange={e => setLinkName(e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                    <Input
                      type="url"
                      placeholder="Tautan URL (https://...)"
                      value={linkUrl}
                      onChange={e => setLinkUrl(e.target.value)}
                      className="text-xs h-8"
                      required
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="ghost" size="sm" onClick={() => setShowLinkForm(false)} className="text-xs h-7">
                        Batal
                      </Button>
                      <Button type="submit" size="sm" className="text-xs h-7">
                        Simpan Tautan
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

          </ScrollArea>

          {/* Footer Action Bar */}
          <div className="p-4 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2">
            
            {/* Left: Quick Status Action for Staf */}
            <div className="flex items-center gap-2">
              {tugas.status === 'Baru' && isAssignee && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateTaskStatus(tugas, 'Dikerjakan')}
                  className="text-xs h-9 gap-1.5 border-amber-300 text-amber-700 dark:text-amber-300 hover:bg-amber-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Mulai Kerjakan</span>
                </Button>
              )}

              {(tugas.status === 'Dikerjakan' || tugas.status === 'Revisi') && isAssignee && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-xs h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Serahkan Laporan Hasil</span>
                </Button>
              )}
            </div>

            {/* Right: Atasan Verification Review Actions */}
            <div className="flex items-center gap-2">
              {tugas.status === 'Menunggu Review' && isAssigner && (
                <>
                  {!isRevisionOpen ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRevisionOpen(true)}
                        className="text-xs h-9 gap-1.5 border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Minta Revisi</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="text-xs h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Setujui & Selesaikan</span>
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Tuliskan poin revisi..."
                        value={revisionNote}
                        onChange={e => setRevisionNote(e.target.value)}
                        className="text-xs h-9 w-48 sm:w-64"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={handleSendRevision}
                        disabled={!revisionNote.trim() || isProcessing}
                        className="text-xs h-9"
                      >
                        Kirim
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsRevisionOpen(false)}
                        className="text-xs h-9"
                      >
                        Batal
                      </Button>
                    </div>
                  )}
                </>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs h-9 px-4"
              >
                Tutup
              </Button>
            </div>

          </div>

        </DialogContent>
      </Dialog>

      {/* Task Report Modal */}
      <TaskReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        tugas={tugas}
        onSuccess={() => {
          setIsReportModalOpen(false);
          onClose();
        }}
      />
    </>
  );
}