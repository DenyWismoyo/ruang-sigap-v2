"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { OpdConfig } from '@/types';
import { Loader2, Save, ArrowLeft, Palette, ToggleLeft, CreditCard, Shield, Clock, MapPin, Users, Navigation } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/context/ToastContext';
import { Timestamp } from 'firebase/firestore';

import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { PricingPackage, OPD } from '@/types';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData';
import { Checkbox } from "@/components/ui/checkbox";
import RoleAccessSettings from '../components/RoleAccessSettings';

const DEFAULT_FEATURES = {
  aiSuratReader: false,
  aiNotulensi: false,
  analitika: false,
  manajemenAset: false,
  persetujuanDraf: false,
  formBuilder: false,
  enableSiasnIntegration: false,
  enableEkinerja: false,
  enableAgenda: false,
  enableBulkImport: false,
  enablePresensi: false,
  maxSuratPerHari: 1000
};

export default function SuperAdminOpdDetail() {
  const router = useRouter();
  const params = useParams();
  const opdId = params.opdId as string;
  const { userProfile, loading: authLoading } = useUserAuth();
  const { addToast } = useToast();
  const { opdList } = useMasterData(true);
  
  const [config, setConfig] = useState<OpdConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buatDanLunasi, setBuatDanLunasi] = useState(false);
  const [pricingPackages, setPricingPackages] = useState<PricingPackage[]>([]);

  // Protect route
  useEffect(() => {
    if (!authLoading && userProfile?.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [userProfile, authLoading, router]);

  useEffect(() => {
    const fetchConfig = async () => {
      if (!opdId) return;
      try {
        const docRef = doc(db, 'opdConfigs', opdId);
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          setConfig({ id: snap.id, ...snap.data() } as OpdConfig);
        } else {
          // Initialize empty config if not exists
          const newConfig: OpdConfig = {
            packageName: 'Dasar',
            langgananAktifHingga: Timestamp.now(),
            paymentStatus: 'Trial',
            kuotaPengguna: 50,
            penggunaAktifSaatIni: 0,
            features: DEFAULT_FEATURES,
            branding: {
              namaAplikasi: 'SIGAP',
              logoUrl: '',
              primaryColor: '#0284c7',
              faviconUrl: ''
            }
          };
          setConfig(newConfig);
        }
        
        // Fetch pricing packages for billing calc
        const pkgSnap = await getDocs(collection(db, 'pricingPackages'));
        const pkgs: PricingPackage[] = [];
        pkgSnap.forEach(d => pkgs.push({ id: d.id, ...d.data() } as PricingPackage));
        setPricingPackages(pkgs);

      } catch (error) {
        console.error("Error fetching OPD config:", error);
        addToast("Gagal memuat konfigurasi instansi.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [opdId, addToast]);

  const handleSave = async () => {
    if (!config || !opdId || !userProfile) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);
      const configRef = doc(db, 'opdConfigs', opdId);
      const newExpiryTimestamp = config.langgananAktifHingga;
      const now = Timestamp.now();
      let finalConfig = { ...config };

      if (buatDanLunasi && newExpiryTimestamp.toMillis() > now.toMillis()) {
          finalConfig.paymentStatus = 'Lunas';
          
          const opd = opdList.find(o => o.id === opdId);
          const pkg = pricingPackages.find(p => p.id === config.packageName);
          const hargaBulanan = pkg?.hargaBulanan || 0;
          const penggunaAktif = config.penggunaAktifSaatIni || 0;
          
          const totalTagihan = hargaBulanan; // default 1 bulan untuk auto-tagihan

          const paymentRef = doc(collection(db, 'paymentHistory'));
          batch.set(paymentRef, {
              opdId: opdId, jumlah: totalTagihan > 0 ? totalTagihan : 0, 
              periodeBulan: 1, paket: config.packageName, tanggalBayar: now,
              dicatatOleh: userProfile.uid, catatan: "Aktivasi/perpanjangan otomatis dari Panel Instansi"
          });

          const tagihanRef = doc(collection(db, 'tagihan'));
          batch.set(tagihanRef, {
              opdId: opdId, namaOpd: opd?.namaOpd || opdId,
              bulanTagihan: new Date().getMonth() + 1, tahunTagihan: new Date().getFullYear(),
              packageName: config.packageName, jumlahPenggunaAktif: penggunaAktif,
              hargaBulanan: hargaBulanan, totalTagihan: totalTagihan > 0 ? totalTagihan : 0,
              status: "Lunas", tanggalDibuat: now, tanggalDibayar: now,
              catatan: "Tagihan otomatis dari Panel Instansi"
          });
      } else if (newExpiryTimestamp.toMillis() > now.toMillis() && (finalConfig.paymentStatus === 'Kedaluwarsa' || finalConfig.paymentStatus === 'Menunggu Pembayaran')) {
          finalConfig.paymentStatus = 'Menunggu Pembayaran';
      } else if (newExpiryTimestamp.toMillis() <= now.toMillis()) {
          finalConfig.paymentStatus = 'Kedaluwarsa';
          finalConfig.kuotaPengguna = 0; 
      }

      batch.set(configRef, finalConfig, { merge: true });
      await batch.commit();

      setConfig(finalConfig);
      setBuatDanLunasi(false); // Reset checkbox
      addToast("Konfigurasi instansi berhasil disimpan!", "success");
    } catch (error) {
      console.error("Error saving OPD config:", error);
      addToast("Gagal menyimpan konfigurasi.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userProfile?.role !== 'super_admin' || !config) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Konfigurasi Instansi
          </h1>
          <p className="text-sm text-muted-foreground">
            ID Instansi: {opdId}
          </p>
        </div>
        <div className="ml-auto">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-2 sm:grid-cols-5 mb-6">
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="w-4 h-4" /> Identitas & Branding
          </TabsTrigger>
          <TabsTrigger value="features" className="gap-2">
            <ToggleLeft className="w-4 h-4" /> Feature Flags
          </TabsTrigger>
          <TabsTrigger value="presensi" className="gap-2">
            <Clock className="w-4 h-4" /> Presensi Pegawai
          </TabsTrigger>
          <TabsTrigger value="role-access" className="gap-2">
            <Shield className="w-4 h-4" /> Akses Role
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <CreditCard className="w-4 h-4" /> Paket & Langganan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Identitas White-Label</CardTitle>
              <CardDescription>
                Sesuaikan nama aplikasi, logo, dan warna utama untuk instansi ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="namaAplikasi">Nama Aplikasi (Tampil di Header)</Label>
                <Input 
                  id="namaAplikasi" 
                  value={config.branding?.namaAplikasi || ''} 
                  onChange={(e) => setConfig({ ...config, branding: { ...config.branding, namaAplikasi: e.target.value } })}
                  placeholder="Contoh: E-OFFICE Setda, SIMAS-OPD"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logoUrl">URL Logo Utama (Direkomendasikan rasio 1:1, PNG/SVG)</Label>
                <Input 
                  id="logoUrl" 
                  value={config.branding?.logoUrl || ''} 
                  onChange={(e) => setConfig({ ...config, branding: { ...config.branding, logoUrl: e.target.value } })}
                  placeholder="https://.../logo.png"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="primaryColor">Warna Utama Aplikasi (HEX Code)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color"
                    id="primaryColorColor" 
                    value={config.branding?.primaryColor || '#0284c7'} 
                    onChange={(e) => setConfig({ ...config, branding: { ...config.branding, primaryColor: e.target.value } })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    id="primaryColorText" 
                    value={config.branding?.primaryColor || '#0284c7'} 
                    onChange={(e) => setConfig({ ...config, branding: { ...config.branding, primaryColor: e.target.value } })}
                    placeholder="#0284c7"
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Warna ini akan digunakan untuk tombol utama, aksen, dan elemen penting lainnya.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Aktifkan atau nonaktifkan modul/fitur spesifik untuk instansi ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              {Object.keys(DEFAULT_FEATURES).map((featureKey) => {
                if (featureKey === 'maxSuratPerHari') return null; // Skip non-boolean feature
                return (
                  <div key={featureKey} className="flex items-center justify-between border p-4 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-base">{featureKey}</Label>
                      <p className="text-xs text-muted-foreground">
                        Toggle fitur {featureKey} di sistem instansi.
                      </p>
                    </div>
                    <Switch
                      checked={(config.features as any)?.[featureKey] || false}
                      onCheckedChange={(checked) => 
                        setConfig({
                          ...config, 
                          features: { 
                            ...config.features, 
                            [featureKey]: checked 
                          } as any
                        })
                      }
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presensi">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Konfigurasi Presensi & Klaster Target
              </CardTitle>
              <CardDescription>
                Atur pengaktifan presensi, geofencing GPS, jam kerja, dan klaster pegawai yang diwajibkan presensi mandiri.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Toggle Status Modul */}
              <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold">Aktifkan Modul Presensi</Label>
                  <p className="text-xs text-muted-foreground">
                    Modul presensi akan aktif untuk instansi ini.
                  </p>
                </div>
                <Switch
                  checked={config.presensiConfig?.enabled ?? false}
                  onCheckedChange={(checked) => 
                    setConfig({
                      ...config,
                      features: {
                        ...config.features,
                        enablePresensi: checked
                      },
                      presensiConfig: {
                        ...(config.presensiConfig || {
                          enabled: false,
                          klasterTarget: ['blud'],
                          lokasiKantor: { namaLokasi: '', latitude: -7.55611, longitude: 110.83167, radiusMeter: 100 },
                          jadwalKerja: { jamMasuk: '07:30', jamPulang: '16:00', toleransiKeterlambatanMenit: 15 },
                          metode: { requirePhoto: true, requireLocation: true, allowIzinSakit: true }
                        }),
                        enabled: checked
                      }
                    })
                  }
                />
              </div>

              {/* Klaster Target */}
              <div className="border p-4 rounded-lg space-y-3">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Pilih Klaster Struktur Organisasi yang Diaktifkan
                </Label>
                <p className="text-xs text-muted-foreground">
                  Pegawai pada klaster terpilih akan melihat menu Presensi di dashboard.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {(['blud', 'asn', 'umum'] as const).map((klaster) => {
                    const currentClusters = config.presensiConfig?.klasterTarget || ['blud'];
                    const isChecked = currentClusters.includes(klaster);
                    const labels: Record<string, string> = {
                      blud: 'BLUD / Non-ASN',
                      asn: 'ASN (PNS/PPPK)',
                      umum: 'Umum / Semua'
                    };
                    return (
                      <div 
                        key={klaster}
                        onClick={() => {
                          const next = isChecked 
                            ? currentClusters.filter(k => k !== klaster)
                            : [...currentClusters, klaster];
                          setConfig({
                            ...config,
                            presensiConfig: {
                              ...(config.presensiConfig || {
                                enabled: true,
                                lokasiKantor: { namaLokasi: '', latitude: -7.55611, longitude: 110.83167, radiusMeter: 100 },
                                jadwalKerja: { jamMasuk: '07:30', jamPulang: '16:00', toleransiKeterlambatanMenit: 15 }
                              }),
                              enabled: config.presensiConfig?.enabled ?? true,
                              klasterTarget: next
                            }
                          });
                        }}
                        className={`p-3 rounded-lg border cursor-pointer flex items-center gap-3 ${
                          isChecked ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30' : 'hover:bg-muted/40'
                        }`}
                      >
                        <Checkbox checked={isChecked} />
                        <span className="text-sm font-medium">{labels[klaster]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Titik Lokasi & Radius */}
              <div className="border p-4 rounded-lg space-y-4">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Koordinat Lokasi Kantor & Radius (Meter)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Latitude</Label>
                    <Input 
                      type="number"
                      step="any"
                      value={config.presensiConfig?.lokasiKantor?.latitude ?? -7.55611}
                      onChange={e => setConfig({
                        ...config,
                        presensiConfig: {
                          ...(config.presensiConfig || { enabled: true, klasterTarget: ['blud'] }),
                          enabled: config.presensiConfig?.enabled ?? true,
                          klasterTarget: config.presensiConfig?.klasterTarget || ['blud'],
                          lokasiKantor: {
                            ...(config.presensiConfig?.lokasiKantor || { radiusMeter: 100 }),
                            longitude: config.presensiConfig?.lokasiKantor?.longitude ?? 110.83167,
                            latitude: parseFloat(e.target.value) || 0
                          }
                        }
                      })}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Longitude</Label>
                    <Input 
                      type="number"
                      step="any"
                      value={config.presensiConfig?.lokasiKantor?.longitude ?? 110.83167}
                      onChange={e => setConfig({
                        ...config,
                        presensiConfig: {
                          ...(config.presensiConfig || { enabled: true, klasterTarget: ['blud'] }),
                          enabled: config.presensiConfig?.enabled ?? true,
                          klasterTarget: config.presensiConfig?.klasterTarget || ['blud'],
                          lokasiKantor: {
                            ...(config.presensiConfig?.lokasiKantor || { radiusMeter: 100 }),
                            latitude: config.presensiConfig?.lokasiKantor?.latitude ?? -7.55611,
                            longitude: parseFloat(e.target.value) || 0
                          }
                        }
                      })}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Radius Toleransi (Meter)</Label>
                    <Input 
                      type="number"
                      value={config.presensiConfig?.lokasiKantor?.radiusMeter ?? 100}
                      onChange={e => setConfig({
                        ...config,
                        presensiConfig: {
                          ...(config.presensiConfig || { enabled: true, klasterTarget: ['blud'] }),
                          enabled: config.presensiConfig?.enabled ?? true,
                          klasterTarget: config.presensiConfig?.klasterTarget || ['blud'],
                          lokasiKantor: {
                            ...(config.presensiConfig?.lokasiKantor || { latitude: -7.55611, longitude: 110.83167 }),
                            radiusMeter: parseInt(e.target.value) || 100
                          }
                        }
                      })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Leaflet Map & Radius Visualization */}
                <div className="pt-2">
                  <LocationRadiusPickerMap
                    latitude={config.presensiConfig?.lokasiKantor?.latitude ?? -7.55611}
                    longitude={config.presensiConfig?.lokasiKantor?.longitude ?? 110.83167}
                    radiusMeter={config.presensiConfig?.lokasiKantor?.radiusMeter ?? 100}
                    onChangeLocation={(newLat, newLng) => {
                      setConfig({
                        ...config,
                        presensiConfig: {
                          ...(config.presensiConfig || { enabled: true, klasterTarget: ['blud'] }),
                          enabled: config.presensiConfig?.enabled ?? true,
                          klasterTarget: config.presensiConfig?.klasterTarget || ['blud'],
                          lokasiKantor: {
                            ...(config.presensiConfig?.lokasiKantor || { radiusMeter: 100 }),
                            latitude: newLat,
                            longitude: newLng
                          }
                        }
                      });
                    }}
                    height="260px"
                  />
                </div>
              </div>

              {/* Jadwal Jam Kerja */}
              <div className="border p-4 rounded-lg space-y-4">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  Jadwal Jam Kerja & Toleransi
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Jam Masuk (WIB)</Label>
                    <Input 
                      type="time"
                      value={config.presensiConfig?.jadwalKerja?.jamMasuk || '07:30'}
                      onChange={e => setConfig({
                        ...config,
                        presensiConfig: {
                          ...(config.presensiConfig || { enabled: true, klasterTarget: ['blud'] }),
                          enabled: config.presensiConfig?.enabled ?? true,
                          klasterTarget: config.presensiConfig?.klasterTarget || ['blud'],
                          jadwalKerja: {
                            jamPulang: config.presensiConfig?.jadwalKerja?.jamPulang || '16:00',
                            toleransiKeterlambatanMenit: config.presensiConfig?.jadwalKerja?.toleransiKeterlambatanMenit ?? 15,
                            jamMasuk: e.target.value
                          }
                        }
                      })}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Jam Pulang (WIB)</Label>
                    <Input 
                      type="time"
                      value={config.presensiConfig?.jadwalKerja?.jamPulang || '16:00'}
                      onChange={e => setConfig({
                        ...config,
                        presensiConfig: {
                          ...(config.presensiConfig || { enabled: true, klasterTarget: ['blud'] }),
                          enabled: config.presensiConfig?.enabled ?? true,
                          klasterTarget: config.presensiConfig?.klasterTarget || ['blud'],
                          jadwalKerja: {
                            jamMasuk: config.presensiConfig?.jadwalKerja?.jamMasuk || '07:30',
                            toleransiKeterlambatanMenit: config.presensiConfig?.jadwalKerja?.toleransiKeterlambatanMenit ?? 15,
                            jamPulang: e.target.value
                          }
                        }
                      })}
                      className="text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Toleransi Terlambat (Menit)</Label>
                    <Input 
                      type="number"
                      value={config.presensiConfig?.jadwalKerja?.toleransiKeterlambatanMenit ?? 15}
                      onChange={e => setConfig({
                        ...config,
                        presensiConfig: {
                          ...(config.presensiConfig || { enabled: true, klasterTarget: ['blud'] }),
                          enabled: config.presensiConfig?.enabled ?? true,
                          klasterTarget: config.presensiConfig?.klasterTarget || ['blud'],
                          jadwalKerja: {
                            jamMasuk: config.presensiConfig?.jadwalKerja?.jamMasuk || '07:30',
                            jamPulang: config.presensiConfig?.jadwalKerja?.jamPulang || '16:00',
                            toleransiKeterlambatanMenit: parseInt(e.target.value) || 0
                          }
                        }
                      })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role-access">
          <RoleAccessSettings opdId={opdId} opdConfig={config} />
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Langganan</CardTitle>
              <CardDescription>
                Atur paket langganan dan kuota pengguna untuk instansi ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Paket Langganan</Label>
                <Select 
                  value={config.packageName} 
                  onValueChange={(val: any) => setConfig({ ...config, packageName: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Paket" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dasar">Dasar</SelectItem>
                    <SelectItem value="Profesional">Profesional</SelectItem>
                    <SelectItem value="Enterprise">Enterprise</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status Pembayaran</Label>
                <Select 
                  value={config.paymentStatus || 'Trial'} 
                  onValueChange={(val: any) => setConfig({ ...config, paymentStatus: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Trial">Trial (Uji Coba)</SelectItem>
                    <SelectItem value="Menunggu Pembayaran">Menunggu Pembayaran</SelectItem>
                    <SelectItem value="Lunas">Lunas</SelectItem>
                    <SelectItem value="Gagal">Gagal / Dibatalkan</SelectItem>
                    <SelectItem value="Kedaluwarsa">Kedaluwarsa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="kuotaPengguna">Kuota Pengguna Maksimal</Label>
                  <Input 
                    id="kuotaPengguna" 
                    type="number"
                    value={config.kuotaPengguna || 0} 
                    onChange={(e) => setConfig({ ...config, kuotaPengguna: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="langgananAktif">Langganan Aktif Hingga</Label>
                  <Input 
                    id="langgananAktif" 
                    type="date"
                    value={config.langgananAktifHingga ? config.langgananAktifHingga.toDate().toISOString().split('T')[0] : ''} 
                    onChange={(e) => setConfig({ ...config, langgananAktifHingga: Timestamp.fromDate(new Date(e.target.value)) })}
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg mt-4">
                  <div className="flex items-center gap-3">
                      <Checkbox 
                          id="buat-lunas"
                          checked={buatDanLunasi} 
                          onCheckedChange={(c) => setBuatDanLunasi(c as boolean)} 
                      />
                      <Label htmlFor="buat-lunas" className="text-sm font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
                          Sekaligus Buat Tagihan & Tandai sebagai LUNAS
                      </Label>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 pl-8">
                      Jika dicentang, sistem akan otomatis membuat tagihan dan riwayat pembayaran untuk aktivasi ini, lalu mengubah status OPD menjadi "Lunas".
                  </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
