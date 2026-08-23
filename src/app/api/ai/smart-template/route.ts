import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { prompt, templates } = await req.json();

        if (!prompt || !templates || !Array.isArray(templates)) {
            return NextResponse.json({ error: 'Prompt dan templates wajib diisi.' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

        const systemInstruction = `
Anda adalah Asisten AI untuk membantu ASN/Pegawai Pemerintahan dalam membuat draf surat secara otomatis.
Tugas Anda adalah:
1. Menganalisis instruksi pengguna (prompt).
2. Memilih SATU template surat yang paling sesuai dari daftar template yang tersedia.
3. Mengekstrak informasi dari prompt untuk mengisi variabel-variabel yang dibutuhkan oleh template terpilih. Jika informasi tidak ada di prompt, kosongkan (string kosong "").

Daftar Template Tersedia (JSON):
${JSON.stringify(templates.map((t: any) => ({
    id: t.id,
    judul: t.judul,
    kategori: t.kategori,
    variabel_yang_dibutuhkan: t.variables || []
})))}

Instruksi Pengguna:
"${prompt}"

Berikan balasan HANYA berupa JSON murni (tanpa markdown blok, tanpa backtick) dengan format:
{
  "templateId": "ID template terpilih",
  "variables": {
     "nama_variabel_1": "nilai dari prompt",
     "nama_variabel_2": "nilai dari prompt"
  }
}
`;

        const result = await model.generateContent(systemInstruction);
        const responseText = result.response.text();
        
        // Bersihkan markdown JSON
        const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const parsedData = JSON.parse(cleanJsonStr);
            return NextResponse.json({ data: parsedData });
        } catch (e) {
            console.error("Gagal parsing JSON dari AI:", cleanJsonStr);
            return NextResponse.json({ error: 'AI mengembalikan format yang tidak valid.' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('AI Smart Template error:', error);
        return NextResponse.json(
            { error: 'Gagal memproses AI Smart Template: ' + (error.message || 'Unknown error') },
            { status: 500 }
        );
    }
}
