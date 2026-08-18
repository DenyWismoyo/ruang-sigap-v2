import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { Surat } from "./types";
import { FieldValue } from "firebase-admin/firestore";

const db = admin.firestore();

export const onSuratEksternalDikirim = onDocumentCreated(
    { document: "surat/{suratId}", region: "asia-southeast2" },
    async (event) => {
        const snap = event.data;
        if (!snap) return;

        const data = snap.data() as Surat;
        
        // Cek apakah surat ini adalah surat lintas OPD yang baru dikirim
        if (data.isLintasOpd && data.statusLintasOpd === 'dikirim' && data.tujuanEksternalOpdId) {
            
            // Cek apakah duplikat sudah pernah dibuat untuk mencegah infinite loop
            const duplicateId = `${snap.id}_ext`;
            const duplicateRef = db.collection('surat').doc(duplicateId);
            
            const duplicateSnap = await duplicateRef.get();
            if (duplicateSnap.exists) {
                console.log(`Duplikat surat eksternal ${duplicateId} sudah ada. Melewati.`);
                return;
            }

            // Buat salinan untuk OPD penerima
            const suratPenerima: Partial<Surat> & { createdAt: FieldValue, updatedAt: FieldValue } = {
                ...data,
                id: duplicateId,
                opdId: data.tujuanEksternalOpdId, // Milik OPD Penerima
                statusPenyelesaian: "Baru", // Mulai dari awal di OPD penerima
                statusLintasOpd: "diterima",
                terlibatJabatanIds: [], // Reset jabatan terlibat
                tujuanJabatanId: null, // Masuk ke pool Admin Persuratan OPD penerima
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
            };

            await duplicateRef.set(suratPenerima);
            console.log(`Surat lintas OPD berhasil diduplikasi dari ${data.opdId} ke ${data.tujuanEksternalOpdId} dengan ID ${duplicateId}`);
        }
    }
);
