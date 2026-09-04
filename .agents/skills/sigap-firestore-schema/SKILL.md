---
name: sigap-firestore-schema
description: Referensi lengkap schema koleksi Firestore utama pada platform RUANG SIGAP / POROS. Gunakan saat membuat fitur baru, query baru, atau perlu mengetahui struktur data yang tepat di setiap koleksi.
---

# Schema Koleksi Firestore — RUANG SIGAP

```
Database ID : database-siyap
Region      : asia-southeast2 (Jakarta)
```

---

## 📋 Daftar Koleksi Utama

| Koleksi | ID Dokumen | Keterangan |
|---------|-----------|------------|
| `users` | NIP | Profil pengguna |
| `jabatan` | Manual slug | Struktur jabatan OPD |
| `opd` | opdId slug | Data instansi |
| `opd_config` | opdId slug | Konfigurasi paket & fitur |
| `surat` | Auto-ID | Surat masuk |
| `disposisi` | Auto-ID | Rantai disposisi |
| `tindak_lanjut` | Auto-ID | Laporan tindak lanjut |
| `logbook` | `{userId}_{YYYY-MM-DD}` | Logbook harian |
| `tugas` | Auto-ID | Manajemen tugas |
| `bukti_kinerja` | Auto-ID | Bukti E-Kinerja |
| `notifications` | Auto-ID | Notifikasi in-app |
| `jadwal_tempat` | Auto-ID | Booking ruang rapat |
| `draf_persetujuan` | Auto-ID | Persetujuan draf dokumen |
| `userSummaries` | jabatanId | Cache counter KPI per jabatan |
| `kinerja_agregat` | `{opdId}_{YYYY-MM-DD}` | Agregat kinerja harian |
| `instruksi_templat` | Auto-ID | Bank templat instruksi disposisi |
| `rate_limits` | userId | Rate limiting AI scan |
| `activity_logs` | Auto-ID | Jejak audit per surat |
| `presensi` | `{opdId}_{userId}_{YYYY-MM-DD}` | Presensi pegawai, geolocation, swafoto & anti-fraud audit |

---

## 👤 `users/{nip}`

```typescript
interface UserProfile {
  uid: string;                    // Firebase Auth UID
  nip: string;                    // NIP (juga sebagai dokumen ID)
  namaLengkap: string;
  email: string;
  opdId: string;                  // ID OPD tempat bertugas
  opdIndukId?: string | null;     // OPD Induk jika sub-OPD/UPTD
  jabatanId: string;              // Jabatan utama
  role: 'user' | 'admin_opd' | 'super_admin' | 'staf_tu';
  status: 'aktif' | 'nonaktif';
  nomorWa?: string;
  golongan?: string;              // Pangkat/golongan
  level?: number;                 // Denormalisasi dari jabatan
  namaJabatan?: string;           // Denormalisasi dari jabatan
  
  // Google Integration
  googleRefreshToken?: string | null;
  googleAccessToken?: string | null;
  googleTokenExpiry?: number | null;
  googleEmail?: string | null;
  googleDriveReportLink?: string; // URL folder Drive E-Kinerja
  googleCalendarSyncEnabled?: boolean;
  
  // FCM & Notifications
  fcmTokens?: string[];
  notificationPreferences?: {
    pushSuratMasuk: boolean;
    pushDisposisi: boolean;
    pushTugas: boolean;
  };
  
  // App Settings
  app_theme?: 'sigap' | 'poros';
  additionalRoles?: FunctionalRole[];
  searchKeywords?: string[];
}
```

---

## 🏢 `jabatan/{jabatanId}`

```typescript
interface Jabatan {
  namaJabatan: string;
  level: number;          // 1=Kepala Dinas, semakin besar semakin rendah
  opdId: string;
  idAtasan: string | null; // jabatanId atasan langsung, null = puncak
  
  // PLT
  pltUserId?: string | null;
  pltMulaiTanggal?: Timestamp | null;
  pltSelesaiTanggal?: Timestamp | null;
  
  // Klasifikasi
  tipeJabatan?: 'struktural' | 'fungsional' | 'pelaksana';
  eselon?: 'I/a' | 'I/b' | 'II/a' | 'II/b' | 'III/a' | 'III/b' | 'IV/a' | 'IV/b' | null;
  jenjangFungsional?: 'Utama' | 'Madya' | 'Muda' | 'Pertama' | 'Penyelia' | 'Mahir' | 'Terampil' | 'Pemula' | null;
  
  status?: 'aktif' | 'nonaktif';
  delegasiSementara?: {
    delegatedToJabatanId: string;
    berlakuHingga: Timestamp;
    alasan: string;
  } | null;
}
```

