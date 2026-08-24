# Aturan Error Handling, Sentry & User Feedback (RUANG SIGAP)

Dokumen ini mendefinisikan standar penanganan error di seluruh lapisan aplikasi (frontend dan backend) agar pengguna selalu mendapat feedback yang jelas dan tim developer dapat melacak masalah secara efisien.

---

## 1. 🛡️ Frontend: Setiap Operasi Async WAJIB try/catch

Semua pemanggilan fungsi async yang bisa gagal (operasi Firestore, Cloud Function, API eksternal) **WAJIB** dibungkus dengan blok `try/catch`.

**❌ DILARANG — Async tanpa try/catch:**
```tsx
const handleSubmit = async () => {
  await addDoc(collection(db, 'surat'), data); // ❌ Jika gagal, silent error!
};
```

**✅ WAJIB — Selalu gunakan try/catch:**
```tsx
const handleSubmit = async () => {
  setIsLoading(true);
  try {
    await addDoc(collection(db, 'surat'), data);
    addToast({ type: 'success', title: 'Berhasil', message: 'Surat berhasil disimpan.' });
  } catch (error) {
    console.error('[handleSubmit] Error menyimpan surat:', error);
    addToast({ type: 'error', title: 'Gagal', message: 'Terjadi kesalahan. Coba lagi.' });
    Sentry.captureException(error);
  } finally {
    setIsLoading(false);
  }
};
```

---

## 2. 🔔 Wajib: Feedback via Toast Notification

Setiap operasi yang berhasil atau gagal **WAJIB** memberikan feedback ke pengguna melalui `addToast`. Jangan hanya mengandalkan `console.log` atau `console.error`.

Gunakan hook toast dari context:
```tsx
import { useToast } from '@/context/ToastContext'; // atau alias yang tersedia

const { addToast } = useToast();
```

### Standar Pesan Toast

| Skenario | Type | Title | Message |
|----------|------|-------|---------|
| Operasi berhasil | `'success'` | `'Berhasil'` | Deskripsi spesifik aksi |
| Error dari server | `'error'` | `'Gagal'` | Pesan error yang ramah |
| Validasi gagal | `'warning'` | `'Perhatian'` | Field yang perlu diperbaiki |
| Info umum | `'info'` | `'Info'` | Informasi kontekstual |

```tsx
// ✅ Contoh pesan yang informatif (bukan generik)
addToast({ type: 'success', title: 'Disposisi Terkirim', message: `Surat "${surat.perihal}" telah didisposisikan ke ${targetNames.join(', ')}.` });

addToast({ type: 'error', title: 'Gagal Kirim Disposisi', message: 'Pilih minimal satu penerima disposisi.' });
```

---

## 3. ⚡ Loading State: WAJIB untuk Semua Operasi Async

Setiap operasi async yang diinisiasi oleh aksi pengguna (klik tombol, submit form) **WAJIB** memiliki state loading dan menonaktifkan tombol selama proses berlangsung:

```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

// ✅ Pola Standar
<Button 
  onClick={handleSubmit} 
  disabled={isSubmitting}  // ✅ Nonaktifkan saat loading
  className="..."
>
  {isSubmitting ? (
    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...</>
  ) : (
    'Simpan'
  )}
</Button>
```

---

## 4. 🎯 Backend: Throw `HttpsError`, Bukan `Error` Biasa

Di Cloud Functions, **selalu** gunakan `HttpsError` dari `firebase-functions/v2/https` dengan kode error yang bermakna. Jangan melempar `new Error()` biasa karena pesan-nya tidak akan sampai ke client dengan format yang benar.

**❌ DILARANG:**
```typescript
throw new Error('User tidak memiliki akses');
```

**✅ WAJIB:**
```typescript
import { HttpsError } from 'firebase-functions/v2/https';

// Kode error yang tersedia: unauthenticated, permission-denied,
// not-found, invalid-argument, resource-exhausted, internal
throw new HttpsError('permission-denied', 'Anda tidak memiliki akses untuk aksi ini.');
throw new HttpsError('not-found', `Surat dengan ID ${suratId} tidak ditemukan.`);
throw new HttpsError('invalid-argument', 'Parameter `opdId` wajib diisi.');
throw new HttpsError('resource-exhausted', `Tunggu ${remainingSeconds} detik sebelum mencoba lagi.`);
```

---

## 5. 📊 Sentry: Capture Error Production-Critical

Gunakan Sentry untuk melaporkan error yang berdampak pada data atau alur utama bisnis.

```tsx
import * as Sentry from '@sentry/nextjs';

// ✅ Capture dengan konteks (lebih mudah di-debug)
try {
  await kirimDisposisi(surat, targets);
} catch (error) {
  Sentry.captureException(error, {
    tags: { module: 'disposisi', action: 'kirimDisposisi' },
    extra: { suratId: surat.id, targetCount: targets.length, opdId: userProfile.opdId },
  });
  addToast({ type: 'error', title: 'Gagal', message: 'Disposisi tidak terkirim.' });
}
```

### Kapan Harus Sentry.captureException()
- ✅ Operasi write Firestore yang gagal (surat, disposisi, tindak lanjut)
- ✅ Cloud Function call yang mengembalikan error
- ✅ Error autentikasi yang tidak terduga
- ✅ FCM token registration failure
- ❌ Error validasi form (expected, bukan exception)
- ❌ Pengguna membatalkan upload (expected behavior)

---

## 6. 🌐 Penanganan Error dari Cloud Function (Frontend)

Saat memanggil Cloud Function via `callCloudFunction`, parse pesan error dengan benar:

```tsx
import { callCloudFunction } from '@/lib/firebase';

try {
  const result = await callCloudFunction('extractSuratDataAIV2', { fileBase64: '...' });
  return result.data;
} catch (error: any) {
  // Cloud Function HttpsError memiliki properti .code dan .message
  const errorCode = error?.code;
  const errorMessage = error?.message || 'Terjadi kesalahan tidak diketahui.';
  
  if (errorCode === 'resource-exhausted') {
    addToast({ type: 'warning', title: 'Rate Limit', message: errorMessage });
  } else if (errorCode === 'unauthenticated') {
    addToast({ type: 'error', title: 'Sesi Berakhir', message: 'Silakan login kembali.' });
  } else {
    addToast({ type: 'error', title: 'Gagal Memproses', message: errorMessage });
    Sentry.captureException(error);
  }
}
```

---

## 7. 📋 Error Boundary untuk Halaman Utama

Setiap halaman dashboard utama **HARUS** memiliki `error.tsx` yang menangkap error rendering tak terduga:

```tsx
// src/app/dashboard/sigap/(main)/surat/error.tsx
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SuratError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <p className="text-muted-foreground">Terjadi kesalahan saat memuat halaman.</p>
      <button onClick={reset} className="sg-btn-primary">Coba Lagi</button>
    </div>
  );
}
```

---

## 8. 🚫 Anti-Pattern yang Dilarang

| Anti-Pattern | Aturan |
|-------------|--------|
| `console.error(error)` tanpa feedback UI | Selalu tambahkan `addToast` bersamaan |
| `catch (e) {}` kosong (swallow error) | Minimal log + toast, wajib Sentry jika production |
| Toast tanpa pesan yang spesifik | Pesan harus menjelaskan apa yang gagal |
| Re-throw error tanpa cleanup `setIsLoading(false)` | Gunakan blok `finally` untuk reset state |
| `throw new Error()` di Cloud Function | Gunakan `HttpsError` dengan kode yang tepat |
