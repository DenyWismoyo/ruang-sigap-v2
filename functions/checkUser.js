const admin = require("firebase-admin");
const serviceAccount = require("./service-account.json");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore("database-siyap");

async function checkUsers() {
    try {
        const usersSnap = await db.collection('users').get();
        console.log(`Found ${usersSnap.size} users.`);
        let found = false;
        usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.namaLengkap && data.namaLengkap.includes("PRIADI")) {
                console.log("Found PRIADI:", doc.id, data.namaLengkap, "uid:", data.uid);
                found = true;
            }
        });
        if (!found) console.log("Priadi not found");
    } catch(e){
        console.error(e);
    }
}
checkUsers();
