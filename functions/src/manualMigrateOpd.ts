import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

import { getFirestore } from "firebase-admin/firestore";

let appB: admin.app.App | undefined;

export const manualMigrateOpdToPoros = onRequest({
    secrets: ["TARGET_PROJECT_B_SA"],
    region: "asia-southeast2",
    timeoutSeconds: 540, // Max 9 minutes
    memory: "1GiB"
}, async (req, res) => {
    // Basic API Key protection
    const apiKey = req.query.key;
    const opdId = req.query.opdId as string;
    const lastSyncStr = req.query.lastSync as string;

    if (apiKey !== "MIGRASI_AMAN_123") {
        res.status(401).send("Unauthorized");
        return;
    }

    if (!opdId) {
        res.status(400).send("Parameter opdId wajib diisi.");
        return;
    }

    const lastSyncDate = lastSyncStr ? new Date(lastSyncStr) : null;
    logger.info(`Memulai migrasi untuk OPD: ${opdId}. Mode: ${lastSyncDate ? 'Smart Sync (lastSync: ' + lastSyncDate.toISOString() + ')' : 'Full Sync'}`);

    try {
        if (!appB) {
            const saJsonStr = process.env.TARGET_PROJECT_B_SA;
            if (!saJsonStr) throw new Error("Secret TARGET_PROJECT_B_SA tidak ditemukan.");
            
            const serviceAccount = JSON.parse(saJsonStr);
            
            if (admin.apps.length > 0) {
                appB = admin.apps.find(app => app?.name === 'projectB') as admin.app.App | undefined;
            }
            if (!appB) {
                appB = admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                }, 'projectB');
            }
        }

        const dbA = getFirestore("database-siyap");
        const dbB = appB.firestore();

        const collectionsToMigrateByOpdId = [
            'users', 'jabatan', 'surat', 'disposisi', 'drafPersetujuan', 
            'jadwalTempat', 'tagihan', 'kinerjaHarian', 'tugas', 'pengumuman', 'tindakLanjut'
        ];

        let totalMigrated = 0;
        let totalSkipped = 0;
        const usersIds: string[] = [];
        const jabatanIds: string[] = [];
        const suratIds: string[] = [];

        // Helper function for checking if we should skip based on date
        const shouldSkip = (data: any) => {
            if (!lastSyncDate) return false;
            const docDate = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || data.timestamp?.toDate?.() || null;
            if (docDate && docDate < lastSyncDate) {
                return true;
            }
            return false;
        };

        // 1. Migrate Collections with opdId field
        for (const colName of collectionsToMigrateByOpdId) {
            logger.info(`Migrating collection: ${colName}`);
            const snapshot = await dbA.collection(colName).where('opdId', '==', opdId).get();
            
            if (snapshot.empty) {
                logger.info(`No documents found in ${colName} for OPD ${opdId}`);
                continue;
            }

            const batchPromises = snapshot.docs.map(async (doc) => {
                const data = doc.data();
                // Simpan ID untuk referensi koleksi bersarang
                if (colName === 'users') usersIds.push(doc.id); // doc.id is uid (usually) or NIP
                if (colName === 'jabatan') jabatanIds.push(doc.id);
                if (colName === 'surat') suratIds.push(doc.id);
                
                // Track uid if users collection
                if (colName === 'users' && data.uid) {
                    if (!usersIds.includes(data.uid)) usersIds.push(data.uid);
                }

                if (shouldSkip(data)) {
                    totalSkipped++;
                    return;
                }

                await dbB.collection(colName).doc(doc.id).set(data, { merge: true });
                totalMigrated++;
            });

            await Promise.all(batchPromises);
            logger.info(`Migrasi koleksi ${colName} selesai.`);
        }
        
        // 1.5 Tindak Lanjut cadangan (jika opdId kosong, ambil berdasarkan jabatanId yang terlibat)
        // Karena query 'in' maksimal 10, kita bisa gunakan looping jika perlu, 
        // tapi untuk efisiensi kita lewati dulu atau asumsikan tindakLanjut terbaru sudah ada opdId.

        // 2. Koleksi Root tanpa opdId langsung (userSummaries)
        const summaryIdsToFetch = [...new Set([...usersIds, ...jabatanIds])];
        if (summaryIdsToFetch.length > 0) {
            // Karena array bisa besar, pecah jadi chunk 10 (limit firestore 'in')
            for (let i = 0; i < summaryIdsToFetch.length; i += 10) {
                const chunk = summaryIdsToFetch.slice(i, i + 10);
                const sumSnap = await dbA.collection('userSummaries').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
                await Promise.all(sumSnap.docs.map(async (doc) => {
                    const data = doc.data();
                    if (shouldSkip(data)) {
                        totalSkipped++;
                        return;
                    }
                    await dbB.collection('userSummaries').doc(doc.id).set(data, { merge: true });
                    totalMigrated++;
                }));
            }
            logger.info(`Migrasi userSummaries selesai.`);
        }

        // 3. Sub-koleksi per pengguna (suratPerPengguna, tugasPerPengguna)
        for (const uid of usersIds) {
            const subCols = [
                { parent: 'suratPerPengguna', sub: 'inbox' },
                { parent: 'suratPerPengguna', sub: 'arsip' },
                { parent: 'suratPerPengguna', sub: 'delegated' },
                { parent: 'tugasPerPengguna', sub: 'tugas' }
            ];

            for (const { parent, sub } of subCols) {
                const snap = await dbA.collection(parent).doc(uid).collection(sub).get();
                await Promise.all(snap.docs.map(async (doc) => {
                    const data = doc.data();
                    if (shouldSkip(data)) {
                        totalSkipped++;
                        return;
                    }
                    await dbB.collection(parent).doc(uid).collection(sub).doc(doc.id).set(data, { merge: true });
                    totalMigrated++;
                }));
            }
        }
        logger.info(`Migrasi koleksi bersarang per pengguna selesai.`);

        // 4. Koleksi spesifik OPD lainnya (seperti opdConfigs)
        const opdConfigSnap = await dbA.collection('opdConfigs').doc(opdId).get();
        if (opdConfigSnap.exists) {
            const data = opdConfigSnap.data()!;
            if (shouldSkip(data)) {
                totalSkipped++;
            } else {
                await dbB.collection('opdConfigs').doc(opdId).set(data, { merge: true });
                totalMigrated++;
            }
        }

        res.status(200).send({
            success: true,
            message: `Migrasi selesai! Total ${totalMigrated} ditulis, ${totalSkipped} dilewati. OPD: ${opdId}. Mode: ${lastSyncDate ? 'Smart Sync' : 'Full Sync'}`,
            opdId: opdId,
            written: totalMigrated,
            skipped: totalSkipped
        });

    } catch (error: any) {
        logger.error("Error during migration:", error);
        res.status(500).send({
            success: false,
            message: "Terjadi kesalahan saat migrasi",
            error: error.message
        });
    }
});
