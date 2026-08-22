import { onCall, HttpsError, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { db, REGION } from "../config/firebase";
import { checkPermission } from "../utils/helpers";
import { UserProfile, Jabatan, OPD } from "../types";
import { isEqual } from "lodash";

export const checkAdminEmail = onCall({ region: REGION }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    const email = data.email;
    if (!email) {
        throw new HttpsError("invalid-argument", "Email wajib diisi.");
    }
    const usersRef = db.collection("users");
    const querySnapshot = await usersRef
        .where("email", "==", email)
        .where("status", "==", "aktif")
        .get();
    
    if (querySnapshot.empty) {
        throw new HttpsError("not-found", "Email tidak terdaftar atau akun tidak aktif.");
    }
    
    const userData = querySnapshot.docs[0].data() as UserProfile;
    if (userData.role === 'user') {
        throw new HttpsError("permission-denied", "Pengguna biasa harus login menggunakan NIP.");
    }
    return { nip: userData.nip };
});
export const getEmailFromNip = onCall({ region: REGION }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    const nip = data.nip;
    if (!nip) {
        throw new HttpsError("invalid-argument", "NIP wajib diisi.");
    }
    const userDocRef = db.collection("users").doc(nip);
    const userDocSnap = await userDocRef.get();
    
    if (!userDocSnap.exists) {
        throw new HttpsError("not-found", "NIP tidak terdaftar.");
    }
    
    const userData = userDocSnap.data() as UserProfile;
    if (userData.status !== "aktif") {
        throw new HttpsError("permission-denied", "Akun ini tidak aktif.");
    }
    if (userData.role !== 'user') {
        throw new HttpsError("permission-denied", "Login NIP hanya untuk pengguna biasa. Admin/Staf TU harap login menggunakan Email.");
    }
    if (!userData.email) {
        throw new HttpsError("internal", "Data email untuk pengguna ini tidak ditemukan. Hubungi Admin.");
    }
    
    return { email: userData.email };
});
export const setNipClaim = onCall({ region: REGION }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    const uid = context.auth?.uid;
    const nip = data.nip;

    if (!uid) {
         throw new HttpsError("unauthenticated", "Pengguna tidak terautentikasi.");
    }
    if (!nip) {
         throw new HttpsError("invalid-argument", "NIP wajib diisi.");
    }

    try {
        const userRecord = await admin.auth().getUser(uid);
        const currentClaims = userRecord.customClaims || {};
        const userDocSnap = await db.collection("users").doc(nip).get();
        if (!userDocSnap.exists) {
            throw new HttpsError("not-found", `Dokumen user untuk NIP ${nip} tidak ditemukan.`);
        }
        
        const userData = userDocSnap.data() as UserProfile;
        
        if (userData.uid !== uid) {
             throw new HttpsError("permission-denied", `UID token tidak cocok dengan UID di dokumen user.`);
        }
        
        const jabatanDoc = await db.collection("jabatan").doc(userData.jabatanId).get();
        const level = jabatanDoc.exists ? jabatanDoc.data()?.level : 9;

        let opdDocSnap = await db.collection("opdConfigs").doc(userData.opdId).get();
        if (!opdDocSnap.exists) {
            // Fallback & soft-migration
            opdDocSnap = await db.collection("opd_config").doc(userData.opdId).get();
            if (opdDocSnap.exists) {
                await db.collection("opdConfigs").doc(userData.opdId).set(opdDocSnap.data()!);
            }
        }
        const opdData = opdDocSnap.exists ? opdDocSnap.data() : null;
        const appTheme = userData.app_theme || opdData?.default_theme || "sigap";

        const newClaims = {
            ...currentClaims,
            role: userData.role,
            opdId: userData.opdId,
            jabatanId: userData.jabatanId,
            level: level,
            nip: nip,
            app_theme: appTheme,
        };

        if (!isEqual(currentClaims, newClaims)) {
            await admin.auth().setCustomUserClaims(uid, newClaims);
            logger.log(`Custom claims LENGKAP berhasil diatur untuk UID ${uid}.`);
            return { success: true, message: "Claims diatur.", appTheme: appTheme };
        }
        
        return { success: true, message: "Claims sudah sesuai." };

    } catch (error: any) {
        logger.error(`Gagal mengatur custom claims lengkap untuk UID ${uid}:`, error);
        throw new HttpsError("internal", error.message);
    }
});

