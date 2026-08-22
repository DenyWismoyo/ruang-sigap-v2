import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { db, REGION } from "../config/firebase";

/**
 * OPD Health Score Aggregator (Cron Job) — v2
 * Berjalan setiap hari jam 03:00 pagi WIB.
 *
 * Formula: 4 Pilar Kesehatan OPD
 * ──────────────────────────────────────────────────────────────────
 * 1. Adopsi User (Bobot 30%)
 *    Mengukur: Berapa % user aktif OPD yang membuka aplikasi bulan ini?
 *    Rumus:    (unique user login / total user aktif) * 100
 *    Data:     koleksi `userSessions` + `users`
 *
 * 2. Konsistensi / Retensi Mingguan (Bobot 20%)
 *    Mengukur: Apakah user login secara reguler setiap minggu?
 *    Rumus:    rata-rata (jumlah minggu unik login / minggu elapsed) * 100
 *    Data:     field `weekOfMonth` di koleksi `userSessions`
 *
 * 3. Produktivitas Dokumen (Bobot 25%)
 *    Mengukur: Berapa % surat masuk yang diselesaikan (outcome-based)?
 *    Rumus:    (surat statusPenyelesaian='Selesai'|'Diarsipkan' / total surat) * 100
 *    Data:     koleksi `surat`
 *
 * 4. Penyelesaian Tugas Tepat Waktu (Bobot 25%)
 *    Mengukur: Berapa % tugas yang selesai sebelum batas waktu?
 *    Rumus:    (tugasTepatWaktu / totalTugasSelesai) * 100
 *    Data:     koleksi `tugas`
 *
 * Health Score = (0.30*S1) + (0.20*S2) + (0.25*S3) + (0.25*S4)
 * Range: 0 – 100
 * ──────────────────────────────────────────────────────────────────
 */
