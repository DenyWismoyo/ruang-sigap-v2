// Lokasi: functions/src/aiFunctions.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";

import { getFirestore } from "firebase-admin/firestore";

const REGION = "asia-southeast2";
const COOLDOWN_SECONDS = 30; // JEDA MINIMAL (30 Detik)

// Definisikan secret dari Google Cloud Secret Manager
const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * FUNGSI: Ekstrak Data Surat via Gemini AI
 * Menggunakan Firebase Functions v2 (Cloud Run)
 */
export const extractSuratDataAIV2 = onCall({
    region: REGION,
    timeoutSeconds: 60,
    memory: "512MiB",
    cors: true,
    secrets: [geminiApiKey] // Sematkan secret ke dalam environment runtime fungsi ini
}, async (request) => { 
    
    // 1. Validasi Autentikasi (Keamanan)
    if (!request.auth || !request.auth.uid) {
        throw new HttpsError("unauthenticated", "Harus login untuk menggunakan AI.");
    }

    const uid = request.auth.uid;
    const db = getFirestore("database-siyap");
    const rateLimitRef = db.collection('rate_limits').doc(`ai_ocr_${uid}`);

    // 2. RATE LIMITING & ANTI-SPAM (Backend Validation)
    // Menggunakan Transaction untuk mencegah Race Conditions jika ditembak bersamaan
    try {
        await db.runTransaction(async (transaction) => {
            const rateLimitDoc = await transaction.get(rateLimitRef);
            const now = Date.now();

            if (rateLimitDoc.exists) {
                const lastCallTime = rateLimitDoc.data()?.lastCallTime || 0;
                const timeDiff = now - lastCallTime;
                
                // Jika panggilan terlalu cepat dari batas waktu (Cooldown)
                if (timeDiff < COOLDOWN_SECONDS * 1000) {
                    const remainingTime = Math.ceil((COOLDOWN_SECONDS * 1000 - timeDiff) / 1000);
                    throw new HttpsError(
                        "resource-exhausted", 
                        `Harap tunggu ${remainingTime} detik sebelum menggunakan AI lagi.`
                    );
                }
            }

            // Catat waktu panggilan saat ini (Update state SEBELUM panggil API eksternal)
            transaction.set(rateLimitRef, { 
                lastCallTime: now,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
    } catch (error: any) {
        if (error instanceof HttpsError) throw error;
        logger.error("Error pada Rate Limiter:", error);
        throw new HttpsError("internal", "Gagal memverifikasi limit keamanan.");
    }

    // 3. Ambil data dari payload frontend
    const { base64Image } = request.data;
    if (!base64Image) {
         throw new HttpsError("invalid-argument", "Gambar surat tidak disertakan.");
    }

    // 4. Ambil API KEY dari Google Cloud Secret Manager
    const apiKey = geminiApiKey.value(); 
    if (!apiKey) {
        logger.error("API Key untuk Gemini tidak ditemukan di Secret Manager.");
        throw new HttpsError("internal", "Sistem AI tidak terkonfigurasi di server.");
    }

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
        
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

              4. **RINGKASAN EKSEKUTIF (TL;DR)**:
                 - Buat 1 hingga 2 kalimat ringkasan padat tentang isi utama surat ini.
                 - Tulis secara lugas dan profesional agar pimpinan langsung paham inti surat tanpa membaca teks panjang.

              Ekstrak data dalam format JSON berikut:
              {
                "nomorSurat": "string",
                "perihal": "string (Ringkasan isi surat)",
                "pengirim": "string (Nama Instansi)",
                "tanggalSurat": "YYYY-MM-DD",
                "jenisSurat": "Pilih satu: Undangan, Pemberitahuan, Permohonan, Lainnya",
                "ringkasanEksekutif": "string",
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
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: schemaConfig
            }
        };

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
                
                // [PERBAIKAN] Prioritaskan pesan error asli dari server Google (jika ada)
                if (errorBody.error && errorBody.error.message) {
                    errorMessage = `Error AI: ${errorBody.error.message}`;
                } else if (response.status === 429) {
                    // Fallback jika tidak ada pesan spesifik dari Google API
                    errorMessage = "Sistem AI sedang sibuk atau mencapai limit kuota (429). Harap tunggu beberapa saat.";
                }
            } catch (e) {
                logger.error("Gemini API Raw Error:", await response.text());
            }
            throw new HttpsError("internal", errorMessage);
        }

        const result = await response.json();
        const textPart = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textPart) {
             throw new HttpsError("data-loss", "AI tidak memberikan data yang dapat dibaca.");
        }

        return JSON.parse(textPart);

    } catch (error: any) {
        logger.error("Error di fungsi extractSuratDataAI:", error);
        throw new HttpsError("internal", error.message || "Terjadi kesalahan internal AI.");
    }
});

