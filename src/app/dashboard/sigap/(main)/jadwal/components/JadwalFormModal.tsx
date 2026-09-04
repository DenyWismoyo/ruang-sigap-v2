// Lokasi: src/app/dashboard/jadwal/components/JadwalFormModal.tsx
// [PERBAIKAN ERROR BUILD]
// - Menambahkan type casting `as 'Fisik' | 'Virtual'` pada properti `jenis` di dalam useEffect
//   untuk mengatasi error tipe data saat build.
// [PERBAIKAN DARK MODE v6]
// - Mengganti semua kelas `dark:...` kustom dengan kelas semantik shadcn/ui.

"use client";

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDoc, collection, Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore'; 
import { useUserAuth } from '@/context/AuthContext';
import { X, Send, Loader2, Plus } from 'lucide-react'; 
import { JadwalTempat, OPD } from '@/types'; 
import { Badge } from "@/components/ui/badge"; 

// --- Impor Komponen Shadcn ---
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
// --- Akhir Impor Shadcn ---


interface JadwalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; 
  jadwalToEdit: JadwalTempat | null;
  selectedDate: Date; 
  initialData?: Partial<JadwalTempat>; 
}

export default function JadwalFormModal({ isOpen, onClose, onSuccess, jadwalToEdit, selectedDate, initialData }: JadwalFormModalProps) {
  const { userProfile } = useUserAuth();
  
  // Definisi tipe state secara eksplisit agar aman
  type FormData = {
    kegiatan: string;
    jenis: string;
    namaTempat: string;
    tautanRapat: string;
    tanggalMulai: string;
    jamMulai: string;
    jamSelesai: string;
    jumlahPersonil: string;
    penanggungJawab: string;
  };

  const [formData, setFormData] = useState<FormData>({
    kegiatan: '',
    jenis: 'Fisik',
    namaTempat: '',
    tautanRapat: '',
    tanggalMulai: new Date().toISOString().split('T')[0],
    jamMulai: '',
    jamSelesai: '',
    jumlahPersonil: '', 
    penanggungJawab: '', 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [daftarRuangan, setDaftarRuangan] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [pesertaList, setPesertaList] = useState<string[]>([]);
  const [pesertaInput, setPesertaInput] = useState('');

  useEffect(() => {
      if (isOpen && userProfile?.opdId) {
          getDoc(doc(db, 'opd', userProfile.opdId)).then((snap) => {
              if (snap.exists()) {
                  const opdData = snap.data() as OPD;
                  if (opdData.daftarRuangan) setDaftarRuangan(opdData.daftarRuangan);
              }
          });
      }
  }, [isOpen, userProfile]);

  useEffect(() => {
      if (isOpen) {
        let data: FormData;
        if (jadwalToEdit) {
            data = {
                kegiatan: jadwalToEdit.kegiatan,
                // [PERBAIKAN] Tambahkan casting 'as ...' di sini
                jenis: (jadwalToEdit.jenis as 'Fisik' | 'Virtual') || 'Fisik',
                namaTempat: jadwalToEdit.namaTempat || '',
                tautanRapat: jadwalToEdit.tautanRapat || '',
                tanggalMulai: jadwalToEdit.tanggalMulai.toDate().toISOString().split('T')[0],
                jamMulai: jadwalToEdit.jamMulai,
                jamSelesai: jadwalToEdit.jamSelesai,
                jumlahPersonil: jadwalToEdit.jumlahPersonil?.toString() || '',
                penanggungJawab: jadwalToEdit.penanggungJawab,
            };
        } else if (initialData) {
             data = {
                kegiatan: initialData.kegiatan || '',
                // [PERBAIKAN] Tambahkan casting 'as ...' di sini juga
                jenis: initialData.jenis || 'Fisik',
                namaTempat: initialData.namaTempat || '',
                tautanRapat: initialData.tautanRapat || '',
                tanggalMulai: initialData.tanggalMulai ? (initialData.tanggalMulai as Timestamp).toDate().toISOString().split('T')[0] : selectedDate.toISOString().split('T')[0],
                jamMulai: initialData.jamMulai || '',
                jamSelesai: initialData.jamSelesai || '',
                jumlahPersonil: initialData.jumlahPersonil?.toString() || '',
                penanggungJawab: initialData.penanggungJawab || userProfile?.namaLengkap || '',
            };
        } else {
            data = {
                kegiatan: '',
                jenis: 'Fisik',
                namaTempat: '',
                tautanRapat: '',
                tanggalMulai: selectedDate.toISOString().split('T')[0],
                jamMulai: '',
                jamSelesai: '',
                jumlahPersonil: '',
                penanggungJawab: userProfile?.namaLengkap || '',
            };
        }
        setFormData(data);
        setPesertaList(jadwalToEdit?.peserta || initialData?.peserta || []);
        setPesertaInput('');
        setFile(null);
        setError('');
      }
  }, [isOpen, jadwalToEdit, selectedDate, userProfile, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddPeserta = () => {
    const trimmed = pesertaInput.trim();
    if (trimmed && !pesertaList.includes(trimmed)) {
      setPesertaList(prev => [...prev, trimmed]);
      setPesertaInput('');
    }
  };

  const handleRemovePeserta = (idxToRemove: number) => {
    setPesertaList(prev => prev.filter((_, i) => i !== idxToRemove));
  };

  const handleKeyDownPeserta = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddPeserta();
    }
  };
  
  // Handler terpisah untuk <Select>
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, jenis: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kegiatan || !formData.jamMulai || !formData.jamSelesai || (formData.jenis === 'Fisik' && !formData.namaTempat) || (formData.jenis === 'Virtual' && !formData.tautanRapat)) {
        setError('Harap isi semua field yang relevan.');
        return;
    }
    
    setLoading(true);
    setError('');

    try {
        // [PERBAIKAN BUG] Gabungkan tanggal dan jam dengan benar
        // Buat objek Date dari tanggalMulai (YYYY-MM-DD)
        const datePart = new Date(formData.tanggalMulai + 'T00:00:00');
        // Ambil jam dan menit dari jamMulai
        const [hours, minutes] = formData.jamMulai.split(':').map(Number);
        // Set jam dan menit ke objek Date
        datePart.setHours(hours, minutes);
        
        let uploadedFileUrl = jadwalToEdit?.suratUrl || '';
        let uploadedFileName = jadwalToEdit?.suratFileName || '';
        let uploadedFileType = jadwalToEdit?.suratFileType || '';

        if (file && userProfile?.opdId) {
          const storagePath = `opd/${userProfile.opdId}/agenda_internal/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
          const storageRef = ref(storage, storagePath);
          const snapshot = await uploadBytes(storageRef, file);
          uploadedFileUrl = await getDownloadURL(snapshot.ref);
          uploadedFileName = file.name;
          uploadedFileType = file.type;
        }

        const payload = {
            kegiatan: formData.kegiatan,
            jenis: formData.jenis,
            namaTempat: formData.jenis === 'Virtual' ? '' : formData.namaTempat,
            tautanRapat: formData.jenis === 'Virtual' ? formData.tautanRapat : '',
            opdId: userProfile!.opdId,
            penanggungJawab: formData.penanggungJawab || userProfile!.namaLengkap,
            tanggalMulai: Timestamp.fromDate(datePart),
            jamMulai: formData.jamMulai,
            jamSelesai: formData.jamSelesai,
            jumlahPersonil: formData.jumlahPersonil ? Number(formData.jumlahPersonil) : (pesertaList.length > 0 ? pesertaList.length : null),
            peserta: pesertaList,
            ...(uploadedFileUrl ? {
              suratUrl: uploadedFileUrl,
              suratFileName: uploadedFileName,
              suratFileType: uploadedFileType,
            } : {})
        };

        const isApprover = Boolean(
            userProfile?.role === 'admin_opd' ||
            userProfile?.role === 'staf_tu' ||
            userProfile?.role === 'super_admin' ||
            userProfile?.additionalRoles?.includes('operator_surat')
        );

        if (jadwalToEdit) {
            const jadwalRef = doc(db, 'jadwalTempat', jadwalToEdit.id!);
            const updatePayload = {
              ...payload,
            };
            await updateDoc(jadwalRef, updatePayload);
        } else {
            await addDoc(collection(db, 'jadwalTempat'), {
                ...payload,
                createdBy: userProfile!.uid,
                createdAt: Timestamp.now(),
                status: isApprover ? ('Disetujui' as const) : ('Menunggu Persetujuan' as const),
            });
        }
        
        onSuccess();
        onClose();
    } catch (err) {
        console.error("Gagal menyimpan jadwal:", err);
        setError("Terjadi kesalahan saat menyimpan jadwal.");
    } finally {
        setLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {jadwalToEdit ? 'Edit Jadwal' : 'Jadwal Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-0 pt-4 space-y-4 overflow-y-auto px-6 max-h-[70vh]">
            {error && <p className="p-3 text-sm text-center text-red-700 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">{error}</p>}
            
            <div>
              <Label htmlFor="kegiatan">Judul Kegiatan/Rapat</Label>
              <Input id="kegiatan" name="kegiatan" value={formData.kegiatan} onChange={handleChange} required />
            </div>

            <div>
              <Label htmlFor="jenis">Jenis Kegiatan</Label>
              <Select name="jenis" value={formData.jenis} onValueChange={handleSelectChange}>
                  <SelectTrigger id="jenis" className="w-full rounded-md">
                      <SelectValue placeholder="Pilih jenis kegiatan" />
                  </SelectTrigger>
                  <SelectContent className="z-[999]">
                      <SelectItem value="Fisik">Rapat (Offline/Fisik)</SelectItem>
                      <SelectItem value="Virtual">Rapat (Online/Virtual)</SelectItem>
                      <SelectItem value="Kunjungan">Kunjungan Kerja / Lapangan</SelectItem>
                      <SelectItem value="Sosialisasi">Sosialisasi / Bimtek</SelectItem>
                      <SelectItem value="Dinas Luar">Dinas Luar / Perjalanan Dinas</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
              </Select>
            </div>
            
            {formData.jenis === 'Virtual' ? (
                <div>
                    <Label htmlFor="tautanRapat">Tautan Rapat (Zoom/Meet)</Label>
                    <Input id="tautanRapat" type="url" name="tautanRapat" value={formData.tautanRapat} onChange={handleChange} placeholder="https://..." required />
                </div>
            ) : (
                <div>
                    <Label htmlFor="namaTempat">Lokasi / Tempat Kegiatan</Label>
                    <Input id="namaTempat" type="text" name="namaTempat" value={formData.namaTempat} onChange={handleChange} required list="ruangan-list" placeholder="Ketik atau pilih dari daftar..." />
                    <datalist id="ruangan-list">
                        {daftarRuangan.map((ruangan, idx) => (
                            <option key={idx} value={ruangan} />
                        ))}
                    </datalist>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="penanggungJawab">Penanggung Jawab</Label>
                    <Input id="penanggungJawab" type="text" name="penanggungJawab" value={formData.penanggungJawab} onChange={handleChange} required />
                 </div>
                 <div>
                    <Label htmlFor="jumlahPersonil">Jumlah Personil</Label>
                    <Input id="jumlahPersonil" type="number" name="jumlahPersonil" value={formData.jumlahPersonil} onChange={handleChange} placeholder="Opsional" min="0" />
                 </div>
            </div>

            <div>
                <Label htmlFor="tanggalMulai">Tanggal</Label>
                <Input id="tanggalMulai" type="date" name="tanggalMulai" value={formData.tanggalMulai} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jamMulai">Jam Mulai</Label>
                <Input id="jamMulai" type="time" name="jamMulai" value={formData.jamMulai} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="jamSelesai">Jam Selesai</Label>
                <Input id="jamSelesai" type="time" name="jamSelesai" value={formData.jamSelesai} onChange={handleChange} required />
              </div>
            </div>

            {/* Input Peserta yang Diundang */}
            <div>
              <Label htmlFor="peserta-manual" className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Daftar Peserta yang Diundang (Opsional)</span>
                <span className="text-[10px] text-muted-foreground font-normal">Tekan Enter untuk menambah</span>
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="peserta-manual"
                  placeholder="Ketik nama jabatan/peserta..."
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
                  <Plus size={14} className="mr-1" /> Tambah
                </Button>
              </div>

              {pesertaList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5 p-2 rounded-lg bg-muted/40 border border-border/60">
                  {pesertaList.map((p, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="pl-2.5 pr-1.5 py-0.5 text-xs flex items-center gap-1.5 bg-background border border-border"
                    >
                      <span>{p}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePeserta(idx)}
                        className="hover:text-destructive rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Unggah Berkas Surat Lampiran (Opsional) */}
            <div className="pt-2 border-t border-border/40">
              <Label htmlFor="lampiran-surat" className="text-xs font-semibold text-foreground block mb-1">
                Lampiran Berkas Surat / Undangan Internal (Opsional)
              </Label>
              <Input
                id="lampiran-surat"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="text-xs"
              />
              {file && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Berkas terpilih: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter className="mt-6 p-4 border-t border-border sticky bottom-0 bg-muted/50">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 size={16} className="animate-spin mr-2" />}
              <Send size={16} className="mr-2"/> {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
}