---
name: sigap-logbook-and-activity
description: Panduan kapan dan bagaimana memanggil writeLogbookEntry() dan logActivity() dari src/lib/logbookUtils.ts dan activityLogger.ts. Gunakan saat membuat fitur aksi baru (disposisi, tindak lanjut, tugas, booking) agar jejak audit otomatis tercatat.
---

# Logbook Harian & Activity Logger — RUANG SIGAP

Setiap aksi penting yang dilakukan pengguna **WAJIB** mencatat dua jejak:
1. **Logbook Harian** → `logbook/{userId}_{YYYY-MM-DD}` — Rekap kegiatan harian personal
2. **Activity Log** → `activity_logs/` — Audit trail per surat/dokumen

---

## 📋 Kapan Memanggil `writeLogbookEntry()`

| Aksi Pengguna | Kategori | Contoh Deskripsi |
|--------------|----------|-----------------|
| Terima surat masuk baru | `'Surat'` | `"Menerima surat: Undangan Rapat Koordinasi"` |
| Kirim disposisi | `'Disposisi'` | `"Mendisposisikan surat ke Kasubag Umum"` |
| Submit tindak lanjut | `'Laporan'` | `"Melaporkan tindak lanjut: Rapat selesai dilaksanakan"` |
| Buat / selesaikan tugas | `'Tugas'` | `"Menyelesaikan tugas: Review dokumen anggaran"` |
| Ikut/buat rapat/notulensi | `'Rapat'` | `"Mengikuti Rapat Koordinasi Anggaran"` |
| Unggah bukti kinerja | `'Laporan'` | `"Mengunggah bukti kinerja: Laporan Bulanan"` |
| Aksi lain | `'Umum'` | Deskripsi bebas |

---

## 🔧 Cara Memanggil (Frontend)

```typescript
import { writeLogbookEntry } from '@/lib/logbookUtils';

// ✅ Panggil SETELAH aksi utama berhasil
const handleKirimDisposisi = async (surat: SuratMasuk, instruksi: string) => {
  try {
    // 1. Aksi utama dulu
    await updateDoc(doc(db, 'disposisi', disposisiId), { ... });
    
    // 2. Catat ke logbook — JANGAN await secara blocking
    writeLogbookEntry(userProfile.uid, userProfile.opdId, {
      deskripsi: `Mendisposisikan surat: ${surat.perihal}`,
      kategori: 'Disposisi',
      selesai: true,
      suratTerkaitId: surat.id,
      suratPerihal: surat.perihal,
      disposisiTerkaitId: disposisiId,
      sumber: 'manual',
    }).catch(err => console.warn('[Logbook] Gagal catat:', err)); // Non-blocking, non-critical
    
    // 3. Toast sukses
    addToast({ type: 'success', title: 'Disposisi Terkirim' });
    
  } catch (error) {
    addToast({ type: 'error', title: 'Gagal', message: 'Disposisi tidak dapat dikirim.' });
  }
};
```

---

## 🔧 Cara Memanggil (Cloud Function)

```typescript
import { createLogbookEntry } from '../utils/helpers'; // Di backend

// ✅ Di dalam Cloud Function, setelah aksi utama
await createLogbookEntry({
  userId: userUid,
  opdId: opdId,
  deskripsi: `Sistem: Surat disposisi otomatis diselesaikan`,
  kategori: 'Disposisi',
  referensiId: suratId,
});
```

---

## 🔧 Cara Memanggil `logActivity()` (Activity Log per Surat)

Activity log adalah **jejak audit per surat** — siapa melakukan apa dan kapan.

```typescript
import { logActivity } from '@/lib/activityLogger';

// ✅ Panggil setiap kali ada perubahan status surat
await logActivity(
  suratId,                                    // ID surat yang terlibat
  `${namaUser} (${namaJabatan})`,            // Format: "Nama (Jabatan)"
  'DISPOSISI_DIKIRIM',                        // Kode aksi (KAPITAL dengan underscore)
  `Disposisi ke: ${namaPenerima}. Instruksi: ${instruksi.substring(0, 100)}` // Detail opsional
);

// Kode aksi standar yang sudah ada:
// 'SURAT_DITERIMA' | 'DISPOSISI_DIKIRIM' | 'DISPOSISI_DITERIMA' |
// 'TINDAK_LANJUT_DIBUAT' | 'SURAT_DISELESAIKAN' | 'SURAT_DIARSIPKAN' |
// 'DISPOSISI_DIKEMBALIKAN' | 'REVISI_DIMINTA'
```

---

## 🚦 Aturan Penting

1. **Jangan blocking:** `writeLogbookEntry` dan `logActivity` BUKAN bagian dari logika bisnis utama. Panggil dengan `.catch()` agar jika gagal tidak membatalkan aksi utama.
2. **Jangan await di try/catch utama:** Error di logbook TIDAK boleh menyebabkan rollback transaksi utama.
3. **Deskripsi logbook harus informatif:** Sertakan nama/judul yang relevan, bukan hanya ID.
4. **Activity log di backend:** Jika aksi dipicu dari Cloud Function, gunakan `createLogbookEntry` dari `utils/helpers.ts` bukan dari frontend.
