const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore("database-siyap");

async function fixSelesaiMandiri() {
    console.log("Mulai scan surat Selesai Mandiri...");
    try {
        const selesaiSnap = await db.collection('surat')
            .where('statusPenyelesaian', '==', 'Selesai')
            .get();

        let count = 0;
        console.log(`Ditemukan total ${selesaiSnap.size} surat berstatus Selesai. Memeriksa infoTampilan...`);

        for (const doc of selesaiSnap.docs) {
            const docData = doc.data();
            
            // Re-run for those we already marked as "Pimpinan" OR missing
            if (!docData.infoTampilan || !docData.infoTampilan.recipientNames || docData.infoTampilan.recipientNames === "Pimpinan") {
                const tlSnap = await db.collection('tindakLanjut')
                    .where('suratId', '==', doc.id)
                    .get();

                if (!tlSnap.empty) {
                    let mandiriTl = null;
                    tlSnap.forEach(t => {
                        if (t.data().judulLaporan === 'Tindak Lanjut Mandiri' || t.data().disposisiId === 'mandiri') {
                            mandiriTl = t.data();
                        }
                    });

                    if (mandiriTl) {
                        const userId = mandiriTl.userId;
                        let userName = "Pimpinan"; 
                        
                        if (userId) {
                            // Fetch by uid instead of docId
                            const userQuery = await db.collection('users').where('uid', '==', userId).limit(1).get();
                            if (!userQuery.empty) {
                                userName = userQuery.docs[0].data().namaLengkap;
                            }
                        }

                        if (!docData.infoTampilan) {
                            await doc.ref.set({
                                infoTampilan: { recipientNames: userName }
                            }, { merge: true });
                        } else {
                            await doc.ref.update({
                                'infoTampilan.recipientNames': userName
                            });
                        }
                        
                        console.log(`- Surat ${docData.perihal.substring(0,30)}... diupdate -> Kepada: ${userName}`);
                        count++;
                    }
                }
            }
        }

        console.log(`\nSelesai! Berhasil memperbaiki ${count} surat.`);
        process.exit(0);
    } catch (error) {
        console.error("Terjadi error:", error);
        process.exit(1);
    }
}

fixSelesaiMandiri();
