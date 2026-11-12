import { NextResponse } from 'next/server';
import { fetchGeminiWithFailover } from '@/lib/geminiFailover';

export async function POST(request: Request) {
  try {
    const { aiInput } = await request.json();

    if (!aiInput || typeof aiInput !== 'string' || !aiInput.trim()) {
      return NextResponse.json(
        { error: 'Tujuan tugas tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const prompt = `Anda adalah asisten perencana tugas. Berdasarkan tujuan utama berikut: "${aiInput}", pecahlah menjadi langkah-langkah kerja (action items) yang jelas dan ringkas dalam format JSON array berisi string. Contoh output: ["Langkah 1", "Langkah 2", "Langkah 3"]`;
    const schema = { type: 'ARRAY', items: { type: 'STRING' } };

    const aiRes = await fetchGeminiWithFailover({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    if (!aiRes.ok || !aiRes.text) {
      return NextResponse.json(
        { error: aiRes.data?.error?.message || 'Gagal mendapatkan respons langkah kerja dari AI.' },
        { status: 500 }
      );
    }

    const steps: string[] = JSON.parse(aiRes.text);
    return NextResponse.json({ success: true, steps });
  } catch (error: any) {
    console.error('[AI Generate Checklist Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal membuat langkah kerja dengan AI.' },
      { status: 500 }
    );
  }
}
