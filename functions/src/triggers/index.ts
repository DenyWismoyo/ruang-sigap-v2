import { onDocumentCreated, onDocumentUpdated, onDocumentWritten, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { isEqual } from "lodash";
import { db, storage, REGION } from "../config/firebase";

const DB_TARGET = process.env.FIRESTORE_DATABASE || "database-siyap";

export * from "./doubleWrite";
export * from "./logbookTriggers";

import { 
  getUserNameFromJabatanId, getUserNameFromUid, 
  generateSearchKeywords, createRfc3339DateTimeWIB, createCalendarEvent, 
  getUserIdFromJabatanId, updateUserSummary 
} from "../utils/helpers";
import { 
  UserProfile, Jabatan, Surat, Disposisi, Tugas, 
  DrafPersetujuan, Pengumuman, Notification, JadwalTempat 
} from "../types";

export const onDisposisiSummaryUpdate = onDocumentWritten(
    {document: "disposisi/{disposisiId}", region: REGION, database: DB_TARGET},
    async (event) => {
      const beforeData = event.data?.before.data() as Disposisi | undefined;
      const afterData = event.data?.after.data() as Disposisi | undefined;

      // Kasus 1: Disposisi BARU dibuat
      if (!beforeData && afterData) {
        for (const jabatanId of afterData.kepadaJabatanId) {
          const userId = await getUserIdFromJabatanId(jabatanId);
          if (userId) {
            logger.log(`Incrementing disposisiBaru for user ${userId} (Jabatan ${jabatanId})`);
            // (Logika increment notif dipindah ke onDisposisiCreate)
            // await updateUserSummary(userId, "disposisiBaru", 1);
          }
        }
        return;
      }

      // Kasus 2: Disposisi DIUPDATE (misal: diterima)
      if (beforeData && afterData) {
        const beforePenerima = beforeData.penerimaDiterima || [];
        const afterPenerima = afterData.penerimaDiterima || [];
        const newPenerimaIds = afterPenerima.filter((id: string) => !beforePenerima.includes(id));

        for (const jabatanId of newPenerimaIds) {
          const userId = await getUserIdFromJabatanId(jabatanId);
          if (userId) {
            logger.log(`Decrementing disposisiBaru for user ${userId} (Jabatan ${jabatanId})`);
            await updateUserSummary(userId, "disposisiBaru", -1);
            // [MODIFIKASI REKOMENDASI 2]
            // Dekremen notifikasi surat utama juga saat disposisi diterima
            await updateUserSummary(userId, "suratBaruCount", -1);

            if (jabatanId !== afterData.dariJabatanId) {
                const suratDoc = await db.collection("surat").doc(afterData.suratId).get();
                if (suratDoc.exists) {
                  const suratData = suratDoc.data() as Surat;
                  if (suratData.statusPenyelesaian !== "Selesai" && suratData.statusPenyelesaian !== "Diarsipkan") {
                    await updateUserSummary(userId, "tindakLanjutMenunggu", 1);
                  } else {
                     logger.log(`Surat ${afterData.suratId} is already finished. Not incrementing tindakLanjutMenunggu for user ${userId}.`);
                  }
                } else {
                    logger.warn(`Surat ${afterData.suratId} not found when checking status for tindakLanjutMenunggu.`);
                }
            } else {
                logger.log(`User ${userId} (Jabatan ${jabatanId}) received self-disposition. Not incrementing tindakLanjutMenunggu.`);
            }
          }
        }
      }

      // Kasus 3: Disposisi DIHAPUS
      if (beforeData && !afterData) {
        const penerimaDiterima = beforeData.penerimaDiterima || [];
        for (const jabatanId of beforeData.kepadaJabatanId) {
          const userId = await getUserIdFromJabatanId(jabatanId);
          if (userId) {
            if (!penerimaDiterima.includes(jabatanId)) {
              logger.log(`Decrementing disposisiBaru for user ${userId} (Jabatan ${jabatanId}) due to deletion`);
              await updateUserSummary(userId, "disposisiBaru", -1);
              // [MODIFIKASI REKOMENDASI 2]
              await updateUserSummary(userId, "suratBaruCount", -1);
            } else {
               const suratDoc = await db.collection("surat").doc(beforeData.suratId).get();
               if (suratDoc.exists) {
                 const suratData = suratDoc.data() as Surat;
                 if (jabatanId !== beforeData.dariJabatanId && suratData.statusPenyelesaian !== "Selesai" && suratData.statusPenyelesaian !== "Diarsipkan") {
                   logger.log(`Decrementing tindakLanjutMenunggu for user ${userId} (Jabatan ${jabatanId}) due to deletion`);
                   await updateUserSummary(userId, "tindakLanjutMenunggu", -1);
                 }
               }
            }
          }
        }
      }
    });
export const onSuratSummaryUpdate = onDocumentUpdated(
    {document: "surat/{suratId}", region: REGION, database: DB_TARGET},
    async (event) => {
      const beforeData = event.data?.before.data() as Surat;
      const afterData = event.data?.after.data() as Surat;
      const suratId = event.params.suratId;

      const isNowFinished = afterData.statusPenyelesaian === "Selesai" || afterData.statusPenyelesaian === "Diarsipkan";
      const wasPreviouslyActive = beforeData.statusPenyelesaian !== "Selesai" && beforeData.statusPenyelesaian !== "Diarsipkan";

      if (wasPreviouslyActive && isNowFinished) {
        logger.log(`Surat ${suratId} status changed to finished. Decrementing tindakLanjutMenunggu for involved users.`);
        const disposisiSnapshot = await db.collection("disposisi").where("suratId", "==", suratId).get();
        if (disposisiSnapshot.empty) {
          logger.log(`No disposisi found for finished surat ${suratId}. No counters to decrement.`);
          // [MODIFIKASI REKOMENDASI 2] Tetap jalankan cek pimpinan
        }

        const allRecipientJabatanIds = new Set<string>();
        const senderIds = new Set<string>();
        disposisiSnapshot.forEach((doc) => {
          const disposisi = doc.data() as Disposisi;
          senderIds.add(disposisi.dariJabatanId);
          (disposisi.penerimaDiterima || []).forEach((jabatanId: string) => allRecipientJabatanIds.add(jabatanId));
        });

        let decrementedCount = 0;
        if (allRecipientJabatanIds.size > 0) {
          for (const jabatanId of Array.from(allRecipientJabatanIds)) {
              const disposisiWhereRecipientIsSender = disposisiSnapshot.docs.find(doc => {
                  const d = doc.data() as Disposisi;
                  return d.dariJabatanId === jabatanId && d.kepadaJabatanId.includes(jabatanId);
              });

              if (disposisiWhereRecipientIsSender) {
                  logger.log(`Skipping tindakLanjutMenunggu decrement for self-disposition recipient ${jabatanId} on finished surat ${suratId}.`);
                  continue;
              }

              const userId = await getUserIdFromJabatanId(jabatanId);
              if (userId) {
                  await updateUserSummary(userId, "tindakLanjutMenunggu", -1);
                  decrementedCount++;
              }
          }
        } else {
           logger.log(`No acknowledged recipients found for finished surat ${suratId}.`);
        }
        
        // [MODIFIKASI REKOMENDASI 2]
        // Jika surat diarsipkan/selesai, kita juga harus mengurangi
        // 'suratMenungguDisposisi' dan 'suratBaruCount' dari Pimpinan/TU.
        const opdId = afterData.opdId;
        const jabatansQuery = await db.collection("jabatan")
            .where("opdId", "==", opdId)
            .where("status", "==", "aktif")
            .get();
        
        const jabatans = jabatansQuery.docs.map(doc => doc.data() as Jabatan);
        // [FIX] Cek jika jabatans kosong untuk menghindari error Math.min
        if (jabatans.length === 0) {
            logger.warn(`No active jabatans found for OPD ${opdId}. Cannot decrement leader summaries.`);
            return;
        }
        const minLevel = Math.min(...jabatans.map(j => j.level));
        const topLevelJabatanIds = jabatans.filter(j => j.level === minLevel).map(j => j.id);

        const usersQuery = await db.collection("users")
            .where("opdId", "==", opdId)
            .where("status", "==", "aktif")
            .where("role", "in", ["staf_tu", "admin_opd"])
            .get();
        
        const userIdsToDecrement = usersQuery.docs.map(d => d.data().uid);
        
        if (topLevelJabatanIds.length > 0) {
            const topLevelUsersQuery = await db.collection("users")
                .where("jabatanId", "in", topLevelJabatanIds)
                .where("status", "==", "aktif")
                .get();
                
            topLevelUsersQuery.forEach(d => {
                if (!userIdsToDecrement.includes(d.data().uid)) {
                    userIdsToDecrement.push(d.data().uid);
                }
            });
        }

        for (const userId of userIdsToDecrement) {
            await updateUserSummary(userId, "suratMenungguDisposisi", -1);
            await updateUserSummary(userId, "suratBaruCount", -1);
        }
        // [AKHIR MODIFIKASI]

        logger.log(`Decremented tindakLanjutMenunggu for ${decrementedCount} users related to finished surat ${suratId}.`);
      }
    });

/**
 * [MODIFIKASI FASE 1] Terpicu saat dokumen tugas berubah.
 * Menambahkan denormalisasi nama.
 */
export const onTugasWritten = onDocumentWritten(
    { document: "tugas/{tugasId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const tugasId = event.params.tugasId;
        const beforeData = event.data?.before.data() as Tugas | undefined;
        const afterData = event.data?.after.data() as Tugas | undefined;

        // --- [MODIFIKASI FASE 1] DENORMALISASI NAMA ---
        if (afterData) { // Hanya jalankan untuk Create atau Update
            const [dariNama, kepadaNama] = await Promise.all([
                getUserNameFromJabatanId(afterData.dariJabatanId),
                getUserNameFromJabatanId(afterData.kepadaJabatanId),
            ]);

            const needsNameUpdate = (
                afterData.dariJabatanNama !== dariNama ||
                afterData.kepadaJabatanNama !== kepadaNama
            );

            if (needsNameUpdate) {
                logger.log(`Denormalizing names for tugas ${tugasId}.`);
                await event.data!.after.ref.update({
                    dariJabatanNama: dariNama,
                    kepadaJabatanNama: kepadaNama,
                });
                // Kita return di sini agar listener ini dipicu lagi,
                // dan baru menjalankan logika summary/fan-out di putaran kedua.
                // Ini memastikan data yang di-fan-out adalah data yang sudah denormalisasi.
                return;
            }
        }
        // --- [AKHIR MODIFIKASI FASE 1] ---

        // --- [MODIFIKASI REKOMENDASI 2] Logika Update Summary untuk Tugas ---
        const getAssigneeUids = async (tugasData: Tugas): Promise<string[]> => {
            const allJabatanIds = [tugasData.kepadaJabatanId, ...(tugasData.collaboratorIds || [])];
            const uids: string[] = [];
            for (const jabatanId of allJabatanIds) {
                const uid = await getUserIdFromJabatanId(jabatanId);
                if (uid) uids.push(uid);
            }
            return [...new Set(uids)]; // Kembalikan UID unik
        };

        try {
            if (!beforeData && afterData) {
                // TUGAS BARU DIBUAT
                const assigneeUids = await getAssigneeUids(afterData);
                for (const uid of assigneeUids) {
                    await updateUserSummary(uid, "tugasAktif", 1);
                    if (afterData.status === "Baru") {
                        await updateUserSummary(uid, "tugasBaruCount", 1);
                    }
                }
            } else if (beforeData && afterData) {
                // TUGAS DIUPDATE
                const assigneeUids = await getAssigneeUids(afterData);
                const statusChanged = beforeData.status !== afterData.status;

                if (statusChanged) {
                    for (const uid of assigneeUids) {
                        // Selesai
                        if (beforeData.status !== "Selesai" && afterData.status === "Selesai") {
                            await updateUserSummary(uid, "tugasAktif", -1);
                            if (beforeData.status === "Baru") {
                                await updateUserSummary(uid, "tugasBaruCount", -1);
                            }
                        }
                        // Dibuka kembali
                        else if (beforeData.status === "Selesai" && afterData.status !== "Selesai") {
                            await updateUserSummary(uid, "tugasAktif", 1);
                            if (afterData.status === "Baru") {
                                await updateUserSummary(uid, "tugasBaruCount", 1);
                            }
                        }
                        // Dari Baru -> Dikerjakan (Count notif hilang)
                        else if (beforeData.status === "Baru" && afterData.status === "Dikerjakan") {
                             await updateUserSummary(uid, "tugasBaruCount", -1);
                        }
                    }
                }
            } else if (beforeData && !afterData) {
                // TUGAS DIHAPUS
                const assigneeUids = await getAssigneeUids(beforeData);
                for (const uid of assigneeUids) {
                    if (beforeData.status !== "Selesai") {
                         await updateUserSummary(uid, "tugasAktif", -1);
                    }
                    if (beforeData.status === "Baru") {
                        await updateUserSummary(uid, "tugasBaruCount", -1);
                    }
                }
            }
        } catch (summaryError) {
            logger.error(`Error updating user summaries for tugas ${tugasId}:`, summaryError);
        }
        // --- [AKHIR MODIFIKASI REKOMENDASI 2] ---

        // Logika Fan-out (setelah denormalisasi nama dan update summary)
        if (beforeData && afterData) {
            const beforeCoreData = {
                status: beforeData.status,
                judulTugas: beforeData.judulTugas,
                kepadaJabatanId: beforeData.kepadaJabatanId,
                collaboratorIds: beforeData.collaboratorIds || [],
                dariJabatanId: beforeData.dariJabatanId,
                batasWaktu: beforeData.batasWaktu,
                dariJabatanNama: beforeData.dariJabatanNama,
                kepadaJabatanNama: beforeData.kepadaJabatanNama,
            };
            const afterCoreData = {
                status: afterData.status,
                judulTugas: afterData.judulTugas,
                kepadaJabatanId: afterData.kepadaJabatanId,
                collaboratorIds: afterData.collaboratorIds || [],
                dariJabatanId: afterData.dariJabatanId,
                batasWaktu: afterData.batasWaktu,
                dariJabatanNama: afterData.dariJabatanNama,
                kepadaJabatanNama: afterData.kepadaJabatanNama,
            };

            if (isEqual(beforeCoreData, afterCoreData)) {
                logger.log(`Tugas ${tugasId} write detected, but core data is unchanged (e.g., only comments/attachments updated). Skipping fan-out.`);
                return;
            }
        }

        const beforeJabatanIds = beforeData ? [beforeData.dariJabatanId, beforeData.kepadaJabatanId, ...(beforeData.collaboratorIds || [])] : [];
        const afterJabatanIds = afterData ? [afterData.dariJabatanId, afterData.kepadaJabatanId, ...(afterData.collaboratorIds || [])] : [];
        const allInvolvedJabatanIds = [...new Set([...beforeJabatanIds, ...afterJabatanIds])];

        if (allInvolvedJabatanIds.length === 0) {
            logger.log(`No relevant jabatan found for tugas ${tugasId}.`);
            return;
        }

        try {
            const usersQuery = await db.collection("users")
                                     .where("jabatanId", "in", allInvolvedJabatanIds)
                                     .where("status", "==", "aktif")
                                     .get();
            if (usersQuery.empty) {
                logger.warn(`No active users found for the jabatanIds involved in tugas ${tugasId}.`);
                return;
            }

            const batch = db.batch();

            usersQuery.docs.forEach(userDoc => {
                const user = userDoc.data() as UserProfile;
                const tugasPerPenggunaRef = db.collection("tugasPerPengguna").doc(user.uid).collection("tugas").doc(tugasId);

                if (!afterData || !afterJabatanIds.includes(user.jabatanId)) {
                    batch.delete(tugasPerPenggunaRef);
                } else {
                    batch.set(tugasPerPenggunaRef, afterData);
                }
            });

            await batch.commit();
            logger.log(`Tugas ${tugasId} has been successfully synchronized for ${usersQuery.size} relevant active users.`);
        } catch (error) {
            logger.error(`Error in onTugasWritten for tugas ${tugasId}:`, error);
        }
    }
);

// =================================================================================================
// --- [FUNGSI BARU] PENGELOLAAN ALUR PERSETUJUAN DRAF ---
// =================================================================================================
export const onDrafPersetujuanWrite = onDocumentWritten(
    { document: "drafPersetujuan/{drafId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const drafId = event.params.drafId;
        const beforeData = event.data?.before.data() as DrafPersetujuan | undefined;
        const afterData = event.data?.after.data() as DrafPersetujuan | undefined;

        if (!afterData) {
            logger.log(`Draf persetujuan ${drafId} dihapus. Tidak ada aksi.`);
            return;
        }

        if (!beforeData && !afterData.pembuatNama) {
            const pembuatNama = await getUserNameFromUid(afterData.createdBy);
            if (pembuatNama) {
                await event.data!.after.ref.update({
                    pembuatNama: pembuatNama,
                });
                logger.log(`Added pembuatNama to draf ${drafId}.`);
                return;
            }
        }

        let currentPenerimaJabatanId: string | null = null;
        if (afterData.status === "Proses Review" && afterData.currentStep < afterData.approvalChain.length) {
            currentPenerimaJabatanId = afterData.approvalChain[afterData.currentStep].jabatanId;
        } else if (afterData.status === "Revisi") {
            currentPenerimaJabatanId = null;
        }

        // [MODIFIKASI] Pastikan approvalJabatanIds di-update jika berubah
        const newApprovalJabatanIds = afterData.approvalChain.map(step => step.jabatanId);
        const needsUpdate = (
            afterData.penerimaTugasJabatanId !== currentPenerimaJabatanId ||
            !isEqual(afterData.approvalJabatanIds, newApprovalJabatanIds)
        );

        if (needsUpdate) {
            await event.data?.after.ref.update({
                penerimaTugasJabatanId: currentPenerimaJabatanId,
                approvalJabatanIds: newApprovalJabatanIds,
            });
            logger.log(`Updated penerimaTugasJabatanId/approvalJabatanIds untuk draf ${drafId}.`);
        }
        // [AKHIR MODIFIKASI]

        const beforePenerima = beforeData?.penerimaTugasJabatanId;
        const afterPenerima = currentPenerimaJabatanId;
        
        let sendNotificationTo: string | null = null; // Ini adalah JABATAN ID
        let notificationMessage = "";

        if (afterData.status === "Proses Review" && afterPenerima && afterPenerima !== beforePenerima) {
            sendNotificationTo = afterPenerima;
            notificationMessage = `Anda memiliki draf dokumen baru ("${afterData.judul}") yang memerlukan persetujuan.`;
            logger.log(`Draf ${drafId} diteruskan ke ${afterPenerima}. Menyiapkan notifikasi.`);
        } else if (afterData.status === "Revisi" && beforeData?.status !== "Revisi") {
            const pembuatUid = afterData.createdBy;
            const userPembuatSnap = await db.collection("users").where("uid", "==", pembuatUid).limit(1).get();
            if (!userPembuatSnap.empty) {
                const userPembuat = userPembuatSnap.docs[0].data() as UserProfile;
                sendNotificationTo = userPembuat.jabatanId;
                notificationMessage = `Draf Anda ("${afterData.judul}") dikembalikan untuk revisi.`;
                logger.log(`Draf ${drafId} dikembalikan ke pembuat (UID: ${pembuatUid}). Menyiapkan notifikasi.`);
            }
        } else if (afterData.status === "Selesai" && beforeData?.status !== "Selesai") {
            const pembuatUid = afterData.createdBy;
            const userPembuatSnap = await db.collection("users").where("uid", "==", pembuatUid).limit(1).get();
            if (!userPembuatSnap.empty) {
                const userPembuat = userPembuatSnap.docs[0].data() as UserProfile;
                sendNotificationTo = userPembuat.jabatanId;
                notificationMessage = `Selamat! Draf Anda ("${afterData.judul}") telah disetujui sepenuhnya.`;
                logger.log(`Draf ${drafId} selesai. Memberi notifikasi ke pembuat (UID: ${pembuatUid}).`);
            }
        }

        if (sendNotificationTo && notificationMessage) {
            const userId = await getUserIdFromJabatanId(sendNotificationTo);
            if (userId) {
                const userDoc = await db.collection("users").where("uid", "==", userId).limit(1).get();
                if (!userDoc.empty) {
                    const userNip = userDoc.docs[0].id;
                    const notifRef = db.collection("notifications").doc();
                    await notifRef.set({
                        userId: userId,
                        userNip: userNip,
                        message: notificationMessage,
                        link: `/dashboard/persetujuan-draf/${drafId}`,
                        isRead: false,
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    logger.log(`Notifikasi untuk draf ${drafId} berhasil dikirim ke user ${userId}.`);
                } else {
                    logger.warn(`Tidak ditemukan user (berdasarkan UID ${userId}) saat mengirim notifikasi draf.`);
                }
            } else {
                logger.warn(`Tidak ditemukan user untuk jabatanId ${sendNotificationTo} saat mengirim notifikasi draf.`);
            }
        }
    }
);


// =================================================================================================
// --- FUNGSI CLOUD FUNCTIONS LAINNYA ---
// =================================================================================================
export const onNotificationCreated = onDocumentCreated(
    { document: "notifications/{notificationId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const snap = event.data;
        if (!snap) {
            logger.error("No data for onNotificationCreated event:", event);
            return;
        }
        const notificationData = snap.data() as Notification; // [MODIFIKASI] Tipe
        const { userId, userNip, message, link } = notificationData;
        logger.log(`New notification for user ${userId} (NIP: ${userNip}). Sending push...`);
        if (!userNip) {
            logger.error(`Notification ${event.params.notificationId} is missing 'userNip'. Aborting.`);
            return;
        }
        try {
            const userDocSnap = await db.collection("users").doc(userNip).get();
            if (!userDocSnap.exists) {
                 logger.warn(`User document not found for NIP ${userNip} (UID ${userId}). Cannot get FCM tokens.`);
                 return;
            }
            const userDoc = userDocSnap.data() as UserProfile;
            if (userDoc.uid !== userId) {
                 logger.error(`UID mismatch for NIP ${userNip}. Expected ${userId} but got ${userDoc.uid}. Aborting push.`);
                 return;
            }
            const tokens = userDoc.fcmTokens;
            if (!tokens || tokens.length === 0) {
                logger.log(`User ${userId} has no FCM tokens. Skipping push notification.`);
                return;
            }

            // --- [MODIFIKASI] PREFERENSI NOTIFIKASI PENGGUNA ---
            const prefs = userDoc.notificationPreferences;
            if (prefs) {
                let shouldPush = true;
                const linkLower = link.toLowerCase();
                if (linkLower.includes("/surat") && prefs.pushSuratMasuk === false) shouldPush = false;
                else if (linkLower.includes("/disposisi") && prefs.pushDisposisi === false) shouldPush = false;
                else if (linkLower.includes("/tugas") && prefs.pushTugas === false) shouldPush = false;
                
                if (!shouldPush) {
                    logger.log(`User ${userId} has disabled push for this category (${link}). Skipping FCM.`);
                    return;
                }
            }
            // --- [AKHIR MODIFIKASI] ---
            
            // --- [MODIFIKASI PWA BADGE] Ambil hitungan notifikasi dari userSummaries ---
            let totalCount = 0;
            try {
                // Ambil dokumen summary berdasarkan jabatanId pengguna
                const summaryRef = db.collection("userSummaries").doc(userDoc.jabatanId);
                const summarySnap = await summaryRef.get();
                if (summarySnap.exists) {
                    const summaryData = summarySnap.data() as { suratBaruCount?: number, tugasBaruCount?: number };
                    // Jumlahkan count surat baru dan tugas baru
                    totalCount = (summaryData.suratBaruCount || 0) + (summaryData.tugasBaruCount || 0);
                }
            } catch (summaryError) {
                logger.error(`Gagal membaca userSummaries for badge count for user ${userId}:`, summaryError);
            }
            logger.log(`Total badge count for user ${userId} is ${totalCount}.`);
            // --- [AKHIR MODIFIKASI] ---

            // --- [MODIFIKASI BATCH 3] Logika Menentukan Tag Grouping ---
            let tag = 'sigap-default'; // Tag default
            const messageLower = message.toLowerCase();
            
            if (messageLower.includes('disposisi') || messageLower.includes('pemberitahuan') || messageLower.includes('dikembalikan')) {
                tag = 'disposisi';
            } else if (messageLower.includes('tugas baru')) {
                tag = 'tugas';
            } else if (messageLower.includes('surat baru')) {
                tag = 'surat-baru';
            } else if (messageLower.includes('draf dokumen')) {
                tag = 'draf';
            } else if (messageLower.includes('pengingat: undangan')) {
                tag = 'agenda';
            }
            logger.log(`Notification tag determined as: ${tag}`);
            // --- [AKHIR MODIFIKASI BATCH 3] ---

            const messagePayload: admin.messaging.MulticastMessage = {
                notification: {
                    title: "SIGAP: Notifikasi Baru",
                    body: message,
                },
                data: {
                    title: "SIGAP: Notifikasi Baru",
                    body: message,
                    icon: "/icon-192x192.png",
                    link: link || "/dashboard",
                    tag: tag, // [MODIFIKASI BATCH 3] Tambahkan tag ke payload
                    
                    // --- [MODIFIKASI PWA BADGE] Tambahkan totalCount ke payload ---
                    // Kirim sebagai string, ini praktik yang aman
                    totalCount: String(totalCount),
                },
                tokens: tokens,
            };

            const response = await admin.messaging().sendEachForMulticast(messagePayload);
            logger.log(`Push notification (data-only) attempt results for user ${userId}: ${response.successCount} success, ${response.failureCount} failure.`);
            
            if (response.failureCount > 0) {
                const tokensToRemove: string[] = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        const error = resp.error;
                        if (error) {
                            logger.error(`Failure sending notification to token ${tokens[idx]}:`, error.code, error.message);
                             if (
                                error.code === "messaging/invalid-registration-token" ||
                                error.code === "messaging/registration-token-not-registered"
                            ) {
                                tokensToRemove.push(tokens[idx]);
                            }
                        }
                    }
                });
                if (tokensToRemove.length > 0) {
                    logger.log(`Cleaning up ${tokensToRemove.length} invalid tokens for user ${userId}.`);
                    const userRef = userDocSnap.ref;
                    try {
                        await userRef.update({
                            fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
                        });
                        logger.log(`Successfully removed invalid tokens for user ${userId}.`);
                    } catch (updateError) {
                        logger.error(`Error removing invalid tokens for user ${userId}:`, updateError);
                    }
                }
            }
        } catch (error) {
            logger.error(`Error sending push notification for user ${userId}:`, error);
        }
    }
);

