import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { db, REGION } from "../config/firebase";

/**
 * Callable Function: recordUserSession
 *
 * Dipanggil dari frontend (AuthContext) setiap kali user berhasil login.
 * Merekam sesi unik per user per hari ke koleksi `userSessions`.
 *
 * Dokumen di-upsert (merge: true) dengan ID = `{userId}_{YYYY-MM-DD}` agar
 * per hari hanya ada 1 dokumen per user (idempotent & hemat write).
 *
 * Struktur dokumen `userSessions/{sessionId}`:
 *   - userId:      string
 *   - opdId:       string
 *   - yearMonth:   string    "YYYY-MM"  → untuk filter bulanan
 *   - dayOfMonth:  number               → untuk kalkulasi minggu aktif (1-31)
 *   - weekOfMonth: number               → minggu ke-berapa di bulan tersebut (1-5)
 *   - loginAt:     Timestamp            → timestamp login pertama hari ini
 *   - updatedAt:   Timestamp            → timestamp login terakhir hari ini
 */
export const recordUserSession = onCall(
    {
        region: REGION,
        enforceAppCheck: false,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Harus login untuk memanggil fungsi ini.");
        }

        const uid = request.auth.uid;

        // Ambil profil user dari Firestore untuk mendapatkan opdId
        let opdId: string | null = null;
        try {
            const userSnap = await db.collection("users")
                .where("uid", "==", uid)
                .where("status", "==", "aktif")
                .limit(1)
                .get();

            if (userSnap.empty) {
                logger.warn(`[recordUserSession] User ${uid} not found or inactive. Skipping.`);
                return { success: false, reason: "user_not_found" };
            }

            opdId = userSnap.docs[0].data().opdId || null;
        } catch (e) {
            logger.error("[recordUserSession] Error fetching user profile:", e);
            throw new HttpsError("internal", "Gagal mengambil profil user.");
        }

        if (!opdId) {
            logger.warn(`[recordUserSession] User ${uid} has no opdId. Skipping.`);
            return { success: false, reason: "no_opdId" };
        }

        // Hitung tanggal WIB saat ini
        const now = new Date(
            new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
        );

        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();

        const pad = (n: number) => (n < 10 ? "0" + n : String(n));
        const yearMonth = `${year}-${pad(month)}`; // "2026-07"
        const dateStr = `${yearMonth}-${pad(day)}`;  // "2026-07-22"

        // Minggu ke berapa dalam bulan (1-indexed): hari 1-7 = minggu 1, dst.
        const weekOfMonth = Math.ceil(day / 7);

        const sessionDocId = `${uid}_${dateStr}`;
        const sessionRef = db.collection("userSessions").doc(sessionDocId);

        try {
            const existingSnap = await sessionRef.get();
            const alreadyExists = existingSnap.exists;

            const sessionData: Record<string, any> = {
                userId: uid,
                opdId: opdId,
                yearMonth: yearMonth,
                dayOfMonth: day,
                weekOfMonth: weekOfMonth,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };

            // loginAt hanya di-set saat pertama kali hari ini
            if (!alreadyExists) {
                sessionData.loginAt = admin.firestore.FieldValue.serverTimestamp();
            }

            await sessionRef.set(sessionData, { merge: true });

            logger.log(`[recordUserSession] Session ${alreadyExists ? "updated" : "created"}: ${sessionDocId} for OPD ${opdId}`);
            return { success: true, sessionId: sessionDocId, isNew: !alreadyExists };
        } catch (e) {
            logger.error("[recordUserSession] Error writing session:", e);
            throw new HttpsError("internal", "Gagal menyimpan sesi.");
        }
    }
);
