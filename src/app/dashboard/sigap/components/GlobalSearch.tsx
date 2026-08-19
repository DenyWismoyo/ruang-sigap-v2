// Lokasi: src/app/dashboard/components/GlobalSearch.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Calculator, Calendar, CreditCard, Settings, User, 
  Mail, ClipboardCheck, BookOpen, FileText, LayoutDashboard 
} from 'lucide-react';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from '@/components/ui/button';

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  // Fungsi pencarian Database (Redirect ke halaman search)
  const handleSearch = (value: string) => {
      // Jika user menekan enter pada input text biasa (bukan item list), command ini akan dihandle oleh form submit di search page
      // Namun di CommandDialog shadcn, kita arahkan navigasi
      router.push(`/dashboard/search?q=${encodeURIComponent(value)}`);
      setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 p-0 md:h-10 md:w-40 lg:w-64 md:px-4 md:py-2 justify-center md:justify-start rounded-full md:rounded-[0.5rem] bg-transparent border-transparent md:bg-muted/50 md:border-input text-sm font-normal text-muted-foreground shadow-none md:pr-12 hover:bg-accent/50"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5 md:hidden text-foreground/70" />
        <span className="hidden lg:inline-flex">Cari sesuatu...</span>
        <span className="hidden md:inline-flex lg:hidden">Cari...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
            placeholder="Ketik perintah atau cari surat..." 
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    handleSearch(e.currentTarget.value);
                }
            }}
        />
        <CommandList>
          <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>
          
          <CommandGroup heading="Navigasi Cepat">
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/ruang-kerja'))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Ruang Kerja</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/surat'))}>
              <Mail className="mr-2 h-4 w-4" />
              <span>Surat Masuk</span>
            </CommandItem>
             <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/surat/upload'))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Buat/Upload Surat</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/tugas'))}>
              <ClipboardCheck className="mr-2 h-4 w-4" />
              <span>Tugas Saya</span>
            </CommandItem>
             <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/logbook'))}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>Logbook</span>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading="Pengaturan">
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/profil'))}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil Saya</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push('/dashboard/profil'))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Pengaturan</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}