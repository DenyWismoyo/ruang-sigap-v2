"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, Timestamp, getDocs, where
} from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { Loader2, Users2, Plus, Edit, Trash2, Copy, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Affiliate } from '@/types';

function generateKodeReferral(nama: string): string {
  // Ambil 4 huruf pertama nama, hapus spasi, tambah angka random 4 digit
  const prefix = nama.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 5);
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix}${suffix}`;
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

export default function AffiliatesPage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useUserAuth();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Affiliate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({});
  const [form, setForm] = useState<Partial<Affiliate>>({
    nama: '', nomorWA: '', email: '', kodeReferral: '', komisiPersen: 10, status: 'Aktif', catatan: ''
  });

  // Guard: super_admin only
  useEffect(() => {
    if (!authLoading && userProfile?.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [userProfile, authLoading, router]);

  // Realtime listener for affiliates
  useEffect(() => {
    const q = query(collection(db, 'affiliates'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, async (snap) => {
      const data: Affiliate[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() } as Affiliate));
      setAffiliates(data);
      setLoading(false);

      // Hitung jumlah lead per kode referral
      const counts: Record<string, number> = {};
      for (const aff of data) {
        const leadsSnap = await getDocs(
          query(collection(db, 'replikasiRequests'), where('referralCode', '==', aff.kodeReferral))
        );
        counts[aff.kodeReferral] = leadsSnap.size;
      }
      setLeadCounts(counts);
    });
    return () => unsub();
  }, []);

  const openAddDialog = () => {
    setEditTarget(null);
    setForm({ nama: '', nomorWA: '', email: '', kodeReferral: '', komisiPersen: 10, status: 'Aktif', catatan: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (aff: Affiliate) => {
    setEditTarget(aff);
    setForm({ ...aff });
    setIsDialogOpen(true);
  };

  const handleGenerateKode = () => {
    setForm(prev => ({ ...prev, kodeReferral: generateKodeReferral(prev.nama || 'MITRA') }));
  };

  const handleSave = async () => {
    if (!form.nama || !form.nomorWA || !form.kodeReferral) {
      alert("Nama, Nomor WA, dan Kode Referral wajib diisi.");
      return;
    }
    setIsSaving(true);
    try {
      if (editTarget?.id) {
        await updateDoc(doc(db, 'affiliates', editTarget.id), { ...form });
      } else {
        await addDoc(collection(db, 'affiliates'), {
          ...form,
          totalReferral: 0,
          totalKomisiEarned: 0,
          createdAt: Timestamp.now(),
        });
      }
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data mitra.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (aff: Affiliate) => {
    if (!aff.id) return;
    const newStatus = aff.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    await updateDoc(doc(db, 'affiliates', aff.id), { status: newStatus });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus mitra ini? Data lead yang sudah masuk tidak akan terhapus.")) return;
    await deleteDoc(doc(db, 'affiliates', id));
  };

  const copyLink = (kode: string, id: string) => {
    const link = `${window.location.origin}/?ref=${kode}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authLoading || loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (userProfile?.role !== 'super_admin') return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users2 className="w-6 h-6 text-violet-600" />
            Mitra Affiliate
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola mitra pemasaran (agen/reseller) dan pantau komisi bagi hasil replikasi.
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Mitra
        </Button>
      </div>

      {/* Ringkasan statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Total Mitra</div>
          <div className="text-2xl font-bold mt-1">{affiliates.length}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Mitra Aktif</div>
          <div className="text-2xl font-bold mt-1 text-green-600">{affiliates.filter(a => a.status === 'Aktif').length}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Total Lead via Mitra</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{Object.values(leadCounts).reduce((a, b) => a + b, 0)}</div>
        </div>
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-muted-foreground">Total Komisi Earned</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">
            {formatRupiah(affiliates.reduce((a, b) => a + (b.totalKomisiEarned || 0), 0))}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Mitra</TableHead>
                <TableHead>Kode Referral</TableHead>
                <TableHead>Komisi (%)</TableHead>
                <TableHead>Total Lead</TableHead>
                <TableHead>Total Komisi Earned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada mitra terdaftar. Klik "Tambah Mitra" untuk mulai.
                  </TableCell>
                </TableRow>
              ) : (
                affiliates.map(aff => (
                  <TableRow key={aff.id}>
                    <TableCell>
                      <div className="font-semibold">{aff.nama}</div>
                      <div className="text-xs text-muted-foreground">{aff.nomorWA}</div>
                      <div className="text-xs text-muted-foreground">{aff.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono font-bold">
                          {aff.kodeReferral}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => copyLink(aff.kodeReferral, aff.id!)}
                          title="Salin link referral"
                        >
                          {copiedId === aff.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-violet-600">{aff.komisiPersen}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{leadCounts[aff.kodeReferral] || 0}</span>
                      {(leadCounts[aff.kodeReferral] || 0) > 0 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-blue-600 ml-2"
                          onClick={() => router.push(`/dashboard/permintaan-replikasi?ref=${aff.kodeReferral}`)}
                        >
                          Lihat Lead <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-emerald-600">
                        {formatRupiah(aff.totalKomisiEarned || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={aff.status === 'Aktif' ? 'default' : 'secondary'}>
                        {aff.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(aff)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={aff.status === 'Aktif' ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'}
                          onClick={() => handleToggleStatus(aff)}
                          title={aff.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {aff.status === 'Aktif' ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(aff.id!)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog Tambah / Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Mitra' : 'Tambah Mitra Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nama Mitra / Agen</Label>
              <Input value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} placeholder="Cth: Agus Pemasaran" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Nomor WhatsApp</Label>
                <Input value={form.nomorWA} onChange={e => setForm(p => ({ ...p, nomorWA: e.target.value }))} placeholder="08xxxxxxxx" />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@..." />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Kode Referral</Label>
              <div className="flex gap-2">
                <Input
                  value={form.kodeReferral}
                  onChange={e => setForm(p => ({ ...p, kodeReferral: e.target.value.toUpperCase() }))}
                  placeholder="Cth: AGUS2025"
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={handleGenerateKode} className="shrink-0">
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Kode unik yang disertakan dalam link yang dibagikan mitra.</p>
            </div>
            <div className="space-y-1">
              <Label>Komisi (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.komisiPersen}
                onChange={e => setForm(p => ({ ...p, komisiPersen: parseFloat(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Catatan (Opsional)</Label>
              <Textarea value={form.catatan} onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} placeholder="Catatan internal tentang mitra ini..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