/**
 * FUNGSI: Ekstrak Niat Disposisi Suara via Gemini AI
 * Menggunakan Firebase Functions v2
 */
export const extractVoiceDisposisiAIV2 = onCall({
    region: REGION,
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: true,
    secrets: [geminiApiKey]
}, async (request) => {
    // 1. Validasi Autentikasi
    if (!request.auth || !request.auth.uid) {
        throw new HttpsError("unauthenticated", "Harus login untuk menggunakan AI.");
    }

    const { audioBase64, mimeType, bawahanListStr } = request.data;
    if (!audioBase64 || !mimeType || !bawahanListStr) {
         throw new HttpsError("invalid-argument", "Data audio atau daftar bawahan tidak valid.");
    }

    const apiKey = geminiApiKey.value(); 
    if (!apiKey) {
        throw new HttpsError("internal", "API Key untuk Gemini tidak ditemukan di Secret Manager.");
    }

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
        
        const promptText = `
              Anda adalah asisten cerdas untuk sistem tata kelola persuratan pemerintahan.
              Tugas Anda adalah mendengarkan file rekaman suara perintah pimpinan (dilampirkan), mentranskripsinya secara internal, lalu mengubah intent perintah tersebut menjadi format JSON terstruktur untuk form disposisi otomatis.

              DAFTAR BAWAHAN (Kandidat Penerima):
              Setiap baris berisi [ID] Nama Lengkap - Jabatan
              ${bawahanListStr}

              INSTRUKSI EKSTRAKSI:
              1. **penerimaIds**: Dengarkan suara dan cari tahu siapa yang dimaksud oleh pimpinan. Lakukan pencocokan (fuzzy match) dengan nama atau jabatan pada DAFTAR BAWAHAN. Kembalikan array berisi ANGKA (ID) dari bawahan yang paling cocok. Jika pimpinan menyebut "Sekdis" atau "Sekretaris", cari jabatan yang sesuai. Jika menyebut nama (contoh: "Budi"), cari nama yang mengandung kata tersebut.
              2. **instruksi**: Tulis ulang perintah menjadi kalimat instruksi formal, singkat, dan jelas. Buang kata-kata filler. PENTING: JANGAN cantumkan nama/jabatan penerima di dalam teks instruksi. Contoh: "Tolong kasih ini ke Pak Budi suruh pelajari" -> instruksi: "Tolong dipelajari dan ditindaklanjuti".
              3. **isInformational**: Set ke true JIKA perintah suara HANYA mengindikasikan bahwa surat ini hanya untuk diketahui/diarsipkan (contoh: "Untuk diketahui", "Arsip"). Set false jika ada tindakan nyata yang harus dikerjakan.
        `;

        const schemaConfig = {
            type: "OBJECT",
            properties: {
                penerimaIds: { type: "ARRAY", items: { type: "INTEGER" } },
                instruksi: { type: "STRING" },
                isInformational: { type: "BOOLEAN" }
            },
            required: ["penerimaIds", "instruksi", "isInformational"]
        };

        const payload = {
            contents: [{ 
                parts: [
                    { 
                        inlineData: {
                            mimeType: mimeType,
                            data: audioBase64
                        }
                    },
                    { text: promptText }
                ] 
            }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: schemaConfig
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            logger.error("Gemini API Error Details:", errorBody);
            throw new HttpsError("internal", "Gagal menghubungi AI Server.");
        }

        const result = await response.json();
        const textPart = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textPart) {
             throw new HttpsError("data-loss", "AI tidak memberikan data yang dapat dibaca.");
        }

        return JSON.parse(textPart);

    } catch (error: any) {
        logger.error("Error di fungsi extractVoiceDisposisiAIV2:", error);
        throw new HttpsError("internal", error.message || "Terjadi kesalahan internal AI.");
    }
});/**
 * FUNGSI: Agent AI Asynchronous untuk Saran Disposisi Strategis
 * Berjalan di background saat dokumen Surat baru dibuat.
 */
