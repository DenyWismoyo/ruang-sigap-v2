// Lokasi: functions/src/autoHeal.ts
import * as functions from "firebase-functions/v1";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const db = getFirestore("database-siyap");

export const runAutoHeal = functions.region('asia-southeast2').https.onCall(async (data, context) => {
    if (!context.auth || context.auth.token.role !== 'super_admin') {
        throw new functions.https.HttpsError('permission-denied', 'Akses ditolak.');
    }

    try {
        const batch = db.batch();
        let healedCount = 0;
        let suratHealedCount = 0;
        let metadataFixedCount = 0;

        // --- TAHAP 1: Perbaikan Counter User ---
        const summariesSnap = await db.collection('userSummaries').get();
        summariesSnap.docs.forEach(doc => {
            const summaryData = doc.data();
            const updates: any = {};
            let needsHealing = false;
            ['suratBaruCount', 'tugasBaruCount', 'disposisiBaru', 'tindakLanjutMenunggu', 'tugasAktif'].forEach(key => {
                if (summaryData[key] !== undefined && summaryData[key] < 0) {
                    updates[key] = 0;
                    needsHealing = true;
                }
            });
            if (needsHealing) { batch.update(doc.ref, updates); healedCount++; }
        });

        // --- TAHAP 2: Perbaikan Surat "Baru" Terbengkalai (> 7 Hari) ---
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const staleSuratSnap = await db.collection('surat')
            .where('statusPenyelesaian', '==', 'Baru')
            .where('tanggalDiterima', '<', Timestamp.fromDate(sevenDaysAgo))
            .limit(200).get();

        staleSuratSnap.docs.forEach(doc => {
            batch.update(doc.ref, { statusPenyelesaian: 'Diarsipkan', catatanSistem: 'Auto-archive: 7 hari tanpa aksi.' });
            suratHealedCount++;
        });

        // --- TAHAP 3: Auto-Repair Metadata (Data "Belum Didisposisikan" lama) ---
        // Mencari surat yang berstatus didisposisikan namun tidak memiliki infoTampilan
        const brokenMetadataSnap = await db.collection('surat')
            .where('statusPenyelesaian', '==', 'Didisposisikan')
            .where('infoTampilan', '==', null) // Atau tidak ada field infoTampilan
            .limit(200).get();

        for (const doc of brokenMetadataSnap.docs) {
            const disposisiSnap = await db.collection('disposisi')
                .where('suratId', '==', doc.id)
                .orderBy('tanggalDisposisi', 'desc')
                .limit(1).get();

            if (!disposisiSnap.empty) {
                const latestDisp = disposisiSnap.docs[0].data();
                // Ambil nama dari snapshot penerima jika ada, atau gunakan logic pemetaan
                const recipientNames = (latestDisp.penerimaSnapshot || [])
                    .map((p: any) => p.nama).join(', ');

                batch.update(doc.ref, {
                    'infoTampilan.recipientNames': recipientNames || 'Disposisi Terkirim',
                    'infoTampilan.senderName': latestDisp.dariJabatanNama || 'Pimpinan'
                });
                metadataFixedCount++;
            }
        }

        if (healedCount > 0 || suratHealedCount > 0 || metadataFixedCount > 0) {
            await batch.commit();
        }

        return { 
            success: true, 
            message: `Auto Heal: ${healedCount} user diperbaiki, ${suratHealedCount} surat diarsipkan, ${metadataFixedCount} surat metadata diperbaiki.` 
        };

    } catch (error: any) {
        console.error("Auto Heal Error:", error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});