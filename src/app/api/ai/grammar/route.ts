import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithSdkFailover } from '@/lib/geminiFailover';

export async function POST(req: NextRequest) {
  try {
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

    const { text: responseText } = await generateContentWithSdkFailover(systemInstruction, {
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
      },
    });

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
