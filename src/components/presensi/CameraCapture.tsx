"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Camera,
  RefreshCw,
  X,
  FlipHorizontal,
  Check,
  AlertCircle,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { compressImage } from "@/lib/utils";

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void | Promise<void>;
  title?: string;
  mode?: "user" | "environment";
  lokasiName?: string;
}

export function CameraCapture({
  open,
  onClose,
  onCapture,
  title = "Swafoto Presensi",
  mode = "user",
  lokasiName = "Titik Kantor",
}: CameraCaptureProps) {
  const [mounted, setMounted] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(mode);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedTime, setCapturedTime] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Inisialisasi Kamera Perangkat (WebRTC Live)
  const startCamera = useCallback(async (currentMode: "user" | "environment") => {
    setCameraError(null);
    setCapturedPreview(null);
    setCapturedFile(null);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentMode,
          width: { ideal: 1080 },
          height: { ideal: 1440 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Izin kamera ditolak. Harap izinkan akses kamera di pengaturan browser Anda.");
      } else {
        setCameraError("Kamera tidak dapat diakses atau sedang digunakan oleh aplikasi lain.");
      }
    }
  }, [stream]);

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
      // Cegah scroll pada body saat kamera terbuka
      document.body.style.overflow = "hidden";
    } else {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      setCapturedPreview(null);
      setCapturedFile(null);
      setCameraError(null);
      document.body.style.overflow = "";
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      document.body.style.overflow = "";
    };
  }, [open, facingMode]);

  useEffect(() => {
    if (videoRef.current && stream && !capturedPreview) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, capturedPreview]);

  const toggleCamera = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
  };

  // Pengambilan Swafoto Langsung dari Sistem (Anti-Fraud)
  const takeSnapshot = async () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const targetW = video.videoWidth || 720;
      const targetH = video.videoHeight || 960;

      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context initialization failed");

      // Cerminkan jika kamera depan agar foto selfie natural
      if (facingMode === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const now = new Date();
      const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB";
      setCapturedTime(timeStr);

      // Konversi langsung ke Blob terkompresi
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85)
      );

      if (!blob) throw new Error("Gagal mengolah data gambar");

      const previewDataUrl = canvas.toDataURL("image/jpeg", 0.85);
      setCapturedPreview(previewDataUrl);

      const rawFile = new File([blob], `selfie_${Date.now()}.jpg`, { type: "image/jpeg" });
      const compressed = await compressImage(rawFile, 0.75, 1280);
      setCapturedFile(compressed);
    } catch (e) {
      console.error("Failed to capture frame:", e);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    setCapturedFile(null);
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const handleConfirm = () => {
    if (capturedFile) {
      onCapture(capturedFile);
      onClose();
    }
  };

  if (!open || !mounted) return null;

  const content = (
    <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-0 md:p-6 animate-in fade-in duration-200">
      <div className="w-full h-full md:h-[90vh] md:max-w-md bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none md:rounded-3xl md:border md:border-white/15 md:shadow-2xl relative">
        
        {/* 1. TOP HEADER (FROSTED GLASS) */}
        <div className="relative z-20 px-4 py-3.5 bg-slate-950/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h3 className="text-xs md:text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-400" />
                {title}
              </h3>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Swafoto Otentikasi Anti-Fraud
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
            title="Tutup Kamera"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. CAMERA VIEWFINDER (FULLSCREEN FILL) */}
        <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
          {capturedPreview ? (
            /* PREVIEW HASIL JEPRETAN */
            <div className="relative w-full h-full flex items-center justify-center">
              <img src={capturedPreview} alt="Hasil Swafoto" className="w-full h-full object-cover" />
              {/* WATERMARK DIGITAL RESMI */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md border border-white/15 rounded-xl p-3 flex items-center justify-between text-xs text-white/90 shadow-lg">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate font-medium">{lokasiName}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-mono text-emerald-400 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{capturedTime}</span>
                </div>
              </div>
            </div>
          ) : cameraError ? (
            /* KAMERA ERROR / IZIN DITOLAK (TANPA FITUR UPLOAD FILE) */
            <div className="p-8 text-center space-y-4 max-w-xs mx-auto">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white mb-1.5">Akses Kamera Diperlukan</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
              </div>
              <p className="text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/50 p-2.5 rounded-lg">
                Presensi mewajibkan swafoto langsung dari kamera perangkat untuk menjaga keabsahan data kehadiran.
              </p>
              <Button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-11 gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Coba Hubungkan Ulang Kamera
              </Button>
            </div>
          ) : (
            /* LIVE WEBCAM STREAM & BIOMETRIC AI GUIDE */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
              />

              {/* BIOMETRIC FACE FRAME */}
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                {/* Floating Guide Badge */}
                <div className="mb-4 bg-black/60 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium text-white/95 shadow-md">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Posisikan Wajah di Tengah Bingkai</span>
                </div>

                {/* Oval Guide with Glowing Corner Marks */}
                <div className="relative w-60 h-80 border border-white/30 rounded-[50%] flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.6)]">
                  {/* Glowing Edge Silhouette */}
                  <div className="absolute inset-0 rounded-[50%] border-2 border-blue-500/50 animate-pulse" />

                  {/* Corner Targets */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 border-t-2 border-l-2 border-blue-400" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-blue-400" />
                  <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-blue-400" />
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-2 border-r-2 border-blue-400" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* 3. LUXURY ACTION CONTROLS */}
        <div className="p-4 md:p-5 bg-slate-950/95 backdrop-blur-md border-t border-white/10 shrink-0 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] md:pb-5">
          {capturedPreview ? (
            /* PREVIEW ACTIONS */
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRetake}
                className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white border-white/20 text-xs font-semibold gap-2 rounded-xl transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Ambil Ulang
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={!capturedFile}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold gap-2 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
              >
                <Check className="w-4 h-4" /> Gunakan Foto Ini
              </Button>
            </div>
          ) : (
            /* SHUTTER TRIGGER & CAMERA TOGGLE */
            <div className="flex items-center justify-between px-4 max-w-sm mx-auto">
              {/* Ganti Kamera Depan / Belakang */}
              <button
                type="button"
                onClick={toggleCamera}
                disabled={Boolean(cameraError)}
                className="flex flex-col items-center gap-1 text-[11px] text-slate-300 hover:text-white transition-colors disabled:opacity-40"
                title="Ganti Kamera Depan/Belakang"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all">
                  <FlipHorizontal className="w-5 h-5 text-slate-200" />
                </div>
                <span>Balik Kamera</span>
              </button>

              {/* Shutter Button Utama */}
              <button
                type="button"
                disabled={Boolean(cameraError) || isCapturing}
                onClick={takeSnapshot}
                className="w-20 h-20 p-1.5 rounded-full border-4 border-white/90 hover:border-blue-400 active:scale-90 transition-all flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none shadow-2xl"
                title="Ambil Foto"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-inner">
                  <Camera className="w-7 h-7" />
                </div>
              </button>

              {/* Tombol Batal / Keluar */}
              <button
                type="button"
                onClick={onClose}
                className="flex flex-col items-center gap-1 text-[11px] text-slate-300 hover:text-white transition-colors"
                title="Batal"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all">
                  <X className="w-5 h-5 text-slate-200" />
                </div>
                <span>Batal</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );

  return createPortal(content, document.body);
}
