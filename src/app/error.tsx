"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App level error caught:", error);
    
    // ChunkLoadError interceptor
    const isChunkError = error.message && (
        error.message.toLowerCase().includes("loading chunk") ||
        error.message.toLowerCase().includes("undefined is not a function") ||
        error.message.toLowerCase().includes("failed to fetch dynamically imported module")
    );

    if (isChunkError) {
       console.log("Chunk load error detected in App router. Force reloading page...");
       window.location.reload();
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="max-w-md space-y-4 rounded-xl border border-gray-200 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
          <RefreshCw className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Aplikasi Diperbarui
        </h2>
        <p className="text-sm text-gray-500">
          Sistem baru saja menerima pembaruan (*deployment*) atau ada masalah dengan koneksi lokal Anda. Silakan muat ulang halaman ini untuk mendapatkan versi terbaru yang optimal.
        </p>
        <div className="pt-4">
          <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base font-semibold"
          >
            Muat Ulang Halaman
          </Button>
        </div>
      </div>
    </div>
  );
}
