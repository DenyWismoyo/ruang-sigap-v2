import { onRequest } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "./config/firebase";

export const backfillKinerjaAgregat = onRequest({
    timeoutSeconds: 540, 
    region: 'asia-southeast2'
}, async (req, res) => {
    console.log("[Backfill] Memulai backfill agregasi harian 30 hari...");

    const today = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    today.setHours(0, 0, 0, 0);

    const opdsSnap = await db.collection('opd').get();
    const opdIds = opdsSnap.docs.map(doc => doc.id);

    let processedCount = 0;

    for (let i = 1; i <= 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const startTimestamp = Timestamp.fromDate(d);
        
        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);
        const endTimestamp = Timestamp.fromDate(endOfDay);

        console.log(`[Backfill] Memproses tanggal: ${d.toISOString().split('T')[0]}`);

        for (const opdId of opdIds) {
            try {
                // 1. Surat Masuk
                const suratSnap = await db.collection('surat')
                    .where('opdId', '==', opdId)
                    .where('tanggalDiterima', '>=', startTimestamp)
                    .where('tanggalDiterima', '<=', endTimestamp)
                    .get();

                const totalSuratMasuk = suratSnap.size;
                let totalRevisi = 0;
                suratSnap.forEach(doc => {
                    if (doc.data().statusPenyelesaian === 'Revisi Disposisi') totalRevisi++;
                });

                // 2. Disposisi
                const disposisiSnap = await db.collection('disposisi')
                    .where('opdId', '==', opdId)
                    .where('tanggalDisposisi', '>=', startTimestamp)
                    .where('tanggalDisposisi', '<=', endTimestamp)
                    .get();
                
                const totalDisposisi = disposisiSnap.size;
                const jabatanStats = new Map<string, { disposisiDiterima: number, tugasSelesai: number, tugasSelesaiTepatWaktu: number, namaPejabat: string }>();

                disposisiSnap.forEach(doc => {
                    const dispData = doc.data();
                    if (dispData.penerimaSnapshot) {
                        dispData.penerimaSnapshot.forEach((p: any) => {
                            const current = jabatanStats.get(p.jabatanId) || { disposisiDiterima: 0, tugasSelesai: 0, tugasSelesaiTepatWaktu: 0, namaPejabat: p.nama || 'Anonim' };
                            current.disposisiDiterima++;
                            jabatanStats.set(p.jabatanId, current);
                        });
                    }
                });

                // 3. Tugas
                const tugasSnap = await db.collection('tugas')
                    .where('opdId', '==', opdId)
                    .where('tanggalDibuat', '>=', startTimestamp)
                    .where('tanggalDibuat', '<=', endTimestamp)
                    .get();
                
                const totalTugas = tugasSnap.size;
                
                tugasSnap.forEach(doc => {
                    const t = doc.data();
                    if (t.status === 'Selesai' && t.kepadaJabatanId) {
                        const current = jabatanStats.get(t.kepadaJabatanId) || { disposisiDiterima: 0, tugasSelesai: 0, tugasSelesaiTepatWaktu: 0, namaPejabat: t.kepadaJabatanNama || 'Anonim' };
                        current.tugasSelesai++;
                        
                        if (t.batasWaktu && t.tanggalSelesai) {
                            if (t.tanggalSelesai.toMillis() <= t.batasWaktu.toMillis()) {
                                current.tugasSelesaiTepatWaktu++;
                            }
                        }
                        jabatanStats.set(t.kepadaJabatanId, current);
                    }
                });

                let persentasePenyelesaianTepatWaktu = 0;
                let totalTepatWaktu = 0;
                let totalSelesaiTugas = 0;

                const kinerjaPerJabatan = Array.from(jabatanStats.entries()).map(([jabatanId, stats]) => {
                    totalSelesaiTugas += stats.tugasSelesai;
                    totalTepatWaktu += stats.tugasSelesaiTepatWaktu;

                    return {
                        jabatanId,
                        namaJabatan: 'Terlampir', 
                        namaPejabat: stats.namaPejabat,
                        totalTugasSelesai: stats.tugasSelesai,
                        tugasSelesaiTepatWaktu: stats.tugasSelesaiTepatWaktu,
                        rataRataWaktuPenyelesaianTugas: 1,
                        totalDisposisiDiterima: stats.disposisiDiterima
                    };
                });

                if (totalSelesaiTugas > 0) {
                    persentasePenyelesaianTepatWaktu = (totalTepatWaktu / totalSelesaiTugas) * 100;
                }

                const tingkatRevisiDisposisi = totalSuratMasuk > 0 ? (totalRevisi / totalSuratMasuk) * 100 : 0;
                const rataRataWaktuResponsDisposisi = 1.5;

                const dateStr = d.toISOString().split('T')[0];
                const docId = `${dateStr}_${opdId}`;
                
                await db.collection('kinerjaAgregat').doc(docId).set({
                    tanggal: startTimestamp,
                    opdId: opdId,
                    totalSuratMasuk,
                    totalDisposisi,
                    totalTugas,
                    rataRataWaktuResponsDisposisi,
                    persentasePenyelesaianTepatWaktu,
                    tingkatRevisiDisposisi,
                    kinerjaPerJabatan,
                    bebanKerjaPerJabatan: [] 
                });

                processedCount++;
            } catch (e) {
                console.error(`[Backfill] Gagal memproses OPD ${opdId} pada ${d.toISOString()}`, e);
            }
        }
    }

    console.log(`[Backfill] Selesai. Total dokumen ditulis: ${processedCount}`);
    res.send({ success: true, processedCount });
});
