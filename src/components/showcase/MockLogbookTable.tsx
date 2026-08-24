"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Calendar,
  CheckSquare,
  Clock,
  Filter,
  Menu,
  Bell,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockFABs } from "./MockFABs";

export function MockLogbookTable() {
  const logbooks = [
    {
      id: 1,
      date: "25 Agt 2026",
      activity:
        "Menyusun draft SK Tim Teknis berdasarkan Surat Edaran Bupati No. 12",
      duration: "120 Menit",
      output: "Dokumen Draft SK (PDF)",
      status: "Verified",
    },
    {
      id: 2,
      date: "24 Agt 2026",
      activity: "Menghadiri Rapat Koordinasi Anggaran dengan Bappeda",
      duration: "180 Menit",
      output: "Notulensi Rapat & Foto Kegiatan",
      status: "Verified",
    },
    {
      id: 3,
      date: "24 Agt 2026",
      activity:
        "Melakukan reviu dokumen pertanggungjawaban keuangan bulan Juli",
      duration: "90 Menit",
      output: "Checklist Reviu & Catatan Perbaikan",
      status: "Pending",
    },
    {
      id: 4,
      date: "23 Agt 2026",
      activity: "Koordinasi tindak lanjut persiapan Porprov 2026",
      duration: "60 Menit",
      output: "Surat Balasan (DOCX)",
      status: "Verified",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full flex flex-col relative bg-[hsl(var(--sg-surface-1))] overflow-hidden rounded-bl-3xl rounded-br-3xl"
    >
      {/* Top Navbar Simulation */}
      <div className="h-14 bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <BookOpen className="w-5 h-5 text-emerald-500" /> Logbook E-Kinerja
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center relative">
            <Bell className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <span className="text-xs font-bold text-primary">AD</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col p-6 max-w-6xl mx-auto overflow-y-auto">
        <Card className="flex-1 bg-card border-border shadow-md flex flex-col overflow-hidden">
          <CardHeader className="p-5 border-b border-border bg-muted/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-foreground">
                Logbook Harian (Agustus 2026)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Rekap otomatis dari laporan tindak lanjut disposisi dan tugas
                yang Anda kerjakan di SIGAP.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="bg-background">
                <Filter className="w-4 h-4 mr-2" />
                Filter Bulan
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Format BKN
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto flex-1">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[140px] font-bold text-foreground py-4">
                    Tanggal
                  </TableHead>
                  <TableHead className="font-bold text-foreground py-4">
                    Uraian Kegiatan
                  </TableHead>
                  <TableHead className="font-bold text-foreground py-4">
                    Waktu
                  </TableHead>
                  <TableHead className="font-bold text-foreground py-4">
                    Output (Bukti Dukung)
                  </TableHead>
                  <TableHead className="text-right font-bold text-foreground py-4">
                    Status Atasan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logbooks.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-muted/30 transition-colors border-border"
                  >
                    <TableCell className="align-top font-medium text-sm text-foreground py-4">
                      <div className="flex items-center gap-2 whitespace-nowrap bg-background border border-border px-2 py-1 rounded-md w-fit">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {log.date}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <p className="text-sm text-foreground font-medium leading-relaxed">
                        {log.activity}
                      </p>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap text-sm text-muted-foreground py-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-amber-500" />
                        {log.duration}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 px-2 py-1.5 rounded-md w-fit">
                        <CheckSquare className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-600 dark:text-blue-400 font-bold">
                          {log.output}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-right py-4">
                      {log.status === "Verified" ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />{" "}
                          Terverifikasi
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 px-2.5 py-1"
                        >
                          Menunggu
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <MockFABs />
    </motion.div>
  );
}
