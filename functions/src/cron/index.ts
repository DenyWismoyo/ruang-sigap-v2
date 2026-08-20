import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { db, REGION } from "../config/firebase";
import { sendFcmMessageByUid } from "../utils/helpers";
import { 
  UserProfile, Jabatan, Surat, Disposisi, Tugas, OPD, KinerjaPerPenggunaHarian, Tagihan, PricingPackage, OpdConfig 
} from "../types";



export const sendAgendaReminders = onSchedule(
    { schedule: "every 15 minutes", region: REGION, timeZone: "Asia/Jakarta" },
    async (event) => {
        logger.log("Running scheduled function to send agenda reminders...");
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const seventyFiveMinutesFromNow = new Date(now.getTime() + 75 * 60 * 1000);
        try {
            const agendaQuery = db.collection("surat")
                .where("jenisSurat", "==", "Undangan")
                .where("detailAgenda.tanggal", ">=", admin.firestore.Timestamp.fromDate(now))
                .where("reminderSent", "==", false);
            const snapshot = await agendaQuery.get();
            if (snapshot.empty) {
                logger.log("No upcoming agendas needing reminders at this moment.");
                return;
            }
            logger.log(`Found ${snapshot.size} potential agendas to check for reminders.`);
            for (const doc of snapshot.docs) {
                const surat = { id: doc.id, ...doc.data() } as Surat;
                if (!surat.detailAgenda || !surat.detailAgenda.tanggal || !surat.detailAgenda.jam) {
                    logger.warn(`Agenda details missing or invalid for surat ${surat.id}. Skipping reminder.`);
                    continue;
                }
                let agendaDateTime: Date;
                try {
                    const [hours, minutes] = surat.detailAgenda.jam.split(":").map(Number);
                    agendaDateTime = surat.detailAgenda.tanggal.toDate();
                    agendaDateTime.setHours(hours, minutes, 0, 0);
                } catch (e) {
                     logger.error(`Error parsing agenda time for surat ${surat.id}: ${surat.detailAgenda.jam}`, e);
                     continue;
                }
                if (agendaDateTime > oneHourFromNow && agendaDateTime <= seventyFiveMinutesFromNow) {
                     logger.log(`Agenda for surat ${surat.id} is within reminder window. Processing...`);
                     await db.runTransaction(async (transaction) => {
                        const suratRef = db.collection("surat").doc(surat.id);
                        const freshDoc = await transaction.get(suratRef);
                        if (!freshDoc.exists || freshDoc.data()?.reminderSent === true) {
                            logger.log(`Reminder for surat ${surat.id} was already sent or document deleted. Skipping.`);
                            return;
                        }
                        const disposisiQuery = db.collection("disposisi")
                            .where("suratId", "==", surat.id).orderBy("tanggalDisposisi", "desc").limit(1);
                        const disposisiSnapshot = await transaction.get(disposisiQuery);
                        if (!disposisiSnapshot.empty) {
                            const latestDisposisi = disposisiSnapshot.docs[0].data() as Disposisi;
                            const recipientJabatanIds = latestDisposisi.kepadaJabatanId;
                            const usersQuery = await db.collection("users").where("jabatanId", "in", recipientJabatanIds).get();
                            logger.log(`Found ${usersQuery.size} users to notify for reminder ${surat.id}.`);
                            usersQuery.forEach(userDoc => {
                                const user = userDoc.data() as UserProfile;
                                const notifRef = db.collection("notifications").doc();
                                transaction.set(notifRef, {
                                    userId: user.uid,
                                    userNip: user.nip,
                                    message: `PENGINGAT: Undangan "${surat.perihal}" akan dimulai sekitar 1 jam lagi pukul ${surat.detailAgenda?.jam}.`,
                                    link: `/dashboard/surat/${surat.id}`, isRead: false,
                                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                                });
                            });
                        } else {
                             logger.log(`No disposisi found for surat ${surat.id}. Reminder not sent to recipients.`);
                        }
                        transaction.update(suratRef, { reminderSent: true });
                        logger.log(`Transaction to send reminder for ${surat.id} committed.`);
                    });
                }
            }
            logger.log("Finished checking agendas for reminders.");
        } catch (error) {
            logger.error("Error running sendAgendaReminders:", error);
        }
    }
);
export const archiveOldInvitations = onSchedule(
     { schedule: "0 1 * * *", region: REGION, timeZone: "Asia/Jakarta" },
    async (event) => {
        logger.log("Starting scheduled function to archive old invitations...");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = admin.firestore.Timestamp.fromDate(today);
        try {
            const invitationsToArchiveQuery = db.collection("surat")
                .where("jenisSurat", "==", "Undangan")
                .where("statusPenyelesaian", "!=", "Diarsipkan")
                .where("detailAgenda.tanggal", "<", todayTimestamp);
            const snapshot = await invitationsToArchiveQuery.get();
            if (snapshot.empty) {
                logger.log("No past invitations found to archive.");
                return;
            }
            logger.log(`Found ${snapshot.size} old invitations to archive.`);
            const batch = db.batch();
            snapshot.forEach(doc => {
                logger.log(`Marking invitation ${doc.id} for archiving.`);
                batch.update(doc.ref, { statusPenyelesaian: "Diarsipkan" });
            });
            await batch.commit();
            logger.log(`Successfully archived ${snapshot.size} old invitations.`);
        } catch (error) {
            logger.error("Error archiving old invitations:", error);
        }
    }
);
export const generateDailyPerformanceStats = onSchedule(
    {
        schedule: "0 2 * * *", // Jam 02:00 WIB
        region: REGION,
        timeZone: "Asia/Jakarta",
        memory: "1GiB",
        timeoutSeconds: 540,
    },
    async (event) => {
        logger.log("Starting daily performance aggregation...");
        
        // 1. Tentukan Rentang Waktu (HARI KEMARIN 00:00 - 23:59)
        // Karena fungsi jalan jam 02:00 pagi, kita hitung data untuk kemarin.
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        
        const startOfDay = new Date(yesterday);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(yesterday);
        endOfDay.setHours(23, 59, 59, 999);

        const startTimestamp = admin.firestore.Timestamp.fromDate(startOfDay);
        const endTimestamp = admin.firestore.Timestamp.fromDate(endOfDay);
        
        const yesterdayStr = startOfDay.toISOString().split("T")[0]; // Format YYYY-MM-DD

        try {
            const [opdSnapshot, jabatanSnapshot, userSnapshot] = await Promise.all([
                db.collection("opd").get(),
                db.collection("jabatan").where("status", "==", "aktif").get(),
                db.collection("users").where("status", "==", "aktif").get(),
            ]);
            const allOpds = opdSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OPD));
            const allJabatans = jabatanSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Jabatan));
            const allUsers = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
            const userMap = new Map(allUsers.map(u => [u.jabatanId, u.namaLengkap]));
            
            // [MODIFIKASI] Query data HANYA untuk hari kemarin
            // Menggunakan filter tanggal di level query untuk efisiensi
            const [suratSnapshot, disposisiSnapshot, tugasSnapshot] = await Promise.all([
                 db.collection("surat")
                    .where("tanggalDiterima", ">=", startTimestamp)
                    .where("tanggalDiterima", "<=", endTimestamp)
                    .get(),
                 db.collection("disposisi")
                    .where("tanggalDisposisi", ">=", startTimestamp)
                    .where("tanggalDisposisi", "<=", endTimestamp)
                    .get(),
                 db.collection("tugas")
                    .where("tanggalDibuat", ">=", startTimestamp)
                    .where("tanggalDibuat", "<=", endTimestamp)
                    .get(),
                 // Kita juga butuh 'Tugas Selesai' hari ini (berdasarkan tanggalSelesai)
                 db.collection("tugas")
                    .where("status", "==", "Selesai")
                    .where("tanggalSelesai", ">=", startTimestamp)
                    .where("tanggalSelesai", "<=", endTimestamp)
                    .get()
            ]);
            
            const dailySurat = suratSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Surat));
            const dailyDisposisi = disposisiSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Disposisi));
            const dailyTugasDibuat = tugasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tugas));
            const dailyTugasSelesai = tugasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tugas));

            // Kita juga perlu mengambil ALL Disposisi (bukan cuma harian) untuk menghitung waktu respon surat harian
            // TAPI ini berat. Solusi efisien: Ambil disposisi yang terkait dengan surat harian saja.
            // Untuk simplifikasi di sini, kita asumsikan waktu respons dihitung jika disposisinya dibuat hari ini juga.
            // Atau query tambahan by suratId list jika perlu presisi tinggi.

            const batch = db.batch();
            
            for (const opd of allOpds) {
                logger.log(`Processing performance data for OPD: ${opd.namaOpd} (${opd.id})`);
                const jabatansInOpd = allJabatans.filter(j => j.opdId === opd.id);
                
                // Filter data harian per OPD
                const suratInOpd = dailySurat.filter(s => s.opdId === opd.id);
                const disposisiInOpd = dailyDisposisi.filter(d => d.opdId === opd.id);
                const tugasDibuatInOpd = dailyTugasDibuat.filter(t => t.opdId === opd.id);
                const tugasSelesaiInOpd = dailyTugasSelesai.filter(t => t.opdId === opd.id);

                // 1. Rata-rata Waktu Respons (Hanya untuk surat yang masuk hari ini dan sudah didisposisi hari ini)
                // Catatan: Ini pendekatan aproksimasi agar tidak query berat.
                let totalResponseTimeMillis = 0;
                let responseCount = 0;
                
                // Kita perlu cek disposisi untuk surat-surat ini.
                // Karena dailyDisposisi hanya memuat disposisi hari ini, ini cukup valid untuk "Quick Response".
                suratInOpd.forEach(s => {
                    const relatedDisposisi = dailyDisposisi
                        .filter(d => d.suratId === s.id)
                        .sort((a,b) => a.tanggalDisposisi.toMillis() - b.tanggalDisposisi.toMillis())[0];
                    
                    if (relatedDisposisi) {
                        const timeDiff = relatedDisposisi.tanggalDisposisi.toMillis() - s.tanggalDiterima.toMillis();
                        if (timeDiff > 0) {
                            totalResponseTimeMillis += timeDiff;
                            responseCount++;
                        }
                    }
                });
                const rataRataWaktuResponsJam = responseCount > 0 ? (totalResponseTimeMillis / responseCount / 3600000) : 0;

                // 2. Ketepatan Waktu (Dari tugas yang SELESAI hari ini)
                const tugasTepatWaktu = tugasSelesaiInOpd.filter(t => t.batasWaktu && t.tanggalSelesai && t.tanggalSelesai.toMillis() <= t.batasWaktu.toMillis()).length;
                const persentasePenyelesaianTepatWaktu = tugasSelesaiInOpd.length > 0 ? (tugasTepatWaktu / tugasSelesaiInOpd.length * 100) : 0;

                // 3. Tingkat Revisi (Dari disposisi hari ini)
                const revisiCount = disposisiInOpd.filter(d => d.status === "Dikembalikan").length;
                const tingkatRevisiDisposisi = disposisiInOpd.length > 0 ? (revisiCount / disposisiInOpd.length * 100) : 0;

                // 4. Beban Kerja & Kinerja Per Jabatan (Harian)
                // Perlu query tambahan untuk 'Tugas Aktif' (snapshot) karena itu bukan event harian tapi status
                // Untuk efisiensi, kita skip 'bebanKerjaPerJabatan' yang snapshot berat di fungsi harian ini, 
                // atau kita buat fungsi terpisah. 
                // NAMUN, agar dashboard tidak error, kita kirim array kosong atau data dummy snapshot jika sangat diperlukan.
                // Disini kita fokus ke KINERJA (Flow), bukan STOCK (Beban).
                
                const kinerjaPerJabatan = jabatansInOpd.map(j => {
                    const tugasJabatanSelesai = tugasSelesaiInOpd.filter(t => t.kepadaJabatanId === j.id);
                    const totalTugasSelesai = tugasJabatanSelesai.length;
                    const tugasSelesaiTepatWaktu = tugasJabatanSelesai.filter(t => t.batasWaktu && t.tanggalSelesai && t.tanggalSelesai.toMillis() <= t.batasWaktu.toMillis()).length;
                    
                    let totalWaktuPenyelesaianMillis = 0;
                    tugasJabatanSelesai.forEach(t => {
                        if (t.tanggalSelesai) {
                            totalWaktuPenyelesaianMillis += t.tanggalSelesai.toMillis() - t.tanggalDibuat.toMillis();
                        }
                    });
                    const rataRataWaktuPenyelesaianJam = totalTugasSelesai > 0 ? (totalWaktuPenyelesaianMillis / totalTugasSelesai / 3600000) : 0;

                    return {
                        jabatanId: j.id, 
                        namaJabatan: j.namaJabatan, 
                        namaPejabat: userMap.get(j.id) || "-",
                        totalTugasSelesai, 
                        tugasSelesaiTepatWaktu,
                        rataRataWaktuPenyelesaianTugas: rataRataWaktuPenyelesaianJam,
                        totalDisposisiDiterima: dailyDisposisi.filter(d => d.kepadaJabatanId.includes(j.id)).length,
                    };
                });

                const docId = `${yesterdayStr}_${opd.id}`;
                const reportRef = db.collection("kinerjaAgregat").doc(docId);

                batch.set(reportRef, {
                    tanggal: admin.firestore.Timestamp.fromDate(startOfDay), // Timestamp hari kemarin 00:00
                    opdId: opd.id,
                    totalSuratMasuk: suratInOpd.length,      // HANYA surat hari ini
                    totalDisposisi: disposisiInOpd.length,   // HANYA disposisi hari ini
                    totalTugas: tugasDibuatInOpd.length,     // HANYA tugas dibuat hari ini
                    rataRataWaktuResponsDisposisi: rataRataWaktuResponsJam,
                    persentasePenyelesaianTepatWaktu: persentasePenyelesaianTepatWaktu,
                    tingkatRevisiDisposisi: tingkatRevisiDisposisi,
                    // Beban kerja snapshot sebaiknya dihitung terpisah atau diambil dari `calculateActiveUsers` jika ingin ringan.
                    // Disini kita kirim array kosong agar tidak error di frontend, atau hitung jika resource server kuat.
                    // Kita gunakan [] untuk sementara agar fokus ke perbaikan angka 'Volume'.
                    bebanKerjaPerJabatan: [], 
                    kinerjaPerJabatan,
                });
            }

            await batch.commit();
            logger.log(`Successfully generated DAILY stats for ${allOpds.length} OPDs on ${yesterdayStr}.`);
        } catch (error) {
            logger.error("Error generating daily performance stats:", error);
        }
    }
);


