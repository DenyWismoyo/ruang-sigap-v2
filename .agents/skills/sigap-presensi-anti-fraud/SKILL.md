---
name: sigap-presensi-anti-fraud
description: Panduan arsitektur deteksi anti-fraud presensi pegawai (Fake GPS / Mock Location, manipulasi jam perangkat / clock tampering, bot otomasi Webdriver/Headless, dan audit forensik HRD) pada platform RUANG SIGAP / POROS.
---

# SIGAP Presensi Anti-Fraud Architecture & Guidelines

## 🛡️ Pendekatan Utama: Smart Detection & Transparent Forensic Audit

Alih-alih melakukan *hard blocking* agresif yang berisiko menghasilkan *false positive* (misalnya pada pegawai di basement gedung atau sinyal seluler lemah), SIGAP menerapkan prinsip:
1. **Silent Multi-Signal Heuristic Evaluation**: Menghitung `fraudScore` (0 - 100) dan `riskLevel` (`safe`, `low`, `suspicious`, `high`) saat tombol presensi ditekan.
2. **Transparent Forensic Audit**: Menyimpan telemetri indikator pada payload Firestore (`antiFraudAudit` dan `antiFraudAuditPulang`) yang dapat diaudit secara visual oleh HRD / Admin OPD via Modal Forensik.
3. **Graceful Degradation**: Presensi tetap tersimpan dengan penandaan audit yang jelas, menjaga kelancaran operasional pegawai jujur sekaligus memberikan bukti kuat bagi pengambil kebijakan jika terjadi pelanggaran disiplin.

---

## 🔍 Heuristik & Sinyal Deteksi

| Sinyal Fraud | Gejala / Indikator | Bobot Skor | Sifat Pelanggaran |
| :--- | :--- | :---: | :--- |
| **Fake GPS (Mock Location)** | `accuracy === 0` (DevTools / Emulator) atau `accuracy < 1.5m` konstan | **+40** | Manipulasi Lokasi Buatan |
| **GPS Zero Variance / Static** | Koordinat tidak memiliki deviasi micro-jitter satelit desimal ke-6/ke-7 pada >5 sampel | **+30** | Injeksi Mock Koordinat Statis |
| **GPS Teleportation** | Lompatan jarak > 300 meter dalam durasi < 3 detik | **+45** | Mock Location Switcher |
| **GPS Accuracy Degraded** | `accuracy > 250m` (Sinyal seluler tower jauh) | **+15** | Akurasi Lemah / Indoors |
| **Device Clock Tampering** | Selisih jam client (`Date.now()`) vs server WIB > 180 detik (3 menit) | **+35** | Manipulasi Jam HP agar Tepat Waktu |
| **Browser Webdriver Automation** | `navigator.webdriver === true` atau Headless Chrome signatures | **+50** | Bot Otomasi Selenium / Puppeteer |

---

## 📊 Kategori Level Resiko (`riskLevel`)

- **`safe` (Skor 0 - 19)**: Kondisi normal dan alami, sinyal satelit berfluktuasi wajar.
- **`low` (Skor 20 - 34)**: Anomali ringan (misal akurasi GPS agak rendah karena di dalam ruangan).
- **`suspicious` (Skor 35 - 59)**: Terdeteksi 1-2 indikator mencurigakan (misal jam perangkat terpaut >3 menit).
- **`high` (Skor >= 60)**: Terdeteksi manipulasi ganda (misal mock location + clock tampering atau browser automation).

---

## 📦 Struktur Data Firestore (`PresensiRecord`)

```typescript
export interface PresensiAntiFraudAudit {
  fraudScore: number; // 0 - 100
  riskLevel: "safe" | "low" | "suspicious" | "high";
  anomalies: string[];
  indicators: {
    gpsAccuracy?: number;
    clockDriftSeconds?: number;
    isAutomationDetected?: boolean;
    isMockLocationSuspected?: boolean;
    isTeleportationSuspected?: boolean;
    userAgentPlatform?: string;
  };
  auditedAt: number; // Unix timestamp ms
}
```

Field pada `PresensiRecord`:
- `antiFraudAudit?: PresensiAntiFraudAudit`: Audit pada sesi check-in (pagi/masuk).
- `antiFraudAuditPulang?: PresensiAntiFraudAudit`: Audit pada sesi check-out (sore/pulang).

---

## 💻 Cara Penggunaan di Komponen Presensi

```typescript
import { performAntiFraudAudit, GpsSample } from "@/lib/antiFraudUtils";

// 1. Simpan sampel GPS secara berkala di ref
const gpsHistoryRef = useRef<GpsSample[]>([]);
const gpsAccuracyRef = useRef<number>(10);

// 2. Evaluasi saat Check-In / Check-Out
const antiFraudAudit = performAntiFraudAudit({
  currentPosition: {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    accuracy: gpsAccuracyRef.current,
  },
  gpsHistory: gpsHistoryRef.current,
  referenceServerTimeMs: Date.now(),
});

// 3. Simpan hasil audit ke Firestore
await setDoc(doc(db, "presensi", docId), {
  ...recordPayload,
  antiFraudAudit,
});
```

---

## 🔎 Komponen Audit Forensik HRD

Gunakan komponen `<AntiFraudAuditDialog />` di [`src/components/presensi/AntiFraudAuditDialog.tsx`](file:///d:/Project/RUANG%20SIGAP/src/components/presensi/AntiFraudAuditDialog.tsx):
- Menampilkan breakdown skor resiko.
- Memvisualisasikan akurasi GPS, deviasi waktu jam client vs WIB, platform perangkat.
- Merinci temuan anomali dalam format peringatan warna-warni yang jelas dan ramah Light / Dark mode.
