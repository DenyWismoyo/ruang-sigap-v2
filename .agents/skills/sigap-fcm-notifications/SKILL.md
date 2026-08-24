---
name: sigap-fcm-notifications
description: Panduan end-to-end implementasi push notification (FCM) di RUANG SIGAP — dari registrasi token, foreground listener, in-app notification badge, hingga mengirim notif dari Cloud Function. Gunakan saat menambahkan notifikasi baru untuk fitur apapun.
---

# FCM Push Notifications — RUANG SIGAP

```
File Frontend  : src/lib/firebase-messaging.ts
Koleksi Notif  : notifications/{notifId}
Koleksi Users  : users/{nip} → fcmTokens: string[]
Env Variable   : NEXT_PUBLIC_FIREBASE_VAPID_KEY
```

---

## 🔔 Alur Lengkap Notifikasi

```
[User Login] → getFCMToken() → Simpan ke users/{nip}.fcmTokens[]
                                         ↓
[Aksi Terjadi] → Cloud Function → sendFcmMessageByUid() → FCM → Device
                               → Tulis ke notifications/{id}    ↓
                                         ↑              [In-App Badge]
                               [useNotifications hook]
```

---

## 1️⃣ Registrasi Token (Dipanggil Sekali setelah Login)

```tsx
// Sudah diimplementasikan di layout.tsx — jangan duplikasi
// Referensi saja pola ini jika perlu memodifikasi

import { getFCMToken } from '@/lib/firebase-messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';

async function registerFCMToken(userNip: string) {
  const token = await getFCMToken(); // Otomatis minta permission
  if (!token) return; // User menolak izin notifikasi
  
  // Simpan token ke array fcmTokens user (arrayUnion mencegah duplikasi)
  await updateDoc(doc(db, 'users', userNip), {
    fcmTokens: arrayUnion(token),
  });
}
```

---

## 2️⃣ Menampilkan Notifikasi In-App (Badge + Feed)

Hook untuk membaca notifikasi dari koleksi `notifications/`:

```tsx
// Pattern hook notifikasi
export function useNotifications(userId: string, opdId: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId || !opdId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),    // ✅ Notif personal
      where('opdId', '==', opdId),       // ✅ Isolasi OPD
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [userId, opdId]);

  const markAsRead = useCallback(async (notifId: string) => {
    await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
  }, []);

  const markAllAsRead = useCallback(async () => {
    const batch = writeBatch(db);
    notifications.filter(n => !n.isRead).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { isRead: true });
    });
    await batch.commit();
  }, [notifications]);

  return { notifications, unreadCount, markAsRead, markAllAsRead };
}
```

---

## 3️⃣ Mengirim Notifikasi dari Cloud Function

Gunakan helper `sendFcmMessageByUid` yang sudah ada di `utils/helpers.ts`:

```typescript
// functions/src/triggers/index.ts
import { sendFcmMessageByUid } from '../utils/helpers';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore('database-siyap');

// ✅ Pola standar: kirim FCM + buat in-app notif secara bersamaan
async function sendNotifikasi(
  targetUid: string,
  targetOpdId: string,
  type: string,
  title: string,
  body: string,
  referensiId: string
) {
  const batch = db.batch();

  // 1. FCM Push Notification
  await sendFcmMessageByUid(targetUid, { title, body, data: { type, referensiId } });

  // 2. In-App Notification (di Firestore)
  const notifRef = db.collection('notifications').doc();
  batch.set(notifRef, {
    userId: targetUid,
    opdId: targetOpdId,
    type,
    title,
    message: body,
    referensiId,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  await batch.commit();
}

// ─── Contoh penggunaan ───
await sendNotifikasi(
  targetUid,
  opdId,
  'DISPOSISI_BARU',
  'Disposisi Baru',
  `${namaDispositor} mendisposisikan surat: ${perihalSurat}`,
  disposisiId
);
```

---

## 4️⃣ Tipe Notifikasi Standar

| `type` | Trigger | Navigasi Klik |
|--------|---------|--------------|
| `SURAT_BARU` | Surat baru diterima TU | `/dashboard/surat/${suratId}` |
| `DISPOSISI_BARU` | Disposisi masuk | `/dashboard/ruang-kerja` |
| `TINDAK_LANJUT_BARU` | Laporan TL baru | `/dashboard/ruang-kerja` |
| `TUGAS_BARU` | Tugas baru diterima | `/dashboard/tugas/${tugasId}` |
| `TUGAS_SELESAI` | Tugas diselesaikan | `/dashboard/tugas/${tugasId}` |
| `AGENDA_REMINDER` | 1 jam sebelum agenda | `/dashboard/agenda` |
| `PERSETUJUAN_DIMINTA` | Draf butuh approval | `/dashboard/persetujuan-draf` |

---

## 5️⃣ Schema `notifications/{notifId}`

```typescript
interface AppNotification {
  id: string;
  userId: string;       // UID target penerima
  opdId: string;        // OPD (untuk isolasi)
  type: string;         // Kode tipe notifikasi
  title: string;        // Judul notifikasi
  message: string;      // Body notifikasi
  referensiId: string;  // ID dokumen terkait (surat/disposisi/tugas)
  isRead: boolean;      // Status baca
  createdAt: Timestamp;
}
```
