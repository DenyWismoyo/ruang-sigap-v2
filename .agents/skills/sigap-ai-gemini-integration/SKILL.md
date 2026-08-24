---
name: sigap-ai-gemini-integration
description: Panduan implementasi fitur AI Scan Surat menggunakan Gemini di RUANG SIGAP. Mencakup: feature gate opd_config, rate limiting 30 detik, pemanggilan Cloud Function extractSuratDataAIV2, cara parse response, dan penanganan error AI. Gunakan saat mengimplementasikan fitur AI atau menambahkan endpoint AI baru.
---

# AI Gemini Integration — RUANG SIGAP

```
Cloud Function : extractSuratDataAIV2 (asia-southeast2)
Model          : gemini-2.5-flash (via Secret: GEMINI_API_KEY)
Rate Limit     : 30 detik per user (koleksi: rate_limits/{userId})
Feature Gate   : opdConfig.features.aiSuratReader
```

---

## 🔐 Wajib: Feature Gate sebelum Akses AI

**Selalu** periksa feature gate sebelum menampilkan UI atau memanggil Cloud Function AI:

```tsx
const { opdConfig } = useUserAuth();

// ✅ Cek feature gate PERTAMA
if (!opdConfig?.features?.aiSuratReader) {
  return (
    <div className="sg-empty-state p-8">
      <Sparkles className="size-10 text-muted-foreground mb-3" />
      <p className="font-semibold">Fitur AI Tidak Aktif</p>
      <p className="text-sm text-muted-foreground mt-1">
        Hubungi admin untuk mengaktifkan AI Scan Surat.
      </p>
    </div>
  );
}
```

---

## 📞 Pemanggilan Cloud Function AI

```tsx
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

const functions = getFunctions(app, 'asia-southeast2');
const extractSuratDataAI = httpsCallable(functions, 'extractSuratDataAIV2');

// ✅ Pola pemanggilan standar dengan rate limit handling
const handleAIScan = async (fileUrl: string, suratId: string) => {
  setIsScanning(true);
  
  try {
    const result = await extractSuratDataAI({
      fileUrl,   // URL file dari Firebase Storage
      suratId,   // Untuk logging dan update koleksi surat
    });

    const data = result.data as {
      perihal?: string;
      pengirim?: string;
      nomorSurat?: string;
      tanggalSurat?: string;
      jenisSurat?: string;
      ringkasanEksekutif?: string;
      detailAgenda?: { tanggal: string; jam: string; lokasi: string } | null;
    };

    // Populate form dengan hasil AI
    if (data.perihal) setValue('perihal', data.perihal);
    if (data.pengirim) setValue('pengirim', data.pengirim);
    if (data.nomorSurat) setValue('nomorSurat', data.nomorSurat);
    if (data.tanggalSurat) setValue('tanggalSurat', data.tanggalSurat);
    
    addToast({ type: 'success', title: '✨ AI Scan Selesai', message: 'Data surat berhasil diisi otomatis.' });
    
  } catch (error: any) {
    // Tangani error spesifik dari Cloud Function
    if (error?.code === 'functions/resource-exhausted') {
      addToast({
        type: 'warning',
        title: 'Mohon Tunggu',
        message: 'AI Scan tersedia setiap 30 detik. Coba lagi sebentar.',
      });
    } else if (error?.code === 'functions/permission-denied') {
      addToast({
        type: 'error',
        title: 'Akses Ditolak',
        message: 'Paket Anda tidak mendukung fitur AI Scan.',
      });
    } else {
      addToast({
        type: 'error',
        title: 'AI Scan Gagal',
        message: 'Gagal membaca surat. Coba lagi atau isi manual.',
      });
    }
  } finally {
    setIsScanning(false);
  }
};
```

---

## 🎨 UI Tombol AI Scan (Standar)

```tsx
// ✅ Tampilan tombol AI yang konsisten
<Button
  type="button"
  variant="outline"
  onClick={() => handleAIScan(fileUrl, suratId)}
  disabled={isScanning || !fileUrl || !opdConfig?.features?.aiSuratReader}
  className="sg-btn gap-2"
>
  {isScanning ? (
    <>
      <Loader2 className="size-4 animate-spin text-blue-500" />
      <span>Menganalisis...</span>
    </>
  ) : (
    <>
      <Sparkles className="size-4 text-blue-500" />
      <span>Scan dengan AI</span>
    </>
  )}
</Button>

{/* Badge informasi rate limit */}
<p className="text-[10px] text-muted-foreground">
  AI Scan tersedia setiap 30 detik
</p>
```

---

## 🔧 Membuat Endpoint AI Baru di Backend

Jika perlu menambahkan fitur AI baru (misalnya: AI Notulensi, AI Summary Laporan):

```typescript
// functions/src/aiFunctions.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Package yang sudah ada

const db = getFirestore('database-siyap');

export const namaFiturAIBaru = onCall(
  {
    region: 'asia-southeast2',
    secrets: ['GEMINI_API_KEY'],  // ✅ Wajib declare secret
    timeoutSeconds: 120,           // AI bisa lambat
    memory: '512MiB',
  },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Login diperlukan.');
    
    const { uid, token } = request.auth;
    const opdId = token.opdId as string;
    
    // ✅ 1. Cek feature gate di backend juga
    const configDoc = await db.collection('opd_config').doc(opdId).get();
    if (!configDoc.data()?.features?.aiSuratReader) {
      throw new HttpsError('permission-denied', 'Fitur AI tidak aktif untuk OPD ini.');
    }
    
    // ✅ 2. Rate limiting — cek koleksi rate_limits
    const rateLimitRef = db.collection('rate_limits').doc(uid);
    const rateLimitDoc = await rateLimitRef.get();
    const now = Timestamp.now();
    const thirtySecondsAgo = new Timestamp(now.seconds - 30, now.nanoseconds);
    
    if (rateLimitDoc.exists && rateLimitDoc.data()!.lastAIScan > thirtySecondsAgo) {
      throw new HttpsError('resource-exhausted', 'Mohon tunggu 30 detik sebelum AI Scan berikutnya.');
    }
    
    // ✅ 3. Update rate limit
    await rateLimitRef.set({ lastAIScan: now }, { merge: true });
    
    // ✅ 4. Panggil Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `[Prompt Anda di sini]`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // ✅ 5. Parse JSON response dari Gemini (selalu dalam try/catch)
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[1] : text);
      return parsed;
    } catch {
      throw new HttpsError('internal', 'AI tidak dapat menghasilkan output yang valid.');
    }
  }
);
```

---

## 🚫 Anti-Pattern AI yang Dilarang

| Anti-Pattern | Risiko | Solusi |
|-------------|--------|--------|
| Panggil Gemini API langsung dari frontend | API key terekspos | Selalu lewat Cloud Function |
| Tidak ada rate limiting | Biaya API meledak | Wajib cek `rate_limits` collection |
| Tidak ada feature gate | User non-premium akses fitur premium | Cek `opdConfig.features` |
| Tampilkan output Gemini mentah ke user | XSS / output tidak bersih | Parse dan sanitize dulu |
| Tidak ada timeout pada request AI | Function hang | Set `timeoutSeconds: 120` |
