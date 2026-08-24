"use client";

import React from 'react';
import { PublicPageLayout } from "@/components/public/PublicPageLayout";
import { Shield, Eye, Database, Lock, UserCheck, Calendar, HardDrive } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <PublicPageLayout>
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-muted/30 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-[-50%]" />
        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
            <Shield className="w-4 h-4" />
            <span>Kepatuhan Keamanan & Privasi</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight mb-6">
            Kebijakan Privasi
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Kami berkomitmen penuh untuk melindungi data pribadi dan informasi instansi Anda sesuai dengan regulasi perlindungan data yang berlaku di Indonesia.
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
                <Eye className="w-6 h-6 text-primary" />
                1. Pendahuluan
              </h3>
              <p>
                Sistem Integrasi Administrasi Persuratan (SIGAP) ("kami") sangat menghargai privasi Anda. Kebijakan Privasi ini menjelaskan secara transparan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat Anda menggunakan aplikasi web SIGAP. 
              </p>
              <p>
                Dengan mengakses dan menggunakan sistem ini, Anda menyetujui praktik pengumpulan dan penggunaan data yang dijelaskan dalam dokumen ini. Kebijakan ini disusun dengan mematuhi prinsip perlindungan data pribadi dan Sistem Pemerintahan Berbasis Elektronik (SPBE).
              </p>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-8 mb-10">
              <h3 className="text-xl flex items-center gap-3 mt-0 mb-4">
                <Database className="w-6 h-6 text-primary" />
                2. Informasi yang Kami Kumpulkan
              </h3>
              <p>Untuk menyediakan layanan administrasi e-office yang optimal, kami mengumpulkan jenis informasi berikut:</p>
              <ul>
                <li><strong>Informasi Akun (Profil Pengguna):</strong> Saat Anda login menggunakan akun Google atau kredensial instansi, kami menerima informasi profil dasar termasuk Nama Lengkap, Alamat Email, dan Foto Profil.</li>
                <li><strong>Data Organisasi:</strong> Jabatan, unit kerja, NIP (Nomor Induk Pegawai), dan peran (role) dalam sistem yang dikelola oleh Administrator Instansi Anda.</li>
                <li><strong>Aktivitas Sistem (Audit Trail):</strong> Log interaksi Anda dengan sistem seperti waktu login, pembuatan surat, disposisi, dan aksi lainnya untuk keperluan keamanan dan non-repudiation.</li>
              </ul>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-8 mb-10">
              <h3 className="text-xl flex items-center gap-3 mt-0 mb-4">
                <UserCheck className="w-6 h-6 text-primary" />
                3. Penggunaan Google API Services
              </h3>
              <p>
                SIGAP mengintegrasikan layanan Google untuk meningkatkan produktivitas pengguna. Penggunaan informasi yang diterima dari Google APIs mematuhi <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, termasuk persyaratan Penggunaan Terbatas (Limited Use).
              </p>
              
              <h4 className="flex items-center gap-2 mt-6">
                <Calendar className="w-5 h-5 text-muted-foreground" /> 
                Akses Google Calendar
              </h4>
              <p>
                Jika Anda memberikan izin, sistem akan mengakses Google Calendar Anda secara eksklusif untuk menambahkan, membaca, dan memperbarui jadwal rapat dinas atau agenda yang terintegrasi dengan surat tugas Anda. Kami <strong>tidak</strong> membaca agenda pribadi Anda yang tidak terkait dengan SIGAP.
              </p>

              <h4 className="flex items-center gap-2 mt-6">
                <HardDrive className="w-5 h-5 text-muted-foreground" /> 
                Akses Google Drive
              </h4>
              <p>
                Untuk modul arsip dan lampiran, sistem dapat mengakses folder Google Drive tertentu. Akses ini hanya digunakan untuk mengunggah, menyimpan, dan menampilkan kembali dokumen persuratan atau bukti kinerja yang Anda unggah melalui aplikasi SIGAP.
              </p>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-8 mb-10">
              <h3 className="text-xl flex items-center gap-3 mt-0 mb-4">
                <Lock className="w-6 h-6 text-primary" />
                4. Keamanan dan Retensi Data
              </h3>
              <p>
                Kami menerapkan standar keamanan teknis dan organisasi yang ketat (seperti Enkripsi AES-256 untuk data-at-rest dan TLS 1.2+ untuk data-in-transit) untuk melindungi data Anda dari akses, modifikasi, atau penghancuran yang tidak sah.
              </p>
              <p>
                Data Anda disimpan pada infrastruktur cloud yang berada di wilayah kedaulatan Republik Indonesia (Data Residency) sesuai dengan mandat Peraturan Pemerintah No. 71 Tahun 2019 tentang PSTE. Data arsip persuratan akan disimpan sesuai dengan Jadwal Retensi Arsip (JRA) instansi Anda.
              </p>
            </div>

            <div className="bg-card border border-border shadow-sm rounded-xl p-8">
              <h3 className="text-xl flex items-center gap-3 mt-0 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                5. Hubungi Data Protection Officer (DPO)
              </h3>
              <p>
                Jika Anda memiliki pertanyaan, kekhawatiran, atau ingin melaksanakan hak Anda terkait perlindungan data pribadi, silakan hubungi Administrator Sistem di instansi Anda atau Tim Dukungan SIGAP melalui:
              </p>
              <ul className="list-none pl-0 mt-4">
                <li><strong>Email:</strong> privacy@sigap-eoffice.id</li>
                <li><strong>Telepon/WhatsApp:</strong> +62 857-7711-7587</li>
              </ul>
            </div>

          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}