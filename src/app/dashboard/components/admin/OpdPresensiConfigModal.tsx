"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { OPD, OpdConfig, OpdPresensiConfig } from '@/types';
import { useToast } from '@/context/ToastContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  MapPin, 
  Users, 
  Loader2, 
  Save, 
  Navigation, 
  Info,
  ShieldCheck
} from 'lucide-react';

const LocationRadiusPickerMap = dynamic(
  () => import('@/components/maps/LocationRadiusPickerMap'),
  { 
    ssr: false, 
    loading: () => (
      <div className="h-[280px] w-full rounded-xl bg-muted/40 animate-pulse flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span>Memuat Peta Leaflet...</span>
      </div>
    ) 
  }
);

interface OpdPresensiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  opd: OPD | null;
  tenant?: 'sigap' | 'poros';
  onSaved?: () => void;
}

const DEFAULT_PRESENSI_CONFIG: OpdPresensiConfig = {
  enabled: false,
  klasterTarget: ['blud'],
  lokasiKantor: {
    namaLokasi: '',
    latitude: -7.55611, // Default Kota Surakarta
    longitude: 110.83167,
    radiusMeter: 100,
    strictLocation: false
  },
  jadwalKerja: {
    jamMasuk: '07:30',
    jamPulang: '16:00',
    toleransiKeterlambatanMenit: 15
  },
  metode: {
    requirePhoto: true,
    requireLocation: true,
    allowIzinSakit: true
  }
};

