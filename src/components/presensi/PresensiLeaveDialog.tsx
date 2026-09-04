"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, UploadCloud, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { db, storage } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { UserProfile, Jabatan, PresensiRecord, PresensiKehadiranStatus } from "@/types";

interface PresensiLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile | null;
  jabatanProfile: Jabatan | null;
  todayStr: string;
  onSuccess: () => void;
}

export function PresensiLeaveDialog({
  open,
  onOpenChange,
  userProfile,
  jabatanProfile,
  todayStr,
  onSuccess,
}: PresensiLeaveDialogProps) {
  const { addToast } = useToast();
  const [jenisIzin, setJenisIzin] = useState<"izin" | "sakit" | "dinas_luar">("izin");
  const [keteranganIzin, setKeteranganIzin] = useState("");
  const [dokumenFile, setDokumenFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.opdId || !userProfile?.uid) {
      addToast("Data pengguna tidak lengkap.", "error");
      return;
    }

    if (!keteranganIzin.trim()) {
      addToast("Alasan pengajuan wajib diisi.", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      let dokumenPendukungUrl = "";
      if (dokumenFile) {
        const ext = dokumenFile.name.split(".").pop() || "pdf";
        const storageRef = ref(storage, `presensi/${userProfile.opdId}/${userProfile.uid}/${todayStr}_dokumen_${Date.now()}.${ext}`);
        await uploadBytes(storageRef, dokumenFile);
        dokumenPendukungUrl = await getDownloadURL(storageRef);
      }

      const docId = `${userProfile.opdId}_${userProfile.uid}_${todayStr}`;
      const recordPayload: PresensiRecord = {
        userId: userProfile.uid,
        userNip: userProfile.nip || "",
        namaLengkap: userProfile.namaLengkap || "",
        opdId: userProfile.opdId,
        jabatanId: userProfile.jabatanId || "",
        namaJabatan: userProfile.namaJabatan || jabatanProfile?.namaJabatan || "Staf",
        klasterStruktur: jabatanProfile?.klasterStruktur || "umum",
        tanggal: todayStr,
        statusKehadiran: jenisIzin as PresensiKehadiranStatus,
        keteranganIzin,
        dokumenPendukungUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "presensi", docId), recordPayload, { merge: true });

      addToast(`Pengajuan ${jenisIzin.toUpperCase()} berhasil dikirim!`, "success");
      onOpenChange(false);
      setKeteranganIzin("");
      setDokumenFile(null);
      onSuccess();
    } catch (err: any) {
      console.error("Gagal mengajukan izin:", err);
      addToast(`Gagal: ${err.message || "Terjadi kesalahan sistem"}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 bg-card border-border rounded-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Calendar className="w-5 h-5 text-amber-500" />
            Pengajuan Izin / Sakit / Dinas Luar
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Pengajuan ketidakhadiran kerja untuk tanggal <strong>{todayStr}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Jenis Pengajuan Kehadiran</Label>
            <Select value={jenisIzin} onValueChange={(val: any) => setJenisIzin(val)}>
              <SelectTrigger className="h-10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="izin">Izin Tidak Masuk Kantor</SelectItem>
                <SelectItem value="sakit">Sakit (Dengan Keterangan Dokter)</SelectItem>
                <SelectItem value="dinas_luar">Dinas Luar / Tugas Lapangan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Alasan / Uraian Keterangan</Label>
            <Textarea
              value={keteranganIzin}
              onChange={(e) => setKeteranganIzin(e.target.value)}
              placeholder="Jelaskan alasan izin / lokasi kegiatan dinas luar..."
              rows={3}
              required
              className="text-xs resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Lampiran Bukti (Opsional - PDF / Foto)</Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setDokumenFile(e.target.files?.[0] || null)}
              className="text-xs h-9"
            />
            <p className="text-[11px] text-muted-foreground">
              Surat tugas, surat keterangan dokter, atau dokumen pendukung.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold gap-1.5"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              Kirim Pengajuan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
