import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Hanya berlaku untuk /dashboard
  if (!pathname.startsWith('/dashboard')) return NextResponse.next();
  // Cegah infinite loop
  if (pathname.includes('/_sigap') || pathname.includes('/_natakarya')) {
    return NextResponse.next();
  }
  
  // Baca token dari cookie
  const token = request.cookies.get('firebase-auth-token')?.value;
  
  if (!token) {
    // Jika mencoba akses dashboard tapi tidak ada token, redirect ke login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const claims = jwtDecode<{ app_theme?: string }>(token);
    // Prioritaskan claims app_theme, jika tidak ada asumsikan 'sigap'
    const theme = claims.app_theme || 'sigap';
    
    // Rewrite URL ke folder yang sesuai secara transparan
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = `/dashboard/_${theme}${pathname.replace('/dashboard', '')}`;
    return NextResponse.rewrite(newUrl);
    
  } catch (error) {
    console.error("Middleware JWT Decode error:", error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
