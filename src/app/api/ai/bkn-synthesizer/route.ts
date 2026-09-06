import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RencanaHasilKerjaBkn, LogbookKegiatan } from '@/types';

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key Gemini tidak ditemukan.' }, { status: 500 });
    }

    const body = await req.json();
    const { 
      rhkItem, 
      kegiatanList, 
      periode = 'Triwulan', 
      userNama = 'Pegawai ASN', 
      userJabatan = 'Aparatur Sipil Negara' 
    }: {
      rhkItem: RencanaHasilKerjaBkn;
      kegiatanList: LogbookKegiatan[];
      periode?: string;
      userNama?: string;
      userJabatan?: string;
    } = body;

    if (!rhkItem || !rhkItem.rencanaHasilKerja) {
      return NextResponse.json({ error: 'Data RHK tidak valid atau kosong.' }, { status: 400 });
    }

    const daftarKegiatanText = (kegiatanList || [])
      .slice(0, 50) // Batasi 50 kegiatan terpenting untuk efisiensi token
      .map((k, idx) => `${idx + 1}. [${k.waktuMulai || '-'} s/d ${k.waktuSelesai || '-'}] ${k.deskripsi} (Kuantitas: ${k.kuantitas || 1} ${k.satuan || 'kegiatan'}${k.buktiNama ? `, Bukti: ${k.buktiNama}` : ''})`)
      .join('\n');

    const prompt = `
Anda adalah Pakar Penilai Kinerja ASN Nasional & Analis Kebijakan PermenPANRB No. 6 Tahun 2022 (Pengelolaan Kinerja Pegawai ASN) pada Badan Kepegawaian Negara (BKN).

Tugas Anda adalah menganalisis data Rencana Hasil Kerja (RHK) tahunan serta jejak rekapitulasi aktivitas pekerjaan harian seorang pegawai ASN selama periode evaluasi (${periode}), kemudian merumuskan formulasi standar dokumen penilaian e-Kinerja BKN (kinerja.bkn.go.id) yang profesional, akuntabel, dan siap diverifikasi oleh Pejabat Penilai Kinerja.

PROFIL PEGAWAI:
- Nama: ${userNama}
- Jabatan: ${userJabatan}
- Periode Evaluasi: ${periode}

INFORMASI RHK BKN YANG DIANALISIS:
- RHK Pimpinan yang Diintervensi: "${rhkItem.rhkPimpinan || '-'}"
- Rencana Hasil Kerja (RHK Pegawai): "${rhkItem.rencanaHasilKerja}"
- Klasifikasi / Jenis: ${rhkItem.klasifikasi} / ${rhkItem.jenis}
- Indikator Kuantitas: "${rhkItem.aspekKuantitas?.indikator || 'Jumlah dokumen/laporan yang diselesaikan'}" (Target: "${rhkItem.aspekKuantitas?.target || '1 Laporan'}")
- Indikator Kualitas: "${rhkItem.aspekKualitas?.indikator || 'Persentase kesesuaian dan keakuratan hasil kerja'}" (Target: "${rhkItem.aspekKualitas?.target || '100 Persen'}")
- Indikator Waktu: "${rhkItem.aspekWaktu?.indikator || 'Ketepatan waktu pemenuhan target'}" (Target: "${rhkItem.aspekWaktu?.target || '12 Bulan'}")

REKAPITULASI AKTIVITAS LOGBOOK HARIAN & TUGAS TERKAIT SELAMA PERIODE INI:
"""
${daftarKegiatanText || 'Belum ada catatan logbook harian spesifik yang ditandai untuk RHK ini. Gunakan narasi standar berbasis RHK dan jabatan.'}
"""

ATURAN FORMULASI STANDAR E-KINERJA BKN:
1. RENCANA AKSI (Tahap 1): Uraikan aksi taktis konkret yang mencerminkan terobosan / pelaksanaan tugas untuk periode ini. Tidak bertele-tele (contoh: "Penyusunan Berita Acara KDP dan Rekonsiliasi Pengamanan Aset SKPD").
2. TARGET AKSI (Tahap 1): Target spesifik pada periode penilaian ini (contoh: "1 Dokumen", "1 Laporan", atau "2 Kegiatan").
3. NAMA EVIDEN (Tahap 2): Judul berkas fisik atau digital pembuktian (contoh: "Berita Acara KDP dan Laporan Pengamanan BMD").
4. REALISASI KUANTITAS: Formula baku: "[Volume] [Satuan] telah diselesaikan sesuai target dan diverifikasi pimpinan berdasarkan Bukti Dukung terlampir."
5. REALISASI KUALITAS: Menjelaskan mutu dan akurasi (contoh: "100% kesesuaian dokumen dengan ketentuan perundang-undangan yang berlaku.").
6. REALISASI WAKTU: Menjelaskan ketepatan waktu penyelesaian (contoh: "3 Bulan penyelesaian tepat waktu pada periode ${periode}.").
7. SUMBER DATA: Asal usul data / sistem pencatatan resmi (contoh: "Aplikasi Tata Kelola E-Office RUANG SIGAP / SIMDA").
8. RINGKASAN EKSEKUTIF: Uraian narasi singkat 2-3 kalimat mengenai kontribusi pegawai dalam pencapaian indikator pimpinan.

Kembalikan jawaban HANYA dalam format JSON valid:
{
  "rencanaAksi": "Kalimat rencana aksi taktis untuk form BKN",
  "targetAksi": "1 Laporan",
  "namaEviden": "Nama resmi dokumen eviden",
  "realisasiKuantitas": "Formula realisasi kuantitas",
  "realisasiKualitas": "Formula realisasi kualitas",
  "realisasiWaktu": "Formula realisasi waktu",
  "sumberData": "Aplikasi Tata Kelola E-Office RUANG SIGAP",
  "ringkasanEksekutif": "Ringkasan kontribusi kinerja triwulan ini"
}
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    // Wajib menggunakan lini Flash Lite sesuai standar .agents/rules/gemini-ai-model-standards.md
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite"
    ];

    let responseText = "";
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          }
        });
        const result = await model.generateContent(prompt);
        responseText = result.response.text();
        if (responseText) break;
      } catch (e) {
        console.warn(`[BKN Synthesizer] Percobaan model ${modelName} gagal, mencoba model fallback:`, e);
      }
    }

    if (!responseText) {
      // Fallback lokal deterministik jika API AI offline
      const fallbackTarget = rhkItem.aspekKuantitas?.target || '1 Laporan';
      return NextResponse.json({
        rencanaAksi: rhkItem.rencanaAksiDefault || `Pelaksanaan dan pelaporan ${rhkItem.rencanaHasilKerja}`,
        targetAksi: rhkItem.targetDefault || fallbackTarget,
        namaEviden: `Dokumen Bukti Capaian ${rhkItem.rencanaHasilKerja}`,
        realisasiKuantitas: `${fallbackTarget} telah diselesaikan sesuai target dan diverifikasi pimpinan berdasarkan Bukti Dukung terlampir.`,
        realisasiKualitas: `100% kesesuaian hasil pelaksanaan kerja dengan standar operasional prosedur.`,
        realisasiWaktu: `Pemenuhan target tepat waktu pada periode ${periode}.`,
        sumberData: `Aplikasi Tata Kelola E-Office RUANG SIGAP`,
        ringkasanEksekutif: `Telah diselesaikan serangkaian tugas kedinasan untuk mendukung capaian RHK "${rhkItem.rencanaHasilKerja}".`
      });
    }

    try {
      const parsed = JSON.parse(responseText);
      return NextResponse.json({
        rencanaAksi: parsed.rencanaAksi || `Pelaksanaan ${rhkItem.rencanaHasilKerja}`,
        targetAksi: parsed.targetAksi || rhkItem.aspekKuantitas?.target || '1 Laporan',
        namaEviden: parsed.namaEviden || `Dokumen Eviden ${rhkItem.rencanaHasilKerja}`,
        realisasiKuantitas: parsed.realisasiKuantitas || `${rhkItem.aspekKuantitas?.target || '1 Laporan'} telah diselesaikan berdasarkan Bukti Dukung.`,
        realisasiKualitas: parsed.realisasiKualitas || '100% kesesuaian dokumen.',
        realisasiWaktu: parsed.realisasiWaktu || `Tepat waktu pada ${periode}.`,
        sumberData: parsed.sumberData || 'Aplikasi Tata Kelola E-Office RUANG SIGAP',
        ringkasanEksekutif: parsed.ringkasanEksekutif || 'Capaian kinerja tercapai optimal.'
      });
    } catch (parseError) {
      console.warn("[BKN Synthesizer] Gagal parse output JSON AI:", responseText);
      return NextResponse.json({
        rencanaAksi: `Pelaksanaan ${rhkItem.rencanaHasilKerja}`,
        targetAksi: rhkItem.aspekKuantitas?.target || '1 Laporan',
        namaEviden: `Dokumen Bukti Capaian ${rhkItem.rencanaHasilKerja}`,
        realisasiKuantitas: `${rhkItem.aspekKuantitas?.target || '1 Laporan'} telah diselesaikan sesuai ketentuan.`,
        realisasiKualitas: '100% kesesuaian dokumen.',
        realisasiWaktu: `Tepat waktu pada periode ${periode}.`,
        sumberData: 'Aplikasi Tata Kelola E-Office RUANG SIGAP',
        ringkasanEksekutif: 'Capaian kinerja terlaksana dengan baik.'
      });
    }

  } catch (error: any) {
    console.error("Error di /api/ai/bkn-synthesizer:", error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem AI BKN Synthesizer.' }, { status: 500 });
  }
}
