/**
 * Script untuk Menambahkan Akun Admin OPD BLUD Solo Technopark ke Firestore & Firebase Auth
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

async function addAdminUser() {
  console.log('=== MENAMBAHKAN USER ADMIN OPD BLUD SOLO TECHNOPARK ===\n');

  // Cari OPD ID
  const opdSnap = await db.collection('opd').get();
  let stpOpd = null;
  opdSnap.forEach((doc) => {
    const data = doc.data();
    if (
      data.namaOpd?.toLowerCase().includes('solo technopark') ||
      doc.id === 'zHZDTpEuKHsLQJ4TMNgc'
    ) {
      stpOpd = { id: doc.id, ...data };
    }
  });

  if (!stpOpd) {
    console.error('❌ OPD Solo Technopark tidak ditemukan!');
    return;
  }
  console.log(`✅ OPD Terdeteksi: ${stpOpd.namaOpd} (ID: ${stpOpd.id})`);

  const adminData = {
    namaLengkap: 'Admin BLUD Solo Technopark',
    nip: 'admin.blud.stp',
    email: 'admin.blud@solotechnopark.id',
    password: 'StpUser2026!',
    namaJabatan: 'Admin BLUD Solo Technopark',
    role: 'admin_opd',
  };

  // 1. Buat / Update Jabatan Admin
  const jabatanId = `${stpOpd.id}_admin-blud-solo-technopark`;
  const jabatanPayload = {
    namaJabatan: adminData.namaJabatan,
    level: 6,
    opdId: stpOpd.id,
    klasterStruktur: 'blud',
    idAtasan: null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection('jabatan').doc(jabatanId).set(jabatanPayload, { merge: true });
  console.log(`✅ Jabatan Admin Disimpan: "${adminData.namaJabatan}" (ID: ${jabatanId})`);

  // 2. Buat / Ambil Akun Firebase Auth
  let uid = '';
  try {
    const userRecord = await admin.auth().getUserByEmail(adminData.email);
    uid = userRecord.uid;
    console.log(`✅ Firebase Auth User Ditemukan: ${adminData.email} (UID: ${uid})`);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      const newUser = await admin.auth().createUser({
        email: adminData.email,
        password: adminData.password,
        displayName: adminData.namaLengkap,
      });
      uid = newUser.uid;
      console.log(`✅ Firebase Auth User Baru Dibuat: ${adminData.email} (UID: ${uid})`);
    } else {
      throw err;
    }
  }

  // 3. Simpan ke Firestore users collection
  const userDocRef = db.collection('users').doc(adminData.nip);
  const userPayload = {
    uid: uid,
    namaLengkap: adminData.namaLengkap,
    nip: adminData.nip,
    email: adminData.email,
    opdId: stpOpd.id,
    jabatanId: jabatanId,
    namaJabatan: adminData.namaJabatan,
    role: adminData.role,
    status: 'aktif',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await userDocRef.set(userPayload, { merge: true });
  console.log(`✅ Firestore User Document Disimpan: doc('users/${adminData.nip}')`);
  console.log('\n--- Detail Akun Baru ---');
  console.log(`Nama      : ${adminData.namaLengkap}`);
  console.log(`Email     : ${adminData.email}`);
  console.log(`NIP / ID  : ${adminData.nip}`);
  console.log(`Password  : ${adminData.password}`);
  console.log(`Role      : ${adminData.role}`);
  console.log(`Jabatan   : ${adminData.namaJabatan}`);
  console.log(`OPD       : ${stpOpd.namaOpd} (${stpOpd.id})`);
  console.log('\n=== SUKSES MEMASUKKAN ADMIN OPD BLUD STP KE FIRESTORE! ===');
}

addAdminUser().catch(console.error);
