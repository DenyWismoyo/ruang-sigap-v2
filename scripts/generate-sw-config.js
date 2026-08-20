const fs = require('fs');
const path = require('path');

// Pastikan file ini tidak dijalankan di environment yang salah, tapi kita panggil di build.
require('dotenv').config({ path: '.env.local' }); // Coba muat .env.local jika ada (untuk local development)

const configContent = `// [GENERATE OTOMATIS SAAT BUILD]
// File ini HANYA untuk di-load oleh service worker (firebase-messaging-sw.js)
// File ini tidak boleh di-commit ke Git.

const firebaseConfig = {
  apiKey: "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}",
  authDomain: "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}",
  projectId: "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}",
  storageBucket: "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}",
  messagingSenderId: "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}",
  appId: "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}",
  measurementId: "${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''}"
};
`;

const outputPath = path.join(__dirname, '../public/firebase-config.js');

try {
  fs.writeFileSync(outputPath, configContent);
  console.log('✅ Berhasil men-generate public/firebase-config.js untuk Service Worker');
} catch (error) {
  console.error('❌ Gagal men-generate firebase-config.js:', error);
  process.exit(1);
}
