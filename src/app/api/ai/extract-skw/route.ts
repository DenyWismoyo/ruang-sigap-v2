import { NextResponse } from "next/server";
import { generateContentWithSdkFailover } from "@/lib/geminiFailover";

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      );
    }

    // Mengambil bagian base64 murni (menghapus prefix data:image/...)
    const base64Data = image.split(",")[1] || image;

    const prompt = `
      Anda adalah asisten AI yang ahli dalam mengekstrak data dari dokumen resmi pemerintah Indonesia (KTP, Kartu Keluarga, Surat Kematian, dll).
      
      Tugas: Ekstrak informasi dari gambar dokumen yang diberikan ke dalam format JSON yang valid untuk formulir Surat Keterangan Waris (SKW).
      
      Harap kembalikan HANYA format JSON tanpa teks tambahan, tanpa markdown block (seperti \`\`\`json), dan gunakan struktur kunci berikut:
      
      {
        "nomorSurat": "String (jika ada)",
        "namaPemohon": "String",
        "nikPemohon": "String",
        "alamatPemohon": "String",
        "namaAlmarhum": "String",
        "nikAlmarhum": "String",
        "tanggalMeninggal": "String (Format: YYYY-MM-DD)",
        "alamatAlmarhum": "String",
        "ahliWaris": [
          {
            "nama": "String",
            "nik": "String",
            "hubungan": "String (Anak/Istri/Suami/Saudara)",
            "keterangan": "String"
          }
        ]
      }

      Jika data tidak ditemukan atau tidak terbaca, biarkan string kosong "".
      Jangan mengarang data.
    `;

    const { text: rawText } = await generateContentWithSdkFailover([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg", // Asumsi umum, bisa disesuaikan jika PNG
        },
      },
    ]);

    let text = rawText;

    console.log("Raw AI Response:", text); // Untuk debugging

    // PENTING: Sanitasi output untuk menghapus Markdown code blocks jika ada
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // Validasi JSON parsing
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json(
        { error: "Gagal memproses respons dari AI. Format tidak valid." },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });

  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}