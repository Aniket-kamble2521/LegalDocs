// app/api/credits/check/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifySession, isAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email parameter is required.' }, { status: 400 });
    }

    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const sessionEmail = verifySession(sessionCookie);
    if (!sessionEmail) {
      return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 });
    }

    // Gating check: Must be checking their own email or be admin
    if (sessionEmail.trim().toLowerCase() !== email.trim().toLowerCase() && !isAdmin(sessionEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized credit check request.' }, { status: 403 });
    }

    const creditBalance = await prisma.creditBalance.findUnique({
      where: { email },
    });

    return NextResponse.json({
      success: true,
      credits: creditBalance ? creditBalance.credits : 0,
    });
  } catch (error: any) {
    console.error('Error checking credits:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
