"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  MASTER_AKTIVITAS_SOLO, 
  AktivitasSolo, 
  searchAktivitasSolo, 
  getAktivitasSoloById, 
  TOP_AKTIVITAS_PERSURATAN 
} from '@/data/masterAktivitasSolo';
import { Search, Check, ChevronDown, Sparkles, X, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface AktivitasComboboxProps {
  value?: number;
  onChange: (aktivitas: AktivitasSolo | undefined) => void;
  placeholder?: string;
  className?: string;
  tenant?: 'sigap' | 'poros';
  showQuickPills?: boolean;
}

export const AktivitasCombobox: React.FC<AktivitasComboboxProps> = ({
  value,
  onChange,
  placeholder = "Pilih aktivitas resmi BKPSDM Solo...",
  className,
  tenant = 'sigap',
  showQuickPills = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAktivitas = useMemo(() => {
    return value ? getAktivitasSoloById(value) : undefined;
  }, [value]);

  const filteredList = useMemo(() => {
    return searchAktivitasSolo(query).slice(0, 30);
  }, [query]);

  const quickPillItems = useMemo(() => {
    return TOP_AKTIVITAS_PERSURATAN.map(id => getAktivitasSoloById(id)).filter(Boolean) as AktivitasSolo[];
  }, []);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: AktivitasSolo) => {
    onChange(item);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
    setQuery('');
  };

  const isPoros = tenant === 'poros';
  const accentBorder = isPoros ? 'focus-within:border-teal-500' : 'focus-within:border-blue-500';
  const activeBg = isPoros ? 'bg-teal-50 dark:bg-teal-950/30' : 'bg-blue-50 dark:bg-blue-950/30';
  const activeText = isPoros ? 'text-teal-700 dark:text-teal-300' : 'text-blue-700 dark:text-blue-300';
  const badgeColor = isPoros ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300';

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {/* Quick Pills (Sering Digunakan) */}
      {showQuickPills && !selectedAktivitas && (
        <div className="mb-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            <Sparkles size={12} className={isPoros ? "text-teal-600" : "text-blue-600"} />
            <span className="font-medium">Paling sering digunakan:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
            {quickPillItems.slice(0, 6).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-md border transition-all text-left truncate max-w-[240px]",
                  "border-border bg-card/70 hover:bg-accent hover:border-foreground/20 text-muted-foreground hover:text-foreground"
                )}
                title={`${item.nama} (${item.nilaiPoin} Poin - ${item.satuan})`}
              >
                <span className="font-medium">{item.nama}</span>
                <span className="ml-1 opacity-75 font-mono text-[10px]">+{item.nilaiPoin}p</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Trigger Box / Input Field */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={cn(
          "w-full min-h-[42px] px-3 py-2 rounded-lg border bg-background text-sm flex items-center justify-between cursor-pointer transition-all",
          "border-input hover:border-foreground/30",
          isOpen && accentBorder,
          selectedAktivitas && "bg-accent/30"
        )}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {selectedAktivitas ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full shrink-0", badgeColor)}>
                +{selectedAktivitas.nilaiPoin} Poin
              </span>
              <span className="font-medium text-foreground truncate">
                {selectedAktivitas.nama}
              </span>
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                ({selectedAktivitas.satuan})
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selectedAktivitas && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Hapus pilihan"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={cn("text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl p-2 animate-in fade-in-0 zoom-in-95">
          {/* Search Input */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik kata kunci aktivitas (cth: naskah, koordinasi, rapat)..."
              className="pl-8 h-9 text-xs"
            />
          </div>

          {/* Results List */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {filteredList.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Tidak ada aktivitas yang cocok dengan kata kunci &quot;{query}&quot;.
              </div>
            ) : (
              filteredList.map((item) => {
                const isSelected = selectedAktivitas?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "w-full text-left p-2 rounded-lg flex items-start justify-between gap-3 text-xs transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      isSelected && activeBg && activeText
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-foreground text-[12px]">{item.nama}</span>
                        {item.kategori && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal uppercase">
                            {item.kategori}
                          </Badge>
                        )}
                      </div>
                      {item.keterangan && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {item.keterangan}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                        Satuan: <span className="font-medium text-foreground/80">{item.satuan}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-center">
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs text-foreground">
                          {item.nilaiPoin}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-0.5">pts</span>
                      </div>
                      {isSelected && <Check size={14} className={isPoros ? "text-teal-600" : "text-blue-600"} />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-2 mt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground px-1">
            <span>Menampilkan {filteredList.length} dari {MASTER_AKTIVITAS_SOLO.length} aktivitas resmi</span>
            <span className="font-medium">Kepwal 786/154/2020</span>
          </div>
        </div>
      )}
    </div>
  );
};