// =================================================================================================
// --- [MODIFIKASI LINTAS OPD V2] onSuratCreate (Rencana 4.1) ---
// =================================================================================================
export const onSuratCreate = onDocumentCreated(
    { document: "surat/{suratId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const surat = snap.data() as Surat;
        const suratId = event.params.suratId;
        // [MODIFIKASI] Ambil field baru
        const { opdId, tujuanJabatanId } = surat; 

        try {
            const targetUids = new Set<string>();
            // [MODIFIKASI LINTAS OPD V2] Tambahkan set baru
            const targetJabatanIds = new Set<string>();

            // --- SKENARIO BARU: TU PUSAT MELAKUKAN TRIAGE (Rencana 4.1) ---
            if (tujuanJabatanId) {
                // Surat ini sudah dirutekan secara spesifik oleh TU
                logger.log(`[Triase] Surat ${suratId} dirutekan spesifik ke Jabatan: ${tujuanJabatanId}`);
                // Gunakan helper getUserIdFromJabatanId yang sudah ada
                const uid = await getUserIdFromJabatanId(tujuanJabatanId); 
                if (uid) {
                    targetUids.add(uid);
                    targetJabatanIds.add(tujuanJabatanId); // [MODIFIKASI LINTAS OPD V2] Simpan jabatanId
                } else {
                    logger.warn(`[Triase] Gagal menemukan UID untuk jabatan ${tujuanJabatanId}`);
                }
            } 
            // --- SKENARIO LAMA (PRODUKSI): KIRIM KE SEMUA PIMPINAN/TU (Rencana 4.1) ---
            else {
                // (Logika Anda saat ini untuk mengirim ke pimpinan/TU)
                logger.log(`[Default] Surat ${suratId} dikirim ke semua Pimpinan/TU di OPD: ${opdId}`);

                const jabatansQuery = await db.collection("jabatan")
                    .where("opdId", "==", opdId)
                    .where("status", "==", "aktif")
                    .get();
                
                if (jabatansQuery.empty) {
                   logger.warn(`[Default] No active jabatan found for OPD ${opdId}. Cannot determine top level.`);
                   return; 
                }
                
                const jabatans = jabatansQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as Jabatan));
                // Tentukan level terendah (pimpinan)
                const minLevel = Math.min(...jabatans.map(j => j.level));
                const topLevelJabatans = jabatans.filter(j => j.level === minLevel);
                
                const now = admin.firestore.Timestamp.now();
                // [MODIFIKASI LINTAS OPD V2] Ganti nama var
                const pimpinanTargetJabatanIds = new Set<string>(); // Jabatan pimpinan target

                for (const jabatan of topLevelJabatans) {
                   // Logika delegasi/plt yang sudah ada
                   if (jabatan.delegasiSementara && jabatan.delegasiSementara.berlakuHingga.toMillis() > now.toMillis()) {
                       pimpinanTargetJabatanIds.add(jabatan.delegasiSementara.delegatedToJabatanId);
                       logger.log(`[Default] Surat ${suratId} redirected to delegate ${jabatan.delegasiSementara.delegatedToJabatanId} from ${jabatan.id}`);
                   } else if (jabatan.pltUserId && jabatan.pltMulaiTanggal && jabatan.pltSelesaiTanggal &&
                              jabatan.pltMulaiTanggal.toMillis() <= now.toMillis() &&
                              jabatan.pltSelesaiTanggal.toMillis() >= now.toMillis()) {
                       pimpinanTargetJabatanIds.add(jabatan.id); 
                       logger.log(`[Default] Surat ${suratId} sent to jabatan ${jabatan.id} (handled by Plt ${jabatan.pltUserId})`);
                   } else {
                       pimpinanTargetJabatanIds.add(jabatan.id);
                       logger.log(`[Default] Surat ${suratId} sent to definitive jabatan ${jabatan.id}`);
                   }
                }

                // Cari UID untuk jabatan pimpinan DAN semua TU/Admin di OPD tersebut
                const usersQuery = await db.collection("users")
                    .where("opdId", "==", opdId)
                    .where("status", "==", "aktif")
                    .get();

                usersQuery.docs.forEach(doc => {
                    const user = doc.data() as UserProfile;
                    if (pimpinanTargetJabatanIds.has(user.jabatanId) || user.role === 'staf_tu' || user.role === 'admin_opd') {
                        targetUids.add(user.uid);
                        targetJabatanIds.add(user.jabatanId); // [MODIFIKASI LINTAS OPD V2] Simpan jabatanId
                    }
                });
            }

            // --- PROSES PENGIRIMAN (Umum untuk kedua skenario) ---
            if (targetUids.size === 0) {
                logger.warn(`Tidak ada target UID ditemukan untuk surat ${suratId}`);
                return;
            }
            
            const batch = db.batch();
            targetUids.forEach(uid => {
                const inboxRef = db.collection("suratPerPengguna").doc(uid).collection("inbox").doc(suratId);
                batch.set(inboxRef, surat);
                
                // Update summary untuk notifikasi badge (menggunakan helper yang ada)
                updateUserSummary(uid, "suratMenungguDisposisi", 1);
                updateUserSummary(uid, "suratBaruCount", 1);
            });

            await batch.commit();
            logger.log(`Surat ${suratId} berhasil dikirim ke ${targetUids.size} pengguna.`);
            
        } catch (error) {
            logger.error(`Error on onSuratCreate for surat ${suratId}:`, error);
        }
    }
);
// =================================================================================================
// --- [AKHIR MODIFIKASI LINTAS OPD V2] ---
// =================================================================================================


