"use client";

import { useEffect } from 'react';
import { getPendingSuratUploads, deletePendingSuratUpload } from '@/lib/offlineSync';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';
import { useToast } from '@/context/ToastContext';

export default function OfflineSyncManager() {
    const { addToast } = useToast();

    useEffect(() => {
        const handleOnline = async () => {
            try {
                const pendingItems = await getPendingSuratUploads();
                if (pendingItems.length > 0) {
                    addToast(`Menyinkronkan ${pendingItems.length} surat tertunda...`, "info");
                    let successCount = 0;
                    
                    for (const item of pendingItems) {
                        try {
                            const { payload, fileBlob } = item;
                            const { suratData, fileName } = payload;
                            
                            // Upload file
                            const storageRef = ref(storage, `surat/${Date.now()}_${fileName}`);
                            const uploadTask = await uploadBytesResumable(storageRef, fileBlob);
                            const fileUrl = await getDownloadURL(uploadTask.ref);

                            // Create doc
                            const docRef = collection(db, 'surat');
                            await addDoc(docRef, {
                                ...suratData,
                                fileUrl,
                                fileName
                            });

                            await deletePendingSuratUpload(item.id);
                            successCount++;
                        } catch (err) {
                            console.error("Gagal sync item:", item.id, err);
                        }
                    }

                    if (successCount > 0) {
                        addToast(`${successCount} surat berhasil diunggah (Offline Sync).`, "success");
                    }
                }
            } catch (err) {
                console.error("Offline sync error:", err);
            }
        };

        window.addEventListener('online', handleOnline);
        
        // Also run once on mount if online
        if (typeof window !== 'undefined' && navigator.onLine) {
            handleOnline();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [addToast]);

    return null;
}
