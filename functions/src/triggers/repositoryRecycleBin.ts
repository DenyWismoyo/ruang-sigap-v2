import * as functions from "firebase-functions/v2";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";

const db = admin.firestore();

/**
 * Scheduled Cloud Function yang berjalan setiap hari jam 00:00.
 * Menghapus permanen RepositoryItem yang berstatus isDeleted: true 
 * dan sudah lebih dari 30 hari berada di Tong Sampah.
 */
export const autoPurgeRecycleBin = functions.scheduler.onSchedule(
    {
        schedule: "0 0 * * *",
        timeZone: "Asia/Jakarta",
        timeoutSeconds: 300,
        memory: "256MiB",
    },
    async (event) => {
        try {
            console.log("Memulai Auto-Purge Recycle Bin...");

            // Tanggal batas: 30 hari yang lalu
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const timestampThreshold = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

            const itemsRef = db.collection("repositoryItems");
            const snapshot = await itemsRef
                .where("isDeleted", "==", true)
                .where("deletedAt", "<=", timestampThreshold)
                .get();

            if (snapshot.empty) {
                console.log("Tidak ada item yang perlu dihapus permanen hari ini.");
                return;
            }

            console.log(`Ditemukan ${snapshot.size} item untuk di-purge.`);
            
            let deletedCount = 0;
            const storageBucket = getStorage().bucket();

            // Gunakan batch untuk efisiensi Firestore
            const batch = db.batch();

            for (const doc of snapshot.docs) {
                const data = doc.data();
                
                // Hapus dari Firebase Storage jika ada storagePath
                if (data.tipe === "file" && data.storagePath) {
                    try {
                        const file = storageBucket.file(data.storagePath);
                        await file.delete();
                        console.log(`[Storage] Dihapus: ${data.storagePath}`);
                    } catch (e) {
                        console.error(`Gagal menghapus file storage: ${data.storagePath}`, e);
                        // Tetap lanjutkan meskipun storage gagal (misal file sudah tidak ada)
                    }
                }

                batch.delete(doc.ref);
                deletedCount++;
                
                // Jika sudah mencapai batas batch Firestore (500 operasi), commit dan buat batch baru
                if (deletedCount % 400 === 0) {
                    await batch.commit();
                    console.log(`Committed ${deletedCount} deletes...`);
                }
            }

            if (deletedCount % 400 !== 0) {
                await batch.commit();
            }

            console.log(`Selesai. Total item dihapus permanen: ${deletedCount}`);

        } catch (error) {
            console.error("Terjadi kesalahan saat Auto-Purge Recycle Bin:", error);
        }
    }
);
