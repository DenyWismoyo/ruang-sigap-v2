---
name: sigap-admin-panel-patterns
description: Pola standar untuk halaman Admin OPD — CRUD pengguna, jabatan, dan konfigurasi OPD. Termasuk: tabel data + modal form, konfirmasi sebelum aksi destruktif, role-guard, dan pemanggilan Cloud Function admin. Gunakan saat membangun atau memodifikasi modul admin.
---

# Admin Panel Patterns — RUANG SIGAP

```
Role yang Diizinkan : admin_opd, super_admin
Route Admin SIGAP   : /dashboard/sigap/admin/
Route Admin POROS   : /dashboard/poros/admin/
Cloud Functions     : createUser, updateUserRole, deactivateUser, updateOpdConfig
```

---

## 🔐 Guard: Halaman Admin-Only

Setiap halaman admin **WAJIB** memiliki guard role di awal komponen:

```tsx
'use client';
import { useUserAuth } from '@/context/AuthContext';
import { redirect } from 'next/navigation';

export default function HalamanAdmin() {
  const { userProfile, loading } = useUserAuth();
  
  // ✅ Guard — redirect jika bukan admin
  if (!loading && !['admin_opd', 'super_admin'].includes(userProfile?.role ?? '')) {
    redirect('/dashboard');
  }

  if (loading) return <AdminSkeleton />;

  return <AdminContent />;
}
```

---

## 📋 Template: Tabel + Modal CRUD (Pola Standar)

```tsx
'use client';
import { useState } from 'react';
import { useUserAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function TabelDataAdmin<T extends { id: string }>({
  data,
  onEdit,
  onDelete,
  isLoading,
}: {
  data: T[];
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  if (isLoading) return <TabelSkeleton />;

  return (
    <>
      {/* Tabel */}
      <div className="sg-table-container">
        <table className="sg-table">
          <thead className="sg-table-head">
            <tr>
              <th className="sg-table-cell">Nama</th>
              <th className="sg-table-cell">Status</th>
              <th className="sg-table-cell text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id} className="sg-table-row">
                <td className="sg-table-cell">{/* render data */}</td>
                <td className="sg-table-cell">{/* status badge */}</td>
                <td className="sg-table-cell text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                      Edit
                    </Button>
                    {/* ✅ Konfirmasi sebelum hapus */}
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTargetId(item.id)}>
                      Hapus
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ✅ Alert Dialog Konfirmasi Hapus — WAJIB untuk aksi destruktif */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
            <AlertDialogDescription>
              Aksi ini tidak dapat dibatalkan. Data akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTargetId) {
                  onDelete(deleteTargetId);
                  setDeleteTargetId(null);
                }
              }}
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

---

## 🔧 Pemanggilan Cloud Function Admin

Selalu gunakan Cloud Function untuk operasi yang memerlukan elevated privileges:

```tsx
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

const functions = getFunctions(app, 'asia-southeast2');

// ✅ Buat user baru (Cloud Function karena butuh admin SDK)
const createUserFn = httpsCallable(functions, 'createUser');
await createUserFn({
  nip: '12345678901234567',
  namaLengkap: 'Budi Santoso',
  email: 'budi@example.com',
  jabatanId: 'jabatan_abc',
  opdId: userProfile.opdId,
  role: 'user',
});

// ✅ Update config OPD
const updateOpdConfigFn = httpsCallable(functions, 'updateOpdConfig');
await updateOpdConfigFn({
  opdId: userProfile.opdId,
  features: { aiSuratReader: true, formBuilder: false },
});

// ✅ Non-aktifkan user
const deactivateUserFn = httpsCallable(functions, 'deactivateUser');
await deactivateUserFn({ nip: targetNip });
```

---

## 🎛️ Toggle Feature Gate (Admin UI)

```tsx
import { Switch } from '@/components/ui/switch';

function OpdConfigPanel({ config }: { config: OpdConfig }) {
  const [features, setFeatures] = useState(config.features);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (featureKey: keyof OpdConfig['features'], value: boolean) => {
    setFeatures(prev => ({ ...prev, [featureKey]: value }));
    setIsSaving(true);
    
    try {
      await updateOpdConfigFn({ opdId: config.opdId, features: { [featureKey]: value } });
      addToast({ type: 'success', title: 'Fitur diperbarui' });
    } catch {
      // Rollback di UI
      setFeatures(prev => ({ ...prev, [featureKey]: !value }));
      addToast({ type: 'error', title: 'Gagal memperbarui fitur' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {Object.entries(features).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between py-3 border-b border-border/30">
          <div>
            <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
          </div>
          <Switch
            checked={value}
            onCheckedChange={(v) => handleToggle(key as keyof OpdConfig['features'], v)}
            disabled={isSaving}
          />
        </div>
      ))}
    </div>
  );
}
```

---

## 🚫 Anti-Pattern Admin yang Dilarang

| Anti-Pattern | Risiko | Solusi |
|-------------|--------|--------|
| Hapus data tanpa konfirmasi dialog | Hapus tidak sengaja | Selalu `AlertDialog` sebelum destruktif |
| Update Firestore langsung tanpa Cloud Function untuk user management | Bypass auth custom claims | Gunakan `createUser`/`updateUserRole` CF |
| Tidak ada role guard di halaman admin | User biasa akses admin | `if (!isAdmin) redirect('/dashboard')` |
| Tampilkan semua user tanpa filter opdId | Data lintas OPD terekspos | Selalu filter `opdId == userProfile.opdId` |