/**
 * [MODIFIKASI GCAL] Menambahkan sinkronisasi GCal saat disposisi dibuat.
 */
export const onDisposisiCreate = onDocumentCreated(
    { document: "disposisi/{disposisiId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const snap = event.data;
        if (!snap) {
            logger.error("No data for disposisi event:", event);
            return;
        }

        const disposisi = snap.data() as Disposisi;
        const { suratId, kepadaJabatanId, dariJabatanId } = disposisi;
        const disposisiId = event.params.disposisiId;

        logger.log(`Processing new disposisi ${disposisiId} for surat ${suratId} from ${dariJabatanId} to ${kepadaJabatanId.join(", ")}.`);

        try {
            const suratRef = db.collection("surat").doc(suratId);
            const suratDoc = await suratRef.get();
            if (!suratDoc.exists) {
                logger.error(`Surat ${suratId} not found for disposisi ${disposisiId}. Aborting.`);
                return;
            }
            const suratData = { id: suratDoc.id, ...suratDoc.data() } as Surat;

            const senderName = await getUserNameFromJabatanId(dariJabatanId);

            const batch = db.batch();
            
            // [MODIFIKASI LINTAS OPD V2] Dapatkan OPD ID dari disposisi,
            // fallback ke OPD ID surat jika disposisi lintas OPD (level 1-2)
            const disposisiOpdId = (await db.collection('jabatan').doc(dariJabatanId).get()).data()?.opdId || suratData.opdId;
            
            const disposisiRef = snap.ref;
            const disposisiData: Partial<Disposisi> = {
                ...disposisi,
                // [MODIFIKASI LINTAS OPD V2] Gunakan OPD ID disposisi
                opdId: disposisiOpdId, 
                dariJabatanNama: senderName,
            };
            batch.set(disposisiRef, disposisiData, { merge: true });
            logger.log(`Denormalized opdId (${disposisiOpdId}) and dariJabatanNama (${senderName}) to disposisi ${disposisiId}.`);


            const senderUid = await getUserIdFromJabatanId(dariJabatanId);
            if (senderUid) {
                const senderInboxRef = db.collection("suratPerPengguna").doc(senderUid).collection("inbox").doc(suratId);
                const senderDelegatedRef = db.collection("suratPerPengguna").doc(senderUid).collection("delegated").doc(suratId);
                batch.delete(senderInboxRef);
                batch.set(senderDelegatedRef, suratData);
                logger.log(`Moved surat ${suratId} from inbox to delegated for sender user ${senderUid}.`);

                // [MODIFIKASI REKOMENDASI 2]
                // Kurangi counter 'suratMenungguDisposisi' & 'suratBaruCount' dari pengirim
                await updateUserSummary(senderUid, "suratMenungguDisposisi", -1);
                // Kita juga kurangi notif surat baru, karena sudah ditindaklanjuti
                await updateUserSummary(senderUid, "suratBaruCount", -1);
                // [AKHIR MODIFIKASI]
            } else {
                logger.warn(`Sender UID not found for jabatanId ${dariJabatanId}. Cannot move surat from inbox.`);
            }

            const recipientUids: string[] = [];
            const recipientNips: string[] = [];
            
            for (const jabatanId of kepadaJabatanId) {
                const recipientUid = await getUserIdFromJabatanId(jabatanId);
                if (recipientUid) {
                    const recipientInboxRef = db.collection("suratPerPengguna").doc(recipientUid).collection("inbox").doc(suratId);
                    batch.set(recipientInboxRef, suratData);
                    recipientUids.push(recipientUid);
                    
                    const userSnap = await db.collection("users").where("uid", "==", recipientUid).limit(1).get();
                    if(!userSnap.empty) recipientNips.push(userSnap.docs[0].id);
                    
                    logger.log(`Added surat ${suratId} to inbox for recipient user ${recipientUid}.`);

                    // [MODIFIKASI REKOMENDASI 2]
                    // Tambah counter 'disposisiBaru' & 'suratBaruCount' untuk penerima
                    // (Fungsi onDisposisiSummaryUpdate akan menangani decrement saat diterima)
                    await updateUserSummary(recipientUid, "disposisiBaru", 1);
                    await updateUserSummary(recipientUid, "suratBaruCount", 1);
                    // [AKHIR MODIFIKASI]
                } else {
                    logger.warn(`Recipient UID not found for jabatanId ${jabatanId}. Cannot add to inbox.`);
                }
            }

            let nextStatus = "Didisposisikan";
            if (nextStatus !== suratData.statusPenyelesaian) {
                batch.update(suratRef, { statusPenyelesaian: nextStatus });
                logger.log(`Updated status for surat ${suratId} to ${nextStatus}.`);
            } else {
                logger.log(`Status for surat ${suratId} is already ${suratData.statusPenyelesaian}. No status update needed.`);
            }

            await batch.commit();
            logger.log(`Firestore batch commit successful for disposisi ${disposisiId}.`);

            for (let i = 0; i < recipientUids.length; i++) {
                const recipientUid = recipientUids[i];
                const recipientNip = recipientNips[i];
                
                if (!recipientNip) {
                    logger.warn(`Skipping notification/GCal for UID ${recipientUid} because NIP was not found.`);
                    continue;
                }

                const recipientUserDoc = await db.collection("users").doc(recipientNip).get();
                
                 if (recipientUserDoc.exists) {
                     const recipientProfile = recipientUserDoc.data() as UserProfile;
                     const notifRef = db.collection("notifications").doc();
                     await notifRef.set({
                          userId: recipientUid,
                          userNip: recipientNip,
                          message: `${disposisi.isInformational ? "Pemberitahuan" : "Disposisi"} baru dari ${senderName}: "${suratData.perihal}"`,
                          link: `/dashboard/surat/${suratId}`,
                          isRead: false,
                          timestamp: admin.firestore.FieldValue.serverTimestamp(),
                     });

                     // --- [MODIFIKASI GCAL] Panggil helper GCal ---
                     if (!disposisi.isInformational && recipientProfile.googleCalendarSyncEnabled) {
                        // Format event
                        let eventDetails;
                        const timeZone = "Asia/Jakarta";
                        const appUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sigap.web.app"; // Fallback URL

                        if (suratData.jenisSurat === "Undangan" && suratData.detailAgenda) {
                            let hours = 9, minutes = 0;
                            try { [hours, minutes] = suratData.detailAgenda.jam.split(":").map(Number); }
                            catch (e) { logger.warn(`Could not parse time "${suratData.detailAgenda.jam}". Defaulting to 9:00.`); }

                            const startDate = suratData.detailAgenda.tanggal.toDate();
                            startDate.setHours(hours, minutes);
                            // [MODIFIKASI GCAL] Gunakan helper baru, bukan .toISOString()
                            const startTime = createRfc3339DateTimeWIB(startDate);
                            
                            // [MODIFIKASI] Gunakan jamSelesai jika ada
                            let endTime: string;
                            if (suratData.detailAgenda.jamSelesai) {
                                try {
                                    const [endHours, endMinutes] = suratData.detailAgenda.jamSelesai.split(":").map(Number);
                                    const endDate = suratData.detailAgenda.tanggal.toDate();
                                    endDate.setHours(endHours, endMinutes);
                                    endTime = createRfc3339DateTimeWIB(endDate);
                                } catch (e) {
                                    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 jam
                                    endTime = createRfc3339DateTimeWIB(endDate);
                                }
                            } else {
                                const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 jam
                                endTime = createRfc3339DateTimeWIB(endDate);
                            }

                            eventDetails = {
                                summary: `Undangan: ${suratData.perihal}`,
                                location: suratData.detailAgenda.lokasi || "",
                                description: `<b>Instruksi Disposisi:</b><i>"${disposisi.instruksi}"</i>\n\n<b>Detail Surat:</b>\nNomor: ${suratData.nomorSurat}\nDari: ${suratData.pengirim}\n\nLihat detail: ${appUrl}/dashboard/surat/${suratId}`,
                                start: { dateTime: startTime, timeZone },
                                end: { dateTime: endTime, timeZone },
                            };
                        } else if (disposisi.batasWaktu) {
                            const date = disposisi.batasWaktu.toDate();
                            // [MODIFIKASI GCAL] Cukup kirim YYYY-MM-DD untuk 'all-day event'
                            // Gunakan 'en-CA' untuk format YYYY-MM-DD yang aman
                            const startTime = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
                            
                            const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
                            // [MODIFIKASI GCAL] Gunakan 'en-CA'
                            const endTime = nextDay.toLocaleDateString('en-CA'); // YYYY-MM-DD

                            eventDetails = {
                                summary: `Batas Waktu Disposisi: ${suratData.perihal}`,
                                location: "",
                                description: `<b>Instruksi Disposisi:</b><i>"${disposisi.instruksi}"</i>\n\n<b>Detail Surat:</b>\nNomor: ${suratData.nomorSurat}\nDari: ${suratData.pengirim}\n\nLihat detail: ${appUrl}/dashboard/surat/${suratId}`,
                                start: { date: startTime, timeZone },
                                end: { date: endTime, timeZone },
                            };
                        } else {
                            logger.log(`No specific time found for surat ${suratId}, skipping calendar event creation.`);
                            continue; // Lanjut ke user berikutnya
                        }
                        
                        // Panggil helper global
                        try {
                            await createCalendarEvent(recipientProfile, recipientNip, eventDetails);
                        } catch (calendarError) {
                            logger.error(`Failed to create calendar event (from disposisi) for user ${recipientUid}:`, calendarError);
                        }
                     }
                     // --- [AKHIR MODIFIKASI GCAL] ---
                }
            }
            logger.log(`Notifications and calendar sync (if applicable) processed for disposisi ${disposisiId}.`);

        } catch (error) {
            logger.error(`Error processing disposisi ${disposisiId}:`, error);
        }
    }
);

