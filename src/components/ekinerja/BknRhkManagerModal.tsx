"use client";

import React, { useState, useEffect } from 'react';
import { UserProfile, RencanaHasilKerjaBkn } from '@/types';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
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
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Plus, 
  Trash2, 
  Edit3, 
  FolderPlus, 
  CheckCircle2, 
  HelpCircle, 
  Layers, 
  Building2, 
  User, 
  Clock, 
  FileText, 
  ExternalLink,
  Sparkles,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BknRhkManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  tenant?: 'sigap' | 'poros';
  onProfileUpdated?: (updatedList: RencanaHasilKerjaBkn[]) => void;
}

const CONTOH_RHK_TEMPLATES: Omit<RencanaHasilKerjaBkn, 'id'>[] = [
  {
    tahun: 2026,
    klasifikasi: 'Organisasi',
    jenis: 'Utama',
    rhkPimpinan: 'Meningkatnya akuntabilitas dan tata kelola barang milik daerah yang tertib dan transparan',
    rencanaHasilKerja: 'Tersedianya dokumen pengamanan barang milik daerah SKPD',
    penugasanDari: 'Kepala OPD / Pengguna Barang',
    aspekKuantitas: { indikator: 'Jumlah Dokumen Pengamanan Barang Milik Daerah SKPD yang diselesaikan', target: '1 Dokumen' },
    aspekKualitas: { indikator: 'Persentase kesesuaian dan keakuratan dokumen pengamanan BMD sesuai standar', target: '100 Persen' },
    aspekWaktu: { indikator: 'Ketepatan waktu pemenuhan dan penyelesaian dokumen pengamanan', target: '12 Bulan' },
    rencanaAksiDefault: 'Berita Acara KDP dan Rekonsiliasi BMD',
    targetDefault: '1 Laporan'
  },
  {
    tahun: 2026,
    klasifikasi: 'Organisasi',
    jenis: 'Utama',
    rhkPimpinan: 'Meningkatnya kualitas pelayanan publik dan kepuasan masyarakat terhadap layanan instansi',
    rencanaHasilKerja: 'Tersedianya pelayanan prima dan penunjang operasional kedinasan',
    penugasanDari: 'Sekretaris OPD / Pimpinan Unit Kerja',
    aspekKuantitas: { indikator: 'Jumlah paket layanan administrasi dan teknis yang diselenggarakan secara optimal', target: '1 Paket' },
    aspekKualitas: { indikator: 'Persentase ketercapaian standar pelayanan minimal dan mutu kedinasan', target: '100 Persen' },
    aspekWaktu: { indikator: 'Waktu pelaksanaan pelayanan operasional dan teknis sepanjang tahun anggaran', target: '12 Bulan' },
    rencanaAksiDefault: 'Monitoring dan evaluasi harian pelayanan administrasi',
    targetDefault: '4 Laporan'
  },
  {
    tahun: 2026,
    klasifikasi: 'Individu',
    jenis: 'Utama',
    rhkPimpinan: 'Terwujudnya akuntabilitas kinerja dan ketepatan pelaporan program kedinasan',
    rencanaHasilKerja: 'Tersusunnya laporan berkala pelaksanaan tugas kedinasan dan evaluasi kinerja',
    penugasanDari: 'Kepala Bidang / Sub Bagian Umum',
    aspekKuantitas: { indikator: 'Jumlah laporan capaian tugas kedinasan yang diselesaikan', target: '4 Laporan' },
    aspekKualitas: { indikator: 'Tingkat kesesuaian laporan dengan format tata naskah dinas baku', target: '100 Persen' },
    aspekWaktu: { indikator: 'Ketepatan waktu penyusunan laporan per triwulan', target: '12 Bulan' },
    rencanaAksiDefault: 'Penyusunan Laporan Capaian Kinerja Triwulanan',
    targetDefault: '1 Laporan'
  }
];

