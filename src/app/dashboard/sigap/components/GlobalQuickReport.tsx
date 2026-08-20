"use client";

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MessageSquare, Maximize2, Minimize2, X, Plus, Save, Palette, ListTodo, Loader2, FileText, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuickReport } from '@/context/QuickReportContext';
import { getWarnaClass } from '@/app/dashboard/sigap/(main)/surat/[id]/components/TindakLanjutSection';

const PALETTE_COLORS = [
    { id: 'default', code: 'bg-white dark:bg-zinc-900 border-gray-300 dark:border-zinc-700' },
    { id: 'red', code: 'bg-red-200 dark:bg-red-900 border-red-300 dark:border-red-800' },
    { id: 'green', code: 'bg-emerald-200 dark:bg-emerald-900 border-emerald-300 dark:border-emerald-800' },
    { id: 'blue', code: 'bg-blue-200 dark:bg-blue-900 border-blue-300 dark:border-blue-800' },
    { id: 'yellow', code: 'bg-amber-200 dark:bg-amber-900 border-amber-300 dark:border-amber-800' },
    { id: 'purple', code: 'bg-purple-200 dark:bg-purple-900 border-purple-300 dark:border-purple-800' },
];

export default function GlobalQuickReport() {
    const {
        reports, activeReportId, isDrawerOpen, isActionProcessing,
        setActiveReportId, closeQuickReport, toggleDrawer,
        updateActiveReport, submitQuickReport
    } = useQuickReport();

    const [newChecklist, setNewChecklist] = React.useState('');
    const dragControls = useDragControls();

    if (reports.length === 0) return null;

    const activeReport = activeReportId ? reports.find(r => r.id === activeReportId) : null;
    const isMinimized = !activeReport && !isDrawerOpen;

    // RENDER: MINIMIZED (Single Chat Head Badge)
    if (isMinimized) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="fixed top-1/3 -translate-y-1/2 right-0 md:top-auto md:-translate-y-0 md:bottom-32 md:right-0 z-[60]"
                >
                    <div 
                        className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 hover:bg-blue-700 backdrop-blur-xl border-l border-y border-white/20 rounded-l-full flex items-center justify-center cursor-pointer shadow-xl relative group transition-all duration-300 hover:pr-2"
                        onClick={toggleDrawer}
                    >
                        <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        <div className="absolute top-1 md:top-2 right-1 md:right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                            {reports.length}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // RENDER: DRAWER MENU (List of active drafts)
    if (isDrawerOpen && !activeReport) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    className="fixed top-24 right-4 md:right-8 z-[60] w-72 md:w-80 bg-card border border-border shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[70vh]"
                >
                    <div className="p-3 bg-muted/50 border-b border-border flex justify-between items-center">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <FileText size={16} className="text-blue-500" /> Draf Laporan Aktif
                        </h3>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={toggleDrawer}>
                            <X size={14} />
                        </Button>
                    </div>
                    <div className="overflow-y-auto custom-scrollbar p-2 flex flex-col gap-2">
                        {reports.map((report) => (
                            <div key={report.id} className={`p-3 rounded-lg border border-border cursor-pointer transition-colors hover:border-primary/50 relative group ${getWarnaClass(report.warna)}`} onClick={() => setActiveReportId(report.id)}>
                                <p className="text-xs font-bold truncate pr-6">{report.judul || 'Draf Tanpa Judul'}</p>
                                <p className="text-[10px] text-muted-foreground truncate mt-1">{report.surat.perihal}</p>
                                
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-500/10"
                                    onClick={(e) => { e.stopPropagation(); closeQuickReport(report.id); }}
                                    title="Hapus Draf"
                                >
                                    <Trash2 size={12} />
                                </Button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // RENDER: ACTIVE REPORT (Notepad)
    if (activeReport) {
        const { isMeetingMode, surat, disposisi, judul, isi, warna, isChecklist, checklist, isExpanded } = activeReport;

        const handleAddChecklist = () => {
            if (!newChecklist.trim()) return;
            updateActiveReport({
                checklist: [...checklist, { id: Date.now().toString(), teks: newChecklist, isDone: false }]
            });
            setNewChecklist('');
        };

        const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter') {
                e.preventDefault(); 
                const target = e.target as HTMLTextAreaElement;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                const value = target.value;

                const lines = value.substring(0, start).split('\n');
                const currentLine = lines[lines.length - 1];

                if (currentLine.trim() === '-') {
                    const newValue = value.substring(0, start - currentLine.length) + '\n' + value.substring(end);
                    updateActiveReport({ isi: newValue });
                    setTimeout(() => {
                        target.selectionStart = target.selectionEnd = start - currentLine.length + 1;
                    }, 0);
                } else {
                    const newValue = value.substring(0, start) + '\n- ' + value.substring(end);
                    updateActiveReport({ isi: newValue });
                    setTimeout(() => {
                        target.selectionStart = target.selectionEnd = start + 3;
                    }, 0);
                }
            }
        };

        return (
            <AnimatePresence>
                <motion.div
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 50, opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    drag={!isMeetingMode}
                    dragControls={dragControls}
                    dragListener={false}
                    dragMomentum={false}
                    className={`fixed z-[60] bg-background border border-border/50 shadow-2xl overflow-hidden flex flex-col transition-[width,height,border-radius] duration-300
                        ${isMeetingMode 
                            ? 'inset-0 w-full h-full rounded-none' 
                            : 'bottom-4 right-4 md:bottom-8 md:right-8 w-[92vw] sm:w-[500px] max-h-[85vh] rounded-2xl'
                        }
                    `}
                >
                    {/* Header (Drag Handle) */}
                    <div 
                        className="px-5 pt-5 pb-4 pr-12 border-b border-border/40 flex flex-row items-start justify-between bg-card/30 flex-shrink-0"
                        onPointerDown={(e) => {
                            if (!isMeetingMode) dragControls.start(e);
                        }}
                        style={{ cursor: isMeetingMode ? 'default' : 'grab' }}
                    >
                        <div className="flex-1 pr-4 pointer-events-none">
                            <div className="flex items-center gap-2 text-foreground">
                                <MessageSquare className="h-5 w-5 text-blue-600" />
                                <h3 className="font-bold">{isMeetingMode ? 'Catatan Rapat' : 'Laporan Cepat'}</h3>
                            </div>
                            <p className="line-clamp-2 mt-1 text-sm text-muted-foreground">
                                Surat: <strong className="text-foreground">{surat.perihal}</strong>
                            </p>
                        </div>
                        <div className="absolute top-4 right-4 flex gap-1 z-10">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => updateActiveReport({ isMeetingMode: !isMeetingMode })} title={isMeetingMode ? "Keluar Mode Rapat" : "Mode Rapat (Layar Penuh)"}>
                                {isMeetingMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </Button>
                            {!isMeetingMode && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setActiveReportId(null)} title="Minimize (Simpan ke Draf)">
                                    <MinusIcon size={16} />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => closeQuickReport(activeReport.id)} title="Hapus Draf">
                                <X size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className={`p-0 flex-1 flex flex-col ${isMeetingMode ? 'overflow-hidden' : ''} ${getWarnaClass(warna)} transition-colors duration-300 relative`}>
                        {!isMeetingMode && disposisi && (
                            <div className="mx-4 mt-4 mb-2 pl-4 py-2 border-l-4 border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/30 rounded-r-md text-sm text-foreground flex-shrink-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">Instruksi Atasan:</span>
                                <span className="italic font-medium opacity-90 leading-relaxed">"{disposisi.instruksi}"</span>
                            </div>
                        )}
                        
                        <div className={`transition-all duration-300 flex-1 flex flex-col overflow-y-auto custom-scrollbar`}>
                            {(isExpanded || judul || isMeetingMode) && (
                                <div className="px-4 pt-3 flex-shrink-0">
                                    <Input 
                                        placeholder={isMeetingMode ? "Judul Catatan Rapat..." : "Judul Laporan (Opsional)"}
                                        value={judul}
                                        onChange={(e) => updateActiveReport({ judul: e.target.value })}
                                        className={`border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 h-auto ${isMeetingMode ? 'text-xl md:text-2xl font-bold px-4 pt-2' : 'text-base font-bold'}`} 
                                    />
                                </div>
                            )}
                            
                            <div className={`p-4 flex-1 flex flex-col`}>
                                {isChecklist ? (
                                    <div className="space-y-2 flex-1">
                                        {checklist.map(item => (
                                            <div key={item.id} className="flex items-center gap-2 group">
                                                <Checkbox 
                                                    checked={item.isDone} 
                                                    onCheckedChange={(checked) => updateActiveReport({ checklist: checklist.map(i => i.id === item.id ? {...i, isDone: !!checked} : i) })}
                                                    className="border-current data-[state=checked]:bg-current data-[state=checked]:text-background"
                                                />
                                                <Input 
                                                    value={item.teks} 
                                                    onChange={(e) => updateActiveReport({ checklist: checklist.map(i => i.id === item.id ? {...i, teks: e.target.value} : i) })} 
                                                    className={`border-0 border-b border-transparent hover:border-current/20 focus-visible:border-current/50 bg-transparent rounded-none px-1 h-7 shadow-none focus-visible:ring-0 ${item.isDone ? 'line-through opacity-60' : ''}`} 
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => updateActiveReport({ checklist: checklist.filter(i => i.id !== item.id) })} className="opacity-0 group-hover:opacity-100 h-6 w-6"><X size={14}/></Button>
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-2 pt-1 border-t border-current/10">
                                            <Plus size={16} className="opacity-50 ml-0.5 shrink-0" />
                                            <Input 
                                                placeholder="Ketik item baru lalu tekan Enter..." 
                                                value={newChecklist}
                                                onChange={(e) => setNewChecklist(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklist(); } }}
                                                className="border-0 bg-transparent px-1 h-7 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/60 flex-1" 
                                            />
                                            <Button size="sm" variant="ghost" onClick={handleAddChecklist} className="h-7 text-xs px-2" disabled={!newChecklist.trim()}>Tambah</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <Textarea 
                                        value={isi} 
                                        onChange={e => updateActiveReport({ isi: e.target.value })} 
                                        onClick={() => updateActiveReport({ isExpanded: true })}
                                        onKeyDown={handleTextareaKeyDown} 
                                        placeholder={isExpanded || isMeetingMode ? "Ketik catatan Anda di sini..." : "Tuliskan progres/laporan di sini..."} 
                                        className={`border-0 bg-transparent shadow-none focus-visible:ring-0 resize-none placeholder:text-muted-foreground/50 flex-1 ${isMeetingMode ? 'min-h-[50vh] text-base leading-relaxed px-6' : 'min-h-[150px] px-5 py-4'}`} 
                                    />
                                )}
                            </div>
                        </div>

                        {/* Format Bar */}
                        {(isExpanded || isi || checklist.length > 0 || isMeetingMode) && (
                            <div className="flex items-center justify-between p-2 border-t border-current/10 bg-black/5 dark:bg-white/5 flex-shrink-0">
                                <div className="flex gap-1">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-current/10 rounded-full">
                                                <Palette size={16} className="opacity-70" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent align="start" className="w-auto p-2 flex gap-2 z-[70]">
                                            {PALETTE_COLORS.map(c => (
                                                <button 
                                                    key={c.id} 
                                                    onClick={() => updateActiveReport({ warna: c.id as any })} 
                                                    className={`w-6 h-6 rounded-full border-2 ${c.code} ${warna === c.id ? 'ring-2 ring-offset-2 ring-primary' : 'border-transparent hover:scale-110'}`}
                                                />
                                            ))}
                                        </PopoverContent>
                                    </Popover>
                                    
                                    <Button 
                                        variant="ghost" size="icon" 
                                        className={`h-8 w-8 rounded-full hover:bg-current/10 ${isChecklist ? 'bg-current/10' : ''}`} 
                                        onClick={() => updateActiveReport({ isChecklist: !isChecklist })}
                                        title="Mode Daftar Centang"
                                    >
                                        <ListTodo size={16} className="opacity-70" />
                                    </Button>
                                </div>
                                
                                <div className="text-[10px] opacity-80 pr-2 flex flex-col items-end gap-1">
                                    {isMeetingMode && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-200 font-semibold">Mode Rapat Aktif</span>}
                                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                                        <Save size={10} /> Auto-save aktif
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className={`px-5 pb-5 pt-4 flex-col sm:flex-row gap-3 ${getWarnaClass(warna)} transition-colors duration-300 flex-shrink-0 flex items-center justify-end border-t border-border/20`}>
                        <Button 
                            variant="outline" 
                            onClick={() => submitQuickReport(false)}
                            disabled={(isi.trim() === '' && checklist.length === 0) || isActionProcessing}
                            className="w-full sm:w-auto sg-btn sg-btn-outline bg-background/50 hover:bg-background/80"
                        >
                            Kirim {isMeetingMode ? 'Catatan' : 'Progres'}
                        </Button>
                        <Button 
                            onClick={() => submitQuickReport(true)}
                            disabled={(isi.trim() === '' && checklist.length === 0) || isActionProcessing}
                            className="w-full sm:w-auto sg-btn sg-btn-success" 
                        >
                            {isActionProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Kirim & Selesai
                        </Button>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return null;
}

// Icon helper
function MinusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
    </svg>
  )
}
