# Standarisasi Datetime & Lokalisasi Indonesia (RUANG SIGAP)

Semua tanggal dan waktu yang ditampilkan kepada pengguna **WAJIB** dalam format Bahasa Indonesia yang konsisten. Tidak boleh ada format tanggal berbahasa Inggris atau format yang tidak konsisten di seluruh aplikasi.

---

## 1. 🕐 Konversi Timestamp Firestore

`Timestamp` dari Firestore **WAJIB** selalu dikonversi menggunakan `.toDate()` sebelum diformat. Jangan pernah langsung format Timestamp sebagai string.

```tsx
import { Timestamp } from 'firebase/firestore';

// ❌ DILARANG — Timestamp bukan Date
const tanggal = surat.tanggalDiterima.toString(); // "[object Object]"
const tanggal = surat.tanggalDiterima.toDate; // Ini adalah fungsi, bukan string!

// ✅ WAJIB — Konversi ke Date dulu
const tanggal = surat.tanggalDiterima?.toDate(); // Dapat Date object
```

---

## 2. 📅 Fungsi Format Standar — Gunakan Dari `src/lib/utils.ts`

**Jangan buat fungsi format tanggal baru!** Gunakan fungsi yang sudah ada:

```tsx
import { formatDateRelative } from '@/lib/utils';

// ✅ formatDateRelative: Relatif dalam Bahasa Indonesia
// Hasil: "Baru saja" / "5 menit yang lalu" / "Kemarin, 14:30" / "24 Agustus 2026"
const tampilan = formatDateRelative(surat.tanggalDiterima); // Terima Timestamp langsung
```

---

## 3. 🗓️ Format Standar Per Konteks

Gunakan `Intl.DateTimeFormat` dengan locale `'id-ID'` dan timezone `'Asia/Jakarta'`:

```tsx
// ✅ Helper standar yang WAJIB digunakan
const LOCALE = 'id-ID';
const TZ = { timeZone: 'Asia/Jakarta' };

// FORMAT 1: Tanggal pendek (untuk timestamp kartu/list)
// Hasil: "24 Agu 2026"
const formatTanggalPendek = (date: Date) =>
  new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric', ...TZ }).format(date);

// FORMAT 2: Tanggal panjang (untuk header detail, laporan)
// Hasil: "Minggu, 24 Agustus 2026"
const formatTanggalPanjang = (date: Date) =>
  new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', ...TZ }).format(date);

// FORMAT 3: Tanggal + Waktu (untuk log aktivitas, notifikasi)
// Hasil: "24 Agustus 2026, 14.30 WIB"
const formatTanggalWaktu = (date: Date) =>
  new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, ...TZ }).format(date) + ' WIB';

// FORMAT 4: Waktu saja (untuk agenda, jadwal)
// Hasil: "14:30"
const formatWaktu = (date: Date) =>
  new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false, ...TZ }).format(date);

// FORMAT 5: Input form (YYYY-MM-DD)
// Hasil: "2026-08-24"
const formatUntukInput = (date: Date) => date.toISOString().split('T')[0];

// FORMAT 6: Nama Bulan saja
// Hasil: "Agustus 2026"
const formatBulanTahun = (date: Date) =>
  new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric', ...TZ }).format(date);
```

---

## 4. 📋 Contoh Penggunaan Lengkap di Komponen

```tsx
// ✅ Pola lengkap yang benar
function SuratCard({ surat }: { surat: SuratMasuk }) {
  // Konversi sekali di komponen, jangan di JSX
  const tanggalDiterima = surat.tanggalDiterima?.toDate?.();
  
  return (
    <div className="sg-list-card p-3">
      <p className="text-sm font-semibold">{surat.perihal}</p>
      
      {/* ✅ Tampilan relatif untuk list (singkat, informatif) */}
      <p className="text-[10px] text-muted-foreground">
        {tanggalDiterima ? formatDateRelative(surat.tanggalDiterima) : '-'}
      </p>
      
      {/* ✅ Tanggal lengkap di tooltip / detail */}
      {tanggalDiterima && (
        <span title={formatTanggalWaktu(tanggalDiterima)}>
          {formatTanggalPendek(tanggalDiterima)}
        </span>
      )}
    </div>
  );
}
```

---

## 5. 🕐 Standar Logbook & Laporan: Tanggal di WIB

Untuk dokumen logbook (`logbook/{userId}_{YYYY-MM-DD}`), ID dokumen menggunakan format tanggal WIB yang konsisten:

```typescript
// ✅ Cara aman generate docId logbook (sudah diimplementasikan di logbookUtils.ts)
// Gunakan fungsi yang sudah ada, JANGAN buat sendiri
import { writeLogbookEntry } from '@/lib/logbookUtils';

// Tanggal WIB: ambil dari server atau gunakan metode yang sudah teruji
const dateStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD" (bisa perlu penyesuaian timezone)
const docId = `${userId}_${dateStr}`; // Format: "abc123_2026-08-24"
```

---

## 6. 🚫 Anti-Pattern Tanggal yang Dilarang

| Anti-Pattern | Output Buruk | Solusi |
|-------------|-------------|--------|
| `new Date().toString()` | `"Mon Aug 24 2026 ..."` (Inggris) | Gunakan `Intl.DateTimeFormat('id-ID')` |
| `date.toLocaleDateString()` | Bergantung locale browser user | Selalu eksplisit `'id-ID'` |
| Timestamp Firestore langsung ke string | `"[object Object]"` | `.toDate()` dulu |
| `Timestamp.now()` di client | Clock skew | Gunakan `serverTimestamp()` |
| Format tanggal hardcode `"${day}/${month}/${year}"` | Tidak konsisten | Gunakan `Intl.DateTimeFormat` |
| Tampilkan tanggal dalam bahasa Inggris | `"August 24, 2026"` | Selalu `locale: 'id-ID'` |