// =================================================================================================
// --- FUNGSI BARU: PENGAMBILAN DATA GLOBAL (DIPANGGIL DARI AUTHCONTEXT) ---
// =================================================================================================
export const getGlobalOpdData = onCall({ region: REGION }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    if (!context.auth) {
        throw new HttpsError("unauthenticated", "Pengguna tidak terautentikasi.");
    }

    const userOpdId = context.auth.token.opdId as string;
    const userRole = context.auth.token.role as string;
    
    if (!userOpdId) {
         throw new HttpsError("permission-denied", "Token pengguna tidak memiliki opdId.");
    }

    let allOpds: OPD[] = []; // Deklarasikan di scope atas

    try {
        let opdIdsToQuery: string[] = [];

        if (userRole === 'super_admin') {
            const opdSnapshot = await db.collection("opd").get();
            allOpds = opdSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OPD));
            
            // [PERBAIKAN ERROR BUILD] Mengatasi TS2322
            // doc.id berasal dari interface OPD { id?: string }, sehingga tipenya (string | undefined)[]
            // Kita filter untuk memastikan hanya string yang masuk ke opdIdsToQuery (string[])
            opdIdsToQuery = allOpds.map(doc => doc.id).filter(Boolean) as string[];
        } else {
            // [OPTIMASI] Hanya ambil OPD sendiri dan sub-OPD nya (tidak perlu full scan)
            const subOpdQuery = await db.collection("opd").where("idOpdInduk", "==", userOpdId).get();
            const subOpdDocs = subOpdQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as OPD));
            const subOpdIds = subOpdDocs.map(opd => opd.id!);

            // Ambil OPD Induk (OPD user sendiri)
            const parentOpdDoc = await db.collection("opd").doc(userOpdId).get();
            if (parentOpdDoc.exists) {
                 allOpds = [{ id: parentOpdDoc.id, ...parentOpdDoc.data() } as OPD, ...subOpdDocs];
            } else {
                 allOpds = [...subOpdDocs];
            }

            opdIdsToQuery = [userOpdId, ...subOpdIds];
        }

        if (opdIdsToQuery.length === 0) {
             opdIdsToQuery = [userOpdId];
        }

        const opdIdChunks: string[][] = [];
        for (let i = 0; i < opdIdsToQuery.length; i += 30) {
            opdIdChunks.push(opdIdsToQuery.slice(i, i + 30));
        }

        const jabatanPromises = opdIdChunks.map(chunk => 
            db.collection('jabatan').where('opdId', 'in', chunk).get()
        );

        const [jabatanSnapshots] = await Promise.all([
            Promise.all(jabatanPromises),
        ]);
        
        const allOpdJabatans = jabatanSnapshots.flatMap(snap => 
            snap.docs.map(d => ({ id: d.id, ...d.data() } as Jabatan)) 
        );
        
        logger.log(`Mengembalikan ${allOpdJabatans.length} jabatan dan ${allOpds.length} OPD untuk ${userOpdId}`);
        
        return { allOpdJabatans, allOpds };

    } catch (error: any) {
        logger.error(`Gagal mengambil data global OPD untuk ${userOpdId}:`, error);
        throw new HttpsError("internal", error.message);
    }
});

// =================================================================================================
// --- [BARU] FUNGSI LINTAS OPD (Rencana V2 - 4.2) ---
// =================================================================================================
/**
 * [BARU] Mengambil cache global (semua user, jabatan, opd)
 * Hanya untuk Pimpinan Pusat (level <= 2).
 */
