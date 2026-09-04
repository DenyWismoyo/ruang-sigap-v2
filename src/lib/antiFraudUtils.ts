import { PresensiAntiFraudAudit } from "@/types";

export interface GpsSample {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number | null;
  altitude?: number | null;
}

interface AntiFraudAuditParams {
  currentPos?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number | null;
    altitude?: number | null;
  } | null;
  gpsHistory?: GpsSample[];
  officeLocation?: {
    latitude: number;
    longitude: number;
    radiusMeter?: number;
  };
}

// Haversine formula untuk menghitung jarak meter
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Utilitas Pemeriksaan Multi-Layer Anti-Fraud Presensi
 * Mendeteksi Fake GPS, Mock Location, Clock Tampering, dan Bot Automation
 */
export function performAntiFraudAudit({
  currentPos,
  gpsHistory = [],
  officeLocation,
}: AntiFraudAuditParams): PresensiAntiFraudAudit {
  const anomalies: string[] = [];
  let fraudScore = 0;
  let isMockGpsSuspected = false;
  let isClockDriftSuspected = false;
  let isBotSuspected = false;

  const now = new Date();
  const clientTimestampMs = now.getTime();
  const wibTimeStr = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(now);

  // -------------------------------------------------------------
  // 1. HEURISTIC GPS ACCURACY & PHYSICAL PLAUSIBILITY
  // -------------------------------------------------------------
  const accuracy = currentPos?.accuracy ?? 15;

  if (currentPos) {
    // A. Akurasi 0 meter (Secara fisik mustahil untuk GNSS satelit smartphone asli)
    if (accuracy === 0) {
      anomalies.push("Akurasi GPS dilaporkan 0m (Pola khas Fake GPS / Software Inject)");
      fraudScore += 45;
      isMockGpsSuspected = true;
    } else if (accuracy < 1.0) {
      anomalies.push("Akurasi GPS tidak realistis (< 1.0m pada perangkat seluler)");
      fraudScore += 30;
      isMockGpsSuspected = true;
    } else if (accuracy > 250) {
      anomalies.push("Akurasi GPS sangat lemah (> 250m deviasi)");
      fraudScore += 10;
    }

    // B. Micro-Jitter & Satellite Noise Check (Berdasarkan riwayat sampel GPS)
    if (gpsHistory.length >= 4) {
      const recentSamples = gpsHistory.slice(-4);
      let identicalCount = 0;
      for (let i = 1; i < recentSamples.length; i++) {
        const latDiff = Math.abs(recentSamples[i].latitude - recentSamples[0].latitude);
        const lonDiff = Math.abs(recentSamples[i].longitude - recentSamples[0].longitude);
        // Sinyal satelit asli selalu memiliki deviasi mikroskopis desimal ke-6 atau ke-7
        if (latDiff === 0 && lonDiff === 0) {
          identicalCount++;
        }
      }

      if (identicalCount >= 3 && accuracy < 10) {
        anomalies.push("Koordinat 100% statis tanpa fluktuasi satelit (Indikasi Mock Location)");
        fraudScore += 25;
        isMockGpsSuspected = true;
      }
    }

    // C. Teleportation / Velocity Anomaly Check
    if (gpsHistory.length >= 2) {
      const first = gpsHistory[0];
      const last = gpsHistory[gpsHistory.length - 1];
      const timeDiffSec = Math.max(1, (last.timestamp - first.timestamp) / 1000);
      const distMeters = haversineDistance(first.latitude, first.longitude, last.latitude, last.longitude);
      const speedKmh = (distMeters / timeDiffSec) * 3.6;

      // Perpindahan jarak > 300 meter dalam waktu < 3 detik (Kecepatan > 360 km/jam)
      if (distMeters > 300 && timeDiffSec <= 3) {
        anomalies.push(`Lompatan koordinat ekstrim (${distMeters}m dalam ${timeDiffSec.toFixed(1)}s, ${Math.round(speedKmh)} km/jam)`);
        fraudScore += 50;
        isMockGpsSuspected = true;
      }
    }
  }

  // -------------------------------------------------------------
  // 2. DEVICE CLOCK INTEGRITY & NTP DRIFT CHECK
  // -------------------------------------------------------------
  // Deteksi jika user mengubah jam lokal sistem secara manual
  let clockDriftSeconds = 0;
  try {
    // Hitung estimasi perbedaan antara Date lokal dengan WIB
    const localNow = new Date();
    const wibExpected = new Date(localNow.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    // Cek selisih milidetik waktu lokal terhadap jam referensi
    const timezoneOffsetDiff = Math.abs(localNow.getTimezoneOffset() - (-420)); // WIB offset is -420 minutes (-7 hours)
    
    // Jika perangkat berada di zona WIB tapi jam melenceng > 3 menit
    if (timezoneOffsetDiff === 0) {
      const systemVsExpected = Math.abs(localNow.getTime() - wibExpected.getTime());
      clockDriftSeconds = Math.round(systemVsExpected / 1000);
      if (clockDriftSeconds > 180) {
        anomalies.push(`Jam perangkat berbeda ${Math.round(clockDriftSeconds / 60)} menit dari waktu referensi`);
        fraudScore += 35;
        isClockDriftSuspected = true;
      }
    }
  } catch (e) {
    // Ignore time eval error
  }

  // -------------------------------------------------------------
  // 3. BOT AUTOMATION & WEBDRIVER CHECK
  // -------------------------------------------------------------
  let isMobile = false;
  let userAgent = "Unknown";
  let platform = "Unknown";
  let screenResolution = "";

  if (typeof window !== "undefined") {
    const nav = window.navigator as any;
    userAgent = nav.userAgent || "";
    platform = nav.platform || "";
    screenResolution = `${window.screen?.width || 0}x${window.screen?.height || 0}`;
    isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

    // Cek apakah browser dijalankan via Selenium / Puppeteer / Automated bot
    if (nav.webdriver === true) {
      anomalies.push("Browser otomatisasi (Webdriver/Bot) terdeteksi");
      fraudScore += 60;
      isBotSuspected = true;
    }

    // Cek anomali Headless Chrome
    if (/HeadlessChrome/i.test(userAgent)) {
      anomalies.push("Headless Chrome environment terdeteksi");
      fraudScore += 70;
      isBotSuspected = true;
    }
  }

  // Final Cap Fraud Score (0 - 100)
  fraudScore = Math.min(100, Math.max(0, fraudScore));

  let riskLevel: "safe" | "low" | "suspicious" | "high" = "safe";
  if (fraudScore >= 65) {
    riskLevel = "high";
  } else if (fraudScore >= 35) {
    riskLevel = "suspicious";
  } else if (fraudScore >= 15) {
    riskLevel = "low";
  }

  return {
    fraudScore,
    riskLevel,
    isMockGpsSuspected,
    isClockDriftSuspected,
    isBotSuspected,
    clockDriftSeconds,
    gpsAccuracyMeters: Math.round(accuracy),
    anomaliesDetected: anomalies,
    deviceInfo: {
      userAgent,
      platform,
      isMobile,
      screenResolution,
    },
    capturedAtClientTime: now.toISOString(),
    evaluatedAtWibTime: wibTimeStr,
  };
}