// --- [MODIFIKASI GCAL] Fungsi BARU untuk sinkronisasi Jadwal Internal ---
export const onJadwalTempatCreate = onDocumentCreated(
    { document: "jadwalTempat/{jadwalId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const snap = event.data;
        if (!snap) {
            logger.error("No data for onJadwalTempatCreate event:", event);
            return;
        }

        const jadwal = snap.data() as JadwalTempat;
        const { createdBy, kegiatan, tanggalMulai, jamMulai, jamSelesai, namaTempat, jenis, tautanRapat, penanggungJawab } = jadwal;

        if (!createdBy) {
            logger.warn(`Jadwal ${event.params.jadwalId} missing 'createdBy' field. Aborting.`);
            return;
        }

        try {
            // 1. Dapatkan profil pengguna (pembuat jadwal)
            const userSnap = await db.collection("users").where("uid", "==", createdBy).limit(1).get();
            if (userSnap.empty) {
                logger.warn(`Cannot find user profile for UID ${createdBy} (jadwal ${event.params.jadwalId}).`);
                return;
            }
            const userProfile = userSnap.docs[0].data() as UserProfile;
            const userNip = userSnap.docs[0].id; // NIP (ID Dokumen)

            // 2. Cek izin sinkronisasi
            if (!userProfile.googleCalendarSyncEnabled || !userProfile.googleRefreshToken) {
                logger.log(`User ${createdBy} (NIP: ${userNip}) has GCal sync disabled. Skipping.`);
                return;
            }

            // 3. Format event
            const timeZone = "Asia/Jakarta";
            let hoursStart = 9, minutesStart = 0;
            let hoursEnd = 10, minutesEnd = 0;

            try {
                [hoursStart, minutesStart] = jamMulai.split(":").map(Number);
                [hoursEnd, minutesEnd] = jamSelesai.split(":").map(Number);
            } catch (e) {
                logger.warn(`Could not parse time for jadwal ${event.params.jadwalId}. Using defaults.`);
            }

            const startDate = tanggalMulai.toDate();
            startDate.setHours(hoursStart, minutesStart, 0, 0); // Set detik ke 0
            // [MODIFIKASI GCAL] Gunakan helper baru, bukan .toISOString()
            const startTime = createRfc3339DateTimeWIB(startDate);

            const endDate = tanggalMulai.toDate(); // Gunakan tanggal yang sama
            endDate.setHours(hoursEnd, minutesEnd, 0, 0); // Set detik ke 0
            // [MODIFIKASI GCAL] Gunakan helper baru, bukan .toISOString()
            const endTime = createRfc3339DateTimeWIB(endDate);
            
            const location = jenis === 'Virtual' ? (tautanRapat || "Virtual Meeting") : namaTempat;
            const description = `Rapat Internal: ${kegiatan}\nPenanggung Jawab: ${penanggungJawab}\n${jenis === 'Virtual' && tautanRapat ? `Link: ${tautanRapat}` : ''}`;
            
            const eventDetails = {
                summary: kegiatan,
                location: location,
                description: description,
                start: { dateTime: startTime, timeZone },
                end: { dateTime: endTime, timeZone },
            };

            // 4. Panggil helper global
            await createCalendarEvent(userProfile, userNip, eventDetails);
            
            logger.log(`GCal sync processed for jadwal ${event.params.jadwalId}.`);

        } catch (error) {
            logger.error(`Error processing onJadwalTempatCreate ${event.params.jadwalId}:`, error);
        }
    }
);
// --- [AKHIR MODIFIKASI GCAL] ---


