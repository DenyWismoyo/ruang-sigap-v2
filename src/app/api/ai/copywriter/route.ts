import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs/promises';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key Gemini tidak ditemukan.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Sesuai permintaan user, prioritas gemini-3.5-flash-lite
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
            temperature: 0.7,
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
    const { prompt, userNama, userJabatan, role } = body;

    if (!prompt) {
        return NextResponse.json({ error: 'Prompt tidak boleh kosong.' }, { status: 400 });
    }

    // Read Knowledge Base
    let knowledgeBaseContent = "";
    try {
        const kbDir = path.join(process.cwd(), 'public', 'docs', 'poros');
        const files = await fs.readdir(kbDir);
        for (const file of files) {
            if (file.endsWith('.md')) {
                const content = await fs.readFile(path.join(kbDir, file), 'utf-8');
                knowledgeBaseContent += `\n\n--- Start of ${file} ---\n${content}\n--- End of ${file} ---\n`;
            }
        }
    } catch (e) {
        console.warn("Could not read knowledge base files", e);
    }

    const systemInstruction = `
Anda adalah Asisten Copywriter AI Profesional untuk Aplikasi "Poros" (Sistem Informasi Tata Usaha dan Kinerja Pegawai).
Tugas Anda adalah merumuskan draf pengumuman, panduan, tutorial, atau rilis pembaruan (release notes) berdasarkan instruksi pengguna.

Konteks Peminta:
- Nama: ${userNama || '-'}
- Jabatan: ${userJabatan || '-'}
- Role: ${role || '-'}

KNOWLEDGE BASE APLIKASI (Gunakan informasi di bawah ini jika pengguna meminta tutorial/panduan fitur):
${knowledgeBaseContent || 'Belum ada data knowledge base.'}

ATURAN PENULISAN:
1. Gunakan format Markdown yang rapi dan elegan. Gunakan *headings* (##, ###), teks tebal (**teks**), *bullet points* (-), atau *blockquotes* (>) jika sesuai.
2. Nada penulisan harus profesional, informatif, namun mudah dipahami oleh pegawai atau staf.
3. Strukturkan jawaban Anda sedemikian rupa sehingga siap untuk langsung ditempel (copy-paste) ke form pengumuman tanpa perlu banyak diedit.
4. JANGAN gunakan pengantar seperti "Tentu, berikut adalah...", langsung berikan draf Markdown-nya.

TUGAS ANDA:
Buatkan draf pengumuman/tutorial untuk instruksi berikut:
"${prompt}"

Respons Anda HARUS berupa JSON murni dengan format:
{
  "content": "Teks markdown yang telah digenerate..."
}
`;

    const result = await model.generateContent(systemInstruction);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error in AI Copywriter:', error);
    return NextResponse.json(
      { error: 'Gagal merumuskan teks dengan AI.', details: error.message },
      { status: 500 }
    );
  }
}
