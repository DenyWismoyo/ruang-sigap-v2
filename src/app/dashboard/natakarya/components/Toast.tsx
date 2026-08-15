// Lokasi: src/app/dashboard/components/Toast.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastType } from '@/context/ToastContext'; // Impor tipe dari konteks

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: <CheckCircle className="text-emerald-500" />,
    style: "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-800/50",
    text: "text-emerald-800 dark:text-emerald-200"
  },
  error: {
    icon: <AlertTriangle className="text-rose-500" />,
    style: "bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-800/50",
    text: "text-rose-800 dark:text-rose-200"
  },
  info: {
    icon: <Info className="text-[var(--nk-gradient-start)]" />,
    style: "bg-[var(--nk-gradient-start)]/5 dark:bg-[var(--nk-gradient-start)]/10 border-[var(--nk-gradient-start)]/20 dark:border-[var(--nk-gradient-start)]/30",
    text: "text-[var(--foreground)]"
  }
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Memicu animasi fade-in saat komponen mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fungsi untuk menutup toast dengan animasi fade-out
  const handleClose = () => {
    setIsVisible(false);
    // Tunggu animasi selesai sebelum memanggil onClose
    setTimeout(() => {
      onClose();
    }, 300); // Durasi harus sama dengan transition
  };

  const config = toastConfig[type] || toastConfig.info;

  return (
    <div
      className={`relative w-full max-w-sm p-4 pr-10 rounded-2xl shadow-xl backdrop-blur-xl border ${config.style} transition-all duration-400 cubic-bezier(0.22, 1, 0.36, 1) ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        <div className="ml-3">
          <p className={`text-sm font-semibold font-heading ${config.text}`}>
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
