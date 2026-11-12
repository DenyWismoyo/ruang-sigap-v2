import { NextResponse } from 'next/server';
import { fetchGeminiWithFailover } from '@/lib/geminiFailover';

export async function POST(request: Request) {
  try {
    const { aiInput } = await request.json();

    if (!aiInput || typeof aiInput !== 'string' || !aiInput.trim()) {
      return NextResponse.json(
        { error: 'Catatan rapat tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const systemPrompt = `Anda adalah seorang notulis rapat profesional. Susun catatan mentah berikut menjadi notulensi formal. Gunakan format Markdown (Bold dan List).
            
Struktur Wajib:
**Tanggal:** [Isi]
**Pimpinan:** [Isi]
**Peserta:** [List]
---
**Agenda:** [Isi]
**Pembahasan:** [Poin-poin]
**Kesimpulan:** [Poin-poin]
**Tindak Lanjut (Action Items):**
- [ ] [Item Tindak Lanjut]
`;

    const aiRes = await fetchGeminiWithFailover({
      contents: [
        {
          parts: [{ text: `${systemPrompt}\n\nCatatan Rapat:\n${aiInput}` }],
        },
      ],
    });

    if (!aiRes.ok || !aiRes.text) {
      return NextResponse.json(
        { error: aiRes.data?.error?.message || 'Gagal mendapatkan respons dari AI.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, text: aiRes.text });
  } catch (error: any) {
    console.error('[AI Draft Notulensi Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal menyusun draf notulensi dengan AI.' },
      { status: 500 }
    );
  }
}
