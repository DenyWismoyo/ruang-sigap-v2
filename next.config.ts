import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// Meningkatkan limit max listeners untuk menghindari warning MaxListenersExceededWarning di dev server
require('events').EventEmitter.defaultMaxListeners = 20;

const nextConfig: NextConfig = {
  // Standalone mode diperlukan untuk deployment Firebase Functions/Hosting
  output: "standalone",
  
  // Optimasi Memori: Matikan Source Map di Produksi
  productionBrowserSourceMaps: false,
  
  // Matikan kompresi build (Firebase Hosting sudah melakukan gzip otomatis)
  compress: false,
  
  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**', 
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**', 
      }
    ],
  },

  experimental: {
    scrollRestoration: true,
    // Tetap batasi CPU ke 1 agar proses build tidak memakan memori berlebih
    cpus: 1,
    optimizePackageImports: ["lucide-react", "date-fns", "lodash"],
  }
};

export default nextConfig;
