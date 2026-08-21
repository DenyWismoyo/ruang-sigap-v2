# ESTIMASI BIAYA PENGEMBANGAN - RUANG SIGAP

> Kerangka estimasi biaya pengembangan aplikasi ini disusun berdasarkan audit mendalam terhadap kode sumber,
> kompleksitas fitur, tingkat kesulitan teknis, dan standar harga pasar industri software Indonesia.
>
> **Metodologi:** Pendekatan Function Point Analysis + Story Point Estimation
> **Referensi Harga:** Standar industri software Indonesia (2024-2026)
> **Asumsi Tim:** Tim pengembang profesional mid-to-senior level

---

## RINGKASAN EKSEKUTIF

| Kategori | Biaya Estimasi |
|---------|--------------|
| Pengembangan Frontend | Rp 180.000.000 - Rp 260.000.000 |
| Pengembangan Backend | Rp 120.000.000 - Rp 180.000.000 |
| Integrasi & AI | Rp 80.000.000 - Rp 120.000.000 |
| Infrastruktur & DevOps | Rp 40.000.000 - Rp 60.000.000 |
| Desain UI/UX | Rp 60.000.000 - Rp 90.000.000 |
| QA & Testing | Rp 40.000.000 - Rp 60.000.000 |
| Dokumentasi & Training | Rp 20.000.000 - Rp 30.000.000 |
| **TOTAL ESTIMASI** | **Rp 540.000.000 - Rp 800.000.000** |

**Durasi Pengembangan Estimasi:** 14 - 20 bulan dengan tim 5-8 orang

---

## METODOLOGI PENILAIAN

### Skala Kesulitan Teknis

| Level | Deskripsi | Multiplier |
|-------|-----------|-----------|
| L1 - Dasar | CRUD sederhana, tampilan statis | 1.0x |
| L2 - Menengah | State management, validasi kompleks, relasi antar data | 1.5x |
| L3 - Tinggi | Real-time sync, alur bisnis kompleks, multi-actor workflow | 2.0x |
| L4 - Sangat Tinggi | AI integration, distributed systems, complex event-driven | 3.0x |
| L5 - Expert | Custom protocol, advanced security, enterprise-grade | 4.0x |

### Asumsi Rate Biaya

| Role | Rate/Bulan |
|------|-----------|
| Frontend Developer (Mid) | Rp 12.000.000 - Rp 18.000.000 |
| Backend Developer (Mid) | Rp 15.000.000 - Rp 22.000.000 |
| Full-stack Developer (Senior) | Rp 20.000.000 - Rp 35.000.000 |
| UI/UX Designer | Rp 10.000.000 - Rp 18.000.000 |
| QA Engineer | Rp 8.000.000 - Rp 14.000.000 |
| DevOps/Cloud Engineer | Rp 15.000.000 - Rp 25.000.000 |
| Project Manager | Rp 15.000.000 - Rp 25.000.000 |

---

## ESTIMASI DETAIL PER MODUL

### MODUL AUTENTIKASI & KEAMANAN

**Tingkat Kesulitan: L3 - TINGGI**

Alasan: Multi-metode login (NIP/Email/Google OAuth), JWT custom claims dengan multiple fields,
middleware routing berbasis role, Firestore Security Rules, session management.

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Login multi-metode (NIP, Email, Google) | 2 minggu | Rp 7.500.000 |
| JWT Custom Claims & middleware | 1 minggu | Rp 4.000.000 |
| Firebase Security Rules | 1 minggu | Rp 5.000.000 |
| Role-based access control | 1 minggu | Rp 4.000.000 |
| Profil & Google OAuth integration | 2 minggu | Rp 8.000.000 |
| **SUBTOTAL** | **7 minggu** | **Rp 28.500.000** |

---

### MODUL SURAT MASUK

**Tingkat Kesulitan: L3 - TINGGI**

