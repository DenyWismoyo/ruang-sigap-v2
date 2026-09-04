const admin = require('firebase-admin');
const fs = require('fs');

const envConfig = fs.readFileSync('.env.local', 'utf8');
envConfig.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    process.env[match[1].trim()] = match[2].replace(/^["']|["']$/g, '').trim();
  }
});

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  })
});

const db = admin.firestore();
const dbName = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || 'database-siyap';
db.settings({ databaseId: dbName, ignoreUndefinedProperties: true });

async function check() {
  const snap = await db.collection('users').where('role', '==', 'admin_opd').limit(5).get();
  snap.forEach(d => {
    const data = d.data();
    console.log('Sample Admin OPD:', data.namaLengkap, '| Email:', data.email, '| NIP:', data.nip, '| DocID:', d.id, '| Jabatan:', data.namaJabatan, '| OPD:', data.opdId);
  });
}

check().catch(console.error);
