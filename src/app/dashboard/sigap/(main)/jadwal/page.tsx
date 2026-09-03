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
// [PERBAIKAN DARK MODE v6]
// - Mengganti semua kelas `dark:...` kustom dengan kelas semantik shadcn/ui.

"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, Timestamp, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { JadwalTempat } from '@/types';
import { Plus, ChevronLeft, ChevronRight, AlertTriangle, CalendarDays, Clock, MapPin, ExternalLink, Users, List, LayoutGrid, Sparkles } from 'lucide-react';
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

    const [loading, setLoading] = useState(true);
    const [agendaInternalView, setAgendaInternalView] = useState<'table' | 'card'>('card');

    const isAdmin = useMemo(() => userProfile?.role === 'admin_opd' || userProfile?.role === 'staf_tu', [userProfile]);

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
    }

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

    const getJadwalForDate = (date: Date): JadwalTempat[] => {
        return jadwalList.filter(j => {
            if (!j.tanggalMulai?.toDate) return false;
            const jadwalDate = j.tanggalMulai.toDate();
            return jadwalDate.getFullYear() === date.getFullYear() &&
                   jadwalDate.getMonth() === date.getMonth() &&
                   jadwalDate.getDate() === date.getDate();
        }).sort((a,b) => a.jamMulai.localeCompare(b.jamMulai));
    };

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

    return (
        <div className="sg-page">
            <SigapPageHeader 
                title="Jadwal Internal"
                icon={CalendarDays}
                actions={
                    <div className="flex flex-col sm:flex-row gap-2">
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
                }
            />

            {isAdmin && pendingApprovals.length > 0 && (
                <Card className="sg-card sg-mobile-borderless mb-0 md:mb-6 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/30">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 flex items-center">
                            <AlertTriangle size={18} className="mr-2"/>Menunggu Persetujuan ({pendingApprovals.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {pendingApprovals.map(jadwal => (
                             <Button
                                key={jadwal.id} 
                                onClick={() => handleOpenDetailModal(jadwal)} 
                                variant="secondary"
                                // [PERBAIKAN DARK MODE]
                                className="h-auto w-full justify-start text-left"
                             >
                                <div className="flex flex-col">
                                    <p className="font-bold truncate">{jadwal.kegiatan}</p>
                                    <p className="text-xs text-muted-foreground">{jadwal.namaTempat}, {jadwal.tanggalMulai?.toDate ? jadwal.tanggalMulai.toDate().toLocaleDateString('id-ID', {day:'2-digit', month:'short'}) : ''} {jadwal.jamMulai}</p>
                                </div>
                             </Button>
                        ))}
                    </CardContent>
                </Card>
            )}

            <div className="sg-section">
                <div className="flex flex-col md:grid md:grid-cols-1 lg:grid-cols-3 gap-0 md:gap-6">
                    <div className="sg-glass-panel sg-mobile-borderless lg:col-span-2 overflow-hidden flex flex-col p-0">
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
                        {/* [PERBAIKAN DARK MODE] */}
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

                    <div className="sg-glass-panel sg-mobile-borderless lg:col-span-1 flex flex-col p-0 overflow-hidden">
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
                                    // [PERBAIKAN DARK MODE]
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
                                                // [PERBAIKAN DARK MODE]
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