"use client";

import React, { useState, useEffect } from 'react';
import { BuktiKinerja } from '@/types';
import { 
  EkinerjaFormPayload, 
  formatToEkinerjaDate, 
  copyEkinerjaPayloadToClipboard, 
  getEkinerjaBookmarkletHref, 
  EKINERJA_BOOKMARKLET_SCRIPT 
} from '@/lib/ekinerjaBookmarklet';
import { AktivitasCombobox } from './AktivitasCombobox';
import { getAktivitasSoloById, AktivitasSolo } from '@/data/masterAktivitasSolo';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Copy, 
  Check, 
  ExternalLink, 
  Bookmark, 
  Clock, 
  Calendar, 
  FileText, 
  HelpCircle, 
  CheckCircle2,
  Info,
  Sparkles,
  Link as LinkIcon,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EkinerjaBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  bukti: BuktiKinerja | null;
  tenant?: 'sigap' | 'poros';
}

export const EkinerjaBridgeModal: React.FC<EkinerjaBridgeModalProps> = ({
  isOpen,
  onClose,
  bukti,
  tenant = 'sigap',
}) => {
  const [activeTab, setActiveTab] = useState<'form' | 'extension' | 'bookmarklet'>('form');
  
  // 8 Kolom e-Kinerja
  const [tglPelaksanaan, setTglPelaksanaan] = useState('');
  const [aktivitas, setAktivitas] = useState<AktivitasSolo | undefined>(undefined);
  const [namaKegiatan, setNamaKegiatan] = useState('');
  const [jamMulai, setJamMulai] = useState('08:00');
  const [jamSelesai, setJamSelesai] = useState('09:30');
  const [kuantitas, setKuantitas] = useState<number>(1);
  const [urlBuktiDukung, setUrlBuktiDukung] = useState('');
  const [catatan, setCatatan] = useState('');

  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Chrome Extension Real-time State
  const [isExtensionInstalled, setIsExtensionInstalled] = useState(false);
  const [isSendingExtension, setIsSendingExtension] = useState(false);
  const [extensionStatusMessage, setExtensionStatusMessage] = useState<string | null>(null);

  // Inisialisasi data saat modal dibuka atau bukti berubah
  useEffect(() => {
    if (bukti) {
      setTglPelaksanaan(formatToEkinerjaDate(bukti.createdAt));
      setNamaKegiatan(bukti.judul || '');
      setUrlBuktiDukung(bukti.googleDriveLink || '');
      setCatatan(bukti.deskripsi || 'Bukti kinerja tercatat di RUANG SIGAP / POROS E-Office Kota Surakarta');
      setKuantitas(1);
      setJamMulai('08:00');
      setJamSelesai('09:30');

      if (bukti.aktivitasId) {
        const found = getAktivitasSoloById(bukti.aktivitasId);
        setAktivitas(found);
      } else {
        setAktivitas(undefined);
      }
    }
  }, [bukti]);

  // Deteksi Extension SIGAP Bridge
  // Deteksi Extension SIGAP Bridge secara dinamis
  useEffect(() => {
    const checkExt = () => {
      if (typeof document !== 'undefined' && document.documentElement.getAttribute('data-sigap-extension-active') === 'true') {
        setIsExtensionInstalled(true);
      }
    };
    checkExt();

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SIGAP_EXTENSION_READY' || event.data?.type === 'SIGAP_BRIDGE_STATUS') {
        setIsExtensionInstalled(true);
      }
      if (event.data?.type === 'SIGAP_BRIDGE_RESPONSE') {
        setIsSendingExtension(false);
        const res = event.data.response;
        if (res?.success) {
          setIsExtensionInstalled(true);
          setExtensionStatusMessage("✅ Sukses! Data langsung terisi otomatis ke formulir di tab e-Kinerja.");
          setTimeout(() => setExtensionStatusMessage(null), 5000);
        } else if (res?.status === 'TAB_NOT_FOUND') {
          setExtensionStatusMessage(res.message || "⚠️ Tab e-Kinerja BKPSDM belum dibuka di browser Chrome Anda.");
          setTimeout(() => setExtensionStatusMessage(null), 7000);
        } else {
          setExtensionStatusMessage(res?.message || "Gagal menyuntikkan data via Extension.");
          setTimeout(() => setExtensionStatusMessage(null), 5000);
        }
      }
    };

    window.addEventListener('message', handler);

    // Ping berkala selama modal terbuka untuk deteksi instan saat ekstensi baru diaktifkan
    const pingInterval = setInterval(() => {
      window.postMessage({ type: 'SIGAP_BRIDGE_PING' }, '*');
      checkExt();
    }, 600);

    return () => {
      window.removeEventListener('message', handler);
      clearInterval(pingInterval);
    };
  }, []);

  const getPayload = (): EkinerjaFormPayload => {
    let finalNamaKegiatan = namaKegiatan.trim();
    if (aktivitas?.nama) {
      const prefix = `[${aktivitas.nama}]`;
      if (!finalNamaKegiatan.toLowerCase().includes(aktivitas.nama.toLowerCase())) {
        finalNamaKegiatan = `${prefix} ${finalNamaKegiatan}`;
      }
    }

    return {
      tglPelaksanaan: tglPelaksanaan.trim(),
      aktivitasId: aktivitas?.id,
      aktivitasNama: aktivitas?.nama || '',
      namaKegiatan: finalNamaKegiatan,
      jamMulai,
      jamSelesai,
      kuantitas: Number(kuantitas) || 1,
      urlBuktiDukung: urlBuktiDukung.trim(),
      catatan: catatan.trim(),
    };
  };

  const handleCopyPayload = async () => {
    const payload = getPayload();
    const success = await copyEkinerjaPayloadToClipboard(payload);
    if (success) {
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 3000);
    }
  };

  const handleSendViaExtension = () => {
    const payload = getPayload();
    // Otomatis salin juga ke clipboard sebagai dual-backup
    copyEkinerjaPayloadToClipboard(payload);

    setIsSendingExtension(true);
    setExtensionStatusMessage("Mengirim data ke tab e-Kinerja...");

    // Selalu kirim sinyal ke window message
    window.postMessage({
      type: 'SIGAP_BRIDGE_SEND',
      payload: payload
    }, '*');

    // Timeout fallback jika content script belum terpasang di tab ini
    setTimeout(() => {
      setIsSendingExtension(prev => {
        if (prev) {
          setExtensionStatusMessage("⚠️ Tab SIGAP belum terhubung ke ekstensi. Jika Anda baru memasang ekstensi, silakan muat ulang (Refresh / F5) tab ini.");
          return false;
        }
        return false;
      });
    }, 2500);
  };

  const handleCopyBookmarkletScript = async () => {
    try {
      await navigator.clipboard.writeText(getEkinerjaBookmarkletHref());
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const isPoros = tenant === 'poros';
  const primaryButtonClass = isPoros 
    ? "bg-teal-600 hover:bg-teal-700 text-white" 
    : "bg-blue-600 hover:bg-blue-700 text-white";

  const accentColor = isPoros ? "text-teal-600 dark:text-teal-400" : "text-blue-600 dark:text-blue-400";
  const badgeColor = isPoros ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl">
        {/* Header Modal */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn("p-2 rounded-xl text-white shadow-sm", isPoros ? "bg-teal-600" : "bg-blue-600")}>
                <Zap size={20} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  Siapkan Data e-Kinerja BKPSDM
                  <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase tracking-wider", badgeColor)}>
                    Kepwal 786/154
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Sinkronkan bukti dukung Google Drive ke 8 kolom formulir e-Kinerja Kota Surakarta.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Tab Navigation (3 Opsi Otomasi) */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="form" className="text-xs">
                <FileText size={13} className="mr-1.5" /> 8 Kolom Form
              </TabsTrigger>
              <TabsTrigger value="extension" className="text-xs flex items-center gap-1">
                <Sparkles size={13} className={isExtensionInstalled ? "text-green-500" : accentColor} /> 
                <span>🚀 Extension Real-time</span>
              </TabsTrigger>
              <TabsTrigger value="bookmarklet" className="text-xs">
                <Zap size={13} className="mr-1.5" /> ⚡ Bookmarklet
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </DialogHeader>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === 'form' && (
            <div className="space-y-4">
              {/* Kolom 1 & 2: Tgl & Kode Kegiatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ek-tgl" className="text-xs font-semibold flex items-center gap-1">
                    <Calendar size={13} className={accentColor} /> 1. Tgl Pelaksanaan (DD/MM/YYYY)
                  </Label>
                  <Input
                    id="ek-tgl"
                    value={tglPelaksanaan}
                    onChange={(e) => setTglPelaksanaan(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="ek-kode" className="text-xs font-semibold flex items-center gap-1 text-muted-foreground">
                    2. Kode Kegiatan
                  </Label>
                  <Input
                    id="ek-kode"
                    value="[Otomatis dari e-Kinerja / Tekan F2]"
                    disabled
                    className="mt-1 h-9 text-xs bg-muted/60 font-mono text-muted-foreground"
                  />
                </div>
              </div>

              {/* Kolom 3: Aktivitas (152 Kepwal Solo) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Sparkles size={13} className={accentColor} /> 3. Aktivitas Resmi BKPSDM Solo (152 Kamus)
                  </Label>
                  {aktivitas && (
                    <span className="text-[11px] text-muted-foreground">
                      Bobot: <strong className="text-foreground font-mono">{aktivitas.nilaiPoin} Poin</strong> / {aktivitas.satuan}
                    </span>
                  )}
                </div>
                <AktivitasCombobox
                  value={aktivitas?.id}
                  onChange={(act) => setAktivitas(act)}
                  tenant={tenant}
                  showQuickPills={true}
                />
              </div>

              {/* Kolom 4: Nama Kegiatan Harian */}
              <div>
                <Label htmlFor="ek-nama" className="text-xs font-semibold flex items-center gap-1">
                  <FileText size={13} className={accentColor} /> 4. Nama Kegiatan Harian (Uraian)
                </Label>
                <Input
                  id="ek-nama"
                  value={namaKegiatan}
                  onChange={(e) => setNamaKegiatan(e.target.value)}
                  placeholder="Contoh: Mengagenda dan menindaklanjuti surat masuk..."
                  className="mt-1 h-9 text-xs font-medium"
                />
              </div>

              {/* Kolom 5, 6, 7: Jam Mulai, Selesai, Kuantitas */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="ek-mulai" className="text-xs font-semibold flex items-center gap-1">
                    <Clock size={13} className={accentColor} /> 5. Jam Mulai
                  </Label>
                  <Input
                    id="ek-mulai"
                    type="time"
                    value={jamMulai}
                    onChange={(e) => setJamMulai(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="ek-selesai" className="text-xs font-semibold flex items-center gap-1">
                    <Clock size={13} className={accentColor} /> 6. Jam Selesai
                  </Label>
                  <Input
                    id="ek-selesai"
                    type="time"
                    value={jamSelesai}
                    onChange={(e) => setJamSelesai(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="ek-qty" className="text-xs font-semibold flex items-center gap-1">
                    7. Kuantitas
                  </Label>
                  <Input
                    id="ek-qty"
                    type="number"
                    min={1}
                    value={kuantitas}
                    onChange={(e) => setKuantitas(Number(e.target.value) || 1)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              {/* Kolom 8: URL Bukti Dukung (Google Drive) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label htmlFor="ek-url" className="text-xs font-semibold flex items-center gap-1">
                    <LinkIcon size={13} className={accentColor} /> 8. URL Bukti Dukung (Google Drive)
                  </Label>
                  {urlBuktiDukung && (
                    <a
                      href={urlBuktiDukung}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      Buka File <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <Input
                  id="ek-url"
                  value={urlBuktiDukung}
                  onChange={(e) => setUrlBuktiDukung(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="mt-1 h-9 text-xs font-mono bg-muted/40"
                />
              </div>

              {/* Catatan / Keterangan Tambahan */}
              <div>
                <Label htmlFor="ek-catatan" className="text-xs font-semibold text-muted-foreground">
                  Catatan Tambahan (Opsional)
                </Label>
                <Textarea
                  id="ek-catatan"
                  rows={2}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Catatan pelaksanaan atau detail dokumen..."
                  className="mt-1 text-xs resize-none"
                />
              </div>

              {/* Banner Info 1-Klik */}
              <div className="p-3 bg-muted/60 rounded-xl border border-border flex items-start gap-3 text-xs">
                <Info size={16} className={cn("shrink-0 mt-0.5", accentColor)} />
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">
                    Bagaimana cara mengisi ke e-Kinerja dalam 1 Detik?
                  </p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    1. Klik tombol <strong>&quot;Salin Data Form&quot;</strong> di bawah.<br />
                    2. Buka form e-Kinerja BKPSDM Solo, lalu klik Bookmarklet <strong>&quot;⚡ Isi e-Kinerja Solo&quot;</strong> di Bookmarks Bar Chrome Anda. Semua 8 kolom otomatis terisi!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Chrome Extension Real-time */}
          {activeTab === 'extension' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div className={cn(
                "p-4 rounded-xl border flex items-start gap-3",
                isExtensionInstalled 
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
              )}>
                <div className="text-xl shrink-0 mt-0.5">
                  {isExtensionInstalled ? "🟢" : "⚡"}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">
                    {isExtensionInstalled 
                      ? "SIGAP Bridge Extension Terpasang & Siap Digunakan!"
                      : "Jembatan Otomasi Antar-Tab (Chrome Extension)"}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">
                    {isExtensionInstalled
                      ? "Ekstensi aktif di browser Anda. Setiap kali Anda menekan tombol 'Kirim ke e-Kinerja', 8 kolom di tab e-Kinerja sebelah kanan akan terisi otomatis secara real-time!"
                      : "Sudah memasang ekstensi di Chrome? Silakan Refresh (Muat Ulang / F5) tab SIGAP ini satu kali agar ekstensi langsung terdeteksi dan tersambung."}
                  </p>
                  {!isExtensionInstalled && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="h-7 text-xs bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950 font-medium"
                      >
                        🔄 Refresh Tab SIGAP Ini (F5)
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          window.postMessage({ type: 'SIGAP_BRIDGE_PING' }, '*');
                          if (typeof document !== 'undefined' && document.documentElement.getAttribute('data-sigap-extension-active') === 'true') {
                            setIsExtensionInstalled(true);
                          }
                        }}
                        className="h-7 text-xs text-amber-900 hover:bg-amber-100/50"
                      >
                        ⚡ Cek Koneksi Lagi
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Unduh Paket Ekstensi (.ZIP) */}
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <Download size={16} className="text-emerald-600 dark:text-emerald-400" /> Paket Ekstensi Chrome Siap Pakai (.ZIP)
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Unduh file arsip, ekstrak di komputer Anda, lalu pasang ke Google Chrome tanpa repot.
                  </p>
                </div>
                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-sm">
                  <a href="/downloads/sigap-chrome-bridge.zip" download="sigap-chrome-bridge.zip">
                    <Download size={14} className="mr-1.5" /> Unduh Ekstensi (.ZIP)
                  </a>
                </Button>
              </div>

              {/* Panduan Instalasi Cepat (1 Menit) */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles size={14} className={accentColor} /> Cara Pasang di Chrome Seluruh Pegawai:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">1</span>
                      Unduh &amp; Ekstrak File ZIP
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Klik tombol <strong>Unduh Ekstensi (.ZIP)</strong> di atas. Setelah terunduh, klik kanan file zip lalu pilih <em>&quot;Extract All...&quot;</em>.
                    </p>
                  </div>

                  <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">2</span>
                      Buka Kelola Ekstensi Chrome
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Ketik <code className="bg-muted px-1 rounded text-foreground font-mono">chrome://extensions</code> di address bar Chrome lalu tekan Enter.
                    </p>
                  </div>

                  <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">3</span>
                      Aktifkan Developer Mode
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Nyalakan toggle switch <strong>&quot;Developer mode&quot;</strong> di pojok kanan atas layar Chrome.
                    </p>
                  </div>

                  <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">4</span>
                      Load Unpacked Folder
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Klik tombol <strong>&quot;Load unpacked&quot;</strong> di kiri atas, lalu pilih folder hasil ekstrak tadi. Selesai!
                    </p>
                  </div>
                </div>

              </div>

              {/* Fitur Ekstensi */}
              <div className="p-3 bg-accent/30 rounded-xl border border-border text-xs space-y-1.5">
                <p className="font-semibold text-foreground">💡 Keunggulan SIGAP Bridge Extension:</p>
                <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-1">
                  <li><strong>1-Klik Otomatis</strong>: Form di tab e-Kinerja langsung terisi seketika tanpa perlu salin-tempel manual satu per satu.</li>
                  <li><strong>Uraian Terstandar</strong>: Otomatis menyusun nama kegiatan dengan label aktivitas resmi Kepwal: <code>[Nama Aktivitas] Uraian Tugas</code>.</li>
                  <li><strong>Sinkronisasi Bukti Dukung</strong>: Otomatis menyematkan link folder Google Drive bukti kinerja dari profil Anda (atau dikosongkan jika belum diatur).</li>
                  <li><strong>Catatan Audit Resmi</strong>: Menyertakan keterangan audit resmi bahwa kegiatan dicatat melalui Logbook Harian SIGAP.</li>
                  <li><strong>Auto-Focus</strong>: Otomatis membawa pandangan Anda ke tab e-Kinerja begitu data berhasil terkirim.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 3: Bookmarklet */}
          {activeTab === 'bookmarklet' && (
            <div className="space-y-5">
              <div className="p-4 bg-accent/40 rounded-xl border border-border">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2 mb-2">
                  <Zap size={16} className={accentColor} /> Tombol Bookmarklet Otomatis
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  Tarik tombol di bawah ini langsung ke <strong>Bookmarks Bar browser Chrome</strong> Anda (Tekan <kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">Ctrl + Shift + B</kbd> bila Bookmarks Bar belum muncul).
                </p>

                {/* Draggable Bookmarklet Button */}
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-card rounded-lg border-2 border-dashed border-border justify-center text-center">
                  <a
                    href={getEkinerjaBookmarkletHref()}
                    onClick={(e) => e.preventDefault()}
                    draggable="true"
                    className={cn(
                      "px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-transform hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing flex items-center gap-2",
                      primaryButtonClass
                    )}
                    title="Tarik tombol ini ke Bookmarks Bar Chrome Anda"
                  >
                    <Zap size={14} />
                    <span>⚡ Isi e-Kinerja Solo</span>
                  </a>
                  <span className="text-xs text-muted-foreground">
                    ← Tarik dan lepas ke bar browser Anda
                  </span>
                </div>
              </div>

              {/* Langkah Penggunaan */}
              <div className="space-y-3">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  4 Langkah Cepat Penggunaan:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">1</span>
                      Pasang Bookmarklet
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Tarik tombol ⚡ Isi e-Kinerja Solo ke Bookmarks Bar Chrome sekali saja.
                    </p>
                  </div>

                  <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">2</span>
                      Salin Data dari SIGAP
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Pilih bukti kinerja di SIGAP/POROS, sesuaikan aktivitas, lalu klik &quot;Salin Data Form&quot;.
                    </p>
                  </div>

                  <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">3</span>
                      Buka Form e-Kinerja Solo
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Buka portal e-Kinerja BKPSDM Surakarta dan klik Tambah Kegiatan Harian.
                    </p>
                  </div>

                  <div className="p-3 bg-card rounded-lg border border-border space-y-1">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px]">4</span>
                      Klik Bookmarklet (Selesai!)
                    </span>
                    <p className="text-muted-foreground text-[11px]">
                      Klik tombol bookmarklet. 8 kolom langsung terisi otomatis dan tersorot warna hijau!
                    </p>
                  </div>
                </div>
              </div>

              {/* Alternatif Manual Bookmark */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Kesulitan drag & drop?</p>
                  <p className="text-[11px] text-muted-foreground">Salin URL skrip untuk membuat bookmark manual via Chrome Bookmark Manager.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyBookmarkletScript}
                  className="shrink-0 text-xs"
                >
                  {copiedScript ? (
                    <>
                      <Check size={12} className="mr-1 text-green-600" /> Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy size={12} className="mr-1" /> Salin Skrip URL
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Alert status pengiriman extension */}
        {extensionStatusMessage && (
          <div className="px-6 py-2 bg-accent/60 border-t border-border text-xs flex items-center gap-2">
            <Sparkles size={14} className={accentColor} />
            <span className="font-medium text-foreground">{extensionStatusMessage}</span>
          </div>
        )}

        {/* Modal Footer */}
        <DialogFooter className="p-4 border-t border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href="http://103.115.227.196/e-kinerja/v4/d_kegiatan_harian"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-4 hover:underline"
            >
              <ExternalLink size={12} className="mr-1" /> Buka e-Kinerja BKPSDM Solo
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Tutup
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCopyPayload}
              className="text-xs"
            >
              {copiedPayload ? (
                <>
                  <Check size={14} className="mr-1.5 text-green-600" /> Data Disalin!
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-1.5" /> Salin Form
                </>
              )}
            </Button>

            {/* Tombol Utama: Kirim ke e-Kinerja Real-time */}
            <Button
              type="button"
              size="sm"
              onClick={handleSendViaExtension}
              disabled={isSendingExtension}
              className={cn("text-xs font-semibold shadow-md flex items-center gap-1.5", primaryButtonClass)}
            >
              <Sparkles size={14} />
              <span>
                {isExtensionInstalled 
                  ? (isSendingExtension ? "Mengirim..." : "🚀 Kirim ke e-Kinerja (Real-time)")
                  : "🚀 Kirim ke e-Kinerja"}
              </span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
