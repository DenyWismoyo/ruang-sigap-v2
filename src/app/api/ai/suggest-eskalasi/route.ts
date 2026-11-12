// Lokasi: src/app/api/ai/suggest-eskalasi/route.ts
// [BARU] Endpoint AI untuk generate draf "Telaah Staf" (Eskalasi Bottom-Up)

import { NextResponse } from 'next/server';
import { fetchGeminiWithFailover } from '@/lib/geminiFailover';

export async function POST(request: Request) {
  try {
    const { surat, atasanProfile } = await request.json();

    if (!surat || !atasanProfile) {
      return NextResponse.json({ error: 'Data surat atau profil atasan tidak lengkap.' }, { status: 400 });
    }

    const prompt = `
      Anda adalah seorang staf / sekretaris profesional yang bekerja di Instansi Pemerintahan Indonesia.
      Tugas Anda adalah membuat 1 kalimat ringkas untuk menaikkan (mengeskalasi) sebuah surat kepada atasan Anda.
      
      Informasi Surat:
      - Perihal: "${surat.perihal}"
      - Pengirim: "${surat.pengirim}"
      - Jenis: "${surat.jenisSurat || 'Umum'}"

      Target Pimpinan (Atasan):
      - Nama Jabatan: "${atasanProfile.namaJabatan}"
      
      Instruksi:
      Buatlah draf "Telaah Staf" atau kalimat pengantar yang SANGAT SINGKAT (maksimal 2 kalimat), bernada sopan, formal, dan sesuai dengan tata bahasa birokrasi pemerintahan. 
      Fokuskan kalimat untuk meminta arahan, petunjuk, atau persetujuan dari pimpinan terkait surat tersebut.
      
      HANYA kembalikan teks hasil drafnya saja tanpa awalan/akhiran, tanpa format markdown, dan tanpa tanda kutip di awal/akhir.
    `;

    const aiRes = await fetchGeminiWithFailover({
      contents: [{ parts: [{ text: prompt }] }],
    });

    const textResponse = aiRes.text;
    
    if (!aiRes.ok || !textResponse) {
      throw new Error(aiRes.data?.error?.message || "Tidak ada respons dari AI.");
    }

    const cleanedText = textResponse.replace(/^["']|["']$/g, '').trim();

    return NextResponse.json({ success: true, suggestedNote: cleanedText });

  } catch (error: any) {
    console.error('AI Eskalasi Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses saran AI.' }, { status: 500 });
  }
}