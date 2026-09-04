"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { db, storage } from "@/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  limit,
  getDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useUserAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  PresensiRecord,
  PresensiKehadiranStatus,
  OpdPresensiConfig,
  UserProfile,
  Jabatan,
} from "@/types";
import { compressImage } from "@/lib/utils";
import {
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Users,
  Download,
  Loader2,
  RefreshCw,
  Info,
  CalendarDays,
  UserCheck,
  Building,
  UploadCloud,
  ChevronRight,
  Eye,
  XCircle,
  Sparkles,
  Send,
  Navigation,
  FileCheck,
  AlertCircle,
  Save,
  Check,
  Search,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  Smartphone,
  Laptop,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SwipeButton } from "@/components/ui/swipe-button";
import { CameraCapture } from "@/components/presensi/CameraCapture";
import { PresensiLeaveDialog } from "@/components/presensi/PresensiLeaveDialog";
import { AntiFraudAuditDialog } from "@/components/presensi/AntiFraudAuditDialog";
import { performAntiFraudAudit, GpsSample } from "@/lib/antiFraudUtils";

interface PresensiPageViewProps {
  tenant?: "sigap" | "poros";
}

// Toleransi drift GPS (meter) untuk kestabilan di dalam ruangan / gedung kantor
const GPS_DRIFT_TOLERANCE = 50;

// Haversine Formula untuk menghitung jarak GPS dalam satuan Meter
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radius bumi dalam meter
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

