// --- [PERBAIKAN] Definisi Tipe Data (Interface) Lengkap ---
// Definisi ini disalin dari src/types/index.ts Anda untuk memastikan konsistensi

export interface Timestamp { toMillis(): number; toDate(): Date; }
export interface AgendaDetail { tanggal: Timestamp; jam: string; jamSelesai?: string | null; lokasi: string; }
export interface Surat {
    id: string;
    opdId: string;
    perihal: string;
    nomorSurat: string;
    pengirim: string;
    tanggalDiterima: Timestamp;
    tanggalSurat: Timestamp;
    statusPenyelesaian: string;
    fileUrl: string;
    fileName: string;
    createdBy: string;
    searchKeywords?: string[];
    batasWaktu?: Timestamp;
    klasifikasi: 'Biasa' | 'Penting' | 'Segera' | 'Rahasia';
    jenisSurat?: "Undangan" | "Pemberitahuan" | "Permohonan" | "Lainnya";
    detailAgenda?: AgendaDetail | null;
    reminderSent?: boolean;
    tanggalSelesai?: Timestamp | null;
    tujuanJabatanId?: string | null; // [MODIFIKASI LINTAS OPD V2] Field baru
    terlibatJabatanIds?: string[];
    ringkasanEksekutif?: string; // [BARU]
    // [FITUR PREMIUM - LINTAS OPD]
    isLintasOpd?: boolean;
    sumberEksternalOpdId?: string;
    tujuanEksternalOpdId?: string;
    sumberEksternalNama?: string;
    tujuanEksternalNama?: string;
    statusLintasOpd?: 'dikirim' | 'diterima' | 'ditolak';
}
export interface Disposisi {
  id?: string;
  suratId: string;
  kepadaJabatanId: string[];
  dariJabatanId: string;
  tanggalDisposisi: Timestamp;
  instruksi: string;
  batasWaktu?: Timestamp;
  status?: "Terkirim" | "Dikembalikan";
  isInformational?: boolean;
  penerimaDiterima?: string[];
  alasanPengembalian?: string;
  dikembalikanPada?: Timestamp;
  isDelegated?: boolean;
  delegatedToJabatanId?: string;
  originalKepadaJabatanId?: string;
  opdId?: string;
  dariJabatanNama?: string;
}
export interface TugasLampiran { name: string; url: string; uploadedAt: Timestamp; type: 'file' | 'link'; }
export interface SubTugas { id: string; teks: string; selesai: boolean; }
export interface Tugas {
  id?: string;
  opdId: string;
  judulTugas: string;
  deskripsi: string;
  dariJabatanId: string;
  kepadaJabatanId: string;
  tanggalDibuat: Timestamp;
  batasWaktu?: Timestamp | null;
  tanggalSelesai?: Timestamp | null;
  status: "Baru" | "Dikerjakan" | "Selesai";
  prioritas: "Tinggi" | "Sedang" | "Rendah";
  suratId?: string;
  suratPerihal?: string;
  lampiran?: TugasLampiran[];
  subTugas?: SubTugas[];
  kategoriTugas?: 'Penyusunan Laporan' | 'Analisis Data' | 'Persiapan Materi' | 'Koordinasi' | 'Lainnya';
  delegatedToJabatanId?: string | null;
  isDelegated?: boolean;
  collaboratorIds?: string[];
  dariJabatanNama?: string;
  kepadaJabatanNama?: string;
}
export interface UserProfile {
  id?: string; // NIP (ID Dokumen Firestore)
  uid: string; // Firebase Auth UID
  namaLengkap: string;
  nip: string;
  email: string; // Email awal (mungkin tidak aktif/placeholder)
  opdId: string;
  jabatanId: string;
  role: 'user' | 'admin_opd' | 'super_admin' | 'staf_tu';
  status: 'aktif' | 'nonaktif'; // Status kepegawaian
  nomorWa?: string;
  fcmTokens?: string[];
  // --- PENAMBAHAN BARU ---
  personalEmail?: string; // Email pribadi/kontak yang ditambahkan pengguna
  personalEmailVerified?: boolean; // Status verifikasi email pribadi (opsional)
  googleDriveReportLink?: string; // Link Google Drive kustom untuk laporan pribadi
  
  // --- [TAMBAHAN UNTUK INTEGRASI GOOGLE CALENDAR] ---
  googleRefreshToken?: string | null;
  googleAccessToken?: string | null;
  googleTokenExpiry?: number | null;
    app_theme?: 'sigap' | 'poros';
  googleCalendarSyncEnabled?: boolean;
  notificationPreferences?: {
    pushSuratMasuk: boolean;
    pushDisposisi: boolean;
    pushTugas: boolean;
  };
  // --- [AKHIR TAMBAHAN] ---

