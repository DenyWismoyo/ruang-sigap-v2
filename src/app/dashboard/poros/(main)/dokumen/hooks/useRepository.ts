import { useState, useCallback, useMemo, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
    collection, query, where, getDocs, addDoc, doc, updateDoc, 
    deleteDoc, Timestamp, onSnapshot 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { RepositoryItem, UserProfile } from '@/types';
import { useToast } from '@/context/ToastContext';
import { logActivity } from '@/lib/activityLogger';

export function useRepository(userProfile: UserProfile | null) {
    const { addToast } = useToast();
    
    const [items, setItems] = useState<RepositoryItem[]>([]);
    const [users, setUsers] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState<{ [id: string]: number }>({});
    const [privateStorageUsed, setPrivateStorageUsed] = useState(0);
    
    const PRIVATE_QUOTA_BYTES = 500 * 1024 * 1024; // 500 MB

    // Permission Checks
    const canCreate = useMemo(() => !!userProfile, [userProfile]);
    
    const canManageItem = useCallback((item: RepositoryItem) => {
        if (!userProfile) return false;
        if (userProfile.role === 'super_admin') return true;
        if (item.visibility === 'private') return userProfile.uid === item.createdBy;
        if ((userProfile.role === 'admin_opd' || userProfile.role === 'staf_tu') && item.opdId === userProfile.opdId) return true;
        return userProfile.uid === item.createdBy;
    }, [userProfile]);

    const canViewItem = useCallback((item: RepositoryItem) => {
        if (!userProfile) return false;
        if (userProfile.role === 'super_admin') return true;
        if (item.visibility === 'private') {
            if (userProfile.uid === item.createdBy) return true;
            // Granular sharing
            if (item.sharedWithUsers?.includes(userProfile.uid)) return true;
            return false;
        }
        if (item.visibility === 'opd') return item.opdId === userProfile.opdId;
        if (item.visibility === 'shared') {
            if (item.sharedWithOpdIds?.includes(userProfile.opdId) || item.opdId === userProfile.opdId) return true;
            if (item.sharedWithUsers?.includes(userProfile.uid)) return true;
            return false;
        }
        return false;
    }, [userProfile]);

    // Realtime Fetch
    useEffect(() => {
        if (!userProfile?.opdId) return;

        setLoading(true);

        const qOpd = query(collection(db, 'repositoryItems'), where('opdId', '==', userProfile.opdId));
        const qShared = query(collection(db, 'repositoryItems'), where('sharedWithOpdIds', 'array-contains', userProfile.opdId));
        
        let opdItems: Map<string, RepositoryItem> = new Map();
        let sharedItems: Map<string, RepositoryItem> = new Map();

        const mergeItems = () => {
            const allItems = new Map([...opdItems, ...sharedItems]);
            const filteredItems = Array.from(allItems.values()).filter(item => {
                // Jangan sembunyikan file yang isDeleted jika kita akan buat filter UI Recycle Bin nanti
                // Tetapi untuk sekarang, kita hanya tampilkan semua (karena kita akan memfilternya di UI page.tsx)
                return canViewItem(item);
            });
            
            // Calculate private storage used
            let usedBytes = 0;
            filteredItems.forEach(item => {
                if (item.visibility === 'private' && item.createdBy === userProfile.uid && item.fileSize && !item.isDeleted) {
                    usedBytes += item.fileSize;
                }
            });
            setPrivateStorageUsed(usedBytes);
            setItems(filteredItems);
            setLoading(false);
        };

        const unsubOpd = onSnapshot(qOpd, (snapshot) => {
            snapshot.docs.forEach(doc => opdItems.set(doc.id, { id: doc.id, ...doc.data() } as RepositoryItem));
            snapshot.docChanges().forEach(change => {
                if (change.type === 'removed') opdItems.delete(change.doc.id);
            });
            mergeItems();
        }, (error) => {
            console.error("Error fetching repository opd:", error);
            setLoading(false);
        });

        const unsubShared = onSnapshot(qShared, (snapshot) => {
            snapshot.docs.forEach(doc => sharedItems.set(doc.id, { id: doc.id, ...doc.data() } as RepositoryItem));
            snapshot.docChanges().forEach(change => {
                if (change.type === 'removed') sharedItems.delete(change.doc.id);
            });
            mergeItems();
        }, (error) => {
            console.error("Error fetching repository shared:", error);
        });

        // Fetch Users (One-time or occasional)
        const fetchUsers = async () => {
            try {
                const qUsers = query(collection(db, 'users'), where('opdId', '==', userProfile.opdId));
                const usersSnapshot = await getDocs(qUsers);
                const userMap = new Map<string, string>();
                usersSnapshot.forEach(doc => { 
                    const data = doc.data() as UserProfile; 
                    userMap.set(data.uid, data.namaLengkap); 
                });
                setUsers(userMap);
            } catch(e) {
                console.error("Error fetching users:", e);
            }
        };
        fetchUsers();

        return () => {
            unsubOpd();
            unsubShared();
        };
    }, [userProfile?.opdId, userProfile?.uid, canViewItem]);

    // CRUD Operations
    const createFolder = async (nama: string, parentId: string | null, visibility: 'private' | 'opd' | 'shared' = 'opd', sharedWithOpdIds: string[] = [], sharedWithUsers: string[] = []) => {
        if (!userProfile) return;
        try {
            const payload: Omit<RepositoryItem, 'id'> = {
                nama,
                tipe: 'folder',
                parentId,
                opdId: userProfile.opdId,
                createdBy: userProfile.uid,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                visibility,
                sharedWithOpdIds,
                sharedWithUsers
            };
            await addDoc(collection(db, 'repositoryItems'), payload);
            addToast("Folder berhasil dibuat.", "success");
        } catch (error) {
            console.error(error);
            addToast("Gagal membuat folder.", "error");
        }
    };

    const createLink = async (payload: Partial<RepositoryItem>) => {
        if (!userProfile) return;
        try {
            const fullPayload = {
                ...payload,
                tipe: 'link',
                opdId: userProfile.opdId,
                createdBy: userProfile.uid,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            } as Omit<RepositoryItem, 'id'>;
            await addDoc(collection(db, 'repositoryItems'), fullPayload);
            addToast("Tautan berhasil ditambahkan.", "success");
        } catch (error) {
            console.error(error);
            addToast("Gagal menambahkan tautan.", "error");
        }
    };

    const uploadFile = async (
        file: File, 
        parentId: string | null, 
        metadata: { deskripsi?: string; tags?: string[]; visibility: 'private' | 'opd' | 'shared'; sharedWithOpdIds?: string[]; sharedWithUsers?: string[] }
    ) => {
        if (!userProfile) return;
        
        const isPrivate = metadata.visibility === 'private';
        const MAX_SIZE = isPrivate ? PRIVATE_QUOTA_BYTES - privateStorageUsed : 10 * 1024 * 1024;

        // Validate size
        if (isPrivate) {
            if (file.size > MAX_SIZE) {
                addToast(`Kuota penyimpanan pribadi tidak mencukupi. Sisa: ${(MAX_SIZE / (1024*1024)).toFixed(1)} MB`, "error");
                return;
            }
        } else {
            if (file.size > 10 * 1024 * 1024) {
                addToast("Ukuran file melebihi 10MB.", "error");
                return;
            }
        }

        const fileId = Date.now().toString() + '_' + Math.random().toString(36).substring(7);
        const storagePath = isPrivate 
            ? `repository/private/${userProfile.uid}/${fileId}_${file.name}`
            : `repository/${userProfile.opdId}/${fileId}_${file.name}`;
            
        const storageRef = ref(storage, storagePath);
        
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
                },
                (error) => {
                    console.error("Upload error:", error);
                    addToast("Gagal mengunggah file.", "error");
                    reject(error);
                },
                async () => {
                    const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    let tipeDokumen: "sheet" | "doc" | "pdf" | "video" | "image" | "zip" | "lainnya" = "lainnya";
                    const mime = file.type;
                    if (mime.includes('pdf')) tipeDokumen = 'pdf';
                    else if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) tipeDokumen = 'sheet';
                    else if (mime.includes('word') || mime.includes('document')) tipeDokumen = 'doc';
                    else if (mime.includes('image')) tipeDokumen = 'image';
                    else if (mime.includes('video')) tipeDokumen = 'video';
                    else if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) tipeDokumen = 'zip';

                    const payload: Omit<RepositoryItem, 'id'> = {
                        nama: file.name,
                        tipe: 'file',
                        parentId,
                        opdId: userProfile.opdId,
                        createdBy: userProfile.uid,
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                        url: downloadUrl,
                        storagePath: storagePath,
                        fileSize: file.size,
                        mimeType: file.type,
                        tipeDokumen,
                        ...metadata
                    };

                    await addDoc(collection(db, 'repositoryItems'), payload);
                    
                    setUploadProgress(prev => {
                        const newProgress = { ...prev };
                        delete newProgress[fileId];
                        return newProgress;
                    });
                    
                    addToast("File berhasil diunggah.", "success");
                    resolve(true);
                }
            );
        });
    };

    const updateItem = async (itemId: string, payload: Partial<RepositoryItem>) => {
        try {
            await updateDoc(doc(db, 'repositoryItems', itemId), { ...payload, updatedAt: Timestamp.now() });
            addToast("Item berhasil diperbarui.", "success");
        } catch (error) {
            console.error(error);
            addToast("Gagal memperbarui item.", "error");
        }
    };

    const deleteItem = async (item: RepositoryItem) => {
        try {
            if (item.tipe === 'folder') {
                const childQuery = query(collection(db, 'repositoryItems'), where('parentId', '==', item.id));
                const childSnap = await getDocs(childQuery);
                // Hanya periksa item anak yang belum di soft-delete
                const activeChildren = childSnap.docs.filter(d => !d.data().isDeleted);
                if (activeChildren.length > 0) {
                    addToast("Folder tidak kosong! Hapus isinya terlebih dahulu.", "error");
                    return false;
                }
            }
            
            // SOFT DELETE
            await updateDoc(doc(db, 'repositoryItems', item.id!), { 
                isDeleted: true,
                deletedAt: Timestamp.now(),
                deletedBy: userProfile?.uid
            });
            
            addToast("Item dipindahkan ke Tong Sampah.", "success");
            if (userProfile) await logActivity(item.id!, userProfile.namaLengkap, "Menghapus Dokumen (Soft Delete)", `Memindahkan ${item.nama} ke Tong Sampah`, "repository");
            return true;
        } catch (error) {
            console.error(error);
            addToast("Gagal memindahkan item ke Tong Sampah.", "error");
            return false;
        }
    };

    const restoreItem = async (itemId: string) => {
        try {
            await updateDoc(doc(db, 'repositoryItems', itemId), { 
                isDeleted: false,
                deletedAt: null,
                deletedBy: null
            });
            addToast("Item berhasil dipulihkan.", "success");
            // get name of item if possible
            if (userProfile) await logActivity(itemId, userProfile.namaLengkap, "Memulihkan Dokumen", `Memulihkan item dari Tong Sampah`, "repository");
            return true;
        } catch (error) {
            console.error(error);
            addToast("Gagal memulihkan item.", "error");
            return false;
        }
    };

    const hardDeleteItem = async (item: RepositoryItem) => {
        try {
            if (item.tipe === 'file' && item.storagePath) {
                try {
                    await deleteObject(ref(storage, item.storagePath));
                } catch(e) {
                    console.error("Gagal menghapus file dari storage", e);
                }
            }

            await deleteDoc(doc(db, 'repositoryItems', item.id!));
            addToast("Item dihapus secara permanen.", "success");
            if (userProfile) await logActivity(item.id!, userProfile.namaLengkap, "Menghapus Permanen Dokumen", `Menghapus permanen file: ${item.nama}`, "repository");
            return true;
        } catch (error) {
            console.error(error);
            addToast("Gagal menghapus item permanen.", "error");
            return false;
        }
    };

    const moveItem = async (itemId: string, newParentId: string | null) => {
        try {
            if (itemId === newParentId) {
                addToast("Tidak dapat memindahkan folder ke dalam dirinya sendiri.", "error");
                return false;
            }
            
            await updateDoc(doc(db, 'repositoryItems', itemId), { parentId: newParentId, updatedAt: Timestamp.now() });
            addToast("Item berhasil dipindahkan.", "success");
            return true;
        } catch (error) {
            console.error(error);
            addToast("Gagal memindahkan item.", "error");
            return false;
        }
    };

    const toggleFavorite = async (itemId: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'repositoryItems', itemId), { isFavorite: !currentStatus });
            return true;
        } catch (error) {
            console.error(error);
            addToast("Gagal memperbarui status favorit.", "error");
            return false;
        }
    };

    const fetchRepository = useCallback(async () => {
        // dummy for backward compatibility
    }, []);

    return {
        items, users, loading, uploadProgress, privateStorageUsed, PRIVATE_QUOTA_BYTES,
        canCreate, canManageItem, canViewItem,
        fetchRepository,
        createFolder, createLink, uploadFile,
        updateItem, deleteItem, restoreItem, hardDeleteItem, moveItem, toggleFavorite
    };
}
