import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Deteksi environment (lokal atau produksi) secara otomatis
  const host = request.headers.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const redirectURI = `${protocol}://${host}/api/google/callback`;

  console.log(`[Google Auth] Initiating auth flow with redirect: ${redirectURI}`);

  const oAuth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectURI
  );

  const { searchParams } = new URL(request.url);
  
  const state = searchParams.get('state');

  if (!state) {
    return NextResponse.json({ error: 'State parameter is required' }, { status: 400 });
  }

  try {
    const base64 = state.replace(/-/g, '+').replace(/_/g, '/');
    const statePayload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    
    if (!statePayload.userId) {
         return NextResponse.json({ error: 'User ID is required in state' }, { status: 400 });
    }
  } catch (e) {
      console.error("[Google Auth] Gagal mem-parsing state:", e);
      return NextResponse.json({ error: 'Invalid state format' }, { status: 400 });
  }

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline', 
    scope: [
        'https://www.googleapis.com/auth/userinfo.email', 
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/calendar.events', 
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',      
        'https://www.googleapis.com/auth/drive.readonly', 
        'https://www.googleapis.com/auth/documents'        
    ],
    state: state, 
    prompt: 'consent' 
  });

  return NextResponse.redirect(authorizeUrl);
}