import { NextResponse } from 'next/server';
import { fetchGeminiWithFailover } from '@/lib/geminiFailover';

export async function POST(request: Request) {
  try {
    const { base64Image, mimeType = 'image/png' } = await request.json();

    if (!base64Image || typeof base64Image !== 'string') {
      return NextResponse.json(
        { error: 'Gambar dokumen anggaran (base64Image) wajib disertakan.' },
        { status: 400 }
      );
    }

    const prompt = `
      Analisis gambar dokumen anggaran (RKA/DPA) ini.
      Ekstrak data tabel menjadi array JSON.
      Ambil kolom: "Kode Rekening", "Uraian", dan "Jumlah/Pagu Anggaran".
      
      Abaikan baris header, tanda tangan, atau total. Ambil baris item saja.
      Format JSON yang diharapkan:
      [
          { "kode": "5.1.02...", "uraian": "Belanja ATK", "anggaran": 1500000 }
      ]
      Pastikan 'anggaran' adalah number (hilangkan Rp dan titik).
      Kembalikan HANYA JSON Array murni tanpa markdown.
    `;

    const aiRes = await fetchGeminiWithFailover({
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Image } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    });

    if (!aiRes.ok || !aiRes.text) {
      return NextResponse.json(
        { error: aiRes.data?.error?.message || 'Gagal menghubungi layanan Gemini Flash-Lite.' },
        { status: 500 }
      );
    }

    const jsonStr = aiRes.text.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(jsonStr);

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return NextResponse.json(
        { error: 'AI tidak menemukan data tabel yang valid pada dokumen.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('[AI Extract Anggaran Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses dokumen anggaran dengan AI.' },
      { status: 500 }
    );
  }
}
