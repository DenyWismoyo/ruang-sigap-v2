// Lokasi: src/app/layout.tsx
// [REFACTOR] Menggunakan AppProviders untuk struktur provider yang bersih.
// [INTEGRASI] PWA WebAPK Compliance, Early Install Prompt Capture, & Multi-Device Icons.

import type { Metadata, Viewport } from "next";
import { Inter, Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import AppProviders from "@/context/AppProviders";
import OfflineSyncManager from "@/components/OfflineSyncManager";
import JsonLd from "@/components/seo/JsonLd";
import PwaRegister from "@/components/PwaRegister";

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
  metadataBase: new URL("https://sgp.omnifit.cloud"),
  title: {
    template: "%s | SIGAP",
    default: "SIGAP - Sistem Integrasi & Administrasi Persuratan",
  },
  description:
    "SIGAP: Solusi E-Office Cerdas untuk Transformasi Digital Birokrasi. Kelola persuratan, disposisi, dan dokumen secara cerdas, mudah, dan sesuai standar SPBE.",
  keywords: [
    "SIGAP",
    "e-office",
    "administrasi persuratan",
    "birokrasi modern",
    "persuratan instansi",
    "disposisi surat",
    "sistem pemerintahan berbasis elektronik",
    "SPBE",
  ],
  authors: [{ name: "SIGAP Team" }],
  creator: "SIGAP",
  publisher: "SIGAP E-Office",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png?v=2.2.0", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png?v=2.2.0", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192x192.png?v=2.2.0", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon-192x192.png?v=2.2.0",
  },
  manifest: "/manifest.json?v=2.2.0",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SIGAP",
  },
  openGraph: {
    title: "SIGAP - Sistem Integrasi & Administrasi Persuratan",
    description:
      "Solusi E-Office Cerdas untuk Transformasi Digital Birokrasi. Kelola persuratan secara digital dan real-time.",
    url: "https://sgp.omnifit.cloud",
    siteName: "SIGAP E-Office",
    images: [
      {
        url: "/icon-192x192.png?v=2.2.0",
        width: 192,
        height: 192,
        alt: "SIGAP E-Office Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SIGAP E-Office",
    description: "Solusi E-Office Cerdas untuk Transformasi Digital Birokrasi.",
    images: ["/icon-192x192.png?v=2.2.0"],
    creator: "@sigap",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SIGAP" />
        <link rel="manifest" href="/manifest.json?v=2.2.0" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png?v=2.2.0" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png?v=2.2.0" />
        <link rel="apple-touch-icon" href="/icon-192x192.png?v=2.2.0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Early capture PWA install prompt before React hydrates
              window.__deferredPwaPrompt = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window.__deferredPwaPrompt = e;
                if (typeof window.__onPwaPromptReady === 'function') {
                  window.__onPwaPromptReady(e);
                }
              });

              // ChunkLoadError handler
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
        <PwaRegister />
        <JsonLd />

        <AppProviders>
          <OfflineSyncManager />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
