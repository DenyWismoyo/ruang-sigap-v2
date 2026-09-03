// Lokasi: functions/src/aiFunctions.ts
import * as functions from "firebase-functions/v1";
import * as logger from "firebase-functions/logger";
import { defineSecret } from "firebase-functions/params";

const REGION = "asia-southeast2";
const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * FUNGSI: Ekstrak Data Surat via Gemini AI
 * Menerima image base64 dari client dan memanggil Gemini API dengan aman di server.
 */
export const extractSuratDataAI = functions.region(REGION).runWith({
    timeoutSeconds: 60, // AI membutuhkan waktu proses lebih lama
    memory: "512MB",
    secrets: [geminiApiKey]
}).https.onCall(async (data, context) => {
    // 1. Validasi Autentikasi (Keamanan)
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Harus login untuk menggunakan AI.");
    }

    // 2. Ambil data dari payload frontend
    const { base64Image } = data;
    if (!base64Image) {
         throw new functions.https.HttpsError("invalid-argument", "Gambar surat tidak disertakan.");
    }

    // 3. Ambil API KEY dari Google Cloud Secret Manager
    // [PERBAIKAN KEAMANAN]: Menggunakan Secret Manager alih-alih .env
    const apiKey = geminiApiKey.value(); 
    if (!apiKey) {
        logger.error("API Key untuk Gemini tidak ditemukan di Secret Manager.");
        throw new functions.https.HttpsError("internal", "Sistem AI tidak terkonfigurasi di server.");
    }

    try {
        // Menggunakan gemini-3.5-flash-lite untuk efisiensi dan kecepatan
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
        
        const promptText = `
              Anda adalah sekretaris ahli birokrasi. Analisis gambar surat ini untuk mengekstrak metadata.

              INSTRUKSI KHUSUS:
              1. **PERIHAL**: 
                 - BACA header 'Hal' atau 'Perihal'.
                 - BACA JUGA paragraf pertama/isi surat.
                 - JIKA header terlalu pendek atau umum (contoh hanya tertulis: "Undangan", "Pemberitahuan", "Permohonan"), ABAIKAN header tersebut dan BUAT RINGKASAN PADAT dari isi surat.
                 - Contoh: Ubah "Undangan" menjadi "Undangan Rapat Koordinasi Anggaran 2025".
                 - Jika header sudah deskriptif, gunakan apa adanya.
              
              2. **PENGIRIM**:
                 - Ambil nama INSTANSI / DINAS / LEMBAGA pengirim (biasanya di KOP SURAT paling atas).
                 - JANGAN ambil nama pejabat yang menandatangani (misal: 'Kepala Dinas'), kecuali surat pribadi.
                 - Prioritaskan nama instansi.

              3. **AGENDA**:
                 - Jika surat ini adalah Undangan atau Panggilan Rapat, isi detail agenda selengkap mungkin.

              4. **RINGKASAN EKSEKUTIF (TL;DR - DIRECT TO THE POINT)**:
                 - Tulis 1 s.d. 2 kalimat singkat (maksimal 25-35 kata) yang LANGSUNG MERANGKUM POKOK SUBSTANSI / URGENSI / TUJUAN SURAT.
                 - PANTANGAN MUTLAK (STRICT NEGATIVE RULES):
                   * DILARANG memulai kalimat dengan frasa klise/basa-basi seperti: "Undangan menghadiri...", "Surat ini...", "Pemberitahuan mengenai...", "Berdasarkan surat...", "Disampaikan bahwa...", "Mengundang saudara...", "Sehubungan dengan...".
                   * DILARANG mengulang hari, tanggal, jam, atau nama gedung/lokasi rapat (karena sudah diekstrak ke detailAgenda).
                   * DILARANG mengulang nama instansi pengirim (karena sudah ada di kolom Pengirim).
                 - PANDUAN SUBSTANSI:
                   * Undangan: Langsung tulis topik pembahasan utama, sasaran materi, atau output keputusan yang diharapkan. Contoh: "Pemaparan teknis dan koordinasi implementasi platform OJOL Lokal Solo Technopark untuk penguatan ekosistem transportasi digital daerah."
                   * Permohonan: Langsung tulis apa yang diminta (fasilitas, izin, narasumber, dana) dan tujuan peruntukannya. Contoh: "Permohonan peminjaman Aula Utama dan sarana pendukung untuk pelatihan digital 50 UMKM binaan."
                   * Pemberitahuan / Edaran: Langsung tulis substansi kewajiban, perubahan aturan, atau tenggat waktu (deadline). Contoh: "Kewajiban rekonsiliasi SPJ dan pelaporan penyerapan anggaran Triwulan II paling lambat 15 Oktober 2026."
                   * Laporan / Pengaduan: Langsung tulis pokok permasalahan teknis dan unit/wilayah terkait.

              5. **SARAN DISPOSISI**:
                 - Berikan 2 opsi kalimat instruksi disposisi yang relevan, spesifik, dan tegas berdasarkan esensi surat ini.

              Ekstrak data dalam format JSON berikut:
              {
                "nomorSurat": "string",
                "perihal": "string (Ringkasan isi surat)",
                "pengirim": "string (Nama Instansi)",
                "tanggalSurat": "YYYY-MM-DD",
                "jenisSurat": "Pilih satu: Undangan, Pemberitahuan, Permohonan, Lainnya",
                "ringkasanEksekutif": "string",
                "suggestedDisposisi": ["Opsi Instruksi Disposisi 1", "Opsi Instruksi Disposisi 2"],
                "detailAgenda": {
                   "tanggal": "YYYY-MM-DD",
                   "jamMulai": "HH:mm",
                   "jamSelesai": "HH:mm" (atau null),
                   "lokasi": "string"
                } (isi null jika bukan undangan)
              }
        `;

        const schemaConfig = {
            type: "OBJECT",
            properties: {
                nomorSurat: { type: "STRING" },
                perihal: { type: "STRING" },
                pengirim: { type: "STRING" },
                tanggalSurat: { type: "STRING" },
                jenisSurat: { 
                    type: "STRING", 
                    enum: ["Undangan", "Pemberitahuan", "Permohonan", "Lainnya"] 
                },
                ringkasanEksekutif: { type: "STRING" },
                suggestedDisposisi: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                },
                detailAgenda: {
                    type: "OBJECT", 
                    nullable: true,
                    properties: {
                        tanggal: { type: "STRING" },
                        jamMulai: { type: "STRING" },
                        jamSelesai: { type: "STRING" },
                        lokasi: { type: "STRING" }
                    },
                    required: ["tanggal", "jamMulai", "lokasi"]
                }
            },
            required: ["nomorSurat", "perihal", "pengirim", "tanggalSurat", "jenisSurat", "ringkasanEksekutif"]
        };

        const payload = {
            contents: [{
                parts: [
                    { text: promptText },
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } }
                ]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schemaConfig
            }
        };

        // 4. Lakukan pemanggilan API dari Server
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorMessage = "Gagal menghubungi AI Server.";
            try {
                const errorBody = await response.json();
                logger.error("Gemini API Error Details:", errorBody);
                if (response.status === 429) {
                    errorMessage = "Sistem AI sedang sibuk atau mencapai limit kuota (429). Harap tunggu beberapa saat.";
                } else if (errorBody.error && errorBody.error.message) {
                    errorMessage = errorBody.error.message;
                }
            } catch (e) {
                logger.error("Gemini API Raw Error:", await response.text());
            }
            throw new functions.https.HttpsError("internal", errorMessage);
        }

        const result = await response.json();
        const textPart = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textPart) {
             throw new functions.https.HttpsError("data-loss", "AI tidak memberikan data yang dapat dibaca.");
        }

        // 5. Kembalikan data JSON bersih ke Frontend
        return JSON.parse(textPart);

    } catch (error: any) {
        logger.error("Error di fungsi extractSuratDataAI:", error);
        throw new functions.https.HttpsError("internal", error.message || "Terjadi kesalahan internal AI.");
    }
});