export const onUserCreate = onDocumentCreated(
    { document: "users/{userId}", region: REGION, database: DB_TARGET }, // userId disini adalah NIP
    async (event) => {
        const snap = event.data;
        if (!snap) {
        logger.error("No data associated with the event:", event);
        return;
        }
        const newUserProfile = snap.data() as UserProfile;
        const { uid, jabatanId, role, opdId, nip } = newUserProfile;
        if (!uid) {
        logger.error("UID not found in new user profile:", event.params.userId);
        return;
        }
        try {
            const jabatanDoc = await db.collection("jabatan").doc(jabatanId).get();
            const jabatanData = jabatanDoc.exists ? jabatanDoc.data() : null;
            const level = jabatanData ? jabatanData.level : 9;

            // --- [MODIFIKASI EFISIENSI (Fase 1)] ---
            // 1. Buat search keywords
            const namaJabatan = jabatanData ? (jabatanData as Jabatan).namaJabatan : "Tidak Ada";
            // [FIX] Panggil fungsi 'generateSearchKeywords' yang sudah dideklarasikan
            const keywords = generateSearchKeywords(
                newUserProfile.namaLengkap,
                newUserProfile.nip,
                namaJabatan
            );
            
            // 2. Set data denormalisasi ke dokumen user
            await snap.ref.set({
                namaJabatan: namaJabatan,
                level: level,
                searchKeywords: keywords // [FIX] Tambahkan keywords ke data set
            }, { merge: true });
            logger.log(`Denormalization fields set for new user ${uid}.`);
            // --- [AKHIR MODIFIKASI EFISIENSI] ---

            const customClaims = {
                role: role,
                opdId: opdId,
                jabatanId: jabatanId,
                level: level,
                nip: nip,
            };
            await admin.auth().setCustomUserClaims(uid, customClaims);
            logger.log(`Custom claims set for user ${uid}:`, customClaims);
        } catch (error) {
            logger.error(`Error setting custom claims for user ${uid} (NIP: ${event.params.userId}):`, error);
        }
    }
);
export const onUserUpdate = onDocumentUpdated(
    { document: "users/{userId}", region: REGION, database: DB_TARGET }, // userId disini adalah NIP
    async (event) => {
        const snap = event.data;
        if (!snap) {
            logger.error("No data associated with the event:", event);
            return;
        }
        const updatedUserProfile = snap.after.data() as UserProfile;
        const previousUserProfile = snap.before.data() as UserProfile;

        // Cek jika field kunci untuk custom claim berubah
        const claimsChanged = (
            updatedUserProfile.uid !== previousUserProfile.uid ||
            updatedUserProfile.jabatanId !== previousUserProfile.jabatanId ||
            updatedUserProfile.role !== previousUserProfile.role ||
            updatedUserProfile.opdId !== previousUserProfile.opdId ||
            updatedUserProfile.nip !== previousUserProfile.nip
        );
        
        // --- [MODIFIKASI EFISIENSI (Fase 1)] ---
        // Cek jika field kunci untuk denormalisasi berubah
        const denormalizationChanged = (
            updatedUserProfile.namaLengkap !== previousUserProfile.namaLengkap ||
            updatedUserProfile.nip !== previousUserProfile.nip ||
            updatedUserProfile.jabatanId !== previousUserProfile.jabatanId || // Jabatan berubah
            !updatedUserProfile.searchKeywords || // Jika keywords belum ada
            // [PERBAIKAN] Cek jika data keyword sudah usang (tidak sesuai logika baru)
            !isEqual(updatedUserProfile.searchKeywords, generateSearchKeywords(updatedUserProfile.namaLengkap, updatedUserProfile.nip, updatedUserProfile.namaJabatan || "Tidak Ada"))
        );
        // --- [AKHIR MODIFIKASI EFISIENSI] ---

        if (claimsChanged || denormalizationChanged) {
            const { uid, jabatanId, role, opdId, nip, namaLengkap } = updatedUserProfile;
            if (!uid) {
                logger.error("UID not found in updated user profile:", event.params.userId);
                return;
            }
            try {
                const jabatanDoc = await db.collection("jabatan").doc(jabatanId).get();
                const jabatanData = jabatanDoc.exists ? jabatanDoc.data() : null;
                const level = jabatanData ? (jabatanData as Jabatan).level : 9;
                const namaJabatan = jabatanData ? (jabatanData as Jabatan).namaJabatan : "Tidak Ada";

                // Update custom claims jika perlu
                if (claimsChanged) {
                    const customClaims = {
                        role: role,
                        opdId: opdId,
                        jabatanId: jabatanId,
                        level: level,
                        nip: nip,
                    };
                    await admin.auth().setCustomUserClaims(uid, customClaims);
                    logger.log(`Custom claims updated for user ${uid}:`, customClaims);
                }
                
                // --- [MODIFIKASI EFISIENSI (Fase 1)] ---
                // Update denormalisasi jika perlu
                if (denormalizationChanged) {
                    // [FIX] Panggil fungsi 'generateSearchKeywords'
                     const keywords = generateSearchKeywords(
                        namaLengkap,
                        nip,
                        namaJabatan
                    );
                    await snap.after.ref.update({
                        namaJabatan: namaJabatan,
                        level: level,
                        searchKeywords: keywords // [FIX] Tambahkan keywords ke data update
                    });
                    logger.log(`Denormalization fields updated for user ${uid}.`);
                }
                // --- [AKHIR MODIFIKASI EFISIENSI] ---

            } catch (error) {
                logger.error(`Error updating custom claims/denormalization for user ${uid} (NIP: ${event.params.userId}):`, error);
            }
        } else {
             logger.log(`No relevant fields changed for user ${updatedUserProfile.uid}. Skipping custom claims/denormalization update.`);
        }
    }
);