export const getGlobalUserCache = onCall({ region: REGION }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    // 1. Verifikasi otorisasi (Plan 4.2)
    if (!context.auth || !context.auth.token.level) {
         throw new HttpsError("unauthenticated", "Request had no authentication.");
    }
    // Cek HANYA level
    if (context.auth.token.level > 2) {
        logger.warn(`User ${context.auth.uid} (level ${context.auth.token.level}) attempted to call getGlobalUserCache.`);
        throw new HttpsError('permission-denied', 'Hanya Pimpinan Pusat (Level 1 atau 2) yang dapat memanggil fungsi ini.');
    }
    logger.log(`getGlobalUserCache called by Pimpinan Pusat (UID: ${context.auth.uid})`);

    try {
        // 2. Query semua data (Plan 4.2)
        const [jabatanSnapshot, userSnapshot, opdSnapshot] = await Promise.all([
            db.collection("jabatan").get(),
            db.collection("users").get(),
            db.collection("opd").get()
        ]);

        const allJabatans = jabatanSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Jabatan));
        const allUsers = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        const allOpds = opdSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OPD));
        
        logger.log(`Returning global cache: ${allJabatans.length} jabatans, ${allUsers.length} users, ${allOpds.length} OPDs.`);

        // 3. Return data (Plan 4.2)
        return { allJabatans, allUsers, allOpds };

    } catch (error: any) {
        logger.error(`Gagal mengambil data global cache:`, error);
        throw new HttpsError("internal", error.message);
    }
});
// =================================================================================================


