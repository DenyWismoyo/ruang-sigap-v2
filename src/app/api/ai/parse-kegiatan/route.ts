import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MASTER_AKTIVITAS_SOLO, detectAktivitasFromLogbookText, getAktivitasSoloById } from '@/data/masterAktivitasSolo';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key Gemini tidak ditemukan.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Hanya gunakan varian Flash Lite terbaru (efisien, cepat, dan ekonomis)
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite"
    ];

    const body = await req.json();
    const { rawNotes, systemTraces, userNama, userJabatan, tanggalStr } = body;

    if (!rawNotes && (!systemTraces || systemTraces.length === 0)) {
      return NextResponse.json({ error: 'Tidak ada catatan atau jejak kegiatan yang dikirimkan.' }, { status: 400 });
    }

    // Bangun referensi aktivitas Kepwal populer untuk grounding prompt
    const sampleAktivitas = [
      "ID 4: Melakukan koordinasi (Dalam Daerah) [60 poin]",
      "ID 6: Melakukan koordinasi melalui media elektronik [20 poin]",
      "ID 32: Memasukkan data [35 poin]",
      "ID 41: Membuat laporan [64 poin]",
      "ID 49: Memimpin rapat [100 poin]",
      "ID 55: Memparaf Surat/Nota Dinas/Berita Acara [32 poin]",
      "ID 56: Mempelajari [60 poin]",
      "ID 69: Menandatangani Surat/Nota Dinas/Berita Acara [40 poin]",
      "ID 78: Mendiskusikan [60 poin]",
      "ID 79: Mendisposisi [30 poin]",
      "ID 89: Mengagenda [21 poin]",
      "ID 92: Menganalisis/Mengkaji/Menelaah Dokumen Lain [105 poin]",
      "ID 94: Mengarsipkan [42 poin]",
      "ID 111: Mengikuti rapat (Dalam Daerah) [75 poin]",
      "ID 119: Menyebarkan naskah dinas/dokumen/surat/brosur/leaflet [35 poin]",
      "ID 123: Mengonsep Surat/Dokumen [65 poin]",
      "ID 128: Mengoreksi Keputusan/Surat/Dokumen/Data [63 poin]",
      "ID 142: Menyiapkan Dokumen/Laporan/Bahan kerja [56 poin]",
      "ID 150: Merekapitulasi [52 poin]"
    ].join("\n");

    const promptText = `
Anda adalah Asisten Analis Kinerja ASN Pemerintah Kota Surakarta ahli regulasi Kepwal 786/154/2020 dan e-Kinerja BKPSDM.

ATURAN UTAMA (CRITICAL RULE):
1. JANGAN PERNAH MERANGKUM ATAU MENGGABUNGKAN KEGIATAN MENJADI SATU!
   Setiap jenis pekerjaan harus dipecah menjadi butir kegiatan mandiri dan terperinci ("Decomposition Over Summarization") agar pegawai mendapatkan akumulasi poin kinerja yang maksimal.
2. Alokasikan jam kerja yang realistis, logis, dan TIDAK SALING BERTABRAKAN (non-overlapping). Jam kerja dinas: rentang 07:30 s.d. 16:00 WIB.
3. Rumuskan kalimat deskripsi kegiatan dalam bahasa formal kedinasan aparatur pemerintah yang elegan, lugas, dan akurat.
4. Cocokkan setiap butir kegiatan dengan ID Kamus Aktivitas Kepwal Solo yang paling sesuai.

Profil Pegawai:
- Nama: ${userNama || 'Pegawai'}
- Jabatan: ${userJabatan || 'Staf ASN'}
- Tanggal Kegiatan: ${tanggalStr || 'Hari ini'}

Input Data yang Tersedia:
${rawNotes ? `Catatan Bebas / Dikte Teks Pegawai:\n"""${rawNotes}"""\n` : ''}
${systemTraces && systemTraces.length > 0 ? `Jejak Digital Sistem Hari Ini:\n${JSON.stringify(systemTraces, null, 2)}\n` : ''}

Referensi Sebagian Aktivitas Resmi Kepwal Solo:
${sampleAktivitas}

TUGAS:
Pecah catatan / jejak di atas menjadi daftar kegiatan harian terpisah (minimal 2 sampai 6 butir kegiatan sesuai muatan pekerjaan).
Pastikan format JSON yang dikembalikan persis seperti ini:
{
  "kegiatanList": [
    {
      "deskripsi": "Memeriksa kelengkapan administrasi...",
      "waktuMulai": "08:00",
      "waktuSelesai": "09:30",
      "aktivitasId": 32,
      "kategori": "Teknis"
    }
  ]
}
Kategori yang valid: "Persuratan" | "Disposisi" | "Laporan" | "Rapat" | "Tugas" | "Umum".
`;

    let responseText = "";
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.5,
            responseMimeType: "application/json",
          }
        });
        const result = await model.generateContent(promptText);
        responseText = result.response.text();
        if (responseText) break;
      } catch (e) {
        console.warn(`[Parse Kegiatan] Percobaan model ${modelName} gagal, mencoba fallback:`, e);
      }
    }

    if (!responseText) {
      throw new Error("Gagal mendapatkan respons dari model Gemini Flash Lite.");
    }
    const parsedData = JSON.parse(responseText);

    const rawList = Array.isArray(parsedData.kegiatanList) ? parsedData.kegiatanList : [];

    // Validasi & perkaya setiap item dengan data master 152 aktivitas Kepwal Solo
    const enrichedList = rawList.map((item: any, idx: number) => {
      let aktivitas = item.aktivitasId ? getAktivitasSoloById(Number(item.aktivitasId)) : undefined;
      
      if (!aktivitas) {
        aktivitas = detectAktivitasFromLogbookText(item.deskripsi);
      }

      // Hitung durasi menit
      let durasiMenit = 60;
      if (item.waktuMulai && item.waktuSelesai) {
        const [startH, startM] = item.waktuMulai.split(':').map(Number);
        const [endH, endM] = item.waktuSelesai.split(':').map(Number);
        if (!isNaN(startH) && !isNaN(endH)) {
          durasiMenit = Math.max(15, (endH * 60 + endM) - (startH * 60 + startM));
        }
      }

      return {
        id: `ai_${Date.now()}_${idx}`,
        deskripsi: item.deskripsi || 'Melaksanakan kegiatan kedinasan',
        waktuMulai: item.waktuMulai || '08:00',
        waktuSelesai: item.waktuSelesai || '09:30',
        durasiMenit: durasiMenit,
        kategori: item.kategori || (aktivitas?.kategori || 'Umum'),
        aktivitasId: aktivitas?.id,
        aktivitasNama: aktivitas?.nama,
        nilaiPoin: aktivitas?.nilaiPoin || 35,
        selected: true
      };
    });

    const totalPoin = enrichedList.reduce((acc: number, curr: any) => acc + (curr.nilaiPoin || 0), 0);
    const totalMenit = enrichedList.reduce((acc: number, curr: any) => acc + (curr.durasiMenit || 0), 0);

    return NextResponse.json({
      success: true,
      kegiatanList: enrichedList,
      totalPoin,
      totalMenit,
      totalJam: (totalMenit / 60).toFixed(1)
    });

  } catch (error: any) {
    console.error('Error in parse-kegiatan API:', error);
    return NextResponse.json(
      { error: 'Gagal menganalisis kegiatan dengan AI.', details: error.message },
      { status: 500 }
    );
  }
}