export default function OpdPresensiConfigModal({
  isOpen,
  onClose,
  opd,
  tenant = 'sigap',
  onSaved
}: OpdPresensiConfigModalProps) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [config, setConfig] = useState<OpdPresensiConfig>(DEFAULT_PRESENSIConfig());

  function DEFAULT_PRESENSIConfig(): OpdPresensiConfig {
    return {
      ...DEFAULT_PRESENSI_CONFIG,
      lokasiKantor: {
        ...DEFAULT_PRESENSI_CONFIG.lokasiKantor!,
        namaLokasi: opd?.namaOpd || 'Kantor Utama'
      }
    };
  }

  useEffect(() => {
    if (!isOpen || !opd?.id) return;

    const fetchConfig = async () => {
      setLoading(true);
      try {
        const configRef = doc(db, 'opdConfigs', opd.id!);
        const snap = await getDoc(configRef);
        if (snap.exists()) {
          const data = snap.data() as OpdConfig;
          if (data.presensiConfig) {
            setConfig({
              enabled: data.presensiConfig.enabled ?? false,
              klasterTarget: data.presensiConfig.klasterTarget || ['blud'],
              lokasiKantor: {
                namaLokasi: data.presensiConfig.lokasiKantor?.namaLokasi || opd.namaOpd || '',
                latitude: data.presensiConfig.lokasiKantor?.latitude ?? -7.55611,
                longitude: data.presensiConfig.lokasiKantor?.longitude ?? 110.83167,
                radiusMeter: data.presensiConfig.lokasiKantor?.radiusMeter ?? 100,
                strictLocation: data.presensiConfig.lokasiKantor?.strictLocation ?? false
              },
              jadwalKerja: {
                jamMasuk: data.presensiConfig.jadwalKerja?.jamMasuk || '07:30',
                jamPulang: data.presensiConfig.jadwalKerja?.jamPulang || '16:00',
                toleransiKeterlambatanMenit: data.presensiConfig.jadwalKerja?.toleransiKeterlambatanMenit ?? 15
              },
              metode: {
                requirePhoto: data.presensiConfig.metode?.requirePhoto ?? true,
                requireLocation: data.presensiConfig.metode?.requireLocation ?? true,
                allowIzinSakit: data.presensiConfig.metode?.allowIzinSakit ?? true
              }
            });
          } else {
            setConfig(DEFAULT_PRESENSIConfig());
          }
        } else {
          setConfig(DEFAULT_PRESENSIConfig());
        }
      } catch (error) {
        console.error("Gagal memuat konfigurasi presensi OPD:", error);
        addToast("Gagal memuat data konfigurasi presensi.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [isOpen, opd?.id]);

  const toggleKlaster = (klaster: 'asn' | 'blud' | 'umum') => {
    setConfig(prev => {
      const current = prev.klasterTarget || [];
      const exists = current.includes(klaster);
      const next = exists 
        ? current.filter(k => k !== klaster)
        : [...current, klaster];
      return { ...prev, klasterTarget: next };
    });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast("Perangkat/Browser Anda tidak mendukung geolokasi.", "error");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setConfig(prev => ({
          ...prev,
          lokasiKantor: {
            ...prev.lokasiKantor!,
            latitude: lat,
            longitude: lng
          }
        }));
        setGettingLocation(false);
        addToast(`Titik koordinat berhasil didapatkan (${lat}, ${lng})`, "success");
      },
      (error) => {
        console.error("Error geolokasi:", error);
        setGettingLocation(false);
        addToast("Gagal mendapatkan lokasi. Pastikan izin akses lokasi aktif.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = async () => {
    if (!opd?.id) return;
    setSaving(true);
    try {
      const configRef = doc(db, 'opdConfigs', opd.id);
      await setDoc(configRef, {
        presensiConfig: config,
        features: {
          enablePresensi: config.enabled
        }
      }, { merge: true });

      addToast("Konfigurasi presensi instansi berhasil disimpan!", "success");
      if (onSaved) onSaved();
      onClose();
    } catch (error) {
      console.error("Gagal menyimpan konfigurasi presensi:", error);
      addToast("Gagal menyimpan konfigurasi presensi.", "error");
    } finally {
      setSaving(false);
    }
  };

  const isPoros = tenant === 'poros';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isPoros ? 'nk-glass-panel border-border' : 'bg-card border-border'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="w-5 h-5 text-primary" />
            Pengaturan Modul Presensi Instansi
          </DialogTitle>
          <DialogDescription>
            Konfigurasikan modul presensi dan pilih klaster struktur organisasi target untuk <strong className="text-foreground">{opd?.namaOpd}</strong>.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memuat konfigurasi presensi...</p>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            {/* Toggle Modul Utama */}
            <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-muted/20">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Aktifkan Modul Presensi</Label>
                  <Badge variant={config.enabled ? "default" : "secondary"}>
                    {config.enabled ? "Aktif" : "Non-Aktif"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Jika aktif, pegawai pada klaster yang dipilih akan mendapatkan menu dan akses presensi di dashboard.
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            {/* Pemilihan Klaster Target */}
            <div className="border border-border rounded-xl p-4 space-y-3 bg-background">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <Label className="text-sm font-semibold">Klaster Struktur Organisasi Target</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Tentukan klaster pegawai yang diwajibkan presensi mandiri pada aplikasi ini. Pegawai di luar klaster target tidak akan dibebani menu presensi.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {/* Klaster BLUD */}
                <div 
                  onClick={() => toggleKlaster('blud')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                    config.klasterTarget?.includes('blud')
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <Checkbox 
                    checked={config.klasterTarget?.includes('blud')}
                    onCheckedChange={() => toggleKlaster('blud')}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1.5">
                      BLUD / Non-ASN
                      <Badge variant="outline" className="text-[10px] px-1 py-0">Utama</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Tenaga Non-ASN, Kontrak, dan BLUD
                    </p>
                  </div>
                </div>

                {/* Klaster ASN */}
                <div 
                  onClick={() => toggleKlaster('asn')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                    config.klasterTarget?.includes('asn')
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <Checkbox 
                    checked={config.klasterTarget?.includes('asn')}
                    onCheckedChange={() => toggleKlaster('asn')}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-sm">ASN (PNS/PPPK)</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Aparatur Sipil Negara Pemda
                    </p>
                  </div>
                </div>

                {/* Klaster Umum */}
                <div 
                  onClick={() => toggleKlaster('umum')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                    config.klasterTarget?.includes('umum')
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-border hover:bg-muted/40'
                  }`}
                >
                  <Checkbox 
                    checked={config.klasterTarget?.includes('umum')}
                    onCheckedChange={() => toggleKlaster('umum')}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-medium text-sm">Umum / Semua</div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Jabatan umum / tanpa klaster khusus
                    </p>
                  </div>
                </div>
              </div>

              {config.klasterTarget?.length === 0 && config.enabled && (
                <Alert variant="destructive" className="py-2 text-xs">
                  <Info className="w-4 h-4" />
                  <AlertDescription>Pilih minimal satu klaster struktur agar fitur presensi dapat digunakan.</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Titik Lokasi Kantor & Geofencing */}
            <div className="border border-border rounded-xl p-4 space-y-4 bg-background">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <Label className="text-sm font-semibold">Titik Lokasi Kantor (Geofencing GPS)</Label>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleGetCurrentLocation}
                  disabled={gettingLocation}
                  className="text-xs h-8 gap-1.5"
                >
                  {gettingLocation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                  Ambil Posisi Saat Ini
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <Label className="text-xs">Nama Lokasi / Kantor</Label>
                  <Input 
                    value={config.lokasiKantor?.namaLokasi || ''} 
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      lokasiKantor: { ...prev.lokasiKantor!, namaLokasi: e.target.value }
                    }))}
                    placeholder="Contoh: Gedung STP / Kantor Dinas"
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Latitude</Label>
                  <Input 
                    type="number"
                    step="any"
                    value={config.lokasiKantor?.latitude ?? ''} 
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      lokasiKantor: { ...prev.lokasiKantor!, latitude: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="-7.556110"
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Longitude</Label>
                  <Input 
                    type="number"
                    step="any"
                    value={config.lokasiKantor?.longitude ?? ''} 
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      lokasiKantor: { ...prev.lokasiKantor!, longitude: parseFloat(e.target.value) || 0 }
                    }))}
                    placeholder="110.831670"
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-4 pt-1">
                  <div className="flex-1">
                    <Label className="text-xs">Radius Toleransi Presensi (Meter)</Label>
                    <Input 
                      type="number"
                      min={10}
                      max={5000}
                      value={config.lokasiKantor?.radiusMeter ?? 100} 
                      onChange={e => setConfig(prev => ({
                        ...prev,
                        lokasiKantor: { ...prev.lokasiKantor!, radiusMeter: parseInt(e.target.value) || 100 }
                      }))}
                      className="h-9 text-sm font-mono"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-5">
                    <Checkbox 
                      id="strictLocation"
                      checked={config.lokasiKantor?.strictLocation ?? false}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        lokasiKantor: { ...prev.lokasiKantor!, strictLocation: Boolean(checked) }
                      }))}
                    />
                    <Label htmlFor="strictLocation" className="text-xs cursor-pointer">
                      Wajib dalam radius (Tolak presensi di luar kantor)
                    </Label>
                  </div>
                </div>

                {/* Interactive Leaflet Map & Radius Visualization */}
                <div className="md:col-span-2 pt-2">
                  <Label className="text-xs font-semibold mb-1.5 block">
                    Peta Interaktif & Visualisasi Radius Kantor
                  </Label>
                  <LocationRadiusPickerMap
                    latitude={config.lokasiKantor?.latitude ?? -7.55611}
                    longitude={config.lokasiKantor?.longitude ?? 110.83167}
                    radiusMeter={config.lokasiKantor?.radiusMeter ?? 100}
                    onChangeLocation={(newLat, newLng) => {
                      setConfig(prev => ({
                        ...prev,
                        lokasiKantor: {
                          ...prev.lokasiKantor!,
                          latitude: newLat,
                          longitude: newLng
                        }
                      }));
                    }}
                    height="280px"
                  />
                </div>
              </div>
            </div>

            {/* Jam Kerja & Toleransi Keterlambatan */}
            <div className="border border-border rounded-xl p-4 space-y-4 bg-background">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <Label className="text-sm font-semibold">Jadwal Jam Kerja & Batas Waktu</Label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Jam Masuk (WIB)</Label>
                  <Input 
                    type="time"
                    value={config.jadwalKerja?.jamMasuk || '07:30'} 
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      jadwalKerja: { ...prev.jadwalKerja!, jamMasuk: e.target.value }
                    }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Jam Pulang (WIB)</Label>
                  <Input 
                    type="time"
                    value={config.jadwalKerja?.jamPulang || '16:00'} 
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      jadwalKerja: { ...prev.jadwalKerja!, jamPulang: e.target.value }
                    }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Toleransi Terlambat (Menit)</Label>
                  <Input 
                    type="number"
                    min={0}
                    max={120}
                    value={config.jadwalKerja?.toleransiKeterlambatanMenit ?? 15} 
                    onChange={e => setConfig(prev => ({
                      ...prev,
                      jadwalKerja: { ...prev.jadwalKerja!, toleransiKeterlambatanMenit: parseInt(e.target.value) || 0 }
                    }))}
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Metode & Verifikasi Presensi */}
            <div className="border border-border rounded-xl p-4 space-y-3 bg-background">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <Label className="text-sm font-semibold">Metode & Verifikasi Presensi</Label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="requirePhoto"
                    checked={config.metode?.requirePhoto ?? true}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      metode: { ...prev.metode!, requirePhoto: Boolean(checked) }
                    }))}
                  />
                  <Label htmlFor="requirePhoto" className="text-xs cursor-pointer">
                    Wajib Swafoto (Kamera Selfie)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="requireLocation"
                    checked={config.metode?.requireLocation ?? true}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      metode: { ...prev.metode!, requireLocation: Boolean(checked) }
                    }))}
                  />
                  <Label htmlFor="requireLocation" className="text-xs cursor-pointer">
                    Wajib Deteksi GPS
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="allowIzinSakit"
                    checked={config.metode?.allowIzinSakit ?? true}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      metode: { ...prev.metode!, allowIzinSakit: Boolean(checked) }
                    }))}
                  />
                  <Label htmlFor="allowIzinSakit" className="text-xs cursor-pointer">
                    Boleh Izin / Sakit / Dinas Luar
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button 
            type="button" 
            onClick={handleSave} 
            disabled={saving || loading}
            className={`gap-2 ${isPoros ? 'bg-[var(--nk-teal-mid)] hover:bg-[var(--nk-teal-mid)]/90 text-white' : ''}`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Konfigurasi Presensi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