// =================================================================================================
// --- FUNGSI BARU: PENGELOLAAN USER SUMMARY UNTUK EFISIENSI ---
// =================================================================================================
export const aturDelegasiSementara = onCall({ region: REGION }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    await checkPermission(context, [], true);
    const { delegatedToJabatanId, durasi, alasan } = data;
    const pimpinanJabatanId = context.auth?.token.jabatanId as string;
    const pimpinanNama = context.auth?.token.name;
    if (!delegatedToJabatanId || !durasi) {
        throw new HttpsError("invalid-argument", "Data tidak lengkap.");
    }
    let berlakuHingga: Date;
    const now = new Date();
    switch (durasi) {
        case "2h": berlakuHingga = new Date(now.getTime() + 2 * 60 * 60 * 1000); break;
        case "4h": berlakuHingga = new Date(now.getTime() + 4 * 60 * 60 * 1000); break;
        case "eod":
            berlakuHingga = new Date();
            berlakuHingga.setHours(17, 0, 0, 0);
            if (now > berlakuHingga) berlakuHingga.setDate(berlakuHingga.getDate() + 1);
            break;
        case "manual": berlakuHingga = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); break;
        default: throw new HttpsError("invalid-argument", "Durasi tidak valid.");
    }
    try {
        const jabatanRef = db.collection("jabatan").doc(pimpinanJabatanId);
        await jabatanRef.update({
            delegasiSementara: {
                delegatedToJabatanId,
                berlakuHingga: admin.firestore.Timestamp.fromDate(berlakuHingga),
                alasan: alasan || "Tugas mendesak",
            },
        });
        const userPenerimaQuery = await db.collection("users").where("jabatanId", "==", delegatedToJabatanId).limit(1).get();
        if (!userPenerimaQuery.empty) {
            const userPenerima = userPenerimaQuery.docs[0].data() as UserProfile;
            const notifRef = db.collection("notifications").doc();
            await notifRef.set({
                userId: userPenerima.uid,
                userNip: userPenerima.nip,
                message: `Pimpinan ${pimpinanNama} mendelegasikan wewenang disposisi kepada Anda.`,
                link: "/dashboard/ruang-kerja",
                isRead: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        logger.log(`Delegasi diatur oleh ${pimpinanJabatanId} kepada ${delegatedToJabatanId} hingga ${berlakuHingga.toISOString()}`);
        return { success: true, message: "Delegasi berhasil diaktifkan." };
    } catch (error: any) {
        logger.error("Error aturDelegasiSementara:", error);
        throw new HttpsError("internal", error.message);
    }
});
export const batalkanDelegasiSementara = onCall({ region: REGION }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    await checkPermission(context, [], true);
    const pimpinanJabatanId = context.auth?.token.jabatanId as string;
    try {
        const jabatanRef = db.collection("jabatan").doc(pimpinanJabatanId);
        await jabatanRef.update({ delegasiSementara: null });
        logger.log(`Delegasi dibatalkan oleh ${pimpinanJabatanId}`);
        return { success: true, message: "Delegasi berhasil dinonaktifkan." };
    } catch (error: any) {
        logger.error("Error batalkanDelegasiSementara:", error);
        throw new HttpsError("internal", error.message);
    }
});
export const resetPassword = onCall({ region: REGION }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    await checkPermission(context, ["admin_opd", "super_admin"]);
    const { uid, method, newPassword } = data;
    const adminEmail = context.auth?.token.email;
    try {
        const userToReset = await admin.auth().getUser(uid);
        const currentClaims = userToReset.customClaims || {};
        if (method === "email") {
            if (!userToReset.email) {
                throw new HttpsError("not-found", "User does not have an email address.");
            }
            const link = await admin.auth().generatePasswordResetLink(userToReset.email);
            logger.info(`Generated password reset link for ${userToReset.email}: ${link}`);
            logger.log(`Password reset link generated for ${userToReset.email} by ${adminEmail}`);
            return {
                success: true,
                message: `Link reset password TELAH DIKIRIM (simulasi) ke ${userToReset.email}.`,
            };
        } else if (method === "temporary") {
            if (!newPassword || newPassword.length < 6) {
                throw new HttpsError("invalid-argument", "Temporary password must be at least 6 characters.");
            }
            await admin.auth().updateUser(uid, { password: newPassword });
            await admin.auth().setCustomUserClaims(uid, { ...currentClaims, mustResetPassword: true });
            logger.log(`Temporary password set for user ${uid} by ${adminEmail}`);
            return { success: true, message: "Password sementara berhasil diatur. Pengguna akan diminta mengubahnya saat login." };
        } else {
            throw new HttpsError("invalid-argument", "Invalid reset method specified.");
        }
    } catch (error: any) {
        logger.error("Error in resetPassword function:", error);
        throw new HttpsError("internal", error.message);
    }
});
export const bulkUpdateUserStatus = onCall({ region: REGION }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    await checkPermission(context, ["admin_opd", "super_admin"]);
    const { userIds, status } = data;
    if (!Array.isArray(userIds) || !["aktif", "nonaktif"].includes(status)) {
        throw new HttpsError("invalid-argument", "Invalid arguments provided.");
    }
    try {
        const batch = db.batch();
        userIds.forEach(nip => {
            const userRef = db.collection("users").doc(nip);
            batch.update(userRef, { status });
        });
        await batch.commit();
        logger.log(`${userIds.length} users status updated to ${status} by ${context.auth?.token.email}`);
        return { success: true, message: `${userIds.length} pengguna berhasil diperbarui.` };
    } catch (error: any) {
        logger.error("Error in bulkUpdateUserStatus:", error);
        throw new HttpsError("internal", error.message);
    }
});
export const importUsers = onCall({ region: REGION, timeoutSeconds: 540 }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    await checkPermission(context, ["admin_opd", "super_admin"]);
    const usersToImport: Array<{ email: string, password?: string, namaLengkap: string, nip: string, role: string, opdId: string, jabatanId: string }> = data.users;
    if (!Array.isArray(usersToImport)) {
        throw new HttpsError("invalid-argument", "Expected an array of users.");
    }
    let successCount = 0;
    const errors: string[] = [];
    // [OPTIMASI] Eksekusi Paralel dengan Batch
    const BATCH_SIZE = 10;
    for (let i = 0; i < usersToImport.length; i += BATCH_SIZE) {
        const batch = usersToImport.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (user) => {
            try {
                const passwordToUse = user.password || `SIGAP${user.nip}`;
                const userRecord = await admin.auth().createUser({
                    email: user.email,
                    password: passwordToUse,
                    displayName: user.namaLengkap,
                    emailVerified: true,
                });
                const jabatanDoc = await db.collection("jabatan").doc(user.jabatanId).get();
                const level = jabatanDoc.exists ? jabatanDoc.data()?.level : 9;

                await admin.auth().setCustomUserClaims(userRecord.uid, {
                    role: user.role, opdId: user.opdId, jabatanId: user.jabatanId,
                    mustResetPassword: !user.password, level: level,
                    nip: user.nip
                });
                await db.collection("users").doc(user.nip).set({
                    uid: userRecord.uid, namaLengkap: user.namaLengkap, nip: user.nip,
                    email: user.email, opdId: user.opdId, jabatanId: user.jabatanId,
                    role: user.role, status: "aktif",
                });
            } catch (error: any) {
                logger.error(`Failed to import user ${user.email}:`, error);
                errors.push(`Gagal mengimpor ${user.email}: ${error.message}`);
            }
        }));
        successCount += batch.length;
    }
    return { success: successCount > 0, message: `Selesai memproses pengguna.`, errors };
});
export const getImpersonationToken = onCall({ region: REGION }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    await checkPermission(context, ["admin_opd", "super_admin"]);
    const { targetUid, reason } = data;
    const adminUid = context.auth?.token.uid;
    const adminEmail = context.auth?.token.email;
    if (!targetUid || !reason) {
        throw new HttpsError("invalid-argument", "Target UID and reason are required.");
    }
    try {
        await db.collection("impersonationLogs").add({
            adminUid, adminEmail, targetUid, reason,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
        const userToImpersonate = await admin.auth().getUser(targetUid);
        const additionalClaims = { ...userToImpersonate.customClaims, impersonated: true, originalUid: adminUid };
        const customToken = await admin.auth().createCustomToken(targetUid, additionalClaims);
        logger.log(`Impersonation token created for ${targetUid} by ${adminEmail}. Reason: ${reason}`);
        return { success: true, token: customToken };
    } catch (error: any) {
        logger.error("Error in getImpersonationToken:", error);
        throw new HttpsError("internal", error.message);
    }
});

// [MODIFIKASI PENYEMPURNAAN LANJUTAN (Batch 3)]
// Menambahkan logika 'tag' (grouping) berdasarkan isi pesan.
// [MODIFIKASI PWA BADGE] Menambahkan totalCount ke payload notifikasi.
export const resetUserSummaryCount = onCall({ region: REGION }, async (request: CallableRequest) => {
    const data = request.data as any;
    const context = { auth: request.auth } as any;
    // @ts-ignore
    const _d = data; const _c = context;
    if (!context.auth) {
        throw new HttpsError("unauthenticated", "Request had no authentication.");
    }
    const uid = context.auth.uid;
    const { fieldToReset } = data; // e.g., "suratBaruCount" or "tugasBaruCount"

    if (!fieldToReset || (fieldToReset !== "suratBaruCount" && fieldToReset !== "tugasBaruCount")) {
        throw new HttpsError("invalid-argument", "Field yang akan di-reset tidak valid.");
    }

    try {
        const summaryRef = db.collection("userSummaries").doc(uid);
        
        // [OPTIMASI] Langsung gunakan set dengan merge: true untuk menghemat 1 read operation
        await summaryRef.set({
            [fieldToReset]: 0
        }, { merge: true });
        
        logger.log(`User ${uid} successfully reset count for ${fieldToReset}.`);
        return { success: true, message: "Hitungan berhasil di-reset." };
    } catch (error: any) {
        logger.error(`Error resetting count for user ${uid} (Field: ${fieldToReset}):`, error);
        throw new HttpsError("internal", error.message);
    }
});


// =================================================================================================
// --- [BARU] FUNGSI HELPER UNTUK NOTIFIKASI TERJADWAL ---
// =================================================================================================

/**
 * Helper baru untuk mengirim notifikasi berdasarkan UID.
 * Mengambil NIP, fcmTokens, dan totalNotifCount sebelum mengirim.
 */