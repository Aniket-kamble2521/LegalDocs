// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      const response = NextResponse.json({ success: false, authenticated: false }, { status: 401 });
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      return response;
    }

    const email = verifySession(sessionCookie);
    if (!email) {
      const response = NextResponse.json({ success: false, authenticated: false }, { status: 401 });
      response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
      return response;
    }

    // Load preferences
    const preferences = await prisma.userPreferences.findUnique({
      where: { email },
    });

    // Load company profile
    const profile = await prisma.companyProfile.findUnique({
      where: { email },
    });

    const response = NextResponse.json({
      success: true,
      authenticated: true,
      email,
      onboarded: preferences?.onboarded || false,
      user_type: preferences?.user_type || null,
      categories: preferences?.categories || [],
      has_company_profile: !!profile,
    });
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
  } catch (error: any) {
    console.error('Error fetching session info:', error);
    const response = NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    response.headers.set('Cache-Control', 'no-store, max-age=0, must-revalidate');
    return response;
  }
}
