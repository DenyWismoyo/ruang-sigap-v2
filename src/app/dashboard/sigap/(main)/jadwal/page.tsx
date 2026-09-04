// Lokasi: src/app/dashboard/jadwal/page.tsx
// [MODIFIKASI EFISIENSI (Fase 3)]
// - Mengganti `onSnapshot` (real-time) dengan `getDocs` (sekali ambil).
// - Data sekarang dimuat menggunakan `fetchData` (useCallback).
// - Fungsi `onSuccess` (dari modal), `handleApprove`, `handleReject`, dan `handleDelete`
//   sekarang memanggil `fetchData()` secara manual untuk me-refresh data.
// [MODIFIKASI SHADCN UI]
// - Mengganti <button> dengan <Button> shadcn.
// - Mengganti <div> untuk panel "Menunggu Persetujuan" dan "Agenda" dengan <Card>.
// - Menggunakan <ScrollArea> untuk daftar agenda.
// - [PENYEMPURNAAN] Menggunakan 'border-border' untuk kalender.
// [PERBAIKAN DARK MODE v6 & MOBILE FIRST REFINEMENT]
// - Mobile Segmented Switcher (Daftar Agenda vs Kalender Interaktif).
// - Mobile Compact Header Actions.
// - Dot indicator badges pada kalender ponsel & Safe bottom padding.

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, Timestamp, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { JadwalTempat } from '@/types';
import { Plus, ChevronLeft, ChevronRight, AlertTriangle, CalendarDays, Clock, MapPin, ExternalLink, Users, List, LayoutGrid, Sparkles, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import JadwalFormModal from './components/JadwalFormModal';
import JadwalDetailModal from './components/JadwalDetailModal';
import ManageRuanganModal from './components/ManageRuanganModal';
import ScanSuratInternalModal from './components/ScanSuratInternalModal';
import SigapPageHeader from '@/app/dashboard/sigap/components/SigapPageHeader';

// --- Impor Komponen Shadcn ---
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
// --- Akhir Impor Shadcn ---

export default function JadwalInternalPage() {
    const { userProfile } = useUserAuth();
    const [jadwalList, setJadwalList] = useState<JadwalTempat[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isManageRuanganModalOpen, setIsManageRuanganModalOpen] = useState(false);
    const [isScanSuratInternalOpen, setIsScanSuratInternalOpen] = useState(false);

    const [jadwalToEdit, setJadwalToEdit] = useState<JadwalTempat | null>(null);
    const [selectedJadwal, setSelectedJadwal] = useState<JadwalTempat | null>(null);
    const [selectedDateForForm, setSelectedDateForForm] = useState(new Date());

    // Mobile View State
    const [mobileTab, setMobileTab] = useState<'agenda' | 'kalender'>('agenda');
    const [selectedMobileDate, setSelectedMobileDate] = useState<Date>(new Date());

    const [loading, setLoading] = useState(true);
    const [agendaInternalView, setAgendaInternalView] = useState<'table' | 'card'>('card');

    const isAdmin = useMemo(() => {
        if (!userProfile) return false;
        return (
            userProfile.role === 'admin_opd' ||
            userProfile.role === 'staf_tu' ||
            userProfile.role === 'super_admin' ||
            Boolean(userProfile.additionalRoles?.includes('operator_surat'))
        );
    }, [userProfile]);

    const fetchData = useCallback(async () => {
        if (!userProfile?.opdId) return;
        setLoading(true);
        try {
            const q = query(collection(db, "jadwalTempat"), where("opdId", "==", userProfile.opdId));
            const snapshot = await getDocs(q); 
            const jadwal = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JadwalTempat));
            setJadwalList(jadwal);
        } catch (err) {
            console.error("Error fetching schedule:", err);
        } finally {
            setLoading(false);
        }
    }, [userProfile]);

    useEffect(() => {
        fetchData(); 
    }, [fetchData]);

    const handleOpenFormModal = (date: Date, jadwal?: JadwalTempat) => {
        setSelectedDateForForm(date);
        setJadwalToEdit(jadwal || null);
        setIsFormModalOpen(true);
    };

    const handleOpenDetailModal = (jadwal: JadwalTempat) => {
        setSelectedJadwal(jadwal);
        setIsDetailModalOpen(true);
    };

    const handleApprove = async (id: string) => {
        await updateDoc(doc(db, 'jadwalTempat', id), { status: 'Disetujui', ditinjauOleh: userProfile?.uid, tanggalDitinjau: Timestamp.now() });
        setIsDetailModalOpen(false);
        fetchData(); 
    };

    const handleReject = async (id: string, alasan: string) => {
        await updateDoc(doc(db, 'jadwalTempat', id), { status: 'Ditolak', alasanDitolak: alasan, ditinjauOleh: userProfile?.uid, tanggalDitinjau: Timestamp.now() });
        setIsDetailModalOpen(false);
        fetchData(); 
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Yakin ingin membatalkan dan menghapus jadwal ini?")) {
            await deleteDoc(doc(db, 'jadwalTempat', id));
            setIsDetailModalOpen(false);
            fetchData(); 
        }
    };

    const daysInMonth = useMemo(() => {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const days = [];
        while (date.getMonth() === currentDate.getMonth()) {
            days.push(new Date(date));
            date.setDate(date.getDate() + 1);
        }
        return days;
    }, [currentDate]);

    const firstDayOfMonth = useMemo(() => {
        return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    }, [currentDate]);

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };

    const goToToday = () => {
        const now = new Date();
        setCurrentDate(now);
        setSelectedMobileDate(now);
    };

    const getJadwalForDate = useCallback((date: Date): JadwalTempat[] => {
        return jadwalList.filter(j => {
            if (!j.tanggalMulai?.toDate) return false;
            const jadwalDate = j.tanggalMulai.toDate();
            return jadwalDate.getFullYear() === date.getFullYear() &&
                   jadwalDate.getMonth() === date.getMonth() &&
                   jadwalDate.getDate() === date.getDate();
        }).sort((a,b) => a.jamMulai.localeCompare(b.jamMulai));
    }, [jadwalList]);

    const pendingApprovals = useMemo(() => jadwalList.filter(j => j.status === 'Menunggu Persetujuan'), [jadwalList]);

    const agendaBulanIni = useMemo(() => {
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        return jadwalList
            .filter(j => {
                if (!j.tanggalMulai?.toDate) return false;
                const jadwalDate = j.tanggalMulai.toDate();
                return jadwalDate.getMonth() === currentMonth && jadwalDate.getFullYear() === currentYear;
            })
            .sort((a, b) => {
                const dateA = a.tanggalMulai?.toDate ? a.tanggalMulai.toDate().getTime() : 0;
                const dateB = b.tanggalMulai?.toDate ? b.tanggalMulai.toDate().getTime() : 0;
                if (dateA !== dateB) return dateA - dateB;
                return a.jamMulai.localeCompare(b.jamMulai);
            });
    }, [jadwalList, currentDate]);

    const mobileSelectedDateJadwal = useMemo(() => {
        return getJadwalForDate(selectedMobileDate);
    }, [getJadwalForDate, selectedMobileDate]);

    return (
        <div className="sg-page pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
            <SigapPageHeader 
                title="Jadwal Internal"
                icon={CalendarDays}
                actions={
                    <>
                        {/* Desktop Actions */}
                        <div className="hidden sm:flex sm:flex-row gap-2">
                            {isAdmin && (
                                <Button onClick={() => setIsManageRuanganModalOpen(true)} variant="outline" className="sg-btn bg-background text-foreground hover:bg-accent/50 border-border/40">
                                    Kelola Ruangan
                                </Button>
                            )}
                            <Button onClick={() => setIsScanSuratInternalOpen(true)} className="sg-btn bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 border-0 shadow-sm">
                                <Sparkles size={16} className="mr-2" /> Scan Surat Internal
                            </Button>
                            <Button onClick={() => handleOpenFormModal(new Date())} className="sg-btn sg-btn-primary">
                                <Plus size={16} className="mr-2" /> Ajukan Jadwal Manual
                            </Button>
                        </div>

                        {/* Mobile Compact Actions */}
                        <div className="flex sm:hidden flex-col gap-2 w-full mt-2">
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    onClick={() => setIsScanSuratInternalOpen(true)} 
                                    size="sm"
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 h-9 shadow-sm"
                                >
                                    <Sparkles size={14} className="mr-1.5 flex-shrink-0" /> Scan Surat
                                </Button>
                                <Button 
                                    onClick={() => handleOpenFormModal(new Date())} 
                                    size="sm"
                                    className="w-full sg-btn-primary text-xs font-semibold py-2 h-9 shadow-sm"
                                >
                                    <Plus size={14} className="mr-1.5 flex-shrink-0" /> Ajukan Jadwal
                                </Button>
                            </div>
                            {isAdmin && (
                                <Button 
                                    onClick={() => setIsManageRuanganModalOpen(true)} 
                                    variant="outline" 
                                    size="sm"
                                    className="w-full text-xs h-8 bg-background border-border/60 hover:bg-accent/50"
                                >
                                    Kelola Ruangan
                                </Button>
                            )}
                        </div>
                    </>
                }
            />

            {isAdmin && pendingApprovals.length > 0 && (
                <Card className="sg-card sg-mobile-borderless mb-4 md:mb-6 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30">
                    <CardHeader className="pb-3 md:pb-4">
                        <CardTitle className="text-sm md:text-lg font-semibold text-yellow-800 dark:text-yellow-300 flex items-center">
                            <AlertTriangle size={18} className="mr-2 flex-shrink-0"/>
                            <span>Menunggu Persetujuan ({pendingApprovals.length})</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {pendingApprovals.map(jadwal => (
                             <Button
                                key={jadwal.id} 
                                onClick={() => handleOpenDetailModal(jadwal)} 
                                variant="secondary"
                                className="h-auto w-full justify-start text-left p-2.5"
                             >
                                <div className="flex flex-col min-w-0">
                                    <p className="font-bold text-xs md:text-sm truncate">{jadwal.kegiatan}</p>
                                    <p className="text-[11px] md:text-xs text-muted-foreground truncate">{jadwal.namaTempat}, {jadwal.tanggalMulai?.toDate ? jadwal.tanggalMulai.toDate().toLocaleDateString('id-ID', {day:'2-digit', month:'short'}) : ''} {jadwal.jamMulai}</p>
                                </div>
                             </Button>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ========================================================= */}
            {/* MOBILE ONLY: SEGMENTED SWITCHER (Daftar Agenda / Kalender) */}
            {/* ========================================================= */}
            <div className="block md:hidden mb-4">
                <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/40">
                    <button
                        type="button"
                        onClick={() => setMobileTab('agenda')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                            mobileTab === 'agenda' 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <List size={14} />
                        <span>Daftar Agenda</span>
                        {agendaBulanIni.length > 0 && (
                            <span className="ml-1 px-1.5 py-0.2 text-[10px] bg-primary/10 text-primary font-bold rounded-full">
                                {agendaBulanIni.length}
                            </span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setMobileTab('kalender')}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                            mobileTab === 'kalender' 
                                ? 'bg-background text-foreground shadow-sm' 
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <CalendarIcon size={14} />
                        <span>Kalender Interaktif</span>
                    </button>
                </div>

                {/* Mobile Tab 1: DAFTAR AGENDA */}
                {mobileTab === 'agenda' && (
                    <div className="mt-3 space-y-3">
                        {/* Month Selector Bar */}
                        <div className="flex items-center justify-between px-3 py-2 bg-card rounded-lg border border-border/40 shadow-sm">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeMonth(-1)}>
                                <ChevronLeft size={16} />
                            </Button>
                            <span className="text-xs font-bold text-foreground">
                                {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 font-medium" onClick={goToToday}>
                                    Hari Ini
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeMonth(1)}>
                                    <ChevronRight size={16} />
                                </Button>
                            </div>
                        </div>

                        {loading && (
                            <div className="py-8 text-center text-xs text-muted-foreground">
                                Memuat agenda...
                            </div>
                        )}

                        {!loading && agendaBulanIni.length === 0 && (
                            <div className="p-8 text-center bg-card rounded-xl border border-dashed border-border/60">
                                <CalendarDays className="w-10 h-10 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-xs font-semibold text-foreground">Tidak ada agenda di bulan ini</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Ketuk tombol di atas untuk mengajukan kegiatan baru.</p>
                                <Button 
                                    onClick={() => handleOpenFormModal(new Date())} 
                                    size="sm" 
                                    variant="outline" 
                                    className="mt-3 text-xs h-8"
                                >
                                    <Plus size={13} className="mr-1" /> Ajukan Jadwal
                                </Button>
                            </div>
                        )}

                        {!loading && agendaBulanIni.length > 0 && agendaBulanIni.map(jadwal => {
                            const isApproved = jadwal.status === 'Disetujui';
                            const isPending = jadwal.status === 'Menunggu Persetujuan';
                            const dateObj = jadwal.tanggalMulai?.toDate ? jadwal.tanggalMulai.toDate() : null;

                            return (
                                <div 
                                    key={jadwal.id} 
                                    onClick={() => handleOpenDetailModal(jadwal)}
                                    className="p-3.5 bg-card rounded-xl border border-border/50 shadow-sm active:scale-[0.99] transition-all"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-primary">
                                            <CalendarDays size={13} className="flex-shrink-0" />
                                            <span>
                                                {dateObj ? dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }) : 'N/A'}
                                            </span>
                                            <span className="text-muted-foreground">•</span>
                                            <Clock size={13} className="flex-shrink-0" />
                                            <span>{jadwal.jamMulai} - {jadwal.jamSelesai}</span>
                                        </div>
                                        <Badge 
                                            variant="secondary"
                                            className={`text-[10px] px-2 py-0.5 font-medium ${
                                                isApproved ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                                                isPending ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' :
                                                'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                            }`}
                                        >
                                            {jadwal.status}
                                        </Badge>
                                    </div>

                                    <h4 className="text-sm font-bold text-foreground mt-2 leading-snug">
                                        {jadwal.kegiatan}
                                    </h4>

                                    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                        {jadwal.jenis === 'Virtual' && jadwal.tautanRapat ? (
                                            <a 
                                                href={jadwal.tautanRapat} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                onClick={(e) => e.stopPropagation()} 
                                                className="flex items-center text-blue-600 hover:underline"
                                            >
                                                <ExternalLink size={12} className="mr-1"/> Link Rapat Virtual
                                            </a>
                                        ) : (
                                            <span className="flex items-center">
                                                <MapPin size={12} className="mr-1 text-muted-foreground flex-shrink-0"/> 
                                                <span className="truncate max-w-[200px]">{jadwal.namaTempat}</span>
                                            </span>
                                        )}

                                        {jadwal.jumlahPersonil && (
                                            <span className="flex items-center">
                                                <Users size={12} className="mr-1 text-muted-foreground flex-shrink-0"/> 
                                                <span>{jadwal.jumlahPersonil} Personil</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Mobile Tab 2: KALENDER INTERAKTIF RINGKAS */}
                {mobileTab === 'kalender' && (
                    <div className="mt-3 space-y-3">
                        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden p-3">
                            {/* Month Nav */}
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/30">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeMonth(-1)}>
                                    <ChevronLeft size={16} />
                                </Button>
                                <span className="text-xs font-bold text-foreground">
                                    {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                </span>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2 font-medium" onClick={goToToday}>
                                        Hari Ini
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => changeMonth(1)}>
                                        <ChevronRight size={16} />
                                    </Button>
                                </div>
                            </div>

                            {/* Compact Grid */}
                            <div className="grid grid-cols-7 gap-1 text-center">
                                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                                    <div key={day} className="text-[10px] font-bold text-muted-foreground py-1">
                                        {day}
                                    </div>
                                ))}

                                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                    <div key={`empty-mob-${i}`} className="h-10"></div>
                                ))}

                                {daysInMonth.map(date => {
                                    const events = getJadwalForDate(date);
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    const isSelected = date.toDateString() === selectedMobileDate.toDateString();
                                    const hasApproved = events.some(e => e.status === 'Disetujui');
                                    const hasPending = events.some(e => e.status === 'Menunggu Persetujuan');

                                    return (
                                        <button
                                            key={date.toString()}
                                            type="button"
                                            onClick={() => setSelectedMobileDate(date)}
                                            className={`h-11 rounded-lg flex flex-col items-center justify-center relative transition-all ${
                                                isSelected 
                                                    ? 'bg-primary text-primary-foreground font-bold shadow-sm' 
                                                    : isToday 
                                                    ? 'border border-primary text-primary font-bold bg-primary/5' 
                                                    : 'hover:bg-accent/50 text-foreground font-medium'
                                            }`}
                                        >
                                            <span className="text-xs leading-none">{date.getDate()}</span>
                                            
                                            {/* Event indicator dots */}
                                            {events.length > 0 && (
                                                <div className="flex items-center gap-0.5 mt-1">
                                                    {hasApproved && (
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-blue-600 dark:bg-blue-400'}`} />
                                                    )}
                                                    {hasPending && (
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-yellow-200' : 'bg-amber-500 dark:bg-amber-400'}`} />
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Inspector Tanggal Terpilih */}
                        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-3.5">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/30">
                                <span className="text-xs font-bold text-foreground">
                                    Agenda {selectedMobileDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </span>
                                <Button 
                                    onClick={() => handleOpenFormModal(selectedMobileDate)} 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 text-[11px] px-2 text-primary font-semibold hover:bg-primary/10"
                                >
                                    <Plus size={13} className="mr-1" /> Tambah
                                </Button>
                            </div>

                            {mobileSelectedDateJadwal.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-3 text-center">
                                    Tidak ada kegiatan pada tanggal ini.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {mobileSelectedDateJadwal.map(jadwal => (
                                        <div 
                                            key={jadwal.id}
                                            onClick={() => handleOpenDetailModal(jadwal)}
                                            className="p-2.5 bg-background rounded-lg border border-border/40 shadow-xs cursor-pointer active:scale-[0.99] transition-all"
                                        >
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-xs font-bold text-primary">{jadwal.jamMulai} - {jadwal.jamSelesai}</span>
                                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-medium">
                                                    {jadwal.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs font-semibold text-foreground mt-1 line-clamp-1">{jadwal.kegiatan}</p>
                                            <p className="text-[11px] text-muted-foreground flex items-center mt-0.5">
                                                <MapPin size={11} className="mr-1 flex-shrink-0" /> {jadwal.namaTempat}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================= */}
            {/* DESKTOP VIEW: 7-COL CALENDAR GRID + AGENDA BULAN INI       */}
            {/* ========================================================= */}
            <div className="hidden md:block sg-section">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="sg-glass-panel lg:col-span-2 overflow-hidden flex flex-col p-0">
                        <div className="p-4 flex flex-row items-center justify-between border-b border-border/30">
                            <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}>
                                <ChevronLeft/>
                            </Button>
                            <h2 className="text-lg font-semibold text-foreground">{currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h2>
                            <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}>
                                <ChevronRight/>
                            </Button>
                        </div>
                        <div className="p-0">
                            <div className="grid grid-cols-7 border-t border-border/30 bg-card/30">
                                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                                    <div key={day} className="text-center font-bold text-xs py-2.5 border-b border-r border-border/30 text-muted-foreground uppercase tracking-wider">{day}</div>
                                ))}
                                {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="border-r border-b border-border/30 min-h-[8rem] bg-accent/5"></div>)}
                                {daysInMonth.map(date => {
                                    const jadwalForDate = getJadwalForDate(date);
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    return (
                                        <div key={date.toString()} className={`relative p-2 border-r border-b border-border/30 min-h-[8rem] overflow-hidden group hover:bg-accent/5 transition-colors`}>
                                            <div className={`absolute top-2 right-2 text-xs md:text-sm font-bold ${isToday ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shadow-sm' : 'text-muted-foreground'}`}>{date.getDate()}</div>
                                            {jadwalForDate.length === 0 && (
                                                <Button
                                                    onClick={() => handleOpenFormModal(date)}
                                                    variant="ghost"
                                                    className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                                                    title="Tambah jadwal di tanggal ini"
                                                >
                                                    <Plus size={24} />
                                                </Button>
                                            )}
                                            <div className="mt-6 space-y-1">
                                                {jadwalForDate.map(jadwal => (
                                                    <div
                                                        key={jadwal.id}
                                                        onClick={() => handleOpenDetailModal(jadwal)}
                                                        title={jadwal.kegiatan + (jadwal.jumlahPersonil ? ` (${jadwal.jumlahPersonil} org)` : '')}
                                                        className={`px-1.5 py-0.5 text-[10px] md:text-xs rounded cursor-pointer truncate font-medium ${
                                                            jadwal.status === 'Disetujui' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                                                            jadwal.status === 'Menunggu Persetujuan' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                                        }`}
                                                    >
                                                        <span className='font-bold'>{jadwal.jamMulai}</span> {jadwal.kegiatan} {jadwal.jumlahPersonil && <span className="font-normal opacity-75">({jadwal.jumlahPersonil} org)</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                                {Array.from({ length: (7 - (firstDayOfMonth + daysInMonth.length) % 7) % 7 }).map((_, i) => <div key={`empty-end-${i}`} className="border-r border-b border-border/30 min-h-[8rem] bg-accent/5"></div>)}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Right Side Panel: Agenda Bulan Ini */}
                    <div className="sg-glass-panel lg:col-span-1 flex flex-col p-0 overflow-hidden">
                        <div className="p-4 border-b border-border/30 flex items-center justify-between bg-card/30">
                            <div className="text-base font-semibold text-foreground flex items-center">
                                <CalendarDays size={18} className="mr-3 text-sg-blue" />
                                Agenda Bulan Ini
                            </div>
                            <div className="flex items-center bg-muted rounded-lg p-1">
                                <Button onClick={() => setAgendaInternalView('card')} variant={agendaInternalView === 'card' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded">
                                    <LayoutGrid size={16} />
                                </Button>
                                <Button onClick={() => setAgendaInternalView('table')} variant={agendaInternalView === 'table' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded">
                                    <List size={16} />
                                </Button>
                            </div>
                        </div>
                        <div className="p-0 flex-1 bg-card/30">
                            <ScrollArea className="h-[calc(100vh-280px)]">
                                <div className="p-4 space-y-3">
                                    {loading && <p className="text-center text-muted-foreground py-4">Memuat agenda...</p>}
                                    {!loading && agendaBulanIni.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">Tidak ada agenda internal bulan ini.</p>
                                    )}
                                    
                                    {!loading && agendaBulanIni.length > 0 && agendaInternalView === 'card' && agendaBulanIni.map(jadwal => (
                                        <div key={jadwal.id} onClick={() => handleOpenDetailModal(jadwal)} className="p-3 bg-background rounded-[var(--radius)] border border-border/40 hover:bg-accent/50 hover:shadow-sm cursor-pointer transition-all duration-200">
                                            <p className="font-semibold text-foreground text-sm line-clamp-2">{jadwal.kegiatan}</p>
                                            <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                                <p className="flex items-center"><CalendarDays size={12} className="mr-2"/> {jadwal.tanggalMulai?.toDate ? jadwal.tanggalMulai.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long' }) : 'N/A'}</p>
                                                <p className="flex items-center"><Clock size={12} className="mr-2"/> {jadwal.jamMulai} - {jadwal.jamSelesai}</p>
                                                {jadwal.jenis === 'Virtual' && jadwal.tautanRapat ? (
                                                    <a href={jadwal.tautanRapat} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center text-blue-600 hover:underline">
                                                        <ExternalLink size={12} className="mr-2"/> Link Rapat
                                                    </a>
                                                ) : (
                                                    <p className="flex items-center"><MapPin size={12} className="mr-2"/> {jadwal.namaTempat}</p>
                                                )}
                                                {jadwal.jumlahPersonil && (
                                                    <p className="flex items-center"><Users size={12} className="mr-2"/> {jadwal.jumlahPersonil} Personil</p>
                                                )}
                                            </div>
                                            {jadwal.status !== 'Disetujui' && (
                                                <span className={`mt-1 inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                                                    jadwal.status === 'Menunggu Persetujuan' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                                }`}>{jadwal.status}</span>
                                            )}
                                        </div>
                                    ))}
                                    
                                    {!loading && agendaBulanIni.length > 0 && agendaInternalView === 'table' && (
                                         <table className="w-full text-left text-sm">
                                            <tbody>
                                                {agendaBulanIni.map(jadwal => (
                                                    <tr key={jadwal.id} onClick={() => handleOpenDetailModal(jadwal)} className="border-b border-border hover:bg-muted cursor-pointer">
                                                        <td className="p-2 font-medium text-foreground whitespace-nowrap">
                                                            <div className="flex flex-col">
                                                              <span>{jadwal.tanggalMulai?.toDate().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                                                              <span className="font-bold text-xs">{jadwal.jamMulai}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-2">
                                                            <p className="font-semibold text-foreground line-clamp-2">{jadwal.kegiatan}</p>
                                                            <p className="text-xs text-muted-foreground">{jadwal.namaTempat}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
            </div>

            <JadwalFormModal 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSuccess={() => { setIsFormModalOpen(false); fetchData(); }} 
                jadwalToEdit={jadwalToEdit}
                selectedDate={selectedDateForForm}
            />
            <JadwalDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                jadwal={selectedJadwal}
                isAdmin={isAdmin}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={(j) => { setIsDetailModalOpen(false); handleOpenFormModal(j.tanggalMulai.toDate(), j); }}
                onDelete={handleDelete}
            />

            <ManageRuanganModal 
                isOpen={isManageRuanganModalOpen}
                onClose={() => setIsManageRuanganModalOpen(false)}
            />

            <ScanSuratInternalModal
                isOpen={isScanSuratInternalOpen}
                onClose={() => setIsScanSuratInternalOpen(false)}
                onSuccess={() => { setIsScanSuratInternalOpen(false); fetchData(); }}
            />
        </div>
    );
}