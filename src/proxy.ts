import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || request.nextUrl.hostname;
  
  // Redirect otomatis jika diakses dari domain hosting lama (Firebase Hosting)
  if (hostname.includes('sigap-opd.web.app') || hostname.includes('firebaseapp.com')) {
    const newUrl = new URL(request.url);
    newUrl.hostname = 'sgp.omnifit.cloud';
    newUrl.protocol = 'https:';
    newUrl.port = ''; 
    return NextResponse.redirect(newUrl);
  }

  const { pathname } = request.nextUrl;
  
  // Hanya berlaku untuk /dashboard
  if (!pathname.startsWith('/dashboard')) return NextResponse.next();
  // Cegah infinite loop
  if (pathname.includes('/sigap') || pathname.includes('/poros')) {
    return NextResponse.next();
  }
  
  // Baca token dari cookie __session (karena Firebase Hosting men-strip cookie lain) atau fallback ke firebase-auth-token
  let token = request.cookies.get('firebase-auth-token')?.value;
  let sessionTheme = null;
  
  const sessionCookie = request.cookies.get('__session')?.value;
  if (sessionCookie) {
      try {
          const sessionData = JSON.parse(decodeURIComponent(sessionCookie));
          if (sessionData.token) token = sessionData.token;
          if (sessionData.theme) sessionTheme = sessionData.theme;
      } catch(e) {
          // Jika __session bukan JSON, asumsikan itu raw token (fallback)
          if (!token) token = sessionCookie;
      }
  }
  
  if (!token) {
    // Jika mencoba akses dashboard tapi tidak ada token, redirect ke login dengan membawa path tujuan
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cegah akses langsung ke folder UI (contoh: /dashboard/sigap) agar URL tetap rapi
  // Tetapi pertahankan sisa path-nya agar deep link (seperti notifikasi) tidak putus!
  if (pathname.startsWith('/dashboard/sigap') || pathname.startsWith('/dashboard/poros')) {
    const cleanPath = pathname.replace(/^\/dashboard\/(sigap|poros)/, '/dashboard');
    return NextResponse.redirect(new URL(cleanPath, request.url));
  }

  try {
    const claims = jwtDecode<{ app_theme?: string; exp?: number }>(token);
    
    // Token berhasil di-decode.
    // Pengecekan expired tidak dilakukan di sini, karena Firebase SDK di client 
    // akan mengurus perpanjangan token secara transparan. Jika token tidak valid,
    // request API ke Firestore/Functions akan gagal dengan sendirinya, 
    // dan AuthContext akan memaksa logout.
    
    
    // 1. Cek theme dari __session (paling update dari client)
    // 2. Cek cookie app-theme (hanya bekerja di lokal)
    // 3. Cek claims app_theme (dari token)
    // 4. Fallback ke sigap
    const cookieTheme = request.cookies.get('app-theme')?.value;
    let theme = sessionTheme || cookieTheme || claims.app_theme || 'sigap';
    // Mapping tema lama 'natakarya' ke 'poros' dan validasi tema
    if (theme === 'natakarya') theme = 'poros';
    if (!['sigap', 'poros'].includes(theme)) theme = 'sigap';
    
    // Rewrite URL ke folder yang sesuai secara transparan
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = `/dashboard/${theme}${pathname.replace('/dashboard', '')}`;
    return NextResponse.rewrite(newUrl);
    
  } catch (error) {
    console.error("Middleware JWT Decode error:", error);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match semua request paths kecuali yang diawali dengan:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, sw.js (PWA assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js).*)',
  ],
};
