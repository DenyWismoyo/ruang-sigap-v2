/**
 * Script untuk menghapus user yang sudah keluar dari Firestore dan Firebase Auth
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Baca .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let val = match[2].replace(/^["']|["']$/g, '').trim();
      process.env[match[1].trim()] = val;
    }
  });
}

// 2. Inisialisasi Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
} catch (error) {
  if (!/already exists/.test(error.message)) {
    console.error('Firebase initialization error', error.stack);
  }
}

const db = admin.firestore();
const dbName = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || 'database-siyap';
db.settings({ databaseId: dbName, ignoreUndefinedProperties: true });

async function deleteUsers() {
  const targets = [
    { name: 'Dio Achmad Thoriq', nip: '3372012009020002', email: 'dio.achmad@solotechnopark.id' },
    { name: 'Tammarizqi Arsyinta Putrie', nip: '3317077103020001', email: 'tammarizqi.arsyinta@solotechnopark.id' },
  ];

  console.log('=== MEMULAI PENGHAPUSAN USER KELUAR ===');

  for (const t of targets) {
    // 1. Hapus dari Firestore 'users'
    try {
      await db.collection('users').doc(t.nip).delete();
      console.log(`[FIRESTORE] Dokumen users/${t.nip} (${t.name}) berhasil dihapus.`);
    } catch (e) {
      console.warn(`[FIRESTORE ERROR] Gagal menghapus doc ${t.nip}:`, e.message);
    }

    // 2. Hapus dari Firebase Auth
    try {
      const userRecord = await admin.auth().getUserByEmail(t.email);
      if (userRecord) {
        await admin.auth().deleteUser(userRecord.uid);
        console.log(`[AUTH] User Auth ${t.email} (UID: ${userRecord.uid}) berhasil dihapus.`);
      }
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found') {
        console.log(`[AUTH] User Auth ${t.email} tidak ditemukan di Firebase Auth (sudah bersih).`);
      } else {
        console.warn(`[AUTH ERROR] Gagal menghapus auth ${t.email}:`, authErr.message);
      }
    }
  }

  console.log('=== PENGHAPUSAN SELESAI ===');
}

deleteUsers().catch(console.error);
