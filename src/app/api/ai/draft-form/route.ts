import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
    try {
        const { prompt, variables } = await req.json();

        if (!prompt || !variables || !Array.isArray(variables)) {
            return NextResponse.json({ error: 'Prompt dan variables wajib diisi.' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

        const systemInstruction = `
Anda adalah asisten AI untuk mempermudah pembuatan surat di instansi pemerintahan.
Tugas Anda adalah mengisi nilai dari variabel-variabel surat berdasarkan instruksi atau prompt dari pengguna.
Berikut adalah daftar variabel yang tersedia:
${variables.join(', ')}

Instruksi Pengguna:
"${prompt}"

Tolong berikan balasan HANYA dalam format JSON object murni (tanpa markdown blok, tanpa backtick) dengan key berupa nama variabel, dan value berupa teks yang diisi.
Jika variabel tidak disebutkan dalam instruksi pengguna, biarkan string kosong "".
Contoh output:
{
  "acara": "Rapat Koordinasi Nasional",
  "tempat": "Hotel Indonesia",
  "tanggal": "12 Agustus 2026",
  "nama_pegawai": "Budi Santoso"
}`;

        const result = await model.generateContent(systemInstruction);
        const responseText = result.response.text();
        
        // Membersihkan jika ada backticks markdown
        const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const parsedData = JSON.parse(cleanJsonStr);
            return NextResponse.json({ data: parsedData });
        } catch (e) {
            console.error("Gagal parsing JSON dari AI:", cleanJsonStr);
            return NextResponse.json({ error: 'AI mengembalikan format yang tidak valid.' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('AI Draft Form error:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan pada server saat memproses AI.' },
            { status: 500 }
        );
    }
}
