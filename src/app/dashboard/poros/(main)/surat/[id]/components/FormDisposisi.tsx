/**
 * Directory: src/app/dashboard/surat/[id]/components/FormDisposisi.tsx
 * History Updates:
 * - 2024-11-20: Refactoring menggunakan `useSuratActions` (SSOT Mutasi).
 * - 2024-11-21: Implementasi Local Cache (Draft) dengan path import yang diperbaiki.
 * - [UPDATE MOBILE UI]: Padding dan ukuran font diperkecil untuk ponsel.
 */

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useUserAuth } from '@/context/AuthContext';
import { Jabatan, Disposisi, UserProfile, Surat } from '@/types';
import { UserCheck, Search, Send, X, Bell, Loader2, Sparkles, Save, Info, CalendarPlus, Mic, HelpCircle } from 'lucide-react';
import ConfirmModal from '@/app/dashboard/poros/components/ConfirmModal';
import { useToast } from '@/context/ToastContext';
import { useBawahanList } from '@/app/dashboard/poros/hooks/useBawahanList';
import { useInstruksiTemplat } from '@/app/dashboard/poros/hooks/useInstruksiTemplat';
import { useSuratActions } from '@/app/dashboard/poros/hooks/useSuratActions'; 
import { useLocalStorage } from '@/app/dashboard/poros/hooks/useLocalStorage'; 
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandItem, CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FormDisposisiProps {
  surat: Surat;
  onDisposisiSuccess: () => void;
  opdJabatans: Map<string, Jabatan>; 
  userCache: Map<string, UserProfile>;
  isRevising: boolean;
  latestDisposisi: Disposisi | null;
  isPimpinanPenerimaAwal: boolean;
}