export const aggregateHealthScore = onSchedule(
    {
        schedule: "0 3 * * *", // Jam 03:00 WIB
        region: REGION,
        timeZone: "Asia/Jakarta",
        memory: "1GiB",
        timeoutSeconds: 540,
    },
    async (_event) => {
        logger.log("Starting OPD Health Score aggregation v2 (4 Pillars)...");

        const now = new Date();
        // Cron berjalan jam 03:00 → data dihitung sampai kemarin
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        yesterday.setHours(23, 59, 59, 999);

        const startOfMonth = new Date(yesterday.getFullYear(), yesterday.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const startTimestamp = admin.firestore.Timestamp.fromDate(startOfMonth);
        const endTimestamp = admin.firestore.Timestamp.fromDate(yesterday);

        const pad = (n: number) => (n < 10 ? "0" + n : String(n));
        const dateStr = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}`; // "YYYY-MM"
        const daysElapsed = Math.max(1, yesterday.getDate());
        // Minggu yang sudah berjalan di bulan ini (min 1)
        const weeksElapsed = Math.max(1, Math.ceil(daysElapsed / 7));

        try {
            const opdSnapshot = await db.collection("opd").get();
            const opdList = opdSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const batch = db.batch();

            for (const opd of opdList) {

                // ═══════════════════════════════════════════════════════
                // PILAR 1 & 2: Adopsi & Konsistensi (dari userSessions)
                // ═══════════════════════════════════════════════════════

                const usersSnapshot = await db.collection("users")
                    .where("opdId", "==", opd.id)
                    .where("status", "==", "aktif")
                    .get();
                const totalUserAktif = usersSnapshot.size;

                const sessionsSnapshot = await db.collection("userSessions")
                    .where("opdId", "==", opd.id)
                    .where("yearMonth", "==", dateStr)
                    .get();

                // Kumpulkan unique user ID dan tracking minggu aktif per user
                const uniqueUserIds = new Set<string>();
                const userWeeks = new Map<string, Set<number>>();

                sessionsSnapshot.forEach(doc => {
                    const d = doc.data();
                    const uid = d.userId as string;
                    const week = d.weekOfMonth as number;
                    uniqueUserIds.add(uid);
                    if (!userWeeks.has(uid)) userWeeks.set(uid, new Set());
                    userWeeks.get(uid)!.add(week);
                });

                const totalUserLogin = uniqueUserIds.size;

                // Skor Adopsi: % user aktif yang login min 1x bulan ini
                let skorAdopsi = 0;
                if (totalUserAktif > 0) {
                    skorAdopsi = Math.min(100, Math.round((totalUserLogin / totalUserAktif) * 100));
                } else if (totalUserLogin > 0) {
                    skorAdopsi = 100;
                }

                // Skor Konsistensi: rata-rata % minggu aktif per user (dari user yg sudah login)
                let skorKonsistensi = 0;
                if (totalUserLogin > 0) {
                    let totalRate = 0;
                    userWeeks.forEach(weeksSet => {
                        totalRate += weeksSet.size / weeksElapsed;
                    });
                    skorKonsistensi = Math.min(100, Math.round((totalRate / totalUserLogin) * 100));
                }

                // ═══════════════════════════════════════════════════════
                // PILAR 3: Produktivitas Dokumen (dari koleksi surat)
                // ═══════════════════════════════════════════════════════

                const suratSnapshot = await db.collection("surat")
                    .where("opdId", "==", opd.id)
                    .where("tanggalDiterima", ">=", startTimestamp)
                    .where("tanggalDiterima", "<=", endTimestamp)
                    .get();

                const totalSuratMasuk = suratSnapshot.size;
                let totalSuratSelesai = 0;

                suratSnapshot.forEach(doc => {
                    const s = doc.data();
                    if (s.statusPenyelesaian === "Selesai" || s.statusPenyelesaian === "Diarsipkan") {
                        totalSuratSelesai++;
                    }
                });

                let skorProduktivitasDokumen = 0;
                if (totalSuratMasuk > 0) {
                    skorProduktivitasDokumen = Math.min(100, Math.round((totalSuratSelesai / totalSuratMasuk) * 100));
                }

                // Data mentah tambahan (disimpan sebagai referensi di metrics)
                const disposisiSnapshot = await db.collection("disposisi")
                    .where("opdId", "==", opd.id)
                    .where("tanggalDisposisi", ">=", startTimestamp)
                    .where("tanggalDisposisi", "<=", endTimestamp)
                    .get();
                const totalDisposisi = disposisiSnapshot.size;

                const logbookSnapshot = await db.collection("logbookHarian")
                    .where("opdId", "==", opd.id)
                    .where("tanggal", ">=", startTimestamp)
                    .where("tanggal", "<=", endTimestamp)
                    .get();
                const totalLogbook = logbookSnapshot.size;

                // ═══════════════════════════════════════════════════════
                // PILAR 4: Penyelesaian Tugas Tepat Waktu
                // ═══════════════════════════════════════════════════════

                const tugasSnapshot = await db.collection("tugas")
                    .where("opdId", "==", opd.id)
                    .where("status", "==", "Selesai")
                    .where("tanggalSelesai", ">=", startTimestamp)
                    .where("tanggalSelesai", "<=", endTimestamp)
                    .get();

                let tugasTepatWaktu = 0;
                const totalTugasSelesai = tugasSnapshot.size;

                tugasSnapshot.forEach(doc => {
                    const t = doc.data();
                    if (t.batasWaktu && t.tanggalSelesai) {
                        if (t.tanggalSelesai.toMillis() <= t.batasWaktu.toMillis()) {
                            tugasTepatWaktu++;
                        }
                    } else {
                        // Tidak ada batas waktu → dianggap tepat waktu
                        tugasTepatWaktu++;
                    }
                });

                // Default 100 jika tidak ada tugas selesai bulan ini (tidak menghukum OPD yg belum punya tugas)
                let skorTugasTepatWaktu = 100;
                if (totalTugasSelesai > 0) {
                    skorTugasTepatWaktu = Math.round((tugasTepatWaktu / totalTugasSelesai) * 100);
                }

                // ═══════════════════════════════════════════════════════
                // SKOR AKHIR & KATEGORI
                // ═══════════════════════════════════════════════════════

                // OPD dianggap aktif jika ada user login ATAU ada transaksi surat/tugas
                const adaAktivitas = totalUserLogin > 0 || totalSuratMasuk > 0 || totalTugasSelesai > 0;

                let finalScore = 0;
                let kategori = "Tidak Aktif";

                if (adaAktivitas) {
                    finalScore = Math.round(
                        (0.30 * skorAdopsi) +
                        (0.20 * skorKonsistensi) +
                        (0.25 * skorProduktivitasDokumen) +
                        (0.25 * skorTugasTepatWaktu)
                    );

                    if (finalScore >= 85) kategori = "Sangat Sehat";
                    else if (finalScore >= 70) kategori = "Sehat";
                    else if (finalScore >= 50) kategori = "Perlu Perhatian";
                    else kategori = "Buruk";
                }

                // Simpan ke opdHealthScores
                const healthRef = db.collection("opdHealthScores").doc(`${opd.id}_${dateStr}`);
                batch.set(healthRef, {
                    opdId: opd.id,
                    tanggal: startTimestamp,
                    dateString: dateStr,
                    score: finalScore,
                    metrics: {
                        // Skor per pilar (0-100)
                        skorAdopsi,
                        skorKonsistensi,
                        skorProduktivitasDokumen,
                        skorTugasTepatWaktu,
                        // Data mentah untuk tampilan tabel & analitika
                        totalUserAktif,
                        totalUserLogin,
                        rateAdopsi: totalUserAktif > 0 ? Math.round((totalUserLogin / totalUserAktif) * 100) : 0,
                        totalSuratMasuk,
                        totalSuratSelesai,
                        totalTugasSelesai,
                        totalTugasTepatWaktu: tugasTepatWaktu,
                        totalDisposisi,
                        totalLogbook,
                    },
                    kategori,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Update snapshot cepat di dokumen OPD
                const opdRef = db.collection("opd").doc(opd.id);
                batch.update(opdRef, {
                    currentHealthScore: finalScore,
                    healthCategory: kategori,
                });
            }

            await batch.commit();
            logger.log(`Health Score v2 aggregation completed for ${opdList.length} OPDs.`);

        } catch (error) {
            logger.error("Error aggregating health scores v2:", error);
        }
    }
);
