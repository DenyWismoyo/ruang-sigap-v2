import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import * as crypto from "crypto";
import { db, REGION } from "./config/firebase";

const mayarApiKey = defineSecret("MAYAR_API_KEY");
const mayarWebhookSecret = defineSecret("MAYAR_WEBHOOK_SECRET");

export const EKINERJA_PLAN = {
  packageId: "EKINERJA_PREMIUM_MONTHLY" as const,
  packageName: "Langganan Jembatan e-Kinerja BKPSDM Solo (1 Bulan)",
  price: 50000,
  durationDays: 30,
};

// ============================================================================
// FUNGSI 1: MEMBUAT LINK PEMBAYARAN INVOICE (MAYAR CHECKOUT)
// ============================================================================
export const createEkinerjaPaymentInvoice = onCall(
  {
    memory: "256MiB",
    region: REGION,
    secrets: [mayarApiKey],
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Akses ditolak. Anda harus login.");
    }

    const uid = request.auth.uid;
    const userEmail = request.data?.userEmail || request.auth.token.email || "";
    const userName = request.data?.userName || request.auth.token.name || "Pegawai ASN";

    const transactionId = `EKIN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const txRef = db.collection("transactions").doc(transactionId);

    try {
      const apiKey = mayarApiKey.value();
      if (!apiKey) {
        throw new Error("MAYAR_API_KEY belum dikonfigurasi pada environment Cloud Functions.");
      }

      const response = await fetch("https://api.mayar.id/hl/v1/payment/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          amount: EKINERJA_PLAN.price,
          mobile: "081234567890",
          description: EKINERJA_PLAN.packageName,
          redirectUrl: `https://sgp.omnifit.cloud/dashboard/sigap/logbook?payment=success&tx=${transactionId}`,
          expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          customField: transactionId,
          custom_field: transactionId,
          reference_id: transactionId,
          referenceId: transactionId,
        }),
      });

      const mayarData = await response.json();
      if (!response.ok || mayarData.statusCode !== 200) {
        throw new Error(mayarData.message || "Gagal membuat invoice di Mayar");
      }

      const paymentLink = mayarData.data?.link || null;
      const mayarTxId = mayarData.data?.id || null;

      await txRef.set({
        transactionId,
        userId: uid,
        userEmail,
        userName,
        packageId: EKINERJA_PLAN.packageId,
        packageName: EKINERJA_PLAN.packageName,
        amount: EKINERJA_PLAN.price,
        status: "PENDING",
        mayarTransactionId: mayarTxId,
        paymentLink,
        quotaGranted: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        transactionId,
        paymentLink,
        amount: EKINERJA_PLAN.price,
      };
    } catch (error: any) {
      console.error("[createEkinerjaPaymentInvoice] Error:", error);
      throw new HttpsError("internal", error.message || "Terjadi kegagalan komunikasi dengan Mayar");
    }
  }
);

