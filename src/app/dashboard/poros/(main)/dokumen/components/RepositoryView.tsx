// Lokasi: src/app/dashboard/dokumen/components/RepositoryView.tsx
"use client";

import React from "react";
// [PERBAIKAN] Impor tipe DokumenFolder dan DokumenLink
import { DocumentIconType, RepositoryItem as RepoItemType } from "@/types"; 
import RepositoryItemComponent from "./RepositoryItem";
import { FolderSearch } from "lucide-react";

// [PERBAIKAN] Hapus 'interface Item' lokal yang lama dan salah.
// ... interface Item lama dihapus ...

// [PERBAIKAN] Buat tipe gabungan yang benar
type RepositoryItemCombined = RepoItemType;

interface RepositoryViewProps {
  items: RepositoryItemCombined[]; // [PERBAIKAN] Gunakan tipe yang benar
  loading: boolean;
  viewMode: "grid" | "list";
  onItemClick: (item: RepositoryItemCombined) => void; // [PERBAIKAN] Gunakan tipe yang benar
  // [PERBAIKAN] Hapus onRightClick dari props
  // onItemRightClick: (e: React.MouseEvent, item: RepositoryItemCombined) => void; 
  searchActive: boolean;
}

const RepositoryView: React.FC<RepositoryViewProps> = ({
  items,
  loading,
  viewMode,
  onItemClick,
  // [PERBAIKAN] Hapus onRightClick
  // onItemRightClick,
  searchActive,
}) => {
  if (loading) {
    // Skeleton loading bisa ditambahkan di sini
    return null;
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <FolderSearch className="h-16 w-16" />
        <p className="mt-4 text-lg">
          {searchActive ? "Item tidak ditemukan" : "Folder ini kosong"}
        </p>
        <p className="text-sm">
          {searchActive
            ? "Coba kata kunci lain."
            : "Silakan gunakan Mode Kustomisasi (tombol Pengaturan) untuk menambahkan folder atau link."}
        </p>
      </div>
    );
  }
  
  // Menggunakan div/button sebagai container drag & drop di page.tsx
  // Di sini hanya fokus pada tampilan list/grid item.

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
        {items.map((item) => (
          <div 
            key={item.id} 
            onClick={() => onItemClick(item)}
            className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            {/* Simplified icon for grid view */}
            <div className="text-4xl mb-2">
              {item.tipe === 'folder' ? '📁' : '🔗'}
            </div>
            <div className="text-xs text-center break-all line-clamp-2">
              {item.nama}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item)}
            className="flex items-center w-full p-3 rounded-md bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer text-left"
          >
            {/* Perlu dicatat, RepositoryView versi ini HANYA menampilkan data (Read-only view). 
                Untuk aksi penuh (Rename, Delete, Drag&Drop) di mode list, 
                seharusnya menggunakan komponen RepositoryList.tsx 
            */}
            <RepositoryItemComponent
              item={item}
              canManage={false} // Di view sederhana ini, tidak bisa manage
              canShare={false}
              onClick={() => onItemClick(item)}
              onRename={() => {}}
              onShare={() => {}}
              onDelete={() => {}}
              onCopyLink={() => {}}
              onDragStart={() => {}}
              onDragEnd={() => {}}
              onDropOnFolder={() => {}}
            />
          </button>
        ))}
      </div>
    );
  }

  return null;
};

export default RepositoryView;