---

## ⚙️ `opd_config/{opdId}`

```typescript
interface OpdConfig {
  opdId: string;
  namaOpd: string;
  paket: 'dasar' | 'profesional' | 'enterprise' | 'custom';
  features: {
    aiSuratReader: boolean;     // AI Scan Surat (Gemini)
    aiNotulensi: boolean;        // AI Notulensi Rapat
    analyticKinerja: boolean;    // Laporan Analitika
    manajemenAset: boolean;      // Modul Aset
    persetujuanDraf: boolean;    // Approval Draf Dokumen
    formBuilder: boolean;        // Form Builder Kustom
    lintasOpd: boolean;          // Surat Lintas Instansi
  };
  maxUsers: number;
  hargaPerUser: number;
  status: 'aktif' | 'suspended' | 'trial';
}
```

---

## 📬 `surat/{suratId}`

```typescript
interface SuratMasuk {
  // Identitas
  opdId: string;                  // WAJIB untuk isolasi data
  perihal: string;
  nomorSurat: string;
  pengirim: string;               // Nama instansi pengirim
  tanggalSurat: Timestamp | string;
  tanggalDiterima: Timestamp;
  
  // Klasifikasi
  jenisSurat: 'Undangan' | 'Pemberitahuan' | 'Permohonan' | 'Lainnya';
  sifatSurat: 'Biasa' | 'Penting' | 'Segera' | 'Rahasia';
  
  // Status Alur
  statusPenyelesaian: 'Baru' | 'Didisposisikan' | 'Proses Tindak Lanjut' | 'Selesai' | 'Diarsipkan' | 'Revisi Disposisi';
  
  // Routing
  tujuanJabatanId: string;        // Jabatan pimpinan penerima awal
  terlibatJabatanIds: string[];   // Semua jabatan yang pernah terlibat
  
  // File
  fileUrl?: string;               // URL Firebase Storage
  fileName?: string;
  
  // AI
  ringkasanEksekutif?: string;    // Ringkasan oleh Gemini AI
  
  // Agenda (jika surat undangan)
  detailAgenda?: {
    tanggal: string;
    jam: string;
    lokasi: string;
  };
  reminderSent?: boolean;         // Sudah kirim reminder 1 jam sebelum?
  
  // Display Snapshot
  infoTampilan?: {
    senderName: string;
    recipientNames: string[];
    isInformational: boolean;
  };
  
  // Pencarian
  searchKeywords?: string[];
  
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

**Status Flow:**
```
Baru → Didisposisikan → Proses Tindak Lanjut → Selesai → Diarsipkan
         ↑                                            |
         └──────── Revisi Disposisi ←─────────────────┘
```

---

## 📋 `disposisi/{disposisiId}`

```typescript
interface Disposisi {
  suratId: string;
  opdId: string;
  
  // Pengirim
  dariJabatanId: string;
  dariNama: string;
  
  // Penerima (multi-target)
  kepadaJabatanId: string[];      // Array jabatanId penerima
  penerimaSnapshot: Array<{       // Snapshot nama saat disposisi dibuat
    jabatanId: string;
    namaJabatan: string;
    namaUser: string;
  }>;
  
  // Konten Disposisi
  instruksi: string;
  batasWaktu?: Timestamp | null;
  isInformational: boolean;       // true = FYI saja, tidak perlu lapor
  
  // Tracking Penerima
  penerimaDiterima: string[];     // jabatanId yang sudah acknowledge
  penerimaSelesai: string[];      // jabatanId yang sudah selesai
  penerimaDikembalikan: string[]; // jabatanId yang kembalikan disposisi
  
  // Metadata
  tanggalDisposisi: Timestamp;
  createdAt: Timestamp;
}
```

---

## 📝 `tindak_lanjut/{tlId}`

```typescript
interface TindakLanjut {
  disposisiId: string;            // 'mandiri' jika tindak lanjut sendiri
  suratId: string;
  opdId: string;
  
  // Pembuat
  pelaporJabatanId: string;
  pelaporNama: string;
  pelaporNip: string;
  
  // Konten Laporan
  judulLaporan: string;
  isiLaporan: string;
  warnaLabel: 'default' | 'merah' | 'hijau' | 'biru' | 'kuning' | 'ungu';
  
  // Checklist
  checklist: Array<{
    id: string;
    teks: string;
    selesai: boolean;
  }>;
  
  // Lampiran
  lampiranDriveUrl?: string;
  lampiranDriveFileName?: string;
  
