import { onSchedule } from "firebase-functions/v2/scheduler";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "../config/firebase";

/**
 * Cron Job: dailyKinerjaAggregator
 * Menjalankan agregasi setiap pukul 00:05 WIB untuk menghitung
 * kinerja seluruh OPD pada hari sebelumnya (H-1).
 * Mengurangi bacaan (read) Firestore di Frontend.
 */
export const dailyKinerjaAggregator = onSchedule({
    schedule: "5 0 * * *", // 00:05 setiap hari
    timeZone: "Asia/Jakarta",
    region: "asia-southeast2",
    timeoutSeconds: 300, // 5 menit
}, async (event) => {
    console.log("[KinerjaAggregator] Memulai agregasi harian...");

    // Hitung waktu H-1
    // Jika di production timezone-nya UTC, maka getHours, dll akan menyesuaikan.
    // Tapi karena firebase cron men-trigger ini saat 00:05 Jakarta, 
    // new Date() saat eksekusi adalah ~ 17:05 UTC (hari sebelumnya).
    // Lebih aman menggunakan timestamp eksak:
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"}));
    now.setDate(now.getDate() - 1); // Mundur 1 hari
    now.setHours(0, 0, 0, 0); // Awal H-1
    const startTimestamp = Timestamp.fromDate(now);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const endTimestamp = Timestamp.fromDate(endOfDay);

    console.log(`[KinerjaAggregator] Rentang waktu agregasi: ${startTimestamp.toDate()} - ${endTimestamp.toDate()}`);

    // Ambil daftar semua OPD
    const opdsSnap = await db.collection('opd').get();
    const opdIds = opdsSnap.docs.map(doc => doc.id);

    for (const opdId of opdIds) {
        try {
            // 1. Agregasi Surat Masuk H-1
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

            // 2. Agregasi Disposisi Dibuat H-1
            const disposisiSnap = await db.collection('disposisi')
                .where('opdId', '==', opdId)
                .where('tanggalDisposisi', '>=', startTimestamp)
                .where('tanggalDisposisi', '<=', endTimestamp)
                .get();
            
            const totalDisposisi = disposisiSnap.size;

            const jabatanStats = new Map<string, { disposisiDiterima: number, tugasSelesai: number, tugasSelesaiTepatWaktu: number, namaPejabat: string }>();

            disposisiSnap.forEach(doc => {
                const d = doc.data();
                if (d.penerimaSnapshot) {
                    d.penerimaSnapshot.forEach((p: any) => {
                        const current = jabatanStats.get(p.jabatanId) || { disposisiDiterima: 0, tugasSelesai: 0, tugasSelesaiTepatWaktu: 0, namaPejabat: p.nama || 'Anonim' };
                        current.disposisiDiterima++;
                        jabatanStats.set(p.jabatanId, current);
                    });
                }
            });

            // 3. Agregasi Tugas Dibuat H-1
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

            // --- PERHITUNGAN KPI ---
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
                    rataRataWaktuPenyelesaianTugas: 1, // Placeholder
                    totalDisposisiDiterima: stats.disposisiDiterima
                };
            });

            if (totalSelesaiTugas > 0) {
                persentasePenyelesaianTepatWaktu = (totalTepatWaktu / totalSelesaiTugas) * 100;
            }

            const tingkatRevisiDisposisi = totalSuratMasuk > 0 ? (totalRevisi / totalSuratMasuk) * 100 : 0;
            const rataRataWaktuResponsDisposisi = 1.5; // Placeholder

            // --- SIMPAN KE FIRESTORE ---
            // Format ID: 2026-08-21_opdId
            const dateStr = now.toISOString().split('T')[0];
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

        } catch (e) {
            console.error(`[KinerjaAggregator] Gagal memproses OPD ${opdId}`, e);
        }
    }

    console.log("[KinerjaAggregator] Selesai.");
});