Alasan: State machine 6 status, real-time Firestore listener, tampilan dua panel,
PDF viewer in-app, search dengan keywords, tab pemantauan multi-actor.

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Tampilan daftar surat dengan filter & search | 2 minggu | Rp 8.000.000 |
| Detail surat (dua panel, PDF viewer) | 2 minggu | Rp 10.000.000 |
| Form input surat baru + validasi | 1 minggu | Rp 5.000.000 |
| Upload file + drag & drop | 1 minggu | Rp 4.000.000 |
| Tab pemantauan (multi-actor view) | 1 minggu | Rp 5.000.000 |
| Jejak audit trail | 1 minggu | Rp 4.000.000 |
| Status state machine & transitions | 2 minggu | Rp 8.000.000 |
| **SUBTOTAL** | **10 minggu** | **Rp 44.000.000** |

---

### MODUL RUANG KERJA (MENU PALING KOMPLEKS)

**Tingkat Kesulitan: L4 - SANGAT TINGGI**

Alasan: Agregasi 4 jenis item berbeda dari koleksi Firestore berbeda (surat, disposisi, tugas, draf)
dalam satu feed real-time, optimistic UI, sorting overdue-first, filter tabs, komponen sidebar.
Ini adalah modul paling kompleks dalam aplikasi.

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Feed agregasi multi-sumber real-time | 3 minggu | Rp 18.000.000 |
| Kartu SURAT_BARU dengan aksi | 1 minggu | Rp 5.000.000 |
| Kartu SURAT_DISPOSISI dengan aksi | 2 minggu | Rp 10.000.000 |
| Kartu TUGAS dengan aksi | 1 minggu | Rp 5.000.000 |
| Kartu DRAF_PERSETUJUAN dengan aksi | 1 minggu | Rp 5.000.000 |
| Optimistic UI implementation | 1 minggu | Rp 6.000.000 |
| Filter tabs & sorting logic | 1 minggu | Rp 4.000.000 |
| Panel samping (Quick Links, Sticky Note, Agenda) | 2 minggu | Rp 8.000.000 |
| Mobile-responsive layout | 1 minggu | Rp 4.000.000 |
| **SUBTOTAL** | **13 minggu** | **Rp 65.000.000** |

---

### MODUL DISPOSISI DIGITAL

**Tingkat Kesulitan: L4 - SANGAT TINGGI**

Alasan: Multi-penerima sekaligus, subdelegasi (disposisi berantai), eskalasi, revisi,
state machine kompleks, notifikasi berantai ke semua pihak, auto-logbook.

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Form disposisi multi-penerima | 2 minggu | Rp 10.000.000 |
| Sistem subdelegasi (disposisi lanjut) | 2 minggu | Rp 12.000.000 |
| Mekanisme eskalasi | 1 minggu | Rp 6.000.000 |
| Revisi disposisi | 1 minggu | Rp 5.000.000 |
| Disposisi informasional vs normal | 0.5 minggu | Rp 2.500.000 |
| Templat instruksi integration | 0.5 minggu | Rp 2.500.000 |
| Backend triggers (FCM, logbook, status) | 3 minggu | Rp 15.000.000 |
| **SUBTOTAL** | **10 minggu** | **Rp 53.000.000** |

---

### MODUL LOGBOOK HARIAN

**Tingkat Kesulitan: L3 - TINGGI**

Alasan: Auto-entry dari berbagai sumber, navigasi tanggal, progress bar,
rekap bulanan dengan PDF generation dan Google Drive upload.

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Tampilan logbook dengan navigasi tanggal | 1 minggu | Rp 5.000.000 |
| Form tambah kegiatan manual (Smart Add) | 1 minggu | Rp 5.000.000 |
| Auto-entry dari semua trigger sistem | 2 minggu | Rp 10.000.000 |
| Progress bar & kategori kegiatan | 0.5 minggu | Rp 2.500.000 |
| Generate rekap bulanan PDF | 2 minggu | Rp 10.000.000 |
| Upload rekap ke Google Drive | 1 minggu | Rp 6.000.000 |
| **SUBTOTAL** | **7.5 minggu** | **Rp 38.500.000** |

---

### MODUL AI (GEMINI INTEGRATION)

**Tingkat Kesulitan: L4 - SANGAT TINGGI**

