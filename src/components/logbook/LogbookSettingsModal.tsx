'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  FolderCheck,
  FolderX,
  ExternalLink,
  BookOpen,
  Plus,
  Trash2,
  Save,
  Loader2,
  Settings,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserProfile } from '@/types';
import { extractGoogleDriveFolderId } from '@/lib/utils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToastContext } from '@/context/ToastContext';

interface LogbookSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  tenant?: 'sigap' | 'poros';
  onSaved?: () => void;
}

export const LogbookSettingsModal: React.FC<LogbookSettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  tenant = 'sigap',
  onSaved,
}) => {
  const { addToast } = useToastContext();

  // State Form
  const [googleDriveInput, setGoogleDriveInput] = useState('');
  const [useKamusKepwal, setUseKamusKepwal] = useState(true);
  const [customAktivitasList, setCustomAktivitasList] = useState<string[]>([]);
  const [newCustomAktivitas, setNewCustomAktivitas] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Inisialisasi data dari userProfile
  useEffect(() => {
    if (isOpen && userProfile) {
      setGoogleDriveInput(userProfile.googleDriveReportLink || '');
      setUseKamusKepwal(userProfile.useKamusAktivitasKepwal ?? true);
      setCustomAktivitasList(userProfile.customAktivitasList || []);
      setNewCustomAktivitas('');
    }
  }, [isOpen, userProfile]);

  const extractedFolderId = extractGoogleDriveFolderId(googleDriveInput);
  const isExistingFolderSet = !!userProfile?.googleDriveReportLink;

  const handleAddCustomAktivitas = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCustomAktivitas.trim();
    if (!trimmed) return;
    if (customAktivitasList.includes(trimmed)) {
      addToast('Aktivitas tersebut sudah ada di daftar kamus kustom Anda.', 'info');
      return;
    }
    setCustomAktivitasList([...customAktivitasList, trimmed]);
    setNewCustomAktivitas('');
  };

  const handleRemoveCustomAktivitas = (indexToRemove: number) => {
    setCustomAktivitasList(customAktivitasList.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = async () => {
    if (!userProfile?.nip) {
      addToast('Data profil pengguna tidak valid (NIP tidak ditemukan).', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', userProfile.nip);
      const cleanFolderId = extractedFolderId || null;

      await updateDoc(userRef, {
        googleDriveReportLink: cleanFolderId,
        useKamusAktivitasKepwal: useKamusKepwal,
        customAktivitasList: customAktivitasList,
      });

      addToast('Pengaturan Logbook & Google Drive berhasil disimpan.', 'success');
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving logbook settings:', error);
      addToast('Gagal menyimpan pengaturan logbook.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Settings size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Pengaturan Logbook & e-Kinerja
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Konfigurasi folder Google Drive, kamus aktivitas Kepwal, dan template harian Anda.
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* SECTION 1: PENYEMATAN GOOGLE DRIVE */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isExistingFolderSet || extractedFolderId ? (
                  <FolderCheck size={18} className="text-emerald-500 shrink-0" />
                ) : (
                  <FolderX size={18} className="text-amber-500 shrink-0" />
                )}
                <Label htmlFor="gdrive-input" className="font-semibold text-sm">
                  Penyematan Folder Google Drive
                </Label>
              </div>

              {isExistingFolderSet ? (
                <Badge variant="outline" className="text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 border-emerald-300">
                  Tersambung
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[11px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 border-amber-300">
                  Belum Disetel di Profil
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Jika Anda belum mengatur Google Drive di halaman Profil, Anda dapat menyematkan tautan folder langsung di sini untuk menyimpan bukti kinerja dan rekap bulanan.
            </p>

            <div className="space-y-1.5">
              <Input
                id="gdrive-input"
                placeholder="Tempel Link Folder Google Drive (https://drive.google.com/drive/folders/...)"
                value={googleDriveInput}
                onChange={(e) => setGoogleDriveInput(e.target.value)}
                className="bg-background text-sm"
              />

              {extractedFolderId && (
                <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
                  <span className="truncate">
                    Folder ID: <code className="text-foreground font-mono font-semibold">{extractedFolderId}</code>
                  </span>
                  <a
                    href={`https://drive.google.com/drive/folders/${extractedFolderId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline shrink-0 ml-2"
                  >
                    Buka Folder <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: FITUR CENTANG KAMUS AKTIVITAS KE दिश 786/154/2020 */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-500 shrink-0" />
                  <Label htmlFor="kamus-kepwal-toggle" className="font-semibold text-sm cursor-pointer">
                    Kamus 152 Aktivitas Kepwal Surakarta
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Aktifkan pencocokan otomatis dengan Keputusan Walikota Surakarta Nomor 786/154/2020 untuk kemudahan pengisian form e-Kinerja BKPSDM Solo secara 1-klik.
                </p>
              </div>

              <Switch
                id="kamus-kepwal-toggle"
                checked={useKamusKepwal}
                onCheckedChange={setUseKamusKepwal}
              />
            </div>

            {useKamusKepwal && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300">
                <Sparkles size={14} className="shrink-0 text-blue-500" />
                <span>
                  Setiap kegiatan logbook akan otomatis mendeteksi kata kunci dari 152 kamus resmi e-Kinerja.
                </span>
              </div>
            )}
          </div>

          {/* SECTION 3: KAMUS AKTIVITAS KUSTOM / RUTIN PRIBADI */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2">
              <Plus size={18} className="text-primary shrink-0" />
              <Label className="font-semibold text-sm">
                Kamus Aktivitas Kustom / Rutinitas Personal
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Tambahkan aktivitas pekerjaan rutin harian Anda yang sering dilakukan agar dapat dipilih atau dijadikan rujukan cepat.
            </p>

            <form onSubmit={handleAddCustomAktivitas} className="flex gap-2">
              <Input
                placeholder="Contoh: Monitoring stabilitas server, Rekap presensi..."
                value={newCustomAktivitas}
                onChange={(e) => setNewCustomAktivitas(e.target.value)}
                className="bg-background text-sm"
              />
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={!newCustomAktivitas.trim()}
                className="shrink-0 gap-1.5"
              >
                <Plus size={14} /> Tambah
              </Button>
            </form>

            {customAktivitasList.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto">
                {customAktivitasList.map((item, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="flex items-center gap-1.5 py-1 px-2.5 bg-background border-border text-xs"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomAktivitas(idx)}
                      className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                      title="Hapus aktivitas ini"
                    >
                      <Trash2 size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/70 italic">
                Belum ada aktivitas kustom yang ditambahkan.
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-between pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Tutup
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-semibold">
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Simpan Pengaturan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
