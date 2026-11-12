import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithSdkFailover } from '@/lib/geminiFailover';

export async function POST(req: NextRequest) {
  try {
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

    const { text: responseText } = await generateContentWithSdkFailover(systemInstruction, {
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

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
