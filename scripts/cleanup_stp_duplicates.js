const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].replace(/^["']|["']$/g, '').trim();
    }
  });
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
} catch (error) {}

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
      if (char === '"') inQuote = !inQuote;
      else if (char === ',' && !inQuote) { values.push(cur.trim().replace(/^"|"$/g, '')); cur = ''; }
      else cur += char;
    }
    values.push(cur.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    results.push(row);
  }
  return results;
}

async function inspectAndCleanupDuplicates() {
  const opdId = 'zHZDTpEuKHsLQJ4TMNgc';
  const csvBlud = parseCsvNative(path.join(__dirname, '../public/docs/stp/users_blud_stp.csv'));
  const csvAsn = parseCsvNative(path.join(__dirname, '../public/docs/stp/users_asn_stp.csv'));

  const validNips = new Set([...csvBlud.map(u => u.nip.trim()), ...csvAsn.map(u => u.nip.trim())]);
  console.log('Total NIP/ID Valid di CSV:', validNips.size);

  const usersSnap = await db.collection('users').where('opdId', '==', opdId).get();
  console.log('Total User di Firestore saat ini:', usersSnap.size);

  const orphanUsers = [];
  usersSnap.forEach(doc => {
    if (!validNips.has(doc.id)) {
      orphanUsers.push({ id: doc.id, ...doc.data() });
    }
  });

  console.log(`Ditemukan ${orphanUsers.length} user lama/duplikat (id NIK lama sebelum migrasi ke Nomor Induk Karyawan):`);
  orphanUsers.forEach(u => {
    console.log(`- Doc ID: ${u.id} | Nama: ${u.namaLengkap} | Email: ${u.email}`);
  });

  if (orphanUsers.length > 0) {
    console.log('\nMembersihkan dokumen user lama agar 100% presisi dan tidak ada duplikasi...');
    for (const u of orphanUsers) {
      await db.collection('users').doc(u.id).delete();
      console.log(`[DELETED] Dokumen lama users/${u.id} (${u.namaLengkap}) dihapus.`);
    }
    console.log('Pembersihan selesai! Total user sekarang tepat:', validNips.size);
  }
}

inspectAndCleanupDuplicates().catch(console.error);
