// Lokasi: src/app/api/ai/copilot/suggestions/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key Gemini belum dikonfigurasi." },
        { status: 500 }
      );
    }

    const { userContext, pageContext, welcomeSummary } = await req.json();
    const opdId = userContext?.opdId;
    const namaLengkap = userContext?.namaLengkap || 'User';
    const jabatanId = userContext?.jabatanId || '';
    const role = userContext?.role || 'ASN';

    // RAG Context untuk saran (kita cukup ambil summary saja)
    let contextStr = "Tidak ada data.";
    if (welcomeSummary) {
      contextStr = `
- Disposisi Baru: ${welcomeSummary.disposisiBaru || 0}
- Tindak Lanjut Menunggu: ${welcomeSummary.tindakLanjutMenunggu || 0}
- Tugas Mendekati Deadline: ${welcomeSummary.tugasMendekatiDeadline || 0}
- Surat Baru Hari Ini: ${welcomeSummary.suratBaruHariIni || 0}
      `;
    }

    const systemInstruction = `
Anda adalah asisten AI "Poros Copilot" untuk ASN. 
Tugas Anda: berdasarkan metrik dashboard (Konteks Pengguna) dan lokasi halaman saat ini, hasilkan tepat 3 saran *prompt* yang paling KRUSIAL, SPESIFIK, dan BISA DITINDAKLANJUTI (*actionable*).
ATURAN KETAT:
1. Hindari saran yang ambigu, puitis, atau tidak relevan dengan tugas administratif ASN.
2. Jika ada metrik "Disposisi Baru" > 0, WAJIB sarankan: "Bantu isi tindak lanjut disposisi baru".
3. Jika ada metrik "Surat Baru" > 0, WAJIB sarankan: "Tampilkan surat masuk hari ini".
4. Kalimat saran maksimal 8 kata dan langsung *to the point*.
5. Kembalikan HANYA array JSON berisi 3 string. Tanpa markdown \`\`\`json, tanpa teks tambahan.
6. Buat saran seolah-olah ditujukan kepada Anda (AI). Contoh: "Bantu rekap surat untuk saya", bukan "Rekap surat untuk [Nama]". Anda dapat sesekali menyebutkan konteks jabatan jika relevan.

Contoh Output: ["Bantu isi tindak lanjut disposisi baru", "Tampilkan surat masuk hari ini", "Bantu catat logbook harian saya"]

Konteks Pengguna:
- Nama: ${namaLengkap}
- Jabatan/Role: ${role}
${contextStr}

Halaman Saat Ini: ${pageContext?.pathname || "Dashboard Utama"}
`;

    const model = genAI.getGenerativeModel({ 
        model: "gemini-3.5-flash-lite",
        systemInstruction,
        generationConfig: {
            temperature: 0.1,
        }
    });

    const result = await model.generateContent("Berikan 3 saran pertanyaan.");
    let responseText = result.response.text();
    
    let suggestions = ["Tampilkan daftar surat yang belum saya kerjakan", "Bantu saya catat logbook hari ini", "Ada berapa disposisi baru untuk saya?"];
    try {
        const cleanJson = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed) && parsed.length >= 3) {
            suggestions = parsed.slice(0, 3);
        }
    } catch (e) {
        console.error("Failed to parse suggestions:", responseText);
    }

    return NextResponse.json({ success: true, suggestions });
  } catch (error: any) {
    console.error("[Copilot Suggestions Error]:", error);
    // Graceful fallback
    return NextResponse.json({ 
        success: true, 
        suggestions: ["Tampilkan daftar surat yang belum saya kerjakan", "Bantu saya catat logbook hari ini", "Ada berapa disposisi baru untuk saya?"] 
    });
  }
}
