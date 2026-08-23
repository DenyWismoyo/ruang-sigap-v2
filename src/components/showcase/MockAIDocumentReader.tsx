"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ChevronLeft,
  Info,
  ZoomIn,
  ZoomOut,
  Download,
  Printer,
  Share2,
  Sparkles,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TypewriterText = ({
  text,
  isTyping,
  className,
}: {
  text: string;
  isTyping: boolean;
  className?: string;
}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!isTyping) {
      setDisplayedText(text);
      return;
    }

    setDisplayedText("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [text, isTyping]);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-blue-500 animate-pulse align-middle" />
      )}
    </span>
  );
};

export function MockAIDocumentReader() {
  const [extractedData, setExtractedData] = useState<any[]>([]);

  const RAW_DATA = [
    { key: "NOMOR SURAT", value: "19/BP-INS/VIII/2026", delay: 1000 },
    {
      key: "PENGIRIM",
      value: "Biro Pengawasan Internal Daerah",
      delay: 2500,
    },
    { key: "TANGGAL SURAT", value: "21 Agustus 2026", delay: 4000 },
    {
      key: "RINGKASAN EKSEKUTIF (AI)",
      value:
        "Pemberitahuan terkait jadwal pemeriksaan rutin tahunan terhadap dokumen administrasi, keuangan, dan aset. Diharapkan seluruh pimpinan OPD mempersiapkan laporan pertanggungjawaban terkait.",
      delay: 5500,
    },
  ];

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];

    RAW_DATA.forEach((item, index) => {
      // Mulai mengetik
      const startTimeout = setTimeout(() => {
        setExtractedData((prev) => {
          if (prev.find((p) => p.key === item.key)) return prev;
          return [...prev, { ...item, typing: true }];
        });
      }, item.delay);
      timeouts.push(startTimeout);

      // Selesai mengetik
      const endTimeout = setTimeout(
        () => {
          setExtractedData((prev) =>
            prev.map((p) => (p.key === item.key ? { ...p, typing: false } : p)),
          );
        },
        item.delay + item.value.length * 15 + 500,
      );
      timeouts.push(endTimeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-transparent text-foreground overflow-hidden">
      {/* Header Detail Surat */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-border/20 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Sebelumnya</span>
          </div>
          <h1 className="text-lg font-bold text-foreground">
            Pemberitahuan Pelaksanaan Pemeriksaan Rutin Tahunan
          </h1>
          <div className="flex gap-2 mt-1.5">
            <span className="px-2.5 py-0.5 bg-muted/30 text-muted-foreground text-[10px] font-semibold rounded-full border border-border/40">
              Biasa
            </span>
            <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-semibold rounded-full">
              Baru
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col lg:flex-row p-4 sm:p-6 gap-4 sm:gap-6 overflow-hidden">
        {/* Left Panel: PDF Viewer Mock */}
        <div className="w-full lg:w-[55%] h-full flex flex-col border border-border/40 rounded-lg overflow-hidden glass-enterprise shadow-sm">
          {/* PDF Toolbar */}
          <div className="h-10 bg-black/80 backdrop-blur-md text-white/80 flex items-center px-3 justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button>
                <MenuIcon className="w-4 h-4" />
              </button>
              <span className="text-xs truncate max-w-[150px]">
                surat_pemberitahuan_pemeriksaan.pdf
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span>1 / 2</span>
              <div className="flex items-center gap-3 border-l border-r border-slate-600 px-4">
                <button>
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span>100%</span>
                <button>
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button>
                <Download className="w-4 h-4" />
              </button>
              <button>
                <Printer className="w-4 h-4" />
              </button>
              <button>
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF Content Mock */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center custom-scrollbar">
            <div className="bg-white w-full max-w-[600px] h-fit min-h-[800px] shadow-md p-8 sm:p-12 relative flex flex-col">
              {/* Scanner Line Effect */}
              <motion.div
                initial={{ top: 0, opacity: 0 }}
                animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                className="absolute left-0 right-0 h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10"
              />

              <div className="text-center border-b-2 border-black pb-4 mb-8">
                <h2 className="text-xl font-bold font-serif text-black uppercase">
                  Pemerintah Daerah Instansi Percontohan
                </h2>
                <h1 className="text-2xl font-black font-serif tracking-wide text-black uppercase">
                  Biro Pengawasan Internal Daerah
                </h1>
                <p className="text-xs text-black mt-1">
                  Sekretariat: Jl. Pusat Pemerintahan No. 1, Lantai 3. Telp.
                  021-123456
                </p>
              </div>

              <div className="flex justify-between text-[11px] text-black mb-6">
                <div className="flex flex-col gap-1">
                  <p>
                    <span className="inline-block w-16">Nomor</span>:
                    19/BP-INS/VIII/2026
                  </p>
                  <p>
                    <span className="inline-block w-16">Sifat</span>: Biasa
                  </p>
                  <p>
                    <span className="inline-block w-16">Lampiran</span>: -
                  </p>
                  <p className="flex">
                    <span className="inline-block w-16 shrink-0">Hal</span>:{" "}
                    <span>
                      Pemberitahuan Pelaksanaan
                      <br />
                      Pemeriksaan Rutin Tahunan
                    </span>
                  </p>
                </div>
                <div>
                  <p>Pusat Pemerintahan, 21 Agustus 2026</p>
                </div>
              </div>

              <div className="text-sm text-black">
                <p>
                  Yth. Kepala Perangkat Daerah
                  <br />
                  di Lingkungan Instansi Percontohan
                  <br />
                  di
                  <br />
                  Tempat
                </p>
              </div>

              {/* Blur rest of content to emphasize extraction */}
              <div className="mt-8 space-y-3 opacity-20 filter blur-[1px]">
                <div className="w-full h-4 bg-slate-300 rounded" />
                <div className="w-full h-4 bg-slate-300 rounded" />
                <div className="w-3/4 h-4 bg-slate-300 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Data Extraction & Actions */}
        <div className="w-full lg:w-[45%] h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-6">
          <div className="border border-border/30 rounded-xl glass-enterprise overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 p-3 border-b border-border/20 bg-muted/10">
              <Info className="w-4 h-4 text-blue-500" />
              <h3 className="font-bold text-foreground text-sm">
                Detail Surat
              </h3>
            </div>
            
            <div className="p-4 flex flex-col gap-4">
              {RAW_DATA.map((item) => {
                const extracted = extractedData.find((e) => e.key === item.key);

                if (item.key === "RINGKASAN EKSEKUTIF (AI)") {
                  return (
                    <div
                      key={item.key}
                      className="mt-2 bg-[#eff6ff] dark:bg-[#1e3a8a]/20 border border-[#bfdbfe] dark:border-[#1e3a8a]/50 p-4 rounded-lg relative overflow-hidden"
                    >
                      {extracted?.typing && (
                        <motion.div
                          animate={{ opacity: [0.1, 0.3, 0.1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="absolute inset-0 bg-blue-400/10"
                        />
                      )}
                      <h4 className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" /> {item.key}
                      </h4>
                      <p className="text-sm text-blue-900 dark:text-blue-300 italic min-h-[3rem]">
                        {extracted ? (
                          <TypewriterText
                            text={extracted.value}
                            isTyping={extracted.typing}
                          />
                        ) : (
                          ""
                        )}
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={item.key}>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> {item.key}
                      </h4>
                    </div>
                    <div className="min-h-[24px]">
                      {extracted ? (
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          <TypewriterText
                            text={extracted.value}
                            isTyping={extracted.typing}
                          />
                        </p>
                      ) : (
                        <div className="h-5 w-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kirim Pemberitahuan Mock Card */}
          <div className="border border-border/30 rounded-xl glass-enterprise p-4 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-foreground text-sm">
                  Kirim Pemberitahuan
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] uppercase tracking-wider font-bold rounded flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Saran AI
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2 relative z-10">Kirim ke (Perorangan)</p>
            <div className="w-full h-8 border border-border/40 rounded bg-background/50 relative z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

const MenuIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);
