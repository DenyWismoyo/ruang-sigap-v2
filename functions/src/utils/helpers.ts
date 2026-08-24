import { HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { google } from "googleapis";
import { db } from "../config/firebase";
import { UserProfile } from "../types";


// --- [MODIFIKASI FASE 1] Helper Cache Baru untuk Nama Pengguna ---
const CACHE_TTL_MS = 5 * 60 * 1000;
interface CacheEntry { value: string; expiry: number; }
export const userNameCache = new Map<string, CacheEntry>();
export const userIdCache = new Map<string, CacheEntry>(); // Cache lama tetap ada
export const getUserNameFromJabatanId = async (jabatanId: string): Promise<string> => {
  const cached = userNameCache.get(jabatanId);
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }
  const usersQuery = db.collection("users").where("jabatanId", "==", jabatanId).limit(1);
  const userSnapshot = await usersQuery.get();
  if (userSnapshot.empty) {
    logger.warn(`No user found for jabatanId in cache helper: ${jabatanId}`);
    userNameCache.set(jabatanId, { value: "Jabatan Kosong", expiry: Date.now() + CACHE_TTL_MS }); // Cache negatif
    return "Jabatan Kosong";
  }
  const userName = (userSnapshot.docs[0].data() as UserProfile).namaLengkap || "Tanpa Nama";
  userNameCache.set(jabatanId, { value: userName, expiry: Date.now() + CACHE_TTL_MS });
  return userName;
};
export const getUserNameFromUid = async (uid: string): Promise<string> => {
     const usersQuery = db.collection("users").where("uid", "==", uid).limit(1);
     const userSnapshot = await usersQuery.get();
     if (userSnapshot.empty) {
         logger.warn(`No user found for UID in cache helper: ${uid}`);
         return "Pengguna Tidak Ditemukan";
     }
     return (userSnapshot.docs[0].data() as UserProfile).namaLengkap || "Tanpa Nama";
};
// --- [AKHIR MODIFIKASI FASE 1] ---

// --- [MODIFIKASI EFISIENSI (Fase 1)] Helper baru untuk search keywords ---
/**
 * Membuat array token pencarian dari data pengguna.
 * [MODIFIKASI 05/11/2025] Diubah untuk membuat n-gram (prefiks) agar pencarian 'array-contains' berfungsi.
 * [MODIFIKASI (Permintaan User)]: Fokus pada Nama Lengkap, 8 digit NIP, dan kata pertama Jabatan.
 */
export const generateSearchKeywords = (namaLengkap: string, nip: string, namaJabatan: string): string[] => {
    const keywords = new Set<string>();
    
    // --- LOGIKA BARU (N-GRAM/PREFIKS) ---
    const createPrefixes = (text: string) => {
        if (!text) return;
        // Bersihkan teks dan pisah menjadi kata-kata
        const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
        
        for (const word of words) {
            // Jangan buat prefiks untuk kata yang terlalu pendek
            if (word.length < 2) continue;

            // Buat prefiks (n-gram)
            for (let i = 1; i <= word.length; i++) {
                keywords.add(word.substring(0, i));
            }
        }
    };

    // 1. Prefiks untuk SEMUA kata di Nama Lengkap (SESUAI PERMINTAAN)
    createPrefixes(namaLengkap);
    
    // 2. Prefiks untuk 8 digit pertama NIP (SESUAI PERMINTAAN)
    if (nip) {
        const cleanNip = nip.replace(/\s+/g, ""); // Hapus spasi
        // Hanya ambil 8 digit pertama
        const nipPrefixTarget = cleanNip.substring(0, 8); 
        if (nipPrefixTarget.length > 0) {
            for (let i = 1; i <= nipPrefixTarget.length; i++) { // Loop sampai panjang 8 itu
                 keywords.add(nipPrefixTarget.substring(0, i));
            }
        }
    }
    
    // 3. Prefiks HANYA untuk KATA PERTAMA dari Nama Jabatan (SESUAI PERMINTAAN)
    if (namaJabatan) {
        // Ambil hanya kata pertama
        const firstWordOfJabatan = namaJabatan.split(/\s+/)[0];
        // Kirim hanya kata pertama itu ke helper prefiks
        createPrefixes(firstWordOfJabatan);
    }
    
    // Batasi jumlah keywords untuk menghindari error ukuran dokumen
    return Array.from(keywords).slice(0, 100); 
};
// --- [AKHIR MODIFIKASI EFISIENSI] ---


