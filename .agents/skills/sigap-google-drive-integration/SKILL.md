---
name: sigap-google-drive-integration
description: Panduan integrasi Google Drive di RUANG SIGAP & POROS — OAuth flow, upload bukti kinerja, sanitasi folder ID, refresh token, dukungan Shared Drive, toleransi domain Google Workspace, dan API route /api/google/.
---

# Google Drive Integration — RUANG SIGAP & POROS

```
API Routes   : /api/google/auth, /api/google/callback, /api/google/upload-bukti, /api/google/disconnect
User Fields  : googleRefreshToken, googleAccessToken, googleTokenExpiry, googleEmail, googleDriveReportLink
Feature Gate : (Tersedia untuk semua user yang memiliki NIP)
```

---

## 🔐 Alur OAuth Google Drive

```
[User klik "Hubungkan Akun Google"] 
    → /api/google/auth?state=<base64url(userId, redirectUrl)>
    → Google OAuth Consent Screen (Scope: drive, calendar.events, profile, email)
    → Callback ke /api/google/callback?code=...&state=...
    → Simpan tokens ke users/{nip}
    → Redirect dinamis ke statePayload.redirectUrl (misal /dashboard/sigap/bukti-kinerja)
```

> [!IMPORTANT]
> **Scope OAuth Wajib**:
> Selain scope profil dan kalender, wajib menyertakan `https://www.googleapis.com/auth/drive` (bukan hanya `drive.file`) agar sistem berhak membuat subfolder dan menyimpan file ke dalam folder buatan pengguna di Google Drive Web.

---

## 1️⃣ Universal Folder ID Extraction

Selalu gunakan `extractGoogleDriveFolderId` dari `@/lib/utils` di frontend maupun backend:

```typescript
import { extractGoogleDriveFolderId } from '@/lib/utils';

// Mendukung format:
// - https://drive.google.com/drive/folders/1abc...
// - https://drive.google.com/drive/u/0/folders/1abc...
// - https://drive.google.com/drive/u/1/folders/1abc...?usp=sharing
// - https://drive.google.com/open?id=1abc...
// - Raw ID: 1abc...
const cleanFolderId = extractGoogleDriveFolderId(rawInput);
```

---

## 2️⃣ Cek Status Koneksi & Dual Guard di Menu Bukti Kinerja

Menu Bukti Kinerja wajib memverifikasi **DUA** kondisi:
1. `isFolderConfigured`: `!!userProfile?.googleDriveReportLink` (Folder ID terdaftar)
2. `isGoogleConnected`: `!!userProfile?.googleRefreshToken` (Akun Google terotorisasi)

Gunakan hook `useGoogleDriveUploader()`:

```tsx
const { 
  uploadFile, 
  uploadStatus, 
  errorMessage, 
  isReady, 
  isGoogleConnected, 
  isFolderConfigured 
} = useGoogleDriveUploader();

// Navigasi direct connect tanpa berpindah halaman
const handleConnectGoogle = () => {
  if (userProfile?.nip) {
    const statePayload = JSON.stringify({ 
      userId: userProfile.nip, 
      redirectUrl: window.location.pathname 
    });
    const state = btoa(statePayload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    window.location.href = `/api/google/auth?state=${state}`;
  }
};
```

---

## 3️⃣ Upload File ke Google Drive Backend (`/api/google/upload-bukti`)

Aturan wajib di backend route handler:

1. **Sanitasi Folder ID**:
   ```typescript
   const folderId = extractGoogleDriveFolderId(rawFolderId);
   ```
2. **Dukungan Shared Drive OPD**:
   Sertakan `supportsAllDrives: true` dan `includeItemsFromAllDrives: true` pada `drive.files.list` dan `drive.files.create`.
3. **Toleransi Akun Dinas (Google Workspace)**:
   Bungkus pembagian publik (`reader: anyone`) dalam `try/catch` agar tidak menggagalkan upload jika akun dinas memiliki domain policy ketat:
   ```typescript
   try {
     await drive.permissions.create({
       fileId: fileId,
       requestBody: { role: 'reader', type: 'anyone' },
       supportsAllDrives: true,
     });
   } catch (permErr) {
     console.warn("[Upload API] Set public permission skipped (Domain Policy):", permErr);
   }
   ```

---

## 4️⃣ Format Tanggal Aman di Riwayat Item

Gunakan `safeFormatDate` dari `@/lib/utils` untuk mencegah runtime crash (`item.createdAt.toDate is not a function`):

