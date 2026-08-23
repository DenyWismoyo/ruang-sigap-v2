# Standarisasi Struktur Direktori & Modul (RUANG SIGAP & POROS)

Dokumen ini mendefinisikan aturan dan struktur hierarki direktori pada aplikasi RUANG SIGAP / POROS untuk memastikan kode tetap modular, bersih, mudah dipelihara (*maintainable*), dan siap diskalakan.

---

## 1. 🗂️ Pengelompokan Route Groups (App Router)

Setiap tenant dashboard (`sigap` dan `poros`) mengelompokkan modulnya ke dalam 3 Route Groups utama:

```
src/app/dashboard/sigap/
├── (main)/          # Modul Operasional Inti Seluruh Pegawai & Pimpinan
│   ├── agenda/
│   ├── arsip/
│   ├── bukti-kinerja/
│   ├── checklist/
│   ├── dokumen/
│   ├── jadwal/
│   ├── logbook/
│   ├── ruang-kerja/
│   ├── surat/
│   ├── surat-keluar/
│   ├── talenta/
│   └── tugas/
│
├── (fungsional)/    # Modul Ekstensi Sektoral / Pelayanan Khusus
│   ├── aset/        # Manajemen Aset & Inventaris
│   ├── keuangan/    # Administrasi Keuangan & Kertas Kerja
│   ├── notulensi/   # Notulensi Rapat & AI Summary
│   ├── pelayanan/   # Loket Pelayanan Publik (KTP, KK, Layanan Umum)
│   ├── skw/         # Surat Keterangan Warga
│   └── tapem/       # Tata Pemerintahan & Kerja Sama Wilayah
│
├── (admin)/         # Modul Konfigurasi, Master Data & Hak Akses
│   ├── form-builder/
│   ├── jabatan/
│   ├── opd/
│   ├── pengumuman/
│   └── users/
│
├── components/      # Komponen Bersama lingkup Dashboard (Header, Navbar, Cards)
├── hooks/           # Custom Hooks SSOT Bersama (useMasterData, useSuratData, useAgendaData)
├── layout.tsx       # Root Dashboard Shell & Shell Wrapper
├── page.tsx         # Operational Workspace Homepage
└── sigap.css        # Scoped Design System Tokens ([data-tenant="sigap"])
```

---

## 2. 📦 Pola Feature Colocation (Struktur Internal Tiap Modul)

Setiap folder modul yang memiliki kompleksitas menengah ke atas **WAJIB** menerapkan prinsip **Feature Colocation**:

```
(main)/talenta/
├── components/      # Komponen visual yang hanya digunakan modul ini
│   ├── NineBoxGrid.tsx
│   ├── AssessmentFormModal.tsx
│   └── PlanCreationModal.tsx
├── tabs/            # Sub-halaman / tab modular
│   ├── NineBoxTab.tsx
│   ├── CompetencyTab.tsx
│   └── MatrixTab.tsx
├── hooks/           # Custom hooks privat jika ada
│   └── useTalentaData.ts
└── page.tsx         # Entry page yang mengonsumsi tabs & components
```

---

## 3. 🌐 Hierarki Shared Layers (Lapisan Bersama)

1. **`src/components/ui/`**: Komponen primitif Shadcn (Button, Dialog, Select, Dropdown, Table, Input, Badge).
   - *Aturan*: Dilarang menaruh logika bisnis atau query database ke folder ini.
2. **`src/context/`**: State reaktif global aplikasi (`AuthContext.tsx`, `ToastContext.tsx`).
3. **`src/lib/`**: Konfigurasi SDK pihak ketiga, Firebase SDK, Helper murni (`firebase.ts`, `utils.ts`, `crypto.ts`).
4. **`src/types/`**: Definisi tipe data TypeScript terpusat (`index.ts`).

---

## 4. 🚫 Larangan & Anti-Pattern

1. **Dilarang**: Menaruh komponen atau modal privat suatu modul ke dalam `src/components/ui/` atau `src/components/showcase/`.
2. **Dilarang**: Mengimpor modul antarmuka `(admin)` ke dalam `(main)` secara sirkular.
3. **Dilarang**: Membuat file helper/utility acak di dalam folder `src/app/` jika bukan merupakan file rute resmi Next.js (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
4. **Dilarang**: Membiarkan file duplikat/legacy tanpa referensi; selalu hapus atau delegasikan ke implementasi SSOT bersama.
