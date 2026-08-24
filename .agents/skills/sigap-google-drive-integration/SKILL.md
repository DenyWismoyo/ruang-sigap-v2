---
name: sigap-google-drive-integration
description: Panduan integrasi Google Drive di RUANG SIGAP — OAuth flow, upload bukti kinerja, refresh token, dan API route /api/google/. Gunakan saat menambahkan fitur upload ke Drive atau mengelola koneksi Google user.
---

# Google Drive Integration — RUANG SIGAP

```
API Routes   : /api/google/authorize, /api/google/callback, /api/google/upload
User Fields  : googleRefreshToken, googleAccessToken, googleTokenExpiry
Feature Gate : (tidak ada gate khusus — tersedia untuk semua user)
```

---

## 🔐 Alur OAuth Google Drive

```
[User klik "Hubungkan Google"] 
    → /api/google/authorize 
    → Google OAuth Consent Screen 
    → Callback ke /api/google/callback 
    → Simpan refresh_token ke users/{nip} 
    → Redirect ke halaman asal
```

---

## 1️⃣ Cek Status Koneksi Google

```tsx
const { userProfile } = useUserAuth();

// Cek apakah Google Drive sudah terhubung
const isGoogleConnected = !!userProfile?.googleRefreshToken;

// Cek apakah access token masih valid
const isTokenValid = userProfile?.googleTokenExpiry 
  ? userProfile.googleTokenExpiry > Date.now() 
  : false;

return (
  <div>
    {isGoogleConnected ? (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="size-4" />
        <span>Google Drive terhubung ({userProfile.googleEmail})</span>
      </div>
    ) : (
      <Button onClick={() => window.location.href = '/api/google/authorize'}>
        <Google className="mr-2 size-4" />
        Hubungkan Google Drive
      </Button>
    )}
  </div>
);
```

---

## 2️⃣ Upload File ke Google Drive

Panggil endpoint `/api/google/upload` (sudah ada) untuk upload:

```tsx
async function uploadBuktiKinerjaToDrive(file: File, folderName: string) {
  const { addToast } = useToast();
  
  // ✅ Kompres gambar sebelum upload
  const processedFile = file.type.startsWith('image/') 
    ? await compressImage(file, 0.8, 1920)
    : file;
  
  const formData = new FormData();
  formData.append('file', processedFile);
  formData.append('folderName', folderName); // Nama folder di Drive

  try {
    const response = await fetch('/api/google/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Handle token expired — minta re-auth
      if (error.code === 'TOKEN_EXPIRED') {
        addToast({
          type: 'warning',
          title: 'Koneksi Google Expired',
          message: 'Silakan hubungkan ulang akun Google Anda.',
        });
        window.location.href = '/api/google/authorize';
        return null;
      }
      
      throw new Error(error.message);
    }

    const { fileUrl, fileId } = await response.json();
    return { fileUrl, fileId }; // URL untuk ditampilkan / disimpan ke Firestore
    
  } catch (error) {
    addToast({ type: 'error', title: 'Upload Gagal', message: 'File tidak dapat diunggah ke Google Drive.' });
    return null;
  }
}
```

---

## 3️⃣ Menyimpan Link Drive ke Firestore

Setelah upload berhasil, simpan URL ke dokumen yang relevan:

```tsx
// Upload + simpan ke Firestore secara atomik
const handleUploadBukti = async (file: File) => {
  setIsUploading(true);
  
  try {
    const result = await uploadBuktiKinerjaToDrive(file, `BuktiKinerja_${userProfile.nip}`);
    if (!result) return;
    
    // Simpan link Drive ke dokumen bukti_kinerja
    await addDoc(collection(db, 'bukti_kinerja'), {
      userId: userProfile.uid,
      nip: userProfile.nip,
      opdId: userProfile.opdId,
      namaFile: file.name,
      driveUrl: result.fileUrl,      // URL untuk preview/download
      driveFileId: result.fileId,    // ID file di Google Drive
      ukuranBytes: file.size,
      createdAt: serverTimestamp(),
    });
    
    // Catat ke logbook
    writeLogbookEntry(userProfile.uid, userProfile.opdId, {
      deskripsi: `Mengunggah bukti kinerja: ${file.name}`,
      kategori: 'Laporan',
    });
    
    addToast({ type: 'success', title: 'Upload Berhasil' });
    
  } finally {
    setIsUploading(false);
  }
};
```

---

## 4️⃣ Google Calendar (Jika Diperlukan)

Untuk membuat event di Google Calendar pengguna (fitur Agenda):

```typescript
// Cloud Function — menggunakan createCalendarEvent dari utils/helpers.ts
import { createCalendarEvent } from '../utils/helpers';

await createCalendarEvent(userUid, {
  title: `Rapat: ${surat.perihal}`,
  description: `Surat dari: ${surat.pengirim}\nNomor: ${surat.nomorSurat}`,
  startDateTime: `${agenda.tanggal}T${agenda.jam}:00+07:00`,
  endDateTime: `${agenda.tanggal}T${addHours(agenda.jam, 1)}:00+07:00`,
  location: agenda.lokasi,
});
```

---

## 🚫 Anti-Pattern Drive Integration

| Anti-Pattern | Risiko | Solusi |
|-------------|--------|--------|
| Simpan file besar langsung ke Firestore | 1MB limit error | Upload ke Drive atau Firebase Storage |
| Tidak handle `TOKEN_EXPIRED` | App crash tanpa penjelasan | Redirect ke `/api/google/authorize` |
| Upload gambar tanpa kompresi | Kuota Drive cepat habis | `compressImage()` sebelum upload |
| Tidak simpan driveFileId | Tidak bisa delete/update file | Selalu simpan fileId bersama fileUrl |