export default function FormDisposisi({ 
  surat, 
  onDisposisiSuccess, 
  opdJabatans, 
  userCache, 
  isRevising, 
  latestDisposisi,
  isPimpinanPenerimaAwal
}: FormDisposisiProps) {
  const { userProfile } = useUserAuth();
  const { addToast } = useToast();
  
  // --- HOOKS ---
  const { bawahanList, isLoading: isBawahanLoading, error: bawahanError } = useBawahanList(userCache, opdJabatans);
  const { templatList, isLoading: isTemplatLoading } = useInstruksiTemplat();
  const { kirimDisposisi, isProcessing } = useSuratActions(); 
  const { isListening, isProcessingAI, audioBlob, startListening, stopListening, resetAudio } = useVoiceAssistant(bawahanList);

  const handleVoiceAIResult = (result: any) => {
      if (result) {
          if (result.instruksi) {
              setInstruksi(prev => prev ? `${prev}\n${result.instruksi}` : result.instruksi);
          }
          if (result.penerimaIds && result.penerimaIds.length > 0) {
              const matched = bawahanList.filter(b => 
                  result.penerimaIds.includes(b.uid) || 
                  result.penerimaIds.includes(b.namaLengkap) || 
                  result.penerimaIds.includes(b.namaJabatan)
              );
              if (matched.length > 0) {
                  // Merge with existing selectedPenerima to not override what user already selected
                  setSelectedPenerima(prev => {
                      const newItems = matched.filter(m => !prev.some(p => p.uid === m.uid));
                      return [...prev, ...newItems];
                  });
              }
          }
      }
  };

  // --- STATE DENGAN LOCAL CACHE ---
  const draftKey = `disposisi_draft_${surat.id}`;
  const [instruksi, setInstruksi, removeInstruksi] = useLocalStorage(draftKey, '');

  const [selectedPenerima, setSelectedPenerima] = useState<UserProfile[]>([]);
  const [batasWaktu, setBatasWaktu] = useState<Date | undefined>(undefined);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const isPemberitahuanMode = surat.jenisSurat === 'Pemberitahuan';
  const isTuOrAdmin = userProfile?.role === 'staf_tu' || userProfile?.role === 'admin_opd';
  
  // --- FILTER BAWAHAN ---
  const filteredBawahan = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const currentTeamIds = new Set(selectedPenerima.map(p => p.jabatanId));
    
    return bawahanList.filter(user => {
        const notSelected = !currentTeamIds.has(user.jabatanId);
        const matchesSearch = searchTerm.length < 1 || (
            user.namaLengkap.toLowerCase().includes(searchLower) ||
            (user.namaJabatan || '').toLowerCase().includes(searchLower)
        );
        return notSelected && matchesSearch;
    });
  }, [bawahanList, searchTerm, selectedPenerima]);

  // --- EFFECTS ---
  useEffect(() => {
    if (isPemberitahuanMode && !instruksi) {
      setInstruksi("Untuk diketahui dan dipedomani.");
    }

    if (isRevising && latestDisposisi) {
        if (!instruksi) setInstruksi(latestDisposisi.instruksi);
        
        setBatasWaktu(latestDisposisi.batasWaktu ? latestDisposisi.batasWaktu.toDate() : undefined);
        
        const penerimaIds = latestDisposisi.kepadaJabatanId || [];
        const penerimaProfiles = penerimaIds
            .map(id => bawahanList.find(b => b.jabatanId === id) || userCache.get(id))
            .filter(Boolean) as UserProfile[];
            
        if (selectedPenerima.length === 0) setSelectedPenerima(penerimaProfiles);
    }
  }, [isRevising, latestDisposisi, isPemberitahuanMode, userCache, bawahanList]);

  // --- HANDLERS ---
  const handleSelectJabatan = (user: UserProfile) => {
    setSelectedPenerima(prev => [...prev, user]);
    setSearchTerm('');
    setIsDropdownOpen(false); 
  };
  const handleRemoveJabatan = (uid: string) => {
    setSelectedPenerima(prev => prev.filter(u => u.uid !== uid));
  };
  const handleTemplatClick = (teks: string) => {
    setInstruksi(prev => prev ? `${prev}\n${teks}` : teks);
  };
  
  const handleAskAi = async () => {
    if (!surat || bawahanList.length === 0) { addToast("Data tidak cukup untuk AI.", "error"); return; }
    setIsAiLoading(true);
    try {
        const simplifiedBawahan = bawahanList.map(b => ({ jabatanId: b.jabatanId, namaJabatan: b.namaJabatan, namaLengkap: b.namaLengkap }));
        const response = await fetch('/api/ai/suggest-disposition', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ surat: { perihal: surat.perihal, pengirim: surat.pengirim, jenisSurat: surat.jenisSurat }, bawahanList: simplifiedBawahan }) });
        const result = await response.json();
        if (result.success) {
            if (result.suggestedInstruction) setInstruksi(result.suggestedInstruction);
            if (result.suggestedRecipients && Array.isArray(result.suggestedRecipients)) {
                const suggestedProfiles = bawahanList.filter(b => result.suggestedRecipients.includes(b.jabatanId));
                setSelectedPenerima(suggestedProfiles);
            }
        }
    } catch (err: any) { console.error(err); addToast(err.message, 'error'); } 
    finally { setIsAiLoading(false); }
  };

  const handleSend = async (targets: UserProfile[], instruksiText: string, isInformational: boolean) => {
      const success = await kirimDisposisi(
          surat,
          targets,
          instruksiText,
          batasWaktu,
          isRevising,
          latestDisposisi?.id,
          isInformational,
          audioBlob
      );
      
      if (success) {
          removeInstruksi(); 
          setSelectedPenerima([]);
          setBatasWaktu(undefined);
          onDisposisiSuccess();
      }
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPenerima.length === 0 || !instruksi) {
      addToast("Pilih tujuan dan isi instruksi.", "error");
      return;
    }
    const title = isRevising ? 'Kirim Revisi' : 'Kirim Disposisi';
    setConfirmModal({
        isOpen: true,
        title: `Konfirmasi ${title}`,
        message: `Anda yakin ingin mengirim ${title.toLowerCase()} ini kepada ${selectedPenerima.length} penerima?`,
        onConfirm: () => handleSend(selectedPenerima, instruksi, isPemberitahuanMode)
    });
  };
  
  const handleSebarkanKeSemua = () => {
    if (!userProfile?.opdId) return;
    const allUsersInOpd = Array.from(userCache.values()).filter(u => 
        u.status === 'aktif' && u.uid !== userProfile.uid 
    );

    if (allUsersInOpd.length === 0) {
        addToast("Tidak ada pegawai lain ditemukan di OPD ini.", "error"); return;
    }
    setConfirmModal({
        isOpen: true,
        title: 'Konfirmasi Sebarkan',
        message: `Anda yakin ingin menyebarkan pemberitahuan ini ke ${allUsersInOpd.length} pegawai di OPD Anda?`,
        onConfirm: () => {
            const finalInstruksi = instruksi.trim() || "Untuk diketahui dan dipedomani.";
            handleSend(allUsersInOpd, finalInstruksi, true);
        }
    });
  };

  const handleSelfDisposition = () => {
      if (!userProfile) return;
      setConfirmModal({
        isOpen: true,
        title: 'Konfirmasi Aksi',
        message: 'Anda yakin ingin menindaklanjuti surat ini sendiri?',
        onConfirm: () => {
            const selfInstruksi = instruksi.trim() || `Akan dihadiri/ditindaklanjuti secara pribadi.`;
            handleSend([userProfile], selfInstruksi, false);
        }
    });
  };

  const handleSelfClickRedirect = (e: React.MouseEvent) => {
    e.preventDefault();
    addToast("Untuk menindaklanjutinya, silakan gunakan form 'Tindak Lanjut' di bawah.", "info");
    const tindakLanjutFormDesktop = document.getElementById('form-tindak-lanjut-desktop');
    if (tindakLanjutFormDesktop) tindakLanjutFormDesktop.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  
  if (isTuOrAdmin && !isRevising) {
    return <div className="bg-card p-4 md:p-6 text-center text-muted-foreground rounded-xl border border-border"><Info size={20} className="mx-auto mb-2 text-yellow-500"/><p className="font-semibold text-sm md:text-base">Aksi Tidak Diizinkan</p><p className="text-xs md:text-sm mt-1">Staf TU / Admin hanya bertugas mengelola surat masuk.</p></div>;
  }
  
  const isStillLoadingTargets = isBawahanLoading && !isTuOrAdmin && !isRevising;

  return (
    <div className="bg-transparent md:bg-card md:rounded-xl md:shadow-sm md:border md:border-border">
        {/* Penyesuaian Padding Header */}
        <div className="px-4 pb-3 md:p-6 md:border-b md:border-border flex items-center justify-end md:justify-between">
            <div className="hidden md:flex items-center">
                <Send size={18} className="mr-2 md:mr-3 text-blue-600 md:w-5 md:h-5" />
                <h2 className="text-base md:text-xl font-semibold text-foreground">
                {isPemberitahuanMode ? 'Kirim Pemberitahuan' : (isRevising ? 'Revisi Disposisi' : 'Aksi Disposisi')}
                </h2>
            </div>
                 <Button
                    type="button" variant="ghost" size="sm"
                    onClick={handleAskAi}
                    disabled={isAiLoading || isStillLoadingTargets}
                    className="h-7 md:h-8 px-2 md:px-3 text-[10px] md:text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300"
                >
                    {isAiLoading ? <Loader2 size={12} className="md:w-3.5 md:h-3.5 animate-spin mr-1 md:mr-1.5"/> : <Sparkles size={12} className="md:w-3.5 md:h-3.5 mr-1 md:mr-1.5"/>}
                    {isAiLoading ? 'Menganalisis...' : 'Saran AI'}
                </Button>
        </div>
        
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                {(isStillLoadingTargets || bawahanError) && (
                  <p className={`text-[11px] md:text-sm p-2.5 md:p-3 rounded-lg border flex items-center gap-2 ${bawahanError ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                    {bawahanError ? <Info size={14} className="md:w-4 md:h-4"/> : <Loader2 size={14} className="md:w-4 md:h-4 animate-spin"/>}
                    {bawahanError || 'Memuat daftar bawahan...'}
                  </p>
                )}
                
                <div>
                    <Label htmlFor="search-penerima" className="text-xs md:text-sm">
                      {isPemberitahuanMode ? 'Kirim ke (Perorangan)' : 'Disposisikan Kepada'}
                    </Label>
                    <div className="flex flex-wrap gap-1.5 md:gap-2 my-2">
                        {selectedPenerima.map(user => (
                            <Badge key={user.uid} variant="secondary" className="flex items-center gap-1.5 py-0.5 md:py-1 px-2 text-[10px] md:text-xs">
                                {user.namaLengkap}
                                <button type="button" onClick={() => handleRemoveJabatan(user.uid)} className="hover:text-red-500"><X size={12} className="md:w-3.5 md:h-3.5" /></button>
                            </Badge>
                        ))}
                    </div>
                    
                    <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen} modal={false}>
                        <PopoverTrigger asChild>
                            <div className="relative">
                                <Input
                                    type="text" id="search-penerima"
                                    placeholder={isBawahanLoading ? "Memuat..." : "Cari nama jabatan atau pejabat..."}
                                    value={searchTerm} 
                                    onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(e.target.value.length > 0); }}
                                    className="pl-9 md:pl-10 text-xs md:text-sm h-9 md:h-10" disabled={isBawahanLoading} autoComplete="off"
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                    {isBawahanLoading ? <Loader2 size={14} className="md:w-4 md:h-4 animate-spin" /> : <Search size={14} className="md:w-4 md:h-4" />}
                                </div>
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                           <Command>
                             <CommandList>
                                {!isBawahanLoading && filteredBawahan.length > 0 ? (
                                    <ScrollArea className="max-h-[200px] overflow-y-auto">
                                        {filteredBawahan.map(u => (
                                            <CommandItem key={u.uid} onSelect={() => handleSelectJabatan(u)} className="cursor-pointer py-1.5 md:py-2">
                                                <div>
                                                  <p className="font-semibold text-xs md:text-sm leading-tight">{u.namaLengkap}</p>
                                                  <p className="text-[10px] md:text-xs text-muted-foreground leading-tight mt-0.5">{u.namaJabatan}</p>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </ScrollArea>
                                ) : (<CommandEmpty className="text-xs py-4">Tidak ditemukan.</CommandEmpty>)}
                             </CommandList>
                           </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                
                {!isPemberitahuanMode && (
                    <div className="space-y-4">
                     <div className="flex flex-col gap-2">
                        <Label className="text-xs md:text-sm">Batas Waktu (Opsional)</Label>
                        <DatePicker date={batasWaktu} setDate={setBatasWaktu} />
                    </div>
                </div>
                )}

                <div>
                    <div className="flex justify-between items-center">
                        <Label htmlFor="instruksi" className="text-xs md:text-sm">Isi Instruksi</Label>
                        <div className="flex items-center gap-1">
                            <HelpCircle size={14} className="text-muted-foreground cursor-help mr-1" title="Klik tombol Suara lalu bicarakan instruksi dan nama penerima. Contoh: 'Tolong tindak lanjuti surat ini, teruskan ke Budi'" />
                            <Button 
                                type="button" 
                                variant={isListening ? "default" : "outline"} 
                                size="sm" 
                                onClick={() => isListening ? stopListening() : startListening(handleVoiceAIResult)} 
                                disabled={isProcessingAI || isBawahanLoading} 
                                className={`h-6 px-2 text-[10px] transition-all ${isListening ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'text-teal-600 hover:text-teal-700 bg-teal-50 dark:bg-teal-900/20'}`}
                                title="Disposisi dengan Suara"
                            >
                                {isProcessingAI ? <Loader2 size={10} className="animate-spin mr-1"/> : <Mic size={10} className="mr-1"/>} 
                                {isListening ? 'Mendengarkan...' : 'Suara'}
                            </Button>
                            <Button type="button" variant="ghost" size="sm" disabled={true} title="Saran AI Sedang Dinonaktifkan Sementara" className="h-6 px-2 text-[10px] text-muted-foreground bg-muted/50 cursor-not-allowed">
                                <Sparkles size={10} />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 md:gap-2 my-1.5 md:my-2">
                        {isTemplatLoading ? <p className="text-[10px] md:text-xs text-muted-foreground animate-pulse">Memuat templat...</p> : templatList.map(t => (
                              <Button key={t.id} type="button" variant="secondary" size="sm" className="h-6 md:h-8 text-[10px] md:text-xs px-2 md:px-3" onClick={() => handleTemplatClick(t.teksInstruksi)}>{t.teksInstruksi}</Button>
                        ))}
                    </div>
                    <Textarea 
                      id="instruksi" 
                      value={instruksi} 
                      onChange={e => setInstruksi(e.target.value)} 
                      rows={3} 
                      required 
                      className={`text-xs md:text-sm resize-none ${isListening ? 'border-red-400 ring-1 ring-red-400/50' : ''}`}
                      placeholder={isListening ? "Mendengarkan suara Anda..." : isRevising ? "Tuliskan instruksi revisi..." : "Tuliskan instruksi disposisi..."}
                      disabled={isListening || isProcessingAI}
                    />
                    {audioBlob && (
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] px-2 py-0">
                                <Mic size={10} className="mr-1" /> Voice Note Terlampir
                            </Badge>
                            <button onClick={resetAudio} type="button" className="text-[10px] text-red-500 hover:underline">Hapus Rekaman</button>
                        </div>
                    )}
                    <div className="flex justify-end mt-1">
                         <span className="text-[9px] md:text-[10px] text-muted-foreground flex items-center"><Save size={10} className="mr-1"/> Draf tersimpan otomatis</span>
                    </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2.5 md:gap-4 pt-3 md:pt-4 border-t border-border">
                    {isPemberitahuanMode ? (
                        <>
                           <Button type="submit" disabled={isProcessing || selectedPenerima.length === 0} className="w-full h-9 md:h-10 text-xs md:text-sm shadow-sm">
                                <Send size={16} className="md:w-4 md:h-4 mr-2" /> {isProcessing ? 'Mengirim...' : 'Kirim Pemberitahuan'}
                           </Button>
                           <Button type="button" onClick={handleSebarkanKeSemua} disabled={isProcessing} className="w-full h-9 md:h-10 text-xs md:text-sm bg-amber-600 hover:bg-amber-700 text-white shadow-sm">
                                <Bell size={16} className="md:w-4 md:h-4 mr-2" /> Sebarkan ke OPD
                           </Button>
                        </>
                    ) : (
                        <>
                           <Button type="button" onClick={isPimpinanPenerimaAwal ? handleSelfDisposition : handleSelfClickRedirect} disabled={isProcessing} className="w-full h-9 md:h-10 text-xs md:text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                                <UserCheck size={16} className="md:w-4 md:h-4 mr-2" /> Tindak Lanjuti Sendiri
                           </Button>
                           <Button type="submit" disabled={isProcessing || selectedPenerima.length === 0} className="w-full h-9 md:h-10 text-xs md:text-sm shadow-sm">
                                {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send size={16} className="md:w-4 md:h-4 mr-2" />}
                                {isProcessing ? 'Memproses...' : (isRevising ? 'Kirim Revisi Ulang' : 'Kirim Disposisi')}
                           </Button>
                        </>
                    )}
                </div>
            </form>
        </div>
        
        <ConfirmModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            onConfirm={confirmModal.onConfirm}
            title={confirmModal.title}
            message={confirmModal.message}
            isProcessing={isProcessing} 
        />
    </div>
  );
}