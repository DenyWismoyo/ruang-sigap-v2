// Lokasi: src/app/dashboard/natakarya/components/NatakaryaCopilot.tsx
// [UPDATE ENTERPRISE] Natakarya AI Chat Copilot
// Asisten Cerdas ASN berbasis Google Gemini 3.5 Flash Lite dengan Real Database Query & Interactive Action Buttons.

"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { useToastContext } from '@/context/ToastContext';
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User, 
  RotateCcw, 
  Copy, 
  Check, 
  Zap, 
  FileText, 
  Mail, 
  Calendar, 
  Minimize2,
  Maximize2,
  Loader2,
  ExternalLink,
  ArrowUpRight,
  Inbox,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}



export default function NatakaryaCopilot() {
  const router = useRouter();
  const { userProfile, actingJabatanProfile, jabatanProfile, opdConfig } = useUserAuth();
  const { welcomeSummary } = useNotification();
  const { addToast } = useToastContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const dragControls = useDragControls();

  const activeJabatan = actingJabatanProfile?.namaJabatan || jabatanProfile?.namaJabatan || userProfile?.role || 'Staf ASN';
  const activeJabatanId = actingJabatanProfile?.id || userProfile?.jabatanId || '';
  const opdName = (opdConfig as any)?.namaOpd || (opdConfig as any)?.name || userProfile?.opdId || 'Instansi Pemerintah';

  // Pintasan Aksi Dinamis berdasarkan data riil dari welcomeSummary
  const dynamicPrompts = React.useMemo(() => {
    const prompts = [];
    const pendingDisposisi = (welcomeSummary?.tindakLanjutMenunggu || 0) + (welcomeSummary?.disposisiBaru || 0);
    const pendingSurat = welcomeSummary?.suratMenungguDisposisi || 0;
    const tugasAktif = welcomeSummary?.tugasAktif || 0;

    if (pendingDisposisi > 0) {
      prompts.push({
        icon: <Mail size={14} className="text-blue-500" />,
        label: `${pendingDisposisi} Disposisi Perlu Diproses`,
        prompt: "Tolong sebutkan rincian disposisi surat terbaru yang harus saya selesaikan beserta tautannya."
      });
    }
    if (pendingSurat > 0) {
      prompts.push({
        icon: <Inbox size={14} className="text-amber-500" />,
        label: pendingSurat > 20 ? `20+ Surat Belum Didisposisi (7 Hari Terakhir)` : `${pendingSurat} Surat Belum Didisposisi`,
        prompt: "Tampilkan daftar surat masuk terbaru (7 hari kebelakang) yang berstatus Belum Didisposikan beserta tautan aksinya."
      });
    }
    if (tugasAktif > 0) {
      prompts.push({
        icon: <CheckSquare size={14} className="text-emerald-500" />,
        label: `${tugasAktif} Tugas Aktif & Deadline`,
        prompt: "Periksa daftar tugas dinas aktif saya dan tampilkan tenggat waktu serta prioritasnya."
      });
    }

    // Default fallbacks jika tidak ada notifikasi mendesak
    if (prompts.length === 0) {
      prompts.push({
        icon: <Mail size={14} className="text-blue-500" />,
        label: "Cek Surat Masuk Terbaru",
        prompt: "Tampilkan 3 surat masuk terbaru di OPD saya."
      });
      prompts.push({
        icon: <CheckSquare size={14} className="text-emerald-500" />,
        label: "Ringkasan Tugas Saya",
        prompt: "Apa saja tugas dinas aktif saya saat ini?"
      });
    }

    prompts.push({
      icon: <FileText size={14} className="text-purple-500" />,
      label: "Buat Draf Naskah",
      prompt: "Bantu saya menyusun draf Nota Dinas resmi untuk permohonan koordinasi teknis antar bidang."
    });

    return prompts.slice(0, 4);
  }, [welcomeSummary]);

  // Auto-scroll ke pesan terbawah saat ada pesan baru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  // Pesan Sambutan Awal Otomatis jika chat masih kosong (Diperpendek & Visioner)
  useEffect(() => {
    if (isOpen && messages.length === 0 && userProfile) {
      const initialGreeting: ChatMessage = {
        id: 'welcome-msg',
        role: 'model',
        content: `Halo **${userProfile.namaLengkap}**! 👋\n\nSaya **Natakarya AI**, asisten cerdas yang terhubung ke data real-time Anda. Ada yang bisa saya bantu hari ini?`,
        timestamp: new Date(),
      };
      setMessages([initialGreeting]);
    }
  }, [isOpen, userProfile, messages.length]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Susun konteks pengguna lengkap untuk query database real
      const userContext = {
        namaLengkap: userProfile?.namaLengkap || 'Pengguna',
        namaJabatan: activeJabatan,
        jabatanId: activeJabatanId,
        role: userProfile?.role || 'Pengguna',
        opdId: userProfile?.opdId || '',
        opdName: opdName,
        uid: userProfile?.uid || '',
        pendingDisposisiCount: welcomeSummary?.suratBaruCount || 0,
        pendingTugasCount: welcomeSummary?.tugasBaruCount || 0,
      };

      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memproses jawaban dari AI.');
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: data.reply || 'Maaf, saya tidak dapat merumuskan jawaban saat ini.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Copilot Error:', err);
      addToast(err.message || 'Terjadi gangguan pada AI Copilot.', 'error');
      
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⚠️ **Maaf, terjadi kendala teknis**: ${err.message || 'Koneksi ke layanan AI terputus. Silakan coba kembali.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    // Bersihkan format link markdown saat disalin agar jadi teks bersih jika diperlukan
    const cleaned = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
    navigator.clipboard.writeText(cleaned);
    setCopiedId(id);
    addToast('Teks berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    if (userProfile) {
      const resetMsg: ChatMessage = {
        id: `reset-${Date.now()}`,
        role: 'model',
        content: `Percakapan telah dibersihkan. Silakan ajukan pertanyaan atau instruksi baru kepada saya, **${userProfile.namaLengkap}**! ✨`,
        timestamp: new Date(),
      };
      setMessages([resetMsg]);
    }
  };

  const handleActionNavigate = (url: string) => {
    if (url.startsWith('/')) {
      router.push(url);
      addToast('Membuka halaman dokumen...', 'info');
    } else {
      window.open(url, '_blank');
    }
  };

  // Helper untuk merender formatting Markdown sederhana (Bold, List, Linebreaks, Blockquote, dan Action Links)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Header (### / ## / #)
          if (trimmed.startsWith('### ')) {
            return <h4 key={idx} className="font-bold text-foreground text-sm mt-2 mb-1">{renderInlineFormatting(trimmed.replace('### ', ''))}</h4>;
          }
          if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
            return <h3 key={idx} className="font-bold text-foreground text-base mt-2 mb-1 text-primary">{renderInlineFormatting(trimmed.replace(/^#+\s/, ''))}</h3>;
          }

          // Bullet points
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const rawText = trimmed.replace(/^[\*\-]\s/, '');
            return (
              <div key={idx} className="flex items-start gap-2 ml-1">
                <span className="text-primary mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="flex-1">{renderInlineFormatting(rawText)}</span>
              </div>
            );
          }

          // Numbered list
          const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 ml-1">
                <span className="font-semibold text-primary text-xs mt-0.5 min-w-[16px]">{numMatch[1]}.</span>
                <span className="flex-1">{renderInlineFormatting(numMatch[2])}</span>
              </div>
            );
          }

          // Blockquote
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={idx} className="border-l-4 border-primary/50 pl-3 py-1 my-1.5 italic bg-muted/30 rounded-r text-xs text-muted-foreground">
                {renderInlineFormatting(trimmed.replace('> ', ''))}
              </blockquote>
            );
          }

          // Blank line
          if (!trimmed) {
            return <div key={idx} className="h-1.5" />;
          }

          // Normal text
          return <p key={idx}>{renderInlineFormatting(line)}</p>;
        })}
      </div>
    );
  };

  // Helper untuk formatting inline: [Link Text](url), **bold**, *italic*, `code`
  const renderInlineFormatting = (text: string) => {
    // Regex untuk link markdown [Label](url), bold **text**, dan `code`
    const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*.*?\*\*|`.*?`)/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, i) => {
      // 1. Interactive Link Button [Label](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const label = linkMatch[1];
        const url = linkMatch[2];
        const isInternal = url.startsWith('/dashboard/natakarya');

        return (
          <button
            key={i}
            onClick={() => handleActionNavigate(url)}
            className="inline-flex items-center gap-1 my-0.5 mx-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary border border-primary/30 transition-all duration-200 shadow-2xs hover:shadow-xs active:scale-95 group/btn"
          >
            {isInternal ? <FileText size={12} className="group-hover/btn:scale-110 transition-transform" /> : <ExternalLink size={12} />}
            <span>{label}</span>
            <ArrowUpRight size={11} className="opacity-70 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        );
      }

      // 2. Bold text **text**
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }

      // 3. Code `code`
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1 py-0.5 rounded bg-muted font-mono text-xs text-primary">{part.slice(1, -1)}</code>;
      }

      return part;
    });
  };

  return (
    <>
      {/* 1. FLOATING COPILOT TRIGGER BUTTON (OMNIFIT UI STYLE) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-32 md:bottom-6 right-0 md:right-4 z-50 flex items-center gap-2"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="relative group flex items-center gap-2.5 pl-2 pr-1.5 py-1.5 md:px-4 md:py-2.5 rounded-l-full md:rounded-full bg-card/90 backdrop-blur-xl border border-primary/30 border-r-0 md:border-r shadow-[-4px_0_15px_rgba(0,0,0,0.1)] hover:shadow-primary/40 transition-all duration-300 active:scale-95 focus:outline-none"
            >
              {/* Omnifit Outer Glow Halo */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur-md group-hover:opacity-100 transition duration-500 animate-pulse pointer-events-none" />

              {/* Omnifit Animated Conic Border Ring for Avatar */}
              <div className="relative w-11 h-11 md:w-9 md:h-9 rounded-full flex items-center justify-center p-[2px] overflow-hidden flex-shrink-0">
                <div 
                  className="absolute inset-0 rounded-full animate-spin-slow"
                  style={{
                    background: 'conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, #f59e0b, #10b981, #6366f1)'
                  }}
                />
                <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white shadow-inner">
                  <Bot size={20} className="md:w-4.5 md:h-4.5 text-white" />
                  <Sparkles size={11} className="absolute -top-0.5 -right-0.5 text-yellow-300 animate-bounce" />
                </div>
              </div>

              {/* Text Label on Desktop */}
              <div className="hidden md:flex items-center gap-2 relative z-10 pr-1.5">
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-foreground tracking-tight">Natakarya AI</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold">Flash Lite 3.5</span>
                </div>
              </div>

              {/* Live Status Dot on Mobile */}
              <span className="absolute top-1 right-1 md:hidden w-3 h-3 rounded-full bg-emerald-500 border-2 border-card z-20 animate-pulse" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CHAT DRAWER / FLOATING WINDOW (FIXED MOBILE OVERLAP & OMNIFIT PANEL) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '68px' : '85vh',
            }}
            exit={{ opacity: 0, y: '100%', scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            drag={typeof window !== 'undefined' && window.innerWidth < 768 ? "y" : false}
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(e, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setIsOpen(false);
              }
            }}
            className="fixed bottom-0 md:bottom-6 inset-x-0 md:inset-x-auto md:right-6 z-[60] w-full md:w-[460px] md:max-h-[640px] bg-card/98 backdrop-blur-3xl border-t md:border border-border shadow-[0_-10px_40px_rgba(0,0,0,0.3)] md:shadow-2xl rounded-t-[28px] md:rounded-2xl flex flex-col overflow-hidden transition-[height] duration-300"
          >
            {/* Drag Handle Container */}
            <div 
              className="touch-none md:cursor-default cursor-grab active:cursor-grabbing flex-shrink-0"
              onPointerDown={(e) => {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  dragControls.start(e);
                }
              }}
            >
              {/* Mobile Drag Pill */}
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-2.5 mb-1 md:hidden" />

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 md:py-3 bg-gradient-to-r from-primary/10 via-purple-500/10 to-card border-b border-border/80 select-none">
              <div className="flex items-center gap-2.5">
                {/* Omnifit Avatar Ring in Header */}
                <div className="relative w-9 h-9 rounded-full p-[1.5px] overflow-hidden flex-shrink-0">
                  <div 
                    className="absolute inset-0 rounded-full animate-spin-slow"
                    style={{
                      background: 'conic-gradient(from 0deg, #6366f1, #a855f7, #ec4899, #f59e0b, #6366f1)'
                    }}
                  />
                  <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                    <Bot size={17} className="text-white" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-foreground">Natakarya Copilot</h3>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live DB
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <span>Gemini 3.5 Flash Lite</span>
                    <span>•</span>
                    <span className="truncate max-w-[150px]">{opdName}</span>
                  </p>
                </div>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearChat}
                  title="Bersihkan Percakapan"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <RotateCcw size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? "Perbesar" : "Kecilkan"}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  title="Tutup Chat"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          </div>

            {/* Chat Body (Hanya jika tidak diminimize) */}
            {!isMinimized && (
              <>
                {/* Message Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'model' && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm mt-0.5">
                          <Bot size={15} />
                        </div>
                      )}

                      <div className={`relative max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-sm group ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-none' 
                          : 'bg-muted/70 text-foreground border border-border/60 rounded-tl-none'
                      }`}>
                        {msg.role === 'user' ? (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        ) : (
                          renderFormattedContent(msg.content)
                        )}

                        {/* Action Buttons for AI Message */}
                        {msg.role === 'model' && msg.id !== 'welcome-msg' && (
                          <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="text-[10px] opacity-70">
                              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              onClick={() => handleCopyText(msg.id, msg.content)}
                              className="inline-flex items-center gap-1 hover:text-primary transition-colors py-0.5 px-1.5 rounded hover:bg-background/80"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check size={12} className="text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Tersalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Salin Teks</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0 mt-0.5 font-bold text-xs">
                          {userProfile?.namaLengkap?.charAt(0) || <User size={14} />}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 justify-start items-center"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                        <Bot size={15} />
                      </div>
                      <div className="bg-muted/70 rounded-2xl rounded-tl-none px-4 py-2.5 border border-border/60 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground font-medium animate-pulse">
                          Natakarya AI sedang membaca database & menyusun dokumen...
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Prompt Chips */}
                {messages.length <= 2 && (
                  <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
                    <p className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Zap size={12} className="text-amber-500" /> Pintasan Aksi (Real Data):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {dynamicPrompts.map((qp, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(qp.prompt)}
                          disabled={isLoading}
                          className="text-[11px] bg-background hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-border rounded-full px-2.5 py-1 text-muted-foreground transition-all duration-200 flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50"
                        >
                          {qp.icon}
                          <span className="truncate max-w-[210px]">{qp.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Footer */}
                <div className="p-3 border-t border-border bg-card">
                  <div className="relative flex items-end gap-2 bg-muted/40 rounded-xl border border-border p-1.5 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
                    <textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Cari surat, cek disposisi, minta draf naskah..."
                      disabled={isLoading}
                      rows={1}
                      className="w-full bg-transparent border-0 resize-none px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none max-h-24 min-h-[36px] scroll-smooth"
                    />
                    <Button
                      size="icon"
                      onClick={() => handleSendMessage()}
                      disabled={!inputValue.trim() || isLoading}
                      className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0 transition-transform active:scale-95 disabled:opacity-40"
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </Button>
                  </div>
                  <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Shift + Enter untuk baris baru</span>
                    <span className="opacity-75">Gemini 3.5 Flash Lite • Live Data</span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
