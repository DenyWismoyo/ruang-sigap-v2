# Aturan TypeScript Strict & Type Safety (RUANG SIGAP)

Dokumen ini mendefinisikan guardrail mutlak untuk penggunaan TypeScript yang benar, aman, dan konsisten di seluruh proyek RUANG SIGAP / POROS.

---

## 1. 🚫 Dilarang Keras: `any` Type

- **Dilarang keras** menggunakan `any` sebagai tipe di seluruh codebase kecuali untuk field Firestore `Timestamp` pada definisi interface (karena masalah kompatibilitas Firebase SDK).
- Jika tipe belum diketahui, gunakan `unknown` lalu lakukan narrowing yang eksplisit.
- Jika ada alasan sah untuk `any`, wajib tambahkan komentar `// eslint-disable-next-line @typescript-eslint/no-explicit-any` dan jelaskan alasannya di baris atasnya.

**❌ Salah:**
```tsx
const handleData = (data: any) => { ... };
const result: any = await fetchSomething();
```

**✅ Benar:**
```tsx
const handleData = (data: SuratMasuk) => { ... };
const result: Disposisi = await fetchDisposisi();
```

---

## 2. 📦 Sumber Kebenaran Tipe (SSOT Types)

### Frontend (`src/`)
- Semua tipe data domain aplikasi **WAJIB** diimpor dari `@/types` (alias ke `src/types/index.ts`).
- **Jangan pernah** mendefinisikan ulang tipe yang sudah ada di `src/types/index.ts`.

```tsx
// ✅ Pola Import yang Benar
import { UserProfile, Jabatan, SuratMasuk, Disposisi, TindakLanjut, OpdConfig, Tugas } from '@/types';
```

### Backend (`functions/src/`)
- Tipe domain diimpor dari `functions/src/types/index.ts`.
- Tipe bersama yang dibutuhkan frontend & backend HARUS diletakkan di `src/types/index.ts` (frontend sebagai sumber kebenaran).

---

## 3. ✅ Wajib: Penambahan Tipe Baru

Ketika membuat fitur baru yang memerlukan tipe baru:
1. **Selalu tambahkan** ke `src/types/index.ts` (frontend).
2. **Mirror** ke `functions/src/types/index.ts` jika backend juga membutuhkannya.
3. **Jangan** buat file tipe inline di dalam komponen atau halaman.
4. Gunakan `export interface` untuk tipe objek, `export type` untuk union/alias.

```tsx
// ✅ Contoh: Tambahkan ke src/types/index.ts
export interface NomoranSurat {
  id: string;
  kode: string;
  nomor: number;
  tahun: number;
  opdId: string;
  createdAt: Timestamp;
}
```

---

## 4. 🎯 Tipe Kunci yang Wajib Dikenali

| Tipe | File | Keterangan |
|------|------|------------|
| `UserProfile` | `src/types/index.ts` | Profil lengkap pengguna |
| `Jabatan` | `src/types/index.ts` | Struktur jabatan birokrasi |
| `SuratMasuk` | `src/types/index.ts` | Dokumen surat masuk |
| `Disposisi` | `src/types/index.ts` | Rantai disposisi |
| `TindakLanjut` | `src/types/index.ts` | Laporan tindak lanjut |
| `Tugas` | `src/types/index.ts` | Item manajemen tugas |
| `OpdConfig` | `src/types/index.ts` | Konfigurasi paket & fitur OPD |
| `AppTheme` | `src/types/index.ts` | `'sigap' \| 'poros'` |
| `FunctionalRole` | `src/types/index.ts` | Role fungsional tambahan |

---

## 5. 📋 Pola Zod Schema untuk Form

Untuk semua form input yang melibatkan data dari pengguna, **wajib** menggunakan Zod untuk validasi dan inferensi tipe:

```tsx
import { z } from 'zod';

const suratSchema = z.object({
  perihal: z.string().min(5, 'Perihal minimal 5 karakter'),
  nomorSurat: z.string().min(1, 'Nomor surat wajib diisi'),
  tanggalSurat: z.string(),
  jenisSurat: z.enum(['Biasa', 'Penting', 'Segera', 'Rahasia']),
});

// Tipe otomatis terinfer dari schema Zod
type SuratFormValues = z.infer<typeof suratSchema>;
```

---

## 6. 🔐 Tipe AuthContext

Akses data autentikasi **WAJIB** menggunakan hook dari `@/context/AuthContext`:

```tsx
import { useUserAuth } from '@/context/AuthContext';

export default function MyComponent() {
  const { userProfile, jabatanProfile, actingJabatanProfile, opdConfig, loading } = useUserAuth();

  // WAJIB: Guard clause setelah hook
  if (loading) return <LoadingSpinner />;
  if (!userProfile) return null;
  
  // Tipe sudah dijamin: UserProfile | null
  const opdId: string = userProfile.opdId;
}
```

Properti kunci dari `useUserAuth()`:
| Properti | Tipe | Keterangan |
|----------|------|------------|
| `userProfile` | `UserProfile \| null` | Data profil pengguna |
| `jabatanProfile` | `Jabatan \| null` | Jabatan utama |
| `actingJabatanProfile` | `Jabatan \| null` | Jabatan aktif (bisa PLT) |
| `opdConfig` | `OpdConfig \| null` | Konfigurasi & fitur OPD |
| `loading` | `boolean` | Sedang fetch data |
| `initializing` | `boolean` | Firebase SDK belum siap |

---

## 7. ⚡ Wajib: Verifikasi TypeScript Sebelum Commit

Jalankan perintah berikut sebelum setiap commit atau push:

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint -- --quiet

# Keduanya sekaligus
npx tsc --noEmit && npm run lint -- --quiet
```

Jika ada error TypeScript, **WAJIB** diperbaiki sebelum melanjutkan. Jangan menggunakan `@ts-ignore` atau `@ts-expect-error` tanpa komentar justifikasi yang jelas.
