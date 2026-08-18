import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const DB_TARGET = process.env.FIRESTORE_DATABASE || "database-siyap";

export const manualMigrateToSubcollections = onRequest({
    region: "asia-southeast2",
    timeoutSeconds: 540,
    memory: "1GiB"
}, async (req, res) => {
    const apiKey = req.query.key;
    if (apiKey !== "MIGRASI_AMAN_123") {
        res.status(401).send("Unauthorized");
        return;
    }

    const collectionName = (req.query.collection as string) || 'surat';
    const dryRun = req.query.dryRun === 'true';
    const limitParam = parseInt(req.query.limit as string, 10);
    const offsetParam = parseInt(req.query.offset as string, 10);

    const allowedCollections = ['surat', 'disposisi', 'tugas', 'jadwalTempat', 'drafPersetujuan', 'tindakLanjut'];
    if (!allowedCollections.includes(collectionName)) {
        res.status(400).send({
            success: false,
            message: `Koleksi tidak valid. Diperbolehkan: ${allowedCollections.join(', ')}`
        });
        return;
    }

    const db = getFirestore(DB_TARGET);
    
    try {
        let query: FirebaseFirestore.Query = db.collection(collectionName);
        
        if (!isNaN(offsetParam) && offsetParam > 0) {
            // Note: offset might be slow for very large datasets but works for one-off scripts
            query = query.offset(offsetParam);
        }
        if (!isNaN(limitParam) && limitParam > 0) {
            query = query.limit(limitParam);
        }

        const snapshot = await query.get();
        let totalMigrated = 0;
        let totalSkipped = 0;
        const opdStats: Record<string, number> = {};

        logger.info(`[${dryRun ? 'DRY-RUN' : 'MIGRASI'}] Memulai sub-collection untuk ${snapshot.size} dokumen dari koleksi '${collectionName}'.`);

        let batch = db.batch();
        let operationCount = 0;
        let batchCount = 0;

        for (const doc of snapshot.docs) {
            const data = doc.data();
            const opdId = data.opdId;
            
            if (!opdId) {
                logger.warn(`Dokumen ${collectionName}/${doc.id} tidak memiliki opdId, dilewati.`);
                totalSkipped++;
                continue;
            }

            const subcollectionRef = db.collection('opds').doc(opdId).collection(collectionName).doc(doc.id);
            
            if (!dryRun) {
                batch.set(subcollectionRef, data, { merge: true });
            }

            // Track stats
            if (!opdStats[opdId]) opdStats[opdId] = 0;
            opdStats[opdId]++;

            totalMigrated++;
            operationCount++;

            if (!dryRun && operationCount >= 400) {
                await batch.commit();
                batchCount++;
                logger.info(`Batch ${batchCount} di-commit (${operationCount} operasi).`);
                batch = db.batch();
                operationCount = 0;
            }
        }

        if (!dryRun && operationCount > 0) {
            await batch.commit();
            batchCount++;
            logger.info(`Batch akhir ${batchCount} di-commit (${operationCount} operasi).`);
        }

        res.status(200).send({
            success: true,
            mode: dryRun ? 'DRY-RUN (Tidak ada data yang ditulis)' : 'EXECUTE',
            collection: collectionName,
            message: `Migrasi selesai! Total ${totalMigrated} dokumen disalin ke sub-collection, ${totalSkipped} dilewati.`,
            written: totalMigrated,
            skipped: totalSkipped,
            batches: batchCount,
            limit: limitParam || 'Semua',
            offset: offsetParam || 0,
            opdBreakdown: opdStats
        });

    } catch (error: any) {
        logger.error(`Error during subcollection migration for ${collectionName}:`, error);
        res.status(500).send({
            success: false,
            message: "Terjadi kesalahan saat migrasi",
            error: error.message
        });
    }
});
