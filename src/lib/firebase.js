// Lokasi: src/lib/firebase.js
// [UPDATE FASE 6 - PILAR 1]: Menerapkan Persistent Local Cache (Multi-Tab) & Named Database
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore"; 
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// [PERBAIKAN]: Tambahkan kata 'export' di depan const app
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Inisialisasi Firestore dengan Named Database
export const db = (() => {
  const dbName = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || "database-siyap";
  if (typeof window !== "undefined") {
    try {
      const firestoreInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      }, dbName); 
      console.log(`Mode offline Firestore (Multi-Tab Cache) aktif [${dbName}].`);
      return firestoreInstance;
    } catch (error) {
      console.warn("Gagal mengaktifkan Multi-Tab Cache, fallback ke getFirestore", error);
      return getFirestore(app, dbName);
    }
  } else {
    // SSR / API Routes
    return getFirestore(app, dbName);
  }
})();

// Inisialisasi Cloud Functions (Wajib region asia-southeast2 sesuai arsitektur)
export const functions = getFunctions(app, "asia-southeast2");

// Inisialisasi Storage
export const storage = getStorage(app);

// Inisialisasi Messaging (Push Notifications)
export let messaging;
if (typeof window !== "undefined") {
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.error("Gagal menginisialisasi Firebase Messaging:", err);
  }
}

import { httpsCallable } from "firebase/functions";

// Ekspor custom httpsCallable untuk development
export const callCloudFunction = (functionName) => {
  return httpsCallable(functions, functionName);
};

// Export utils agar mempermudah import di file lain
export { ref, uploadBytesResumable, getDownloadURL, getToken, onMessage };