export const BknRhkManagerModal: React.FC<BknRhkManagerModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  tenant = 'sigap',
  onProfileUpdated
}) => {
  const isSigap = tenant === 'sigap';

  // Palette Tokens
  const themePrimary = isSigap ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-teal-600 hover:bg-teal-700 text-white';
  const themeText = isSigap ? 'text-blue-600' : 'text-teal-600';
  const themeBorder = isSigap ? 'border-blue-500' : 'border-teal-500';
  const themeBgLight = isSigap ? 'bg-blue-50/70 border-blue-200' : 'bg-teal-50/70 border-teal-200';

  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [rhkList, setRhkList] = useState<RencanaHasilKerjaBkn[]>(userProfile?.rhkBknList || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  const [klasifikasi, setKlasifikasi] = useState<'Organisasi' | 'Individu'>('Organisasi');
  const [jenis, setJenis] = useState<'Utama' | 'Tambahan'>('Utama');
  const [rhkPimpinan, setRhkPimpinan] = useState('');
  const [rencanaHasilKerja, setRencanaHasilKerja] = useState('');
  const [penugasanDari, setPenugasanDari] = useState('');
  const [indikatorKuantitas, setIndikatorKuantitas] = useState('Jumlah Dokumen/Laporan yang diselesaikan');
  const [targetKuantitas, setTargetKuantitas] = useState('1 Dokumen');
  const [indikatorKualitas, setIndikatorKualitas] = useState('Persentase kesesuaian hasil kerja sesuai standar');
  const [targetKualitas, setTargetKualitas] = useState('100 Persen');
  const [indikatorWaktu, setIndikatorWaktu] = useState('Ketepatan waktu pemenuhan target');
  const [targetWaktu, setTargetWaktu] = useState('12 Bulan');
  const [rencanaAksiDefault, setRencanaAksiDefault] = useState('');
  const [targetDefault, setTargetDefault] = useState('1 Laporan');
  const [googleDriveFolderUrl, setGoogleDriveFolderUrl] = useState('');

  useEffect(() => {
    if (userProfile?.rhkBknList) {
      setRhkList(userProfile.rhkBknList);
    }
  }, [userProfile?.rhkBknList]);

  const resetForm = () => {
    setEditingId(null);
    setTahun(new Date().getFullYear());
    setKlasifikasi('Organisasi');
    setJenis('Utama');
    setRhkPimpinan('');
    setRencanaHasilKerja('');
    setPenugasanDari('');
    setIndikatorKuantitas('Jumlah Dokumen/Laporan yang diselesaikan');
    setTargetKuantitas('1 Dokumen');
    setIndikatorKualitas('Persentase kesesuaian hasil kerja sesuai standar');
    setTargetKualitas('100 Persen');
    setIndikatorWaktu('Ketepatan waktu pemenuhan target');
    setTargetWaktu('12 Bulan');
    setRencanaAksiDefault('');
    setTargetDefault('1 Laporan');
    setGoogleDriveFolderUrl('');
  };

  const handleEdit = (item: RencanaHasilKerjaBkn) => {
    setEditingId(item.id);
    setTahun(item.tahun || new Date().getFullYear());
    setKlasifikasi(item.klasifikasi || 'Organisasi');
    setJenis(item.jenis || 'Utama');
    setRhkPimpinan(item.rhkPimpinan || '');
    setRencanaHasilKerja(item.rencanaHasilKerja || '');
    setPenugasanDari(item.penugasanDari || '');
    setIndikatorKuantitas(item.aspekKuantitas?.indikator || 'Jumlah Dokumen/Laporan yang diselesaikan');
    setTargetKuantitas(item.aspekKuantitas?.target || '1 Dokumen');
    setIndikatorKualitas(item.aspekKualitas?.indikator || 'Persentase kesesuaian hasil kerja sesuai standar');
    setTargetKualitas(item.aspekKualitas?.target || '100 Persen');
    setIndikatorWaktu(item.aspekWaktu?.indikator || 'Ketepatan waktu pemenuhan target');
    setTargetWaktu(item.aspekWaktu?.target || '12 Bulan');
    setRencanaAksiDefault(item.rencanaAksiDefault || '');
    setTargetDefault(item.targetDefault || '1 Laporan');
    setGoogleDriveFolderUrl(item.googleDriveFolderUrl || '');
    setActiveTab('form');
  };

  const handleApplyTemplate = (tmpl: Omit<RencanaHasilKerjaBkn, 'id'>) => {
    setTahun(tmpl.tahun);
    setKlasifikasi(tmpl.klasifikasi);
    setJenis(tmpl.jenis);
    setRhkPimpinan(tmpl.rhkPimpinan);
    setRencanaHasilKerja(tmpl.rencanaHasilKerja);
    setPenugasanDari(tmpl.penugasanDari || '');
    setIndikatorKuantitas(tmpl.aspekKuantitas?.indikator || '');
    setTargetKuantitas(tmpl.aspekKuantitas?.target || '');
    setIndikatorKualitas(tmpl.aspekKualitas?.indikator || '');
    setTargetKualitas(tmpl.aspekKualitas?.target || '');
    setIndikatorWaktu(tmpl.aspekWaktu?.indikator || '');
    setTargetWaktu(tmpl.aspekWaktu?.target || '');
    setRencanaAksiDefault(tmpl.rencanaAksiDefault || '');
    setTargetDefault(tmpl.targetDefault || '');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rencanaHasilKerja.trim()) {
      alert("Uraian Rencana Hasil Kerja (RHK) tidak boleh kosong.");
      return;
    }

    const newItem: RencanaHasilKerjaBkn = {
      id: editingId || `rhk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tahun,
      klasifikasi,
      jenis,
      rhkPimpinan: rhkPimpinan.trim(),
      rencanaHasilKerja: rencanaHasilKerja.trim(),
      penugasanDari: penugasanDari.trim(),
      aspekKuantitas: { indikator: indikatorKuantitas.trim(), target: targetKuantitas.trim() },
      aspekKualitas: { indikator: indikatorKualitas.trim(), target: targetKualitas.trim() },
      aspekWaktu: { indikator: indikatorWaktu.trim(), target: targetWaktu.trim() },
      rencanaAksiDefault: rencanaAksiDefault.trim(),
      targetDefault: targetDefault.trim(),
      googleDriveFolderUrl: googleDriveFolderUrl.trim(),
      updatedAt: new Date().toISOString(),
      ...(editingId ? {} : { createdAt: new Date().toISOString() })
    };

    let updatedList: RencanaHasilKerjaBkn[];
    if (editingId) {
      updatedList = rhkList.map(item => item.id === editingId ? newItem : item);
    } else {
      updatedList = [...rhkList, newItem];
    }

    await persistToFirestore(updatedList);
    resetForm();
    setActiveTab('list');
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus RHK ini?")) return;
    const updatedList = rhkList.filter(item => item.id !== id);
    await persistToFirestore(updatedList);
  };

  const persistToFirestore = async (list: RencanaHasilKerjaBkn[]) => {
    try {
      setIsSaving(true);
      setRhkList(list);

      if (userProfile?.uid) {
        const userRef = doc(db, 'users', userProfile.uid);
        await updateDoc(userRef, {
          rhkBknList: list
        });
      }

      if (onProfileUpdated) {
        onProfileUpdated(list);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Gagal menyimpan RHK BKN ke Firestore:", error);
      alert("Gagal menyimpan perubahan ke database. Periksa koneksi internet Anda.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl">
        <DialogHeader className="border-b pb-3 border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn("p-2 rounded-xl flex items-center justify-center text-white", isSigap ? "bg-blue-600 shadow-blue-500/20 shadow-md" : "bg-teal-600 shadow-teal-500/20 shadow-md")}>
                <Target className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  Master Rencana Hasil Kerja (RHK) SKP BKN
                  <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider font-semibold", themeText)}>
                    PermenPANRB 6/2022
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Daftarkan RHK tahunan Anda dari portal e-Kinerja BKN agar aktivitas harian dapat dikelompokkan secara otomatis.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mt-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Button 
              type="button"
              variant={activeTab === 'list' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveTab('list')}
              className={cn("text-xs font-semibold rounded-lg", activeTab === 'list' ? themePrimary : "text-slate-600 dark:text-slate-300")}
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Daftar RHK Saya ({rhkList.length})
            </Button>
            <Button 
              type="button"
              variant={activeTab === 'form' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => { resetForm(); setActiveTab('form'); }}
              className={cn("text-xs font-semibold rounded-lg", activeTab === 'form' ? themePrimary : "text-slate-600 dark:text-slate-300")}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {editingId ? 'Edit RHK' : 'Tambah RHK Baru'}
            </Button>
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" />
              Tersimpan
            </div>
          )}
        </div>

        {/* TAB 1: LIST VIEW */}
        {activeTab === 'list' && (
          <div className="space-y-3.5 py-2">
            {rhkList.length === 0 ? (
              <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
                <Target className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Belum Ada RHK BKN yang Didaftarkan</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Daftarkan 2–5 RHK tahunan Anda sesuai yang tercatat di portal <span className="font-semibold text-blue-600">kinerja.bkn.go.id</span> agar aktivitas harian dapat disinkronkan.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={() => { resetForm(); setActiveTab('form'); }}
                    className={themePrimary}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Tambah RHK Manual
                  </Button>
                </div>
              </div>
            ) : (
              rhkList.map((item, index) => (
                <div 
                  key={item.id} 
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm hover:shadow-md transition-all space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center">
                        {index + 1}
                      </span>
                      <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", item.klasifikasi === 'Organisasi' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200')}>
                        {item.klasifikasi === 'Organisasi' ? <Building2 className="w-3 h-3 mr-1 inline" /> : <User className="w-3 h-3 mr-1 inline" />}
                        {item.klasifikasi}
                      </Badge>
                      <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0.5", item.jenis === 'Utama' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200')}>
                        {item.jenis}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] font-medium text-slate-500">
                        Tahun {item.tahun || 2026}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-slate-500 hover:text-blue-600"
                        onClick={() => handleEdit(item)}
                        title="Edit RHK"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-slate-500 hover:text-red-600"
                        onClick={() => handleDelete(item.id)}
                        title="Hapus RHK"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
                      {item.rencanaHasilKerja}
                    </h4>
                    {item.rhkPimpinan && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic line-clamp-1">
                        Intervensi Pimpinan: "{item.rhkPimpinan}"
                      </p>
                    )}
                  </div>

                  {/* Indikator Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                    <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded-lg">
                      <span className="text-slate-400 font-medium block">Kuantitas:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{item.aspekKuantitas?.target || '1 Dokumen'}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{item.aspekKuantitas?.indikator}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded-lg">
                      <span className="text-slate-400 font-medium block">Kualitas:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{item.aspekKualitas?.target || '100%'}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{item.aspekKualitas?.indikator}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/70 p-2 rounded-lg">
                      <span className="text-slate-400 font-medium block">Waktu:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{item.aspekWaktu?.target || '12 Bulan'}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{item.aspekWaktu?.indikator}</span>
                    </div>
                  </div>

                  {item.googleDriveFolderUrl && (
                    <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 pt-1">
                      <FolderPlus className="w-3.5 h-3.5" />
                      <a href={item.googleDriveFolderUrl} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1 truncate max-w-sm">
                        Folder Bukti Google Drive <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: FORM ADD / EDIT */}
        {activeTab === 'form' && (
          <form onSubmit={handleSaveForm} className="space-y-4 py-2 text-xs">
            {/* Quick Templates Bar */}
            <div className={cn("p-2.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2", themeBgLight)}>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Pilih Contoh Cepat:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CONTOH_RHK_TEMPLATES.map((tmpl, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    onClick={() => handleApplyTemplate(tmpl)}
                  >
                    Contoh {idx + 1}: {tmpl.klasifikasi} ({tmpl.jenis})
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-semibold">Tahun Periode</Label>
                <Input 
                  type="number" 
                  value={tahun} 
                  onChange={(e) => setTahun(Number(e.target.value))} 
                  className="h-8 text-xs mt-1"
                  required 
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Klasifikasi RHK</Label>
                <select 
                  value={klasifikasi} 
                  onChange={(e) => setKlasifikasi(e.target.value as any)}
                  className="w-full h-8 text-xs mt-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2"
                >
                  <option value="Organisasi">Organisasi (Tertaut Unit Kerja)</option>
                  <option value="Individu">Individu (Keahlian Personal)</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Jenis RHK</Label>
                <select 
                  value={jenis} 
                  onChange={(e) => setJenis(e.target.value as any)}
                  className="w-full h-8 text-xs mt-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2"
                >
                  <option value="Utama">Utama (Tupoksi Pokok)</option>
                  <option value="Tambahan">Tambahan (Penugasan Khusus)</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">RHK Pimpinan Yang Diintervensi</Label>
              <Textarea 
                value={rhkPimpinan} 
                onChange={(e) => setRhkPimpinan(e.target.value)} 
                placeholder="Salin kalimat RHK atasan Anda yang tercatat di portal BKN..."
                className="text-xs mt-1 min-h-[50px]"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                Rencana Hasil Kerja (RHK) Pegawai <span className="text-red-500">*</span>
              </Label>
              <Textarea 
                value={rencanaHasilKerja} 
                onChange={(e) => setRencanaHasilKerja(e.target.value)} 
                placeholder="Contoh: Tersedianya dokumen pengamanan barang milik daerah SKPD"
                className="text-xs mt-1 min-h-[60px]"
                required
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <h5 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                Tiga Aspek Wajib Indikator Kinerja Individu (IKI)
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-3">
                  <Label className="text-[11px] text-slate-500">Indikator Kuantitas</Label>
                  <Input 
                    value={indikatorKuantitas} 
                    onChange={(e) => setIndikatorKuantitas(e.target.value)} 
                    className="h-7 text-xs mt-0.5" 
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-500">Target Kuantitas</Label>
                  <Input 
                    value={targetKuantitas} 
                    onChange={(e) => setTargetKuantitas(e.target.value)} 
                    className="h-7 text-xs mt-0.5" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-3">
                  <Label className="text-[11px] text-slate-500">Indikator Kualitas</Label>
                  <Input 
                    value={indikatorKualitas} 
                    onChange={(e) => setIndikatorKualitas(e.target.value)} 
                    className="h-7 text-xs mt-0.5" 
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-500">Target Kualitas</Label>
                  <Input 
                    value={targetKualitas} 
                    onChange={(e) => setTargetKualitas(e.target.value)} 
                    className="h-7 text-xs mt-0.5" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-3">
                  <Label className="text-[11px] text-slate-500">Indikator Waktu</Label>
                  <Input 
                    value={indikatorWaktu} 
                    onChange={(e) => setIndikatorWaktu(e.target.value)} 
                    className="h-7 text-xs mt-0.5" 
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-500">Target Waktu</Label>
                  <Input 
                    value={targetWaktu} 
                    onChange={(e) => setTargetWaktu(e.target.value)} 
                    className="h-7 text-xs mt-0.5" 
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                Tautan Folder Bukti Google Drive (Opsional)
              </Label>
              <Input 
                type="url"
                value={googleDriveFolderUrl} 
                onChange={(e) => setGoogleDriveFolderUrl(e.target.value)} 
                placeholder="https://drive.google.com/drive/folders/..."
                className="h-8 text-xs mt-1"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Folder ini akan digunakan sebagai link default eviden saat mengisi portal e-Kinerja BKN.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => { resetForm(); setActiveTab('list'); }}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={isSaving}
                className={themePrimary}
              >
                {isSaving ? 'Menyimpan...' : (editingId ? 'Perbarui RHK' : 'Simpan RHK Baru')}
              </Button>
            </div>
          </form>
        )}

        <DialogFooter className="border-t pt-3 border-slate-100 dark:border-slate-800 flex items-center justify-between sm:justify-between">
          <span className="text-[11px] text-slate-400">
            Terintegrasi langsung dengan profil ASN & modul Logbook.
          </span>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
