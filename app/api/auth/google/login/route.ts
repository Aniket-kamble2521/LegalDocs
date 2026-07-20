// app/api/auth/google/login/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Google Client ID is not configured in environment variables.' }, { status: 500 });
    }

    // Determine redirect URI
    let redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!redirectUri) {
      const url = new URL(request.url);
      redirectUri = `${url.protocol}//${url.host}/api/auth/google/callback`;
    }

    // Generate Google OAuth authorization URL
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'online');
    googleAuthUrl.searchParams.set('prompt', 'select_account');

    return NextResponse.redirect(googleAuthUrl.toString());
  } catch (error: any) {
    console.error('Error in GET /api/auth/google/login:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