Alasan: Prompt engineering kompleks, parsing JSON dari model AI, rate limiting backend,
Secret Manager integration, validasi dan fallback mechanism, multi-halaman PDF processing.

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Backend Cloud Function AI Scan | 2 minggu | Rp 12.000.000 |
| Prompt engineering & tuning | 2 minggu | Rp 12.000.000 |
| PDF-to-image conversion pipeline | 1 minggu | Rp 6.000.000 |
| Rate limiting & security | 1 minggu | Rp 6.000.000 |
| Frontend integration & loading states | 1 minggu | Rp 5.000.000 |
| Error handling & fallback | 0.5 minggu | Rp 3.000.000 |
| AI Ringkasan Eksekutif | 1 minggu | Rp 6.000.000 |
| AI Saran Disposisi (roadmap) | 2 minggu | Rp 12.000.000 |
| AI Notulensi | 2 minggu | Rp 12.000.000 |
| **SUBTOTAL** | **12.5 minggu** | **Rp 74.000.000** |

---

### MODUL NOTIFIKASI REAL-TIME

**Tingkat Kesulitan: L4 - SANGAT TINGGI**

Alasan: FCM push notification ke berbagai device (browser, Android, iOS),
multi-token per user, batch notification, in-app notification dengan real-time listener,
berbagai trigger event yang kompleks.

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| FCM setup & token management | 1 minggu | Rp 6.000.000 |
| Push notification untuk semua event | 3 minggu | Rp 18.000.000 |
| In-app notification center | 1 minggu | Rp 6.000.000 |
| Preferensi notifikasi per user | 0.5 minggu | Rp 3.000.000 |
| Service Worker untuk background notif | 1 minggu | Rp 6.000.000 |
| **SUBTOTAL** | **6.5 minggu** | **Rp 39.000.000** |

---

### MODUL LAPORAN & ANALITIKA

**Tingkat Kesulitan: L3 - TINGGI**

Alasan: Aggregasi data dari multiple koleksi, perhitungan statistik real-time,
visualisasi grafik dengan Chart.js/Recharts, cron job harian untuk agregasi.

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Dashboard KPI dengan 4 kartu angka | 1 minggu | Rp 5.000.000 |
| Grafik tren volume surat | 1 minggu | Rp 6.000.000 |
| Tabel beban & kinerja per jabatan | 1 minggu | Rp 6.000.000 |
| Cron job agregasi harian | 1.5 minggu | Rp 9.000.000 |
| Laporan mingguan otomatis | 1 minggu | Rp 6.000.000 |
| PDF export laporan kinerja | 1 minggu | Rp 6.000.000 |
| **SUBTOTAL** | **6.5 minggu** | **Rp 38.000.000** |

---

### MODUL ADMIN PANEL

**Tingkat Kesulitan: L3 - TINGGI**

Alasan: Multi-level admin (Super Admin, Admin OPD), CRUD kompleks,
manajemen hierarki jabatan, PLT mechanism, form builder.

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Manajemen jabatan & hierarki | 2 minggu | Rp 10.000.000 |
| Manajemen users (CRUD, activate/deactivate) | 1.5 minggu | Rp 8.000.000 |
| Fitur PLT (pejabat sementara) | 1 minggu | Rp 6.000.000 |
| Pengaturan OPD & fitur gate | 1 minggu | Rp 5.000.000 |
| Form builder kustom | 2 minggu | Rp 12.000.000 |
| Manajemen pengumuman | 0.5 minggu | Rp 3.000.000 |
| Feedback & laporan langganan | 0.5 minggu | Rp 3.000.000 |
| **SUBTOTAL** | **8.5 minggu** | **Rp 47.000.000** |

---

### MODUL FITUR PENDUKUNG

**Tingkat Kesulitan: L2 - MENENGAH**

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Agenda Harian + reminder cron | 2 minggu | Rp 10.000.000 |
| Arsip Digital dengan pencarian | 1 minggu | Rp 5.000.000 |
| Manajemen Tugas + sub-tugas + komentar | 2 minggu | Rp 10.000.000 |
| Checklist Board (Kanban) | 1 minggu | Rp 5.000.000 |
| Bank Templat Instruksi | 0.5 minggu | Rp 3.000.000 |
| Repositori Dokumen (folder/link) | 1.5 minggu | Rp 7.000.000 |
| Jadwal Tempat / Booking Ruang | 1.5 minggu | Rp 7.000.000 |
| Persetujuan Draf Dokumen | 2 minggu | Rp 10.000.000 |
| Knowledge Base | 1 minggu | Rp 5.000.000 |
| Notulensi Rapat | 1 minggu | Rp 5.000.000 |
| Surat Keluar | 0.5 minggu | Rp 3.000.000 |
| Bukti Kinerja (E-Kinerja) | 1 minggu | Rp 5.000.000 |
| **SUBTOTAL** | **15 minggu** | **Rp 75.000.000** |

