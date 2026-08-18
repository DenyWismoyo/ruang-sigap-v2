// Lokasi: functions/src/taskWorkers.ts
// [UPDATE FASE 6]: Pekerja Cloud Tasks untuk mengeksekusi pengingat Event-Driven.
// Menggunakan sintaksis API Firebase Functions v1.
// [MIGRASI DATABASE]: Menambahkan getFirestore("database-siyap")

import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { db } from "./config/firebase";
import { sendFcmMessageByUid } from "./utils/helpers";


// PENTING: Nama variabel 'sendReminderTask' otomatis akan menjadi nama Queue di Cloud Tasks
export const sendReminderTask = onTaskDispatched({ region: 'asia-southeast2' }, async (request) => {
    const data = request.data;
    const { uid, type, docId } = data;
    
    // Lakukan 1 READ untuk mengecek status terbaru
    const summaryRef = db.collection('userSummaries').doc(uid);
    const summaryDoc = await summaryRef.get();

    if (!summaryDoc.exists) return; // Kalu user/summary dihapus, batalkan
    const summaryData = summaryDoc.data()!;

    if (type === 'disposisi') {
        const pending = summaryData.pendingDisposisi || {};
        // Cek apakah disposisi ini MASIH ADA di pending dan BELUM DITERIMA
        if (pending[docId] && pending[docId].needsAcknowledge) {
            console.log(`Mengirim FCM Pengingat Disposisi untuk user: ${uid}`);
            
            await sendFcmMessageByUid(
                uid, 
                "⏰ Pengingat: Disposisi Menunggu", 
                "Ada disposisi penting yang belum Anda terima.", 
                "/dashboard/ruang-kerja", 
                "pending-disposisi"
            );
        }
    } else if (type === 'tugas') {
        const pending = summaryData.pendingTugas || {};
        // Cek apakah tugas masih berstatus Baru/Dikerjakan (belum selesai)
        if (pending[docId]) {
            console.log(`Mengirim FCM Pengingat Tugas untuk user: ${uid}`);
            
            await sendFcmMessageByUid(
                uid, 
                "📋 Pengingat: Tugas Menunggu", 
                "Ada tugas baru yang perlu dikerjakan.", 
                "/dashboard/tugas", 
                "pending-tugas"
            );
        }
    }
});