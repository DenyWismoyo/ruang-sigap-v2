const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Parser .env manual
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      let val = match[2].replace(/^["']|["']$/g, '').trim(); // Hilangkan petik
      process.env[match[1].trim()] = val;
    }
  });
}

// Initialize Firebase Admin
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
const storage = admin.storage();
// Gunakan named database sesuai konfigurasi aplikasi
const dbName = process.env.NEXT_PUBLIC_FIRESTORE_DATABASE || 'database-siyap';
db.settings({ databaseId: dbName, ignoreUndefinedProperties: true });

async function healStorageTokens() {
  console.log('Memulai proses penyembuhan token Storage...');
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const snapshot = await db.collection('surat')
      .where('tanggalDiterima', '>=', admin.firestore.Timestamp.fromDate(threeDaysAgo))
      .get();
    let healedCount = 0;
    let skippedCount = 0;
    
    console.log(`Ditemukan ${snapshot.size} dokumen surat.`);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const fileUrl = data.fileUrl;
      
      if (!fileUrl || !fileUrl.includes('firebasestorage.googleapis.com')) {
        continue;
      }
      
      try {
        // Parsing URL untuk mendapatkan Bucket, File Path, dan Token
        const urlObj = new URL(fileUrl);
        const token = urlObj.searchParams.get('token');
        
        if (!token) {
          continue; // Tidak ada token di URL, skip
        }
        
        // Contoh PathName: /v0/b/wsmy-lab.firebasestorage.app/o/surat%2F1723821033019_Surat_Undangan.pdf
        const pathSegments = urlObj.pathname.split('/');
        const bIndex = pathSegments.indexOf('b');
        const oIndex = pathSegments.indexOf('o');
        
        if (bIndex === -1 || oIndex === -1) continue;
        
        const bucketName = pathSegments[bIndex + 1];
        const encodedFilePath = pathSegments.slice(oIndex + 1).join('/');
        const filePath = decodeURIComponent(encodedFilePath);
        
        const bucket = storage.bucket(bucketName);
        const file = bucket.file(filePath);
        
        // Periksa apakah file eksis
        const [exists] = await file.exists();
        if (!exists) {
          console.log(`[SKIPPED] Surat ID: ${doc.id} - File tidak ditemukan di storage: ${filePath}`);
          skippedCount++;
          continue;
        }
        
        const [metadata] = await file.getMetadata();
        const existingToken = metadata.metadata?.firebaseStorageDownloadTokens;
        
        if (!existingToken || !existingToken.includes(token)) {
          // Token hilang atau berbeda, lakukan inject ulang!
          await file.setMetadata({
            metadata: {
              firebaseStorageDownloadTokens: token // Inject token asli
            }
          });
          console.log(`[HEALED] Surat ID: ${doc.id} - Token berhasil dikembalikan ke file: ${filePath}`);
          healedCount++;
        } else {
          // Token sudah ada dan cocok
          skippedCount++;
        }
        
      } catch (e) {
        console.error(`Gagal memproses Surat ID: ${doc.id}`, e.message);
      }
    }
    
    console.log('--------------------------------------------------');
    console.log(`Proses Selesai. Disembuhkan: ${healedCount}, Dilewati (Normal/Hilang): ${skippedCount}`);
    
  } catch (error) {
    console.error('Gagal menjalankan auto heal:', error);
  }
}

healStorageTokens();
