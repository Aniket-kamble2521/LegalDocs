// app/api/auth/google/callback/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      console.error('Google OAuth callback returned error:', errorParam);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorParam)}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/login?error=OAuth+code+is+missing', request.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    
    // Determine redirect URI
    let redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!redirectUri) {
      const url = new URL(request.url);
      redirectUri = `${url.protocol}//${url.host}/api/auth/google/callback`;
    }

    // Exchange code for token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Failed to exchange Google OAuth code:', tokenData);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(tokenData.error_description || 'Token exchange failed.')}`, request.url));
    }

    const idToken = tokenData.id_token;
    if (!idToken) {
      return NextResponse.redirect(new URL('/login?error=Missing+ID+token+from+Google', request.url));
    }

    // Decode ID token (JWT payload base64url)
    const payloadBase64 = idToken.split('.')[1];
    const payloadStr = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const { email, name } = JSON.parse(payloadStr);

    if (!email) {
      return NextResponse.redirect(new URL('/login?error=Email+not+provided+by+Google', request.url));
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Create user profile or balance record automatically on first login
    try {
      const existingBalance = await prisma.creditBalance.findUnique({
        where: { email: normalizedEmail },
      });

      if (!existingBalance) {
        // Create credit balance with 0 credits on first login
        await prisma.creditBalance.create({
          data: {
            email: normalizedEmail,
            credits: 0,
          },
        });
        console.log(`[GOOGLE AUTH] Created trial balance for new user: ${normalizedEmail}`);
      }
    } catch (e) {
      console.error('Failed to initialize user balance:', e);
    }

    // Initialize user preferences if they don't exist
    try {
      const existingPrefs = await prisma.userPreferences.findUnique({
        where: { email: normalizedEmail },
      });

      if (!existingPrefs) {
        await prisma.userPreferences.create({
          data: {
            email: normalizedEmail,
            onboarded: false,
          },
        });
      }
    } catch (e) {
      console.error('Failed to initialize user preferences:', e);
    }

    // Log admin activity log
    try {
      await prisma.adminActivityLog.create({
        data: {
          email: normalizedEmail,
          action: 'USER_LOGIN_GOOGLE',
          details: `User successfully logged in via Google OAuth.`
        }
      });
    } catch (e) {
      console.error('Failed to log Google login activity:', e);
    }

    // Generate session token
    const sessionToken = signSession(normalizedEmail);

    // Redirect to dashboard with cookie
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set({
      name: 'legaldocs_session',
      value: sessionToken,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 604800, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Error in GET /api/auth/google/callback:', error);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message || 'Internal Server Error')}`, request.url));
  }
}
