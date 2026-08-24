# Standarisasi Form, Validasi & Zod Schema (RUANG SIGAP)

Setiap form input yang melibatkan data pengguna **WAJIB** mengikuti standar ini. Tidak boleh ada form ad-hoc tanpa skema validasi.

---

## 1. ✅ WAJIB: Zod Schema untuk Semua Form

**Dilarang** membuat form tanpa definisi skema Zod. Zod adalah sumber kebenaran tunggal untuk validasi dan inferensi tipe form.

```tsx
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// ✅ 1. Definisikan schema Zod SEBELUM komponen
const suratSchema = z.object({
  perihal: z.string().min(5, 'Perihal minimal 5 karakter').max(200, 'Perihal maksimal 200 karakter'),
  nomorSurat: z.string().min(1, 'Nomor surat wajib diisi'),
  pengirim: z.string().min(3, 'Nama pengirim minimal 3 karakter'),
  tanggalSurat: z.string().min(1, 'Tanggal surat wajib dipilih'),
  jenisSurat: z.enum(['Undangan', 'Pemberitahuan', 'Permohonan', 'Lainnya'], {
    required_error: 'Jenis surat wajib dipilih',
  }),
  sifatSurat: z.enum(['Biasa', 'Penting', 'Segera', 'Rahasia']).default('Biasa'),
  keterangan: z.string().optional(),
});

// ✅ 2. Tipe otomatis terinfer — JANGAN buat interface manual
type SuratFormValues = z.infer<typeof suratSchema>;
```

---

## 2. 🎯 Pola React Hook Form + Zod (Template Standar)

```tsx
export function FormSuratMasuk({ onSuccess }: { onSuccess: () => void }) {
  const { userProfile } = useUserAuth();
  const { addToast } = useToast();
  
  // ✅ zodResolver menghubungkan RHF dengan schema Zod
  const form = useForm<SuratFormValues>({
    resolver: zodResolver(suratSchema),
    defaultValues: {
      perihal: '',
      nomorSurat: '',
      pengirim: '',
      tanggalSurat: new Date().toISOString().split('T')[0],
      jenisSurat: 'Pemberitahuan',
      sifatSurat: 'Biasa',
    },
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue } = form;

  // ✅ onSubmit menerima data yang sudah tervalidasi dan bertipe benar
  const onSubmit = async (data: SuratFormValues) => {
    try {
      await simpanSurat({ ...data, opdId: userProfile!.opdId });
      addToast({ type: 'success', title: 'Berhasil', message: 'Surat berhasil disimpan.' });
      reset();
      onSuccess();
    } catch (error) {
      addToast({ type: 'error', title: 'Gagal', message: 'Surat tidak dapat disimpan.' });
    }
    // ⚠️ isSubmitting otomatis kembali false setelah onSubmit selesai
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Field dengan error message */}
      <div>
        <label className="text-sm font-medium">Perihal Surat</label>
        <input
          {...register('perihal')}
          className="w-full h-9 border border-input rounded-[var(--radius)] px-3 text-sm"
          placeholder="Perihal surat masuk..."
        />
        {errors.perihal && (
          <p className="text-xs text-destructive mt-1">{errors.perihal.message}</p>
        )}
      </div>

      {/* ✅ Tombol submit WAJIB disabled saat isSubmitting */}
      <Button type="submit" disabled={isSubmitting} className="sg-btn sg-btn-primary w-full">
        {isSubmitting ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>
        ) : 'Simpan Surat'}
      </Button>
    </form>
  );
}
```

---

## 3. 📋 Standar Pesan Error Validasi (Bahasa Indonesia)

Semua pesan error validasi **WAJIB** dalam Bahasa Indonesia yang ramah pengguna:

```tsx
// ✅ Pesan standar yang baik
z.string().min(1, 'Kolom ini wajib diisi')
z.string().min(5, 'Minimal 5 karakter')
z.string().max(200, 'Maksimal 200 karakter')
z.string().email('Format email tidak valid')
z.string().regex(/^\d{18}$/, 'NIP harus terdiri dari 18 digit angka')
z.enum(['a', 'b'], { required_error: 'Pilih salah satu opsi' })
z.number().min(1, 'Nilai minimal adalah 1')
z.number().max(100, 'Nilai maksimal adalah 100')

// ❌ Pesan yang DILARANG (bahasa mesin/inggris default)
z.string().min(1) // Akan muncul "String must contain at least 1 character(s)"
```

---

## 4. 🔒 Standar Field Wajib vs Opsional

```tsx
const schema = z.object({
  // Wajib diisi
  perihal: z.string().min(1, 'Perihal wajib diisi'),
  opdId: z.string(),
  
  // Opsional — gunakan .optional() atau .nullable()
  keterangan: z.string().optional(),          // undefined OK
  fileUrl: z.string().url().nullable(),       // null OK
  batasWaktu: z.date().nullable().optional(), // null atau undefined OK
  
  // Opsional dengan default
  sifatSurat: z.enum(['Biasa', 'Penting']).default('Biasa'),
});
```

---

## 5. 📁 Validasi Upload File

```tsx
const fileUploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'File wajib diunggah' })
    .refine(f => f.size <= 10 * 1024 * 1024, 'Ukuran file maksimal 10MB')
    .refine(f => ['application/pdf', 'image/jpeg', 'image/png'].includes(f.type), 
      'Format file harus PDF, JPG, atau PNG'),
  nama: z.string().min(1, 'Nama file wajib diisi'),
});
```

---

## 6. 🚫 Anti-Pattern Form yang Dilarang

| Anti-Pattern | Aturan |
|-------------|--------|
| State `useState` untuk setiap field form | Gunakan `useForm` dari RHF |
| Validasi manual `if (!perihal)` | Gunakan Zod + zodResolver |
| Pesan error dalam Bahasa Inggris | Selalu gunakan Bahasa Indonesia |
| Submit button TIDAK disabled saat loading | Wajib `disabled={isSubmitting}` |
| Type form dibuat manual (interface FormData) | Gunakan `z.infer<typeof schema>` |
| `e.preventDefault()` manual | Gunakan `handleSubmit(onSubmit)` dari RHF |
