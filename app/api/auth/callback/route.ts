// app/api/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { signSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Authorization token is missing.' }, { status: 400 });
    }

    // 1. Fetch the magic token
    const magicToken = await prisma.magicToken.findUnique({
      where: { token },
    });

    if (!magicToken) {
      return NextResponse.json({ success: false, error: 'Invalid or unrecognized token.' }, { status: 400 });
    }

    // 2. Validate expiration & single-use enforcement
    if (magicToken.used) {
      return NextResponse.json({ success: false, error: 'This login link has already been used.' }, { status: 400 });
    }

    const now = new Date();
    if (now > new Date(magicToken.expires_at)) {
      return NextResponse.json({ success: false, error: 'This login link has expired.' }, { status: 400 });
    }

    // 3. Mark the token as used
    await prisma.magicToken.update({
      where: { id: magicToken.id },
      data: { used: true },
    });

    // Log user login activity
    try {
      await prisma.adminActivityLog.create({
        data: {
          email: magicToken.email,
          action: 'USER_LOGIN',
          details: `User successfully authenticated via magic link.`
        }
      });
    } catch (e) {
      console.error('Failed to log login activity:', e);
    }

    // 4. Issue session signature
    const sessionToken = signSession(magicToken.email);

    // 5. Build response and set HTTP-only cookie
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
    console.error('Error in GET /api/auth/callback:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