// --- [MODIFIKASI BILLING (TAHAP 1 & FASE 4)] ---
// FUNGSI: Menghitung pengguna aktif per OPD setiap hari DAN MENEGAKKAN ATURAN.
// =================================================================================================
export const calculateActiveUsers = onSchedule(
    {
        // Berjalan setiap 24 jam (pukul 03:00)
        schedule: "0 3 * * *",
        region: REGION,
        timeZone: "Asia/Jakarta",
    },
    async (event) => {
        logger.log("Running scheduled function to calculate active users and check subscriptions...");
        try {
            // 1. Ambil semua dokumen opdConfigs
            const opdConfigsSnapshot = await db.collection("opdConfigs").get();
            if (opdConfigsSnapshot.empty) {
                logger.log("No opdConfigs found. Skipping user count.");
                return;
            }

            const opdIds = opdConfigsSnapshot.docs.map(doc => doc.id);
            const batch = db.batch();
            let totalProcessed = 0;
            const now = admin.firestore.Timestamp.now();

            // 2. Loop setiap OPD
            for (const opdId of opdIds) {
                // 3. Hitung jumlah pengguna berstatus 'aktif' untuk OPD tersebut
                const usersQuery = db.collection("users")
                    .where("opdId", "==", opdId)
                    .where("status", "==", "aktif");
                
                const usersSnapshot = await usersQuery.get();
                const activeUserCount = usersSnapshot.size;

                // 4. Update field 'penggunaAktifSaatIni' di opdConfigs
                const configRef = db.collection("opdConfigs").doc(opdId);
                
                // Ambil data config dari snapshot yang sudah diambil
                const configDoc = opdConfigsSnapshot.docs.find(d => d.id === opdId);
                if (!configDoc) {
                    logger.warn(`Config doc not found for opdId ${opdId} during active user count. Skipping.`);
                    continue;
                }
                
                const configData = configDoc.data() as OpdConfig;
                
                let updatePayload: { [key: string]: any } = {
                    penggunaAktifSaatIni: activeUserCount
                };

                // --- [LOGIKA FASE 4] Penegakan Aturan Langganan ---
                if (configData.langgananAktifHingga.toMillis() < now.toMillis()) {
                    // Langganan kedaluwarsa!
                    if (configData.paymentStatus !== "Kedaluwarsa") {
                        updatePayload = {
                            ...updatePayload,
                            paymentStatus: "Kedaluwarsa",
                            kuotaPengguna: 0, // Set kuota ke 0
                        };
                        logger.log(`Subscription for OPD ${opdId} has EXPIRED. Setting kuota to 0 and status to 'Kedaluwarsa'.`);
                    } else {
                        // Jika sudah kedaluwarsa, pastikan kuota tetap 0
                         updatePayload = {
                            ...updatePayload,
                            kuotaPengguna: 0,
                        };
                         logger.log(`Subscription for OPD ${opdId} remains EXPIRED. Ensuring kuota is 0.`);
                    }
                }
                // --- [AKHIR LOGIKA FASE 4] ---

                batch.update(configRef, updatePayload);
                
                logger.log(`OPD ${opdId} has ${activeUserCount} active users. Status: ${updatePayload.paymentStatus || configData.paymentStatus || 'N/A'}`);
                totalProcessed++;
            }

            // 5. Commit batch update
            await batch.commit();
            logger.log(`Successfully updated active user count and subscription status for ${totalProcessed} OPDs.`);

        } catch (error) {
            logger.error("Error calculating active users:", error);
        }
    }
);
// --- [AKHIR MODIFIKASI BILLING] ---