export const agentStrategicDisposition = onDocumentCreated({
    document: "surat/{suratId}",
    region: REGION,
    database: "database-siyap",
    secrets: [geminiApiKey],
    memory: "256MiB",
    timeoutSeconds: 60
}, async (event) => {
    const snap = event.data;
    if (!snap) return;

    const surat = snap.data();
    const suratId = event.params.suratId;

    // Pastikan kita hanya memproses jika belum ada saran (mencegah loop/duplikasi jika diperlukan)
    if (surat.suggestedDisposisi && surat.suggestedDisposisi.length > 0) return;
    
    // Jangan proses jika surat dibuat secara manual (tanpa data ringkasan)
    if (!surat.perihal || !surat.pengirim) return;

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
        logger.error("API Key Gemini tidak ditemukan.");
        return;
    }

    try {
        const db = admin.firestore();
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

        // ==============================================================
        // PERSIAPAN DATA
        // ==============================================================
        const infoSuratText = `
[INFORMASI SURAT]
- Pengirim: ${surat.pengirim || '-'}
- Perihal: ${surat.perihal || '-'}
- Jenis Surat: ${surat.jenisSurat || '-'}
- Ringkasan Eksekutif: ${surat.ringkasanEksekutif || '-'}
`;

        // Ambil daftar jabatan struktural di OPD untuk rekomendasi penerima
        const jabatanSnapshot = await db.collection("jabatan").where("opdId", "==", surat.opdId).get();
        const structuralJabatans = jabatanSnapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter((j: any) => {
            if (j.level <= 5) return true;
            if (j.level === 6 || j.level === 7) {
                const n = (j.namaJabatan || "").toLowerCase();
                return n.includes("kepala") || n.includes("sekretaris") || n.includes("camat") || 
                       n.includes("lurah") || n.includes("direktur") || n.includes("kabid") || 
                       n.includes("kasubbag") || n.includes("subbag") || n.includes("kasubid") || 
                       n.includes("kasi") || n.includes("seksi");
            }
            return false;
        });
        const jabatanListText = structuralJabatans.length > 0 
            ? structuralJabatans.map((j: any) => `- ${j.namaJabatan} (ID: ${j.id})`).join('\n')
            : '- (Tidak ada data jabatan)';

        // ==============================================================
        // AGENT 1: THE STRATEGIC INSTRUCTOR
        // ==============================================================
        const promptAgent1 = `
Anda adalah "Asisten Ahli Instruksi Disposisi" untuk Pimpinan (Kepala Dinas/Badan/Biro).
Tugas tunggal Anda adalah merumuskan 2 opsi kalimat instruksi disposisi strategis yang BENAR-BENAR spesifik, tajam, dan dapat langsung dieksekusi berdasarkan informasi surat.

${infoSuratText}

[PANDUAN KECERDASAN INSTRUKSI]
1. Hindari kalimat template klise (seperti "Pelajari dan tindak lanjuti").
2. Gunakan gaya bahasa instruksi birokrat eksekutif yang tegas dan berorientasi pada hasil (action-oriented).
3. Rumuskan 2 opsi disposisi:
   - Opsi 1: Instruksi tindakan utama / penyelesaian masalah secara progresif.
   - Opsi 2: Instruksi alternatif (misal: pendelegasian, kajian teknis mendalam, administrasi, dsb).

[LOGIKA PENANGANAN SPESIFIK JIKA RELEVAN]
- Undangan Rapat: Opsi 1 siapkan materi/koordinasi. Opsi 2 delegasi kehadiran & lapor hasil.
- Permohonan Bantuan/Dana: Opsi 1 verifikasi berkas & anggaran. Opsi 2 kajian teknis.
- Aduan: Opsi 1 cek lapangan. Opsi 2 draft surat balasan.
- Edaran: Opsi 1 internalisasi/sosialisasi. Opsi 2 penyesuaian SOP.

Keluarkan dalam format JSON murni tanpa markdown:
{
  "suggestedDisposisi": ["Opsi Instruksi 1", "Opsi Instruksi 2"]
}`;

        const payloadAgent1 = {
            contents: [{ parts: [{ text: promptAgent1 }] }],
            generationConfig: {
                temperature: 0.3,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: { suggestedDisposisi: { type: "ARRAY", items: { type: "STRING" } } },
                    required: ["suggestedDisposisi"]
                }
            }
        };

        const fetchAgent1 = fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadAgent1)
        });

        // ==============================================================
        // AGENT 2: THE ORGANIZATIONAL MAPPER
        // ==============================================================
        const promptAgent2 = `
Anda adalah "Analis Organisasi dan SDM" di pemerintahan.
Tugas tunggal Anda adalah memetakan surat yang masuk dengan Jabatan Struktural yang paling relevan untuk menindaklanjutinya, berdasarkan esensi surat dan tupoksi jabatan.

${infoSuratText}

[DAFTAR KANDIDAT PENERIMA DISPOSISI (JABATAN STRUKTURAL)]
${jabatanListText}

[TUGAS ANDA]
Pilih MENGGUNAKAN LOGIKA BUKAN ASAL TEBAK maksimal 3 ID Jabatan dari daftar kandidat di atas yang tupoksinya paling selaras dengan isi/perihal surat.
- Jika terkait kepegawaian/keuangan/umum, biasanya Sekretaris atau Kasubbag terkait.
- Jika teknis spesifik, cari Bidang/Seksi yang namanya paling relevan dengan masalah surat.
- Jika ragu atau surat bersifat sangat umum, cukup pilih ID milik Sekretaris.
- HANYA GUNAKAN ID YANG TERSEDIA DI DAFTAR.

Keluarkan dalam format JSON murni tanpa markdown:
{
  "suggestedPenerimaIds": ["ID_1", "ID_2"]
}`;

        const payloadAgent2 = {
            contents: [{ parts: [{ text: promptAgent2 }] }],
            generationConfig: {
                temperature: 0.1, // Suhu lebih rendah agar lebih deterministik dan akurat memetakan ID
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: { suggestedPenerimaIds: { type: "ARRAY", items: { type: "STRING" } } },
                    required: ["suggestedPenerimaIds"]
                }
            }
        };

        const fetchAgent2 = fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadAgent2)
        });

        // ==============================================================
        // EKSEKUSI PARALEL (MINI ORCHESTRATOR)
        // ==============================================================
        const [resAgent1, resAgent2] = await Promise.all([fetchAgent1, fetchAgent2]);
        
        let updateData: any = {};
        
        if (resAgent1.ok) {
            const data1 = await resAgent1.json();
            const text1 = data1.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text1) {
                const parsed1 = JSON.parse(text1);
                if (parsed1.suggestedDisposisi?.length > 0) {
                    updateData.suggestedDisposisi = parsed1.suggestedDisposisi;
                }
            }
        } else {
            logger.error("Agent 1 (Instructor) Error:", await resAgent1.text());
        }

        if (resAgent2.ok) {
            const data2 = await resAgent2.json();
            const text2 = data2.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text2) {
                const parsed2 = JSON.parse(text2);
                if (parsed2.suggestedPenerimaIds?.length > 0) {
                    updateData.suggestedPenerimaIds = parsed2.suggestedPenerimaIds;
                }
            }
        } else {
            logger.error("Agent 2 (Mapper) Error:", await resAgent2.text());
        }

        // ==============================================================
        // SIMPAN HASIL KOMBINASI
        // ==============================================================
        if (Object.keys(updateData).length > 0) {
            await db.collection("surat").doc(suratId).update(updateData);
            logger.info(`Berhasil menyimpan saran disposisi AI Parallel (Mini Orchestrator) untuk surat ${suratId}`);
        }

    } catch (error) {
        logger.error(`Error pada agentStrategicDisposition untuk surat ${suratId}:`, error);
    }
});

