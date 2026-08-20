import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Cek apakah kredensial diset atau kita pakai emulator
if (!process.env.FIRESTORE_EMULATOR_HOST && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn("WARNING: FIRESTORE_EMULATOR_HOST atau GOOGLE_APPLICATION_CREDENTIALS tidak diset.");
    console.warn("Skrip ini akan menggunakan default credentials jika tersedia.");
}

admin.initializeApp();
const db = admin.firestore();

// Peta bantuan untuk memetakan jabatanId -> userId
const jabatanToUserMap: Record<string, string> = {};

async function buildUserMap() {
    const snapshot = await db.collection('users').get();
    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.jabatanId) {
            jabatanToUserMap[data.jabatanId] = data.uid || doc.id;
        }
    });
}

function getUserId(jabatanId: string): string | null {
    return jabatanToUserMap[jabatanId] || null;
}

// Logbook Helper
const logbookUpdates: Record<string, { userId: string, opdId: string, tanggal: Date, kegiatan: any[] }> = {};

function addLogbookEntry(userId: string, opdId: string, timestamp: admin.firestore.Timestamp | Date, kegiatanData: any) {
    if (!userId || !timestamp) return;

    const date = timestamp instanceof admin.firestore.Timestamp ? timestamp.toDate() : timestamp;
    if (isNaN(date.getTime())) return;

    const dateStr = date.toISOString().split('T')[0];
    const docId = `${userId}_${dateStr}`;

    if (!logbookUpdates[docId]) {
        const t = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        logbookUpdates[docId] = {
            userId,
            opdId: opdId || '',
            tanggal: t,
            kegiatan: []
        };
    }

    logbookUpdates[docId].kegiatan.push({
        id: `backfill_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        createdAt: new Date().toISOString(),
        sumber: 'backfill',
        ...kegiatanData
    });
}

async function backfillTugas() {
    console.log("Memproses Tugas...");
    const snap = await db.collection('tugas').get();
    snap.forEach(doc => {
        const data = doc.data();
        // Pemberi Tugas
        if (data.dariJabatanId && data.tanggalDibuat) {
            const pemberiId = getUserId(data.dariJabatanId);
            if (pemberiId) {
                addLogbookEntry(pemberiId, data.opdId, data.tanggalDibuat, {
                    deskripsi: `Memberikan tugas: "${data.judulTugas}" kepada ${data.kepadaJabatanNama || 'Bawahan'}`,
                    selesai: true,
                    tugasTerkaitId: doc.id,
                    tugasTerkaitJudul: data.judulTugas,
                    kategori: 'Tugas'
                });
            }
        }
        
        // Penerima Tugas (Status Selesai)
        if (data.status === 'Selesai' && data.kepadaJabatanId && data.tanggalSelesai) {
            const penerimaId = getUserId(data.kepadaJabatanId);
            if (penerimaId) {
                addLogbookEntry(penerimaId, data.opdId, data.tanggalSelesai, {
                    deskripsi: `Menyelesaikan tugas: "${data.judulTugas}"`,
                    selesai: true,
                    tugasTerkaitId: doc.id,
                    tugasTerkaitJudul: data.judulTugas,
                    kategori: 'Tugas'
                });
            }
        }
    });
}

async function backfillDisposisi() {
    console.log("Memproses Disposisi...");
    const snap = await db.collection('disposisi').get();
    
    // We need surat data for perihal
    const suratMap: Record<string, string> = {};
    const suratSnap = await db.collection('surat').get();
    suratSnap.forEach(s => {
        suratMap[s.id] = s.data().perihal || 'Surat';
    });

    snap.forEach(doc => {
        const data = doc.data();
        const perihal = suratMap[data.suratId] || 'Surat';
        
        // Pengirim
        if (data.dariJabatanId && data.tanggalDisposisi) {
            const pengirimId = getUserId(data.dariJabatanId);
            if (pengirimId) {
                addLogbookEntry(pengirimId, data.opdId || data.dariOpdId, data.tanggalDisposisi, {
                    deskripsi: `Mendisposisikan surat: "${perihal}"`,
                    selesai: true,
                    disposisiTerkaitId: doc.id,
                    suratTerkaitId: data.suratId,
                    suratPerihal: perihal,
                    kategori: 'Disposisi'
                });
            }
        }

        // Penerima
        if (data.penerimaDiterima && Array.isArray(data.penerimaDiterima)) {
            data.penerimaDiterima.forEach((jabatanId: string) => {
                const penerimaId = getUserId(jabatanId);
                if (penerimaId && data.tanggalDisposisi) { // Approximation for when they accepted it
                    addLogbookEntry(penerimaId, data.opdId || data.dariOpdId, data.tanggalDisposisi, {
                        deskripsi: `Menerima disposisi surat: "${perihal}"`,
                        selesai: true,
                        disposisiTerkaitId: doc.id,
                        suratTerkaitId: data.suratId,
                        suratPerihal: perihal,
                        kategori: 'Disposisi'
                    });
                }
            });
        }
    });
}

async function backfillTindakLanjut() {
    console.log("Memproses Tindak Lanjut...");
    const snap = await db.collection('tindakLanjut').get();
    
    const suratMap: Record<string, string> = {};
    const suratSnap = await db.collection('surat').get();
    suratSnap.forEach(s => {
        suratMap[s.id] = s.data().perihal || 'Surat';
    });

    snap.forEach(doc => {
        const data = doc.data();
        const perihal = suratMap[data.suratId] || 'Surat';
        if (data.userId && data.tanggalLaporan) {
            addLogbookEntry(data.userId, data.opdId, data.tanggalLaporan, {
                deskripsi: `Tindak Lanjut Surat: "${perihal}" - ${data.judulLaporan || 'Proses'}`,
                selesai: false,
                suratTerkaitId: data.suratId,
                suratPerihal: perihal,
                kategori: 'Laporan'
            });
        }
    });
}

async function runBackfill() {
    try {
        console.log("Membangun referensi User...");
        await buildUserMap();

        await backfillTugas();
        await backfillDisposisi();
        await backfillTindakLanjut();

        console.log(`Menyimpan ${Object.keys(logbookUpdates).length} dokumen logbook harian...`);

        // Batch writes (max 500 per batch)
        let batch = db.batch();
        let count = 0;

        for (const [docId, data] of Object.entries(logbookUpdates)) {
            const docRef = db.collection('logbookHarian').doc(docId);
            
            // We use arrayUnion to merge with existing data
            batch.set(docRef, {
                userId: data.userId,
                opdId: data.opdId,
                tanggal: admin.firestore.Timestamp.fromDate(data.tanggal),
                kegiatan: admin.firestore.FieldValue.arrayUnion(...data.kegiatan)
            }, { merge: true });

            count++;
            if (count >= 400) {
                await batch.commit();
                console.log(`Committed 400 documents...`);
                batch = db.batch();
                count = 0;
            }
        }

        if (count > 0) {
            await batch.commit();
            console.log(`Committed remaining ${count} documents...`);
        }

        console.log("Backfill Logbook Selesai!");

    } catch (e) {
        console.error("Error during backfill:", e);
    }
}

runBackfill();
