import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithSdkFailover } from '@/lib/geminiFailover';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: NextRequest) {
  try {
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

    const { text: responseText } = await generateContentWithSdkFailover(systemInstruction, {
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

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
