import { onDocumentWritten, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { db, REGION } from "../config/firebase";
import { getUserIdFromJabatanId } from "../utils/helpers";
import { Tugas, Disposisi, Surat } from "../types";

const DB_TARGET = process.env.FIRESTORE_DATABASE || "database-siyap";

/**
 * Helper to update logbook safely using arrayUnion
 */
const updateLogbook = async (userId: string, opdId: string, timestamp: Date, kegiatan: any) => {
    try {
        const dateStr = timestamp.toISOString().split('T')[0];
        const docId = `${userId}_${dateStr}`;
        const docRef = db.collection("logbookHarian").doc(docId);
        
        // Ensure logbook entry structure matches what frontend expects
        const logbookEntry = {
            id: `auto_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            createdAt: new Date().toISOString(),
            sumber: 'otomatis_sistem',
            ...kegiatan,
        };

        // Use arrayUnion to safely append without read-modify-write race conditions
        await docRef.set({
            userId,
            opdId,
            tanggal: admin.firestore.Timestamp.fromDate(new Date(timestamp.getFullYear(), timestamp.getMonth(), timestamp.getDate())),
            kegiatan: admin.firestore.FieldValue.arrayUnion(logbookEntry)
        }, { merge: true });

        logger.log(`Logbook auto-updated for ${docId}`);
    } catch (error) {
        logger.error(`Error updating logbook for ${userId}:`, error);
    }
};

export const onTugasWrittenLogbook = onDocumentWritten(
    { document: "tugas/{tugasId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const beforeData = event.data?.before.data() as Tugas | undefined;
        const afterData = event.data?.after.data() as Tugas | undefined;
        
        if (!afterData) return; // Deleted, handled elsewhere if needed

        const tugasId = event.params.tugasId;
        const now = new Date();

        // Created
        if (!beforeData && afterData) {
            const userId = await getUserIdFromJabatanId(afterData.dariJabatanId);
            if (userId) {
                await updateLogbook(userId, afterData.opdId, now, {
                    deskripsi: `Memberikan tugas: "${afterData.judulTugas}" kepada ${afterData.kepadaJabatanNama || 'Bawahan'}`,
                    selesai: true,
                    tugasTerkaitId: tugasId,
                    tugasTerkaitJudul: afterData.judulTugas,
                    kategori: 'Tugas'
                });
            }
            return;
        }

        // Updated
        if (beforeData && afterData) {
            // Status Changed
            if (beforeData.status !== afterData.status) {
                const userId = await getUserIdFromJabatanId(afterData.kepadaJabatanId);
                if (userId) {
                    let logMessage = `Mengubah status tugas menjadi "${afterData.status}"`;
                    if (afterData.status === 'Selesai') logMessage = `Menyelesaikan tugas: "${afterData.judulTugas}"`;
                    else if (afterData.status === 'Dikerjakan' && beforeData.status === 'Selesai') logMessage = `Membuka kembali (revisi) tugas: "${afterData.judulTugas}"`;
                    
                    await updateLogbook(userId, afterData.opdId, now, {
                        deskripsi: logMessage,
                        selesai: afterData.status === 'Selesai',
                        tugasTerkaitId: tugasId,
                        tugasTerkaitJudul: afterData.judulTugas,
                        kategori: 'Tugas'
                    });
                }
            }
            // Detail Updated (basic check for title or description change to avoid noise on minor updates)
            else if (beforeData.judulTugas !== afterData.judulTugas || beforeData.deskripsi !== afterData.deskripsi) {
                 const userId = await getUserIdFromJabatanId(afterData.dariJabatanId); // Usually creator edits
                 if (userId) {
                     await updateLogbook(userId, afterData.opdId, now, {
                        deskripsi: `Memperbarui detail tugas: "${afterData.judulTugas}"`,
                        selesai: false,
                        tugasTerkaitId: tugasId,
                        tugasTerkaitJudul: afterData.judulTugas,
                        kategori: 'Tugas'
                    });
                 }
            }
        }
    }
);

export const onDisposisiWrittenLogbook = onDocumentWritten(
    { document: "disposisi/{disposisiId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const beforeData = event.data?.before.data() as Disposisi | undefined;
        const afterData = event.data?.after.data() as Disposisi | undefined;

        if (!afterData) return; // Deleted

        const disposisiId = event.params.disposisiId;
        const now = new Date();
        const suratDoc = await db.collection("surat").doc(afterData.suratId).get();
        const perihalSurat = suratDoc.exists ? (suratDoc.data() as Surat).perihal : 'Surat';

        // Created (Disposisi dikirim / eskalasi)
        if (!beforeData && afterData) {
            const userId = await getUserIdFromJabatanId(afterData.dariJabatanId);
            if (userId) {
                const logDesc = afterData.isInformational 
                    ? `Menyebar pemberitahuan surat: "${perihalSurat}"`
                    : `Mendisposisikan surat: "${perihalSurat}"`;

                await updateLogbook(userId, afterData.opdId || '', now, {
                    deskripsi: logDesc,
                    selesai: true,
                    disposisiTerkaitId: disposisiId,
                    suratTerkaitId: afterData.suratId,
                    suratPerihal: perihalSurat,
                    kategori: 'Disposisi'
                });
            }
            return;
        }

        // Updated
        if (beforeData && afterData) {
            // Diterima (Penerima bertambah)
            const beforePenerima = beforeData.penerimaDiterima || [];
            const afterPenerima = afterData.penerimaDiterima || [];
            const newPenerimaIds = afterPenerima.filter(id => !beforePenerima.includes(id));
            
            for (const jabatanId of newPenerimaIds) {
                // SKIP jika self-disposisi (pengirim = penerima) atau ditandai sebagai self-action
                if (jabatanId === afterData.dariJabatanId || (afterData as any).isSelfAction === true) {
                    logger.log(`Skipping logbook for self-disposition recipient ${jabatanId}`);
                    continue;
                }

                const userId = await getUserIdFromJabatanId(jabatanId);
                if (userId) {
                    await updateLogbook(userId, afterData.opdId || '', now, {
                        deskripsi: `Menerima ${afterData.isInformational ? 'pemberitahuan' : 'disposisi'} surat: "${perihalSurat}"`,
                        selesai: true,
                        disposisiTerkaitId: disposisiId,
                        suratTerkaitId: afterData.suratId,
                        suratPerihal: perihalSurat,
                        kategori: 'Disposisi'
                    });
                }
            }
        }
    }
);

export const onTindakLanjutWrittenLogbook = onDocumentWritten(
    { document: "tindakLanjut/{tlId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const beforeData = event.data?.before.data() as any;
        const afterData = event.data?.after.data() as any;

        if (!afterData) return;

        const now = new Date();
        const suratDoc = await db.collection("surat").doc(afterData.suratId).get();
        const perihalSurat = suratDoc.exists ? (suratDoc.data() as Surat).perihal : 'Surat';

        // Created (Laporan dikirim)
        if (!beforeData && afterData) {
            // Skip logbook untuk auto-cleanup dan self-action karena sudah ditangani oleh frontend
            if (afterData.sumber === 'auto_cleanup' || afterData.sumber === 'self_action') {
                logger.log(`Skipping logbook for auto/self tindakLanjut ${event.params.tlId}`);
                return;
            }

            await updateLogbook(afterData.userId, afterData.opdId, now, {
                deskripsi: `Tindak Lanjut Surat: "${perihalSurat}" - ${afterData.judulLaporan || 'Proses'}`,
                selesai: false,
                suratTerkaitId: afterData.suratId,
                suratPerihal: perihalSurat,
                kategori: 'Laporan'
            });
            return;
        }

        // Updated (Laporan direvisi)
        if (beforeData && afterData) {
            if (beforeData.isiLaporan !== afterData.isiLaporan || beforeData.judulLaporan !== afterData.judulLaporan) {
                await updateLogbook(afterData.userId, afterData.opdId, now, {
                    deskripsi: `Merevisi catatan/tindak lanjut: ${afterData.judulLaporan || 'Proses'}`,
                    selesai: false,
                    suratTerkaitId: afterData.suratId,
                    suratPerihal: perihalSurat,
                    kategori: 'Laporan'
                });
            }
        }
    }
);

export const onPelayananTransaksiWrittenLogbook = onDocumentWritten(
    { document: "pelayanan_transaksi/{transaksiId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const beforeData = event.data?.before.data() as any | undefined;
        const afterData = event.data?.after.data() as any | undefined;

        if (!afterData) return;

        const now = new Date();

        if (beforeData?.status !== 'Selesai' && afterData.status === 'Selesai') {
            const layananName = afterData.jenisDokumen || afterData.judulLayanan || 'Layanan Publik';
            await updateLogbook(afterData.petugasId, afterData.opdId, now, {
                deskripsi: `Menyelesaikan pelayanan ${afterData.kategori}: "${layananName}" untuk a.n. ${afterData.namaPemohon}.`,
                selesai: true,
                kategori: 'Umum'
            });
        }
    }
);

export const onSuratUpdatedLogbook = onDocumentUpdated(
    { document: "surat/{suratId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const beforeData = event.data?.before.data() as Surat;
        const afterData = event.data?.after.data() as Surat;
        
        const now = new Date();

        // Archived
        if (beforeData.statusPenyelesaian !== 'Diarsipkan' && afterData.statusPenyelesaian === 'Diarsipkan') {
             const archiverId = (afterData as any).diarsipkanOleh;
             if (archiverId && archiverId !== 'system') {
                 await updateLogbook(archiverId, afterData.opdId, now, {
                     deskripsi: `Mengarsipkan surat: "${afterData.perihal}".`,
                     selesai: true,
                     suratTerkaitId: afterData.id,
                     suratPerihal: afterData.perihal,
                     kategori: 'Surat'
                 });
             }
        }
    }
);