// --- [MODIFIKASI GCAL] Helper global untuk Google Calendar ---
// [MODIFIKASI] Menambahkan helper baru untuk format waktu RFC3339
/**
 * Mengubah Date object menjadi string RFC3339 dengan offset WIB (+07:00).
 * @param date Objek Date
 * @returns String RFC3339 (e.g., "2025-11-10T09:00:00+07:00")
 */
export const createRfc3339DateTimeWIB = (date: Date): string => {
  // Ambil tanggal dalam UTC
  const utcDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  // Tambahkan 7 jam untuk mendapatkan waktu WIB
  const wibDate = new Date(utcDate.getTime() + (7 * 3600 * 1000));

  const y_wib = wibDate.getFullYear();
  const mo_wib = String(wibDate.getMonth() + 1).padStart(2, "0");
  const d_wib = String(wibDate.getDate()).padStart(2, "0");
  const h_wib = String(wibDate.getHours()).padStart(2, "0");
  const m_wib = String(wibDate.getMinutes()).padStart(2, "0");

  // Kembalikan format RFC3339 dengan offset WIB (+07:00)
  return `${y_wib}-${mo_wib}-${d_wib}T${h_wib}:${m_wib}:00+07:00`;
};

export const createCalendarEvent = async (
  userProfile: UserProfile,
  userNip: string,
  eventDetails: {
    summary: string;
    description: string;
    location: string;
    start: { dateTime?: string; date?: string; timeZone: string; };
    end: { dateTime?: string; date?: string; timeZone: string; };
  }
) => {
  if (!userProfile.googleCalendarSyncEnabled) {
    logger.log(`User ${userProfile.uid} (NIP: ${userNip}) GCal sync is disabled. Skipping.`);
    return;
  }
  if (!userProfile.googleRefreshToken) {
    logger.warn(`User ${userProfile.uid} (NIP: ${userNip}) GCal sync enabled but no refresh token. Skipping.`);
    return;
  }
  const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
  );
  try {
    oAuth2Client.setCredentials({
      refresh_token: userProfile.googleRefreshToken,
    });
    await oAuth2Client.getAccessToken();
  } catch (tokenError: any) {
    logger.error(`Failed to refresh Google token for user ${userProfile.uid} (NIP: ${userNip}):`, tokenError.message);
    if (tokenError.message.includes("invalid_grant") || tokenError.message.includes("Token has been expired or revoked")) {
      const userRef = db.collection("users").doc(userNip);
      await userRef.update({
        googleCalendarSyncEnabled: false,
        googleRefreshToken: null,
        googleAccessToken: null,
        googleTokenExpiry: null,
      });
      logger.log(`Removed invalid Google refresh token for user ${userProfile.uid} (NIP: ${userNip})`);
    }
    return;
  }
  const calendar = google.calendar({version: "v3", auth: oAuth2Client});
  const event = {
    summary: eventDetails.summary,
    location: eventDetails.location,
    description: eventDetails.description,
    start: eventDetails.start,
    end: eventDetails.end,
  };
  try {
    await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    logger.log(`Successfully created calendar event for user ${userProfile.uid} (NIP: ${userNip})`);
  } catch (insertError) {
    logger.error(`Failed to insert calendar event for user ${userProfile.uid} (NIP: ${userNip}):`, insertError);
  }
};
// --- [AKHIR MODIFIKASI GCAL] ---


