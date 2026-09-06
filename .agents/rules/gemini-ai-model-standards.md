---
name: gemini-ai-model-standards
description: Standar pemilihan dan konfigurasi model Google Gemini AI di RUANG SIGAP / POROS. Wajib menggunakan lini Flash-Lite (terbaru: gemini-3.5-flash-lite). Dilarang keras menggunakan model Flash biasa atau Pro karena biaya tinggi dan lambat.
---

# Standar Pemilihan Model Google Gemini AI

## Aturan Utama (Strict Constraint)
1. **WAJIB Flash-Lite**: Seluruh fitur AI (baik di API Route, Cloud Function, maupun Client-Side) **HARUS** menggunakan model lini **Flash Lite** termutakhir:
   - **Primary Model**: `gemini-3.5-flash-lite`
   - **Fallback Models** (hanya jika diperlukan ketahanan ekstra terhadap limit kuota):
     - `gemini-flash-lite-latest`
     - `gemini-3.1-flash-lite`
     - `gemini-2.5-flash-lite`
2. **PANTANGAN MUTLAK (STRICT BAN)**:
   - **DILARANG KERAS** menggunakan model `gemini-*-flash` standar tanpa `-lite` (contoh dilarang: `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-2.5-flash`, `gemini-3.5-flash`).
   - **DILARANG KERAS** menggunakan model `gemini-*-pro` (contoh dilarang: `gemini-1.5-pro`, `gemini-2.5-pro`, `gemini-pro`).
   - **Alasan**: Model Pro dan Flash standar berbiaya token sangat tinggi dan memiliki latensi yang lambat, tidak cocok untuk sistem operasional birokrasi pemerintahan berskala harian frekuensi tinggi.

---

## Standar Implementasi di Kode

### 1. Direct REST Endpoint (Google Generative Language API)
Gunakan model ID `gemini-3.5-flash-lite`:
```typescript
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
```

### 2. Google Generative AI SDK (`@google/generative-ai`)
Gunakan model `gemini-3.5-flash-lite` secara langsung:
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
```
Atau jika menggunakan mekanisme fallback multi-model, hanya masukkan varian Flash-Lite:
```typescript
const candidateModels = [
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite"
];
```
*(Catatan: Jangan pernah menyisipkan nama model non-lite ke dalam array kandidat).*

---

## Panduan Migrasi Jika Ada Versi Flash Lite Baru
Jika Google AI Studio merilis versi Flash Lite yang lebih baru di masa mendatang (misalnya `gemini-4.0-flash-lite`):
1. Verifikasi ketersediaan dan status model di Google AI Studio / dokumentasi resmi Gemini.
2. Perbarui `Primary Model` di aturan ini dan seluruh endpoint ke versi Flash Lite baru tersebut.
3. Tetap pastikan model yang digunakan tetap memiliki sufiks `-flash-lite`.
