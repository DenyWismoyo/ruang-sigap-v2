"use client";

import React from 'react';
import { PublicPageLayout } from "@/components/public/PublicPageLayout";
import { Scale, CheckCircle, AlertTriangle, FileText, ServerCrash, Gavel } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <PublicPageLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted/30 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-[-50%]" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <Scale className="w-4 h-4" />
            <span>Legal & Syarat Penggunaan</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">
            Ketentuan Layanan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Harap baca dengan saksama ketentuan layanan ini sebelum menggunakan aplikasi SIGAP.
          </p>
          <div className="mt-8 text-sm text-muted-foreground font-medium">
            Terakhir diperbarui: 24 Agustus 2026
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 md:py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary hover:prose-a:text-primary/80">
            
            <div className="bg-card border border-border shadow-sm rounded-xl p-8 mb-10">
              <h3 className="text-xl flex items-center gap-3 mt-0 mb-4">
                <CheckCircle className="w-6 h-6 text-primary" />
                1. Penerimaan Ketentuan
              </h3>
              <p>
                Dengan mendaftar, mengakses, atau menggunakan aplikasi web Sistem Integrasi Administrasi Persuratan (SIGAP) beserta seluruh layanannya, Anda sepakat untuk terikat secara hukum dengan Ketentuan Layanan ini. Jika Anda tidak menyetujui sebagian atau seluruh ketentuan ini, Anda tidak diperkenankan untuk menggunakan layanan SIGAP.
              </p>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-8 mb-10">
              <h3 className="text-xl flex items-center gap-3 mt-0 mb-4">
                <FileText className="w-6 h-6 text-primary" />
                2. Penggunaan Layanan & Akun Pengguna
              </h3>
              <p>
                Aplikasi SIGAP merupakan platform enterprise B2B/B2G yang disediakan untuk mendukung administrasi e-office pada instansi pemerintah, organisasi, maupun korporasi. Pengguna diwajibkan untuk:
              </p>
              <ul>
                <li>Menggunakan sistem secara sah sesuai dengan peraturan perundang-undangan dan pedoman internal instansi masing-masing.</li>
                <li>Menjaga kerahasiaan kredensial akses (username, password, token OAuth). Segala aktivitas yang terjadi di bawah akun Anda sepenuhnya merupakan tanggung jawab hukum Pengguna atau Instansi yang menaungi.</li>
                <li>Tidak melakukan tindakan yang bertujuan merusak, membebani, atau mengganggu infrastruktur cloud SIGAP (misalnya <em>DDoS</em>, <em>penetration testing</em> tanpa izin tertulis, atau eksploitasi celah keamanan).</li>
              </ul>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-8 mb-10">
              <h3 className="text-xl flex items-center gap-3 mt-0 mb-4">
                <AlertTriangle className="w-6 h-6 text-primary" />
                3. Kebijakan Layanan Pihak Ketiga
              </h3>
              <p>
                SIGAP menggunakan integrasi API dari penyedia layanan pihak ketiga (seperti Firebase Authentication, Google Drive API, dan Google Calendar API). 
              </p>
              <p>
                Ketersediaan integrasi tersebut bergantung pada layanan pihak ketiga. Pengguna setuju bahwa SIGAP tidak bertanggung jawab atas gangguan yang bersumber langsung dari penyedia layanan pihak ketiga. Penggunaan layanan Google juga tunduk pada <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Google Terms of Service</a>.
              </p>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-8 mb-10">
              <h3 className="text-xl flex items-center gap-3 mt-0 mb-4">
                <ServerCrash className="w-6 h-6 text-primary" />
                4. Pembatasan Tanggung Jawab (Limitation of Liability)
              </h3>
              <p>
                Layanan SIGAP disediakan dengan basis "sebagaimana adanya" (<em>as is</em>) dan "sebagaimana tersedia" (<em>as available</em>). Meskipun kami menerapkan standar SLA 99.99% dan infrastruktur High Availability, kami tidak memberikan jaminan mutlak bebas dari gangguan teknis (<em>downtime</em>).
              </p>
              <p>
                Dalam batas maksimum yang diizinkan oleh hukum, tim pengembang dan manajemen SIGAP tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial (termasuk namun tidak terbatas pada hilangnya data, hilangnya potensi pendapatan, atau gangguan operasional instansi) yang timbul akibat penggunaan atau ketidakmampuan menggunakan layanan ini.
              </p>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-8">
              <h3 className="text-xl flex items-center gap-3 mt-0 mb-4">
                <Gavel className="w-6 h-6 text-primary" />
                5. Hukum yang Berlaku & Yurisdiksi
              </h3>
              <p>
                Ketentuan Layanan ini tunduk dan ditafsirkan berdasarkan hukum Negara Kesatuan Republik Indonesia. Setiap perselisihan yang timbul terkait dengan Ketentuan Layanan ini akan diselesaikan secara musyawarah mufakat, dan jika tidak tercapai kesepakatan, akan diselesaikan melalui yurisdiksi pengadilan di wilayah hukum Republik Indonesia.
              </p>
              <p className="mt-6 text-sm text-muted-foreground border-t border-border/50 pt-4">
                SIGAP berhak untuk mengubah, memodifikasi, atau memperbarui Ketentuan Layanan ini dari waktu ke waktu tanpa pemberitahuan prioritas penuh, namun versi terbaru akan selalu dipublikasikan di halaman ini.
              </p>
            </div>

          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}