```tsx
import { safeFormatDate } from '@/lib/utils';

<p className="text-xs text-muted-foreground">
  {safeFormatDate(item.createdAt)}
</p>
```

---

## 5️⃣ Triple-Sync Integrated Performance Pipeline

Setiap fungsi pelaporan yang mengunggah file bukti ke Google Drive (**Menu Bukti Kinerja**, **Laporan Tindak Lanjut Surat Masuk**, **Rekap Logbook Bulanan**, atau **Penyelesaian Tugas**) **WAJIB** menerapkan 3 pilar sinkronisasi:

1. **Subfolder Google Drive Bulanan Konsisten**:
   ```typescript
   const dateObj = new Date();
   const monthIndex = dateObj.getMonth() + 1;
   const monthName = dateObj.toLocaleString('id-ID', { month: 'long' });
   const year = dateObj.getFullYear();
   const subFolderName = `${monthIndex}. ${year} ${monthName} - Bukti E Kinerja`;

   await uploadFile(file, fileName, userProfile.googleDriveReportLink, subFolderName);
   ```

2. **Auto-Register ke Koleksi Firestore `buktiKinerja`**:
   Setiap file yang terunggah wajib didata ke koleksi `buktiKinerja` agar portofolio pegawai di menu Bukti E-Kinerja langsung terisi otomatis:
   ```typescript
   await addDoc(collection(db, 'buktiKinerja'), {
       userId: userProfile.uid,
       opdId: userProfile.opdId,
       judul: `Tindak Lanjut / Rekap: ${judul}`,
       deskripsi: ringkasan,
       googleDriveLink: link,
       fileName: fileName,
       fileType: file.type || 'application/pdf',
       sumber: 'laporan' | 'logbook_rekap' | 'tugas' | 'mandiri',
       createdAt: Timestamp.now(),
   });
   ```

3. **Auto-Audit ke `logbookHarian` via `writeLogbookEntry`**:
   Tindakan pelaporan / penyelesaian surat/tugas wajib mencatat entri kegiatan personal agar pegawai tidak perlu mengetik ulang secara manual:
   ```typescript
   const { writeLogbookEntry } = await import('@/lib/logbookUtils');
   writeLogbookEntry(userProfile.uid, userProfile.opdId, {
       deskripsi: `Melaporkan tindak lanjut surat: ${surat.perihal}`,
       kategori: 'Laporan',
       selesai: true,
       sumber: 'laporan_tindak_lanjut',
       suratTerkaitId: surat.id,
   }).catch(err => console.warn('[Logbook] Auto-write gagal:', err));
   ```

---

## 🚫 Anti-Pattern Drive Integration

| Anti-Pattern | Risiko | Solusi |
|-------------|--------|--------|
| Regex folder ID hanya mencocokkan `/drive/folders/` | URL `/u/0/` gagal ekstrak, URL mentah masuk DB, upload error 400/404 | Gunakan universal `extractGoogleDriveFolderId()` |
| Hanya cek `googleDriveReportLink` tanpa `googleRefreshToken` | Form upload aktif tapi melempar error 401 | Terapkan Dual Guard di UI dengan tombol direct auth |
| Hanya menggunakan scope `drive.file` | Error 404 saat menulis ke folder buatan user | Gunakan scope `https://www.googleapis.com/auth/drive` |
| Mengabaikan Shared Drive | Folder Drive Bersama OPD tidak terdeteksi | Pasang `supportsAllDrives: true` pada API calls |
| Memanggil `drive.permissions.create` tanpa try/catch | Crash 500 pada akun email dinas (@pemkab.go.id, dll) | Tangkap exception permission secara non-fatal |
| Hardcode redirect ke `/dashboard/profil` | User dialihkan ke 404 Not Found | Gunakan dinamis `statePayload.redirectUrl` |
| Memanggil `item.createdAt.toDate()` mentah | React runtime crash jika Timestamp belum resolve | Gunakan `safeFormatDate()` |
| Upload tindak lanjut tanpa parameter `subFolderName` | File bukti tercecer di root Google Drive user | Wajib kirim `${month}. ${year} ${monthName} - Bukti E Kinerja` |
| Upload berhasil tapi tidak menulis ke `buktiKinerja` | Bukti tidak muncul di portofolio menu Bukti E-Kinerja | Wajib auto-register dokumen ke koleksi `buktiKinerja` |
| Lapor tindak lanjut tanpa memanggil `writeLogbookEntry` | Pegawai harus input ulang kegiatan di Logbook | Panggil `writeLogbookEntry` non-blocking |

