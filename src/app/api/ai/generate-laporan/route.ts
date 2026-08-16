import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key Gemini tidak ditemukan.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Kita gunakan fallback array model agar lebih kuat
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
      "gemini-1.5-flash"
    ];
    
    let model;
    for (const modelName of candidateModels) {
      try {
        model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          }
        });
        break; // berhasil mendapatkan instance model
      } catch (e) {
        // fallback to next
      }
    }

    if (!model) {
      throw new Error("Gagal menginisialisasi model Generative AI.");
    }

    const body = await req.json();
    const { suratPerihal, suratPengirim, disposisiInstruksi, tindakanSingkat, userNama, userJabatan } = body;

    const systemInstruction = `
Anda adalah Asisten AI untuk Sistem Pemerintahan yang bertugas merumuskan draf "Laporan Hasil Tindak Lanjut" menjadi bahasa kedinasan yang profesional, baku, dan jelas.

Kontek Dokumen:
- Perihal Surat: ${suratPerihal || '-'}
- Pengirim Surat: ${suratPengirim || '-'}
- Instruksi Disposisi Pimpinan: ${disposisiInstruksi || '-'}
- Tindakan Singkat yang diinput Pegawai: ${tindakanSingkat || '-'}

Data Pegawai Pelapor:
- Nama: ${userNama || '-'}
- Jabatan: ${userJabatan || '-'}

TUGAS ANDA:
1. Ubah "Tindakan Singkat yang diinput Pegawai" menjadi kalimat narasi laporan hasil tindak lanjut yang sangat profesional, baku, dan rapi (1-3 paragraf). Jangan menambahkan informasi palsu, cukup elaborasi secara profesional.
2. Tentukan "Kategori Logbook" yang paling relevan untuk kegiatan ini. Pilih SATU dari opsi berikut: "Surat", "Disposisi", "Laporan", "Rapat", "Tugas", "Umum". Karena ini adalah tindak lanjut disposisi surat, biasanya "Disposisi" atau "Laporan" atau "Surat" adalah yang paling relevan.

Respons Anda HARUS berupa JSON murni dengan format:
{
  "hasilTindakan": "Teks laporan yang sudah dirumuskan...",
  "kategori": "Pilihan Kategori"
}
`;

    const result = await model.generateContent(systemInstruction);
    const responseText = result.response.text();
    const parsedData = JSON.parse(responseText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Error generating laporan:', error);
    return NextResponse.json(
      { error: 'Gagal merumuskan laporan dengan AI.', details: error.message },
      { status: 500 }
    );
  }
}