  // --- [PENAMBAHAN TAHAP 1 EFISIENSI] ---
  namaJabatan?: string; // Denormalisasi dari 'jabatan'
  level?: number; // Denormalisasi dari 'jabatan'
  searchKeywords?: string[]; // Untuk pencarian cepat
  // --- [AKHIR PENAMBAHAN] ---
}
export interface Jabatan { 
  id: string; 
  namaJabatan: string; 
  level: number; 
  opdId: string; 
  status: "aktif" | "nonaktif"; 
  idAtasan: string | null; 
  pltUserId?: string | null; 
  pltMulaiTanggal?: Timestamp | null; 
  pltSelesaiTanggal?: Timestamp | null; 
  delegasiSementara?: { 
    delegatedToJabatanId: string; 
    berlakuHingga: Timestamp; 
    alasan: string; 
  } | null; 
}
export interface OPD { id?: string; namaOpd: string; idOpdInduk: string | null; tipe: "Induk" | "Sub-OPD"; } // [MODIFIKASI] Tambah 'tipe'
export interface Pengumuman {
  attachmentFileName?: string | null;
}
export interface ApprovalStep {
  jabatanId: string;
  namaJabatan: string;
  status: 'Menunggu' | 'Disetujui' | 'Revisi';
  timestamp?: Timestamp;
  comments?: string;
}
export interface DrafPersetujuan {
  id?: string;
  judul: string;
  googleDocUrl: string;
  opdId: string;
  createdBy: string; // UID Pembuat
  status: 'Draf' | 'Proses Review' | 'Revisi' | 'Selesai' | 'Ditolak';
  currentStep: number;
  penerimaTugasJabatanId: string | null;
  pembuatNama?: string;
  approvalChain: ApprovalStep[]; // [MODIFIKASI] Tambahan
  approvalJabatanIds: string[]; // [MODIFIKASI] Tambahan
  createdAt: Timestamp; // [MODIFIKASI] Tambahan
  riwayat: RiwayatPersetujuan[]; // [MODIFIKASI] Tambahan
}
// [MODIFIKASI] Tambahan RiwayatPersetujuan
export interface RiwayatPersetujuan {
  timestamp: Timestamp;
  actorName: string;
  action: string;
  comments: string;
}
export interface JadwalTempat {
  id?: string;
  opdId: string;
  namaTempat: string;
  kegiatan: string;
  penanggungJawab: string;
  tanggalMulai: Timestamp;
  jamMulai: string;
  jamSelesai: string;
  createdBy: string; // UID
  createdAt: Timestamp;
  status: 'Menunggu Persetujuan' | 'Disetujui' | 'Ditolak';
  jenis?: 'Fisik' | 'Virtual';
  tautanRapat?: string;
}

// --- [MODIFIKASI BILLING] Tipe Data Baru untuk Langganan (dari types/index.ts) ---
export interface OpdConfig {
  id?: string;
  packageName: 'Dasar' | 'Profesional' | 'Enterprise' | 'Custom';
  langgananAktifHingga: Timestamp;
  // [MODIFIKASI BILLING] Tambahkan 'Kedaluwarsa'
  paymentStatus?: 'Lunas' | 'Menunggu Pembayaran' | 'Gagal' | 'Kedaluwarsa';
  kuotaPengguna: number;
  penggunaAktifSaatIni: number;
  features: {
    aiSuratReader: boolean;
    aiNotulensi: boolean;
    analitika: boolean;
    manajemenAset: boolean;
    persetujuanDraf: boolean;
    formBuilder: boolean;
  };
}

export interface PricingPackage {
  id?: string; // Nama paket, e.g., 'Dasar', 'Profesional'
  hargaPerPenggunaPerBulan: number;
  features: OpdConfig['features']; // Gunakan struktur fitur yang sama
}

// [MODIFIKASI BILLING] Tipe Data Baru untuk Tagihan (Fase 2)
export interface Tagihan {
  id?: string;
  opdId: string;
  namaOpd: string;
  bulanTagihan: number; // 1-12
  tahunTagihan: number;
  packageName: string;
  jumlahPenggunaAktif: number;
  hargaPerPengguna: number;
  totalTagihan: number;
  status: 'Belum Dibayar' | 'Lunas' | 'Kedaluwarsa';
  tanggalDibuat: Timestamp;
  tanggalDibayar: Timestamp | null;
  catatan?: string; // [MODIFIKASI] Tambahan
}

// [MODIFIKASI BARU] Tipe Notifikasi
export interface Notification {
  id?: string;
  userId: string;
  userNip: string;
  message: string;
  link: string;
  isRead: boolean;
  timestamp: Timestamp;
}

// [MODIFIKASI BARU] Tipe Kinerja Harian
export interface KinerjaPerPenggunaHarian {
  tanggal: Timestamp;
  userId: string;
  nip: string;
  jabatanId: string;
  opdId: string;
  tugasAktif: number;
  tugasSelesaiTepatWaktu: number;
  tugasSelesaiTerlambat: number;
  disposisiDiterima: number;
  disposisiDikembalikan: number;
}
// --- [AKHIR MODIFIKASI BILLING] ---
export interface PelayananTransaksi { id?: string; opdId: string; tanggal: Timestamp; namaPemohon: string; noHp?: string; namaPengambil?: string; alamat?: string; customData?: Record<string, any>; kategori: 'Pengambilan' | 'Layanan Umum'; jenisDokumen?: string; judulLayanan?: string; catatan?: string; status: 'Selesai' | 'Diproses' | 'Menunggu'; fotoBuktiUrl?: string; petugasId: string; petugasNama: string; createdAt: Timestamp; }