// --- [MODIFIKASI BILLING (FASE 2)] ---
// FUNGSI BARU: Membuat tagihan bulanan otomatis.
// =================================================================================================
export const generateMonthlyInvoices = onSchedule(
    {
        // Berjalan jam 00:00 Waktu Server (UTC) pada tanggal 1 setiap bulan.
        // Sesuaikan jika server Anda tidak di UTC atau jika Anda ingin waktu Asia/Jakarta.
        // "0 0 1 * *" = Jam 00:00 UTC, Tanggal 1.
        // "0 17 1 * *" = Jam 17:00 UTC (00:00 WIB), Tanggal 1. -> Kita pakai ini.
        schedule: "0 17 1 * *",
        region: REGION,
        timeZone: "UTC", // Atur ke UTC agar jadwalnya pasti
    },
    async (event) => {
        // Fungsi ini akan berjalan sekitar jam 00:00 WIB tanggal 1.
        // Kita akan membuat tagihan untuk bulan SEBELUMNYA.
        const now = new Date();
        // Set ke hari terakhir bulan lalu
        const reportDate = new Date(now.getFullYear(), now.getMonth(), 0); 
        const billingMonth = reportDate.getMonth() + 1; // 1-12
        const billingYear = reportDate.getFullYear();

        logger.log(`Running monthly invoice generation for period: ${billingMonth}-${billingYear}...`);
        
        try {
            // 1. Ambil semua Konfigurasi OPD dan Paket Harga
            const [opdConfigsSnapshot, pricingSnapshot] = await Promise.all([
                db.collection("opdConfigs").get(),
                db.collection("pricingPackages").get(),
            ]);

            if (opdConfigsSnapshot.empty) {
                logger.log("No OpdConfig found. Skipping invoice generation.");
                return;
            }
            
            // 2. Buat Peta Harga
            const pricingMap = new Map<string, PricingPackage>();
            pricingSnapshot.forEach(doc => {
                pricingMap.set(doc.id, doc.data() as PricingPackage);
            });

            const batch = db.batch();
            let invoicesCreated = 0;
            const allOpds = await db.collection("opd").get();
            const opdNameMap = new Map<string, string>();
            allOpds.forEach(doc => {
                opdNameMap.set(doc.id, (doc.data() as OPD).namaOpd || doc.id);
            });

            // 3. Loop setiap OPD Config
            for (const configDoc of opdConfigsSnapshot.docs) {
                const opdId = configDoc.id;
                const configData = configDoc.data() as OpdConfig;

                // Jangan tagih jika tidak ada pengguna aktif
                if (configData.penggunaAktifSaatIni <= 0) {
                    logger.log(`OPD ${opdId} has 0 active users. Skipping invoice.`);
                    continue;
                }

                // Jangan tagih jika paket 'Custom' (mungkin gratis atau negosiasi manual)
                if (configData.packageName === 'Custom') {
                     logger.log(`OPD ${opdId} is on a 'Custom' plan. Skipping automatic invoice.`);
                     continue;
                }

                const packageName = configData.packageName || "Dasar";
                const pricingPackage = pricingMap.get(packageName);

                if (!pricingPackage) {
                    logger.warn(`Pricing package "${packageName}" for OPD ${opdId} not found. Skipping.`);
                    continue;
                }

                // 4. Kalkulasi Tagihan
                const hargaPerPengguna = pricingPackage.hargaPerPenggunaPerBulan || 0;
                // Kita gunakan penggunaAktifSaatIni yang dihitung oleh fungsi 'calculateActiveUsers'
                const jumlahPengguna = configData.penggunaAktifSaatIni; 
                const totalTagihan = jumlahPengguna * hargaPerPengguna;

                if (totalTagihan <= 0) {
                     logger.log(`OPD ${opdId} has 0 total bill. Skipping invoice.`);
                     continue;
                }

                const namaOpd = opdNameMap.get(opdId) || opdId;

                // 5. Buat dokumen tagihan baru
                const invoiceRef = db.collection("tagihan").doc(); // ID otomatis
                const newTagihan: Tagihan = {
                    opdId: opdId,
                    namaOpd: namaOpd,
                    bulanTagihan: billingMonth,
                    tahunTagihan: billingYear,
                    packageName: packageName,
                    jumlahPenggunaAktif: jumlahPengguna,
                    hargaPerPengguna: hargaPerPengguna,
                    totalTagihan: totalTagihan,
                    status: "Belum Dibayar",
                    tanggalDibuat: admin.firestore.Timestamp.now(),
                    tanggalDibayar: null,
                };
                
                batch.set(invoiceRef, newTagihan);
                invoicesCreated++;
                logger.log(`Invoice created for OPD ${opdId}: ${jumlahPengguna} users * Rp${hargaPerPengguna} = Rp${totalTagihan}`);
            }

            // 6. Commit batch
            await batch.commit();
            logger.log(`Successfully created ${invoicesCreated} new invoices for ${billingMonth}-${billingYear}.`);

        } catch (error) {
            logger.error("Error generating monthly invoices:", error);
        }
    }
);
// --- [AKHIR MODIFIKASI BILLING] ---


