const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore("database-siyap");

async function checkLetter() {
    try {
        const suratSnap = await db.collection('surat')
            .where('perihal', '==', 'Permohonan Bantuan Personel Linmas untuk Kegiatan Estafet Tunas Kelapa (ETK) Tahun 2026')
            .get();

        if (suratSnap.empty) {
            console.log("Surat tidak ditemukan");
            return;
        }

        const docId = suratSnap.docs[0].id;
        console.log("Surat ID:", docId);
        
        const tlSnap = await db.collection('tindakLanjut')
            .where('suratId', '==', docId)
            .get();

        console.log("Jumlah Tindak Lanjut:", tlSnap.size);
        tlSnap.forEach(doc => {
            console.log("- Laporan:", doc.data());
        });
        
    } catch (err) {
        console.error(err);
    }
}
checkLetter();