/**
 * FUNGSI: Ekstrak Data Agenda Rapat & Surat Internal via Gemini AI
 * Khusus untuk pemindaian undangan internal, memo rapat, dan permohonan ruangan.
 */
export const extractAgendaInternalAIV2 = onCall({
    region: REGION,
    timeoutSeconds: 60,
    memory: "512MiB",
    cors: true,
    secrets: [geminiApiKey]
}, async (request) => {
    // 1. Validasi Autentikasi
    if (!request.auth || !request.auth.uid) {
        throw new HttpsError("unauthenticated", "Harus login untuk menggunakan AI.");
    }

    const uid = request.auth.uid;
    const db = getFirestore("database-siyap");
    const rateLimitRef = db.collection('rate_limits').doc(`ai_agenda_${uid}`);

    // 2. Rate Limiting
    try {
        await db.runTransaction(async (transaction) => {
            const rateLimitDoc = await transaction.get(rateLimitRef);
            const now = Date.now();

            if (rateLimitDoc.exists) {
                const lastCallTime = rateLimitDoc.data()?.lastCallTime || 0;
                const timeDiff = now - lastCallTime;
                
                if (timeDiff < COOLDOWN_SECONDS * 1000) {
                    const remainingTime = Math.ceil((COOLDOWN_SECONDS * 1000 - timeDiff) / 1000);
                    throw new HttpsError(
                        "resource-exhausted", 
                        `Harap tunggu ${remainingTime} detik sebelum memindai lagi.`
                    );
                }
            }

            transaction.set(rateLimitRef, { 
                lastCallTime: now,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        });
    } catch (error: any) {
        if (error instanceof HttpsError) throw error;
        logger.error("Error pada Rate Limiter Agenda:", error);
        throw new HttpsError("internal", "Gagal memverifikasi limit keamanan.");
    }

    // 3. Validasi Payload (Mendukung single image atau multi-page PDF images)
    const { base64Image, base64Images } = request.data;
    const imagesToProcess: string[] = [];

    if (Array.isArray(base64Images) && base64Images.length > 0) {
        imagesToProcess.push(...base64Images.slice(0, 5));
    } else if (base64Image && typeof base64Image === 'string') {
        imagesToProcess.push(base64Image);
    }

    if (imagesToProcess.length === 0) {
        throw new HttpsError("invalid-argument", "Gambar dokumen surat internal tidak disertakan.");
    }

    const apiKey = geminiApiKey.value(); 
    if (!apiKey) {
        throw new HttpsError("internal", "API Key untuk Gemini tidak terkonfigurasi di server.");
    }

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
        
        const promptText = `
              Anda adalah asisten cerdas untuk sistem manajemen agenda dan rapat internal pemerintahan/korporasi.
              Tugas Anda adalah membaca dan menganalisis seluruh halaman gambar surat undangan internal (termasuk halaman pertama dan halaman lampiran daftar peserta) untuk mengekstrak data jadwal acara dan daftar peserta secara terstruktur.

              PANDUAN EKSTRAKSI:
              1. **kegiatan**: Nama, topik, atau perihal kegiatan/rapat secara lengkap dan formal.
              2. **tanggalMulai**: Tanggal pelaksanaan kegiatan dalam format YYYY-MM-DD. Jika berupa rentang hari, ambil tanggal hari pertama.
              3. **jamMulai**: Jam mulai acara dalam format 24-jam HH:mm (contoh: "08:30", "13:00", "09:00").
              4. **jamSelesai**: Jam selesai acara dalam format 24-jam HH:mm (contoh: "11:30"). Jika tertulis "s.d. Selesai" atau tidak disebutkan, isi null.
              5. **namaTempat**: Nama ruangan rapat atau gedung fisik yang digunakan (contoh: "Ruang Meeting 1 Gedung RnD", "Ruang Rapat Utama", "Aula Bappeda"). Jika rapat virtual, isi "Virtual".
              6. **jenis**: "Fisik" atau "Virtual". Jika terdapat tautan rapat daring (Zoom / Meet), set ke "Virtual".
              7. **tautanRapat**: URL tautan video conference (Zoom / Google Meet / Microsoft Teams) jika ada, atau kosongkan string ("").
              8. **penanggungJawab**: Pejabat yang menandatangani / mengundang, pimpinan rapat, atau unit penanggung jawab.
              9. **peserta**: Array daftar nama jabatan / pegawai / unit yang diundang hadir.
                 - SANGAT PENTING: Periksa seluruh halaman gambar (termasuk halaman lampiran bertuliskan "Lampiran Surat", "DAFTAR PEJABAT / PEGAWAI YANG DIUNDANG", atau daftar berangka 1, 2, 3...).
                 - Ekstrak setiap baris jabatan/pegawai yang tercantum pada daftar tersebut menjadi elemen array terpisah.
                 - Contoh: ["Kepala UPTD KST Solo Technopark", "Kasubbag TU UPTD KST Solo Technopark", "Pejabat Teknis Umum UPTD KST Solo Technopark", "Manager Dukungan Bisnis Pelayanan dan Pengembangan UPTD KST Solo Technopark", "Kepala Divisi Inkubator Bisnis UPTD KST Solo Technopark"].
                 - Jika tertulis "Yth. Terlampir" di halaman 1, ambil daftar pesertanya dari halaman lampiran berikutnya.
                 - Jika tidak ada lampiran, ambil dari baris "Yth. [Nama/Jabatan]".
              10. **jumlahPersonil**: Total jumlah orang/posisi yang ada di daftar peserta (angka bulat). Jika peserta ada 5 orang, isi 5.

              Keluarkan dalam format JSON terstruktur sesuai skema.
        `;

        const schemaConfig = {
            type: "OBJECT",
            properties: {
                kegiatan: { type: "STRING" },
                tanggalMulai: { type: "STRING" },
                jamMulai: { type: "STRING" },
                jamSelesai: { type: "STRING", nullable: true },
                namaTempat: { type: "STRING" },
                jenis: { 
                    type: "STRING", 
                    enum: ["Fisik", "Virtual"] 
                },
                tautanRapat: { type: "STRING", nullable: true },
                penanggungJawab: { type: "STRING" },
                peserta: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                },
                jumlahPersonil: { type: "INTEGER", nullable: true }
            },
            required: ["kegiatan", "tanggalMulai", "jamMulai", "namaTempat", "jenis", "penanggungJawab", "peserta"]
        };

        const imageParts = imagesToProcess.map(imgBase64 => ({
            inlineData: {
                mimeType: "image/jpeg",
                data: imgBase64
            }
        }));

        const payload = {
            contents: [{ 
                parts: [
                    ...imageParts,
                    { text: promptText }
                ] 
            }],
            generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: schemaConfig
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            logger.error("Gemini API Error Details (Agenda Internal):", errorBody);
            throw new HttpsError("internal", "Gagal memproses AI pada server.");
        }

        const result = await response.json();
        const textPart = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!textPart) {
             throw new HttpsError("data-loss", "AI tidak menghasilkan respons terstruktur.");
        }

        return JSON.parse(textPart);

    } catch (error: any) {
        logger.error("Error di fungsi extractAgendaInternalAIV2:", error);
        throw new HttpsError("internal", error.message || "Terjadi kesalahan internal AI saat memindai surat internal.");
    }
});

