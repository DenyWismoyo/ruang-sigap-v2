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
  
  // Workaround untuk bug Firebase Hosting Web Frameworks yang terkadang me-rewrite `/` menjadi `/index.html`
  async rewrites() {
    return [
      {
        source: '/index.html',
        destination: '/',
      },
    ];
  },

  // Redirect host lama (Firebase Hosting) ke App Hosting baru
  async redirects() {
    return [
      {
        // JIKA BUKA DARI DOMAIN LAMA DAN ADA SESI (Cookie __session)
        source: '/:path*',
        has: [
          { type: 'host', value: 'sigap-opd.web.app' },
          { type: 'cookie', key: '__session' }
        ],
        destination: 'https://sgp.omnifit.cloud/dashboard',
        permanent: false,
      },
      {
        // JIKA BUKA DARI DOMAIN LAMA TAPI TIDAK ADA SESI
        source: '/:path*',
        has: [
          { type: 'host', value: 'sigap-opd.web.app' }
        ],
        destination: 'https://sgp.omnifit.cloud/login',
        permanent: false,
      }
    ];
  },
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