// --- [MODIFIKASI EFISIENSI (Fase 1)] Fungsi BARU untuk sinkronisasi Jabatan -> User ---
/**
 * Terpicu saat dokumen Jabatan berubah.
 * Menyinkronkan `namaJabatan` dan `level` ke semua dokumen User terkait.
 */
export const onJabatanWriteForDenormalization = onDocumentWritten(
    { document: "jabatan/{jabatanId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const jabatanId = event.params.jabatanId;
        const beforeData = event.data?.before.data() as Jabatan | undefined;
        const afterData = event.data?.after.data() as Jabatan | undefined;

        if (!afterData) {
            logger.log(`Jabatan ${jabatanId} dihapus. Tidak ada sinkronisasi pengguna.`);
            return;
        }

        const needsUpdate = (
            !beforeData || // Dokumen baru
            beforeData.namaJabatan !== afterData.namaJabatan ||
            beforeData.level !== afterData.level
        );

        if (!needsUpdate) {
            logger.log(`Jabatan ${jabatanId} ditulis, tapi field denormalisasi tidak berubah. Skipping user sync.`);
            return;
        }

        logger.log(`Perubahan terdeteksi pada Jabatan ${jabatanId}. Sinkronisasi 'namaJabatan' dan 'level' ke pengguna...`);

        // 1. Cari semua user yang memiliki jabatanId ini
        const usersQuery = db.collection("users").where("jabatanId", "==", jabatanId);
        const usersSnapshot = await usersQuery.get();

        if (usersSnapshot.empty) {
            logger.log(`Tidak ada pengguna ditemukan dengan jabatanId ${jabatanId}.`);
            return;
        }

        // 2. Buat batch update
        const batch = db.batch();
        usersSnapshot.forEach(userDoc => {
            const userRef = userDoc.ref;
            const userData = userDoc.data() as UserProfile;
            
            // Buat ulang keywords dengan nama jabatan baru
            const newKeywords = generateSearchKeywords(
                userData.namaLengkap,
                userData.nip,
                afterData.namaJabatan // <-- Nama jabatan BARU
            );

            batch.update(userRef, {
                namaJabatan: afterData.namaJabatan, // <-- Data baru
                level: afterData.level,         // <-- Data baru
                searchKeywords: newKeywords     // <-- Keywords baru
            });
        });

        // 3. Commit batch
        await batch.commit();
        logger.log(`Berhasil sinkronisasi data jabatan ke ${usersSnapshot.size} pengguna.`);
    }
);
// --- [AKHIR MODIFIKASI EFISIENSI] ---