// ============================================================================
// FUNGSI 2: GENERATE QRIS DINAMIS MAYAR
// ============================================================================
export const createEkinerjaDynamicQris = onCall(
  {
    memory: "256MiB",
    region: REGION,
    secrets: [mayarApiKey],
    cors: true,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Akses ditolak. Anda harus login.");
    }

    const uid = request.auth.uid;
    const userEmail = request.data?.userEmail || request.auth.token.email || "";
    const userName = request.data?.userName || request.auth.token.name || "Pegawai ASN";

    const transactionId = `EKIN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const txRef = db.collection("transactions").doc(transactionId);

    try {
      const apiKey = mayarApiKey.value();
      if (!apiKey) {
        throw new Error("MAYAR_API_KEY belum dikonfigurasi.");
      }

      const response = await fetch("https://api.mayar.id/hl/v1/qrcode/create", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: EKINERJA_PLAN.price,
          reference_id: transactionId,
          referenceId: transactionId,
          customField: transactionId,
          custom_field: transactionId,
          email: userEmail,
          name: userName,
        }),
      });

      const mayarData = await response.json();
      if (!response.ok || mayarData.statusCode !== 200) {
        throw new Error(mayarData.message || "Gagal membuat QRIS Dinamis Mayar");
      }

      const qrUrl = mayarData.data?.url || null;

      await txRef.set({
        transactionId,
        userId: uid,
        userEmail,
        userName,
        packageId: EKINERJA_PLAN.packageId,
        packageName: EKINERJA_PLAN.packageName,
        amount: EKINERJA_PLAN.price,
        status: "PENDING",
        qrCodeUrl: qrUrl,
        quotaGranted: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        transactionId,
        qrCodeUrl: qrUrl,
        amount: EKINERJA_PLAN.price,
      };
    } catch (error: any) {
      console.error("[createEkinerjaDynamicQris] Error:", error);
      throw new HttpsError("internal", error.message || "Gagal menghubungi Mayar QR API");
    }
  }
);

// ============================================================================
// FUNGSI 3: WEBHOOK MAYAR DENGAN IDEMPOTENCY & ROLLOVER EXPIRY
// ============================================================================
export const mayarWebhook = onRequest(
  {
    region: REGION,
    cors: true,
    secrets: [mayarWebhookSecret],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    // --- Webhook Signature Verification (HMAC) ---
    const secret = mayarWebhookSecret.value();
    if (secret) {
      const signatureHeader = (req.headers['x-mayar-signature'] || req.headers['x-webhook-signature']) as string | undefined;
      if (signatureHeader && (req as any).rawBody) {
        const hmac = crypto.createHmac('sha256', secret);
        const digest = hmac.update((req as any).rawBody).digest('hex');
        if (signatureHeader !== digest) {
          console.error("❌ [WEBHOOK] Invalid signature detected.");
          res.status(401).send('Unauthorized');
          return;
        }
      }
    }

    let payload = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch(e) {}
    }

    console.log("📥 [WEBHOOK MAYAR] Payload:", JSON.stringify(payload));

    // Bypass event testing / ping dari dashboard Mayar
    if (payload?.event === "testing" || payload?.event === "ping") {
      res.status(200).send({ status: "success", message: "Webhook connection test successful" });
      return;
    }

    const mayarTx = payload.data ? payload.data : payload;

    // Pencocokan Reference ID Transaksi
    let exactTxId = mayarTx.reference_id || mayarTx.referenceId || payload.reference_id;
    if (!exactTxId && typeof mayarTx.customField === 'string') exactTxId = mayarTx.customField;
    if (!exactTxId && typeof mayarTx.custom_field === 'string') exactTxId = mayarTx.custom_field;

    let txDocRef: admin.firestore.DocumentReference | null = null;
    let txData: any = null;

    if (exactTxId && typeof exactTxId === 'string') {
      try {
        const docSnap = await db.collection("transactions").doc(exactTxId).get();
        if (docSnap.exists) {
          txDocRef = docSnap.ref;
          txData = docSnap.data();
        }
      } catch (e) {
        console.warn(`[WEBHOOK] Gagal membaca transaksi by ID: ${exactTxId}`);
      }
    }

    // Fallback: cari berdasarkan mayarTransactionId
    if (!txDocRef) {
      const possibleIds = [mayarTx.productId, mayarTx.id, payload.productId, mayarTx.paymentLinkId].filter(Boolean);
      for (const pId of possibleIds) {
        try {
          const q = await db.collection("transactions").where("mayarTransactionId", "==", pId).limit(1).get();
          if (!q.empty) {
            txDocRef = q.docs[0].ref;
            txData = q.docs[0].data();
            break;
          }
        } catch (e) {}
      }
    }

    if (!txDocRef || !txData) {
      console.warn("⚠️ [WEBHOOK] Transaksi tidak ditemukan di Firestore");
      res.status(400).send('Transaction Not Found');
      return;
    }

    const currentStatus = String(mayarTx.status || "").toUpperCase();
    const transactionStatus = String(mayarTx.transactionStatus || "").toUpperCase();
    const eventType = String(payload.event || "").toLowerCase();

    const isPaymentSuccess =
      ['SUCCESS', 'SETTLED', 'PAID', 'COMPLETED'].includes(currentStatus) ||
      ['PAID', 'SETTLED', 'SUCCESS'].includes(transactionStatus);
    const isSuccessEvent = !eventType || eventType.includes('success') || eventType.includes('paid') || eventType.includes('settled') || eventType.includes('completed');

    if (!isPaymentSuccess || !isSuccessEvent) {
      console.log(`[WEBHOOK] Event diabaikan (bukan status sukses). Status: ${currentStatus}/${transactionStatus}`);
      res.status(200).send({ status: "ignored", message: "Non-payment event received" });
      return;
    }

    try {
      await db.runTransaction(async (trx) => {
        const freshTxSnap = await trx.get(txDocRef!);
        if (!freshTxSnap.exists) {
          throw new Error("Dokumen transaksi hilang saat diproses.");
        }

        const freshTxData = freshTxSnap.data()!;

        // ✅ IDEMPOTENCY GUARD
        if (freshTxData.status === 'PAID' || freshTxData.quotaGranted === true) {
          console.log(`[WEBHOOK] Transaksi ${txDocRef!.id} sudah PAID. Webhook duplikat diabaikan.`);
          return;
        }

        const userId = freshTxData.userId;
        if (!userId) {
          console.error(`[WEBHOOK] Transaksi ${txDocRef!.id} tidak memiliki userId.`);
          trx.update(txDocRef!, {
            status: "PAID",
            paidAt: FieldValue.serverTimestamp(),
            quotaGranted: false,
            error: "MISSING_USER_ID",
          });
          return;
        }

        // Cari user doc di koleksi users: cek doc ID langsung atau query by field 'uid'
        let userDocRef = db.collection("users").doc(userId);
        let userSnap = await trx.get(userDocRef);

        if (!userSnap.exists) {
          const userQuerySnap = await db.collection("users").where("uid", "==", userId).limit(1).get();
          if (!userQuerySnap.empty) {
            userDocRef = userQuerySnap.docs[0].ref;
            userSnap = await trx.get(userDocRef);
          }
        }

        // ✅ LOGIKA ROLLOVER: Jika user masih memiliki masa aktif, tambahkan 30 hari dari tanggal kedaluwarsa lama
        let baseDate = new Date();
        if (userSnap.exists) {
          const userData = userSnap.data() || {};
          const currentExpiry = userData.ekinerjaSubscription?.activeUntil?.toDate ? userData.ekinerjaSubscription.activeUntil.toDate() : null;
          if (currentExpiry && currentExpiry.getTime() > Date.now()) {
            baseDate = currentExpiry;
          }
        }

        const newExpiryDate = new Date(baseDate.getTime() + EKINERJA_PLAN.durationDays * 24 * 60 * 60 * 1000);
        const newExpiryTimestamp = Timestamp.fromDate(newExpiryDate);

        // Update status transaksi menjadi PAID + quotaGranted = true
        trx.update(txDocRef!, {
          status: "PAID",
          paidAt: FieldValue.serverTimestamp(),
          paymentMethod: mayarTx.paymentMethod || mayarTx.payment_method || "GATEWAY",
          paymentChannel: "MAYAR",
          quotaGranted: true,
          quotaGrantedAt: FieldValue.serverTimestamp(),
        });

        // Update dokumen user untuk mengaktifkan akses e-kinerja
        if (userSnap.exists) {
          trx.update(userDocRef, {
            ekinerjaSubscription: {
              isActive: true,
              status: "ACTIVE",
              planId: EKINERJA_PLAN.packageId,
              activeUntil: newExpiryTimestamp,
              lastPaidAt: FieldValue.serverTimestamp(),
              lastTransactionId: txDocRef!.id,
              amount: freshTxData.amount || EKINERJA_PLAN.price,
            }
          });
        }

        console.log(`[WEBHOOK] ✅ e-Kinerja Premium diaktifkan untuk user ${userId} hingga ${newExpiryDate.toISOString()}`);
      });

      res.status(200).send({ status: "success", message: "Webhook processed successfully" });
    } catch (error: any) {
      console.error("❌ [WEBHOOK EXECUTION ERROR]:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);
