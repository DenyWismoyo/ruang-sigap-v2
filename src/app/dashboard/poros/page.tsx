"use client";

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useUserAuth } from '@/context/AuthContext'; 
import { JadwalTempat, CombinedAgendaItem, EnrichedSuratAgenda } from '@/types'; 
import Link from 'next/link';
import { toPng } from 'html-to-image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CalendarClock, MapPin, Calendar, Send, Info,
    Clock, ExternalLink, CalendarDays, LayoutGrid, List,
    Download, Briefcase, ClipboardCheck, ListChecks, 
    FolderArchive, BookOpen, Archive, FileText, Megaphone, User
} from 'lucide-react';
import JadwalDetailModal from '@/app/dashboard/poros/(main)/jadwal/components/JadwalDetailModal'; 
import RuangKerjaSkeleton from '@/app/dashboard/poros/components/skeletons/RuangKerjaSkeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// --- IMPORT KOMPONEN BARU ---
import SmartGreeting from '@/app/dashboard/poros/components/home/SmartGreeting';
import QuickAccessCard from '@/app/dashboard/poros/components/home/QuickAccessCard';
import MobileAgendaCarousel from '@/app/dashboard/poros/components/home/MobileAgendaCarousel';
import MiniCalendarWidget from '@/app/dashboard/poros/components/home/MiniCalendarWidget';
import PersonalPerformanceWidget from '@/app/dashboard/poros/components/home/PersonalPerformanceWidget';
import { NkCard } from '@/app/dashboard/poros/components/NkCard';

// --- IMPORT HOOKS SSOT ---
import { useMasterData } from '@/app/dashboard/poros/hooks/useMasterData';
import { useAgendaData } from '@/app/dashboard/poros/hooks/useAgendaData';
import { useJadwalActions } from '@/app/dashboard/poros/hooks/useJadwalActions'; 

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};