export const onSuratUpdate = onDocumentUpdated(
    { document: "surat/{suratId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const snap = event.data;
        if (!snap) {
            logger.error("No data for surat update event:", event);
            return;
        }
        const beforeData = snap.before.data() as Surat;
        const afterData = snap.after.data() as Surat;
        const suratId = event.params.suratId;
        if (beforeData && afterData) {
            const beforeComparable = { ...beforeData, searchKeywords: undefined };
            const afterComparable = { ...afterData, searchKeywords: undefined };
            if (isEqual(beforeComparable, afterComparable)) {
                logger.log(`Surat ${suratId} write detected, but only searchKeywords changed. Skipping fan-out.`);
                return;
            }
        }
        if (beforeData.statusPenyelesaian !== "Diarsipkan" && afterData.statusPenyelesaian === "Diarsipkan") {
            logger.log(`Archiving logic triggered for surat ${suratId}.`);
            try {
                const disposisiQuery = await db.collection("disposisi").where("suratId", "==", suratId).get();
                const allInvolvedJabatanIds = new Set<string>();
                if (!disposisiQuery.empty) {
                    disposisiQuery.forEach(doc => {
                        const disposisi = doc.data() as Disposisi;
                        allInvolvedJabatanIds.add(disposisi.dariJabatanId);
                        disposisi.kepadaJabatanId.forEach((id: string) => allInvolvedJabatanIds.add(id));
                    });
                }
                if (afterData.createdBy) {
                    const creatorUserSnap = await db.collection("users").where("uid", "==", afterData.createdBy).limit(1).get();
                    if (!creatorUserSnap.empty) {
                        allInvolvedJabatanIds.add(creatorUserSnap.docs[0].data().jabatanId);
                    }
                }
                if (allInvolvedJabatanIds.size === 0) {
                    logger.warn(`No involved users found for archiving surat ${suratId}. Skipping subcollection update.`);
                    return;
                }
                const usersQuery = await db.collection("users").where("jabatanId", "in", Array.from(allInvolvedJabatanIds)).get();
                const userIds = usersQuery.docs.map((doc) => (doc.data() as UserProfile).uid);
                const batch = db.batch();
                userIds.forEach((userId) => {
                    if (userId) {
                        const arsipRef = db.collection("suratPerPengguna").doc(userId).collection("arsip").doc(suratId);
                        const inboxRef = db.collection("suratPerPengguna").doc(userId).collection("inbox").doc(suratId);
                        const delegatedRef = db.collection("suratPerPengguna").doc(userId).collection("delegated").doc(suratId);
                        batch.set(arsipRef, { ...afterData, statusPenyelesaian: "Diarsipkan" });
                        batch.delete(inboxRef);
                        batch.delete(delegatedRef);
                    }
                });
                await batch.commit();
                logger.log(`Surat ${suratId} moved to 'arsip' and removed from 'inbox'/'delegated' for ${userIds.length} users.`);
            } catch (error) {
                logger.error(`Error during archiving process for surat ${suratId}:`, error);
            }
        } else if (afterData.statusPenyelesaian !== "Diarsipkan") {
            try {
                const disposisiQuery = await db.collection("disposisi").where("suratId", "==", suratId).get();
                const allInvolvedJabatanIds = new Set<string>();
                 if (!disposisiQuery.empty) {
                     disposisiQuery.forEach(doc => {
                        const disposisi = doc.data() as Disposisi;
                        allInvolvedJabatanIds.add(disposisi.dariJabatanId);
                        disposisi.kepadaJabatanId.forEach((id: string) => allInvolvedJabatanIds.add(id));
                     });
                 }
                 if (afterData.createdBy) {
                     const creatorUserSnap = await db.collection("users").where("uid", "==", afterData.createdBy).limit(1).get();
                     if (!creatorUserSnap.empty) { allInvolvedJabatanIds.add(creatorUserSnap.docs[0].data().jabatanId); }
                 }
                 if (allInvolvedJabatanIds.size === 0) return;
                 const usersQuery = await db.collection("users").where("jabatanId", "in", Array.from(allInvolvedJabatanIds)).get();
                 const userIds = usersQuery.docs.map((doc) => (doc.data() as UserProfile).uid);
                 const batch = db.batch();
                 userIds.forEach((userId) => {
                    if (userId) {
                        const inboxRef = db.collection("suratPerPengguna").doc(userId).collection("inbox").doc(suratId);
                        const delegatedRef = db.collection("suratPerPengguna").doc(userId).collection("delegated").doc(suratId);
                        const arsipRef = db.collection("suratPerPengguna").doc(userId).collection("arsip").doc(suratId);
                        batch.set(inboxRef, afterData, { merge: true });
                        batch.set(delegatedRef, afterData, { merge: true });
                        batch.set(arsipRef, afterData, { merge: true });
                    }
                 });
                 await batch.commit();
                 logger.log(`Synced surat ${suratId} update across ${userIds.length} users' subcollections.`);
            } catch (error) {
                logger.error(`Error syncing surat update for ${suratId}:`, error);
            }
        }
    }
);
export const onSuratDelete = onDocumentDeleted(
    { document: "surat/{suratId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const deletedSnapshot = event.data;
        if (!deletedSnapshot) {
            logger.error(`No data found for deleted surat event: ${event.params.suratId}`);
            return;
        }
        const surat = deletedSnapshot.data() as Surat;
        const suratId = event.params.suratId;
        logger.log(`Cleanup initiated for deleted surat ${suratId}.`);
        try {
            const batch = db.batch();
            if (surat.fileUrl) {
                try {
                    const filePath = decodeURIComponent(surat.fileUrl.split("/o/")[1].split("?")[0]);
                    const fileRef = storage.bucket().file(filePath);
                    await fileRef.delete();
                    logger.log(`File deleted from Storage: ${filePath} for surat ${suratId}.`);
                } catch (storageError: any) {
                    if (storageError.code === 404) {
                         logger.warn(`File not found in Storage for ${suratId}, skipping deletion: ${storageError.message}`);
                    } else {
                         logger.error(`Failed to delete file from Storage for ${suratId}:`, storageError);
                    }
                }
            }
            const collectionsToDelete = ["disposisi", "tugas", "activityLogs", "tindakLanjut", "komentarTugas"];
            for (const collectionName of collectionsToDelete) {
                const querySnapshot = await db.collection(collectionName).where("suratId", "==", suratId).get();
                querySnapshot.forEach(doc => batch.delete(doc.ref));
                if (querySnapshot.size > 0) {
                    logger.log(`Marked ${querySnapshot.size} docs from ${collectionName} related to ${suratId} for deletion.`);
                }
            }
            const involvedJabatanIds = surat.terlibatJabatanIds || [];
            if (involvedJabatanIds.length > 0) {
                const chunks: string[][] = [];
                for (let i = 0; i < involvedJabatanIds.length; i += 30) {
                    chunks.push(involvedJabatanIds.slice(i, i + 30));
                }
                
                let usersProcessed = 0;
                for (const chunk of chunks) {
                    const usersSnapshot = await db.collection("users").where("jabatanId", "in", chunk).get();
                    usersSnapshot.forEach(userDoc => {
                        const user = userDoc.data() as UserProfile;
                        const inboxRef = db.collection("suratPerPengguna").doc(user.uid).collection("inbox").doc(suratId);
                        const arsipRef = db.collection("suratPerPengguna").doc(user.uid).collection("arsip").doc(suratId);
                        const delegatedRef = db.collection("suratPerPengguna").doc(user.uid).collection("delegated").doc(suratId);
                        batch.delete(inboxRef);
                        batch.delete(arsipRef);
                        batch.delete(delegatedRef);
                        usersProcessed++;
                    });
                }
                if (usersProcessed > 0) {
                     logger.log(`Marked inbox/arsip/delegated entries for deletion across ${usersProcessed} users for surat ${suratId}.`);
                }
            } else {
                 logger.log(`No terlibatJabatanIds found for surat ${suratId}, skipping fan-out deletion.`);
            }
            await batch.commit();
            logger.log(`Cleanup successfully completed for deleted surat ${suratId}.`);
        } catch (error) {
            logger.error(`Error during cleanup for deleted surat ${suratId}:`, error);
        }
    }
);
export const onPengumumanDelete = onDocumentDeleted(
    { document: "pengumuman/{pengumumanId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const snap = event.data;
        if (!snap) return;
        const pengumuman = snap.data() as Pengumuman;
        if (pengumuman.attachmentFileName) {
            const filePath = `pengumuman/${pengumuman.attachmentFileName}`;
            const fileRef = storage.bucket().file(filePath);
            try {
                await fileRef.delete();
                logger.log(`Successfully deleted attachment ${filePath} from Storage for pengumuman ${event.params.pengumumanId}.`);
            } catch (error: any) {
                 if (error.code === 404) {
                    logger.warn(`Attachment file not found in Storage for pengumuman ${event.params.pengumumanId}, skipping deletion: ${error.message}`);
                 } else {
                    logger.error(`Failed to delete attachment ${filePath} from Storage:`, error);
                 }
            }
        } else {
             logger.log(`No attachment found for pengumuman ${event.params.pengumumanId}, skipping storage deletion.`);
        }
    }
);
export const onSuratWriteForSearch = onDocumentWritten(
    { document: "surat/{suratId}", region: REGION, database: DB_TARGET },
    async (event) => {
        const snap = event.data;
        if (!snap) {
            logger.log(`No data found for surat write event: ${event.params.suratId}`);
            return;
        }
        if (!snap.after.exists) {
            logger.log(`Surat ${event.params.suratId} deleted. Skipping keyword update.`);
            return;
        }
        const suratData = snap.after.data() as Surat;
        const { perihal, nomorSurat, pengirim } = suratData;
        const textToIndex = `${perihal || ''} ${nomorSurat || ''} ${pengirim || ''}`.toLowerCase();
        const newKeywords = [...new Set(textToIndex.split(/\s+/).filter(Boolean))];
        const existingKeywords = suratData.searchKeywords || [];
        if (isEqual(newKeywords.sort(), existingKeywords.sort())) {
            return;
        }
        try {
            await snap.after.ref.update({ searchKeywords: newKeywords });
            logger.log(`Search keywords updated successfully for surat ${event.params.suratId}.`);
        } catch (error) {
            logger.error(`Failed to update search keywords for surat ${event.params.suratId}:`, error);
        }
    }
);
// =================================================================================================
// --- FUNGSI TERJADWAL (SCHEDULED FUNCTIONS) ---
// =================================================================================================