// Lokasi: src/app/api/ai/copilot/route.ts
// [UPDATE ENTERPRISE] Natakarya AI Chat Copilot dengan Real-Time Database Query (RAG)
// Mengambil data nyata Firestore (Surat, Disposisi, Tugas, Draf) secara langsung sehingga AI dapat memberikan informasi faktual dan tombol aksi langsung ke dokumen.

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key Gemini belum dikonfigurasi pada server (GEMINI_API_KEY)." },
        { status: 500 }
      );
    }

    const { messages, userContext } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Riwayat pesan (messages) diperlukan." },
        { status: 400 }
      );
    }

    const opdId = userContext?.opdId;
    const jabatanId = userContext?.jabatanId;
    const role = userContext?.role || "user";
    const userId = userContext?.uid || userContext?.userId;

    // =========================================================================
    // 1. QUERY REAL-TIME DATA DARI FIRESTORE (SURAT, DISPOSISI, TUGAS, DRAF)
    // =========================================================================
    let realSuratList: any[] = [];
    let realDisposisiList: any[] = [];
    let realTugasList: any[] = [];
    let realDrafList: any[] = [];

    if (db && opdId) {
      try {
        // A. Ambil 20 Surat Masuk Terbaru di OPD
        const suratPromise = db
          .collection("surat")
          .where("opdId", "==", opdId)
          .orderBy("createdAt", "desc")
          .limit(20)
          .get()
          .catch(async () => {
            // Fallback jika belum ada index createdAt
            return db!.collection("surat").where("opdId", "==", opdId).limit(20).get();
          });

        // B. Ambil 20 Disposisi Terbaru di OPD
        const dispoPromise = db
          .collection("disposisi")
          .where("opdId", "==", opdId)
          .orderBy("tanggalDisposisi", "desc")
          .limit(20)
          .get()
          .catch(async () => {
            return db!.collection("disposisi").where("opdId", "==", opdId).limit(20).get();
          });

        // C. Ambil Tugas Aktif di OPD
        const tugasPromise = db
          .collection("tugas")
          .where("opdId", "==", opdId)
          .limit(15)
          .get()
          .catch(() => ({ docs: [] }));

        // D. Ambil Draf Persetujuan
        const drafPromise = db
          .collection("drafPersetujuan")
          .where("opdId", "==", opdId)
          .limit(10)
          .get()
          .catch(() => ({ docs: [] }));

        const [suratSnap, dispoSnap, tugasSnap, drafSnap] = await Promise.all([
          suratPromise,
          dispoPromise,
          tugasPromise,
          drafPromise,
        ]);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        realSuratList = suratSnap.docs
          .map((d: any) => {
            const data = d.data();
            const createdAtDate = data.createdAt ? data.createdAt.toDate() : (data.tanggalDiterima ? data.tanggalDiterima.toDate() : new Date());
            return {
              id: d.id,
              nomorSurat: data.nomorSurat || "Tanpa Nomor",
              pengirim: data.pengirim || "Tidak Diketahui",
              perihal: data.perihal || "Tanpa Perihal",
              jenisSurat: data.jenisSurat || "Umum",
              statusDisposisi: data.statusDisposisi || "Belum Didisposikan",
              statusPenyelesaian: data.statusPenyelesaian || "Proses",
              tanggalSurat: data.tanggalSurat || "",
              tanggalDiterima: data.tanggalDiterima ? data.tanggalDiterima.toDate?.()?.toLocaleDateString("id-ID") : "",
              ringkasan: data.ringkasan || "",
              actionUrl: `/dashboard/natakarya/surat/${d.id}`,
              _dateObj: createdAtDate,
            };
          })
          .filter((s: any) => s._dateObj >= sevenDaysAgo)
          .slice(0, 20);

        realDisposisiList = dispoSnap.docs.map((d: any) => {
          const data = d.data();
          const isForMe = jabatanId ? (data.kepadaJabatanId || []).includes(jabatanId) : false;
          const isDoneByMe = jabatanId ? (data.penerimaSelesai || []).includes(jabatanId) : false;
          const isAcknowledged = jabatanId ? (data.penerimaDiterima || []).includes(jabatanId) : false;

          return {
            id: d.id,
            suratId: data.suratId,
            nomorSurat: data.nomorSurat || "",
            perihal: data.perihal || "",
            instruksi: data.instruksi || "",
            catatan: data.catatan || "",
            status: data.status || "Terkirim",
            dariJabatanNama: data.dariJabatanNama || "Pimpinan",
            isForMe,
            isWaitingAction: isForMe && !isDoneByMe,
            isAcknowledged,
            actionUrl: `/dashboard/natakarya/ruang-kerja`,
            suratUrl: data.suratId ? `/dashboard/natakarya/surat/${data.suratId}` : `/dashboard/natakarya/ruang-kerja`,
          };
        });

        realTugasList = tugasSnap.docs.map((d: any) => {
          const data = d.data();
          return {
            id: d.id,
            judulTugas: data.judulTugas || "Tugas",
            deskripsi: data.deskripsi || "",
            prioritas: data.prioritas || "Sedang",
            status: data.status || "Baru",
            batasWaktu: data.batasWaktu ? data.batasWaktu.toDate?.()?.toLocaleDateString("id-ID") : "",
            actionUrl: `/dashboard/natakarya/tugas`,
          };
        });

        realDrafList = drafSnap.docs.map((d: any) => {
          const data = d.data();
          return {
            id: d.id,
            judul: data.judul || "Draf",
            status: data.status || "Proses Review",
            actionUrl: `/dashboard/natakarya/persetujuan-draf`,
          };
        });
      } catch (dbErr) {
        console.error("[Natakarya Copilot] Firestore Context Fetch Error:", dbErr);
      }
    }

    // Filter disposisi yang benar-benar menunggu tindakan pengguna saat ini
    const pendingDisposisiForUser = realDisposisiList.filter((dp) => dp.isWaitingAction);
    const unDisposedSurat = realSuratList.filter((s) => s.statusDisposisi === "Belum Didisposikan");

    // =========================================================================
    // 2. SUSUN SYSTEM INSTRUCTION BERDASARKAN DATA FAKTUAL NYATA (RAG)
    // =========================================================================
    const systemInstruction = `
Anda adalah **Natakarya Copilot**, asisten AI cerdas dan asisten pribadi ASN terpercaya yang terintegrasi langsung dengan database operasional digital **NATAKARYA**.

=== PROFIL PENGGUNA SAAT INI ===
- Nama Lengkap: ${userContext?.namaLengkap || "Pengguna"}
- Jabatan: ${userContext?.namaJabatan || "Staf / Pejabat"}
- Peran (Role): ${role}
- Instansi/OPD: ${userContext?.opdName || opdId || "Instansi Pemerintah"}
- ID Jabatan: ${jabatanId || "Umum"}

=== DATA REAL-TIME DARI DATABASE INSTANSI (FIRESTORE) ===

1. **DAFTAR SURAT MASUK TERBARU DI INSTANSI (7 Hari Terakhir, Max 20 Surat)**:
${
  realSuratList.length > 0
    ? realSuratList
        .map(
          (s, idx) =>
            `${idx + 1}. [ID: ${s.id}] No: "${s.nomorSurat}" | Dari: "${s.pengirim}" | Perihal: "${s.perihal}" | Tanggal: ${s.tanggalDiterima || s.tanggalSurat} | Status Disposisi: ${s.statusDisposisi} | Status Penyelesaian: ${s.statusPenyelesaian} | URL: ${s.actionUrl}`
        )
        .join("\n")
    : "Tidak ada surat masuk dalam 7 hari terakhir."
}

2. **DAFTAR DISPOSISI AKTIF (${realDisposisiList.length} Total, ${pendingDisposisiForUser.length} Menunggu Tindakan Anda)**:
${
  realDisposisiList.length > 0
    ? realDisposisiList
        .map(
          (d, idx) =>
            `${idx + 1}. [DispoID: ${d.id}] Surat: "${d.perihal || d.nomorSurat}" | Dari: ${d.dariJabatanNama} | Instruksi: "${d.instruksi}" | Khusus Untuk Anda: ${d.isForMe ? "YA" : "TIDAK"} | Butuh Tindak Lanjut Anda: ${d.isWaitingAction ? "YA (BELUM SELESAI)" : "TIDAK / SUDAH SELESAI"} | SuratURL: ${d.suratUrl}`
        )
        .join("\n")
    : "Tidak ada riwayat disposisi aktif."
}

3. **DAFTAR TUGAS AKTIF (${realTugasList.length} Tugas)**:
${
  realTugasList.length > 0
    ? realTugasList
        .map(
          (t, idx) =>
            `${idx + 1}. Judul: "${t.judulTugas}" | Prioritas: ${t.prioritas} | Status: ${t.status} | Deadline: ${t.batasWaktu || "Tidak ditentukan"} | URL: ${t.actionUrl}`
        )
        .join("\n")
    : "Tidak ada tugas aktif."
}

4. **DRAF PERSETUJUAN (${realDrafList.length} Draf)**:
${
  realDrafList.length > 0
    ? realDrafList
        .map(
          (dr, idx) =>
            `${idx + 1}. Judul: "${dr.judul}" | Status: ${dr.status} | URL: ${dr.actionUrl}`
        )
        .join("\n")
    : "Tidak ada draf dalam proses."
}

=== INSTRUKSI RESPON KHUSUS (SANGAT PENTING!) ===
1. **AKURASI FAKTUAL PENUH (JANGAN MENGARANG BEBAS)**:
   - Jawab pertanyaan pengguna mengenai surat, disposisi, dan tugas HANYA dengan merujuk data faktual di atas.
   - Jika pengguna bertanya tentang "surat yang belum didisposisi", sebutkan nomor surat, pengirim, dan perihal spesifik dari daftar surat yang bertatus "Belum Didisposikan".
   - Jika pengguna bertanya tentang "disposisi yang harus ditindaklanjuti", sebutkan secara jelas surat dan instruksi spesifik yang ditujukan kepada jabatan pengguna.
   - Jika data kosong atau 0, jelaskan bahwa berdasarkan database saat ini memang tidak ada dokumen terkait.

2. **WAJIB SERTAKAN TAUTAN AKSI LANGSUNG (ACTIONABLE LINKS)**:
   - Setiap kali Anda menyebutkan surat tertentu, sertakan link Markdown langsung dengan format:
     \`[Buka Surat: No. {nomorSurat}](/dashboard/natakarya/surat/{id})\`
   - Setiap kali menyarankan membuka ruang kerja, disposisi, atau tugas:
     \`[Buka Ruang Kerja](/dashboard/natakarya/ruang-kerja)\` atau \`[Buka Manajemen Tugas](/dashboard/natakarya/tugas)\`
   - Tautan internal ini akan otomatis diubah menjadi tombol aksi interaktif di antarmuka pengguna!

3. **GAYA BAHASA & TATA NASKAH**:
   - Gunakan Bahasa Indonesia kedinasan yang profesional, santun, lugas, dan terstruktur rapi (gunakan bullet points, bold, dan numbering).
   - Jika diminta menyusun draf naskah dinas atau nota dinas, berikan format resmi yang lengkap dan siap salin.

=== INSTRUKSI AKSI OTOMATIS (AGENTIC) ===
Jika pengguna meminta secara eksplisit untuk mengeksekusi suatu aksi, sertakan Tanda Aksi berikut di AKHIR pesan Anda:
1. Menandai disposisi selesai: \`[ACTION:SELESAI_DISPOSISI:id_disposisi]\` (ganti id_disposisi dengan DispoID yang relevan).
2. Membuat tugas baru untuk dirinya sendiri: \`[ACTION:BUAT_TUGAS:Judul Tugas]\` (ganti Judul Tugas dengan judul singkat).

Contoh Balasan:
"Baik, saya telah membuat tugas 'Menyiapkan Laporan' untuk Anda. [ACTION:BUAT_TUGAS:Menyiapkan Laporan]"
`;

    // =========================================================================
    // 3. FORMAT CHAT HISTORY UNTUK GEMINI
    // =========================================================================
    const formattedContents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    const historyMessages = messages.slice(0, -1);
    const lastMessage = messages[messages.length - 1];

    for (const msg of historyMessages) {
      formattedContents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }

    formattedContents.push({
      role: "user",
      parts: [{ text: lastMessage.content }],
    });

    // =========================================================================
    // 4. GENERASI KONTEN DENGAN GEMINI 3.5 FLASH LITE
    // =========================================================================
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-2.5-flash-lite",
    ];

    let replyText = "";
    let usedModel = candidateModels[0];
    let lastErr: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
          generationConfig: {
            temperature: 0.5, // Temperature lebih rendah untuk akurasi data faktual
            maxOutputTokens: 2048,
          },
        });

        const result = await model.generateContent({
          contents: formattedContents,
        });

        const response = result.response;
        replyText = response.text();
        usedModel = modelName;

        if (replyText) {
          // --- LOGIKA AGENTIC: PARSING ACTION TAGS ---
          const dispoMatch = replyText.match(/\[ACTION:SELESAI_DISPOSISI:(.+?)\]/);
          if (dispoMatch && db) {
              const dispoId = dispoMatch[1].trim();
              try {
                  const dispoRef = db.collection("disposisi").doc(dispoId);
                  const docSnap = await dispoRef.get();
                  if (docSnap.exists) {
                      const data = docSnap.data();
                      const penerimaSelesai = data?.penerimaSelesai || [];
                      if (jabatanId && !penerimaSelesai.includes(jabatanId)) {
                          penerimaSelesai.push(jabatanId);
                          await dispoRef.update({ 
                              penerimaSelesai, 
                              updatedAt: new Date() 
                          });
                      }
                  }
              } catch (e) {
                  console.error("Gagal eksekusi ACTION:SELESAI_DISPOSISI", e);
              }
              replyText = replyText.replace(dispoMatch[0], "").trim();
          }

          const tugasMatch = replyText.match(/\[ACTION:BUAT_TUGAS:(.+?)\]/);
          if (tugasMatch && db) {
              const judulTugas = tugasMatch[1].trim();
              try {
                  await db.collection("tugas").add({
                      judulTugas,
                      opdId: opdId || "",
                      status: "Baru",
                      prioritas: "Sedang",
                      pembuatId: userId || "",
                      penerimaIds: [userId || ""],
                      createdAt: new Date(),
                      updatedAt: new Date()
                  });
              } catch (e) {
                  console.error("Gagal eksekusi ACTION:BUAT_TUGAS", e);
              }
              replyText = replyText.replace(tugasMatch[0], "").trim();
          }

          break;
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`[Natakarya Copilot] Model ${modelName} gagal: ${err.message || err}. Mencoba model berikutnya...`);
      }
    }

    if (!replyText) {
      throw lastErr || new Error("Gagal mendapatkan respons dari model Gemini.");
    }

    return NextResponse.json({
      success: true,
      model: usedModel,
      reply: replyText,
    });
  } catch (error: any) {
    console.error("[Natakarya Copilot Error]:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat memproses permintaan AI Copilot." },
      { status: 500 }
    );
  }
}
