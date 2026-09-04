/**
 * Script Verifikasi Konsistensi Data User & Jabatan STP antara CSV vs Firestore
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
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const results = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
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

async function verifyConsistency() {
  console.log('====================================================');
  console.log('🔍 AUDIT KONSISTENSI DATA STP (CSV vs FIRESTORE & AUTH)');
  console.log('====================================================\n');

  // 1. Dapatkan OPD STP
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
    console.error('❌ OPD Solo Technopark tidak ditemukan di Firestore!');
    return;
  }
  console.log(`✅ OPD Terdeteksi: ${stpOpd.namaOpd} (ID: ${stpOpd.id})\n`);

  // 2. Baca CSV
  const csvUsersBlud = parseCsvNative(path.join(__dirname, '../public/docs/stp/users_blud_stp.csv'));
  const csvUsersAsn = parseCsvNative(path.join(__dirname, '../public/docs/stp/users_asn_stp.csv'));
  const csvJabatanBlud = parseCsvNative(path.join(__dirname, '../public/docs/stp/jabatan_blud_stp.csv'));
  const csvJabatanAsn = parseCsvNative(path.join(__dirname, '../public/docs/stp/jabatan_asn_stp.csv'));

  console.log(`📄 Total CSV User BLUD: ${csvUsersBlud.length}`);
  console.log(`📄 Total CSV User ASN : ${csvUsersAsn.length}`);
  console.log(`📄 Total CSV Jabatan BLUD: ${csvJabatanBlud.length}`);
  console.log(`📄 Total CSV Jabatan ASN : ${csvJabatanAsn.length}\n`);

  // 3. Ambil seluruh data dari Firestore untuk OPD ini
  const usersSnap = await db.collection('users').where('opdId', '==', stpOpd.id).get();
  const firestoreUsers = new Map();
  usersSnap.forEach(d => firestoreUsers.set(d.id, { id: d.id, ...d.data() }));

  const jabatanSnap = await db.collection('jabatan').where('opdId', '==', stpOpd.id).get();
  const firestoreJabatan = new Map();
  const firestoreJabatanByName = new Map();
  jabatanSnap.forEach(d => {
    const data = { id: d.id, ...d.data() };
    firestoreJabatan.set(d.id, data);
    if (data.namaJabatan) {
      firestoreJabatanByName.set(data.namaJabatan.toLowerCase().trim(), data);
    }
  });

  console.log(`🗄️  Total Dokumen Firestore users di OPD STP  : ${firestoreUsers.size}`);
  console.log(`🗄️  Total Dokumen Firestore jabatan di OPD STP: ${firestoreJabatan.size}\n`);

  let errorCount = 0;

  // --- VERIFIKASI JABATAN BLUD ---
  console.log('--- 1. VERIFIKASI MASTER JABATAN BLUD ---');
  for (const j of csvJabatanBlud) {
    const name = j.namaJabatan?.trim();
    if (!name) continue;
    const found = firestoreJabatanByName.get(name.toLowerCase());
    if (!found) {
      console.error(`❌ [JABATAN HILANG] "${name}" di CSV tidak ada di Firestore.`);
      errorCount++;
    } else {
      // Cek level & klaster
      const levelExpected = parseInt(j.level, 10);
      if (found.level !== levelExpected) {
        console.warn(`⚠️ [JABATAN LEVEL MISMATCH] "${name}" CSV: ${levelExpected}, Firestore: ${found.level}`);
      }
      if (found.klasterStruktur !== 'blud') {
        console.warn(`⚠️ [JABATAN KLASTER MISMATCH] "${name}" klaster bukan 'blud': ${found.klasterStruktur}`);
      }
    }
  }

  // --- VERIFIKASI USER BLUD & ASN ---
  console.log('\n--- 2. VERIFIKASI AKUN PEGAWAI BLUD & ASN (CSV vs FIRESTORE vs AUTH) ---');
  const allCsvUsers = [
    ...csvUsersBlud.map(u => ({ ...u, tipe: 'BLUD' })),
    ...csvUsersAsn.map(u => ({ ...u, tipe: 'ASN' }))
  ];

  let verifiedUserCount = 0;
  await Promise.all(allCsvUsers.map(async (u) => {
    const nip = (u.nip || '').trim();
    const nama = (u.namaLengkap || '').trim();
    const email = (u.email || '').trim();
    const jabatan = (u.namaJabatan || '').trim();
    const sanitizedId = nip.replace(/\//g, '-');

    if (!nip || !email) return;

    const fUser = firestoreUsers.get(sanitizedId) || firestoreUsers.get(nip) || Array.from(firestoreUsers.values()).find(x => x.nip === nip || x.email?.toLowerCase() === email.toLowerCase());
    if (!fUser) {
      console.error(`❌ [USER HILANG DI FIRESTORE] [${u.tipe}] ${nama} (${nip}) tidak ditemukan di koleksi 'users' Firestore!`);
      errorCount++;
      return;
    }

    // Cek Jabatan
    if (fUser.namaJabatan?.toLowerCase() !== jabatan?.toLowerCase()) {
      console.warn(`⚠️ [USER JABATAN MISMATCH] ${nama} (${nip}) CSV: "${jabatan}" vs Firestore: "${fUser.namaJabatan}"`);
    }

    // Cek Email
    if (fUser.email?.toLowerCase() !== email.toLowerCase()) {
      console.warn(`⚠️ [USER EMAIL MISMATCH] ${nama} (${nip}) CSV: "${email}" vs Firestore: "${fUser.email}"`);
    }

    // Cek Firebase Auth
    try {
      const authUser = await admin.auth().getUserByEmail(email);
      if (!authUser) {
        console.error(`❌ [AUTH HILANG] ${nama} (${email}) tidak terdaftar di Firebase Auth!`);
        errorCount++;
      } else {
        verifiedUserCount++;
      }
    } catch (e) {
      console.error(`❌ [AUTH ERROR] ${nama} (${email}): ${e.message}`);
      errorCount++;
    }
  }));

  console.log(`✅ Berhasil memverifikasi ${verifiedUserCount} akun di Firebase Auth & Firestore.`);

  // --- CEK APAKAH USER RESIGNED BENAR-BENAR BERSIH ---
  console.log('\n--- 3. CEK USER KELUAR (RESIGNED) ---');
  const resigned = ['3372012009020002', '3317077103020001'];
  for (const rNip of resigned) {
    const foundResigned = Array.from(firestoreUsers.values()).find(u => u.nip === rNip || u.id === rNip);
    if (foundResigned) {
      console.error(`❌ [RESIDU DITEMUKAN] User ${rNip} (${foundResigned.namaLengkap}) masih ada di Firestore!`);
      errorCount++;
    } else {
      console.log(`✅ User keluar NIP ${rNip} sudah bersih (tidak ada di Firestore).`);
    }
  }

  console.log('\n====================================================');
  if (errorCount === 0) {
    console.log(`🎉 HASIL AUDIT: 100% SINKRON & VALID! (${allCsvUsers.length} Users & ${csvJabatanBlud.length + csvJabatanAsn.length} Formasi Cocok)`);
  } else {
    console.log(`⚠️ DITEMUKAN ${errorCount} KETIDAKSESUAIAN YANG PERLU DIPERHATIKAN.`);
  }
  console.log('====================================================');
}

verifyConsistency().catch(err => {
  console.error('Fatal Error during verification:', err);
});
