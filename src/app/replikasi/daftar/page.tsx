"use client";

import React, { useState } from 'react';
import { PublicPageLayout } from "@/components/public/PublicPageLayout";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { getStoredReferralCode, clearReferralCode } from '@/lib/referralUtils';

export default function DaftarReplikasiPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama: '',
    jabatan: '',
    instansi: '',
    alamat: '',
    wa: '',
    email: '',
    estimasiPegawai: '',
    kebutuhan: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Baca kode referral dari localStorage (ditangkap sejak halaman pertama dikunjungi)
      // Invisible kepada user — tidak ditampilkan di form
      const referralCode = getStoredReferralCode();

      const payload: Record<string, unknown> = {
        ...formData,
        status: 'Menunggu',
        statusKomisi: 'Belum',
        tanggalPengajuan: Timestamp.now(),
      };

      // Sisipkan kode referral hanya jika ada
      if (referralCode) {
        payload.referralCode = referralCode;
      }

      await addDoc(collection(db, 'replikasiRequests'), payload);
      setIsSuccess(true);
      setFormData({ nama: '', jabatan: '', instansi: '', alamat: '', wa: '', email: '', estimasiPegawai: '', kebutuhan: '' });
      // Bersihkan kode referral dari localStorage setelah form terkirim
      clearReferralCode();
      alert("Permintaan replikasi berhasil dikirim! Tim kami akan segera menghubungi Anda.");
      router.push('/replikasi');
    } catch (error) {
      console.error("Gagal mengirim permintaan:", error);
      alert("Terjadi kesalahan saat mengirim permintaan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPageLayout>
      <section className="pt-32 pb-20 bg-background relative z-10 min-h-screen" id="form-replikasi">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-[-50%] max-w-4xl mx-auto" />
        <div className="max-w-3xl mx-auto px-6 relative">
          <Button variant="ghost" onClick={() => router.push('/replikasi')} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Panduan
          </Button>
          
          <div className="bg-card border border-border/50 rounded-3xl shadow-lg p-8 md:p-12 relative overflow-hidden">
            {/* Dekorasi sudut */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10" />
            
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 tracking-tight">Form Pengajuan Replikasi</h1>
              <p className="text-muted-foreground">
                Silakan isi data instansi Anda. Tim teknis kami akan menghubungi untuk menjadwalkan sesi konsultasi dan assessment.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Lengkap (PIC)</Label>
                  <Input id="nama" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} placeholder="Cth: Budi Santoso" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Input id="jabatan" required value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} placeholder="Cth: Kepala Bidang E-Gov" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instansi">Nama Instansi / OPD</Label>
                <Input id="instansi" required value={formData.instansi} onChange={e => setFormData({...formData, instansi: e.target.value})} placeholder="Cth: Dinas Kominfo Kota X" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat Instansi</Label>
                <Textarea id="alamat" required value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} placeholder="Alamat lengkap kantor" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="wa">Nomor WhatsApp</Label>
                  <Input id="wa" type="tel" required value={formData.wa} onChange={e => setFormData({...formData, wa: e.target.value})} placeholder="Cth: 081234567890" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Dinas / Pribadi</Label>
                  <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Cth: budi@go.id" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimasiPegawai">Estimasi Jumlah Pegawai (Pengguna)</Label>
                <Select value={formData.estimasiPegawai} onValueChange={v => setFormData({...formData, estimasiPegawai: v})}>
                  <SelectTrigger id="estimasiPegawai">
                    <SelectValue placeholder="Pilih rentang jumlah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-50">1 - 50 Pegawai</SelectItem>
                    <SelectItem value="51-200">51 - 200 Pegawai</SelectItem>
                    <SelectItem value="201-1000">201 - 1000 Pegawai</SelectItem>
                    <SelectItem value=">1000">Lebih dari 1000 Pegawai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kebutuhan">Kebutuhan Khusus / Catatan Tambahan (Opsional)</Label>
                <Textarea id="kebutuhan" value={formData.kebutuhan} onChange={e => setFormData({...formData, kebutuhan: e.target.value})} placeholder="Cth: Kami membutuhkan integrasi dengan absensi lokal..." className="min-h-[100px]" />
              </div>

              <Button type="submit" size="lg" className="w-full text-base font-bold h-12" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                Kirim Permintaan Replikasi
              </Button>
            </form>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
