// Lokasi: functions/src/validasiDisposisi.ts
// [Fungsi Backend]: Memastikan sinkronisasi status Surat otomatis saat seluruh disposisi multi-penerima sudah diselesaikan.
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore("database-siyap");

export const onDisposisiComplete = onDocumentUpdated({
    document: 'disposisi/{docId}',
    database: 'database-siyap',
    region: 'asia-southeast2'
}, async (event: any) => {
    const change = event.data;
    if (!change) return;
    
    const dataBefore = change.before.data();
    const dataAfter = change.after.data();

    // Hanya peduli jika ada penambahan ke array penerimaSelesai atau array kepada berubah
    const selesaiBefore = dataBefore.penerimaSelesai || [];
    const selesaiAfter = dataAfter.penerimaSelesai || [];
    const kepadaBefore = dataBefore.kepadaJabatanId || [];
    const kepadaAfter = dataAfter.kepadaJabatanId || [];
    
    // Periksa jika selesai bertambah atau jumlah target berubah (misal ditarik/direvisi)
    if (selesaiAfter.length <= selesaiBefore.length && kepadaAfter.length === kepadaBefore.length) {
        return; 
    }

    const suratId = dataAfter.suratId;
    if (!suratId) return;

    // Cek apakah seluruh dokumen disposisi untuk surat ini sudah selesai
    const disposisiSnap = await db.collection('disposisi').where('suratId', '==', suratId).get();
    
    let allFinished = true;

    disposisiSnap.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.status === 'Dikembalikan' || d.isInformational) return;
        
        const kepada = d.kepadaJabatanId || [];
        const selesai = d.penerimaSelesai || [];
        
        const dFinished = kepada.every((jabId: string) => selesai.includes(jabId));
        if (!dFinished) {
            allFinished = false;
        }
    });

    const suratRef = db.collection('surat').doc(suratId);
    
    if (allFinished) {
        // Otomatis tandai Selesai
        await suratRef.update({
            statusPenyelesaian: 'Selesai'
        });
        console.log(`Surat ${suratId} diubah ke Selesai via Backend karena seluruh disposisi selesai.`);
    } else {
        const suratDoc = await suratRef.get();
        const suratData = suratDoc.data();
        // Cegah perubahan jika sedang 'Revisi Disposisi'
        if (suratData && suratData.statusPenyelesaian !== 'Proses Tindak Lanjut' && suratData.statusPenyelesaian !== 'Revisi Disposisi') {
             await suratRef.update({
                 statusPenyelesaian: 'Proses Tindak Lanjut'
             });
        }
    }
});
