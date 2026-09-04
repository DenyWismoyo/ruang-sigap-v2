import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// [MODIFIKASI] Impor 'db' terpusat
import { db } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  // Deteksi environment (lokal atau produksi) secara otomatis
  const host = request.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseDomain = `${protocol}://${host}`;

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId'); // Ini adalah NIP
  const redirectUrl = searchParams.get('redirectUrl');
  const targetPath = (redirectUrl && redirectUrl !== '/dashboard/profil') ? redirectUrl : '/dashboard';

  const getRedirect = (params: string) => {
    const sep = targetPath.includes('?') ? '&' : '?';
    return `${baseDomain}${targetPath}${sep}${params}`;
  };

  // Validasi parameter
  if (!userId || userId === 'undefined' || userId === 'null') {
    console.warn('Disconnect attempt failed: userId missing or invalid.');
    return NextResponse.redirect(getRedirect('error=invalid_user_session'));
  }

  try {
    // [PERBAIKAN ERROR BUILD] Cek apakah db sudah terinisialisasi
    if (!db) {
        console.error("Server Error: Database connection is missing.");
        return NextResponse.redirect(getRedirect('error=server_config_missing'));
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
        // Hapus googleEmail juga saat disconnect
        await userRef.update({
          googleRefreshToken: null,
          googleAccessToken: null,
          googleTokenExpiry: null,
          googleCalendarSyncEnabled: false,
          googleEmail: null 
        });
    } else {
        console.warn(`Dokumen user tidak ditemukan untuk NIP: ${userId}`);
    }
    
    return NextResponse.redirect(getRedirect('success=google_disconnected'));
  
  } catch (error: any) {
    console.error('Error disconnecting Google Calendar:', error);
    return NextResponse.redirect(getRedirect(`error=${encodeURIComponent(error.message)}`));
  }
}