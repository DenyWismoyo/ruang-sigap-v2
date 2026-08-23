// Lokasi: src/app/layout.tsx
// [REFACTOR] Menggunakan AppProviders untuk struktur provider yang bersih.
// [INTEGRASI] Menambahkan ServiceWorkerReset untuk membersihkan cache PWA yang bermasalah.

import type { Metadata, Viewport } from "next";
import { Inter, Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import AppProviders from "@/context/AppProviders";
import { ServiceWorkerReset } from "@/components/ServiceWorkerReset"; // [BARU] Import komponen reset
import OfflineSyncManager from "@/components/OfflineSyncManager"; // [BARU] Import offline sync manager

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: {
    template: "%s | SIGAP",
    default: "SIGAP - Sistem Integrasi & Administrasi Persuratan",
  },
  description:
    "SIGAP: Solusi E-Office Cerdas untuk Transformasi Digital Birokrasi.",
  keywords: [
    "SIGAP",
    "e-office",
    "administrasi persuratan",
    "birokrasi modern",
  ],
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Disable pinch-zoom for native app feel
  userScalable: false,
  viewportFit: "cover", // Essential for Notch/Home Bar Safe Areas
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="SIGAP" />
        <meta name="theme-color" content="#0284c7" />
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message && e.message.toLowerCase().includes('loading chunk')) {
                  console.warn('ChunkLoadError intercepted. Hard reloading...');
                  window.location.reload();
                }
              }, true);
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && e.reason.message && e.reason.message.toLowerCase().includes('loading chunk')) {
                  console.warn('ChunkLoadError (Promise) intercepted. Hard reloading...');
                  window.location.reload();
                }
              });
            `
          }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          sora.variable,
          plusJakartaSans.variable
        )}
      >
        {/* [BARU] ServiceWorkerReset dipasang di sini (paling atas dalam body).
            Ini akan berjalan sekali di sisi klien untuk memastikan tidak ada SW lama yang nyangkut.
        */}
        <ServiceWorkerReset />

        <AppProviders>
          <OfflineSyncManager />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
