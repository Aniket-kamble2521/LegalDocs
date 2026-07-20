// app/api/feedback/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, isAdmin } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: List feedbacks (Admin only)
export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const email = verifySession(sessionCookie);
    if (!email || !isAdmin(email)) {
      return NextResponse.json({ success: false, error: 'Unauthorized access.' }, { status: 403 });
    }

    const feedbacks = await prisma.feedback.findMany({
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      feedbacks,
    });
  } catch (error: any) {
    console.error('Error listing feedbacks:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Submit feedback
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const email = verifySession(sessionCookie);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 });
    }

    const body = await request.json();
    const { type, rating, nps_score, message } = body;

    if (!type || !message) {
      return NextResponse.json({ success: false, error: 'Feedback type and message are required.' }, { status: 400 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        email,
        type,
        rating: rating !== undefined ? Number(rating) : null,
        nps_score: nps_score !== undefined ? Number(nps_score) : null,
        message,
        status: 'NEW',
      },
    });

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
