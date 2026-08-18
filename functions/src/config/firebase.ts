import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Inisialisasi Firebase Admin SDK
if (admin.apps.length === 0) {
    admin.initializeApp();
}

// [MIGRASI NAMED DATABASE] Menggunakan Proxy untuk lazy initialization
// Mencegah timeout saat deploy akibat inisialisasi gRPC di global scope
let _db: FirebaseFirestore.Firestore;
export const db = new Proxy({} as FirebaseFirestore.Firestore, {
    get(target, prop) {
        if (!_db) {
            _db = getFirestore(process.env.FIRESTORE_DATABASE || "database-siyap");
        }
        const value = (_db as any)[prop];
        return typeof value === 'function' ? value.bind(_db) : value;
    }
});

let _storage: admin.storage.Storage;
export const storage = new Proxy({} as admin.storage.Storage, {
    get(target, prop) {
        if (!_storage) {
            _storage = admin.storage();
        }
        const value = (_storage as any)[prop];
        return typeof value === 'function' ? value.bind(_storage) : value;
    }
});

// Menetapkan lokasi functions
export const REGION = "asia-southeast2";
