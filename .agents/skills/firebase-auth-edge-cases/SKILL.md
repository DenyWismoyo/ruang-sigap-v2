---
name: firebase-auth-edge-cases
description: Panduan penanganan edge case pada Firebase Auth, termasuk penautan akun Google (OAuth) dengan Email/Password dan pembersihan state saat Logout.
---

# Firebase Auth Edge Cases

## 1. Penautan Akun (Account Linking) Google ke Email/Password
Ketika menautkan kredensial OAuth (Google) ke akun utama (Email/Password) dari layar login:
- **JANGAN** gunakan perbandingan email (`isSameEmail`) untuk menentukan apakah akun sementara (`pendingUser`) harus dihapus.
- **GUNAKAN** pengecekan `providerData`. Jika `pendingUser` TIDAK memiliki `password` provider (artinya itu murni akun OAuth yang belum lengkap), maka akun tersebut **HARUS dihapus** (`pendingUser.delete()`) sebelum memanggil `signInWithEmailAndPassword`.
- Jika tidak dihapus, akun tersebut akan tertinggal di sistem ("nyantor") dan memblokir admin untuk membuat akun dengan email yang sama.
- Selalu panggil `linkWithCredential` setelah login sukses, dan tangkap error `auth/credential-already-in-use` dengan aman.

## 2. Dependencies pada Fungsi Logout
- Jika fungsi `logOut` dibungkus dengan `useCallback` dan bertugas membersihkan data di backend (misal: menghapus token FCM di Firestore berdasarkan `userProfile.nip`), **PASTIKAN** `userProfile` masuk ke dalam *dependency array*.
- Kegagalan memasukkan state ke dependency akan menyebabkan *stale closure*, sehingga aksi pembersihan di backend gagal tereksekusi secara diam-diam.