function getWibDateString(dateObj: Date = new Date()): string {
  const wib = new Date(dateObj.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const y = wib.getFullYear();
  const m = String(wib.getMonth() + 1).padStart(2, "0");
  const d = String(wib.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWibTimeString(dateObj: Date = new Date()): string {
  const wib = new Date(dateObj.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const h = String(wib.getHours()).padStart(2, "0");
  const m = String(wib.getMinutes()).padStart(2, "0");
  const s = String(wib.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function PresensiPageView({ tenant = "sigap" }: PresensiPageViewProps) {
  const { userProfile, jabatanProfile, opdConfig } = useUserAuth();
  const { addToast } = useToast();

  const isPoros = tenant === "poros";
  const todayStr = useMemo(() => getWibDateString(), []);

  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDateFormatted, setCurrentDateFormatted] = useState<string>("");

  // Geolocation States
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceToOffice, setDistanceToOffice] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"mencari" | "siap" | "jauh" | "error">("mencari");
  const [gpsMessage, setGpsMessage] = useState<string>("Mencari sinyal GPS...");
  const [loadingLocation, setLoadingLocation] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);
  const gpsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Anti-Fraud Telemetry In-Memory Refs
  const gpsHistoryRef = useRef<GpsSample[]>([]);
  const gpsAccuracyRef = useRef<number>(10);

  // Today's Presensi Record
  const [todayRecord, setTodayRecord] = useState<PresensiRecord | null>(null);
  const [loadingTodayRecord, setLoadingTodayRecord] = useState<boolean>(true);

  // Camera Management States
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [cameraPurpose, setCameraPurpose] = useState<"checkin" | "activity" | "checkout">("checkin");
  const [tempActivityPhoto, setTempActivityPhoto] = useState<File | null>(null);
  const [tempCheckoutPhoto, setTempCheckoutPhoto] = useState<File | null>(null);
  const [activityPreview, setActivityPreview] = useState<string | null>(null);
  const [checkoutPreview, setCheckoutPreview] = useState<string | null>(null);
  const [activityText, setActivityText] = useState<string>("");

  // Processing State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Dialog Izin / Sakit
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState<boolean>(false);

  // History Personal Records
  const [personalHistory, setPersonalHistory] = useState<PresensiRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Rekapitulasi & Monitoring OPD (HRD & Admin OPD)
  const [rekapMode, setRekapMode] = useState<"harian" | "periode">("harian");
  const [rekapDate, setRekapDate] = useState<string>(todayStr);
  const [rekapStartDate, setRekapStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [rekapEndDate, setRekapEndDate] = useState<string>(todayStr);
  const [rekapSearchTerm, setRekapSearchTerm] = useState<string>("");
  const [rekapKlasterFilter, setRekapKlasterFilter] = useState<"semua" | "blud" | "asn" | "umum">("semua");
  const [rekapRecords, setRekapRecords] = useState<PresensiRecord[]>([]);
  const [periodeRecords, setPeriodeRecords] = useState<PresensiRecord[]>([]);
  const [opdUsersList, setOpdUsersList] = useState<{ user: UserProfile; jabatan?: Jabatan }[]>([]);
  const [loadingRekap, setLoadingRekap] = useState<boolean>(false);

  // Preview Photo Modal & Anti-Fraud Forensic Modal
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<PresensiRecord | null>(null);

  // Konfigurasi Presensi OPD
  const presensiConfig: OpdPresensiConfig = useMemo(() => {
    return (
      opdConfig?.presensiConfig || {
        enabled: false,
        klasterTarget: ["blud"],
        lokasiKantor: {
          namaLokasi: "Kantor Instansi",
          latitude: -7.55611,
          longitude: 110.83167,
          radiusMeter: 100,
          strictLocation: false,
        },
        jadwalKerja: {
          jamMasuk: "07:30",
          jamPulang: "16:00",
          toleransiKeterlambatanMenit: 15,
        },
        metode: {
          requirePhoto: true,
          requireLocation: true,
          allowIzinSakit: true,
        },
      }
    );
  }, [opdConfig]);

  const userCluster = jabatanProfile?.klasterStruktur || "umum";
  const isModuleEnabled = opdConfig?.features?.enablePresensi || presensiConfig.enabled;
  const isTargetCluster = presensiConfig.klasterTarget?.includes(userCluster);
  
  // ROLE DETECTION: HRD / Pengelola Kepegawaian, Admin OPD, Super Admin, dan Pimpinan
  const isHrdOrAdmin =
    userProfile?.role === "admin_opd" ||
    userProfile?.role === "super_admin" ||
    userProfile?.role === ("hrd" as any) ||
    userProfile?.additionalRoles?.includes("hrd") ||
    (jabatanProfile && jabatanProfile.level <= 5);

  const isAdminOrLeader = isHrdOrAdmin;

  // Real-time WIB Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(getWibTimeString(now));
      setCurrentDateFormatted(
        new Intl.DateTimeFormat("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "Asia/Jakarta",
        }).format(now)
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Evaluasi Keterlambatan Realtime
  const isLateNow = useMemo(() => {
    const targetMasuk = presensiConfig.jadwalKerja?.jamMasuk || "07:30";
    const toleransi = presensiConfig.jadwalKerja?.toleransiKeterlambatanMenit || 15;
    const [tH, tM] = targetMasuk.split(":").map(Number);
    const now = new Date();
    const wib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentMinutes = wib.getHours() * 60 + wib.getMinutes();
    const limitMinutes = tH * 60 + tM + toleransi;
    return currentMinutes > limitMinutes;
  }, [presensiConfig.jadwalKerja]);

  // GPS Watcher & Distance Calculator (SENAPATI OC Pattern)
  const stopGps = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (gpsIntervalRef.current !== null) {
      clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = null;
    }
  };

  const startGpsWatch = () => {
    if (!navigator.geolocation) {
      setGpsStatus("error");
      setGpsMessage("Perangkat tidak mendukung GPS");
      return;
    }

    setGpsStatus("mencari");
    setGpsMessage("Mencari titik sinyal GPS...");
    setLoadingLocation(true);
    stopGps();

    const options = { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 };

    gpsIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy, speed, altitude } = pos.coords;
          const sample: GpsSample = {
            latitude,
            longitude,
            accuracy: accuracy || 10,
            timestamp: pos.timestamp || Date.now(),
            speed,
            altitude
          };
          gpsHistoryRef.current = [...gpsHistoryRef.current.slice(-11), sample];
        },
        () => {}, 
        options
      );
    }, 5000);

    const handlePos = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, altitude } = pos.coords;
      setUserLocation({ latitude, longitude });

      // Catat sampel ke in-memory telemetry untuk anti-fraud audit
      gpsAccuracyRef.current = accuracy || 10;
      const sample: GpsSample = {
        latitude,
        longitude,
        accuracy: accuracy || 10,
        timestamp: pos.timestamp || Date.now(),
        speed,
        altitude
      };
      gpsHistoryRef.current = [...gpsHistoryRef.current.slice(-11), sample];

      if (presensiConfig.lokasiKantor?.latitude && presensiConfig.lokasiKantor?.longitude) {
        const dist = calculateDistanceMeters(
          latitude,
          longitude,
          presensiConfig.lokasiKantor.latitude,
          presensiConfig.lokasiKantor.longitude
        );
        setDistanceToOffice(dist);

        const dynamicTolerance = Math.min(Math.max(gpsAccuracyRef.current, 30), 80);
        const allowedRadius = (presensiConfig.lokasiKantor?.radiusMeter || 100) + dynamicTolerance;

        if (dist <= allowedRadius) {
          setGpsStatus("siap");
          setGpsMessage(`Lokasi Sesuai (${dist}m dari titik kantor). Siap Absen.`);
        } else {
          setGpsStatus("jauh");
          setGpsMessage(
            `Kejauhan (${dist}m). Silakan mendekat ke lokasi kantor (Maks: ${
              presensiConfig.lokasiKantor?.radiusMeter || 100
            }m).`
          );
        }
      } else {
        setGpsStatus("siap");
        setGpsMessage("Bebas Lokasi (Siap Absen)");
      }
      setLoadingLocation(false);
    };

    navigator.geolocation.getCurrentPosition(
      handlePos,
      (err) => {
        console.warn("Single GPS fetch failed:", err);
        setLoadingLocation(false);
      },
      options
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePos,
      (err) => {
        setLoadingLocation(false);
        if (err.code === 1) {
          setGpsStatus("error");
          setGpsMessage("Izin Lokasi Ditolak. Harap izinkan akses lokasi di browser.");
        } else {
          setGpsMessage("Sinyal GPS lemah. Mencari ulang koordinat...");
        }
      },
      options
    );
  };

  useEffect(() => {
    startGpsWatch();
    return () => stopGps();
  }, [presensiConfig.lokasiKantor?.latitude, presensiConfig.lokasiKantor?.longitude]);

  // Listener Today Record
  useEffect(() => {
    if (!userProfile?.opdId || !userProfile?.uid) {
      setLoadingTodayRecord(false);
      return;
    }

    const docId = `${userProfile.opdId}_${userProfile.uid}_${todayStr}`;
    const unsub = onSnapshot(
      doc(db, "presensi", docId),
      (snap) => {
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as PresensiRecord;
          setTodayRecord(data);
          if (data.catatanMasuk && !activityText) {
            setActivityText(data.catatanMasuk);
          }
          if (data.dokumenPendukungUrl && !activityPreview) {
            setActivityPreview(data.dokumenPendukungUrl);
          }
        } else {
          setTodayRecord(null);
        }
        setLoadingTodayRecord(false);
      },
      (error) => {
        console.error("Error fetching today presensi:", error);
        setLoadingTodayRecord(false);
      }
    );

    return () => unsub();
  }, [userProfile?.opdId, userProfile?.uid, todayStr]);

  // Personal History Listener / Query
  const fetchPersonalHistory = async () => {
    if (!userProfile?.opdId || !userProfile?.uid) return;
    setLoadingHistory(true);
    try {
      const q = query(
        collection(db, "presensi"),
        where("opdId", "==", userProfile.opdId),
        where("userId", "==", userProfile.uid),
        orderBy("tanggal", "desc"),
        limit(30)
      );
      const snap = await getDocs(q);
      const records: PresensiRecord[] = [];
      snap.forEach((d) => records.push({ id: d.id, ...d.data() } as PresensiRecord));
      setPersonalHistory(records);
    } catch (err) {
      console.error("Error fetching personal history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPersonalHistory();
  }, [userProfile?.opdId, userProfile?.uid, todayRecord]);

  // Trigger Camera for Checkin / Activity / Checkout
  const openCameraDialog = (purpose: "checkin" | "activity" | "checkout") => {
    setCameraPurpose(purpose);
    setShowCamera(true);
  };

  const handleCameraCapture = async (file: File) => {
    let photoFreshnessWarning = false;
    if (file.lastModified && Date.now() - file.lastModified > 60000) {
      photoFreshnessWarning = true;
    }

    if (cameraPurpose === "checkin") {
      await doCheckIn(file, photoFreshnessWarning);
    } else if (cameraPurpose === "activity") {
      setTempActivityPhoto(file);
      setActivityPreview(URL.createObjectURL(file));
      addToast("Foto kegiatan berhasil disiapkan. Klik simpan catatan.", "info");
    } else if (cameraPurpose === "checkout") {
      setTempCheckoutPhoto(file);
      setCheckoutPreview(URL.createObjectURL(file));
      await doCheckOut(file, photoFreshnessWarning);
    }
  };

  // CHECK-IN SUBMISSION
  const doCheckIn = async (photoFile?: File, photoFreshnessWarning: boolean = false) => {
    if (!userProfile?.opdId || !userProfile?.uid) return;

    const maxRadius = presensiConfig.lokasiKantor?.radiusMeter || 100;
    const isStrict = presensiConfig.lokasiKantor?.strictLocation ?? false;
    const isWithinRadius = distanceToOffice !== null ? distanceToOffice <= maxRadius + GPS_DRIFT_TOLERANCE : false;

    if (presensiConfig.metode?.requireLocation && isStrict && !isWithinRadius) {
      addToast(`Di luar radius kantor (${distanceToOffice}m > ${maxRadius}m). Presensi ditolak.`, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const jamMasukStr = getWibTimeString(now);

      const targetMasuk = presensiConfig.jadwalKerja?.jamMasuk || "07:30";
      const toleransi = presensiConfig.jadwalKerja?.toleransiKeterlambatanMenit || 15;
      const [tH, tM] = targetMasuk.split(":").map(Number);
      const [curH, curM] = jamMasukStr.split(":").map(Number);
      const targetMinutes = tH * 60 + tM + toleransi;
      const currentMinutes = curH * 60 + curM;

      const statusMasuk: "tepat_waktu" | "terlambat" = currentMinutes <= targetMinutes ? "tepat_waktu" : "terlambat";
      const statusKehadiran: PresensiKehadiranStatus = statusMasuk === "tepat_waktu" ? "hadir" : "terlambat";

      let fotoMasukUrl = "";
      if (photoFile) {
        addToast("Mengompresi dan mengunggah swafoto...", "info");
        const compressed = await compressImage(photoFile, 0.75, 1280);
        const storageRef = ref(storage, `presensi/${userProfile.opdId}/${userProfile.uid}/${todayStr}_masuk.jpg`);
        await uploadBytes(storageRef, compressed, { contentType: "image/jpeg" });
        fotoMasukUrl = await getDownloadURL(storageRef);
      }

      // Lakukan Anti-Fraud Heuristic Audit (Fake GPS, Mock Location, Clock Drift, Webdriver)
      const antiFraudAudit = performAntiFraudAudit({
        currentPos: {
          latitude: userLocation?.latitude || 0,
          longitude: userLocation?.longitude || 0,
          accuracy: gpsAccuracyRef.current,
        },
        gpsHistory: gpsHistoryRef.current,
        officeLocation: presensiConfig.lokasiKantor,
      });

      if (photoFreshnessWarning) {
        antiFraudAudit.anomaliesDetected.push("Metadata foto terindikasi lampau (Mencurigakan/Reuse foto)");
        antiFraudAudit.fraudScore += 25;
        antiFraudAudit.riskLevel = antiFraudAudit.fraudScore >= 65 ? "high" : antiFraudAudit.fraudScore >= 35 ? "suspicious" : "low";
      }

      const docId = `${userProfile.opdId}_${userProfile.uid}_${todayStr}`;
      const isWeekend = now.getDay() === 0 || now.getDay() === 6;

      const recordPayload: any = {
        userId: userProfile.uid,
        userNip: userProfile.nip || "",
        namaLengkap: userProfile.namaLengkap || "",
        opdId: userProfile.opdId,
        jabatanId: userProfile.jabatanId || "",
        namaJabatan: userProfile.namaJabatan || jabatanProfile?.namaJabatan || "Staf",
        klasterStruktur: userCluster,
        tanggal: todayStr,
        jamMasuk: jamMasukStr,
        timestampMasuk: serverTimestamp(),
        lokasiMasuk: {
          latitude: userLocation?.latitude || 0,
          longitude: userLocation?.longitude || 0,
          jarakMeter: distanceToOffice || 0,
          isWithinRadius,
          alamat: presensiConfig.lokasiKantor?.namaLokasi || "Kantor Utama",
        },
        fotoMasukUrl,
        antiFraudAudit,
        statusMasuk,
        statusKehadiran,
        isWeekend,
        isHariLibur: isWeekend, 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "presensi", docId), recordPayload, { merge: true });
      
      try {
        const snap = await getDoc(doc(db, "presensi", docId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.timestampMasuk) {
            const serverTimeMs = data.timestampMasuk.toMillis();
            const updatedAudit = performAntiFraudAudit({
              currentPos: {
                latitude: userLocation?.latitude || 0,
                longitude: userLocation?.longitude || 0,
                accuracy: gpsAccuracyRef.current,
              },
              gpsHistory: gpsHistoryRef.current,
              officeLocation: presensiConfig.lokasiKantor,
              serverTimeMs,
            });
            
            if (photoFreshnessWarning) {
              updatedAudit.anomaliesDetected.push("Metadata foto terindikasi lampau (Mencurigakan/Reuse foto)");
              updatedAudit.fraudScore += 25;
              updatedAudit.riskLevel = updatedAudit.fraudScore >= 65 ? "high" : updatedAudit.fraudScore >= 35 ? "suspicious" : "low";
            }
            
            if (updatedAudit.clockDriftSeconds && updatedAudit.clockDriftSeconds > 180) {
              await updateDoc(doc(db, "presensi", docId), {
                antiFraudAudit: updatedAudit
              });
            }
          }
        }
      } catch (e) {
        console.error("Failed to verify server time drift", e);
      }
      addToast(
        `Presensi Masuk Berhasil! (${statusMasuk === "tepat_waktu" ? "Tepat Waktu" : "Terlambat"})`,
        "success"
      );
    } catch (error: any) {
      console.error("Gagal presensi masuk:", error);
      addToast(`Gagal: ${error.message || "Kesalahan sistem"}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SIMPAN CATATAN KEGIATAN
  const handleSimpanCatatan = async () => {
    if (!userProfile?.opdId || !userProfile?.uid || !todayRecord) return;
    if (!activityText.trim()) {
      addToast("Catatan kegiatan tidak boleh kosong.", "info");
      return;
    }

    setIsSubmitting(true);
    try {
      let fotoKegiatanUrl = todayRecord.dokumenPendukungUrl || "";
      if (tempActivityPhoto) {
        addToast("Mengompresi dan mengunggah foto kegiatan...", "info");
        const compressed = await compressImage(tempActivityPhoto, 0.75, 1280);
        const storageRef = ref(storage, `presensi/${userProfile.opdId}/${userProfile.uid}/${todayStr}_kegiatan.jpg`);
        await uploadBytes(storageRef, compressed, { contentType: "image/jpeg" });
        fotoKegiatanUrl = await getDownloadURL(storageRef);
      }

      const docId = `${userProfile.opdId}_${userProfile.uid}_${todayStr}`;
      await updateDoc(doc(db, "presensi", docId), {
        catatanMasuk: activityText,
        dokumenPendukungUrl: fotoKegiatanUrl,
        updatedAt: serverTimestamp(),
      });

      addToast("Catatan kegiatan berhasil disimpan!", "success");
      setTempActivityPhoto(null);
    } catch (error: any) {
      console.error("Gagal menyimpan catatan:", error);
      addToast("Gagal menyimpan catatan kegiatan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // CHECK-OUT SUBMISSION
  const doCheckOut = async (photoFile?: File, photoFreshnessWarning: boolean = false) => {
    if (!userProfile?.opdId || !userProfile?.uid || !todayRecord) return;

    const maxRadius = presensiConfig.lokasiKantor?.radiusMeter || 100;
    const isStrict = presensiConfig.lokasiKantor?.strictLocation ?? false;
    const isWithinRadius = distanceToOffice !== null ? distanceToOffice <= maxRadius + GPS_DRIFT_TOLERANCE : false;

    if (presensiConfig.metode?.requireLocation && isStrict && !isWithinRadius) {
      addToast(`Di luar radius kantor (${distanceToOffice}m > ${maxRadius}m). Presensi pulang ditolak.`, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const jamPulangStr = getWibTimeString(now);

      const targetPulang = presensiConfig.jadwalKerja?.jamPulang || "16:00";
      const [tH, tM] = targetPulang.split(":").map(Number);
      const [curH, curM] = jamPulangStr.split(":").map(Number);
      const targetMinutes = tH * 60 + tM;
      const currentMinutes = curH * 60 + curM;

      let statusPulang: "cepat_pulang" | "sesuai_jadwal" | "lembur" = "sesuai_jadwal";
      if (currentMinutes < targetMinutes) {
        statusPulang = "cepat_pulang";
      } else if (currentMinutes > targetMinutes + 120) {
        statusPulang = "lembur";
      }

      let fotoPulangUrl = "";
      if (photoFile) {
        addToast("Mengompresi dan mengunggah swafoto pulang...", "info");
        const compressed = await compressImage(photoFile, 0.75, 1280);
        const storageRef = ref(storage, `presensi/${userProfile.opdId}/${userProfile.uid}/${todayStr}_pulang.jpg`);
        await uploadBytes(storageRef, compressed, { contentType: "image/jpeg" });
        fotoPulangUrl = await getDownloadURL(storageRef);
      }

      // Lakukan Anti-Fraud Heuristic Audit Pulang
      const antiFraudAuditPulang = performAntiFraudAudit({
        currentPos: {
          latitude: userLocation?.latitude || 0,
          longitude: userLocation?.longitude || 0,
          accuracy: gpsAccuracyRef.current,
        },
        gpsHistory: gpsHistoryRef.current,
        officeLocation: presensiConfig.lokasiKantor,
      });

      if (photoFreshnessWarning) {
        antiFraudAuditPulang.anomaliesDetected.push("Metadata foto terindikasi lampau (Mencurigakan/Reuse foto)");
        antiFraudAuditPulang.fraudScore += 25;
        antiFraudAuditPulang.riskLevel = antiFraudAuditPulang.fraudScore >= 65 ? "high" : antiFraudAuditPulang.fraudScore >= 35 ? "suspicious" : "low";
      }

      const docId = `${userProfile.opdId}_${userProfile.uid}_${todayStr}`;
      await updateDoc(doc(db, "presensi", docId), {
        jamPulang: jamPulangStr,
        timestampPulang: serverTimestamp(),
        lokasiPulang: {
          latitude: userLocation?.latitude || 0,
          longitude: userLocation?.longitude || 0,
          jarakMeter: distanceToOffice || 0,
          isWithinRadius,
          alamat: presensiConfig.lokasiKantor?.namaLokasi || "Kantor Utama",
        },
        fotoPulangUrl: fotoPulangUrl || todayRecord.fotoPulangUrl || "",
        antiFraudAuditPulang,
        statusPulang,
        catatanPulang: activityText || todayRecord.catatanMasuk || "",
        updatedAt: serverTimestamp(),
      });
      
      try {
        const snap = await getDoc(doc(db, "presensi", docId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.timestampPulang) {
            const serverTimeMs = data.timestampPulang.toMillis();
            const updatedAudit = performAntiFraudAudit({
              currentPos: {
                latitude: userLocation?.latitude || 0,
                longitude: userLocation?.longitude || 0,
                accuracy: gpsAccuracyRef.current,
              },
              gpsHistory: gpsHistoryRef.current,
              officeLocation: presensiConfig.lokasiKantor,
              serverTimeMs,
            });

            if (photoFreshnessWarning) {
              updatedAudit.anomaliesDetected.push("Metadata foto terindikasi lampau (Mencurigakan/Reuse foto)");
              updatedAudit.fraudScore += 25;
              updatedAudit.riskLevel = updatedAudit.fraudScore >= 65 ? "high" : updatedAudit.fraudScore >= 35 ? "suspicious" : "low";
            }
            
            if (updatedAudit.clockDriftSeconds && updatedAudit.clockDriftSeconds > 180) {
              await updateDoc(doc(db, "presensi", docId), {
                antiFraudAuditPulang: updatedAudit
              });
            }
          }
        }
      } catch (e) {
        console.error("Failed to verify server time drift on check-out", e);
      }

      addToast("Presensi Pulang Berhasil! Terima kasih atas dedikasi Anda.", "success");
      setTempCheckoutPhoto(null);
    } catch (error: any) {
      console.error("Gagal presensi pulang:", error);
      addToast("Terjadi kesalahan saat menyimpan presensi pulang.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rekapitulasi Data Query (Mode Harian & Mode Periode)
  useEffect(() => {
    if (!isAdminOrLeader || !userProfile?.opdId) return;

    setLoadingRekap(true);
    const fetchRekapData = async () => {
      try {
        const usersQ = query(
          collection(db, "users"),
          where("opdId", "==", userProfile.opdId),
          where("status", "==", "aktif")
        );
        const jabatanQ = query(collection(db, "jabatan"), where("opdId", "==", userProfile.opdId));

        const [usersSnap, jabatanSnap] = await Promise.all([getDocs(usersQ), getDocs(jabatanQ)]);

        const jabatanMap = new Map<string, Jabatan>();
        jabatanSnap.forEach((d) => jabatanMap.set(d.id, { id: d.id, ...d.data() } as Jabatan));

        const userList: { user: UserProfile; jabatan?: Jabatan }[] = [];
        usersSnap.forEach((d) => {
          const u = { id: d.id, ...d.data() } as UserProfile;
          const j = u.jabatanId ? jabatanMap.get(u.jabatanId) : undefined;
          userList.push({ user: u, jabatan: j });
        });
        setOpdUsersList(userList);

        if (rekapMode === "harian") {
          const presensiQ = query(
            collection(db, "presensi"),
            where("opdId", "==", userProfile.opdId),
            where("tanggal", "==", rekapDate)
          );
          const presensiSnap = await getDocs(presensiQ);
          const records: PresensiRecord[] = [];
          presensiSnap.forEach((d) => records.push({ id: d.id, ...d.data() } as PresensiRecord));
          setRekapRecords(records);
        } else {
          // Mode Periode / Bulanan
          const presensiQ = query(
            collection(db, "presensi"),
            where("opdId", "==", userProfile.opdId),
            where("tanggal", ">=", rekapStartDate),
            where("tanggal", "<=", rekapEndDate)
          );
          const presensiSnap = await getDocs(presensiQ);
          const records: PresensiRecord[] = [];
          presensiSnap.forEach((d) => records.push({ id: d.id, ...d.data() } as PresensiRecord));
          setPeriodeRecords(records);
        }
      } catch (err) {
        console.error("Gagal memuat rekap presensi:", err);
      } finally {
        setLoadingRekap(false);
      }
    };

    fetchRekapData();
  }, [isAdminOrLeader, userProfile?.opdId, rekapMode, rekapDate, rekapStartDate, rekapEndDate]);

  // Filter Harian
  const filteredUsersWithAttendance = useMemo(() => {
    const targetClusters = presensiConfig.klasterTarget || ["blud"];

    let targetUsers = opdUsersList.filter((item) => {
      const cluster = item.jabatan?.klasterStruktur || "umum";
      const clusterMatch = rekapKlasterFilter === "semua" ? targetClusters.includes(cluster) : cluster === rekapKlasterFilter;
      if (!clusterMatch) return false;

      if (rekapSearchTerm.trim()) {
        const q = rekapSearchTerm.toLowerCase();
        const matchName = item.user.namaLengkap?.toLowerCase().includes(q);
        const matchNip = item.user.nip?.toLowerCase().includes(q);
        return matchName || matchNip;
      }
      return true;
    });

    return targetUsers.map((item) => {
      const record = rekapRecords.find((r) => r.userId === item.user.uid || r.userNip === item.user.nip);
      return {
        ...item,
        record: record || null,
      };
    });
  }, [opdUsersList, rekapRecords, rekapKlasterFilter, rekapSearchTerm, presensiConfig.klasterTarget]);

  // Agregasi Periode / Bulanan
  const aggregatedPeriodeUsers = useMemo(() => {
    const targetClusters = presensiConfig.klasterTarget || ["blud"];

    let targetUsers = opdUsersList.filter((item) => {
      const cluster = item.jabatan?.klasterStruktur || "umum";
      const clusterMatch = rekapKlasterFilter === "semua" ? targetClusters.includes(cluster) : cluster === rekapKlasterFilter;
      if (!clusterMatch) return false;

      if (rekapSearchTerm.trim()) {
        const q = rekapSearchTerm.toLowerCase();
        const matchName = item.user.namaLengkap?.toLowerCase().includes(q);
        const matchNip = item.user.nip?.toLowerCase().includes(q);
        return matchName || matchNip;
      }
      return true;
    });

    return targetUsers.map((item) => {
      const userLogs = periodeRecords.filter((r) => r.userId === item.user.uid || r.userNip === item.user.nip);
      let hadir = 0;
      let terlambat = 0;
      let izin = 0;
      let sakit = 0;
      let dinasLuar = 0;

      userLogs.forEach((l) => {
        if (l.statusKehadiran === "hadir") hadir++;
        else if (l.statusKehadiran === "terlambat") terlambat++;
        else if (l.statusKehadiran === "izin") izin++;
        else if (l.statusKehadiran === "sakit") sakit++;
        else if (l.statusKehadiran === "dinas_luar") dinasLuar++;
      });

      const totalHadirFisik = hadir + terlambat;
      const totalAbsenTercatat = hadir + terlambat + izin + sakit + dinasLuar;
      const persentase = totalAbsenTercatat > 0 ? Math.round((totalHadirFisik / totalAbsenTercatat) * 100) : 0;

      return {
        ...item,
        stats: {
          hadir,
          terlambat,
          izin,
          sakit,
          dinasLuar,
          totalHadirFisik,
          totalAbsenTercatat,
          persentase,
        },
      };
    });
  }, [opdUsersList, periodeRecords, rekapKlasterFilter, rekapSearchTerm, presensiConfig.klasterTarget]);

  const rekapMetrics = useMemo(() => {
    const total = filteredUsersWithAttendance.length;
    let tepatWaktu = 0;
    let terlambat = 0;
    let izin = 0;
    let belum = 0;

    filteredUsersWithAttendance.forEach((item) => {
      if (!item.record) {
        belum++;
      } else if (item.record.statusKehadiran === "hadir") {
        tepatWaktu++;
      } else if (item.record.statusKehadiran === "terlambat") {
        terlambat++;
      } else if (["izin", "sakit", "dinas_luar"].includes(item.record.statusKehadiran)) {
        izin++;
      } else {
        belum++;
      }
    });

    return { total, tepatWaktu, terlambat, izin, belum };
  }, [filteredUsersWithAttendance]);

  // Metrik Agregat Mode Periode
  const periodeMetrics = useMemo(() => {
    const totalPegawai = aggregatedPeriodeUsers.length;
    let totalHadirTepat = 0;
    let totalTerlambat = 0;
    let totalIzinSakit = 0;
    let sumPersentase = 0;

    aggregatedPeriodeUsers.forEach((item) => {
      totalHadirTepat += item.stats.hadir;
      totalTerlambat += item.stats.terlambat;
      totalIzinSakit += item.stats.izin + item.stats.sakit + item.stats.dinasLuar;
      sumPersentase += item.stats.persentase;
    });

    const avgKehadiran = totalPegawai > 0 ? Math.round(sumPersentase / totalPegawai) : 0;
    const totalLog = totalHadirTepat + totalTerlambat + totalIzinSakit;

    return {
      totalPegawai,
      totalHadirTepat,
      totalTerlambat,
      totalIzinSakit,
      avgKehadiran,
      totalLog,
    };
  }, [aggregatedPeriodeUsers]);

  // Preset Periode
  const handleSetPresetPeriode = (type: "bulan_ini" | "bulan_lalu" | "7_hari" | "30_hari") => {
    const now = new Date();
    if (type === "bulan_ini") {
      const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const end = getWibDateString(now);
      setRekapStartDate(start);
      setRekapEndDate(end);
    } else if (type === "bulan_lalu") {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setRekapStartDate(getWibDateString(prev));
      setRekapEndDate(getWibDateString(lastDay));
    } else if (type === "7_hari") {
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setRekapStartDate(getWibDateString(past));
      setRekapEndDate(getWibDateString(now));
    } else if (type === "30_hari") {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setRekapStartDate(getWibDateString(past));
      setRekapEndDate(getWibDateString(now));
    }
  };

  // Ekspor CSV Harian
  const handleExportHarianCsv = () => {
    if (filteredUsersWithAttendance.length === 0) {
      addToast("Tidak ada data untuk diekspor.", "info");
      return;
    }

    const headers = [
      "NIP",
      "Nama Pegawai",
      "Jabatan",
      "Klaster",
      "Status Kehadiran",
      "Jam Masuk",
      "Status Masuk",
      "Jam Pulang",
      "Jarak GPS (m)",
      "Catatan Kegiatan / Izin",
    ];
    const rows = filteredUsersWithAttendance.map((item) => {
      const r = item.record;
      return [
        `"${item.user.nip || "-"}"`,
        `"${item.user.namaLengkap}"`,
        `"${item.jabatan?.namaJabatan || item.user.namaJabatan || "-"}"`,
        `"${(item.jabatan?.klasterStruktur || "umum").toUpperCase()}"`,
        `"${r ? r.statusKehadiran.toUpperCase() : "BELUM PRESENSI"}"`,
        `"${r?.jamMasuk || "-"}"`,
        `"${r?.statusMasuk || "-"}"`,
        `"${r?.jamPulang || "-"}"`,
        `"${r?.lokasiMasuk?.jarakMeter ?? "-"}"`,
        `"${r?.keteranganIzin || r?.catatanMasuk || "-"}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Presensi_Harian_${userProfile?.opdId}_${rekapDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Laporan presensi harian berhasil diunduh.", "success");
  };

  // Ekspor CSV Periode / Bulanan
  const handleExportPeriodeCsv = () => {
    if (aggregatedPeriodeUsers.length === 0) {
      addToast("Tidak ada data untuk diekspor.", "info");
      return;
    }

    const headers = [
      "NIP",
      "Nama Pegawai",
      "Jabatan",
      "Klaster",
      "Tepat Waktu (Hari)",
      "Terlambat (Hari)",
      "Izin (Hari)",
      "Sakit (Hari)",
      "Dinas Luar (Hari)",
      "Total Hadir Fisik",
      "Total Hari Tercatat",
      "Tingkat Kehadiran (%)",
    ];
    const rows = aggregatedPeriodeUsers.map((item) => {
      const s = item.stats;
      return [
        `"${item.user.nip || "-"}"`,
        `"${item.user.namaLengkap}"`,
        `"${item.jabatan?.namaJabatan || item.user.namaJabatan || "-"}"`,
        `"${(item.jabatan?.klasterStruktur || "umum").toUpperCase()}"`,
        `"${s.hadir}"`,
        `"${s.terlambat}"`,
        `"${s.izin}"`,
        `"${s.sakit}"`,
        `"${s.dinasLuar}"`,
        `"${s.totalHadirFisik}"`,
        `"${s.totalAbsenTercatat}"`,
        `"${s.persentase}%"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Rekap_Presensi_Periode_${userProfile?.opdId}_${rekapStartDate}_sd_${rekapEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("Laporan rekapitulasi periode berhasil diunduh.", "success");
  };

  // Dynamic GPS Status Theme Classes (SENAPATI OC Style)
  const getGpsCardGradient = () => {
    if (gpsStatus === "siap") return "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-emerald-900/20";
    if (gpsStatus === "jauh") return "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-orange-900/20";
    if (gpsStatus === "error") return "bg-gradient-to-r from-rose-600 to-red-700 text-white shadow-rose-900/20";
    return "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-blue-900/20";
  };

  const getGpsIcon = () => {
    if (loadingLocation || gpsStatus === "mencari") return <Loader2 className="w-6 h-6 animate-spin" />;
    if (gpsStatus === "siap") return <CheckCircle2 className="w-6 h-6" />;
    if (gpsStatus === "jauh") return <MapPin className="w-6 h-6" />;
    return <XCircle className="w-6 h-6" />;
  };

  const getGpsTitle = () => {
    if (loadingLocation || gpsStatus === "mencari") return "Mencari Sinyal GPS...";
    if (gpsStatus === "siap") return "Lokasi Sesuai (Siap Absen)";
    if (gpsStatus === "jauh") return "Di Luar Radius Kantor";
    return "GPS Belum Terhubung";
  };

  // Card Class standard: Borderless di mobile (SIGAP / POROS)
  const cardClass = isPoros
    ? "nk-card p-4 md:p-6 mb-4 md:mb-6"
    : "sg-card sg-mobile-borderless p-4 md:p-6 mb-4 md:mb-6 bg-card";

  if (!isModuleEnabled && !isAdminOrLeader) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto text-muted-foreground">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Modul Presensi Belum Diaktifkan</h2>
        <p className="text-sm text-muted-foreground">
          Instansi Anda belum mengaktifkan fitur presensi mandiri. Silakan hubungi Administrator OPD Anda.
        </p>
      </div>
    );
  }

  if (!isTargetCluster && !isAdminOrLeader) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 rounded-full flex items-center justify-center mx-auto text-blue-600">
          <Info className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Presensi Khusus Klaster Tertentu</h2>
        <p className="text-sm text-muted-foreground">
          Presensi mandiri pada instansi ini saat ini hanya diaktifkan untuk klaster{" "}
          <strong>{(presensiConfig.klasterTarget || []).map((k) => k.toUpperCase()).join(", ")}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fadeInUp pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
      {/* HEADER SECTION (EDITORIAL & BORDERLESS) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-border/40 pb-3 md:pb-4 px-1">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">
            Hari ini &bull; {currentDateFormatted || "Memuat tanggal..."}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground">Presensi Pegawai</h1>
            <Badge variant="outline" className="text-[10px] uppercase font-mono px-2 py-0.5">
              {userCluster}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:text-right">
          <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary animate-pulse" />
            <span className="font-mono text-base md:text-lg font-bold text-foreground">
              {currentTime || "--:--:--"} <span className="text-[10px] text-muted-foreground font-normal">WIB</span>
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue={isTargetCluster ? "presensi-saya" : "rekap-opd"} className="w-full">
        <TabsList className={`grid w-full ${isAdminOrLeader ? 'grid-cols-3' : 'grid-cols-2'} md:w-auto md:inline-flex mb-4`}>
          <TabsTrigger value="presensi-saya" className="gap-2 text-xs md:text-sm">
            <UserCheck className="w-4 h-4" /> Presensi Saya
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2 text-xs md:text-sm">
            <Info className="w-4 h-4" /> Info & Riwayat
          </TabsTrigger>
          {isAdminOrLeader && (
            <TabsTrigger value="rekap-opd" className="gap-2 text-xs md:text-sm">
              <Users className="w-4 h-4" /> Rekapitulasi OPD ({rekapMetrics.total})
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: PRESENSI SAYA (FOKUS AKSI PRESENSI) */}
        <TabsContent value="presensi-saya" className="space-y-4 md:space-y-6 max-w-2xl mx-auto">
          
          {/* 1. DYNAMIC GPS STATUS CARD (SENAPATI OC STYLE) */}
          <div className={`p-4 md:p-5 rounded-2xl shadow-md transition-all duration-500 ${getGpsCardGradient()}`}>
            <div className="flex items-start gap-3.5">
              <div className="bg-white/20 p-2.5 rounded-full shrink-0 backdrop-blur-sm">{getGpsIcon()}</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base md:text-lg tracking-tight mb-0.5">{getGpsTitle()}</h3>
                <p className="text-white/90 text-xs md:text-sm leading-relaxed">{gpsMessage}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-md font-medium">
                    📍 Area: {presensiConfig.lokasiKantor?.namaLokasi || "Kantor Utama"}
                  </span>
                  {distanceToOffice !== null && (
                    <span className="text-[11px] bg-black/25 backdrop-blur-sm px-2.5 py-1 rounded-md font-mono">
                      Jarak: {distanceToOffice}m
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-white/15">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={startGpsWatch}
                disabled={loadingLocation}
                className="bg-white/90 text-slate-800 hover:bg-white border-none h-8 text-xs font-semibold gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLocation ? "animate-spin" : ""}`} />
                Perbarui GPS
              </Button>
            </div>
          </div>

          {/* 2. KONDISI ALUR STATUS PRESENSI */}
          {loadingTodayRecord ? (
            <div className={`${cardClass} flex items-center justify-center p-12`}>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : todayRecord?.statusKehadiran && ["izin", "sakit", "dinas_luar"].includes(todayRecord.statusKehadiran) ? (
            /* STATUS: IZIN / SAKIT / DINAS LUAR */
            <div
              className={`${cardClass} bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-center p-6 md:p-8 space-y-3`}
            >
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <FileCheck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-amber-900 dark:text-amber-200 uppercase">
                Status: {todayRecord.statusKehadiran.replace("_", " ")}
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 max-w-md mx-auto">
                "{todayRecord.keteranganIzin || "Pengajuan telah tercatat dalam sistem."}"
              </p>
              {todayRecord.dokumenPendukungUrl && (
                <div className="pt-2">
                  <a
                    href={todayRecord.dokumenPendukungUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline bg-white dark:bg-black/30 px-3 py-1.5 rounded-lg border border-border"
                  >
                    <FileText className="w-3.5 h-3.5" /> Lihat Lampiran Bukti
                  </a>
                </div>
              )}
            </div>
          ) : !todayRecord?.jamMasuk ? (
            /* STATUS: BELUM CHECK-IN (PRESENSI MASUK WITH SWIPE BUTTON) */
            <div className={`${cardClass} space-y-5`}>
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div>
                  <h3 className="font-bold text-base text-foreground">Absen Masuk</h3>
                  <p className="text-xs text-muted-foreground">
                    Target Masuk: <strong>{presensiConfig.jadwalKerja?.jamMasuk || "07:30"} WIB</strong> (Toleransi:{" "}
                    {presensiConfig.jadwalKerja?.toleransiKeterlambatanMenit || 15} mnt)
                  </p>
                </div>
                {isLateNow ? (
                  <Badge variant="destructive" className="text-xs font-semibold gap-1">
                    <AlertTriangle className="w-3 h-3" /> Terlambat
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-xs font-semibold gap-1 bg-emerald-600">
                    <CheckCircle2 className="w-3 h-3" /> Tepat Waktu
                  </Badge>
                )}
              </div>

              {/* SWIPE BUTTON GESTURE (SENAPATI OC PATTERN) */}
              <div className="space-y-3 pt-2">
                <SwipeButton
                  onSuccess={() => openCameraDialog("checkin")}
                  text={isLateNow ? "Geser Untuk Masuk (Terlambat)" : "Geser Untuk Absen Masuk"}
                  color={isLateNow ? "orange" : "blue"}
                  isLoading={isSubmitting}
                  disabled={
                    isSubmitting ||
                    (presensiConfig.lokasiKantor?.strictLocation && gpsStatus !== "siap")
                  }
                />

                <p className="text-center text-[11px] text-muted-foreground">
                  {presensiConfig.metode?.requirePhoto
                    ? "Geser slider untuk membuka kamera dan konfirmasi swafoto."
                    : "Geser slider ke kanan untuk konfirmasi presensi masuk."}
                </p>
              </div>

              {presensiConfig.metode?.allowIzinSakit && (
                <div className="text-center pt-3 border-t border-border/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsLeaveDialogOpen(true)}
                    className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    Tidak dapat hadir kantor? Ajukan Izin / Sakit / Dinas Luar
                  </Button>
                </div>
              )}
            </div>
          ) : !todayRecord?.jamPulang ? (
            /* STATUS: SUDAH CHECK-IN, BELUM CHECK-OUT (DALAM JAM KERJA) */
            <div className="space-y-4 md:space-y-6">
              {/* Banner Jam Masuk */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                      Jam Masuk Tercatat
                    </p>
                    <p className="text-lg md:text-xl font-bold font-mono text-emerald-900 dark:text-emerald-200">
                      {todayRecord.jamMasuk} WIB
                    </p>
                  </div>
                </div>
                <Badge
                  variant={todayRecord.statusMasuk === "tepat_waktu" ? "default" : "secondary"}
                  className="text-xs uppercase"
                >
                  {todayRecord.statusMasuk === "tepat_waktu" ? "Tepat Waktu" : "Terlambat"}
                </Badge>
              </div>

              {/* Laporan Kegiatan Singkat / Catatan Harian (SENAPATI OC Model) */}
              <div className={`${cardClass} space-y-4`}>
                <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                  <Send className="w-4 h-4 text-primary" />
                  <h3 className="font-bold text-sm md:text-base text-foreground">Catatan Kegiatan Harian</h3>
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder="Tuliskan ringkasan tugas/kegiatan yang Anda kerjakan hari ini..."
                    rows={3}
                    value={activityText}
                    onChange={(e) => setActivityText(e.target.value)}
                    className="text-xs resize-none bg-background/50"
                  />

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div
                      onClick={() => openCameraDialog("activity")}
                      className="h-11 px-3 bg-muted/40 hover:bg-muted/70 rounded-lg flex items-center justify-center border border-dashed border-border cursor-pointer text-xs text-muted-foreground gap-2 transition-colors"
                    >
                      {activityPreview ? (
                        <img src={activityPreview} alt="Bukti" className="h-7 w-7 object-cover rounded" />
                      ) : (
                        <Camera className="w-4 h-4 text-primary" />
                      )}
                      <span>{activityPreview ? "Ganti Foto Bukti" : "Lampirkan Foto Bukti (Opsional)"}</span>
                    </div>

                    <Button
                      type="button"
                      onClick={handleSimpanCatatan}
                      disabled={isSubmitting}
                      variant="outline"
                      className="h-11 text-xs gap-1.5 sm:ml-auto"
                    >
                      {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Simpan Catatan
                    </Button>
                  </div>
                </div>
              </div>

              {/* Area Presensi Pulang */}
              <div className={`${cardClass} space-y-3 bg-gradient-to-br from-background to-muted/20`}>
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Absen Pulang Hari Ini
                  </Label>
                  <span className="text-xs text-muted-foreground font-mono">
                    Jadwal Pulang: {presensiConfig.jadwalKerja?.jamPulang || "16:00"} WIB
                  </span>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={() => openCameraDialog("checkout")}
                    disabled={
                      isSubmitting ||
                      (presensiConfig.lokasiKantor?.strictLocation && gpsStatus !== "siap")
                    }
                    className="w-full h-13 text-sm md:text-base font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 shadow-md gap-2"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                    Foto & Presensi Pulang (Check-Out)
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* STATUS: SELESAI (SUDAH MASUK & PULANG) */
            <div
              className={`${cardClass} text-center p-6 md:p-8 space-y-4 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800`}
            >
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg md:text-xl text-foreground">Presensi Lengkap & Selesai!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Terima kasih atas dedikasi dan kerja keras Anda hari ini.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-2">
                <div className="p-3 rounded-lg bg-background border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Jam Masuk</div>
                  <div className="font-mono text-sm md:text-base font-bold text-foreground mt-0.5">
                    {todayRecord.jamMasuk}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background border border-border">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold">Jam Pulang</div>
                  <div className="font-mono text-sm md:text-base font-bold text-foreground mt-0.5">
                    {todayRecord.jamPulang}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-2 pt-2">
                {todayRecord.fotoMasukUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPhotoUrl(todayRecord.fotoMasukUrl || null)}
                    className="text-xs gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Foto Masuk
                  </Button>
                )}
                {todayRecord.fotoPulangUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPhotoUrl(todayRecord.fotoPulangUrl || null)}
                    className="text-xs gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Foto Pulang
                  </Button>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: INFO & RIWAYAT (IDENTITAS, KETENTUAN, DAN HISTORY) */}
        <TabsContent value="info" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* KARTU IDENTITAS PEGAWAI */}
            <div className={cardClass}>
              <h3 className="font-semibold text-sm md:text-base text-foreground mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Identitas Pegawai
              </h3>
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-muted-foreground">Nama:</span>
                  <div className="font-medium text-foreground text-sm mt-0.5">{userProfile?.namaLengkap}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">NIP / ID:</span>
                  <div className="font-mono text-foreground mt-0.5">{userProfile?.nip || "-"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Jabatan:</span>
                  <div className="font-medium text-foreground mt-0.5">
                    {jabatanProfile?.namaJabatan || userProfile?.namaJabatan || "Staf"}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Klaster Struktur:</span>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {userCluster}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* KARTU KETENTUAN JAM KERJA */}
            <div className={cardClass}>
              <h3 className="font-semibold text-sm md:text-base text-foreground mb-3 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                Ketentuan Jam Kerja
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Jam Masuk</span>
                  <span className="font-mono font-semibold">
                    {presensiConfig.jadwalKerja?.jamMasuk || "07:30"} WIB
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Toleransi Terlambat</span>
                  <span className="font-mono font-semibold">
                    {presensiConfig.jadwalKerja?.toleransiKeterlambatanMenit || 15} Menit
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Jam Pulang</span>
                  <span className="font-mono font-semibold">
                    {presensiConfig.jadwalKerja?.jamPulang || "16:00"} WIB
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Radius Kantor</span>
                  <span className="font-mono font-semibold">
                    {presensiConfig.lokasiKantor?.radiusMeter || 100} Meter
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TABEL RIWAYAT PRESENSI SAYA */}
          <div className={`${cardClass} space-y-3`}>
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="font-semibold text-sm md:text-base text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Riwayat Presensi Saya (30 Hari Terakhir)
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={fetchPersonalHistory}
                disabled={loadingHistory}
                className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`w-3 h-3 ${loadingHistory ? "animate-spin" : ""}`} />
                Segarkan
              </Button>
            </div>

            {loadingHistory ? (
              <div className="flex justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : personalHistory.length === 0 ? (
              <p className="text-xs text-center p-6 text-muted-foreground">Belum ada riwayat presensi tercatat.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border/40">
                    <tr>
                      <th className="p-2.5 font-medium">Tanggal</th>
                      <th className="p-2.5 font-medium">Status</th>
                      <th className="p-2.5 font-medium">Jam Masuk</th>
                      <th className="p-2.5 font-medium">Jam Pulang</th>
                      <th className="p-2.5 font-medium">Jarak GPS</th>
                      <th className="p-2.5 font-medium">Catatan / Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {personalHistory.map((rec) => (
                      <tr key={rec.id || rec.tanggal} className="hover:bg-muted/30">
                        <td className="p-2.5 font-mono font-medium">{rec.tanggal}</td>
                        <td className="p-2.5">
                          <Badge
                            variant={
                              rec.statusKehadiran === "hadir"
                                ? "default"
                                : rec.statusKehadiran === "terlambat"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-[10px] uppercase font-semibold"
                          >
                            {rec.statusKehadiran.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-2.5 font-mono">{rec.jamMasuk || "-"}</td>
                        <td className="p-2.5 font-mono">{rec.jamPulang || "-"}</td>
                        <td className="p-2.5 font-mono text-muted-foreground">
                          {rec.lokasiMasuk?.jarakMeter !== undefined ? `${rec.lokasiMasuk.jarakMeter}m` : "-"}
                        </td>
                        <td className="p-2.5 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[150px]">
                              {rec.keteranganIzin || rec.catatanMasuk || "-"}
                            </span>
                            {rec.fotoMasukUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewPhotoUrl(rec.fotoMasukUrl || null)}
                                className="text-blue-600 hover:text-blue-700 p-0.5"
                                title="Lihat Foto Masuk"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {rec.dokumenPendukungUrl && (
                              <a
                                href={rec.dokumenPendukungUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-600 hover:text-amber-700 p-0.5"
                                title="Lihat Lampiran"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: REKAPITULASI & MONITORING OPD (HRD / ADMIN OPD / PIMPINAN) */}
        {isAdminOrLeader && (
          <TabsContent value="rekap-opd" className="space-y-4 md:space-y-6">
            
            {/* TOGGLE SUB-MODE MONITORING: HARIAN VS PERIODE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-2 md:p-3 rounded-2xl border border-border/40">
              <div className="flex items-center gap-1.5 p-1 bg-background rounded-xl border border-border/60 shadow-sm w-full sm:w-auto">
                <Button
                  type="button"
                  variant={rekapMode === "harian" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setRekapMode("harian")}
                  className="flex-1 sm:flex-none text-xs h-8 gap-1.5 font-medium rounded-lg"
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Monitoring Harian
                </Button>
                <Button
                  type="button"
                  variant={rekapMode === "periode" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setRekapMode("periode")}
                  className="flex-1 sm:flex-none text-xs h-8 gap-1.5 font-medium rounded-lg"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Rekapitulasi Periode
                </Button>
              </div>

              <div className="text-[11px] text-muted-foreground sm:text-right px-1">
                {rekapMode === "harian" ? (
                  <span>Menampilkan log absensi realtime per tanggal terpilih</span>
                ) : (
                  <span>Agregasi statistik kehadiran & performa absensi akumulatif</span>
                )}
              </div>
            </div>

            {/* DYNAMIC KPI STAT CARDS */}
            {rekapMode === "harian" ? (
              /* KPI Mode Harian */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
                <div className="p-3 md:p-4 rounded-xl border border-border/60 bg-card">
                  <div className="text-[11px] text-muted-foreground font-medium">Total Pegawai Klaster</div>
                  <div className="text-xl md:text-2xl font-bold font-mono text-foreground mt-1">
                    {rekapMetrics.total}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Hadir Tepat Waktu</div>
                  <div className="text-xl md:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                    {rekapMetrics.tepatWaktu}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20">
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Hadir Terlambat</div>
                  <div className="text-xl md:text-2xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-1">
                    {rekapMetrics.terlambat}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/40 dark:bg-blue-950/20">
                  <div className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">Izin / Sakit / DL</div>
                  <div className="text-xl md:text-2xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-1">
                    {rekapMetrics.izin}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/40 dark:bg-rose-950/20 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-rose-700 dark:text-rose-400 font-medium">Belum Presensi</div>
                  <div className="text-xl md:text-2xl font-bold font-mono text-rose-700 dark:text-rose-300 mt-1">
                    {rekapMetrics.belum}
                  </div>
                </div>
              </div>
            ) : (
              /* KPI Mode Periode */
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 md:gap-3">
                <div className="p-3 md:p-4 rounded-xl border border-border/60 bg-card">
                  <div className="text-[11px] text-muted-foreground font-medium">Total Pegawai</div>
                  <div className="text-xl md:text-2xl font-bold font-mono text-foreground mt-1">
                    {periodeMetrics.totalPegawai}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/40 dark:bg-indigo-950/20">
                  <div className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium">Total Log Tercatat</div>
                  <div className="text-xl md:text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-300 mt-1">
                    {periodeMetrics.totalLog}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Total Hadir Tepat</div>
                  <div className="text-xl md:text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                    {periodeMetrics.totalHadirTepat}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/40 dark:bg-amber-950/20">
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Total Keterlambatan</div>
                  <div className="text-xl md:text-2xl font-bold font-mono text-amber-700 dark:text-amber-300 mt-1">
                    {periodeMetrics.totalTerlambat}
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/40 dark:bg-blue-950/20 col-span-2 sm:col-span-1">
                  <div className="text-[11px] text-blue-700 dark:text-blue-400 font-medium flex items-center justify-between">
                    <span>Rata-rata Kehadiran</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold font-mono text-blue-700 dark:text-blue-300 mt-1">
                    {periodeMetrics.avgKehadiran}%
                  </div>
                </div>
              </div>
            )}

            {/* FILTER DAN AKSI DATA */}
            <div className={`${cardClass} space-y-4`}>
              {rekapMode === "harian" ? (
                /* Kontrol Filter Mode Harian */
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border/40 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Pilih Tanggal</Label>
                      <Input
                        type="date"
                        value={rekapDate}
                        onChange={(e) => setRekapDate(e.target.value)}
                        className="h-8 text-xs font-mono w-36 mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Filter Klaster</Label>
                      <Select value={rekapKlasterFilter} onValueChange={(val: any) => setRekapKlasterFilter(val)}>
                        <SelectTrigger className="h-8 text-xs w-36 mt-0.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="semua">Semua Klaster</SelectItem>
                          <SelectItem value="blud">BLUD / Non-ASN</SelectItem>
                          <SelectItem value="asn">ASN</SelectItem>
                          <SelectItem value="umum">Umum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <Label className="text-[11px] text-muted-foreground">Cari Pegawai</Label>
                      <div className="relative mt-0.5">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Nama atau NIP..."
                          value={rekapSearchTerm}
                          onChange={(e) => setRekapSearchTerm(e.target.value)}
                          className="h-8 text-xs pl-8"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExportHarianCsv}
                      className="gap-1.5 text-xs h-8 shadow-sm hover:border-emerald-500 hover:text-emerald-600"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      Ekspor Laporan Harian (CSV)
                    </Button>
                  </div>
                </div>
              ) : (
                /* Kontrol Filter Mode Periode */
                <div className="space-y-3 border-b border-border/40 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-muted-foreground font-medium">Preset Cepat:</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetPresetPeriode("bulan_ini")}
                        className="h-7 text-[11px] px-2.5 rounded-full"
                      >
                        Bulan Ini
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetPresetPeriode("bulan_lalu")}
                        className="h-7 text-[11px] px-2.5 rounded-full"
                      >
                        Bulan Lalu
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetPresetPeriode("7_hari")}
                        className="h-7 text-[11px] px-2.5 rounded-full"
                      >
                        7 Hari Terakhir
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetPresetPeriode("30_hari")}
                        className="h-7 text-[11px] px-2.5 rounded-full"
                      >
                        30 Hari Terakhir
                      </Button>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExportPeriodeCsv}
                      className="gap-1.5 text-xs h-8 shadow-sm hover:border-emerald-500 hover:text-emerald-600 self-end"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      Ekspor Rekapitulasi Periode (CSV)
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Dari Tanggal</Label>
                      <Input
                        type="date"
                        value={rekapStartDate}
                        onChange={(e) => setRekapStartDate(e.target.value)}
                        className="h-8 text-xs font-mono w-36 mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Sampai Tanggal</Label>
                      <Input
                        type="date"
                        value={rekapEndDate}
                        onChange={(e) => setRekapEndDate(e.target.value)}
                        className="h-8 text-xs font-mono w-36 mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-muted-foreground">Filter Klaster</Label>
                      <Select value={rekapKlasterFilter} onValueChange={(val: any) => setRekapKlasterFilter(val)}>
                        <SelectTrigger className="h-8 text-xs w-36 mt-0.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="semua">Semua Klaster</SelectItem>
                          <SelectItem value="blud">BLUD / Non-ASN</SelectItem>
                          <SelectItem value="asn">ASN</SelectItem>
                          <SelectItem value="umum">Umum</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <Label className="text-[11px] text-muted-foreground">Cari Pegawai</Label>
                      <div className="relative mt-0.5">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Nama atau NIP..."
                          value={rekapSearchTerm}
                          onChange={(e) => setRekapSearchTerm(e.target.value)}
                          className="h-8 text-xs pl-8"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TABEL DATA HASIL FILTER */}
              {loadingRekap ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Memuat data monitoring presensi...</p>
                </div>
              ) : rekapMode === "harian" ? (
                /* TABEL MODE HARIAN */
                filteredUsersWithAttendance.length === 0 ? (
                  <p className="text-xs text-center p-8 text-muted-foreground">
                    Tidak ada pegawai yang cocok dengan filter atau belum terdaftar pada klaster yang dipilih.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 text-muted-foreground border-b border-border/40">
                        <tr>
                          <th className="p-2.5 font-medium">Pegawai</th>
                          <th className="p-2.5 font-medium">Klaster</th>
                          <th className="p-2.5 font-medium">Status Kehadiran</th>
                          <th className="p-2.5 font-medium">Masuk</th>
                          <th className="p-2.5 font-medium">Pulang</th>
                          <th className="p-2.5 font-medium">Jarak GPS</th>
                          <th className="p-2.5 font-medium">Integritas & Anti-Fraud</th>
                          <th className="p-2.5 font-medium">Foto / Dokumen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {filteredUsersWithAttendance.map((item) => {
                          const rec = item.record;
                          const audit = rec?.antiFraudAudit;
                          const isHigh = audit && (audit.riskLevel === "high" || audit.fraudScore >= 60);
                          const isSuspicious = audit && (audit.riskLevel === "suspicious" || (audit.fraudScore >= 35 && audit.fraudScore < 60));

                          return (
                            <tr key={item.user.uid} className="hover:bg-muted/30">
                              <td className="p-2.5">
                                <div className="font-semibold text-foreground">{item.user.namaLengkap}</div>
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  NIP: {item.user.nip || "-"} &bull; {item.jabatan?.namaJabatan || item.user.namaJabatan || "Staf"}
                                </div>
                              </td>
                              <td className="p-2.5">
                                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                  {item.jabatan?.klasterStruktur || "umum"}
                                </Badge>
                              </td>
                              <td className="p-2.5">
                                {rec ? (
                                  <Badge
                                    variant={
                                      rec.statusKehadiran === "hadir"
                                        ? "default"
                                        : rec.statusKehadiran === "terlambat"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="text-[10px] uppercase font-semibold"
                                  >
                                    {rec.statusKehadiran.replace("_", " ")}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-300">
                                    Belum Presensi
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2.5 font-mono">
                                {rec?.jamMasuk ? (
                                  <span className={rec.statusMasuk === "terlambat" ? "text-amber-600 font-semibold" : ""}>
                                    {rec.jamMasuk}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-2.5 font-mono">{rec?.jamPulang || "-"}</td>
                              <td className="p-2.5 font-mono text-muted-foreground">
                                {rec?.lokasiMasuk?.jarakMeter !== undefined ? `${rec.lokasiMasuk.jarakMeter}m` : "-"}
                              </td>
                              <td className="p-2.5">
                                {audit ? (
                                  <button
                                    type="button"
                                    onClick={() => setSelectedAuditRecord(rec)}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors hover:opacity-80"
                                  >
                                    {isHigh ? (
                                      <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                                        <span>🚨 Resiko ({audit.fraudScore})</span>
                                      </span>
                                    ) : isSuspicious ? (
                                      <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3 text-amber-600" />
                                        <span>⚠️ Cek ({audit.fraudScore})</span>
                                      </span>
                                    ) : (
                                      <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3 text-emerald-600" />
                                        <span>Aman ({audit.fraudScore})</span>
                                      </span>
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">-</span>
                                )}
                              </td>
                              <td className="p-2.5">
                                <div className="flex items-center gap-1.5">
                                  {rec?.fotoMasukUrl && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      title="Lihat Foto Masuk"
                                      onClick={() => setPreviewPhotoUrl(rec.fotoMasukUrl || null)}
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                                    </Button>
                                  )}
                                  {rec?.dokumenPendukungUrl && (
                                    <a
                                      href={rec.dokumenPendukungUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center justify-center h-7 w-7 text-xs text-orange-600 hover:bg-muted rounded"
                                      title="Lihat Bukti Izin/Surat"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                /* TABEL MODE PERIODE / BULANAN */
                aggregatedPeriodeUsers.length === 0 ? (
                  <p className="text-xs text-center p-8 text-muted-foreground">
                    Tidak ada data agregat pegawai pada rentang tanggal terpilih.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 text-muted-foreground border-b border-border/40">
                        <tr>
                          <th className="p-2.5 font-medium">Pegawai</th>
                          <th className="p-2.5 font-medium">Klaster</th>
                          <th className="p-2.5 font-medium text-center">Tepat Waktu</th>
                          <th className="p-2.5 font-medium text-center">Terlambat</th>
                          <th className="p-2.5 font-medium text-center">Izin / Sakit</th>
                          <th className="p-2.5 font-medium text-center">Total Hadir Fisik</th>
                          <th className="p-2.5 font-medium text-center">Total Hari Tercatat</th>
                          <th className="p-2.5 font-medium text-right">Tingkat Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {aggregatedPeriodeUsers.map((item) => {
                          const s = item.stats;
                          const pctColor =
                            s.persentase >= 90
                              ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200"
                              : s.persentase >= 75
                              ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200"
                              : "text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200";

                          return (
                            <tr key={item.user.uid} className="hover:bg-muted/30">
                              <td className="p-2.5">
                                <div className="font-semibold text-foreground">{item.user.namaLengkap}</div>
                                <div className="text-[11px] text-muted-foreground font-mono">
                                  NIP: {item.user.nip || "-"} &bull; {item.jabatan?.namaJabatan || item.user.namaJabatan || "Staf"}
                                </div>
                              </td>
                              <td className="p-2.5">
                                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                  {item.jabatan?.klasterStruktur || "umum"}
                                </Badge>
                              </td>
                              <td className="p-2.5 font-mono text-center text-emerald-600 font-semibold">{s.hadir} hr</td>
                              <td className="p-2.5 font-mono text-center text-amber-600 font-semibold">{s.terlambat} hr</td>
                              <td className="p-2.5 font-mono text-center text-blue-600">{s.izin + s.sakit + s.dinasLuar} hr</td>
                              <td className="p-2.5 font-mono text-center font-bold text-foreground">{s.totalHadirFisik} hr</td>
                              <td className="p-2.5 font-mono text-center text-muted-foreground">{s.totalAbsenTercatat} hr</td>
                              <td className="p-2.5 text-right">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-md text-xs font-mono font-bold border ${pctColor}`}
                                >
                                  {s.persentase}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* MODAL KAMERA SWAFOTO LIVE & CLEAN (SENAPATI OC STYLE) */}
      <CameraCapture
        open={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleCameraCapture}
        lokasiName={presensiConfig.lokasiKantor?.namaLokasi || "Kantor Utama"}
        title={
          cameraPurpose === "checkin"
            ? "Swafoto Presensi Masuk"
            : cameraPurpose === "checkout"
            ? "Swafoto Presensi Pulang"
            : "Foto Bukti Kegiatan Harian"
        }
      />

      {/* DIALOG PENGAJUAN IZIN / SAKIT / DINAS LUAR */}
      <PresensiLeaveDialog
        open={isLeaveDialogOpen}
        onOpenChange={setIsLeaveDialogOpen}
        userProfile={userProfile}
        jabatanProfile={jabatanProfile}
        todayStr={todayStr}
        onSuccess={() => {
          fetchPersonalHistory();
        }}
      />

      {/* MODAL PREVIEW FOTO */}
      <Dialog open={Boolean(previewPhotoUrl)} onOpenChange={() => setPreviewPhotoUrl(null)}>
        <DialogContent className="max-w-md p-4 bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm">Bukti Swafoto Presensi</DialogTitle>
          </DialogHeader>
          {previewPhotoUrl && (
            <div className="rounded-xl overflow-hidden border border-border mt-2">
              <img src={previewPhotoUrl} alt="Foto Presensi" className="w-full h-auto object-cover" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL FORENSIK ANTI-FRAUD AUDIT */}
      <AntiFraudAuditDialog
        record={selectedAuditRecord}
        open={Boolean(selectedAuditRecord)}
        onOpenChange={(open) => !open && setSelectedAuditRecord(null)}
      />
    </div>
  );
}
