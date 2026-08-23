"use client";

import React, { useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { OPD } from '@/types';
import { useUserAuth } from '@/context/AuthContext';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData'; 
import { Save, FilePenLine, Archive, ArchiveRestore, Loader2, Copy, Building2, ChevronRight, ChevronDown } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface OpdManagementViewProps {
  tenant: 'sigap' | 'poros';
}

export default function OpdManagementView({ tenant }: OpdManagementViewProps) {
  const { userProfile, loading: authLoading } = useUserAuth();
  const { addToast } = useToast();
  
  const { opdList, isLoading: isMasterLoading } = useMasterData(true);
  
  const [namaOpd, setNamaOpd] = useState('');
  const [alamat, setAlamat] = useState('');
  const [tipeOpd, setTipeOpd] = useState<'Induk' | 'Sub-OPD'>('Induk');
  const [selectedInduk, setSelectedInduk] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentOpd, setCurrentOpd] = useState<OPD | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); 
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isProcessing?: boolean;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const opdIndukList = useMemo(() => opdList.filter(opd => opd.tipe === 'Induk' && opd.status === 'aktif'), [opdList]);
  
  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!namaOpd || !alamat) { setError("Nama OPD dan Alamat tidak boleh kosong."); return; }
    if (tipeOpd === 'Sub-OPD' && !selectedInduk) { setError("Pilih OPD Induk untuk Sub-OPD."); return; }
    
    setIsProcessing(true);
    try {
      await addDoc(collection(db, "opd"), { 
        namaOpd, alamat, tipe: tipeOpd, 
        idOpdInduk: tipeOpd === 'Induk' ? null : selectedInduk,
        status: 'aktif'
      });
      setNamaOpd(''); setAlamat(''); setTipeOpd('Induk'); setSelectedInduk(null);
      addToast("OPD berhasil ditambahkan", "success");
    } catch (err) {
      setError("Gagal menambahkan OPD baru.");
      console.error(err);
    } finally { setIsProcessing(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOpd || !currentOpd.id) return;
    setIsProcessing(true);
    try {
      const opdRef = doc(db, "opd", currentOpd.id);
      await updateDoc(opdRef, {
        namaOpd: currentOpd.namaOpd,
        alamat: currentOpd.alamat,
        tipe: currentOpd.tipe,
        idOpdInduk: currentOpd.tipe === 'Induk' ? null : currentOpd.idOpdInduk,
      });
      setIsEditModalOpen(false);
      setCurrentOpd(null);
      addToast("Data OPD diperbarui", "success");
    } catch (err) {
      setError("Gagal memperbarui OPD.");
    } finally { setIsProcessing(false); }
  };
  
  const handleToggleArchive = async (opdToToggle: OPD) => {
    const { id, status } = opdToToggle;
    if (!id) return;
    const newStatus = status === 'aktif' ? 'nonaktif' : 'aktif';
    const action = newStatus === 'nonaktif' ? 'mengarsipkan' : 'mengaktifkan kembali';
    setConfirmModal({
        isOpen: true, title: `Konfirmasi ${action}`, message: `Apakah Anda yakin ingin ${action} OPD ini?`,
        onConfirm: async () => {
            setConfirmModal(prev => ({ ...prev, isProcessing: true }));
            try { await updateDoc(doc(db, "opd", id), { status: newStatus }); addToast(`OPD berhasil di${newStatus === 'aktif' ? 'aktifkan' : 'arsipkan'}`, "success"); } 
            catch (err) { setError(`Gagal ${action} OPD.`); } 
            finally { setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, isProcessing: false }); }
        }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast("ID disalin ke clipboard", "info");
  };

  if (authLoading) return <div className="text-center p-8 text-muted-foreground">Memeriksa otorisasi...</div>;
  if (userProfile?.role !== 'super_admin') return <div className="p-6 text-center text-red-700 bg-red-100 rounded-lg">Akses ditolak. Hanya Super Admin yang boleh mengelola OPD.</div>;

  const isPoros = tenant === 'poros';
  const cardClass = isPoros ? 'nk-card p-4 md:p-6 mb-4 md:mb-6' : 'bg-card p-3 md:p-6 mb-4 md:mb-6 sg-mobile-borderless';
  const tableWrapperClass = isPoros ? 'nk-table-wrapper' : 'overflow-x-auto border rounded-lg';

  // Build tree data
  const visibleOpds = opdList.filter(opd => showArchived ? opd.status === 'nonaktif' : opd.status !== 'nonaktif');
  const indukOpds = visibleOpds.filter(opd => opd.tipe === 'Induk').sort((a, b) => a.namaOpd.localeCompare(b.namaOpd));
  
  return (
    <div className="animate-fadeInUp pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
      <div className={cardClass}>
        <h2 className="text-base md:text-xl font-semibold text-foreground mb-3 md:mb-4">Tambah Unit Kerja Baru</h2>
        {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nama Unit / OPD</Label><Input value={namaOpd} onChange={e => setNamaOpd(e.target.value)} placeholder="Contoh: Kelurahan Banjarsari" required className={isPoros ? 'bg-white/50 dark:bg-black/20' : ''}/></div>
            <div><Label>Alamat Kantor</Label><Input value={alamat} onChange={e => setAlamat(e.target.value)} placeholder="Jl. Jendral Sudirman No..." required className={isPoros ? 'bg-white/50 dark:bg-black/20' : ''}/></div>
            <div>
                <Label>Tipe Unit</Label>
                <Select value={tipeOpd} onValueChange={e => setTipeOpd(e as 'Induk' | 'Sub-OPD')}>
                    <SelectTrigger className={isPoros ? 'bg-white/50 dark:bg-black/20' : ''}><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Induk">🏢 Induk (Kecamatan/Dinas)</SelectItem>
                        <SelectItem value="Sub-OPD">🏠 Sub-OPD (Kelurahan/UPT)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            {tipeOpd === 'Sub-OPD' && (
              <div className="bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                <Label className="text-blue-900 dark:text-blue-300">Induk Unit (Atasan)</Label>
                <Select value={selectedInduk || ''} onValueChange={e => setSelectedInduk(e)}>
                    <SelectTrigger className={isPoros ? 'bg-white/50 dark:bg-black/20 mt-1' : 'mt-1'}><SelectValue placeholder="-- Pilih Unit Induk --" /></SelectTrigger>
                    <SelectContent>
                        {opdIndukList.map(opd => (
                            <SelectItem key={opd.id} value={opd.id!}>
                                {opd.namaOpd} <span className="text-xs text-muted-foreground ml-2">({opd.id})</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">Pastikan memilih Kecamatan yang benar agar data terhubung.</p>
              </div>
            )}
          </div>
          <Button type="submit" disabled={isProcessing} className={isPoros ? 'bg-[var(--nk-teal-mid)] hover:bg-[var(--nk-teal-mid)]/90 text-white' : ''}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Simpan Unit Kerja
          </Button>
        </form>
      </div>

      <div className={cardClass.replace('p-6', 'p-0')}>
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border gap-4">
            <div>
                <h2 className="text-xl font-semibold text-foreground">Struktur Wilayah & Organisasi</h2>
                <p className="text-sm text-muted-foreground mt-1">Hierarki Induk dan Sub-OPD (Tree View)</p>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="showArchived" checked={showArchived} onCheckedChange={() => setShowArchived(!showArchived)} />
                <Label htmlFor="showArchived" className="text-sm font-medium cursor-pointer">Tampilkan Arsip (Non-Aktif)</Label>
            </div>
        </div>
        
        <div className="p-4">
          {isMasterLoading ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-2">
               {indukOpds.map(induk => {
                 const subs = visibleOpds.filter(o => o.idOpdInduk === induk.id).sort((a, b) => a.namaOpd.localeCompare(b.namaOpd));
                 const isExpanded = expandedNodes.has(induk.id!);
                 return (
                   <div key={induk.id} className="border border-border rounded-lg overflow-hidden bg-background">
                     <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                       <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggleNode(induk.id!)}>
                         <button className="p-1 hover:bg-muted rounded-md text-muted-foreground">
                           {subs.length > 0 ? (isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />) : <div className="w-[18px] h-[18px]" />}
                         </button>
                         <Building2 size={18} className="text-primary" />
                         <div>
                           <div className="font-semibold text-foreground">{induk.namaOpd}</div>
                           <div className="text-xs text-muted-foreground">{induk.alamat}</div>
                         </div>
                       </div>
                       <div className="flex items-center gap-4">
                         <Badge variant="outline" className="font-mono text-[10px] cursor-pointer" onClick={() => copyToClipboard(induk.id || '')}>
                            {induk.id} <Copy size={10} className="ml-1"/>
                         </Badge>
                         <Badge>Induk</Badge>
                         <div className="flex gap-1">
                           <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setCurrentOpd(induk); setIsEditModalOpen(true); }}><FilePenLine size={16} className="text-yellow-600" /></Button>
                           <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleToggleArchive(induk); }}>{induk.status === 'aktif' ? <Archive size={16} className="text-red-600" /> : <ArchiveRestore size={16} className="text-green-600" />}</Button>
                         </div>
                       </div>
                     </div>
                     {isExpanded && subs.length > 0 && (
                       <div className="border-t border-border bg-muted/20">
                         {subs.map((sub, idx) => (
                           <div key={sub.id} className={`flex items-center justify-between p-3 pl-12 hover:bg-muted/50 transition-colors ${idx !== subs.length - 1 ? 'border-b border-border/50' : ''}`}>
                             <div className="flex items-center gap-2">
                               <div className="w-1 h-1 bg-muted-foreground rounded-full mr-1"></div>
                               <div>
                                 <div className="font-medium text-foreground">{sub.namaOpd}</div>
                                 <div className="text-xs text-muted-foreground">{sub.alamat}</div>
                               </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <Badge variant="outline" className="font-mono text-[10px] cursor-pointer" onClick={() => copyToClipboard(sub.id || '')}>
                                    {sub.id} <Copy size={10} className="ml-1"/>
                                </Badge>
                                <Badge variant="secondary">Sub-OPD</Badge>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => { setCurrentOpd(sub); setIsEditModalOpen(true); }}><FilePenLine size={16} className="text-yellow-600" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleToggleArchive(sub)}>{sub.status === 'aktif' ? <Archive size={16} className="text-red-600" /> : <ArchiveRestore size={16} className="text-green-600" />}</Button>
                                </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 );
               })}
               
               {/* Yatim Piatu */}
               {visibleOpds.filter(o => o.tipe === 'Sub-OPD' && !indukOpds.some(i => i.id === o.idOpdInduk)).map(sub => (
                   <div key={sub.id} className="border border-red-200 dark:border-red-900/50 rounded-lg overflow-hidden bg-red-50/50 dark:bg-red-950/20">
                      <div className="flex items-center justify-between p-3">
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></div>
                           <div>
                             <div className="font-medium text-foreground">{sub.namaOpd} <span className="text-xs text-red-600 ml-2">(Induk Tidak Ditemukan)</span></div>
                             <div className="text-xs text-muted-foreground">{sub.alamat}</div>
                           </div>
                         </div>
                         <div className="flex items-center gap-4">
                            <Badge variant="outline" className="font-mono text-[10px] cursor-pointer" onClick={() => copyToClipboard(sub.id || '')}>
                                {sub.id} <Copy size={10} className="ml-1"/>
                            </Badge>
                            <Badge variant="destructive">Orphaned Sub-OPD</Badge>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" onClick={() => { setCurrentOpd(sub); setIsEditModalOpen(true); }}><FilePenLine size={16} className="text-yellow-600" /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleToggleArchive(sub)}>{sub.status === 'aktif' ? <Archive size={16} className="text-red-600" /> : <ArchiveRestore size={16} className="text-green-600" />}</Button>
                            </div>
                         </div>
                      </div>
                   </div>
               ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDIT */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className={isPoros ? 'nk-glass-panel border-border' : 'bg-card border-border'}>
          <DialogHeader>
            <DialogTitle>Edit Data Unit Kerja</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 py-2">
            <div><Label>Nama Unit</Label><Input value={currentOpd?.namaOpd || ''} onChange={e => setCurrentOpd(prev => prev ? {...prev, namaOpd: e.target.value} : null)} required className={isPoros ? 'bg-background/50' : ''}/></div>
            <div><Label>Alamat</Label><Input value={currentOpd?.alamat || ''} onChange={e => setCurrentOpd(prev => prev ? {...prev, alamat: e.target.value} : null)} required className={isPoros ? 'bg-background/50' : ''}/></div>
            <div>
              <Label>Tipe</Label>
              <Select value={currentOpd?.tipe || ''} onValueChange={e => setCurrentOpd(prev => prev ? {...prev, tipe: e as 'Induk' | 'Sub-OPD'} : null)}>
                <SelectTrigger className={isPoros ? 'bg-background/50' : ''}><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Induk">Induk</SelectItem><SelectItem value="Sub-OPD">Sub-OPD</SelectItem></SelectContent>
              </Select>
            </div>
            {currentOpd?.tipe === 'Sub-OPD' && (
              <div>
                <Label>Induk Unit</Label>
                <Select value={currentOpd?.idOpdInduk || ''} onValueChange={e => setCurrentOpd(prev => prev ? {...prev, idOpdInduk: e} : null)}>
                  <SelectTrigger className={isPoros ? 'bg-background/50' : ''}><SelectValue placeholder="Pilih Induk" /></SelectTrigger>
                  <SelectContent>
                    {opdIndukList.map(opd => <SelectItem key={opd.id} value={opd.id!}>{opd.namaOpd}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isProcessing} className={isPoros ? 'bg-[var(--nk-teal-mid)] hover:bg-[var(--nk-teal-mid)]/90 text-white' : ''}>
                {isProcessing ? <Loader2 className="animate-spin" /> : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Action */}
      <Dialog open={confirmModal.isOpen} onOpenChange={(open) => !open && setConfirmModal(prev => ({...prev, isOpen: false}))}>
          <DialogContent className={isPoros ? 'nk-glass-panel border-border' : 'bg-card border-border'}>
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">{confirmModal.title}</DialogTitle>
                  <DialogDescription>{confirmModal.message}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setConfirmModal(prev => ({...prev, isOpen: false}))} disabled={confirmModal.isProcessing}>Batal</Button>
                  <Button variant="default" onClick={confirmModal.onConfirm} disabled={confirmModal.isProcessing} className={isPoros ? 'bg-[var(--nk-teal-mid)] hover:bg-[var(--nk-teal-mid)]/90 text-white' : ''}>
                      {confirmModal.isProcessing ? <Loader2 className="animate-spin" /> : 'Ya, Lanjutkan'}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
