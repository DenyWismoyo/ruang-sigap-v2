import { useState, useCallback, useMemo } from 'react';
import { db, storage } from '@/lib/firebase';
import { 
    collection, query, where, getDocs, addDoc, doc, updateDoc, 
    deleteDoc, Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { RepositoryItem, UserProfile } from '@/types';
import { useToast } from '@/context/ToastContext';

export function useRepository(userProfile: UserProfile | null) {
    const { addToast } = useToast();
    
    const [items, setItems] = useState<RepositoryItem[]>([]);
    const [users, setUsers] = useState<Map<string, string>>(new Map());
    const [loading, setLoading] = useState(true);
    const [uploadProgress, setUploadProgress] = useState<{ [id: string]: number }>({});
    
    // Permission Checks
    const canCreate = useMemo(() => !!userProfile, [userProfile]);
    
    const canManageItem = useCallback((item: RepositoryItem) => {
        if (!userProfile) return false;
        if (userProfile.role === 'super_admin') return true;
        if ((userProfile.role === 'admin_opd' || userProfile.role === 'staf_tu') && item.opdId === userProfile.opdId) return true;
        return userProfile.uid === item.createdBy;
    }, [userProfile]);

    const canViewItem = useCallback((item: RepositoryItem) => {
        if (!userProfile) return false;
        if (userProfile.role === 'super_admin') return true;
        if (item.visibility === 'private') return userProfile.uid === item.createdBy;
        if (item.visibility === 'opd') return item.opdId === userProfile.opdId;
        if (item.visibility === 'shared') return item.sharedWithOpdIds?.includes(userProfile.opdId) || item.opdId === userProfile.opdId;
        return false;
    }, [userProfile]);

    // Fetch Data
    const fetchRepository = useCallback(async () => {
        if (!userProfile?.opdId) return;
        setLoading(true);
        try {
            const qOpd = query(collection(db, 'repositoryItems'), where('opdId', '==', userProfile.opdId));
            const qShared = query(collection(db, 'repositoryItems'), where('sharedWithOpdIds', 'array-contains', userProfile.opdId));
            const qUsers = query(collection(db, 'users'), where('opdId', '==', userProfile.opdId));
            
            const [opdSnapshot, sharedSnapshot, usersSnapshot] = await Promise.all([
                getDocs(qOpd),
                getDocs(qShared),
                getDocs(qUsers)
            ]);

            const userMap = new Map<string, string>();
            usersSnapshot.forEach(doc => { 
                const data = doc.data() as UserProfile; 
                userMap.set(data.uid, data.namaLengkap); 
            });
            setUsers(userMap);

            const allItems = new Map<string, RepositoryItem>();
            opdSnapshot.docs.forEach(doc => {
                const item = { id: doc.id, ...doc.data() } as RepositoryItem;
                if (canViewItem(item)) allItems.set(doc.id, item);
            });
            sharedSnapshot.docs.forEach(doc => {
                const item = { id: doc.id, ...doc.data() } as RepositoryItem;
                if (canViewItem(item)) allItems.set(doc.id, item);
            });
            
            setItems(Array.from(allItems.values()));
        } catch (error) {
            console.error("Error fetching repository:", error);
            addToast("Gagal memuat dokumen repository.", "error");
        } finally {
            setLoading(false);
        }
    }, [userProfile, canViewItem, addToast]);

    // CRUD Operations
    const createFolder = async (nama: string, parentId: string | null, visibility: 'private' | 'opd' | 'shared' = 'opd', sharedWithOpdIds: string[] = []) => {
        if (!userProfile) return;
        try {
            const payload: Omit<RepositoryItem, 'id'> = {
                nama,
                tipe: 'folder',
                parentId,
                opdId: userProfile.opdId,
                createdBy: userProfile.uid,
                createdAt: Timestamp.now(),
                visibility,
                sharedWithOpdIds
            };
            await addDoc(collection(db, 'repositoryItems'), payload);
            addToast("Folder berhasil dibuat.", "success");
            fetchRepository();
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
            } as Omit<RepositoryItem, 'id'>;
            await addDoc(collection(db, 'repositoryItems'), fullPayload);
            addToast("Tautan berhasil ditambahkan.", "success");
            fetchRepository();
        } catch (error) {
            console.error(error);
            addToast("Gagal menambahkan tautan.", "error");
        }
    };

    const uploadFile = async (
        file: File, 
        parentId: string | null, 
        metadata: { deskripsi?: string; tags?: string[]; visibility: 'private' | 'opd' | 'shared'; sharedWithOpdIds?: string[] }
    ) => {
        if (!userProfile) return;
        
        // 10MB Limit Check
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            addToast("Ukuran file melebihi 10MB.", "error");
            return;
        }

        const fileId = Date.now().toString() + '_' + Math.random().toString(36).substring(7);
        const storagePath = `repository/${userProfile.opdId}/${fileId}_${file.name}`;
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
                    fetchRepository();
                    resolve(true);
                }
            );
        });
    };

    const updateItem = async (itemId: string, payload: Partial<RepositoryItem>) => {
        try {
            await updateDoc(doc(db, 'repositoryItems', itemId), payload);
            addToast("Item berhasil diperbarui.", "success");
            fetchRepository();
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
                if (!childSnap.empty) {
                    addToast("Folder tidak kosong! Hapus isinya terlebih dahulu.", "error");
                    return false;
                }
            }
            
            if (item.tipe === 'file' && item.storagePath) {
                try {
                    await deleteObject(ref(storage, item.storagePath));
                } catch(e) {
                    console.error("Gagal menghapus file dari storage", e);
                }
            }

            await deleteDoc(doc(db, 'repositoryItems', item.id!));
            addToast("Item berhasil dihapus.", "success");
            fetchRepository();
            return true;
        } catch (error) {
            console.error(error);
            addToast("Gagal menghapus item.", "error");
            return false;
        }
    };

    const moveItem = async (itemId: string, newParentId: string | null) => {
        try {
            // Cek agar tidak memindahkan folder ke dalam dirinya sendiri
            if (itemId === newParentId) {
                addToast("Tidak dapat memindahkan folder ke dalam dirinya sendiri.", "error");
                return false;
            }
            
            await updateDoc(doc(db, 'repositoryItems', itemId), { parentId: newParentId });
            addToast("Item berhasil dipindahkan.", "success");
            fetchRepository();
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
            fetchRepository();
            return true;
        } catch (error) {
            console.error(error);
            addToast("Gagal memperbarui status favorit.", "error");
            return false;
        }
    };

    return {
        items, users, loading, uploadProgress,
        canCreate, canManageItem, canViewItem,
        fetchRepository,
        createFolder, createLink, uploadFile,
        updateItem, deleteItem, moveItem, toggleFavorite
    };
}
