// Lokasi: src/context/AuthContext.tsx
// [PERBAIKAN SESI & PERSISTENT LOGIN]
// - Pisah state `initializing` (Firebase SDK belum siap) dari `loading` (fetch data).
// - Gabungkan dua useEffect menjadi SATU untuk eliminasi race condition.
// - SameSite=Lax + Secure agar cookie bekerja lintas domain (migrasi hosting).
// - Session 30 hari untuk persistent login "tetap masuk sampai logout manual".
// - Guard `lastFetchedUidRef` untuk mencegah re-fetch saat Firebase refresh token (1 jam sekali).

"use client";

import { useContext, createContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { signInWithEmailAndPassword, signOut, onIdTokenChanged, User, UserCredential, signInWithCustomToken, GoogleAuthProvider, signInWithPopup, linkWithCredential, AuthCredential } from 'firebase/auth';
import { db, auth, functions } from '@/lib/firebase';
import { 
  collection, query, where, getDocs, doc, getDoc, Timestamp, updateDoc, arrayRemove
} from 'firebase/firestore';
import { callCloudFunction } from "@/lib/firebase";
import { useQueryClient } from '@tanstack/react-query';


import { 
  UserProfile, Jabatan, OpdConfig
} from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  jabatanProfile: Jabatan | null;
  pltJabatanList: Jabatan[];
  actingJabatanProfile: Jabatan | null;
  opdConfig: OpdConfig | null;
  // [DIHAPUS] opdTemplatList tidak lagi di sini
  loading: boolean;
  /** True hanya saat Firebase SDK pertama kali inisialisasi (belum tahu ada sesi atau tidak).
   *  Berbeda dengan `loading` yang true saat fetch data profil user. */
  initializing: boolean;
  isImpersonating: boolean;
  originalUserUid: string | null;
  
  logIn: (email: string, pass: string) => Promise<UserCredential>;
  logInWithNip: (nip: string, pass: string) => Promise<UserCredential>;
  logOut: () => Promise<void>;
  setActingJabatan: (jabatanId: string | null) => void;
  // Ekspor fungsi signInWithCustomToken agar bisa dipakai di komponen Login
  signInWithToken: (token: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  linkGoogleFromLogin: (nip: string, pass: string, credential: AuthCredential, pendingUser: User) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthContextProviderProps {
    children: ReactNode;
}

// ─── Helper: Set cookie yang aman untuk App Hosting & cross-domain redirect ───
// SameSite=Lax (bukan Strict) agar cookie tetap dikirim saat navigasi dari
// domain lain (misal: banner redirect sigap-opd.web.app → sgp.omnifit.cloud).
// Secure flag wajib ada di production (HTTPS).
const getSecureFlag = () => 
  typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';

// 30 hari dalam detik — untuk persistent session "tetap login sampai logout manual"
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function setSessionCookies(idToken: string, theme?: string | null) {
  const secureFlag = getSecureFlag();
  const sessionPayload: Record<string, string> = { token: idToken };
  if (theme) sessionPayload.theme = theme;

  document.cookie = `__session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax${secureFlag}`;
  document.cookie = `firebase-auth-token=${idToken}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax${secureFlag}`;
}

function clearSessionCookies() {
  const secureFlag = getSecureFlag();
  document.cookie = `firebase-auth-token=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
  document.cookie = `__session=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
  document.cookie = `app-theme=; path=/; max-age=0; SameSite=Lax${secureFlag}`;
}

function setThemeCookie(theme: string) {
  const secureFlag = getSecureFlag();
  document.cookie = `app-theme=${theme}; path=/; max-age=${SESSION_MAX_AGE}; SameSite=Lax${secureFlag}`;
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [jabatanProfile, setJabatanProfile] = useState<Jabatan | null>(null);
  const [pltJabatanList, setPltJabatanList] = useState<Jabatan[]>([]);
  const [actingJabatanProfile, setActingJabatanProfile] = useState<Jabatan | null>(null);
  const [opdConfig, setOpdConfig] = useState<OpdConfig | null>(null);
  
  // `initializing`: true hanya saat Firebase SDK belum selesai cek sesi pertama kali.
  // Login page menggunakan ini agar tidak render form sebelum tahu ada sesi atau tidak.
  const [initializing, setInitializing] = useState(true);
  
  // `loading`: true saat sedang fetch profil user dari Firestore.
  const [loading, setLoading] = useState(false);
  
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalUserUid, setOriginalUserUid] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Ref untuk mencegah duplicate fetch saat token di-refresh Firebase (setiap 1 jam).
  // Menyimpan UID terakhir yang sudah di-fetch agar tidak re-fetch data yang sama.
  const lastFetchedUidRef = useRef<string | null>(null);
  // Ref untuk menyimpan instance logOut agar bisa dipanggil di dalam useEffect
  // tanpa menjadikannya dependency (yang bisa menyebabkan re-subscribe listener).
  const logOutRef = useRef<() => Promise<void>>(async () => {});
  
  // Ref untuk memastikan pencatatan sesi hanya terjadi sekali per hari per user.
  // Memantau aktivitas agar tab yang dibiarkan terbuka berhari-hari tetap tercatat di hari baru.
  const lastRecordedSessionRef = useRef<string | null>(null);

  const checkAndRecordSession = useCallback((uid: string) => {
    // Gunakan tanggal WIB untuk penentuan hari
    const nowStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" });
    const today = new Date(nowStr).toLocaleDateString("en-US");
    const sessionKey = `${uid}_${today}`;

    if (lastRecordedSessionRef.current !== sessionKey) {
      lastRecordedSessionRef.current = sessionKey;
      const recordSession = callCloudFunction('recordUserSession');
      recordSession({}).catch(err => {
        console.warn('[AuthContext] Gagal mencatat sesi user (non-critical):', err?.message);
        // Reset agar bisa dicoba lagi jika gagal
        if (lastRecordedSessionRef.current === sessionKey) {
          lastRecordedSessionRef.current = null;
        }
      });
    }
  }, []);

  // Memantau aktivitas pengguna untuk mencatat sesi (terutama untuk sesi persistent)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleActivity = () => {
      // Hanya catat jika user sudah aktif
      if (user?.uid && userProfile?.status === 'aktif') {
        checkAndRecordSession(user.uid);
      }
    };

    // Panggil saat mount/user berubah
    handleActivity();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') handleActivity();
    };

    let lastClickCheck = 0;
    const onClick = () => {
      const now = Date.now();
      if (now - lastClickCheck > 60000) { // Throttle cek tiap 1 menit
        lastClickCheck = now;
        handleActivity();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', handleActivity);
    window.addEventListener('click', onClick, { passive: true });
    
    // Cek periodik tiap 1 jam untuk antisipasi tab terbuka terus tanpa aktivitas
    const interval = setInterval(handleActivity, 60 * 60 * 1000);

    return () => {
      window.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', handleActivity);
      window.removeEventListener('click', onClick);
      clearInterval(interval);
    };
  }, [user, userProfile, checkAndRecordSession]);

  const defaultFeatures: OpdConfig['features'] = {
    aiSuratReader: false, aiNotulensi: false, analitika: false,
    manajemenAset: false, persetujuanDraf: false, formBuilder: false
  };

  const syncThemeCookie = async (nip: string) => {
    try {
      const userDocRef = doc(db, "users", nip);
      const userDocSnap = await getDoc(userDocRef);
      let theme = 'sigap';
      if (userDocSnap.exists()) {
          const profile = userDocSnap.data();
          theme = profile.app_theme;
          if (!theme && profile.opdId) {
              const configRef = doc(db, 'opdConfigs', profile.opdId);
              const configSnap = await getDoc(configRef);
              if (configSnap.exists()) {
                  theme = configSnap.data().default_theme;
              }
          }
      }
      setThemeCookie(theme || 'sigap');
    } catch(e) {
      console.error("Gagal sinkronisasi tema cookie:", e);
    }
  };

  const logIn = async (email: string, pass: string): Promise<UserCredential> => {
    let nip: string;
    try {
      const checkAdminEmail = callCloudFunction("checkAdminEmail");
      const adminResult: any = await checkAdminEmail({ email });
      nip = adminResult.data.nip;
      if (!nip) throw new Error("Gagal mendapatkan NIP dari email admin.");
    } catch (error: any) {
      throw new Error(error.message || "Gagal memvalidasi email admin.");
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const setNipClaim = callCloudFunction("setNipClaim");
    await setNipClaim({ nip });
    await userCredential.user.getIdToken(true); 
    await syncThemeCookie(nip);
    return userCredential;
  };

  const logInWithNip = async (nip: string, pass: string): Promise<UserCredential> => {
    if (!nip || !pass) throw new Error("NIP dan password tidak boleh kosong.");
    let email = '';
    try {
      const getEmailFromNip = callCloudFunction("getEmailFromNip");
      const result: any = await getEmailFromNip({ nip });
      email = result.data.email;
    } catch (error: any) {
      throw new Error(error.message || "Gagal mengambil data email dari NIP.");
    }
    if (!email) throw new Error("Data email tidak ditemukan untuk NIP tersebut.");
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const setNipClaim = callCloudFunction("setNipClaim");
    await setNipClaim({ nip });
    await userCredential.user.getIdToken(true);
    await syncThemeCookie(nip);
    return userCredential;
  };

  const signInWithToken = async (token: string): Promise<UserCredential> => {
      return await signInWithCustomToken(auth, token);
  }

  const signInWithGoogle = async (): Promise<UserCredential> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return await signInWithPopup(auth, provider);
  };

  const linkGoogleFromLogin = async (nip: string, pass: string, credential: AuthCredential, pendingUser: User): Promise<void> => {
    if (!nip || !pass) throw new Error("NIP dan password tidak boleh kosong.");
    let email = '';
    try {
      const getEmailFromNip = callCloudFunction("getEmailFromNip");
      const result: any = await getEmailFromNip({ nip });
      email = result.data.email;
    } catch (error: any) {
      throw new Error(error.message || "Gagal mengambil data email dari NIP.");
    }
    if (!email) throw new Error("Data email tidak ditemukan untuk NIP tersebut.");

    const providerIds = pendingUser?.providerData.map(p => p.providerId) || [];
    const hasPasswordProvider = providerIds.includes('password');

    // [PERBAIKAN PENTING] Hapus user Google sementara JIKA DIA TIDAK MEMILIKI PASSWORD PROVIDER.
    // Akun yatim (Google-only) harus dihapus agar emailnya bebas untuk login email/password.
    if (pendingUser && !hasPasswordProvider) {
      await pendingUser.delete();
    }

    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      throw new Error("Password invalid. Jika Anda belum memiliki password, silakan hubungi admin atau gunakan fitur lupa password.");
    }

    // Selalu tautkan kredensial, kecuali jika sudah tertaut.
    try {
      await linkWithCredential(userCredential.user, credential);
    } catch (linkErr: any) {
      if (linkErr.code !== 'auth/credential-already-in-use' && linkErr.code !== 'auth/provider-already-linked') {
        throw linkErr;
      }
    }
    
    const setNipClaim = callCloudFunction("setNipClaim");
    await setNipClaim({ nip });
    await userCredential.user.getIdToken(true);
    await syncThemeCookie(nip);
  };

  const logOut = useCallback(async () => {
    queryClient.removeQueries(); 
    queryClient.clear();
    
    if (typeof window !== 'undefined') {
        localStorage.removeItem('notulensi_draft_isi');
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('disposisi_draft_')) localStorage.removeItem(key);
        });
        
        // Hapus token FCM perangkat ini dari Firestore sebelum state user hilang
        if (userProfile?.nip) {
            try {
                const { getFCMToken } = await import('@/lib/firebase-messaging');
                const token = await getFCMToken();
                if (token) {
                    await updateDoc(doc(db, 'users', userProfile.nip), {
                        fcmTokens: arrayRemove(token)
                    });
                }
            } catch (e) {
                console.error("Gagal menghapus FCM token saat logout:", e);
            }
        }
    }
    // Reset State
    setUser(null);
    setUserProfile(null);
    setJabatanProfile(null);
    setPltJabatanList([]);
    setActingJabatanProfile(null);
    setOpdConfig(null);
    setIsImpersonating(false);
    setOriginalUserUid(null);
    lastFetchedUidRef.current = null;
    lastRecordedSessionRef.current = null;
    
    // Hapus semua cookie sesi
    clearSessionCookies();
    
    await signOut(auth);
  }, [queryClient, userProfile?.nip]);

  // Sync ref dengan versi terbaru logOut agar bisa dipanggil dari dalam useEffect
  useEffect(() => {
    logOutRef.current = logOut;
  }, [logOut]);

  const setActingJabatan = useCallback((jabatanId: string | null) => {
    if (!jabatanId || jabatanId === jabatanProfile?.id) {
        setActingJabatanProfile(jabatanProfile);
    } else {
        const actingRole = pltJabatanList.find(j => j.id === jabatanId);
        if (actingRole) setActingJabatanProfile(actingRole);
    }
    queryClient.invalidateQueries();
  }, [jabatanProfile, pltJabatanList, queryClient]);

  // ─── SINGLE useEffect untuk Auth State ───────────────────────────────────────
  // Menggabungkan dua useEffect menjadi satu untuk menghilangkan race condition.
  // Alur: onIdTokenChanged terpanggil → set cookie → fetch profil (jika UID baru) → selesai.
  // Dependency array kosong ([]) disengaja: onIdTokenChanged sudah menangani semua perubahan.
  useEffect(() => {
    // [BARU] Safety timeout: Paksa inisialisasi selesai maksimal setelah 8 detik
    const safetyTimeout = setTimeout(() => {
      setInitializing(prev => {
        if (prev) {
          console.warn("[AuthContext] Firebase auth initialization timeout. Forcing complete.");
          return false;
        }
        return prev;
      });
    }, 8000);

    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      clearTimeout(safetyTimeout);
      if (currentUser) {
        // ── Ada user yang login (atau token di-refresh setiap 1 jam) ──────
        setUser(currentUser);

        const idTokenResult = await currentUser.getIdTokenResult();

        // Tandai impersonation
        if (idTokenResult.claims.impersonated && idTokenResult.claims.originalUid) {
          setIsImpersonating(true);
          setOriginalUserUid(idTokenResult.claims.originalUid as string);
        } else {
          setIsImpersonating(false);
          setOriginalUserUid(null);
        }

        // Set/update cookie sesi dengan token terbaru (penting saat token di-refresh setiap 1 jam)
        const idToken = idTokenResult.token;
        // Baca tema yang sudah ada dari cookie sebelum di-overwrite, agar tidak hilang saat token refresh
        const existingTheme = (() => {
          try {
            const match = document.cookie.match(new RegExp('(^| )__session=([^;]+)'));
            if (match) return JSON.parse(decodeURIComponent(match[2])).theme || null;
          } catch { /* ignore */ }
          return null;
        })();
        setSessionCookies(idToken, existingTheme);

        // ── Guard: Hanya fetch profil jika ini UID yang baru (bukan sekadar token refresh) ──
        if (lastFetchedUidRef.current === currentUser.uid) {
          // Token di-refresh tapi user sama → cukup update cookie, tidak perlu re-fetch
          setInitializing(false);
          return;
        }

        // ── Fetch profil & data OPD untuk user baru ──────────────────────
        setLoading(true);
        lastFetchedUidRef.current = currentUser.uid;

        let nip: string | undefined = idTokenResult.claims.nip as string | undefined;

        if (!nip) {
          // Fallback cari manual jika custom claim belum siap
          const q = query(collection(db, "users"), where("uid", "==", currentUser.uid));
          const userQuerySnapshot = await getDocs(q);
          if (!userQuerySnapshot.empty) {
            nip = userQuerySnapshot.docs[0].id;
          }
        }

        if (!nip) {
          // User tidak ditemukan di sistem — paksa logout
          lastFetchedUidRef.current = null;
          await logOutRef.current();
          setInitializing(false);
          return;
        }

        try {
          // 1. Ambil Profil User
          const userDocRef = doc(db, "users", nip);
          const userDocSnap = await getDoc(userDocRef);

          let profile: UserProfile | null = null;
          if (userDocSnap.exists() && userDocSnap.data().uid === currentUser.uid) {
            profile = { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile;
          } else {
            throw new Error("Profil tidak ditemukan atau UID tidak cocok.");
          }

          if (profile.status === 'nonaktif') {
            await logOutRef.current();
            window.location.href = '/login?error=account_deactivated';
            return;
          }
          setUserProfile(profile);


          // 2. Ambil Config OPD (Untuk Feature Flag & Kuota)
          const configRef = doc(db, 'opdConfigs', profile.opdId);
          const configSnap = await getDoc(configRef);
          let currentOpdConfig: OpdConfig | null = null;
          if (configSnap.exists()) {
            currentOpdConfig = { id: configSnap.id, ...configSnap.data() } as OpdConfig;
            setOpdConfig({ ...currentOpdConfig, features: { ...defaultFeatures, ...currentOpdConfig.features } });
          } else {
            currentOpdConfig = {
              id: profile.opdId, name: 'OPD Default', features: defaultFeatures,
              packageName: 'Dasar', langgananAktifHingga: Timestamp.fromMillis(0),
              paymentStatus: 'Kedaluwarsa', kuotaPengguna: 0, penggunaAktifSaatIni: 0
            } as OpdConfig;
            setOpdConfig(currentOpdConfig);
          }

          // [PERBAIKAN TEMA] Sinkronisasi cookie app-theme & update __session dengan tema
          const userTheme = profile.app_theme || currentOpdConfig?.default_theme || 'sigap';
          setThemeCookie(userTheme);
          // Update __session dengan tema yang sudah diketahui (mengganti existingTheme di atas)
          setSessionCookies(idToken, userTheme);

          // 3. Ambil Jabatan & PLT (Penting untuk hak akses)
          const pltQuery = query(
            collection(db, 'jabatan'),
            where("opdId", "==", profile.opdId),
            where("pltUserId", "==", currentUser.uid),
            where("pltMulaiTanggal", "<=", Timestamp.now())
          );

          const [jabatanSnap, pltSnapshot] = await Promise.all([
            profile.jabatanId ? getDoc(doc(db, 'jabatan', profile.jabatanId)) : null,
            getDocs(pltQuery)
          ]);

          let definitif: Jabatan | null = null;
          if (jabatanSnap && jabatanSnap.exists()) {
            definitif = { id: jabatanSnap.id, ...jabatanSnap.data() } as Jabatan;
            setJabatanProfile(definitif);
            setActingJabatanProfile(definitif);
          }

          const now = Timestamp.now();
          const activePltRoles = pltSnapshot.docs
            .map(d => ({ id: d.id, ...d.data() } as Jabatan))
            .filter(j => j.pltSelesaiTanggal && j.pltSelesaiTanggal.toMillis() >= now.toMillis());
          setPltJabatanList(activePltRoles);

          // ── Catat sesi user untuk metrik adopsi & retensi OPD ────────────
          // (Telah dipindahkan ke event listener `handleActivity` di atas agar
          // tab yang terbuka lama tetap mencatat sesi setiap pergantian hari)

        } catch (error: any) {
          console.error("Error fetching user data:", error);
          lastFetchedUidRef.current = null; // Reset agar bisa retry
          if (!isImpersonating) await logOutRef.current();
        } finally {
          setLoading(false);
        }

      } else {
        // ── Tidak ada user (belum login / setelah logout) ─────────────────
        setUser(null);
        setUserProfile(null);
        setJabatanProfile(null);
        setPltJabatanList([]);
        setActingJabatanProfile(null);
        setOpdConfig(null);
        setIsImpersonating(false);
        setOriginalUserUid(null);
        lastFetchedUidRef.current = null;
        setLoading(false);
      }

      // Apapun hasilnya, Firebase SDK sudah selesai inisialisasi pertama kali
      setInitializing(false);
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Note: dependency array kosong ([]) disengaja. onIdTokenChanged sudah menangani
  // semua perubahan auth state. logOut diakses via logOutRef.current (pattern ref).

  return (
    <AuthContext.Provider value={{
        user, userProfile, jabatanProfile, pltJabatanList, actingJabatanProfile,
        opdConfig,
        loading, initializing, logIn, logInWithNip, logOut, setActingJabatan,
        isImpersonating, originalUserUid, signInWithToken,
        signInWithGoogle, linkGoogleFromLogin
    }}>
      {children} 
    </AuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useUserAuth must be used within an AuthContextProvider");
  return context;
};

export const useAuth = useUserAuth;