// =================================================================================================
// FUNGSI BARU: VALIDASI LOGIN (DIPANGGIL DARI AUTHCONTEXT)
// =================================================================================================
export const getUserIdFromJabatanId = async (jabatanId: string): Promise<string | null> => {
  const cached = userIdCache.get(jabatanId);
  if (cached && cached.expiry > Date.now()) {
    return cached.value;
  }
  const usersQuery = db.collection("users").where("jabatanId", "==", jabatanId).where("status", "==", "aktif").limit(1);
  const userSnapshot = await usersQuery.get();
  if (userSnapshot.empty) {
    logger.warn(`No active user found for jabatanId: ${jabatanId}`);
    return null;
  }
  const userId = userSnapshot.docs[0].data().uid;
  userIdCache.set(jabatanId, { value: userId, expiry: Date.now() + CACHE_TTL_MS });
  return userId;
};
export const updateUserSummary = (userId: string, field: string, incrementValue: number) => {
  const summaryRef = db.collection("userSummaries").doc(userId);
  return summaryRef.set({
    [field]: admin.firestore.FieldValue.increment(incrementValue),
  }, {merge: true});
};
export const checkPermission = async (context: { auth?: any }, requiredRoles: string[], checkLevel = false) => {
    if (!context.auth) {
        throw new HttpsError("unauthenticated", "Request had no authentication.");
    }
    const role = context.auth.token.role as string;
    const level = context.auth.token.level as number;
    const allowedRoles = [...requiredRoles, "super_admin"];
    if (!allowedRoles.includes(role)) {
         throw new HttpsError("permission-denied", `User must be one of: ${allowedRoles.join(", ")}.`);
    }
    if (checkLevel && (typeof level !== "number" || level > 5)) {
        throw new HttpsError("permission-denied", "Hanya pimpinan (level 5 ke atas) yang diizinkan.");
    }
};

export const sendFcmMessageByUid = async (uid: string, title: string, body: string, link: string, tag: string, nip?: string, prefKey?: "pushSuratMasuk" | "pushDisposisi" | "pushTugas") => {
  try {
    // 1. Cari NIP dan tokens berdasarkan UID
    const userQuery = await db.collection("users").where("uid", "==", uid).limit(1).get();
    if (userQuery.empty) {
      logger.warn(`[ScheduledFn] User profile not found for UID: ${uid}. Skipping message.`);
      return;
    }
    const userDoc = userQuery.docs[0];
    const userProfile = userDoc.data() as UserProfile;
    // const userNip = userDoc.id; // NIP adalah ID dokumen
    const tokens = userProfile.fcmTokens;

    if (!tokens || tokens.length === 0) {
      logger.log(`[ScheduledFn] User ${uid} has no FCM tokens. Skipping.`);
      return;
    }

    // --- [FIX] CEK PREFERENSI NOTIFIKASI PENGGUNA ---
    if (prefKey && userProfile.notificationPreferences) {
      if (userProfile.notificationPreferences[prefKey] === false) {
        logger.log(`[ScheduledFn] User ${uid} has disabled push for ${prefKey}. Skipping FCM.`);
        return; // Hentikan eksekusi push notifikasi
      }
    }
    // --- [AKHIR FIX] ---

    // 2. Ambil total notification count (sama seperti di onNotificationCreated)
    let totalCount = 0;
    const summarySnap = await db.collection("userSummaries").doc(userProfile.jabatanId || uid).get();
    if (summarySnap.exists) {
      const summaryData = summarySnap.data() as { suratBaruCount?: number, tugasBaruCount?: number };
      totalCount = (summaryData.suratBaruCount || 0) + (summaryData.tugasBaruCount || 0);
    }

    // 3. Buat payload
    const messagePayload: admin.messaging.MulticastMessage = {
      data: {
        title: title,
        body: body,
        icon: "/icon-192x192.png",
        link: link,
        tag: tag,
        totalCount: String(totalCount),
      },
      tokens: tokens,
    };

    // 4. Kirim pesan
    const response = await admin.messaging().sendEachForMulticast(messagePayload);
    logger.log(`[ScheduledFn] Sent '${tag}' to ${uid}: ${response.successCount} success, ${response.failureCount} failure.`);

    // 5. Cleanup token (sama seperti di onNotificationCreated)
    if (response.failureCount > 0) {
      const tokensToRemove: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const error = resp.error;
          if (error && (error.code === "messaging/invalid-registration-token" || error.code === "messaging/registration-token-not-registered")) {
            tokensToRemove.push(tokens[idx]);
          }
        }
      });
      if (tokensToRemove.length > 0) {
        await userDoc.ref.update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove),
        });
        logger.log(`[ScheduledFn] Cleaned up ${tokensToRemove.length} invalid tokens for ${uid}.`);
      }
    }
  } catch (error) {
    logger.error(`[ScheduledFn] Error sending message to UID ${uid}:`, error);
  }
};

/**
 * [BARU] PENGINGAT BERKALA (Implementasi Rencana Notifikasi 3.C)
 * Berjalan setiap 2 jam untuk mengingatkan pengguna tentang item yang belum dibaca.
 */