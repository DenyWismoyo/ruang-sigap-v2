"use client";

import React, { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CombinedAgendaItem, Surat, JadwalTempat } from '@/types';
import { Calendar as CalendarIcon, MapPin, Clock, ExternalLink, Plus } from 'lucide-react';
import { isSameDay, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface MiniCalendarWidgetProps {
  agendas: CombinedAgendaItem[];
}

export default function MiniCalendarWidget({ agendas }: MiniCalendarWidgetProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Extract dates that have agendas
  const agendaDates = useMemo(() => {
    const dates: Date[] = [];
    agendas.forEach(agenda => {
      // For combined agendas, we need to extract the raw date
      // We assume agendas passed here have a parsed date, or we extract it from item
      let agendaDate: Date | null = null;
      if (agenda.type === 'internal') {
        const item = agenda.item as JadwalTempat;
        if (item.tanggalMulai) agendaDate = item.tanggalMulai.toDate();
      } else if (agenda.type === 'surat') {
        const item = agenda.item as Surat;
        if (item.detailAgenda?.tanggal) agendaDate = item.detailAgenda.tanggal.toDate();
      }

      if (agendaDate) {
        dates.push(startOfDay(agendaDate));
      }
    });
    return dates;
  }, [agendas]);

  // Find agendas for the selected date
  const selectedDateAgendas = useMemo(() => {
    if (!date) return [];
    
    return agendas.filter(agenda => {
      let agendaDate: Date | null = null;
      if (agenda.type === 'internal') {
        const item = agenda.item as JadwalTempat;
        if (item.tanggalMulai) agendaDate = item.tanggalMulai.toDate();
      } else if (agenda.type === 'surat') {
        const item = agenda.item as Surat;
        if (item.detailAgenda?.tanggal) agendaDate = item.detailAgenda.tanggal.toDate();
      }
      
      if (!agendaDate) return false;
      return isSameDay(agendaDate, date);
    }).sort((a, b) => a.time.localeCompare(b.time));
  }, [date, agendas]);

  return (
    <Card className="card-solid border-x-0 border-b border-t-0 md:border-t-4 md:border-t-primary border-border/20 md:border-border shadow-none md:shadow-md overflow-hidden rounded-none md:rounded-xl bg-transparent md:bg-card">
      <CardHeader className="bg-transparent md:bg-muted/30 border-b border-border/20 md:border-border px-4 py-2.5 md:p-4">
        <CardTitle className="text-sm md:text-lg font-bold flex items-center gap-1.5 md:gap-2 text-foreground">
          <CalendarIcon className="w-5 h-5 text-primary" />
          Mini Kalender
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex flex-col">
        <div className="flex justify-center px-4 py-0 md:py-2 border-b border-border/20 md:border-border/50 bg-transparent md:bg-card/50">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
            modifiers={{
              hasAgenda: agendaDates,
            }}
            modifiersStyles={{
              hasAgenda: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: 'var(--primary)',
                textUnderlineOffset: '4px',
              }
            }}
            modifiersClassNames={{
              hasAgenda: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full"
            }}
          />
        </div>
        
        <div className="p-4 bg-transparent md:bg-muted/10 flex-1 min-h-[150px]">
          <h4 className="text-xs md:text-sm font-semibold mb-2 md:mb-3 text-muted-foreground flex items-center justify-between uppercase tracking-wider md:normal-case md:tracking-normal">
            <span>Agenda Tanggal Terpilih</span>
            {date && <span className="text-primary text-[10px] md:text-xs font-bold">{date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
          </h4>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={date ? date.toISOString() : 'none'}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {selectedDateAgendas.length > 0 ? (
                selectedDateAgendas.map(agenda => (
                  <div key={`${agenda.type}-${agenda.id}`} className="p-2.5 md:p-3 rounded-lg bg-card border border-border shadow-sm flex flex-col gap-1.5 md:gap-2 relative overflow-hidden group">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${agenda.type === 'internal' ? 'bg-blue-500' : 'bg-indigo-500'}`} />
                    <div className="flex justify-between items-start pl-1.5 md:pl-2">
                      <p className="text-xs md:text-sm font-semibold text-foreground line-clamp-2 leading-tight">{agenda.title}</p>
                      <span className="text-[9px] md:text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground whitespace-nowrap ml-2">
                        {agenda.time}
                      </span>
                    </div>
                    <div className="pl-1.5 md:pl-2 flex items-center text-[10px] md:text-xs text-muted-foreground gap-1 line-clamp-1">
                      <MapPin className="flex-shrink-0 w-3 h-3 md:w-3 md:h-3" />
                      {agenda.location?.startsWith('http') ? (
                        <a href={agenda.location} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center">
                          Virtual Meeting <ExternalLink size={10} className="ml-1"/>
                        </a>
                      ) : (
                        <span className="truncate">{agenda.location}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarIcon size={32} className="mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-medium">Kosong. Tidak ada agenda di tanggal ini.</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="p-4 md:p-3 bg-transparent md:bg-card mt-auto">
          <Button asChild className="w-full h-10 md:h-9" size="sm" variant="default">
            <Link href="/dashboard/poros/tugas?action=create">
              <Plus size={16} className="mr-2" /> Buat Tugas Baru
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
