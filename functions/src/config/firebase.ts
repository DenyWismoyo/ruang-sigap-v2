import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Inisialisasi Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// [MIGRASI NAMED DATABASE] Menggunakan getFirestore untuk spesifikasi database
export const db = getFirestore(process.env.FIRESTORE_DATABASE || "database-siyap");
export const storage = admin.storage();

// Menetapkan lokasi functions
export const REGION = "asia-southeast2";
