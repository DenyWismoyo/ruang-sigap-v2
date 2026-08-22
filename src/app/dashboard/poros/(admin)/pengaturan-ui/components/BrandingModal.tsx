import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OpdConfig } from '@/types';
import { useToast } from '@/context/ToastContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

interface BrandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  opdId: string;
  opdName: string;
  config?: OpdConfig;
  onSuccess: (newConfig: Partial<OpdConfig>) => void;
}

export function BrandingModal({ isOpen, onClose, opdId, opdName, config, onSuccess }: BrandingModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [namaAplikasi, setNamaAplikasi] = useState(config?.branding?.namaAplikasi || '');
  const [primaryColor, setPrimaryColor] = useState(config?.branding?.primaryColor || '#1a7a8e');
  const [logoUrl, setLogoUrl] = useState(config?.branding?.logoUrl || '');

  // Tier gating logic
  const isDasar = config?.packageName === 'Dasar' || !config?.packageName;

  const handleSave = async () => {
    try {
      setLoading(true);
      const brandingUpdate = {
        branding: {
          ...config?.branding,
          namaAplikasi,
          primaryColor,
          logoUrl,
        }
      };

      await updateDoc(doc(db, 'opdConfigs', opdId), brandingUpdate);
      addToast('Pengaturan branding berhasil disimpan.', 'success');
      onSuccess(brandingUpdate);
      onClose();
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pengaturan Branding & White-Label</DialogTitle>
          <DialogDescription>
            Konfigurasi identitas visual untuk {opdName}.
          </DialogDescription>
        </DialogHeader>

        {isDasar ? (
          <div className="p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-md text-sm">
            Tingkatkan ke paket <strong>Profesional</strong> atau <strong>Enterprise</strong> untuk mengaktifkan kustomisasi Nama Aplikasi, Warna, dan Logo instansi.
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="namaAplikasi">Nama Aplikasi Kustom</Label>
              <Input
                id="namaAplikasi"
                placeholder="Contoh: SIGAP Pemkab Bandung"
                value={namaAplikasi}
                onChange={(e) => setNamaAplikasi(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="primaryColor">Warna Primer (Hex)</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  id="colorPicker"
                  className="w-12 h-10 p-1 cursor-pointer"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
                <Input
                  id="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#1a7a8e"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="logoUrl">URL Logo Instansi</Label>
              <Input
                id="logoUrl"
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Untuk sementara gunakan URL langsung (Firebase Storage).
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          {!isDasar && (
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Simpan Perubahan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
