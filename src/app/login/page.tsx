// Lokasi: src/app/login/page.tsx
// [PERBAIKAN DARK MODE]
// - Mengganti semua kelas 'dark:...' manual dengan kelas semantik shadcn/ui.
// - 'bg-gray-...' -> 'bg-background', 'bg-muted', 'bg-card'
// - 'text-gray-...' -> 'text-foreground', 'text-muted-foreground'
// - 'border-gray-...' -> 'border-border'

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useUserAuth } from "../../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Logo from "@/app/dashboard/sigap/components/Logo";
import DomainBanner from "@/components/DomainBanner";
import { ThemeToggleCompact } from "@/components/ui/ThemeToggleCompact";
import {
  ArrowLeft,
  Mail,
  Briefcase,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import {
  signInWithCustomToken,
  GoogleAuthProvider,
  User,
  AuthCredential,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

// --- Impor Komponen Shadcn ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
// --- Akhir Impor Shadcn ---

// Komponen utama dipisahkan agar bisa dibungkus Suspense
function LoginComponent() {
  const [loginMode, setLoginMode] = useState<"nip" | "email">("nip");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccessRedirecting, setIsSuccessRedirecting] = useState(false);

  // States untuk sinkronisasi Google
  const [isLinking, setIsLinking] = useState(false);
  const [pendingCredential, setPendingCredential] =
    useState<AuthCredential | null>(null);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [linkNip, setLinkNip] = useState("");
  const [linkPassword, setLinkPassword] = useState("");
  const [linkedProfile, setLinkedProfile] = useState<any>(null);

  const { logIn, logInWithNip, signInWithGoogle, linkGoogleFromLogin, user, initializing } =
    useUserAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // [PERBAIKAN] Redirect via useEffect, bukan conditional render.
  // Ini memastikan tidak ada infinite loop: jika user sudah ada saat halaman login dimuat,
  // redirect dilakukan setelah render pertama, bukan mencegah render form sama sekali.
  useEffect(() => {
    // Tunggu Firebase SDK selesai inisialisasi sebelum memutuskan redirect.
    if (initializing) return;
    // Jika sudah ada sesi aktif, langsung ke dashboard (persistent login).
    if (user) {
      setIsSuccessRedirecting(true);
      const redirectUrl = searchParams?.get("redirect") || "/dashboard";
      router.push(redirectUrl);
    }
  }, [user, initializing, router]);

  useEffect(() => {
    const impersonateToken = searchParams?.get("impersonate_token");
    if (impersonateToken) {
      setLoading(true);
      signInWithCustomToken(auth, impersonateToken)
        .then(() => {
          router.push("/dashboard");
        })
        .catch((error) => {
          setError(
            "Gagal melakukan 'Login Sebagai'. Token tidak valid atau sesi telah berakhir.",
          );
          setLoading(false);
          console.error("Impersonation login error:", error);
        });
    }

    const errorParam = searchParams?.get("error");
    if (errorParam === "account_deactivated") {
      setError(
        "Akun Anda telah dinonaktifkan. Silakan hubungi Administrator OPD Anda (Mungkin batas kuota pengguna telah tercapai).",
      );
    }

    const sessionParam = searchParams?.get("session");
    if (sessionParam === "expired") {
      setError(
        "Sesi Anda telah berakhir. Silakan login kembali untuk melanjutkan.",
      );
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (loginMode === "nip") {
        await logInWithNip(identifier, password);
      } else {
        await logIn(identifier, password);
      }
      setIsSuccessRedirecting(true);
      const redirectUrl = searchParams?.get("redirect") || "/dashboard";
      router.push(redirectUrl);
    } catch (err: any) {
      setError(
        err.message || "Login gagal. Silakan periksa kembali data Anda.",
      );
      console.error(err);
      setLoading(false);
    }
  };

  const handleModeChange = (mode: "nip" | "email") => {
    setLoginMode(mode);
    setIdentifier("");
    setPassword("");
    setError("");
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const idTokenResult = await result.user.getIdTokenResult();

      // Jika sudah memiliki NIP claim, berarti sudah tertaut
      if (idTokenResult.claims.nip) {
        setIsSuccessRedirecting(true);
        const redirectUrl = searchParams?.get("redirect") || "/dashboard";
        router.push(redirectUrl);
        return;
      }

      // Cek di Firestore untuk jaga-jaga jika claim telat update
      const q = query(
        collection(db, "users"),
        where("uid", "==", result.user.uid),
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        setIsSuccessRedirecting(true);
        const redirectUrl = searchParams?.get("redirect") || "/dashboard";
        router.push(redirectUrl);
        return;
      }

      // Belum tertaut, minta input NIP
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential) {
        throw new Error("Gagal mendapatkan kredensial Google.");
      }
      setPendingCredential(credential);
      setPendingUser(result.user);
      setIsLinking(true);
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user") {
        // Abaikan jika user sekadar menutup popup
        return;
      } else if (err.code === "auth/invalid-credential" || err.message?.includes("invalid_client")) {
        setError("Konfigurasi Login Google pada sistem belum sempurna (OAuth Client Invalid). Silakan hubungi tim IT.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Koneksi jaringan terputus. Pastikan Anda terhubung ke internet.");
      } else {
        setError("Gagal melakukan login dengan Google: " + (err.message || "Kesalahan tidak diketahui."));
      }
      console.error("Google Login Error:", err);
      setLoading(false);
    }
  };

  const checkNipProfile = async () => {
    if (!linkNip) return;
    setLoading(true);
    try {
      const userDocRef = doc(db, "users", linkNip);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setLinkedProfile(userDocSnap.data());
      } else {
        setError("NIP tidak ditemukan di sistem.");
        setLinkedProfile(null);
      }
    } catch (err) {
      console.error(err);
      setError("Gagal mengecek data NIP.");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCredential || !pendingUser) return;
    setError("");
    setLoading(true);
    try {
      await linkGoogleFromLogin(
        linkNip,
        linkPassword,
        pendingCredential,
        pendingUser,
      );
      setIsSuccessRedirecting(true);
      const redirectUrl = searchParams?.get("redirect") || "/dashboard";
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Gagal menautkan akun. Pastikan password benar.");
      console.error(err);
      setLoading(false);
    }
  };

  if (searchParams?.get("impersonate_token")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-semibold text-foreground">
            Mempersiapkan sesi "Login Sebagai"...
          </p>
          {error && (
            <Alert variant="destructive" className="max-w-md">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  // [PERBAIKAN FINAL] Tampilkan spinner jika:
  // 1. Firebase masih inisialisasi (belum tahu ada user atau tidak)
  // 2. User SUDAH terdeteksi ada (sehingga sedang proses redirect)
  // 3. Status isSuccessRedirecting aktif
  if (initializing || isSuccessRedirecting || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-semibold text-foreground">
            {isSuccessRedirecting ? "Menyiapkan ruang kerja Anda..." : "Memeriksa sesi..."}
          </p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  return (
    // [PERBAIKAN DARK MODE]
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4 relative overflow-hidden">
      {/* Banner Migrasi */}
      <div className="absolute top-0 w-full z-50">
        <DomainBanner />
      </div>

      {/* Theme Toggle Button */}
      <div className="absolute top-12 md:top-6 right-6 z-40">
        <ThemeToggleCompact />
      </div>

      {/* Background Animated Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-blue-900/20 animate-gradient-shift z-0" />

      {/* [PERBAIKAN DARK MODE] */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.8 }}
        className="z-10 w-full max-w-4xl"
      >
        <Card className="w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden shadow-2xl border-border interactive-card">
          {/* === Kolom 1: Sisi Informatif === */}
          {/* [PERBAIKAN DARK MODE] */}
          <div className="relative hidden md:flex flex-col justify-center bg-card p-8 lg:p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0 pointer-events-none" />
            <div className="relative z-10 w-full">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                >
                  <Logo className="h-16" />
                </motion.div>
                {/* [PERBAIKAN DARK MODE] */}
                <h1 className="text-3xl font-bold mt-6 text-foreground">
                  Workspace Birokrasi Digital
                </h1>
                <p className="text-lg text-muted-foreground mt-4">
                  Sistem terpadu yang mengorkestrasikan seluruh alur kerja Anda dalam satu
                  platform cerdas.
                </p>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="mt-10"
              >
                <ul className="space-y-5">
                  <motion.li
                    variants={itemVariants}
                    className="flex items-start gap-4 hover:-translate-y-1 transition-transform cursor-default"
                  >
                    <Mail size={20} className="text-primary mt-1 shrink-0" />
                    <div>
                      {/* [PERBAIKAN DARK MODE] */}
                      <h3 className="font-semibold text-foreground">
                        Disposisi Digital
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Lacak alur surat secara real-time.
                      </p>
                    </div>
                  </motion.li>
                  <motion.li
                    variants={itemVariants}
                    className="flex items-start gap-4 hover:-translate-y-1 transition-transform cursor-default"
                  >
                    <Briefcase
                      size={20}
                      className="text-primary mt-1 shrink-0"
                    />
                    <div>
                      {/* [PERBAIKAN DARK MODE] */}
                      <h3 className="font-semibold text-foreground">
                        Ruang Kerja Terpusat
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Semua disposisi, tugas, dan agenda.
                      </p>
                    </div>
                  </motion.li>
                  <motion.li
                    variants={itemVariants}
                    className="flex items-start gap-4 hover:-translate-y-1 transition-transform cursor-default"
                  >
                    <FileText
                      size={20}
                      className="text-primary mt-1 shrink-0"
                    />
                    <div>
                      {/* [PERBAIKAN DARK MODE] */}
                      <h3 className="font-semibold text-foreground">
                        Laporan E-Kinerja
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Catat logbook harian dan unggah bukti.
                      </p>
                    </div>
                  </motion.li>
                </ul>
              </motion.div>
            </div>
          </div>

          {/* === Kolom 2: Form Login === */}
          {/* [PERBAIKAN DARK MODE] */}
          <div className="flex items-center justify-center bg-background p-8 md:p-12">
            <div className="w-full max-w-md">
              {/* [PERBAIKAN DARK MODE] */}
              <CardHeader className="p-0 mb-6 text-center">
                <CardTitle className="text-2xl font-bold text-foreground">
                  Selamat Datang
                </CardTitle>
                <CardDescription>Silakan masuk ke akun Anda</CardDescription>
              </CardHeader>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isLinking ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Tabs
                    value={loginMode}
                    onValueChange={(value) =>
                      handleModeChange(value as "nip" | "email")
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="nip">Pengguna (NIP)</TabsTrigger>
                      <TabsTrigger value="email">
                        Staf/Admin (Email)
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div>
                    {/* [PERBAIKAN DARK MODE] */}
                    <Label
                      htmlFor="identifier"
                      className="text-sm font-bold text-foreground"
                    >
                      {loginMode === "nip" ? "NIP" : "Email"}
                    </Label>
                    <div className="focus-within:scale-[1.01] transition-transform duration-200">
                      <Input
                        id="identifier"
                        type={loginMode === "nip" ? "text" : "email"}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={
                          loginMode === "nip"
                            ? "Masukkan NIP Anda"
                            : "Masukkan email Anda"
                        }
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="focus-within:scale-[1.01] transition-transform duration-200">
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Masukkan password"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full relative overflow-hidden"
                      >
                        <span className="relative z-10 flex items-center">
                          {loading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          {loading ? "Memproses..." : "Login"}
                        </span>
                        {!loading && (
                          <div className="absolute inset-0 z-0 bg-white/20 -translate-x-full hover:animate-shimmer" />
                        )}
                      </Button>
                    </motion.div>

                    {/* Tombol Login Google Super Minimalis */}
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="text-xs text-muted-foreground hover:text-foreground underline opacity-60 hover:opacity-100 transition-opacity"
                      >
                        Alternatif: Login dengan Google
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLinkAccount} className="space-y-6">
                  <Alert className="mb-4">
                    <AlertDescription>
                      Akun Google ini belum tertaut. Silakan masukkan NIP dan
                      Password Anda untuk menautkan secara permanen.
                    </AlertDescription>
                  </Alert>

                  <div>
                    <Label
                      htmlFor="linkNip"
                      className="text-sm font-bold text-foreground"
                    >
                      Masukkan NIP Anda
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="linkNip"
                        type="text"
                        value={linkNip}
                        onChange={(e) => {
                          setLinkNip(e.target.value);
                          setLinkedProfile(null);
                        }}
                        placeholder="Contoh: 198001012005011001"
                        required
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={checkNipProfile}
                        disabled={loading || !linkNip}
                      >
                        Cek
                      </Button>
                    </div>
                  </div>

                  {linkedProfile && (
                    <div className="p-3 bg-muted rounded-md text-sm">
                      <p className="font-semibold text-foreground">
                        {linkedProfile.namaLengkap}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {linkedProfile.jabatanNama}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="linkPassword">
                      Konfirmasi Password NIP
                    </Label>
                    <Input
                      id="linkPassword"
                      type="password"
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                      placeholder="Password akun Anda"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsLinking(false);
                        setPendingCredential(null);
                        setLinkedProfile(null);
                        if (pendingUser)
                          pendingUser.delete().catch(console.error);
                        setPendingUser(null);
                      }}
                      disabled={loading}
                      className="w-1/3"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !linkedProfile}
                      className="flex-1"
                    >
                      {loading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Tautkan & Login
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="mt-8 text-center">
        {/* [PERBAIKAN DARK MODE] */}
        <Button
          asChild
          variant="link"
          className="text-muted-foreground hover:text-primary"
        >
          <Link href="/">
            <ArrowLeft size={16} className="mr-1" />
            Kembali ke Halaman Utama
          </Link>
        </Button>
      </div>
    </div>
  );
}

// Komponen wrapper yang menyertakan Suspense

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        // [PERBAIKAN DARK MODE]
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginComponent />
    </Suspense>
  );
}
