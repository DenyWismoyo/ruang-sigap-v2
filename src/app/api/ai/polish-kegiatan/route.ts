import { NextRequest, NextResponse } from 'next/server';
import { generateContentWithSdkFailover } from '@/lib/geminiFailover';
import { detectAktivitasFromLogbookText, getAktivitasSoloById } from '@/data/masterAktivitasSolo';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, userJabatan, currentAktivitasId } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ error: 'Teks uraian kegiatan tidak boleh kosong.' }, { status: 400 });
    }

    const prompt = `
Anda adalah Pakar Tata Naskah Dinas & Analis Kinerja Kepegawaian Pemerintah Kota Surakarta.
Tugas Anda adalah memoles (polish) catatan pekerjaan/kegiatan harian ASN yang ditulis secara santai, singkat, atau informal menjadi kalimat naskah dinas formal aparatur pemerintah yang elegan, lugas, profesional, dan akuntabel bagi verifikator atasan / Inspektorat.

Aturan Pemolesan (Style Guide):
1. Gunakan kata kerja operasional aktif baku (misal: "Menyusun...", "Memvalidasi...", "Melaksanakan koordinasi...", "Mengadministrasikan...", "Memverifikasi...", "Merekapitulasi...").
2. Hindari singkatan informal atau bahasa gaul sehari-hari.
3. Hubungkan dengan konteks jabatan: "${userJabatan || 'Staf ASN'}".
4. Cocokkan dengan salah satu dari 152 Kamus Aktivitas Resmi Kepwal Surakarta No. 786/154/2020.
5. Pertahankan esensi tugas asli, jangan mengubah makna pekerjaan yang dilakukan.

Teks Input Asli:
"""${text}"""

${currentAktivitasId ? `Aktivitas saat ini yang dipilih: ID ${currentAktivitasId}` : ''}

Kembalikan respon dalam format JSON:
{
  "polishedText": "Kalimat hasil polesan formal kedinasan yang rapi dan akuntabel",
  "aktivitasId": 41, // nomor ID dari kamus Kepwal Solo (1 s.d. 152) yang paling cocok
  "aktivitasNama": "Nama resmi aktivitas Kepwal",
  "nilaiPoin": 64, // nilai poin / menit kerja efektif
  "explanation": "Alasan singkat penyempurnaan kalimat"
}
`;

    let responseText = "";
    try {
      const res = await generateContentWithSdkFailover(prompt, {
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      });
      responseText = res.text;
    } catch (e) {
      console.warn('[Polish Kegiatan] Seluruh key/model gagal, menggunakan fallback lokal:', e);
    }

    if (!responseText) {
      // Fallback local jika inisialisasi / generasi AI gagal
      const detected = detectAktivitasFromLogbookText(text);
      return NextResponse.json({
        polishedText: text.charAt(0).toUpperCase() + text.slice(1),
        aktivitasId: detected?.id || currentAktivitasId || 41,
        aktivitasNama: detected?.nama || "Membuat laporan",
        nilaiPoin: detected?.nilaiPoin || 64,
        explanation: "Poles lokal standar tata bahasa."
      });
    }

    try {
      const parsed = JSON.parse(responseText);
      const matched = getAktivitasSoloById(Number(parsed.aktivitasId));

      return NextResponse.json({
        polishedText: parsed.polishedText || text,
        aktivitasId: matched ? matched.id : (parsed.aktivitasId || currentAktivitasId || 41),
        aktivitasNama: matched ? matched.nama : (parsed.aktivitasNama || "Membuat laporan"),
        nilaiPoin: matched ? matched.nilaiPoin : (parsed.nilaiPoin || 64),
        explanation: parsed.explanation || "Bahasa diperhalus sesuai tata naskah dinas formal."
      });
    } catch (parseError) {
      console.warn("Gagal parse output AI:", responseText);
      return NextResponse.json({
        polishedText: text.charAt(0).toUpperCase() + text.slice(1),
        aktivitasId: currentAktivitasId || 41,
        aktivitasNama: "Membuat laporan",
        nilaiPoin: 64,
        explanation: "Format dipelihara."
      });
    }

  } catch (error: any) {
    console.error("Error di /api/ai/polish-kegiatan:", error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem AI.' }, { status: 500 });
  }
}
