// Lokasi: src/app/dashboard/sigap/(main)/jadwal/components/ScanSuratInternalModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useUserAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { OPD } from '@/types';
import Script from 'next/script';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  Loader2,
  X,
  Plus,
  AlertCircle
} from 'lucide-react';

interface ScanSuratInternalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AI_COOLDOWN_SECONDS = 20;

export default function ScanSuratInternalModal({
  isOpen,
  onClose,
  onSuccess,
}: ScanSuratInternalModalProps) {
  const { userProfile } = useUserAuth();
  const { addToast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [isPdfJsReady, setIsPdfJsReady] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  // Daftar ruangan dari master OPD
  const [daftarRuangan, setDaftarRuangan] = useState<string[]>([]);

  // State Form Ekstraksi & Konfirmasi
  const [kegiatan, setKegiatan] = useState('');
  const [jenis, setJenis] = useState<'Fisik' | 'Virtual'>('Fisik');
  const [namaTempat, setNamaTempat] = useState('');
  const [tautanRapat, setTautanRapat] = useState('');
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [jamMulai, setJamMulai] = useState('');
  const [jamSelesai, setJamSelesai] = useState('');
  const [penanggungJawab, setPenanggungJawab] = useState('');
  const [jumlahPersonil, setJumlahPersonil] = useState('');
  
  // State Tag Peserta
  const [pesertaList, setPesertaList] = useState<string[]>([]);
  const [pesertaInput, setPesertaInput] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  // Load master ruangan OPD
  useEffect(() => {
    if (isOpen && userProfile?.opdId) {
      getDoc(doc(db, 'opd', userProfile.opdId)).then((snap) => {
        if (snap.exists()) {
          const opdData = snap.data() as OPD;
          if (opdData.daftarRuangan && Array.isArray(opdData.daftarRuangan)) {
            setDaftarRuangan(opdData.daftarRuangan);
          }
        }
      }).catch(err => console.error("Gagal load ruangan OPD:", err));
    }
  }, [isOpen, userProfile]);

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setIsAnalyzing(false);
      setAnalysisSuccess(false);
      setIsUploading(false);
      setKegiatan('');
      setJenis('Fisik');
      setNamaTempat('');
      setTautanRapat('');
      setTanggalMulai(new Date().toISOString().split('T')[0]);
      setJamMulai('');
      setJamSelesai('');
      setPenanggungJawab(userProfile?.namaLengkap || '');
      setJumlahPersonil('');
      setPesertaList([]);
      setPesertaInput('');
      setErrorMessage('');

      // Cek cooldown
      if (userProfile?.uid) {
        const lastCall = localStorage.getItem(`ai_agenda_last_call_${userProfile.uid}`);
        if (lastCall) {
          const timeElapsed = Math.floor((Date.now() - parseInt(lastCall)) / 1000);
          if (timeElapsed < AI_COOLDOWN_SECONDS) {
            setCooldownRemaining(AI_COOLDOWN_SECONDS - timeElapsed);
          }
        }
      }
    }
  }, [isOpen, userProfile]);

  // Timer cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cooldownRemaining > 0) {
      interval = setInterval(() => {
        setCooldownRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(selected.type)) {
        addToast("Format file harus berupa PDF atau Gambar (JPG, PNG, WEBP).", "error");
        return;
      }
      if (selected.size > 10 * 1024 * 1024) {
        addToast("Ukuran berkas maksimal adalah 10MB.", "error");
        return;
      }
      setFile(selected);
      setAnalysisSuccess(false);
      setErrorMessage('');
    }
  };

  const handleAddPeserta = () => {
    const trimmed = pesertaInput.trim();
    if (trimmed && !pesertaList.includes(trimmed)) {
      setPesertaList(prev => [...prev, trimmed]);
      setPesertaInput('');
    }
  };

  const handleRemovePeserta = (indexToRemove: number) => {
    setPesertaList(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDownPeserta = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddPeserta();
    }
  };

  // Fungsi Scan Dokumen via AI
  const handleScanWithAI = async () => {
    if (!file) {
      addToast("Harap pilih berkas surat internal terlebih dahulu.", "error");
      return;
    }

    if (cooldownRemaining > 0) {
      addToast(`Sistem Anti-Spam aktif. Harap tunggu ${cooldownRemaining} detik lagi.`, "error");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage('');
    setAnalysisSuccess(false);

    if (userProfile?.uid) {
      localStorage.setItem(`ai_agenda_last_call_${userProfile.uid}`, Date.now().toString());
      setCooldownRemaining(AI_COOLDOWN_SECONDS);
    }

    try {
      const base64Images: string[] = [];

      if (file.type === 'application/pdf') {
        if (!isPdfJsReady && !window.pdfjsLib) {
          throw new Error("Pustaka PDF viewer sedang disiapkan. Silakan coba beberapa detik lagi.");
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdfjsLib = window.pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = Math.min(pdf.numPages, 5); // Baca hingga 5 halaman dokumen & lampiran

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.2 });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            const pageData = canvas.toDataURL('image/jpeg', 0.65).split(',')[1];
            base64Images.push(pageData);
          }
        }
      } else {
        // Untuk file gambar
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type });
        const img = new Image();
        const imgUrl = URL.createObjectURL(blob);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imgUrl;
        });

        const canvas = document.createElement('canvas');
        const maxDimension = 1400;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Gagal memproses gambar.");
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = canvas.toDataURL('image/jpeg', 0.65).split(',')[1];
        base64Images.push(imgData);
        URL.revokeObjectURL(imgUrl);
      }

      if (base64Images.length === 0) {
        throw new Error("Gagal mengekstrak gambar dari berkas.");
      }

      const functionsInstance = getFunctions(db.app, 'asia-southeast2');
      const scanAgendaAI = httpsCallable(functionsInstance, 'extractAgendaInternalAIV2');

      const response = await scanAgendaAI({ 
        base64Image: base64Images[0], 
        base64Images: base64Images 
      });
      const parsed = response.data as any;

      if (parsed) {
        if (parsed.kegiatan) setKegiatan(parsed.kegiatan);
        if (parsed.tanggalMulai) setTanggalMulai(parsed.tanggalMulai);
        if (parsed.jamMulai) setJamMulai(parsed.jamMulai);
        if (parsed.jamSelesai) setJamSelesai(parsed.jamSelesai);
        if (parsed.jenis) setJenis(parsed.jenis === 'Virtual' ? 'Virtual' : 'Fisik');
        if (parsed.tautanRapat) setTautanRapat(parsed.tautanRapat);
        if (parsed.penanggungJawab) setPenanggungJawab(parsed.penanggungJawab);
        if (parsed.jumlahPersonil) setJumlahPersonil(String(parsed.jumlahPersonil));

        // Lokasi / Tempat
        if (parsed.namaTempat && parsed.jenis !== 'Virtual') {
          // Cari kecocokan di master ruangan OPD
          const matchRuangan = daftarRuangan.find(r => 
            r.toLowerCase().includes(parsed.namaTempat.toLowerCase()) ||
            parsed.namaTempat.toLowerCase().includes(r.toLowerCase())
          );
          setNamaTempat(matchRuangan || parsed.namaTempat);
        }

        // Peserta
        if (parsed.peserta && Array.isArray(parsed.peserta)) {
          setPesertaList(parsed.peserta);
        }

        setAnalysisSuccess(true);
        addToast("Dokumen berhasil dipindai oleh AI! Silakan periksa dan simpan jadwal.", "success");
      }
    } catch (err: any) {
      console.error("AI Scan Error:", err);
      const msg = err.message || "Gagal memindai dokumen internal via AI.";
      setErrorMessage(msg);
      addToast(msg, "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simpan Jadwal ke Firestore
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kegiatan.trim()) {
      addToast("Nama kegiatan / rapat tidak boleh kosong.", "error");
      return;
    }
    if (!jamMulai.trim()) {
      addToast("Jam mulai harus diisi.", "error");
      return;
    }
    if (jenis === 'Fisik' && !namaTempat.trim()) {
      addToast("Nama ruangan / tempat rapat harus diisi.", "error");
      return;
    }
    if (jenis === 'Virtual' && !tautanRapat.trim()) {
      addToast("Tautan rapat virtual harus diisi.", "error");
      return;
    }

    setIsUploading(true);

    try {
      let uploadedFileUrl = '';
      let uploadedFileName = '';
      let uploadedFileType = '';

      // Upload berkas jika ada
      if (file && userProfile?.opdId) {
        const storagePath = `opd/${userProfile.opdId}/agenda_internal/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const storageRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(storageRef, file);
        uploadedFileUrl = await getDownloadURL(snapshot.ref);
        uploadedFileName = file.name;
        uploadedFileType = file.type;
      }

      // Format Timestamp gabungan tanggal + jam
      const datePart = new Date(tanggalMulai + 'T00:00:00');
      const [hours, minutes] = jamMulai.split(':').map(Number);
      datePart.setHours(hours || 0, minutes || 0, 0, 0);

      const payload = {
        kegiatan: kegiatan.trim(),
        jenis,
        namaTempat: jenis === 'Virtual' ? 'Virtual' : namaTempat.trim(),
        tautanRapat: jenis === 'Virtual' ? tautanRapat.trim() : '',
        opdId: userProfile!.opdId,
        penanggungJawab: penanggungJawab.trim() || userProfile!.namaLengkap,
        tanggalMulai: Timestamp.fromDate(datePart),
        jamMulai: jamMulai.trim(),
        jamSelesai: jamSelesai.trim() || (hours ? `${String(hours + 2).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` : 'Selesai'),
        jumlahPersonil: jumlahPersonil ? Number(jumlahPersonil) : (pesertaList.length > 0 ? pesertaList.length : null),
        peserta: pesertaList,
        status: 'Menunggu Persetujuan' as const,
        createdBy: userProfile!.uid,
        createdAt: Timestamp.now(),
        ...(uploadedFileUrl ? {
          suratUrl: uploadedFileUrl,
          suratFileName: uploadedFileName,
          suratFileType: uploadedFileType,
        } : {})
      };

      await addDoc(collection(db, 'jadwalTempat'), payload);
      addToast("Agenda internal berhasil didaftarkan dan menunggu persetujuan!", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Gagal menyimpan jadwal internal:", err);
      addToast(err.message || "Gagal menyimpan jadwal internal.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Script PDF.js untuk rendering kanvas */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        onLoad={() => setIsPdfJsReady(true)}
      />

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center text-foreground gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Scan & Buat Jadwal dari Surat Internal
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Unggah berkas undangan rapat internal, nota dinas, atau memo untuk mengekstrak agenda dan daftar peserta otomatis via AI.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            {/* Area Unggah Dokumen Internal */}
            <div className="p-4 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <Label htmlFor="file-surat-internal" className="text-sm font-semibold cursor-pointer text-foreground block">
                    {file ? file.name : "Pilih Berkas Surat / Undangan Internal"}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • ${file.type}` : "Mendukung file PDF atau Gambar (JPG, PNG) maks 10MB"}
                  </p>
                  <input
                    id="file-surat-internal"
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="flex gap-2 shrink-0">
                  <Label
                    htmlFor="file-surat-internal"
                    className="cursor-pointer inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {file ? "Ganti File" : "Pilih File"}
                  </Label>

                  {file && (
                    <Button
                      type="button"
                      onClick={handleScanWithAI}
                      disabled={isAnalyzing || cooldownRemaining > 0}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2 h-auto"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Memindai AI...
                        </>
                      ) : cooldownRemaining > 0 ? (
                        <>
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          Tunggu ({cooldownRemaining}s)
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          Scan AI
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {analysisSuccess && (
                <div className="mt-3 flex items-center gap-2 text-xs text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/40 p-2.5 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
                  <span>AI berhasil mengekstrak data kegiatan, waktu, lokasi, dan daftar peserta. Silakan tinjau di bawah.</span>
                </div>
              )}

              {errorMessage && (
                <div className="mt-3 flex items-center gap-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-lg border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Field Rincian Jadwal */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="kegiatan" className="text-xs font-semibold text-foreground">
                  Nama Kegiatan / Rapat <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="kegiatan"
                  placeholder="Contoh: Rapat Koordinasi Persiapan LPPD 2026"
                  value={kegiatan}
                  onChange={(e) => setKegiatan(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tanggalMulai" className="text-xs font-semibold text-foreground">
                    Tanggal Pelaksanaan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tanggalMulai"
                    type="date"
                    value={tanggalMulai}
                    onChange={(e) => setTanggalMulai(e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="jamMulai" className="text-xs font-semibold text-foreground">
                      Jam Mulai <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="jamMulai"
                      type="time"
                      value={jamMulai}
                      onChange={(e) => setJamMulai(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="jamSelesai" className="text-xs font-semibold text-foreground">
                      Jam Selesai
                    </Label>
                    <Input
                      id="jamSelesai"
                      type="time"
                      value={jamSelesai}
                      onChange={(e) => setJamSelesai(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jenis" className="text-xs font-semibold text-foreground">
                    Jenis Pertemuan
                  </Label>
                  <Select value={jenis} onValueChange={(val: 'Fisik' | 'Virtual') => setJenis(val)}>
                    <SelectTrigger id="jenis" className="mt-1">
                      <SelectValue placeholder="Pilih Jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fisik">Fisik (Tatap Muka di Ruangan)</SelectItem>
                      <SelectItem value="Virtual">Virtual (Video Conference)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {jenis === 'Fisik' ? (
                  <div>
                    <Label htmlFor="namaTempat" className="text-xs font-semibold text-foreground">
                      Ruangan / Tempat <span className="text-destructive">*</span>
                    </Label>
                    {daftarRuangan.length > 0 ? (
                      <div className="mt-1 space-y-1.5">
                        <Select value={namaTempat} onValueChange={setNamaTempat}>
                          <SelectTrigger id="namaTempat">
                            <SelectValue placeholder="Pilih Ruangan OPD" />
                          </SelectTrigger>
                          <SelectContent>
                            {daftarRuangan.map((r, i) => (
                              <SelectItem key={i} value={r}>{r}</SelectItem>
                            ))}
                            <SelectItem value="__custom__">+ Tulis Ruangan Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                        {(!daftarRuangan.includes(namaTempat) || namaTempat === '__custom__') && (
                          <Input
                            placeholder="Ketik nama ruangan/tempat..."
                            value={namaTempat === '__custom__' ? '' : namaTempat}
                            onChange={(e) => setNamaTempat(e.target.value)}
                            className="mt-1"
                          />
                        )}
                      </div>
                    ) : (
                      <Input
                        id="namaTempat"
                        placeholder="Contoh: Ruang Rapat Lt. 2"
                        value={namaTempat}
                        onChange={(e) => setNamaTempat(e.target.value)}
                        className="mt-1"
                        required
                      />
                    )}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="tautanRapat" className="text-xs font-semibold text-foreground">
                      Tautan Rapat Virtual (Zoom/Meet) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="tautanRapat"
                      placeholder="https://meet.google.com/... atau Zoom link"
                      value={tautanRapat}
                      onChange={(e) => setTautanRapat(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="penanggungJawab" className="text-xs font-semibold text-foreground">
                    Penanggung Jawab / Pengundang
                  </Label>
                  <Input
                    id="penanggungJawab"
                    placeholder="Nama penanggung jawab kegiatan"
                    value={penanggungJawab}
                    onChange={(e) => setPenanggungJawab(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="jumlahPersonil" className="text-xs font-semibold text-foreground">
                    Estimasi Jumlah Personil / Peserta
                  </Label>
                  <Input
                    id="jumlahPersonil"
                    type="number"
                    placeholder="Contoh: 15"
                    value={jumlahPersonil}
                    onChange={(e) => setJumlahPersonil(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Tag Peserta yang Diundang */}
              <div>
                <Label htmlFor="peserta" className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Daftar Peserta yang Diundang</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Tekan Enter untuk menambah</span>
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="peserta"
                    placeholder="Ketik nama jabatan/peserta lalu tekan Enter (mis: Sekdis, Kasubbag Umum)..."
                    value={pesertaInput}
                    onChange={(e) => setPesertaInput(e.target.value)}
                    onKeyDown={handleKeyDownPeserta}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddPeserta}
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Tambah
                  </Button>
                </div>

                {pesertaList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 p-2.5 rounded-lg bg-muted/40 border border-border/60">
                    {pesertaList.map((p, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="pl-2.5 pr-1.5 py-1 text-xs flex items-center gap-1.5 bg-background border border-border shadow-xs"
                      >
                        <span>{p}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePeserta(idx)}
                          className="hover:bg-destructive/10 hover:text-destructive rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isUploading || isAnalyzing}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isUploading || isAnalyzing}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan Jadwal...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Simpan sebagai Jadwal Internal
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
