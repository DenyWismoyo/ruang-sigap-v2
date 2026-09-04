---
name: sigap-bkpsdm-ekinerja-bridge
description: Standar integrasi jembatan e-Kinerja BKPSDM Surakarta (Kepwal 786/154/2020), master 152 aktivitas ASN, dan bookmarklet browser 1-klik untuk pengisian otomatis form kegiatan harian.
---

# BKPSDM Surakarta e-Kinerja Bridge Pipeline

```
Dasar Hukum   : Keputusan Walikota Surakarta Nomor 786/154 Tahun 2020
Master Data   : src/data/masterAktivitasSolo.ts (152 Aktivitas Resmi)
Bridge Lib    : src/lib/ekinerjaBookmarklet.ts
UI Components : src/components/ekinerja/AktivitasCombobox.tsx, src/components/ekinerja/EkinerjaBridgeModal.tsx
Target Portal : e-Kinerja v4 BKPSDM Surakarta (http://103.115.227.196/e-kinerja/v4/)
```

---

## 🏛️ Latar Belakang & Kebutuhan

Aparatur Sipil Negara (ASN) di lingkungan Pemerintah Kota Surakarta diwajibkan mencatatkan aktivitas kinerja harian ke portal **e-Kinerja v4 BKPSDM**.
Agar pengguna tidak perlu mengetik ulang uraian pekerjaan dan mencari tautan Google Drive secara manual:
1. Setiap bukti kinerja di **RUANG SIGAP** dan **POROS** ditautkan ke salah satu dari **152 Master Aktivitas Resmi Kepwal 786/154/2020**.
2. File bukti yang sudah tersimpan di Google Drive pengguna langsung terhubung sebagai **URL Bukti Dukung**.
3. Tombol **"⚡ Siapkan e-Kinerja"** memetakan seluruh data ke 8 kolom formulir BKPSDM.
4. **Chrome Bookmarklet** mengisi seluruh 8 kolom dalam 1-klik tanpa perlu ekstensi browser yang rumit.

---

## 📋 Struktur Form 8 Kolom Kegiatan Harian BKPSDM Solo

| No | Kolom di Portal BKPSDM | Tipe Input | Sumber Data RUANG SIGAP | Format / Aturan |
|:---|:---|:---|:---|:---|
| 1 | **Tgl Pelaksanaan** | Text (Datepicker) | `item.createdAt` | Format `DD/MM/YYYY` |
| 2 | **Kode Kegiatan** | Text (Readonly) | Auto / F2 | Dikelola internal portal BKPSDM |
| 3 | **Aktivitas** | Select2 Dropdown | `item.aktivitasNama` | Wajib cocok persis dengan kamus 152 aktivitas |
| 4 | **Nama Kegiatan Harian** | Input / Textarea | `item.judul` | Uraian kegiatan tugas |
| 5 | **Jam Mulai** | Time Input | Default `08:00` | Format `HH:mm` |
| 6 | **Jam Selesai** | Time Input | Default `09:30` | Format `HH:mm` |
| 7 | **Kuantitas** | Number Input | Default `1` | Sesuai satuan aktivitas (Dokumen/Kegiatan/Laporan) |
| 8 | **URL Bukti Dukung** | Textarea/Input | `item.googleDriveLink` | Link sharing Google Drive dari uploader |
| - | **Catatan** | Textarea | `item.deskripsi` | Keterangan tambahan pelaksanaan tugas |

---

## ⚡ Arsitektur Bookmarklet 1-Klik

Bookmarklet menggunakan vanilla JavaScript yang berjalan di context halaman e-Kinerja BKPSDM:

```typescript
import { copyEkinerjaPayloadToClipboard, getEkinerjaBookmarkletHref } from '@/lib/ekinerjaBookmarklet';

// 1. User menekan tombol "Salin Data Form (1-Klik)" di Modal SIGAP
await copyEkinerjaPayloadToClipboard(payload);

// 2. User membuka formulir Tambah Kegiatan di e-Kinerja BKPSDM
// 3. User mengklik Bookmarklet "⚡ Isi e-Kinerja Solo" di browser
// Bookmarklet mengeksekusi:
// - Membaca JSON payload dari clipboard (atau prompt fallback jika clipboard API diblokir)
// - Mencocokkan nilai Select2 aktivitas dan memicu trigger('change')
// - Mengisi tanggal, jam, kuantitas, URL Google Drive, catatan
// - Menyorot field yang berhasil diisi dengan warna hijau (#ecfdf5)
// - Memunculkan toast sukses di pojok kanan atas layar
```

