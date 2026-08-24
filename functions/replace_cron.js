const fs = require('fs');

const path = 'd:\\Project\\RUANG SIGAP\\functions\\src\\cron\\index.ts';
let code = fs.readFileSync(path, 'utf8');

const target1 = `                        const disposisiQuery = db.collection("disposisi")
                            .where("suratId", "==", surat.id).orderBy("tanggalDisposisi", "desc").limit(1);
                        const disposisiSnapshot = await transaction.get(disposisiQuery);
                        if (!disposisiSnapshot.empty) {
                            const latestDisposisi = disposisiSnapshot.docs[0].data() as Disposisi;
                            const recipientJabatanIds = latestDisposisi.kepadaJabatanId;
                            const usersQuery = await db.collection("users").where("jabatanId", "in", recipientJabatanIds).get();
                            logger.log(\`Found \${usersQuery.size} users to notify for reminder \${surat.id}.\`);
                            usersQuery.forEach(userDoc => {
                                const user = userDoc.data() as UserProfile;
                                const notifRef = db.collection("notifications").doc();
                                transaction.set(notifRef, {
                                    userId: user.uid,
                                    userNip: user.nip,
                                    message: \`PENGINGAT: Undangan "\${surat.perihal}" akan dimulai sekitar 1 jam lagi pukul \${surat.detailAgenda?.jam}.\`,
                                    link: \`/dashboard/surat/\${surat.id}\`, isRead: false,
                                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                                });
                            });
                        } else {
                             logger.log(\`No disposisi found for surat \${surat.id}. Reminder not sent to recipients.\`);
                        }`;

const replace1 = `                        const freshSurat = freshDoc.data() as Surat;
                        const targetJabatanIds = freshSurat.terlibatJabatanIds && freshSurat.terlibatJabatanIds.length > 0 
                            ? freshSurat.terlibatJabatanIds 
                            : (freshSurat.tujuanJabatanId ? [freshSurat.tujuanJabatanId] : []);
                        
                        if (targetJabatanIds.length > 0) {
                            const batchedJabatanIds = targetJabatanIds.slice(0, 30);
                            const usersQuery = await db.collection("users").where("jabatanId", "in", batchedJabatanIds).where("status", "==", "aktif").get();
                            logger.log(\`Found \${usersQuery.size} users to notify for reminder \${surat.id}.\`);
                            
                            const uidsToPush: string[] = [];

                            usersQuery.forEach(userDoc => {
                                const user = userDoc.data() as UserProfile;
                                uidsToPush.push(user.uid);
                                const notifRef = db.collection("notifications").doc();
                                transaction.set(notifRef, {
                                    userId: user.uid,
                                    userNip: user.nip,
                                    message: \`PENGINGAT: Undangan "\${surat.perihal}" akan dimulai sekitar 1 jam lagi pukul \${surat.detailAgenda?.jam}.\`,
                                    link: \`/dashboard/surat/\${surat.id}\`, isRead: false,
                                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                                });
                            });
                            
                            uidsToPush.forEach(uid => {
                                sendFcmMessageByUid(
                                    uid,
                                    "PENGINGAT UNDANGAN",
                                    \`Undangan "\${surat.perihal}" akan dimulai sekitar 1 jam lagi pukul \${surat.detailAgenda?.jam}.\`,
                                    \`/dashboard/surat/\${surat.id}\`,
                                    "pengingat-undangan",
                                    undefined,
                                    "pushSuratMasuk"
                                ).catch(e => logger.error(\`Failed to send FCM to \${uid}\`, e));
                            });
                        } else {
                             logger.log(\`No terlibatJabatanIds found for surat \${surat.id}. Reminder not sent to recipients.\`);
                        }`;

const target2 = `            const invitationsToArchiveQuery = db.collection("surat")
                .where("jenisSurat", "==", "Undangan")
                .where("statusPenyelesaian", "!=", "Diarsipkan")
                .where("detailAgenda.tanggal", "<", todayTimestamp);`;

const replace2 = `            const invitationsToArchiveQuery = db.collection("surat")
                .where("jenisSurat", "==", "Undangan")
                .where("statusPenyelesaian", "==", "Selesai") // Hanya arsipkan jika staf sudah menyelesaikannya
                .where("detailAgenda.tanggal", "<", todayTimestamp);`;

code = code.replace(target1, replace1);
code = code.replace(target2, replace2);

fs.writeFileSync(path, code);
console.log("Done");
