import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key Gemini tidak ditemukan.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Prioritaskan model flash-lite
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-1.5-flash"
    ];
    
    let model;
    for (const modelName of candidateModels) {
      try {
        model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.3, // Lebih rendah untuk tata bahasa agar tidak berhalusinasi
            responseMimeType: "application/json",
          }
        });
        break; 
      } catch (e) {
        // fallback to next
      }
    }

    if (!model) {
      throw new Error("Gagal menginisialisasi model Generative AI.");
    }

    const body = await req.json();
    const { content } = body;

    if (!content) {
        return NextResponse.json({ error: 'Konten tidak boleh kosong.' }, { status: 400 });
    }

    const systemInstruction = `
Anda adalah Editor Tata Bahasa AI Profesional khusus untuk Naskah Dinas Pemerintahan Indonesia.
Tugas Anda adalah memperbaiki tata bahasa, merapikan struktur, serta memastikan penggunaan Ejaan Yang Disempurnakan (EYD) yang tepat pada draft dokumen kedinasan, tanpa mengubah makna dan maksud aslinya.

ATURAN:
1. JANGAN menghapus variabel/placeholder yang menggunakan format {{nama_variabel}}. Biarkan persis apa adanya.
2. JANGAN menambahkan format yang tidak perlu jika pengguna tidak memintanya. Pertahankan struktur Markdown asli (jika ada).
3. Hanya perbaiki salah ketik, struktur kalimat yang rancu, dan pastikan pemilihan kata baku dan sopan sesuai gaya bahasa birokrasi pemerintahan.

Teks sumber:
${content}

Respons Anda HARUS berupa JSON murni dengan format:
{
  "content": "Teks markdown yang telah disempurnakan..."
}
`;

    const result = await model.generateContent(systemInstruction);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error in AI Grammar:', error);
    return NextResponse.json(
      { error: 'Gagal menyempurnakan teks dengan AI.', details: error.message },
      { status: 500 }
    );
  }
}