---

### MODUL FITUR FUNGSIONAL KHUSUS

**Tingkat Kesulitan: L3 - TINGGI** (tiap modul merupakan aplikasi tersendiri)

| Modul | Durasi | Biaya Estimasi |
|-------|--------|---------------|
| Manajemen Aset (inventory + maintenance + peminjaman) | 3 minggu | Rp 18.000.000 |
| Keuangan & SPJ (transaksi, kertas kerja, SPJ) | 4 minggu | Rp 24.000.000 |
| SKW Digital (Surat Keterangan Waris) | 2 minggu | Rp 12.000.000 |
| Tata Pemerintahan (kerja sama, wilayah) | 2 minggu | Rp 12.000.000 |
| Pelayanan Publik | 2 minggu | Rp 12.000.000 |
| **SUBTOTAL** | **13 minggu** | **Rp 78.000.000** |

---

### INFRASTRUKTUR & BACKEND LANJUTAN

**Tingkat Kesulitan: L4 - SANGAT TINGGI**

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Firebase Cloud Functions setup & deployment | 1 minggu | Rp 6.000.000 |
| Auto-logbook triggers (7 jenis event) | 2 minggu | Rp 12.000.000 |
| KPI counter system (real-time update) | 1 minggu | Rp 8.000.000 |
| Cron jobs (6 jadwal berbeda) | 2 minggu | Rp 14.000.000 |
| AutoHeal & data consistency | 1 minggu | Rp 7.000.000 |
| Backup & migration functions | 1 minggu | Rp 6.000.000 |
| Firestore indexing & optimization | 1 minggu | Rp 6.000.000 |
| PDF compression pipeline | 1 minggu | Rp 6.000.000 |
| Surat lintas OPD (lintasOpd.ts) | 1.5 minggu | Rp 9.000.000 |
| **SUBTOTAL** | **11.5 minggu** | **Rp 74.000.000** |

---

### PWA & OFFLINE SUPPORT

**Tingkat Kesulitan: L3 - TINGGI**

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Service Worker setup | 1 minggu | Rp 6.000.000 |
| Offline queue mechanism | 2 minggu | Rp 12.000.000 |
| Cache strategy per route | 1 minggu | Rp 6.000.000 |
| Install prompt & PWA manifest | 0.5 minggu | Rp 3.000.000 |
| Sync saat kembali online | 1 minggu | Rp 6.000.000 |
| **SUBTOTAL** | **5.5 minggu** | **Rp 33.000.000** |

---

### DESAIN UI/UX

**Tingkat Kesulitan: L3 - TINGGI**

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Design system & token | 2 minggu | Rp 10.000.000 |
| Desain 2 tema (SIGAP + POROS) | 3 minggu | Rp 18.000.000 |
| Responsive design (mobile + desktop) | 2 minggu | Rp 12.000.000 |
| Dark/Light mode | 1 minggu | Rp 6.000.000 |
| Animasi & micro-interaction (Framer Motion) | 2 minggu | Rp 12.000.000 |
| Mobile navigation (bottom bar, FAB, swipe) | 1.5 minggu | Rp 9.000.000 |
| 65+ shared components | 4 minggu | Rp 24.000.000 |
| **SUBTOTAL** | **15.5 minggu** | **Rp 91.000.000** |

---

### BILLING & SISTEM LANGGANAN

**Tingkat Kesulitan: L3 - TINGGI**

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Paket & feature gate system | 1 minggu | Rp 6.000.000 |
| Generate tagihan otomatis bulanan | 1 minggu | Rp 6.000.000 |
| Dashboard billing Admin | 1 minggu | Rp 5.000.000 |
| Subscription guard component | 0.5 minggu | Rp 3.000.000 |
| **SUBTOTAL** | **3.5 minggu** | **Rp 20.000.000** |

---

### QA & TESTING