// --- [PENAMBAHAN FITUR] FUNGSI ANALITIKA KINERJA PENGGUNA (SUPER ADMIN) ---
// =================================================================================================
/**
 * Fungsi terjadwal untuk mengagregasi data kinerja per pengguna harian.
 * Sesuai dengan `analitika_superadmin_plan.md` Poin 5.
 * Berjalan setiap hari pukul 4 pagi.
 */
export const aggregateKinerjaPenggunaHarian = onSchedule(
    {
        schedule: "0 4 * * *", // Jam 4 pagi
        region: REGION,
        timeZone: "Asia/Jakarta",
        memory: "1GiB", // Alokasikan memori lebih
        timeoutSeconds: 540,
    },
    async (event) => {
        logger.log("Starting daily user performance aggregation (Super Admin)...");

        // Tentukan rentang waktu: HARI KEMARIN (00:00:00 - 23:59:59)
        const now = new Date();
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endOfYesterday.setMilliseconds(-1); // 23:59:59.999 kemarin

        const startOfYesterday = new Date(endOfYesterday.getFullYear(), endOfYesterday.getMonth(), endOfYesterday.getDate());
        startOfYesterday.setHours(0, 0, 0, 0); // 00:00:00 kemarin

        const startTimestamp = admin.firestore.Timestamp.fromDate(startOfYesterday);
        const endTimestamp = admin.firestore.Timestamp.fromDate(endOfYesterday);
        const yesterdayStr = startOfYesterday.toISOString().split("T")[0];

        logger.log(`Aggregating data for period: ${yesterdayStr}`);

        try {
            // 1. Ambil semua data (minimalkan query N+1)
            const [
                usersSnap,
                tugasAktifSnap,
                tugasSelesaiSnap,
                disposisiDiterimaSnap,
                disposisiDikembalikanSnap,
            ] = await Promise.all([
                db.collection("users").where("status", "==", "aktif").get(),
                db.collection("tugas").where("status", "!=", "Selesai").get(),
                db.collection("tugas")
                    .where("tanggalSelesai", ">=", startTimestamp)
                    .where("tanggalSelesai", "<=", endTimestamp).get(),
                db.collection("disposisi")
                    .where("tanggalDisposisi", ">=", startTimestamp)
                    .where("tanggalDisposisi", "<=", endTimestamp).get(),
                db.collection("disposisi")
                    .where("status", "==", "Dikembalikan")
                    .where("dikembalikanPada", ">=", startTimestamp)
                    .where("dikembalikanPada", "<=", endTimestamp).get(),
            ]);

            logger.log(`Fetched: ${usersSnap.size} users, ${tugasAktifSnap.size} active tasks, ${tugasSelesaiSnap.size} finished tasks, ${disposisiDiterimaSnap.size} disposisi, ${disposisiDikembalikanSnap.size} returned disposisi.`);

            // 2. Inisialisasi Peta Metrik
            const userMetrics = new Map<string, any>();
            usersSnap.forEach(doc => {
                const user = { nip: doc.id, ...doc.data() } as UserProfile;
                if (user.jabatanId) {
                    userMetrics.set(user.jabatanId, {
                        // Data dari user doc
                        userId: user.uid,
                        nip: user.nip,
                        jabatanId: user.jabatanId,
                        opdId: user.opdId,
                        // Data agregat (diinisialisasi 0)
                        tugasAktif: 0,
                        tugasSelesaiTepatWaktu: 0,
                        tugasSelesaiTerlambat: 0,
                        disposisiDiterima: 0,
                        disposisiDikembalikan: 0,
                    });
                }
            });

            // 3. Loop 1: Agregasi Tugas Aktif (Snapshot)
            tugasAktifSnap.forEach(doc => {
                const tugas = doc.data() as Tugas;
                const metric = userMetrics.get(tugas.kepadaJabatanId);
                if (metric) {
                    metric.tugasAktif++;
                }
            });

            // 4. Loop 2: Agregasi Tugas Selesai (Event Kemarin)
            tugasSelesaiSnap.forEach(doc => {
                const tugas = doc.data() as Tugas;
                const metric = userMetrics.get(tugas.kepadaJabatanId);
                if (metric) {
                    if (tugas.batasWaktu && tugas.tanggalSelesai && tugas.tanggalSelesai.toMillis() > tugas.batasWaktu.toMillis()) {
                        metric.tugasSelesaiTerlambat++;
                    } else {
                        metric.tugasSelesaiTepatWaktu++;
                    }
                }
            });

            // 5. Loop 3: Agregasi Disposisi Diterima (Event Kemarin)
            disposisiDiterimaSnap.forEach(doc => {
                const disposisi = doc.data() as Disposisi;
                for (const jabatanId of disposisi.kepadaJabatanId) {
                    const metric = userMetrics.get(jabatanId);
                    if (metric) {
                        metric.disposisiDiterima++;
                    }
                }
            });

            // 6. Loop 4: Agregasi Disposisi Dikembalikan (Event Kemarin)
            // (Diasumsikan `disposisiDikembalikan` adalah disposisi yang *dia* kembalikan)
            disposisiDikembalikanSnap.forEach(doc => {
                const disposisi = doc.data() as Disposisi;
                const metric = userMetrics.get(disposisi.dariJabatanId); // dariJabatanId = yang mengembalikan
                if (metric) {
                    metric.disposisiDikembalikan++;
                }
            });

            // 7. Simpan ke Batch
            const batch = db.batch();
            let processedCount = 0;
            for (const data of userMetrics.values()) {
                // Hanya simpan jika ada data (menghemat kuota tulis)
                const hasData = data.tugasAktif > 0 ||
                                data.tugasSelesaiTepatWaktu > 0 ||
                                data.tugasSelesaiTerlambat > 0 ||
                                data.disposisiDiterima > 0 ||
                                data.disposisiDikembalikan > 0;
                
                if (hasData) {
                    const docId = `${data.nip}_${yesterdayStr}`;
                    const docRef = db.collection("kinerjaPerPenggunaHarian").doc(docId);
                    
                    const payload: KinerjaPerPenggunaHarian = { // [MODIFIKASI] Tipe
                        tanggal: admin.firestore.Timestamp.fromDate(startOfYesterday),
                        userId: data.uid,
                        nip: data.nip,
                        jabatanId: data.jabatanId,
                        opdId: data.opdId,
                        tugasAktif: data.tugasAktif,
                        tugasSelesaiTepatWaktu: data.tugasSelesaiTepatWaktu,
                        tugasSelesaiTerlambat: data.tugasSelesaiTerlambat,
                        disposisiDiterima: data.disposisiDiterima,
                        disposisiDikembalikan: data.disposisiDikembalikan,
                    };
                    batch.set(docRef, payload);
                    processedCount++;
                }
            }

            await batch.commit();
            logger.log(`Successfully aggregated and saved daily performance for ${processedCount} users.`);

        } catch (error) {
            logger.error("Error running aggregateKinerjaPenggunaHarian:", error);
        }
    }
);
// --- [AKHIR PENAMBAHAN FITUR] ---


