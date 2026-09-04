/**
 * Directory: src/app/dashboard/poros/(main)/tugas/components/TaskReportModal.tsx
 * Status: NEW COMPONENT - TASK COMPLETION REPORT & LOGBOOK INTEGRATION (POROS)
 * Deskripsi: Modal penyerahan laporan hasil kerja tugas untuk review atasan dan pencatatan logbook di tenant POROS.
 */

"use client";

import React, { useState } from 'react';
import { Tugas } from '@/types';
import { useUserAuth } from '@/context/AuthContext';
import { useTugasActions } from '@/app/dashboard/poros/hooks/useTugasActions';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileText, Send, CheckCircle2, UploadCloud, Link as LinkIcon, 
  Loader2, AlertCircle, X 
} from 'lucide-react';

interface TaskReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tugas: Tugas | null;
  onSuccess?: () => void;
}

export default function TaskReportModal({ isOpen, onClose, tugas, onSuccess }: TaskReportModalProps) {
  const { userProfile, actingJabatanProfile, jabatanProfile } = useUserAuth();
  const { submitTaskReport, isProcessing } = useTugasActions();

  const [ringkasan, setRingkasan] = useState('');
  const [buktiUrl, setBuktiUrl] = useState('');
  const [catatanTambahan, setCatatanTambahan] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [autoLogbook, setAutoLogbook] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  if (!tugas) return null;

  const isMandiri = tugas.dariJabatanId === tugas.kepadaJabatanId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!ringkasan.trim()) {
      setError('Harap isi ringkasan hasil pengerjaan.');
      return;
    }

    setIsUploading(true);
    try {
      let finalBuktiUrl = buktiUrl.trim();

      if (fileToUpload && userProfile?.opdId) {
        const fileRef = ref(storage, `tugas_bukti/${userProfile.opdId}/${Date.now()}_${fileToUpload.name}`);
        await uploadBytes(fileRef, fileToUpload);
        finalBuktiUrl = await getDownloadURL(fileRef);
      }

      const success = await submitTaskReport(
        tugas,
        {
          ringkasan: ringkasan.trim(),
          buktiUrl: finalBuktiUrl || undefined,
          catatanTambahan: catatanTambahan.trim() || undefined,
        },
        autoLogbook
      );

      if (success) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error("Gagal submit laporan tugas:", err);
      setError(err.message || 'Terjadi kesalahan saat menyerahkan laporan.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-lg nk-card border-[var(--nk-teal-light)]/20 shadow-[var(--nk-shadow-lg)] flex flex-col p-0 gap-0 overflow-hidden">
        
        {/* Header Modal */}
        <DialogHeader className="p-4 md:p-5 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-teal-600/10 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base md:text-lg font-bold text-foreground">
                {isMandiri ? 'Selesaikan Tugas Mandiri' : 'Serahkan Laporan Hasil Pengerjaan'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {tugas.judulTugas}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-4 md:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            
            {error && (
              <div className="p-3 text-xs text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Info Instruksi Awal */}
            <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs space-y-1">
              <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                Instruksi dari {tugas.dariJabatanNama || 'Atasan'}
              </p>
              <p className="text-foreground text-xs leading-relaxed line-clamp-3">
                {tugas.deskripsi}
              </p>
            </div>

            {/* 1. Ringkasan Hasil Pengerjaan */}
            <div className="space-y-1.5">
              <Label htmlFor="ringkasan" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ringkasan Hasil Kerja <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="ringkasan"
                placeholder="Contoh: Dokumen materi workshop telah selesai disusun dan diunggah..."
                value={ringkasan}
                onChange={e => setRingkasan(e.target.value)}
                rows={3}
                className="text-xs md:text-sm resize-none"
                required
              />
            </div>

            {/* 2. Lampiran Bukti File / URL */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Bukti Hasil Kerja (File / Tautan Dokumen)</span>
              </Label>

              <div className="grid grid-cols-1 gap-2">
                <Input
                  type="file"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setFileToUpload(e.target.files[0]);
                    }
                  }}
                  className="text-xs h-9 cursor-pointer file:cursor-pointer file:font-semibold"
                />

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="url"
                      placeholder="Atau tautkan link Google Drive / Docs / PDF..."
                      value={buktiUrl}
                      onChange={e => setBuktiUrl(e.target.value)}
                      className="text-xs h-9 pl-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Catatan Tambahan (Opsional) */}
            <div className="space-y-1.5">
              <Label htmlFor="catatan" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Catatan / Hambatan (Opsional)
              </Label>
              <Input
                id="catatan"
                placeholder="Catatan tambahan untuk atasan (jika ada)..."
                value={catatanTambahan}
                onChange={e => setCatatanTambahan(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {/* 4. Auto Logbook Option */}
            <div className="p-3 bg-teal-50/70 dark:bg-teal-900/20 rounded-xl border border-teal-200 dark:border-teal-800 flex items-start space-x-2.5">
              <Checkbox
                id="autoLogbook"
                checked={autoLogbook}
                onCheckedChange={(checked) => setAutoLogbook(checked as boolean)}
                className="mt-0.5"
              />
              <div className="grid gap-0.5 leading-none">
                <Label htmlFor="autoLogbook" className="text-xs font-semibold text-teal-900 dark:text-teal-300 cursor-pointer">
                  Otomatis Catat ke Logbook Harian
                </Label>
                <p className="text-[11px] text-teal-700/80 dark:text-teal-400">
                  Hasil kerja ini akan langsung tercatat sebagai aktivitas logbook kinerja Anda hari ini.
                </p>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing || isUploading}
              className="text-xs h-9 px-4"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || isUploading}
              className="text-xs h-9 px-5 font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isProcessing || isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengirim Laporan...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isMandiri ? 'Selesaikan Tugas' : 'Kirim Laporan untuk Review'}</span>
                </>
              )}
            </Button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}