  // Flag
  isFinalAction: boolean;         // true = Selesaikan & Tutup disposisi
  
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

---

## 📅 `logbook/{userId}_{YYYY-MM-DD}`

```typescript
interface LogbookHarian {
  userId: string;
  tanggal: string;                // Format: 'YYYY-MM-DD'
  opdId: string;
  kegiatan: Array<{
    id: string;
    deskripsi: string;
    kategori: 'Surat' | 'Disposisi' | 'Tugas' | 'Rapat' | 'Laporan' | 'Umum';
    waktu: Timestamp;
    referensiId?: string;         // ID surat/tugas/disposisi terkait
    selesai: boolean;
    isAutoEntry: boolean;         // true = dibuat otomatis sistem
  }>;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

---

## ✅ `tugas/{tugasId}`

```typescript
interface Tugas {
  opdId: string;
  judul: string;
  deskripsi?: string;
  
  // Status
  status: 'Baru' | 'Dikerjakan' | 'Selesai' | 'Dibatalkan';
  prioritas: 'Tinggi' | 'Sedang' | 'Rendah';
  kategori: string;
  
  // Pelaku
  pembuatJabatanId: string;
  pembuatNama: string;
  penerimaJabatanId: string;
  penerimaNama: string;
  penerimaUid: string;
  
  // Timeline
  batasWaktu?: Timestamp | null;
  tanggalSelesai?: Timestamp | null;
  
  // Konten
  subTugas: Array<{ id: string; teks: string; selesai: boolean; }>;
  komentar: Array<{ id: string; teks: string; oleh: string; waktu: Timestamp; }>;
  
  // Referensi (jika dibuat dari disposisi)
  suratId?: string;
  disposisiId?: string;
  
  createdAt: Timestamp;
}
```

---

## 📊 `userSummaries/{jabatanId}`

Cache counter KPI real-time per jabatan. **Jangan diupdate dari frontend!** Hanya Cloud Function trigger yang boleh mengubah dokumen ini.

```typescript
interface UserSummary {
  jabatanId: string;
  opdId: string;
  
  // Counter Aktif
  suratBaruCount: number;         // Surat baru belum didisposisikan
  disposisiBaru: number;          // Disposisi masuk belum diterima
  tindakLanjutMenunggu: number;   // Disposisi diterima, belum selesai
  tugasBaruCount: number;         // Tugas baru belum dikerjakan
  
  updatedAt: Timestamp;
}
```

---

## 📍 `presensi/{opdId}_{userId}_{tanggal}`

```typescript
interface PresensiRecord {
  id?: string;
  userId: string;
  userNip: string;
  namaLengkap: string;
  opdId: string;
  jabatanId: string;
  namaJabatan: string;
  klasterStruktur?: 'blud' | 'asn' | 'umum';
  tanggal: string; // YYYY-MM-DD
  
  // Sesi Masuk (Check-In)
  jamMasuk?: string; // HH:mm:ss
  timestampMasuk?: Timestamp;
  lokasiMasuk?: {
    latitude: number;
    longitude: number;
    jarakMeter?: number;
    isWithinRadius: boolean;
    alamat?: string;
  };
  fotoMasukUrl?: string;
  statusMasuk?: 'tepat_waktu' | 'terlambat';
  statusKehadiran: 'hadir' | 'terlambat' | 'izin' | 'sakit' | 'dinas_luar' | 'alpha';
  
  // Sesi Pulang (Check-Out)
  jamPulang?: string;
  timestampPulang?: Timestamp;
  lokasiPulang?: {
    latitude: number;
    longitude: number;
    jarakMeter?: number;
    isWithinRadius: boolean;
    alamat?: string;
  };
  fotoPulangUrl?: string;
  statusPulang?: 'cepat_pulang' | 'sesuai_jadwal' | 'lembur';
  
  // Catatan & Bukti
  catatanMasuk?: string;
  catatanPulang?: string;
  dokumenPendukungUrl?: string;
  keteranganIzin?: string;

  // Anti-Fraud Audit Telemetri
  antiFraudAudit?: PresensiAntiFraudAudit;
  antiFraudAuditPulang?: PresensiAntiFraudAudit;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## ⚙️ `opd_config` Feature Gate — Cara Menggunakan

Sebelum merender fitur premium, **selalu** periksa `opdConfig.features`:

```tsx
const { opdConfig, userProfile } = useUserAuth();

// ✅ Selalu cek feature gate sebelum render
{opdConfig?.features?.enablePresensi && (
  <NavItem href="/dashboard/presensi" label="Presensi Pegawai" />
)}
```

