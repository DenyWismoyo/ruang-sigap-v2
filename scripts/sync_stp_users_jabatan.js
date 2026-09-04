/**
 * Script Sinkronisasi Master Jabatan & Akun Pegawai BLUD Solo Technopark ke Firestore
 * Menggunakan Firebase Admin SDK & Named Database 'database-siyap'
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

function parseCsvNative(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Regex parsing CSV dengan handle tanda kutip ganda
    const match = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
    const values = [];
    let cur = '';
    let inQuote = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        values.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    values.push(cur.trim().replace(/^"|"$/g, ''));
    
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    results.push(row);
  }
  return results;
}

async function syncStpMaster() {
  console.log('=== MEMULAI SINKRONISASI MASTER BLUD STP ===');

  // Cari OPD Solo Technopark
  const opdSnap = await db.collection('opd').get();
  let stpOpd = null;
  opdSnap.forEach((doc) => {
    const data = doc.data();
    if (
      data.namaOpd?.toLowerCase().includes('solo technopark') ||
      data.namaOpd?.toLowerCase().includes('kawasan sains dan teknologi') ||
      doc.id.toLowerCase().includes('technopark') ||
      doc.id.toLowerCase().includes('stp')
    ) {
      stpOpd = { id: doc.id, ...data };
    }
  });

  if (!stpOpd) {
    console.error('OPD Solo Technopark tidak ditemukan di koleksi "opd". Menggunakan default slug "uptd-kst-solo-technopark".');
    stpOpd = { id: 'uptd-kst-solo-technopark', namaOpd: 'UPTD Kawasan Sains dan Teknologi Solo Technopark' };
  } else {
    console.log(`Ditemukan OPD: ${stpOpd.namaOpd} (ID: ${stpOpd.id})`);
  }

  // 1. SINKRONISASI JABATAN
  console.log('\n--- 1. Memproses Master Jabatan BLUD STP ---');
  const jabatanRows = parseCsvNative(path.join(__dirname, '../public/docs/stp/jabatan_blud_stp.csv'));
  const jabatanNameToId = new Map();

  // Load existing jabatan di OPD ini
  const existingJabatanSnap = await db.collection('jabatan').where('opdId', '==', stpOpd.id).get();
  existingJabatanSnap.forEach((doc) => {
    const data = doc.data();
    if (data.namaJabatan) {
      jabatanNameToId.set(data.namaJabatan.toLowerCase().trim(), doc.id);
    }
  });

  // Pass 1: Buat ID / dokumen untuk setiap jabatan
  for (const row of jabatanRows) {
    const namaJabatan = row.namaJabatan?.trim();
    if (!namaJabatan) continue;

    const key = namaJabatan.toLowerCase().trim();
    let jId = jabatanNameToId.get(key);
    if (!jId) {
      // Slugify
      jId = `${stpOpd.id}_${namaJabatan.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
      jabatanNameToId.set(key, jId);
    }

    const payload = {
      namaJabatan,
      level: parseInt(row.level, 10) || 7,
      opdId: stpOpd.id,
      klasterStruktur: row.klasterStruktur || 'blud',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('jabatan').doc(jId).set(payload, { merge: true });
    console.log(`[JABATAN] Disimpan: "${namaJabatan}" -> ID: ${jId}`);
  }

  // Pass 2: Hubungkan idAtasan
  for (const row of jabatanRows) {
    const namaJabatan = row.namaJabatan?.trim();
    const namaAtasan = row.namaAtasan?.trim();
    if (!namaJabatan) continue;

    const jId = jabatanNameToId.get(namaJabatan.toLowerCase().trim());
    let idAtasan = null;
    if (namaAtasan) {
      idAtasan = jabatanNameToId.get(namaAtasan.toLowerCase().trim()) || null;
    }

    if (jId) {
      await db.collection('jabatan').doc(jId).update({
        idAtasan: idAtasan,
      });
      console.log(`[JABATAN ATASAN] "${namaJabatan}" -> Atasan ID: ${idAtasan || 'PUNCAK'}`);
    }
  }

  // 2. SINKRONISASI PENGGUNA (USERS)
  console.log('\n--- 2. Memproses Akun Pengguna BLUD STP ---');
  const userRows = parseCsvNative(path.join(__dirname, '../public/docs/stp/users_blud_stp.csv'));

  for (const row of userRows) {
    const { namaLengkap, nip, email, password, namaJabatan, role } = row;
    if (!namaLengkap || !nip || !email || !namaJabatan) continue;

    const cleanNip = nip.trim();
    const jabatanId = jabatanNameToId.get(namaJabatan.toLowerCase().trim()) || '';

    let uid = '';
    try {
      const userRecord = await admin.auth().getUserByEmail(email.trim());
      uid = userRecord.uid;
      console.log(`[AUTH] User ditemukan: ${email} -> UID: ${uid}`);
    } catch (authErr) {
      if (authErr.code === 'auth/user-not-found') {
        const newUser = await admin.auth().createUser({
          email: email.trim(),
          password: password ? password.trim() : 'StpUser2026!',
          displayName: namaLengkap.trim(),
        });
        uid = newUser.uid;
        console.log(`[AUTH BARU] User dibuat: ${email} -> UID: ${uid}`);
      } else {
        console.warn(`[AUTH ERROR] ${email}:`, authErr.message);
      }
    }

    const userDocRef = db.collection('users').doc(cleanNip);
    const userPayload = {
      uid: uid || cleanNip,
      namaLengkap: namaLengkap.trim(),
      nip: cleanNip,
      email: email.trim(),
      opdId: stpOpd.id,
      jabatanId: jabatanId,
      namaJabatan: namaJabatan.trim(),
      role: role ? role.trim() : 'user',
      status: 'aktif',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userDocRef.set(userPayload, { merge: true });
    console.log(`[USER FIRESTORE] Sukses: ${namaLengkap} (NIP/ID: ${cleanNip}) -> Jabatan: ${namaJabatan}`);
  }

  console.log('\n=== SINKRONISASI SELESAI DENGAN SUKSES! ===');
}

syncStpMaster().catch((err) => {
  console.error('Terjadi error saat sinkronisasi:', err);
  process.exit(1);
});