---

## 🗃️ Skema Data Firestore (`buktiKinerja`)

Saat bukti kinerja disimpan (baik manual via `bukti-kinerja/page.tsx` maupun otomatis dari tindak lanjut surat/tugas), simpan field berikut jika tersedia:

```typescript
{
  userId: string;
  opdId: string;
  judul: string;
  googleDriveLink: string;
  fileName: string;
  fileType: string;
  aktivitasId?: number;     // 1 s/d 152 sesuai masterAktivitasSolo.ts
  aktivitasNama?: string;   // Nama resmi aktivitas (contoh: "Membuat laporan")
  sumber?: 'manual' | 'laporan' | 'tugas_selesai';
  createdAt: Timestamp;
}
```

---

## 🚀 Arsitektur Visioner: SIGAP Bridge Chrome Extension (Manifest V3)

Tersedia ekstensi Chrome resmi di direktori `tools/sigap-chrome-bridge/` untuk menghubungkan tab SIGAP dan tab e-Kinerja secara **real-time cross-tab (Zero-Click)** tanpa perlu perantara clipboard atau klik tombol bookmarklet:

```
[Tab RUANG SIGAP]
      │
      │ window.postMessage({ type: 'SIGAP_BRIDGE_SEND', payload })
      ▼
[content-sigap.js]
      │
      │ chrome.runtime.sendMessage({ action: 'SEND_TO_EKINERJA', payload })
      ▼
[background.js (Service Worker)]
      │
      │ chrome.tabs.sendMessage(targetTabId, { action: 'FILL_FORM', payload, settings })
      ▼
[content-ekinerja.js (di Tab e-Kinerja BKPSDM)]
      │
      ├─ Mengisi 8 kolom form secara presisi
      ├─ Auto-Trigger [F2: Buat Kode Baru] jika kode kosong
      ├─ Auto-Select2 152 Kamus Aktivitas Solo & trigger('change')
      ├─ Animasi Glow Hijau (#ecfdf5) & Floating Toast Notifikasi
      └─ Auto-Focus ke tab e-Kinerja
```

### Cara Pemasangan:
1. Buka `chrome://extensions` di browser Chrome.
2. Aktifkan **Developer mode** di pojok kanan atas.
3. Klik **Load unpacked** dan arahkan ke folder `tools/sigap-chrome-bridge`.

---

## 🎨 Dual Tenant UI Guidelines (SIGAP vs POROS)

- **SIGAP**: Menggunakan token warna Royal Blue (`text-blue-600`, `bg-blue-600 hover:bg-blue-700`, badge `bg-blue-50 text-blue-700`).
- **POROS**: Menggunakan token warna Sovereign Teal (`text-teal-600`, `bg-teal-600 hover:bg-teal-700`, badge `bg-teal-50 text-teal-700`).
- Gunakan prop `tenant="sigap" | "poros"` pada `AktivitasCombobox` dan `EkinerjaBridgeModal` untuk konsistensi visual.

---

## 📖 Integrasi Logbook Harian Otomatis (`/dashboard/logbook`)

Setiap item aktivitas di Logbook (disposisi surat, sebar pemberitahuan, tindak lanjut, pembuatan laporan, tugas harian) kini dilengkapi tombol **"⚡ e-Kinerja"**:
1. **Auto-Mapping Tanggal**: Mengikuti tanggal kalender yang sedang aktif dipilih di Logbook.
2. **Auto-Detection Cerdas**: Fungsi `detectAktivitasFromLogbookText()` menganalisis uraian kegiatan untuk mencocokkan kode aktivitas BKPSDM secara otomatis:
   - `disposisi` → ID 79: *Mendisposisi*
   - `mengagenda` → ID 89: *Mengagenda surat masuk / keluar*
   - `konsep / telaah` → ID 123 / 92
   - `sebar / distribusi` → ID 119: *Menyampaikan / mendistribusikan surat*
   - `tindak lanjut / laporan` → ID 41: *Membuat laporan pelaksanaan tugas kedinasan lainnya*
   - `rekap / menyiapkan` → ID 150 / 142
3. **Multi-Domain Ready**: Mendukung environment `http://localhost:*`, portal web Firebase `*.web.app`, serta custom domain production `https://sgp.omnifit.cloud`.


