// Lokasi: src/app/api/ai/copilot/route.ts
// [UPDATE ENTERPRISE] Poros AI Chat Copilot dengan Native Gemini Tool Calling & RAG
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

    const { messages, userContext, pageContext } = await req.json();

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
    // 1. QUERY REAL-TIME DATA DARI FIRESTORE (SURAT, DISPOSISI, DLL) - RAG Dasar
    // =========================================================================
    let realSuratList: any[] = [];
    let realDisposisiList: any[] = [];
    let realTugasList: any[] = [];
    let realDrafList: any[] = [];
    let logbookHariIni: any[] = [];
    let tindakLanjutList: any[] = [];

    if (db && opdId) {
      try {
        // Fungsi helper untuk mengambil data dengan sorting in-memory sebagai fallback jika index hilang
        const getRecentDocs = async (collName: string, orderByField: string = "createdAt", lim: number = 10) => {
            return db!.collection(collName).where("opdId", "==", opdId).orderBy(orderByField, "desc").limit(lim).get().catch(async () => {
                const all = await db!.collection(collName).where("opdId", "==", opdId).get();
                const sorted = all.docs.sort((a, b) => {
                    const dateA = a.data()[orderByField]?.toDate?.()?.getTime() || 0;
                    const dateB = b.data()[orderByField]?.toDate?.()?.getTime() || 0;
                    return dateB - dateA;
                });
                return { docs: sorted.slice(0, lim) };
            });
        };

        // A. Ambil 20 Surat Masuk Terbaru di OPD
        const suratPromise = getRecentDocs("surat", "tanggalDiterima", 20);

        // B. Ambil 30 Disposisi Terbaru untuk User ini
        const dispoPromise = db.collection("disposisi")
          .where("kepadaJabatanId", "array-contains", jabatanId || "")
          .orderBy("tanggalDisposisi", "desc")
          .limit(30)
          .get()
          .catch(async () => {
              const all = await db!.collection("disposisi").where("opdId", "==", opdId).get();
              const myDocs = all.docs.filter((d: any) => (d.data().kepadaJabatanId || []).includes(jabatanId));
              const sorted = myDocs.sort((a: any, b: any) => {
                  const dateA = a.data().tanggalDisposisi?.toDate?.()?.getTime() || 0;
                  const dateB = b.data().tanggalDisposisi?.toDate?.()?.getTime() || 0;
                  return dateB - dateA;
              });
              return { docs: sorted.slice(0, 30) };
          });

        // C. Ambil Tugas Aktif untuk User ini
        const tugasPromise = db.collection("tugas")
          .where("kepadaJabatanId", "==", jabatanId || "")
          .orderBy("tanggalDibuat", "desc")
          .limit(20)
          .get()
          .catch(async () => {
              const all = await db!.collection("tugas").where("opdId", "==", opdId).get();
              const myDocs = all.docs.filter((d: any) => d.data().kepadaJabatanId === jabatanId);
              const sorted = myDocs.sort((a: any, b: any) => {
                  const dateA = a.data().tanggalDibuat?.toDate?.()?.getTime() || 0;
                  const dateB = b.data().tanggalDibuat?.toDate?.()?.getTime() || 0;
                  return dateB - dateA;
              });
              return { docs: sorted.slice(0, 20) };
          });

        // D. Ambil Draf Persetujuan
        const drafPromise = getRecentDocs("drafPersetujuan", "createdAt", 10);

        // E. Ambil Logbook Hari Ini
        const todayDateStr = new Date().toISOString().split('T')[0];
        const logbookDocId = `${userId}_${todayDateStr}`;
        const logbookPromise = db.collection("logbookHarian").doc(logbookDocId).get().catch(() => ({ exists: false, data: () => null }));

        // F. Ambil Riwayat Tindak Lanjut terbaru
        const tindakLanjutPromise = db.collection("tindakLanjut").where("userId", "==", userId || "").orderBy("tanggalLaporan", "desc").limit(10).get().catch(async () => {
            const all = await db!.collection("tindakLanjut").where("userId", "==", userId || "").get();
            const sorted = all.docs.sort((a, b) => {
                const dateA = a.data().tanggalLaporan?.toDate?.()?.getTime() || 0;
                const dateB = b.data().tanggalLaporan?.toDate?.()?.getTime() || 0;
                return dateB - dateA;
            });
            return { docs: sorted.slice(0, 10) };
        });

        const [suratSnap, dispoSnap, tugasSnap, drafSnap, logbookSnap, tindakLanjutSnap] = await Promise.all([
          suratPromise, dispoPromise, tugasPromise, drafPromise, logbookPromise, tindakLanjutPromise
        ]);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const isStafTuOrAdminOpd = role === 'staf_tu' || role === 'admin_opd' || role === 'super_admin';
        const mySuratIds = new Set(dispoSnap.docs.map((d: any) => d.data().suratId));

        realSuratList = suratSnap.docs.map((d: any) => {
            const data = d.data();
            const createdAtDate = data.createdAt ? data.createdAt.toDate() : (data.tanggalDiterima ? data.tanggalDiterima.toDate() : new Date());
            return {
              id: d.id,
              nomorSurat: data.nomorSurat || "Tanpa Nomor",
              pengirim: data.pengirim || "Tidak Diketahui",
              perihal: data.perihal || "Tanpa Perihal",
              statusPenyelesaian: data.statusPenyelesaian || "Proses",
              tanggalDiterima: data.tanggalDiterima ? data.tanggalDiterima.toDate?.()?.toLocaleDateString("id-ID") : "",
              actionUrl: `/dashboard/poros/surat/${d.id}`,
              _dateObj: createdAtDate,
              _rawData: data,
            };
          }).filter((s: any) => {
              if (s._dateObj < thirtyDaysAgo) return false;
              if (isStafTuOrAdminOpd) return true;
              
              const data = s._rawData;
              if (data?.tujuanJabatanId === jabatanId) return true;
              if (mySuratIds.has(s.id)) return true;
              if (data?.jenisSurat === 'Undangan') return true;
              
              return false;
          }).map((s: any) => {
              delete s._rawData;
              return s;
          }).slice(0, 20);

        realDisposisiList = await Promise.all(dispoSnap.docs.map(async (d: any) => {
          const data = d.data();
          const isForMe = jabatanId ? (data.kepadaJabatanId || []).includes(jabatanId) : false;
          const isDoneByMe = jabatanId ? (data.penerimaSelesai || []).includes(jabatanId) : false;
          
          let suratAsli = suratSnap.docs.find((s: any) => s.id === data.suratId)?.data();
          
          if (!suratAsli && data.suratId && db) {
             try {
                const missingSuratSnap = await db.collection("surat").doc(data.suratId).get();
                if (missingSuratSnap.exists) {
                    suratAsli = missingSuratSnap.data();
                }
             } catch (e) {
                 console.warn("Gagal fetch missing surat", data.suratId);
             }
          }

          const perihalSebenarnya = suratAsli?.perihal || data.perihal || "";

          return {
            id: d.id,
            suratId: data.suratId,
            nomorSurat: data.nomorSurat || "",
            perihal: perihalSebenarnya,
            instruksi: data.instruksi || "",
            dariJabatanNama: data.dariJabatanNama || "Pimpinan",
            isWaitingAction: isForMe && !isDoneByMe,
            suratUrl: data.suratId ? `/dashboard/poros/surat/${data.suratId}` : `/dashboard/poros/ruang-kerja`,
          };
        }));

        realTugasList = tugasSnap.docs.map((d: any) => {
          const data = d.data();
          return {
            id: d.id,
            judulTugas: data.judulTugas || "Tugas",
            prioritas: data.prioritas || "Sedang",
            status: data.status || "Baru",
            batasWaktu: data.batasWaktu ? data.batasWaktu.toDate?.()?.toLocaleDateString("id-ID") : "",
            actionUrl: `/dashboard/poros/tugas`,
          };
        });

        realDrafList = drafSnap.docs.map((d: any) => ({
            id: d.id,
            judul: d.data().judul || "Draf",
            status: d.data().status || "Proses Review",
            actionUrl: `/dashboard/poros/persetujuan-draf`,
        }));

        if ((logbookSnap as any).exists) {
          const data = (logbookSnap as any).data();
          if (data && data.kegiatan) logbookHariIni = data.kegiatan;
        }

        tindakLanjutList = (tindakLanjutSnap as any).docs.map((d: any) => ({
            id: d.id,
            disposisiId: d.data().disposisiId,
            ringkasanTindakan: d.data().isiLaporan,
        }));
      } catch (dbErr) {
        console.error("[Poros Copilot] Firestore Context Fetch Error:", dbErr);
      }
    }

    const pendingDisposisiForUser = realDisposisiList.filter((dp) => dp.isWaitingAction);

    // =========================================================================
    // 2. SYSTEM INSTRUCTION (PERSONA & MENTAL MODEL)
    // =========================================================================
    const systemInstruction = `
Anda adalah **Poros Copilot**, asisten AI jenius dan asisten pribadi ASN terpercaya yang terintegrasi langsung dengan database operasional digital **POROS**.

KERANGKA BERPIKIR (MENTAL MODELS) & ATURAN KERAS:
1. **URGENSI-FIRST**: Selalu sebut dokumen/tugas yang paling mendesak lebih dulu (terutama Disposisi Menunggu Tindakan).
2. **AKURASI FAKTUAL**: Jawab pertanyaan HANYA berdasarkan data RAG di bawah atau hasil Tool Call. Jika data kosong, jujurlah dan jangan mengarang.
3. **PROAKTIF**: Jika pengguna ingin mengisi tindak lanjut atau jika Anda menyarankan pengisian tindak lanjut, SELALU gunakan action SHOW_BATCH_TINDAK_LANJUT_FORM. Isi array 'items' di dalam payload dengan data disposisi yang relevan dari RAG.
4. **FORMAT JSON WAJIB**: Selalu kembalikan respon dalam format JSON yang didefinisikan di bawah.

=== PROFIL PENGGUNA SAAT INI ===
- Nama: ${userContext?.namaLengkap || "Pengguna"}
- Jabatan: ${userContext?.namaJabatan || "Staf"}
- Instansi: ${userContext?.opdName || opdId || "Instansi Pemerintah"}

=== KONTEKS HALAMAN SAAT INI ===
${pageContext ? `Pengguna sedang berada di halaman: ${pageContext.pathname}` : 'Tidak ada konteks halaman khusus.'}

=== DATA REAL-TIME (RAG) ===
1. **Surat Masuk (Max 20)**: ${realSuratList.length > 0 ? realSuratList.map((s, i) => `[${i+1}] ID:${s.id} | ${s.nomorSurat} | Dari: ${s.pengirim} | Perihal: ${s.perihal} | Status: ${s.statusPenyelesaian}`).join('\n') : "Tidak ada."}
2. **Disposisi Menunggu Tindakan Anda**: ${pendingDisposisiForUser.length > 0 ? pendingDisposisiForUser.map((d, i) => `[${i+1}] ID:${d.id} | SuratID:${d.suratId} | Perihal: ${d.perihal} | Instruksi: ${d.instruksi} | Dari: ${d.dariJabatanNama}`).join('\n') : "Tidak ada disposisi aktif."}
3. **Tugas Aktif**: ${realTugasList.length > 0 ? realTugasList.map((t, i) => `[${i+1}] ID:${t.id} | Judul: ${t.judulTugas} | Status: ${t.status} | Deadline: ${t.batasWaktu}`).join('\n') : "Tidak ada tugas."}
4. **Logbook Hari Ini**: ${logbookHariIni.length > 0 ? logbookHariIni.map((l, i) => `[${i+1}] ${l.deskripsi} (${l.selesai ? 'Selesai' : 'Belum'})`).join('\n') : "Kosong."}

=== FORMAT RESPONS WAJIB (SANGAT PENTING) ===
Anda HARUS menghasilkan respons dalam format JSON murni:
\`\`\`json
{
  "reply": "Teks Markdown respons Anda. (Gunakan bullet point yang compact, jangan banyak enter kosong. Pastikan menyebutkan 'Perihal' jika menampilkan daftar surat/disposisi)",
  "actions": [
    {
      "type": "NAVIGATE | SELESAI_DISPOSISI | BUAT_TUGAS | WRITE_LOGBOOK_RICH | TANDAI_SELESAI_TUGAS | SHOW_BATCH_TINDAK_LANJUT_FORM",
      "label": "Teks tombol aksi",
      "url": "URL tujuan (untuk NAVIGATE)",
      "payload": {
        "id_disposisi": "...",
        "surat_id": "...",
        "judul_tugas": "...",
        "deskripsi_logbook": "...",
        "items": [
          { "id_disposisi": "...", "surat_id": "...", "instruksi": "...", "perihal_surat": "...", "pengirim_disposisi": "..." }
        ]
      }
    }
  ],
  "data_tables": []
}
\`\`\`
Jika Anda baru saja menerima hasil dari Tool Call, gabungkan hasil tersebut ke dalam "reply".
`;

    // =========================================================================
    // 3. TOOLS DEFINITION (FUNCTION CALLING)
    // =========================================================================
    const tools = [
        {
          functionDeclarations: [
            {
              name: "search_surat",
              description: "Mencari surat masuk di instansi berdasarkan kata kunci pada perihal atau nama pengirim.",
              parameters: {
                type: "OBJECT",
                properties: {
                  keyword: {
                    type: "STRING",
                    description: "Kata kunci pencarian (misal: 'Rapat Koordinasi', 'BKN', 'Undangan')"
                  }
                },
                required: ["keyword"]
              }
            },
            {
              name: "calculate_deadline_urgency",
              description: "Menghitung sisa hari dari deadline tugas/disposisi untuk menentukan tingkat urgensi.",
              parameters: {
                type: "OBJECT",
                properties: {
                  tanggal_deadline: {
                    type: "STRING",
                    description: "Tanggal deadline dalam format YYYY-MM-DD"
                  }
                },
                required: ["tanggal_deadline"]
              }
            },
            {
              name: "get_disposisi_detail",
              description: "Mengambil detail instruksi dan pengirim dari sebuah disposisi berdasarkan ID.",
              parameters: {
                type: "OBJECT",
                properties: {
                  id_disposisi: {
                    type: "STRING",
                    description: "ID disposisi"
                  }
                },
                required: ["id_disposisi"]
              }
            },
            {
              name: "get_tugas_detail",
              description: "Mengambil detail dan status dari sebuah tugas berdasarkan ID.",
              parameters: {
                type: "OBJECT",
                properties: {
                  id_tugas: {
                    type: "STRING",
                    description: "ID tugas"
                  }
                },
                required: ["id_tugas"]
              }
            },
            {
              name: "get_kinerja_summary",
              description: "Menghitung ringkasan kinerja pengguna bulan ini (total disposisi selesai, tugas selesai).",
              parameters: {
                type: "OBJECT",
                properties: {},
                required: []
              }
            }
          ]
        }
    ];

    // =========================================================================
    // 4. FORMAT CHAT HISTORY UNTUK GEMINI
    // =========================================================================
    const formattedContents: any[] = [];
    
    // Parse the history to Gemini's format. If role is 'user' it's user, if 'model'/'assistant' it's model.
    for (const msg of messages) {
        if (msg.role === 'function_call_result') {
            formattedContents.push({
                role: "user", // For function responses, the role in Gemini is usually 'function' but in API v1beta it might be different. Wait, Gemini SDK uses role: "function"
                parts: [{
                    functionResponse: {
                        name: msg.name,
                        response: msg.response
                    }
                }]
            });
        } else if (msg.role === 'function_call') {
            formattedContents.push({
                role: "model",
                parts: [{
                    functionCall: {
                        name: msg.name,
                        args: msg.args
                    }
                }]
            });
        } else {
            formattedContents.push({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }],
            });
        }
    }

    // =========================================================================
    // 5. GENERASI KONTEN (DENGAN LOOP TOOL CALL)
    // =========================================================================
    const modelOptions = {
        model: "gemini-3.5-flash-lite",
        systemInstruction,
        tools: tools as any,
    };
    
    let model = genAI.getGenerativeModel(modelOptions);

    let replyText = "";
    let finalPayload: any = null;
    let usedModel = "gemini-3.5-flash-lite";

    // Loop execution untuk tool calls (max 3 iterasi)
    const maxIterations = 3;
    let iteration = 0;
    
    while (iteration < maxIterations) {
        iteration++;
        const result = await model.generateContent({
            contents: formattedContents,
            generationConfig: {
                temperature: 0.1, // Diturunkan agar lebih presisi dan tidak halusinasi data
                maxOutputTokens: 2048,
            }
        });

        const response = result.response;
        
        // Cek jika model memutuskan memanggil fungsi
        const functionCalls = response.functionCalls();
        
        if (functionCalls && functionCalls.length > 0) {
            // Tambahkan function call ke history
            formattedContents.push({
                role: "model",
                parts: response.candidates?.[0]?.content?.parts || []
            });
            
            // Eksekusi fungsi
            const functionResponsesParts = [];
            for (const call of functionCalls) {
                let funcResult = {};
                
                if (call.name === 'search_surat' && db) {
                    const keyword = ((call.args as any).keyword || "").toLowerCase();
                    try {
                        // Ambil semua untuk in-memory search agar bisa di sort by date (fallback FTS)
                        const allSurat = await db.collection("surat").where("opdId", "==", opdId).get();
                        const matched = allSurat.docs.map(d => ({id: d.id, ...d.data()})).filter((s: any) => 
                            (s.perihal && s.perihal.toLowerCase().includes(keyword)) ||
                            (s.pengirim && s.pengirim.toLowerCase().includes(keyword)) ||
                            (s.nomorSurat && s.nomorSurat.toLowerCase().includes(keyword))
                        );
                        
                        // Sort by date descending
                        matched.sort((a: any, b: any) => {
                            const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
                            const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
                            return dateB - dateA;
                        });
                        
                        const finalMatched = matched.slice(0, 5);
                        
                        funcResult = { 
                            status: "success", 
                            matchedCount: matched.length, 
                            results: finalMatched.map((m: any) => ({
                                nomorSurat: m.nomorSurat, pengirim: m.pengirim, perihal: m.perihal, status: m.statusDisposisi
                            })) 
                        };
                    } catch (e) {
                        funcResult = { error: "Gagal mencari surat" };
                    }
                } else if (call.name === 'calculate_deadline_urgency') {
                    const deadline = new Date((call.args as any).tanggal_deadline);
                    const now = new Date();
                    const diffTime = deadline.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    let urgency = "Normal";
                    if (diffDays < 0) urgency = "Overdue (Sangat Kritis)";
                    else if (diffDays <= 1) urgency = "Tinggi (Kritis)";
                    else if (diffDays <= 3) urgency = "Sedang";
                    
                    funcResult = { sisaHari: diffDays, tingkatUrgensi: urgency };
                } else if (call.name === 'get_disposisi_detail' && db) {
                    try {
                        const id = (call.args as any).id_disposisi;
                        const docSnap = await db.collection("disposisi").doc(id).get();
                        if (docSnap.exists) {
                            funcResult = { status: "success", data: { id: docSnap.id, ...docSnap.data() } };
                        } else {
                            funcResult = { status: "not_found", message: "Disposisi tidak ditemukan" };
                        }
                    } catch (e) {
                        funcResult = { error: "Gagal mengambil disposisi" };
                    }
                } else if (call.name === 'get_tugas_detail' && db) {
                    try {
                        const id = (call.args as any).id_tugas;
                        const docSnap = await db.collection("tugas").doc(id).get();
                        if (docSnap.exists) {
                            funcResult = { status: "success", data: { id: docSnap.id, ...docSnap.data() } };
                        } else {
                            funcResult = { status: "not_found", message: "Tugas tidak ditemukan" };
                        }
                    } catch (e) {
                        funcResult = { error: "Gagal mengambil tugas" };
                    }
                } else if (call.name === 'get_kinerja_summary' && db) {
                    try {
                        // For summary, we can just aggregate based on the RAG context we already have, or query DB
                        // Since we have realDisposisiList and realTugasList in memory, let's use it
                        const dispoSelesai = realDisposisiList.filter(d => 
                            d.penerimaSelesai && userContext?.jabatanId && d.penerimaSelesai.includes(userContext.jabatanId)
                        ).length;
                        const tugasSelesai = realTugasList.filter(t => t.status === "Selesai").length;
                        
                        funcResult = { 
                            status: "success", 
                            summary: {
                                totalDisposisiSelesaiBulanIni: dispoSelesai,
                                totalTugasSelesaiBulanIni: tugasSelesai,
                                message: "Kinerja yang sangat baik!"
                            }
                        };
                    } catch (e) {
                        funcResult = { error: "Gagal menghitung kinerja" };
                    }
                }
                
                functionResponsesParts.push({
                    functionResponse: {
                        name: call.name,
                        response: funcResult
                    }
                });
            }
            
            // Tambahkan respons fungsi ke history dan ulangi loop
            // For @google/generative-ai, function responses must be role "user" if they are the latest part before model
            // Actually it's role: "function" or role: "user" depending on SDK version. v0.24.1 uses role: "user" with functionResponse inside
            formattedContents.push({
                role: "user",
                parts: functionResponsesParts
            });
            continue;
        }
        
        // Jika tidak ada function call, ini adalah respon final
        replyText = response.text();
        
        try {
            const cleanJson = replyText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
            finalPayload = JSON.parse(cleanJson);
            break;
        } catch (e) {
            console.error("Gagal parse JSON dari model:", replyText);
            finalPayload = {
                reply: replyText,
                actions: [],
                data_tables: []
            };
            break;
        }
    }

    // =========================================================================
    // 6. SERVER-SIDE ACTION EXECUTION (DIHAPUS UNTUK KEAMANAN)
    // Eksekusi action seperti SELESAI_DISPOSISI sekarang ditangani sepenuhnya
    // di client-side melalui ConfirmModal untuk menghindari update DB tanpa
    // sepengetahuan/konfirmasi user.
    // =========================================================================

    return NextResponse.json({
      success: true,
      model: usedModel,
      reply: finalPayload.reply || "",
      actions: finalPayload.actions || [],
      data_tables: finalPayload.data_tables || [],
    });
    
  } catch (error: any) {
    console.error("[Poros Copilot Error]:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat memproses permintaan AI Copilot." },
      { status: 500 }
    );
  }
}
