// Lokasi: src/app/api/ai/suggest-eskalasi/route.ts
// [BARU] Endpoint AI untuk generate draf "Telaah Staf" (Eskalasi Bottom-Up)

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { surat, atasanProfile } = await request.json();

    if (!surat || !atasanProfile) {
      return NextResponse.json({ error: 'Data surat atau profil atasan tidak lengkap.' }, { status: 400 });
    }

    const rawApiKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawApiKey.replace(/^["']|["']$/g, '').trim();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key AI belum dikonfigurasi.' }, { status: 500 });
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error("Tidak ada respons dari AI.");
    }

    const cleanedText = textResponse.replace(/^["']|["']$/g, '').trim();

    return NextResponse.json({ success: true, suggestedNote: cleanedText });

  } catch (error: any) {
    console.error('AI Eskalasi Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses saran AI.' }, { status: 500 });
  }
}