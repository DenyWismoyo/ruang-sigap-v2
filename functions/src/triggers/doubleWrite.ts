import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { db, REGION } from "../config/firebase";

const DB_TARGET = process.env.FIRESTORE_DATABASE || "database-siyap";

// Helper generator
const generateDoubleWriteCreate = (collectionName: string) => onDocumentCreated(
    { document: `${collectionName}/{docId}`, region: REGION, database: DB_TARGET },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const docId = event.params.docId;
        const data = snap.data() as any;
        
        if (!data.opdId) return;

        try {
            const subcollectionRef = db.collection('opds').doc(data.opdId).collection(collectionName).doc(docId);
            await subcollectionRef.set(data);
            logger.log(`[Double Write] Berhasil menyalin ${collectionName} baru ${docId} ke subcollection opds/${data.opdId}/${collectionName}`);
        } catch (error) {
            logger.error(`[Double Write] Gagal menyalin ${collectionName} baru ${docId}:`, error);
        }
    }
);

const generateDoubleWriteUpdate = (collectionName: string) => onDocumentUpdated(
    { document: `${collectionName}/{docId}`, region: REGION, database: DB_TARGET },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const docId = event.params.docId;
        const afterData = snap.after.data() as any;
        
        if (!afterData.opdId) return;

        try {
            const subcollectionRef = db.collection('opds').doc(afterData.opdId).collection(collectionName).doc(docId);
            await subcollectionRef.set(afterData, { merge: true });
            logger.log(`[Double Write] Berhasil mengupdate ${collectionName} ${docId} di subcollection opds/${afterData.opdId}/${collectionName}`);
        } catch (error) {
            logger.error(`[Double Write] Gagal mengupdate ${collectionName} ${docId}:`, error);
        }
    }
);

const generateDoubleWriteDelete = (collectionName: string) => onDocumentDeleted(
    { document: `${collectionName}/{docId}`, region: REGION, database: DB_TARGET },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const docId = event.params.docId;
        const deletedData = snap.data() as any;
        
        if (!deletedData.opdId) return;

        try {
            const subcollectionRef = db.collection('opds').doc(deletedData.opdId).collection(collectionName).doc(docId);
            await subcollectionRef.delete();
            logger.log(`[Double Write] Berhasil menghapus ${collectionName} ${docId} di subcollection opds/${deletedData.opdId}/${collectionName}`);
        } catch (error) {
            logger.error(`[Double Write] Gagal menghapus ${collectionName} ${docId}:`, error);
        }
    }
);

// Exports
export const onSuratDoubleWriteCreate = generateDoubleWriteCreate('surat');
export const onSuratDoubleWriteUpdate = generateDoubleWriteUpdate('surat');
export const onSuratDoubleWriteDelete = generateDoubleWriteDelete('surat');

export const onDisposisiDoubleWriteCreate = generateDoubleWriteCreate('disposisi');
export const onDisposisiDoubleWriteUpdate = generateDoubleWriteUpdate('disposisi');
export const onDisposisiDoubleWriteDelete = generateDoubleWriteDelete('disposisi');

export const onTugasDoubleWriteCreate = generateDoubleWriteCreate('tugas');
export const onTugasDoubleWriteUpdate = generateDoubleWriteUpdate('tugas');
export const onTugasDoubleWriteDelete = generateDoubleWriteDelete('tugas');

export const onJadwalTempatDoubleWriteCreate = generateDoubleWriteCreate('jadwalTempat');
export const onJadwalTempatDoubleWriteUpdate = generateDoubleWriteUpdate('jadwalTempat');
export const onJadwalTempatDoubleWriteDelete = generateDoubleWriteDelete('jadwalTempat');

export const onDrafPersetujuanDoubleWriteCreate = generateDoubleWriteCreate('drafPersetujuan');
export const onDrafPersetujuanDoubleWriteUpdate = generateDoubleWriteUpdate('drafPersetujuan');
export const onDrafPersetujuanDoubleWriteDelete = generateDoubleWriteDelete('drafPersetujuan');

export const onTindakLanjutDoubleWriteCreate = generateDoubleWriteCreate('tindakLanjut');
export const onTindakLanjutDoubleWriteUpdate = generateDoubleWriteUpdate('tindakLanjut');
export const onTindakLanjutDoubleWriteDelete = generateDoubleWriteDelete('tindakLanjut');