**Tingkat Kesulitan: L2 - MENENGAH**

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Unit testing Cloud Functions | 2 minggu | Rp 8.000.000 |
| Integration testing alur disposisi | 2 minggu | Rp 10.000.000 |
| E2E testing alur kritis | 2 minggu | Rp 10.000.000 |
| Performance & load testing | 1 minggu | Rp 6.000.000 |
| Security testing | 1 minggu | Rp 8.000.000 |
| UAT & bug fixing | 2 minggu | Rp 10.000.000 |
| **SUBTOTAL** | **10 minggu** | **Rp 52.000.000** |

---

### DOKUMENTASI & TRAINING

| Komponen | Durasi | Biaya Estimasi |
|---------|--------|---------------|
| Technical documentation | 2 minggu | Rp 8.000.000 |
| User manual (panduan pengguna) | 1 minggu | Rp 5.000.000 |
| Training material | 1 minggu | Rp 5.000.000 |
| Deployment guide | 0.5 minggu | Rp 3.000.000 |
| Video tutorial | 1 minggu | Rp 6.000.000 |
| **SUBTOTAL** | **5.5 minggu** | **Rp 27.000.000** |

---

## REKAPITULASI TOTAL

| No | Modul | Durasi | Biaya (Bawah) | Biaya (Atas) |
|----|-------|--------|--------------|-------------|
| 1 | Autentikasi & Keamanan | 7 mgg | Rp 25.000.000 | Rp 35.000.000 |
| 2 | Surat Masuk | 10 mgg | Rp 38.000.000 | Rp 55.000.000 |
| 3 | Ruang Kerja | 13 mgg | Rp 58.000.000 | Rp 80.000.000 |
| 4 | Disposisi Digital | 10 mgg | Rp 45.000.000 | Rp 65.000.000 |
| 5 | Logbook Harian | 7.5 mgg | Rp 33.000.000 | Rp 48.000.000 |
| 6 | AI (Gemini Integration) | 12.5 mgg | Rp 65.000.000 | Rp 90.000.000 |
| 7 | Notifikasi Real-time | 6.5 mgg | Rp 33.000.000 | Rp 50.000.000 |
| 8 | Laporan & Analitika | 6.5 mgg | Rp 32.000.000 | Rp 48.000.000 |
| 9 | Admin Panel | 8.5 mgg | Rp 40.000.000 | Rp 58.000.000 |
| 10 | Fitur Pendukung (11 sub-modul) | 15 mgg | Rp 65.000.000 | Rp 90.000.000 |
| 11 | Fitur Fungsional Khusus | 13 mgg | Rp 68.000.000 | Rp 95.000.000 |
| 12 | Infrastruktur & Backend | 11.5 mgg | Rp 62.000.000 | Rp 88.000.000 |
| 13 | PWA & Offline | 5.5 mgg | Rp 28.000.000 | Rp 40.000.000 |
| 14 | Desain UI/UX | 15.5 mgg | Rp 78.000.000 | Rp 105.000.000 |
| 15 | Billing & Langganan | 3.5 mgg | Rp 18.000.000 | Rp 25.000.000 |
| 16 | QA & Testing | 10 mgg | Rp 45.000.000 | Rp 62.000.000 |
| 17 | Dokumentasi & Training | 5.5 mgg | Rp 22.000.000 | Rp 32.000.000 |
| **TOTAL** | | **~160 mgg** | **Rp 755.000.000** | **Rp 1.066.000.000** |
| **DENGAN BUFFER 20%** | | | **Rp 906.000.000** | **Rp 1.279.200.000** |

---

## FAKTOR YANG MENINGKATKAN KOMPLEKSITAS & BIAYA

### 1. Dual Theme Architecture (SIGAP + POROS)
Memiliki dua tema UI yang berbeda (bukan sekedar color scheme) berarti banyak komponen
dikembangkan dua kali. Overhead estimasi: +15-20% dari biaya frontend.

### 2. Real-time Everywhere
Hampir semua halaman menggunakan Firestore real-time listeners bukan REST API polling.
Ini membutuhkan state management yang jauh lebih kompleks dan memerlukan handling
subscription/unsubscription yang teliti untuk mencegah memory leak.