const AgendaItem = ({ surat }: { surat: EnrichedSuratAgenda }) => (
    <motion.div variants={itemVariants} whileHover={{ x: 2 }}>
        <Link href={`/dashboard/surat/${surat.id}`} className="block p-3 bg-muted/50 rounded-none border border-border interactive-card transition-all duration-200 h-full">
            <div className="flex items-start justify-between">
                <p className="font-semibold text-foreground flex-1 pr-4 line-clamp-2">{surat.perihal}</p>
                <div className="text-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 rounded-none px-2 py-1 flex-shrink-0">
                    <div className="text-xs">{surat.detailAgenda?.tanggal?.toDate().toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                    <div className="font-bold text-base">{surat.detailAgenda?.jam}</div>
                </div>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground font-medium">
                <User size={12} className="text-primary" />
                <span className="truncate">{surat.pengirim}</span>
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground border-t border-border/50 pt-2">
                <div className="flex items-center gap-1"><MapPin size={14}/> <strong>Lokasi:</strong>&nbsp;{surat.detailAgenda?.lokasi}</div>
                {surat.disposisiStatus === 'Sudah Didisposisi' ? (
                <div className="flex items-start text-blue-600 dark:text-blue-400 gap-1">
                    <Send size={14} className="mt-0.5 flex-shrink-0" />
                    <div className="line-clamp-2"><strong>Kepada:</strong>&nbsp;{surat.penerimaDisposisi}</div>
                </div>
                ) : (
                <div className="flex items-center text-yellow-600 dark:text-yellow-400 gap-1">
                    <Info size={14} />
                    <strong>Status:</strong>&nbsp;{surat.penerimaDisposisi}
                </div>
                )}
            </div>
        </Link>
    </motion.div>
);

const AgendaTable = ({ agendas }: { agendas: EnrichedSuratAgenda[] }) => (
    <div className="overflow-x-auto pb-4">
        <div className="nk-table-wrapper">
            <table className="nk-table">
                <thead>
                    <tr>
                        <th>Waktu</th>
                        <th>Perihal & Pengirim</th>
                        <th>Lokasi</th>
                        <th>Disposisi Kepada</th>
                    </tr>
                </thead>
                <tbody>
                {agendas.map(surat => (
                    <tr key={surat.id} className="group">
                        <td className="w-32">
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">{surat.detailAgenda?.tanggal?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                <span className="text-xs font-bold text-[var(--nk-teal-mid)] mt-0.5">{surat.detailAgenda?.jam}</span>
                            </div>
                        </td>
                        <td>
                            <Link href={`/dashboard/surat/${surat.id}`} className="text-foreground hover:text-[var(--nk-teal-mid)] font-medium text-sm line-clamp-2 block mb-1">
                                {surat.perihal}
                            </Link>
                            <p className="text-[11px] text-muted-foreground">No: {surat.nomorSurat}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                                <span className="p-1 rounded-full bg-primary/10 text-[var(--nk-teal-mid)]"><User size={10} /></span>
                                {surat.pengirim}
                            </p>
                        </td>
                        <td className="text-sm text-muted-foreground">{surat.detailAgenda?.lokasi}</td>
                        <td className="text-sm">
                            {surat.disposisiStatus === 'Sudah Didisposisi' ? (
                                <span className="text-foreground font-medium line-clamp-2">{surat.penerimaDisposisi}</span>
                            ) : (
                                <span className="text-[var(--nk-gold)] font-medium flex items-center gap-1.5 text-xs">
                                    <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--nk-gold)] opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--nk-gold)]"></span></span> Belum Didisposikan
                                </span>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
            </table>
        </div>
    </div>
);

const AgendaInternalTable = ({ agendas, onRowClick }: { agendas: JadwalTempat[], onRowClick: (jadwal: JadwalTempat) => void }) => (
  <div className="overflow-x-auto pb-4">
    <div className="nk-table-wrapper">
        <table className="nk-table">
          <thead>
            <tr>
                <th>Tanggal & Jam</th>
                <th>Kegiatan</th>
                <th>Lokasi / Tautan</th>
                <th>Status</th>
            </tr>
          </thead>
          <tbody>
        {agendas.map(jadwal => (
          <tr key={jadwal.id} onClick={() => onRowClick(jadwal)} className="cursor-pointer group">
            <td className="w-40">
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">{jadwal.tanggalMulai?.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                    <span className="font-bold text-xs text-[var(--nk-teal-mid)] mt-0.5">{jadwal.jamMulai} - {jadwal.jamSelesai}</span>
                </div>
            </td>
            <td className="font-medium text-sm text-foreground">{jadwal.kegiatan}</td>
            <td className="text-sm">
                {jadwal.jenis === 'Virtual' && jadwal.tautanRapat ? (
                    <a href={jadwal.tautanRapat} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center text-[var(--nk-teal-mid)] hover:underline font-medium">
                        <ExternalLink size={14} className="mr-1.5"/> Link Rapat
                    </a>
                ) : (
                    <span className="flex items-center text-muted-foreground"><MapPin size={14} className="mr-1.5"/> {jadwal.namaTempat}</span>
                )}
            </td>
            <td>
                {jadwal.status !== 'Disetujui' && (
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider shadow-sm ${jadwal.status === 'Menunggu Persetujuan' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
                        {jadwal.status}
                    </span>
                )}
            </td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  </div>
);

// --- Main Component ---
export default function DashboardPage() {
  const { userProfile, loading: authLoading } = useUserAuth();
  
  const [currentDay] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() - 3); // Pergantian hari (Hari Ini) di jam 3 pagi lokal
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const todayFormatted = new Date(currentDay + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });

  // --- 1. DATA FETCHING VIA HOOKS (SSOT) ---
  // Ditambahkan jabatanMap & getUserNameByJabatanId untuk memindai nama Pimpinan
  const { isLoading: isMasterLoading, jabatanMap, getUserNameByJabatanId } = useMasterData(true); 
  const { agendaUndangan, jadwalInternalList, isLoading: isAgendaLoading, refetch } = useAgendaData(); 
  const { handleApprove, handleReject, handleDelete } = useJadwalActions(); 

  // --- LOGIKA PENCARIAN OTOMATIS NAMA PIMPINAN ---
  const resolvePenerimaName = useCallback((surat: EnrichedSuratAgenda) => {
      // 1. Jika nama penerima dari Detail Surat / Normal Disposisi sudah ada
      if (surat.penerimaDisposisi !== 'Belum Didisposikan') {
          return surat.penerimaDisposisi;
      }
      
      // 2. Jika "Belum Didisposikan" TAPI suratnya berstatus "Selesai/Didisposisi" (Self-Action Ruang Kerja)
      if (surat.disposisiStatus === 'Sudah Didisposisi') {
          if (surat.terlibatJabatanIds && surat.terlibatJabatanIds.length > 0) {
              let highestRankName = '';
              let lowestLevel = 999;

              // Pindai data jabatan tertinggi yang menyentuh surat ini
              surat.terlibatJabatanIds.forEach(jabatanId => {
                  const jabatan = jabatanMap.get(jabatanId);
                  if (jabatan && typeof jabatan.level === 'number' && jabatan.level < lowestLevel) {
                      lowestLevel = jabatan.level;
                      const userName = getUserNameByJabatanId(jabatanId);
                      if (userName && userName !== 'N/A') {
                          highestRankName = userName;
                      }
                  }
              });

              if (highestRankName) return highestRankName;
          }
          return 'Ditindaklanjuti Sendiri';
      }
      
      return 'Belum Didisposikan';
  }, [jabatanMap, getUserNameByJabatanId]);


  // --- COMPUTED DATA (AGENDA) ---
  const { todayAgendas, upcomingAgendas } = useMemo(() => {
    if (!agendaUndangan) return { todayAgendas: [], upcomingAgendas: [] };
    
    // Peta dan suntikkan nama yang telah divalidasi ke dalam properti
    const enrichedAgendas = (agendaUndangan as EnrichedSuratAgenda[]).map(agenda => ({
        ...agenda,
        penerimaDisposisi: resolvePenerimaName(agenda)
    }));
    
    const today = new Date(currentDay + 'T00:00:00');
    today.setHours(0, 0, 0, 0); 

    const todayItems = enrichedAgendas.filter(agenda => {
        if (!agenda.detailAgenda?.tanggal) return false;
        const agendaDate = agenda.detailAgenda.tanggal.toDate(); 
        agendaDate.setHours(0, 0, 0, 0);
        return agendaDate.getTime() === today.getTime();
    });
    
    const upcomingItems = enrichedAgendas.filter(agenda => {
         if (!agenda.detailAgenda?.tanggal) return false;
        const agendaDate = agenda.detailAgenda.tanggal.toDate();
        agendaDate.setHours(0, 0, 0, 0);
        return agendaDate.getTime() > today.getTime();
    });

    // Sort
    todayItems.sort((a, b) => (a.detailAgenda?.jam || '').localeCompare(b.detailAgenda?.jam || ''));
    upcomingItems.sort((a, b) => {
        const dateA = a.detailAgenda?.tanggal.toMillis() || 0;
        const dateB = b.detailAgenda?.tanggal.toMillis() || 0;
        if (dateA !== dateB) return dateA - dateB;
        return (a.detailAgenda?.jam || '').localeCompare(b.detailAgenda?.jam || '');
    });

    return { todayAgendas: todayItems, upcomingAgendas: upcomingItems };
  }, [agendaUndangan, currentDay, resolvePenerimaName]);

  const agendaInternalBulanIni = useMemo(() => {
      return [...jadwalInternalList].sort((a, b) => {
        const dateA = a.tanggalMulai.toMillis();
        const dateB = b.tanggalMulai.toMillis();
        if (dateA !== dateB) return dateA - dateB;
        return a.jamMulai.localeCompare(b.jamMulai);
      });
  }, [jadwalInternalList]);
  
  const groupedUpcomingAgendas = useMemo(() => {
    return upcomingAgendas.reduce((acc, agenda) => {
        if (!agenda.detailAgenda?.tanggal?.toDate) return acc;
        const dateStr = agenda.detailAgenda.tanggal.toDate().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(agenda);
        return acc;
    }, {} as Record<string, typeof upcomingAgendas>);
  }, [upcomingAgendas]);

  const combinedTodayAgenda = useMemo(() => {
      const today = new Date(currentDay + 'T00:00:00');
      today.setHours(0, 0, 0, 0);
      const todayTime = today.getTime();
      const agendas: CombinedAgendaItem[] = [];

      jadwalInternalList.forEach(jadwal => {
          const jadwalDate = jadwal.tanggalMulai.toDate();
          jadwalDate.setHours(0, 0, 0, 0);
          if (jadwalDate.getTime() === todayTime) {
              agendas.push({
                  id: jadwal.id!, type: 'internal', item: jadwal,
                  time: jadwal.jamMulai, title: jadwal.kegiatan,
                  location: jadwal.jenis === 'Virtual' ? (jadwal.tautanRapat || 'Rapat Virtual') : jadwal.namaTempat
              });
          }
      });

      todayAgendas.forEach(surat => {
           agendas.push({
              id: surat.id!, type: 'surat', item: surat,
              time: surat.detailAgenda!.jam, title: surat.perihal,
              location: surat.detailAgenda!.lokasi,
              penerimaDisposisi: surat.penerimaDisposisi, // Sudah diproses dinamis
              disposisiStatus: surat.disposisiStatus
          });
      });

      return agendas.sort((a, b) => a.time.localeCompare(b.time));
  }, [todayAgendas, jadwalInternalList, currentDay]);

  const combinedAllAgendas = useMemo(() => {
      const agendas: CombinedAgendaItem[] = [];

      jadwalInternalList.forEach(jadwal => {
          agendas.push({
              id: jadwal.id!, type: 'internal', item: jadwal,
              time: jadwal.jamMulai, title: jadwal.kegiatan,
              location: jadwal.jenis === 'Virtual' ? (jadwal.tautanRapat || 'Rapat Virtual') : jadwal.namaTempat
          });
      });

      [...todayAgendas, ...upcomingAgendas].forEach(surat => {
           agendas.push({
              id: surat.id!, type: 'surat', item: surat,
              time: surat.detailAgenda!.jam, title: surat.perihal,
              location: surat.detailAgenda!.lokasi,
              penerimaDisposisi: surat.penerimaDisposisi,
              disposisiStatus: surat.disposisiStatus
          });
      });

      return agendas;
  }, [jadwalInternalList, todayAgendas, upcomingAgendas]);

  // --- State UI Lokal ---
  const [agendaFilter, setAgendaFilter] = useState<'hariIni' | 'akanDatang'>('hariIni');
  const [agendaInternalView, setAgendaInternalView] = useState<'table' | 'card'>('card');
  const [agendaUndanganView, setAgendaUndanganView] = useState<'table' | 'card'>('table');
  
  const [selectedJadwal, setSelectedJadwal] = useState<JadwalTempat | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Ref untuk export
  const agendaRef = useRef<HTMLDivElement>(null);
  const isAdminOrTU = useMemo(() => userProfile?.role === 'admin_opd' || userProfile?.role === 'staf_tu', [userProfile]);

  const isLoading = authLoading || isMasterLoading || isAgendaLoading;

  const handleExportAgenda = useCallback(() => {
    if (agendaRef.current) {
        toPng(agendaRef.current, { cacheBust: true, backgroundColor: '#ffffff' })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = 'agenda.png';
                link.href = dataUrl;
                link.click();
            })
            .catch(err => console.error('Failed to export agenda', err));
    }
  }, []);

  const quickAccessLinks = [
    { href: '/dashboard/ruang-kerja', label: 'Ruang Kerja', icon: Briefcase, colorClass: 'text-cyan-600' },
    { href: '/dashboard/tugas', label: 'Tugas Saya', icon: ClipboardCheck, colorClass: 'text-green-600' },
    { href: '/dashboard/notulensi', label: 'Notulensi', icon: ListChecks, colorClass: 'text-purple-600' },
    { href: '/dashboard/dokumen', label: 'Repository', icon: FolderArchive, colorClass: 'text-yellow-600' },
    { href: '/dashboard/logbook', label: 'Logbook', icon: BookOpen, colorClass: 'text-orange-600' },
    { href: '/dashboard/pengumuman', label: 'Pengumuman', icon: Megaphone, colorClass: 'text-red-600' },
    { href: '/dashboard/jadwal', label: 'Jadwal Internal', icon: Calendar, colorClass: 'text-blue-600' },
    { href: '/dashboard/bukti-kinerja', label: 'Bukti E-Kinerja', icon: FileText, colorClass: 'text-pink-600' },
    { href: '/dashboard/arsip', label: 'Arsip Surat', icon: Archive, colorClass: 'text-gray-600' },
  ];
  
  if (isLoading) return <RuangKerjaSkeleton />;

  return (
    <div className="flex flex-col h-full p-4 md:p-6 bg-background">

      {/* --- Layout Utama (Desktop Grid System) --- */}
      <div className="hidden md:block space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
             
             {/* --- KOLOM KIRI (MAIN CONTENT - AGENDA) Span 9 --- */}
             <motion.div 
                 initial={{ opacity: 0, y: 20 }} 
                 whileInView={{ opacity: 1, y: 0 }} 
                 viewport={{ once: true }} 
                 transition={{ duration: 0.5 }}
                 className="lg:col-span-9 space-y-6"
             >
                
                {/* CARD 1: Agenda Undangan OPD */}
                <NkCard ref={agendaRef} className="flex flex-col h-fit bg-card">
                    <div className="p-4 border-b border-border/50 flex justify-between items-center bg-gradient-to-r from-[var(--nk-teal-mid)]/10 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--nk-teal-mid)]/10 rounded-xl">
                                <CalendarClock className="w-5 h-5 text-[var(--nk-teal-mid)]"/>
                            </div>
                            <h2 className="text-lg font-bold font-heading text-foreground">Agenda Undangan OPD</h2>
                        </div>
                        <div className="flex items-center space-x-2 w-full md:w-auto">
                            <div className="flex items-center bg-muted rounded-lg p-1 flex-grow md:flex-grow-0 relative">
                                <button onClick={() => setAgendaFilter('hariIni')} className={`relative px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${agendaFilter === 'hariIni' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <span className="relative z-10">Hari Ini</span>
                                    {agendaFilter === 'hariIni' && <motion.div layoutId="agenda-filter-bg" className="absolute inset-0 bg-background shadow rounded-md z-0" />}
                                </button>
                                <button onClick={() => setAgendaFilter('akanDatang')} className={`relative px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${agendaFilter === 'akanDatang' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                                    <span className="relative z-10">Akan Datang</span>
                                    {agendaFilter === 'akanDatang' && <motion.div layoutId="agenda-filter-bg" className="absolute inset-0 bg-background shadow rounded-md z-0" />}
                                </button>
                            </div>
                            <div className="flex items-center bg-muted rounded-lg p-1 relative">
                                <button onClick={() => setAgendaUndanganView('table')} className={`p-1.5 rounded ${agendaUndanganView === 'table' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`} title="Tampilan Tabel"><List size={16} /></button>
                                <button onClick={() => setAgendaUndanganView('card')} className={`p-1.5 rounded ${agendaUndanganView === 'card' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`} title="Tampilan Kartu"><LayoutGrid size={16} /></button>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExportAgenda} className="h-8 text-xs"><Download size={14} className="mr-1"/> Export</Button>
                        </div>
                    </div>
                    <AnimatePresence mode="wait">
                    <motion.div 
                        key={agendaFilter}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="p-0"
                    >
                        {agendaFilter === 'hariIni' && (todayAgendas.length > 0 ?
                            (agendaUndanganView === 'card' ?
                                <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-1 lg:grid-cols-2 gap-3 p-4">{todayAgendas.map(surat => <AgendaItem key={surat.id} surat={surat} />)}</motion.div>
                                : <AgendaTable agendas={todayAgendas} />
                            )
                            : (
                                <div className="text-center py-16 flex flex-col items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-[var(--nk-gradient-start)]/5 to-[var(--nk-gradient-end)]/5 flex items-center justify-center border border-[var(--nk-gradient-start)]/10 shadow-inner relative">
                                        <div className="absolute inset-0 bg-[var(--nk-gradient-start)]/5 blur-xl rounded-full"></div>
                                        <Calendar size={48} className="text-[var(--nk-gradient-start)]/40 relative z-10" />
                                    </div>
                                    <p className="font-heading font-semibold text-foreground/70 text-lg">Kosong</p>
                                    <p className="text-sm text-muted-foreground mt-1">Tidak ada agenda undangan untuk hari ini</p>
                                </div>
                            )
                        )}
                        {agendaFilter === 'akanDatang' && (Object.keys(groupedUpcomingAgendas).length > 0 ?
                            (agendaUndanganView === 'card' ?
                                <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.05 } } }} className="space-y-6 p-4">{Object.entries(groupedUpcomingAgendas).map(([date, agendasOnDate]) => (<div key={date}><h3 className="text-sm font-bold text-muted-foreground border-b border-border pb-2 mb-3 uppercase tracking-wider">{date}</h3><div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{agendasOnDate.map(surat => <AgendaItem key={surat.id} surat={surat} />)}</div></div>))}</motion.div>
                                : <AgendaTable agendas={upcomingAgendas} />
                            )
                            : (
                                <div className="text-center py-16 flex flex-col items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                                    <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-[var(--nk-gradient-start)]/5 to-[var(--nk-gradient-end)]/5 flex items-center justify-center border border-[var(--nk-gradient-start)]/10 shadow-inner relative">
                                        <div className="absolute inset-0 bg-[var(--nk-gradient-start)]/5 blur-xl rounded-full"></div>
                                        <CalendarClock size={48} className="text-[var(--nk-gradient-start)]/40 relative z-10" />
                                    </div>
                                    <p className="font-heading font-semibold text-foreground/70 text-lg">Kosong</p>
                                    <p className="text-sm text-muted-foreground mt-1">Tidak ada agenda undangan untuk waktu mendatang</p>
                                </div>
                            )
                        )}
                    </motion.div>
                    </AnimatePresence>
                </NkCard>

                {/* ROW: Agenda Internal & Kinerja Saya */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                  <div className="lg:col-span-2">
                    {/* CARD 2: Agenda Internal Bulan Ini */}
                    <div className="nk-card flex flex-col h-full">
                    <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-[var(--nk-teal-mid)]/10 to-transparent gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[var(--nk-teal-mid)]/10 rounded-xl">
                                <CalendarDays className="w-5 h-5 text-[var(--nk-teal-mid)]"/>
                            </div>
                            <h3 className="text-lg font-bold font-heading text-foreground">Agenda Internal Bulan Ini</h3>
                        </div>
                        <div className="flex bg-muted rounded-lg p-1">
                            <button onClick={() => setAgendaInternalView('table')} className={`p-1.5 rounded ${agendaInternalView === 'table' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}><List size={14}/></button>
                            <button onClick={() => setAgendaInternalView('card')} className={`p-1.5 rounded ${agendaInternalView === 'card' ? 'bg-background shadow text-primary' : 'text-muted-foreground'}`}><LayoutGrid size={14}/></button>
                        </div>
                    </div>
                    <div className="p-0 flex-1">
                        {agendaInternalBulanIni.length === 0 ? (
                            <div className="text-center py-16 flex flex-col items-center justify-center opacity-80 hover:opacity-100 transition-opacity">
                                <div className="w-24 h-24 mb-4 rounded-full bg-gradient-to-br from-[var(--nk-gradient-start)]/5 to-[var(--nk-gradient-end)]/5 flex items-center justify-center border border-[var(--nk-gradient-start)]/10 shadow-inner relative">
                                    <div className="absolute inset-0 bg-[var(--nk-gradient-start)]/5 blur-xl rounded-full"></div>
                                    <CalendarDays size={48} className="text-[var(--nk-gradient-start)]/40 relative z-10" />
                                </div>
                                <p className="font-heading font-semibold text-foreground/70 text-lg">Kosong</p>
                                <p className="text-sm text-muted-foreground mt-1">Tidak ada agenda internal bulan ini</p>
                            </div>
                        ) : 
                           agendaInternalView === 'table' ? (
                               <AgendaInternalTable agendas={agendaInternalBulanIni} onRowClick={(jadwal) => { setSelectedJadwal(jadwal); setIsDetailModalOpen(true); }} />
                           ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4"> 
                                {agendaInternalBulanIni.map(jadwal => (
                                    <div key={jadwal.id} onClick={() => { setSelectedJadwal(jadwal); setIsDetailModalOpen(true); }} className="p-4 bg-card rounded-xl border border-border/50 hover:border-[var(--nk-gradient-start)]/30 hover:shadow-[0_4px_20px_rgba(17,94,89,0.08)] cursor-pointer transition-all">
                                        <p className="font-semibold text-foreground text-sm line-clamp-2">{jadwal.kegiatan}</p>
                                        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                                            <p className="flex items-center"><CalendarDays size={12} className="mr-2 text-[var(--nk-gradient-start)]"/> {jadwal.tanggalMulai?.toDate ? jadwal.tanggalMulai.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) : 'N/A'}</p>
                                            <p className="flex items-center"><Clock size={12} className="mr-2 text-[var(--nk-gradient-start)]"/> {jadwal.jamMulai} - {jadwal.jamSelesai}</p>
                                            <p className="flex items-center"><MapPin size={12} className="mr-2 text-[var(--nk-gradient-start)]"/> {jadwal.jenis === 'Virtual' ? 'Virtual' : jadwal.namaTempat}</p>
                                        </div>
                                        {jadwal.status !== 'Disetujui' && (
                                            <span className={`mt-3 inline-block px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                                                jadwal.status === 'Menunggu Persetujuan' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                            }`}>{jadwal.status}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                  </div>

                  <div className="lg:col-span-1 h-full">
                      {/* [PERSONAL PERFORMANCE] */}
                      <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.2 }}
                          className="h-full"
                      >
                          <PersonalPerformanceWidget />
                      </motion.div>
                  </div>
                </div>

             </motion.div>

            {/* --- KOLOM KANAN (SIDEBAR WIDGET) Span 3 --- */}
            <div className='lg:col-span-3 space-y-6'>
                {/* [QUICK ACCESS] Grid 3x3 untuk menu pintasan */}
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.04 } }
                    }}
                    className="grid grid-cols-3 gap-3"
                >
                    {quickAccessLinks.map((link, index) => (
                        <motion.div key={link.href} variants={{
                            hidden: { opacity: 0, scale: 0.95 },
                            visible: { opacity: 1, scale: 1 }
                        }}>
                            <QuickAccessCard href={link.href} label={link.label} icon={link.icon} colorClass={link.colorClass} />
                        </motion.div>
                    ))}
                </motion.div>

                {/* [MINI KALENDER] */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 }}
                >
                    <MiniCalendarWidget agendas={combinedAllAgendas} />
                </motion.div>

            </div>
        </div>

      </div>

      {/* --- Mobile Layout --- */}
      <MobileAgendaCarousel 
          combinedTodayAgenda={combinedTodayAgenda} 
          todayFormatted={todayFormatted} 
      />

      {/* Mobile Quick Links */}
      <div className="md:hidden px-4 grid grid-cols-3 gap-3 mt-6">
         {quickAccessLinks.map((link) => <QuickAccessCard key={link.href} {...link} />)}
      </div>

      {/* Mobile Personal Performance */}
      <div className="md:hidden px-4 mt-6">
         <PersonalPerformanceWidget />
      </div>

      {/* Mobile Mini Kalender */}
      <div className="md:hidden px-4 mt-6 mb-4">
         <MiniCalendarWidget agendas={combinedAllAgendas} />
      </div>

       {/* Modal Global */}
       <JadwalDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            jadwal={selectedJadwal}
            isAdmin={isAdminOrTU} 
            onApprove={(id) => handleApprove(id, () => { setIsDetailModalOpen(false); refetch(); })} 
            onReject={(id, reason) => handleReject(id, reason, () => { setIsDetailModalOpen(false); refetch(); })}
            onEdit={() => {}}
            onDelete={(id) => handleDelete(id, () => { setIsDetailModalOpen(false); refetch(); })}
        />
    </div>
  );
}
