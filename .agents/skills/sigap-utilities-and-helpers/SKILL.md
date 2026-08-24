---
name: sigap-utilities-and-helpers
description: Katalog lengkap fungsi utilitas yang sudah ada di src/lib/ — formatters, date helpers, string utils, image compression, dan cn(). Gunakan sebelum membuat fungsi helper baru untuk memastikan tidak reinvent the wheel.
---

# Katalog Utilitas & Helper — RUANG SIGAP

**Selalu periksa katalog ini sebelum membuat fungsi helper baru!** Semua fungsi di bawah ini sudah ada, teruji, dan siap pakai.

---

## 📁 `src/lib/utils.ts` — Utilitas Utama

```typescript
import { cn, formatDateRelative, getInitials, compressImage } from '@/lib/utils';
```

### `cn(...inputs)` — Class Merging (shadcn/ui)
```tsx
// Menggabungkan class Tailwind dengan benar, override yang konflik
<div className={cn("base-class", isActive && "active-class", className)} />
```

### `formatDateRelative(timestamp: Timestamp)` — Tanggal Relatif Indonesia
```tsx
// Input: Firestore Timestamp
// Output: "Baru saja" / "5 menit yang lalu" / "Kemarin, 14:30" / "24 Agustus 2026"
<span>{formatDateRelative(surat.tanggalDiterima)}</span>
```

### `getInitials(name: string)` — Inisial Avatar
```tsx
// Input: "Budi Santoso" → Output: "BS"
// Input: "Ahmad" → Output: "A"
<Avatar><AvatarFallback>{getInitials(userProfile.namaLengkap)}</AvatarFallback></Avatar>
```

### `compressImage(file, quality?, maxWidth?)` — Kompresi Gambar
```tsx
// Kompresi sebelum upload ke Firebase Storage
// Default: quality=0.7, maxWidth=1280px, output JPEG
const compressed = await compressImage(file, 0.75, 1920);
await uploadBytes(storageRef, compressed);
```

---

## 📁 `src/lib/formatters.ts` — Format Data

```typescript
import { formatCurrency, formatRelativeTime, formatScore, getScoreColor, generateChartGradient } from '@/lib/formatters';
```

### `formatCurrency(value, currency?)` — Format Rupiah
```tsx
// Input: 1500000 → Output: "Rp 1.500.000"
<span>{formatCurrency(anggaran)}</span>
<span>{formatCurrency(usd_value, 'USD')}</span>
```

### `formatScore(score, max?)` — Format Skor Persentase
```tsx
// Input: (78, 100) → Output: "78/100 (78%)"
<span>{formatScore(capaian, targetKinerja)}</span>
```

### `getScoreColor(score, max?)` — Warna Berdasarkan Skor
```tsx
// >= 70% → 'emerald', >= 40% → 'amber', < 40% → 'rose'
const color = getScoreColor(nilai, 100);
<span className={`text-${color}-600`}>{nilai}%</span>
```

---

## 📁 `src/lib/logbookUtils.ts` — Logbook Harian

```typescript
import { writeLogbookEntry, updateLogbook } from '@/lib/logbookUtils';
```

Lihat skill `sigap-logbook-and-activity` untuk panduan lengkap.

---

## 📁 `src/lib/activityLogger.ts` — Jejak Audit Surat

```typescript
import { logActivity } from '@/lib/activityLogger';
```

Lihat skill `sigap-logbook-and-activity` untuk panduan lengkap.

---

## 📁 `src/lib/offlineSync.ts` — Antrian Offline (IndexedDB)

```typescript
import { savePendingSurat, getPendingSuratUploads, deletePendingSuratUpload } from '@/lib/offlineSync';

// Simpan surat ke antrian saat offline
await savePendingSurat(suratData, fileObject);

// Cek antrian yang belum tersinkron
const pending = await getPendingSuratUploads();
```

---

## 📁 `src/lib/firebase-messaging.ts` — FCM Token

```typescript
import { getFCMToken } from '@/lib/firebase-messaging';

// Minta izin dan dapatkan FCM token (dipanggil sekali di layout.tsx setelah login)
const token = await getFCMToken(); // null jika izin ditolak
```

---

## 📁 `src/lib/whatsapp.ts` — Notifikasi WhatsApp

```typescript
import { sendWhatsAppMessage } from '@/lib/whatsapp';

// Kirim notif via WhatsApp (menggunakan nomor nomorWa dari UserProfile)
await sendWhatsAppMessage(nomorWa, `Surat baru: ${surat.perihal}`);
```

---

## 📁 `src/lib/nk-motion.ts` — Variasi Animasi POROS

```typescript
import { nkFadeUp, nkSlideIn, nkStagger } from '@/lib/nk-motion';

// Gunakan untuk motion.div di halaman POROS (Framer Motion)
<motion.div variants={nkFadeUp} initial="hidden" animate="visible">
```

---

## 📁 `src/lib/pdfGenerator.ts` — Generate PDF

```typescript
import { generateSuratPdf, generateLaporanPdf } from '@/lib/pdfGenerator';

// Generate dan download PDF laporan
const pdfBlob = await generateLaporanPdf(data);
const url = URL.createObjectURL(pdfBlob);
window.open(url); // Buka di tab baru
```

---

## 🚫 Anti-Pattern Utilitas

| Anti-Pattern | Solusi |
|-------------|--------|
| `new Date().toLocaleDateString()` | Gunakan `formatDateRelative()` |
| `name.charAt(0)` untuk avatar | Gunakan `getInitials(name)` |
| Upload gambar tanpa kompresi | Gunakan `compressImage()` sebelum upload |
| Buat fungsi format rupiah sendiri | Gunakan `formatCurrency()` |
| `twMerge(clsx(...))` manual | Gunakan `cn()` yang sudah ada |
