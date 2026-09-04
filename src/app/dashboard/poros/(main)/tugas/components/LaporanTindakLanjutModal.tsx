import React, { useState } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileText, ExternalLink } from 'lucide-react';
import { useLaporanTindakLanjut } from '@/app/dashboard/poros/hooks/useLaporanTindakLanjut';
import { useGoogleDriveUploader } from '@/app/dashboard/poros/hooks/useGoogleDriveUploader';

interface LaporanTindakLanjutModalProps {
    isOpen: boolean;
    onClose: () => void;
    tugasId: string;
    suratId: string;
    disposisiId: string;
    instruksiAwal: string;
    namaTugas: string;
    onSuccess: () => void;
}

export function LaporanTindakLanjutModal({
    isOpen, onClose, tugasId, suratId, disposisiId, instruksiAwal, namaTugas, onSuccess
}: LaporanTindakLanjutModalProps) {
    const { submitLaporan, isSubmitting } = useLaporanTindakLanjut();
    const { uploadFile, uploadStatus, isReady, errorMessage } = useGoogleDriveUploader();
    
    const [ringkasanTindakan, setRingkasanTindakan] = useState(namaTugas || '');
    const [hasilTindakan, setHasilTindakan] = useState('');
    const [kendala, setKendala] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [addToLogbook, setAddToLogbook] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let fileUrl = '';
        if (file) {
            if (!isReady) {
                alert("Google Drive Uploader belum siap. Mohon tunggu atau muat ulang halaman.");
                return;
            }
            const dateObj = new Date();
            const dateStr = dateObj.toISOString().split('T')[0].replace(/-/g, '');
            const monthIndex = dateObj.getMonth() + 1;
            const monthName = dateObj.toLocaleString('id-ID', { month: 'long' });
            const year = dateObj.getFullYear();
            const subFolderName = `${monthIndex}. ${year} ${monthName} - Bukti E Kinerja`;

            const parts = file.name.split('.');
            const ext = parts.length > 1 ? '.' + parts.pop() : '.pdf';
            const safeNama = (namaTugas || 'Tugas').replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 40).trim();
            const fileName = `${dateStr} - Laporan_${safeNama}${ext}`;

            const res = await uploadFile(file, fileName, undefined, subFolderName);
            if (res) {
                fileUrl = res;
            } else {
                return; // Upload failed
            }
        }

        const success = await submitLaporan({
            tugasId,
            suratId,
            disposisiId,
            instruksiAwal,
            ringkasanTindakan,
            hasilTindakan,
            kendala,
            buktiFileUrl: fileUrl,
            addToLogbook
        });

        if (success) {
            onSuccess();
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open && !isSubmitting && uploadStatus !== 'uploading') onClose();
        }}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto nk-card border-[var(--nk-teal-light)]/20 shadow-[var(--nk-shadow-lg)]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[var(--nk-teal-mid)]" />
                        Laporan Tindak Lanjut Otomatis
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tugas ini telah selesai. Silakan isi laporan singkat untuk arsip dan bukti kinerja Anda.
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="bg-accent/50 p-3 rounded-md border border-border text-sm">
                        <p className="font-semibold text-xs text-muted-foreground uppercase mb-1">Instruksi Awal</p>
                        <p>{instruksiAwal || '-'}</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ringkasan">Ringkasan Tindakan <span className="text-red-500">*</span></Label>
                        <Input 
                            id="ringkasan" 
                            value={ringkasanTindakan} 
                            onChange={e => setRingkasanTindakan(e.target.value)} 
                            placeholder="Contoh: Menghadiri rapat koordinasi / Menyusun draf surat..."
                            required 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hasil">Hasil / Output <span className="text-red-500">*</span></Label>
                        <Textarea 
                            id="hasil" 
                            value={hasilTindakan} 
                            onChange={e => setHasilTindakan(e.target.value)} 
                            placeholder="Jelaskan hasil dari tindakan yang dilakukan..."
                            rows={3}
                            required 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="kendala">Kendala (Opsional)</Label>
                        <Textarea 
                            id="kendala" 
                            value={kendala} 
                            onChange={e => setKendala(e.target.value)} 
                            placeholder="Tuliskan kendala jika ada..."
                            rows={2}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Lampiran Dokumen/Foto (Opsional)</Label>
                        <Input 
                            type="file" 
                            onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                        />
                        {uploadStatus === 'uploading' && <p className="text-xs text-blue-500 animate-pulse">Mengunggah file ke Google Drive...</p>}
                        {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-border">
                        <Checkbox 
                            id="logbook" 
                            checked={addToLogbook} 
                            onCheckedChange={(checked) => setAddToLogbook(checked as boolean)} 
                        />
                        <Label htmlFor="logbook" className="text-sm font-medium cursor-pointer">
                            Tambahkan otomatis ke Logbook Harian
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                        Data ringkasan dan hasil akan otomatis disalin ke pengisian logbook hari ini.
                    </p>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting || uploadStatus === 'uploading'}>
                            Lewati
                        </Button>
                        <Button type="submit" disabled={isSubmitting || uploadStatus === 'uploading'}>
                            {(isSubmitting || uploadStatus === 'uploading') ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                            ) : 'Simpan Laporan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
