# Aturan Pengembangan Frontend (RUANG SIGAP & POROS)

Dokumen ini mendefinisikan aturan dan guardrail mutlak untuk pengembangan antarmuka pengguna pada proyek RUANG SIGAP / POROS.

---

## 1. ⚛️ Strict React Hooks Placement (Rules of Hooks)

- **Invarian Mutlak**: Semua pemanggilan React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useContext`, `useToast`, `usePathname`, `useRouter`, serta custom hooks lainnya) **WAJIB** dideklarasikan secara mutlak di bagian paling atas fungsi komponen.
- **Dilarang Keras**:
  - Menempatkan hook di dalam blok kondisi (`if (...) { useMemo(...) }`).
  - Menempatkan hook setelah baris *early return* (misal: pengecekan `if (loading) return <Loader />` atau `if (!userProfile) return null`).
- **Pola Penulisan yang Benar**:
  ```tsx
  export default function MyComponent() {
    // 1. Semua Hooks di paling atas
    const { userProfile, loading } = useUserAuth();
    const [state, setState] = useState(null);
    const router = useRouter();
    const { addToast } = useToast();
    const memoizedData = useMemo(() => computeData(state), [state]);

    // 2. Early return / Guard clause setelah deklarasi hooks
    if (loading) return <LoadingSpinner />;
    if (!userProfile) return <AccessDenied />;

    // 3. Render JSX utama
    return <div>...</div>;
  }
  ```

---

## 2. ⚡ Standarisasi Verifikasi Kode & Next.js 16

- **Type Checking**: Jalankan `npx tsc --noEmit` untuk memvalidasi tipe TypeScript.
- **Linter**: Jalankan `npm run lint -- --quiet` (menjalankan ESLint Flat Config `eslint.config.mjs`).
- **Catatan Next.js 16**: Perintah CLI `next lint` telah dihapus di Next.js 16. Selalu gunakan script `npm run lint` yang memanggil `eslint src`.

---

## 3. 🔑 Standarisasi Auth Context

- Import hook autentikasi dari `@/context/AuthContext`:
  ```tsx
  import { useUserAuth, useAuth } from '@/context/AuthContext';
  ```
  `useAuth` merupakan alias resmi dari `useUserAuth`.

---

## 4. 📱 Standarisasi Antarmuka Mobile & Borderless

- **Header Halaman**: Setiap halaman menu utama/fungsional di dashboard SIGAP wajib menggunakan komponen terpadu:
  ```tsx
  <SigapPageHeader
    title="Judul Halaman"
    icon={LucideIcon}
    description="Deskripsi singkat modul."
    actions={<Button>Aksi</Button>}
  />
  ```
- **Pola Kartu Borderless di Ponsel**:
  - Gunakan class `.sg-mobile-borderless` atau responsive utility:
    `border-x-0 border-t-0 rounded-none shadow-none md:border md:rounded-[var(--radius)] md:shadow-sm`
- **Bottom Navigation Clearance**:
  - Seluruh wrapper halaman wajib memiliki padding bawah aman:
    `pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-6`
