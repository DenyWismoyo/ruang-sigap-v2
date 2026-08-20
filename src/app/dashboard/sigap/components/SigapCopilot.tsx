// Lokasi: src/app/dashboard/poros/components/PorosCopilot.tsx
// [UPDATE] Asisten Panduan Interaktif Berbasis Blueprint (Tanpa AI)

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Book,
  Sparkles,
  Bot,
  X, 
  Minimize2,
  Maximize2,
  Search,
  ChevronRight,
  ArrowLeft,
  Loader2,
  BookOpen,
  FileText,
  ExternalLink,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Chapter {
  id: string;
  title: string;
  content: string;
}

export default function SigapCopilot() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);

  const dragControls = useDragControls();

  useEffect(() => {
    // Load markdown when widget is opened for the first time
    if (isOpen && chapters.length === 0) {
      const loadGuide = async () => {
        try {
          setIsLoading(true);
          const response = await fetch('/docs/panduan/BLUEPRINT-PENGETAHUAN-SISTEM.md');
          if (!response.ok) throw new Error("Gagal memuat panduan");
          let text = await response.text();
          
          // Preprocess: Convert **Path:** `/dashboard/poros/...` into clickable markdown links without /poros
          text = text.replace(/\*\*Path:\*\*\s*`(\/dashboard[^`]+)`/g, (match, path) => {
            const cleanPath = path.replace(/\/poros/g, '');
            return `**Path:** [\`${cleanPath}\`](${cleanPath})`;
          });

          // Parse markdown using "# " as delimiter (since "BAGIAN" has been removed)
          const parts = text.split(/^# /m);
          const parsedChapters: Chapter[] = [];
          
          // parts[0] is empty or whitespace before the first heading, so we start at 1
          for (let i = 1; i < parts.length; i++) {
            const content = parts[i];
            if (!content.trim()) continue;
            
            const lines = content.split('\n');
            const titleLine = lines[0].trim();
            const body = lines.slice(1).join('\n').trim();
            
            parsedChapters.push({
              id: `chapter-${i}`,
              title: titleLine,
              content: body
            });
          }
          
          setChapters(parsedChapters);
        } catch (err) {
          console.error("Gagal memuat blueprint:", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadGuide();
    }
  }, [isOpen, chapters.length]);

  const filteredChapters = chapters.filter(chap => 
    chap.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    chap.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pathname = usePathname();
  const isDetailPage = pathname.match(/\/surat\/[^\/]+$/);
  const bottomPos = isDetailPage ? 'bottom-[120px]' : 'bottom-20';

  return (
    <>
      {/* FAB (Floating Action Button) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={`fixed ${bottomPos} right-0 z-50 flex items-center transition-all duration-300`}
          >
            <div
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 hover:bg-blue-700 backdrop-blur-xl border-l border-y border-white/20 rounded-l-full flex items-center justify-center cursor-pointer shadow-xl relative group transition-all duration-300 hover:pr-2"
            >
              <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
              <Sparkles size={12} className="absolute top-2.5 md:top-3 right-3 md:right-4 text-amber-400 animate-pulse" />
              <span className="absolute top-1 md:top-2 right-1 md:right-2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500 border border-white z-20" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Guide Widget */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '68px' : '85vh',
            }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag={typeof window !== 'undefined' && window.innerWidth < 768 ? "y" : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(e, info) => {
              if (isMinimized && (info.offset.y < -50 || info.velocity.y < -500)) {
                setIsMinimized(false);
              } else if (info.offset.y > 100 || info.velocity.y > 500) {
                if (!isMinimized) {
                  setIsMinimized(true);
                } else {
                  setIsOpen(false);
                }
              }
            }}
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[60] w-[92vw] sm:w-[500px] md:w-[650px] max-h-[85vh] bg-background border border-border/50 shadow-2xl rounded-2xl flex flex-col overflow-hidden transition-[height] duration-300"
          >
            {/* Header */}
            <div 
              className="px-5 pt-5 pb-4 pr-12 border-b border-border/40 flex flex-row items-start justify-between bg-card/30 flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) dragControls.start(e);
              }}
            >
              <div className="flex-1 pr-4 pointer-events-none">
                  <div className="flex items-center gap-2 text-foreground">
                      <Bot className="h-5 w-5 text-blue-600" />
                      <h3 className="font-bold">Knowledge Base</h3>
                  </div>
                  <p className="line-clamp-2 mt-1 text-sm text-muted-foreground flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-extrabold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Interaktif
                      </span>
                  </p>
              </div>
              <div className="absolute top-4 right-4 flex gap-1 z-10">
                  <Button variant="ghost" size="icon" onClick={() => setIsMinimized(!isMinimized)} title={isMinimized ? "Perbesar" : "Kecilkan"} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} title="Tutup Panduan" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                    <X size={16} />
                  </Button>
              </div>
            </div>

            {/* Content Area */}
            {!isMinimized && (
              <div className="flex-1 flex flex-col overflow-hidden relative">
                
                {/* Active Chapter View */}
                <AnimatePresence mode="wait">
                  {activeChapter ? (
                    <motion.div 
                      key="chapter-detail"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      className="absolute inset-0 flex flex-col bg-background z-10"
                    >
                      <div className="p-3 border-b flex items-center gap-2 bg-muted/20 sticky top-0 z-20">
                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveChapter(null)}>
                           <ArrowLeft size={16} />
                         </Button>
                         <h4 className="font-medium text-sm truncate pr-4 text-blue-600">{activeChapter.title}</h4>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                         <div className="text-[13px] leading-relaxed space-y-3">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({node, ...props}) => {
                                  const url = props.href || '';
                                  const isInternal = url.startsWith('/dashboard');
                                  return (
                                    <button
                                      onClick={(e) => { 
                                        e.preventDefault(); 
                                        if (isInternal) {
                                          router.push(url);
                                          setIsOpen(false);
                                        } else {
                                          window.open(url, '_blank');
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 my-0.5 mx-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold bg-blue-600/10 hover:bg-gradient-to-r hover:from-blue-600 hover:to-blue-800 hover:text-white text-blue-600 border border-blue-600/30 transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 group/btn"
                                    >
                                      {isInternal ? <FileText size={13} className="group-hover/btn:scale-110 transition-transform" /> : <ExternalLink size={13} />}
                                      <span>{props.children}</span>
                                      <ArrowUpRight size={12} className="opacity-70 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                    </button>
                                  );
                                },
                                table: ({node, ...props}) => (
                                  <div className="overflow-x-auto my-4 rounded-lg border border-border/60 shadow-sm">
                                    <table className="w-full text-left border-collapse text-[12.5px]" {...props} />
                                  </div>
                                ),
                                th: ({node, ...props}) => <th className="border-b border-border/60 bg-muted/60 px-4 py-2.5 font-semibold text-foreground whitespace-nowrap" {...props} />,
                                td: ({node, ...props}) => <td className="border-b border-border/40 px-4 py-2.5 text-foreground/90 align-top" {...props} />,
                                p: ({node, ...props}) => <p className="mb-2.5 last:mb-0 text-foreground/90" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-foreground/90" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-foreground/90" {...props} />,
                                li: ({node, ...props}) => <li className="pl-1 my-1 leading-snug marker:text-blue-600" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-blue-600 mt-6 mb-3" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-blue-600 mt-5 mb-2.5" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-bold text-blue-600 mt-4 mb-2" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-[3px] border-blue-600 bg-muted/30 py-2 px-4 rounded-r-md not-italic text-muted-foreground my-3 text-[12.5px]" {...props} />,
                                code: ({node, className, children, ...props}) => {
                                  const match = /language-(\w+)/.exec(className || '')
                                  const isInline = !match && !String(children).includes('\n')
                                  return isInline ? (
                                    <code className="px-1.5 py-0.5 rounded-md bg-muted text-[11.5px] font-mono text-rose-500" {...props}>{children}</code>
                                  ) : (
                                    <div className="rounded-lg overflow-hidden border border-border/40 my-3 shadow-sm bg-[#0d1117]">
                                      <pre className="p-4 overflow-x-auto">
                                        <code className="text-[#c9d1d9] text-[12px] font-mono leading-relaxed" {...props}>{children}</code>
                                      </pre>
                                    </div>
                                  )
                                }
                              }}
                            >
                              {activeChapter.content}
                            </ReactMarkdown>
                         </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="toc-view"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 20, opacity: 0 }}
                      className="absolute inset-0 flex flex-col"
                    >
                      {/* Search Bar */}
                      <div className="p-4 border-b border-border/30 bg-background/50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                          <Input 
                            placeholder="Cari topik panduan..." 
                            className="pl-9 bg-muted/30 border-border/50 text-sm h-10 rounded-xl focus-visible:ring-1 focus-visible:ring-blue-600"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Chapters List */}
                      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                        {isLoading ? (
                          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-3">
                            <Loader2 className="animate-spin text-blue-600" size={24} />
                            <p className="text-sm">Memuat panduan sistem...</p>
                          </div>
                        ) : filteredChapters.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            <Search size={32} className="opacity-20 mb-3" />
                            <p className="text-sm">Tidak ada topik yang sesuai pencarian.</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {filteredChapters.map((chapter) => (
                              <button
                                key={chapter.id}
                                onClick={() => setActiveChapter(chapter)}
                                className="w-full text-left p-4 rounded-xl hover:bg-muted/50 transition-all flex items-center justify-between group border border-transparent hover:border-border/50"
                              >
                                <div>
                                  <h4 className="font-medium text-sm text-foreground group-hover:text-blue-600 transition-colors line-clamp-1">{chapter.title}</h4>
                                </div>
                                <ChevronRight size={16} className="text-muted-foreground/50 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


