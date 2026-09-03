// Lokasi: src/app/api/ai/suggest-disposition/route.ts
// [HISTORY UPDATE]
// - [BARU] API Route untuk analisis AI menggunakan Google Gemini.
// - Menerima data surat dan daftar bawahan.
// - Prompt direkayasa untuk memilih TEPAT 1 (SATU) bawahan yang paling relevan.
// - Mengembalikan format JSON berisi ID penerima dan saran instruksi.
// - [FIX] Update Model AI ke gemini-2.0-flash

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { surat, bawahanList } = await request.json();

    if (!surat || !bawahanList || bawahanList.length === 0) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 });
    }

    // 1. Siapkan API Key
    const rawApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
    const apiKey = rawApiKey.replace(/^["']|["']$/g, '').trim();
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key AI belum dikonfigurasi.' }, { status: 500 });
    }

    // 2. Susun Context untuk AI (Daftar Jabatan Bawahan)
    const bawahanContext = bawahanList.map((b: any) => 
      `- ID: ${b.jabatanId}, Jabatan: ${b.namaJabatan}, Pejabat: ${b.namaLengkap}`
    ).join('\n');

    // 3. Susun Prompt
    const prompt = `
      Anda adalah asisten ahli birokrasi yang cerdas. Tugas Anda adalah membantu pimpinan melakukan disposisi surat dinas.
      
      Konteks Surat:
      - Perihal: "${surat.perihal}"
      - Pengirim: "${surat.pengirim}"
      - Jenis: "${surat.jenisSurat || 'Umum'}"
      - Ringkasan: "${surat.ringkasanEksekutif || '-'}"
      
      Daftar Bawahan Tersedia:
      ${bawahanContext}
      
      Tugas:
      Analisis perihal dan konteks surat di atas. Pilih TEPAT 1 (SATU) bawahan yang paling relevan dan memiliki wewenang untuk menangani surat ini berdasarkan nama jabatannya.
      Berikan juga saran instruksi disposisi yang singkat, tegas, dan sesuai konteks surat.

      Format Jawaban WAJIB JSON murni (tanpa markdown code block):
      {
        "suggestedRecipients": ["ID_BAWAHAN_TERPILIH"],
        "suggestedInstruction": "Teks instruksi yang disarankan..."
      }
    `;

    // 4. Panggil Google Gemini API
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

    // 5. Parsing Response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error("Tidak ada respons dari AI.");
    }

    // Bersihkan markdown formatting jika AI tetap memberikannya (fallback safety)
    const cleanedText = textResponse.replace(/```json|```/g, '').trim();
    
    let result;
    try {
        result = JSON.parse(cleanedText);
    } catch (e) {
        console.error("Gagal parse JSON dari AI:", cleanedText);
        throw new Error("Format respons AI tidak valid.");
    }

    return NextResponse.json({ success: true, ...result });

  } catch (error: any) {
    console.error('AI Error:', error);
    return NextResponse.json({ error: error.message || 'Gagal memproses saran AI.' }, { status: 500 });
  }
}