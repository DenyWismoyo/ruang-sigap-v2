const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore("database-siyap");

async function checkDoc() {
    try {
        const suratSnap = await db.collection('surat')
            .where('perihal', '==', 'Permohonan Bantuan Personel Linmas untuk Kegiatan Estafet Tunas Kelapa (ETK) Tahun 2026')
            .get();
            
        console.log(suratSnap.docs[0].data());
    } catch(e){}
}
checkDoc();
