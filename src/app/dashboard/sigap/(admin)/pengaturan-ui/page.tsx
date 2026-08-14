"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import { useUserAuth } from '@/context/AuthContext';
import { useMasterData } from '@/app/dashboard/sigap/hooks/useMasterData';
import { OPD, UserProfile, OpdConfig } from '@/types';
import { Palette, Loader2, Save, User as UserIcon, Building, RotateCcw } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { callCloudFunction } from "@/lib/firebase";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function PengaturanUIPage() {
  const { userProfile, loading: authLoading } = useUserAuth();
  const { opdList, isLoading: opdLoading } = useMasterData(true);
  const { addToast } = useToast();

  const [opdConfigs, setOpdConfigs] = useState<Map<string, OpdConfig>>(new Map());
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ambil Data OPD Configs secara realtime
  useEffect(() => {
    const unsubConfigs = onSnapshot(collection(db, 'opdConfigs'), snap => {
        const configs = new Map<string, OpdConfig>();
        snap.forEach(doc => configs.set(doc.id, { id: doc.id, ...doc.data() } as OpdConfig));
        setOpdConfigs(configs);
    });
    return () => unsubConfigs();
  }, []);

  // Fetch Users
  useEffect(() => {
      const fetchUsers = async () => {
          setLoading(true);
          try {
              const q = query(collection(db, 'users'));
              const snap = await getDocs(q);
              const usersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
              setUsers(usersData);
          } catch (error) {
              console.error("Error fetching users:", error);
          } finally {
              setLoading(false);
          }
      };
      
      // Load users only if super_admin
      if (userProfile?.role === 'super_admin') {
          fetchUsers();
      }
  }, [userProfile]);

  const callThemeApi = async (action: string, payload: any) => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('firebase-auth-token='))
      ?.split('=')[1];

    if (!token) throw new Error("No auth token found");

    const res = await fetch('/api/theme', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action, ...payload })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Gagal menghubungi server");
    }
    return data;
  };

  const handleSetOpdTheme = async (opdId: string, theme: string) => {
    try {
      setLoading(true);
      await callThemeApi('setOpdUiTheme', { opdId, theme });
      addToast(`Tema OPD berhasil diubah menjadi ${theme === 'sigap' ? 'SIGAP' : 'NataKarya'}.`, 'success');
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetUserTheme = async (nip: string, theme: string) => {
    try {
      setLoading(true);
      await callThemeApi('setUserUiTheme', { nip, theme });
      addToast(`Tema User berhasil dioverride menjadi ${theme === 'sigap' ? 'SIGAP' : 'NataKarya'}.`, 'success');
      
      // Update local state temporarily
      setUsers(prev => prev.map(u => u.nip === nip ? { ...u, app_theme: theme as any } : u));
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetUserTheme = async (nip: string) => {
    try {
      setLoading(true);
      await callThemeApi('resetUserUiTheme', { nip });
      addToast('Override tema user berhasil dihapus (kembali ke default OPD).', 'success');
      
       // Update local state temporarily
       setUsers(prev => prev.map(u => u.nip === nip ? { ...u, app_theme: undefined } : u));
    } catch (error: any) {
      addToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  if (authLoading || opdLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  if (userProfile?.role !== 'super_admin') {
    return <div className="p-6 text-center text-red-500">Akses Ditolak. Halaman ini hanya untuk Super Admin.</div>;
  }

  const filteredUsers = users.filter(u => 
      u.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.nip.includes(searchQuery)
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Palette className="w-8 h-8 text-violet-600" />
          Pengaturan White-Label UI
        </h1>
        <p className="text-muted-foreground mt-2">
          Atur tema antarmuka (UI) default untuk setiap OPD atau override per-pengguna secara spesifik.
          <br/>
          <span className="text-sm font-medium text-orange-600">Catatan: Perubahan akan berlaku setelah pengguna melakukan login ulang.</span>
        </p>
      </div>

      <Tabs defaultValue="opd" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="opd" className="flex items-center gap-2">
            <Building className="w-4 h-4" /> Tema per OPD
          </TabsTrigger>
          <TabsTrigger value="user" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" /> Override per User
          </TabsTrigger>
        </TabsList>
        
        {/* TAB TEMA OPD */}
        <TabsContent value="opd" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Tema OPD</CardTitle>
              <CardDescription>
                Tema yang dipilih di sini akan menjadi tema bawaan untuk semua pengguna di dalam OPD tersebut, kecuali pengguna memiliki override.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead>Nama OPD</TableHead>
                      <TableHead className="w-[200px]">Tema Aktif</TableHead>
                      <TableHead className="w-[250px]">Aksi Ubah Tema</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {opdList.map((opd) => {
                      const config = opdConfigs.get(opd.id!);
                      const currentTheme = config?.default_theme || 'sigap';

                      return (
                        <TableRow key={opd.id}>
                          <TableCell className="font-medium">{opd.namaOpd}</TableCell>
                          <TableCell>
                            {currentTheme === 'sigap' ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">SIGAP</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">NataKarya</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select 
                              disabled={loading}
                              value={currentTheme} 
                              onValueChange={(val) => handleSetOpdTheme(opd.id!, val)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih Tema" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sigap">SIGAP</SelectItem>
                                <SelectItem value="natakarya">NataKarya</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB TEMA USER */}
        <TabsContent value="user" className="space-y-4">
           <Card>
            <CardHeader>
              <CardTitle>Override Tema per Pengguna</CardTitle>
              <CardDescription>
                Pilih pengguna secara spesifik yang ingin diberikan tema berbeda dari default OPD-nya.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="flex items-center gap-4">
                <Input 
                  placeholder="Cari berdasarkan NIP atau Nama..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>

              <div className="rounded-md border overflow-hidden max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead>NIP</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>Asal OPD</TableHead>
                      <TableHead className="w-[180px]">Tema Override</TableHead>
                      <TableHead className="w-[280px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.slice(0, 50).map((user) => {
                      const opd = opdList.find(o => o.id === user.opdId);
                      const opdConfig = opdConfigs.get(user.opdId);
                      const opdTheme = opdConfig?.default_theme || 'sigap';
                      
                      const hasOverride = !!user.app_theme;
                      const activeTheme = user.app_theme || opdTheme;

                      return (
                        <TableRow key={user.nip}>
                          <TableCell className="font-mono text-xs">{user.nip}</TableCell>
                          <TableCell className="font-medium">{user.namaLengkap}</TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {opd?.namaOpd || 'Unknown OPD'}
                          </TableCell>
                          <TableCell>
                             {hasOverride ? (
                                <Badge variant="default" className={user.app_theme === 'sigap' ? 'bg-blue-600' : 'bg-purple-600'}>
                                  {user.app_theme === 'sigap' ? 'SIGAP' : 'NataKarya'}
                                </Badge>
                             ) : (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  Default OPD 
                                  <Badge variant="outline" className="text-[10px] py-0 px-1">{opdTheme}</Badge>
                                </span>
                             )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                                <Select 
                                  disabled={loading}
                                  value={hasOverride ? user.app_theme : ''} 
                                  onValueChange={(val) => handleSetUserTheme(user.nip, val)}
                                >
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Override Tema" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="sigap">SIGAP</SelectItem>
                                    <SelectItem value="natakarya">NataKarya</SelectItem>
                                  </SelectContent>
                                </Select>

                                {hasOverride && (
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => handleResetUserTheme(user.nip)}
                                    title="Kembalikan ke Default OPD"
                                    disabled={loading}
                                  >
                                    <RotateCcw className="w-4 h-4 text-red-500" />
                                  </Button>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Tidak ada pengguna ditemukan.
                            </TableCell>
                        </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="text-xs text-muted-foreground text-right">Menampilkan {Math.min(filteredUsers.length, 50)} pengguna teratas.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