// [MODIFIKASI REKOMENDASI 2] Tambahkan fungsi baru di akhir file
export const periodicPendingCheck = onSchedule(
    {
        schedule: "every 2 hours from 8:00 to 16:00", // [WIB] 8:00, 10:00, 12:00, 14:00, 16:00
        region: REGION,
        timeZone: "Asia/Jakarta",
    },
    async (event) => {
        logger.log("Running periodic check for pending items (Disposisi & Tugas)...");

        try {
            // 1. Cek Disposisi Baru (disposisiBaru > 0)
            const disposisiQuery = await db.collection("userSummaries")
                .where("disposisiBaru", ">", 0)
                .get();

            if (!disposisiQuery.empty) {
                logger.log(`Found ${disposisiQuery.size} users with new disposisi.`);
                for (const doc of disposisiQuery.docs) {
                    const uid = doc.id;
                    const count = doc.data().disposisiBaru;
                    await sendFcmMessageByUid(
                        uid,
                        "⏰ Disposisi Menunggu",
                        `Anda memiliki ${count} disposisi baru yang belum diterima. Segera periksa di Ruang Kerja Anda.`,
                        "/dashboard/ruang-kerja",
                        "pending-disposisi"
                    );
                }
            }

            // 2. Cek Tugas Baru (tugasBaruCount > 0)
            const tugasQuery = await db.collection("userSummaries")
                .where("tugasBaruCount", ">", 0)
                .get();
            
            if (!tugasQuery.empty) {
                 logger.log(`Found ${tugasQuery.size} users with new tasks.`);
                for (const doc of tugasQuery.docs) {
                    const uid = doc.id;
                    const count = doc.data().tugasBaruCount;
                    await sendFcmMessageByUid(
                        uid,
                        "📋 Tugas Baru Menunggu",
                        `Anda memiliki ${count} tugas baru yang belum dikerjakan. Segera periksa di menu Tugas Saya.`,
                        "/dashboard/tugas",
                        "pending-tugas"
                    );
                }
            }

            logger.log("Periodic pending check finished.");

        } catch (error) {
            logger.error("Error running periodicPendingCheck:", error);
        }
    }
);