"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc,
  getDocs, where, Timestamp
} from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { Loader2, MessageSquare, Trash2, ExternalLink, DollarSign, Users2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Affiliate } from '@/types';

interface ReplikasiRequest {
  id: string;
  nama: string;
  jabatan: string;
  instansi: string;
  alamat: string;
  wa: string;
  email: string;
  estimasiPegawai: string;
  kebutuhan: string;
  status: 'Menunggu' | 'Dihubungi' | 'Diproses' | 'Selesai';
  statusKomisi?: 'Belum' | 'Menunggu Verifikasi' | 'Lunas';
  referralCode?: string;
  nilaiKontrak?: number;
  komisiNominal?: number;
  tanggalPengajuan: any;
}

const formatRupiah = (num: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

export default function PermintaanReplikasiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile, loading: authLoading } = useUserAuth();
  const [requests, setRequests] = useState<ReplikasiRequest[]>([]);
  const [affiliateMap, setAffiliateMap] = useState<Record<string, Affiliate>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRef, setFilterRef] = useState(searchParams.get('ref') || '');
  const [editKontrakId, setEditKontrakId] = useState<string | null>(null);
  const [kontrakInput, setKontrakInput] = useState('');

  // Protect route
  useEffect(() => {
    if (!authLoading && userProfile?.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [userProfile, authLoading, router]);

  // Load affiliates for name lookup
  useEffect(() => {
    getDocs(collection(db, 'affiliates')).then(snap => {
      const map: Record<string, Affiliate> = {};
      snap.forEach(d => {
        const aff = { id: d.id, ...d.data() } as Affiliate;
        map[aff.kodeReferral] = aff;
      });
      setAffiliateMap(map);
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'replikasiRequests'), orderBy('tanggalPengajuan', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data: ReplikasiRequest[] = [];
      snap.forEach(d => {
        data.push({ id: d.id, ...d.data() } as ReplikasiRequest);
      });
      setRequests(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    await updateDoc(doc(db, 'replikasiRequests', id), { status: newStatus });
  };

  const handleUpdateStatusKomisi = async (req: ReplikasiRequest, newStatus: string) => {
    const updateData: Record<string, unknown> = { statusKomisi: newStatus };
    if (newStatus === 'Lunas') {
      updateData.tanggalKomisiLunas = Timestamp.now();
      // Update total komisi earned di affiliate
      if (req.referralCode && affiliateMap[req.referralCode]?.id) {
        const affRef = doc(db, 'affiliates', affiliateMap[req.referralCode].id!);
        const earned = (affiliateMap[req.referralCode].totalKomisiEarned || 0) + (req.komisiNominal || 0);
        await updateDoc(affRef, { totalKomisiEarned: earned });
      }
    }
    await updateDoc(doc(db, 'replikasiRequests', req.id), updateData);
  };

  const handleSaveKontrak = async (req: ReplikasiRequest) => {
    const nilai = parseFloat(kontrakInput.replace(/[^0-9.]/g, ''));
    if (isNaN(nilai) || nilai <= 0) { alert("Masukkan nilai kontrak yang valid."); return; }

    let komisiNominal = 0;
    if (req.referralCode && affiliateMap[req.referralCode]) {
      komisiNominal = (nilai * affiliateMap[req.referralCode].komisiPersen) / 100;
    }

    await updateDoc(doc(db, 'replikasiRequests', req.id), {
      nilaiKontrak: nilai,
      komisiNominal,
      statusKomisi: req.statusKomisi === 'Lunas' ? 'Lunas' : 'Menunggu Verifikasi',
    });
    setEditKontrakId(null);
    setKontrakInput('');
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus data permintaan ini?")) {
      await deleteDoc(doc(db, 'replikasiRequests', id));
    }
  };

  const openWhatsApp = (wa: string) => {
    let formattedWa = wa.replace(/[^0-9]/g, '');
    if (formattedWa.startsWith('0')) formattedWa = '62' + formattedWa.substring(1);
    window.open(`https://wa.me/${formattedWa}`, '_blank');
  };

  if (authLoading || loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (userProfile?.role !== 'super_admin') return null;

  const filtered = requests.filter(req => {
    const matchSearch = req.instansi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRef = filterRef ? req.referralCode === filterRef : true;
    return matchSearch && matchRef;
  });

  const statusKomisiColor = (s?: string) => {
    if (s === 'Lunas') return 'bg-emerald-100 text-emerald-700';
    if (s === 'Menunggu Verifikasi') return 'bg-amber-100 text-amber-700';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-600" />
            Permintaan Replikasi
          </h1>
          <p className="text-muted-foreground mt-1">Kelola pengajuan replikasi dari instansi luar. Kolom komisi otomatis dihitung dari nilai kontrak.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Input
            placeholder="Cari Instansi / PIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-[220px]"
          />
          <Select value={filterRef || '_all'} onValueChange={v => setFilterRef(v === '_all' ? '' : v)}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Semua Sumber" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua Sumber</SelectItem>
              <SelectItem value="_organic">Organik (tanpa ref)</SelectItem>
              {Object.values(affiliateMap).map(aff => (
                <SelectItem key={aff.kodeReferral} value={aff.kodeReferral}>
                  {aff.nama} ({aff.kodeReferral})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instansi & PIC</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Sumber / Mitra</TableHead>
                <TableHead>Nilai Kontrak</TableHead>
                <TableHead>Komisi</TableHead>
                <TableHead>Status Proses</TableHead>
                <TableHead>Status Komisi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Tidak ada data permintaan replikasi.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(req => {
                  const mitra = req.referralCode ? affiliateMap[req.referralCode] : null;
                  return (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div className="font-semibold">{req.instansi}</div>
                        <div className="text-xs text-muted-foreground">{req.nama} - {req.jabatan}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 max-w-[180px] truncate">{req.alamat}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{req.wa}</div>
                        <div className="text-xs text-muted-foreground">{req.email}</div>
                        <Button variant="link" size="sm" className="h-auto p-0 text-green-600 text-xs mt-0.5" onClick={() => openWhatsApp(req.wa)}>
                          Hubungi WA <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        {mitra ? (
                          <div>
                            <Badge variant="outline" className="text-violet-700 border-violet-200 bg-violet-50 text-xs">
                              <Users2 className="w-3 h-3 mr-1" />
                              {mitra.nama}
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">Kode: {req.referralCode}</div>
                            <div className="text-xs text-muted-foreground">Komisi: {mitra.komisiPersen}%</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Organik</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editKontrakId === req.id ? (
                          <div className="flex gap-1">
                            <Input
                              className="h-7 text-xs w-28"
                              placeholder="Nominal Rp"
                              value={kontrakInput}
                              onChange={e => setKontrakInput(e.target.value)}
                              type="number"
                            />
                            <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleSaveKontrak(req)}>OK</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setEditKontrakId(null)}>✕</Button>
                          </div>
                        ) : (
                          <div className="cursor-pointer" onClick={() => { setEditKontrakId(req.id); setKontrakInput(req.nilaiKontrak?.toString() || ''); }}>
                            {req.nilaiKontrak ? (
                              <span className="font-semibold text-foreground">{formatRupiah(req.nilaiKontrak)}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic hover:text-blue-600">+ Isi nilai kontrak</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {req.komisiNominal && req.referralCode ? (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-violet-600" />
                            <span className="font-semibold text-violet-700">{formatRupiah(req.komisiNominal)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select value={req.status} onValueChange={(v) => handleUpdateStatus(req.id, v)}>
                          <SelectTrigger className="h-8 text-xs w-[120px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Menunggu">Menunggu</SelectItem>
                            <SelectItem value="Dihubungi">Dihubungi</SelectItem>
                            <SelectItem value="Diproses">Diproses</SelectItem>
                            <SelectItem value="Selesai">Selesai</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {req.referralCode ? (
                          <Select value={req.statusKomisi || 'Belum'} onValueChange={(v) => handleUpdateStatusKomisi(req, v)}>
                            <SelectTrigger className={`h-8 text-xs w-[145px] ${statusKomisiColor(req.statusKomisi)}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Belum">Belum</SelectItem>
                              <SelectItem value="Menunggu Verifikasi">Menunggu Verifikasi</SelectItem>
                              <SelectItem value="Lunas">✓ Lunas</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(req.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