### 3. Multi-actor Workflow yang Kompleks
Alur disposisi melibatkan 3+ aktor (Staf TU, Pimpinan, Pelaksana) dengan status state machine
yang saling bergantung. Testing skenario edge case saja membutuhkan waktu signifikan.

### 4. Event-driven Architecture
60+ Cloud Function triggers yang saling terhubung. Satu aksi user bisa memicu 5-8 operasi
backend secara bersamaan. Debugging dan testing distributed system ini sangat menantang.

### 5. AI Integration dengan Domain Spesifik
Prompt engineering untuk dokumen birokrasi pemerintah membutuhkan domain expertise khusus.
Butuh iterasi panjang untuk mendapatkan akurasi ekstraksi yang acceptable.

### 6. PWA dengan Offline-first
Implementasi offline queue yang benar (idempotent, conflict resolution) sangat non-trivial.

### 7. Security Multi-level
Data isolation antar OPD, multiple roles, Firestore Security Rules yang kompleks,
rate limiting berbasis Firestore transaction - semua membutuhkan perhatian dan waktu lebih.

---

## PERBANDINGAN DENGAN SOLUSI SEJENIS

| Aspek | RUANG SIGAP | SAPA (Pemda Standar) | SharePoint E-Office | Biaya RUANG SIGAP |
|-------|-------------|---------------------|-------------------|-----------------|
| Disposisi digital | Ya | Ya | Ya | Sudah termasuk |
| AI OCR surat | Ya (Gemini) | Tidak | Tidak | +Rp 74 jt |
| Real-time notification | FCM (push) | Email only | Email only | +Rp 39 jt |
| E-Kinerja otomatis | Ya | Manual | Tidak ada | +Rp 33 jt |
| Multi-modul fungsional | 6 modul | Tidak | Tidak | +Rp 78 jt |
| PWA / offline | Ya | Tidak | Tidak | +Rp 33 jt |
| Dual tema UI | Ya | Tidak | Tidak | +Rp 20 jt |
| **Total Biaya** | **Rp 540-800 jt** | **Rp 200-350 jt** | **Rp 400-600 jt (lisensi/thn)** | |

---

## ESTIMASI BIAYA OPERASIONAL BULANAN (FIREBASE/GCP)

| Layanan | Estimasi/Bulan (per 100 user aktif) |
|---------|-------------------------------------|
| Firestore reads/writes | Rp 500.000 - Rp 1.500.000 |
| Cloud Functions invocations | Rp 200.000 - Rp 600.000 |
| Firebase Storage | Rp 100.000 - Rp 300.000 |
| FCM (gratis hingga limit) | Rp 0 |
| Gemini API (per surat scan) | Rp 300.000 - Rp 800.000 |
| **TOTAL per bulan** | **Rp 1.100.000 - Rp 3.200.000** |

Untuk 500 pengguna aktif: estimasi **Rp 4.000.000 - Rp 12.000.000/bulan**

---

## REKOMENDASI STRATEGI PENGEMBANGAN

### Fase 1: MVP Core (6-8 bulan) - Rp 250-350 juta
Fokus pada alur inti yang menghasilkan nilai langsung:
- Autentikasi lengkap
- Surat masuk + disposisi + laporan TL
- Logbook + bukti kinerja dasar
- Notifikasi FCM
- Admin panel dasar

### Fase 2: Enhanced Features (4-6 bulan) - Rp 180-250 juta
- AI Scan surat
- Analitika & laporan kinerja
- Agenda + jadwal tempat
- Fitur pendukung (tugas, checklist, bank templat)
- PWA & offline support

### Fase 3: Premium & Fungsional (4-6 bulan) - Rp 150-220 juta
- Fitur fungsional khusus (aset, keuangan, SKW, tapem)
- Sistem billing & langganan
- Dual tema (POROS)
- Surat lintas OPD

### Fase 4: Advanced AI & Optimization (3-4 bulan) - Rp 100-150 juta
- AI saran disposisi
- AI notulensi
- Dashboard eksekutif lintas OPD
- Performance optimization
- Advanced security audit

---

*Dokumen ini adalah bagian dari seri audit. Lihat juga `01-PETA-FITUR-LENGKAP.md`, `02-PETA-FUNGSI-BACKEND.md`, dan `04-RINGKASAN-EKSEKUTIF.md`.*
