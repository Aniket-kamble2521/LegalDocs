// app/api/onboarding/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    const { user_type, categories } = body;

    if (!user_type) {
      return NextResponse.json({ success: false, error: 'User type is required.' }, { status: 400 });
    }

    // Upsert user preferences
    const preferences = await prisma.userPreferences.upsert({
      where: { email },
      update: {
        onboarded: true,
        user_type,
        categories: categories || [],
      },
      create: {
        email,
        onboarded: true,
        user_type,
        categories: categories || [],
      },
    });

    // Create a default/empty company profile if none exists
    const existingProfile = await prisma.companyProfile.findUnique({
      where: { email },
    });

    if (!existingProfile) {
      await prisma.companyProfile.create({
        data: {
          email,
          company_name: '',
          address: '',
          state: '',
          country: 'India',
          representative: '',
          phone: '',
          email_contact: email,
        },
      });
    }

    // Log onboarding activity
    await prisma.adminActivityLog.create({
      data: {
        email,
        action: 'USER_ONBOARDED',
        details: `User completed onboarding. Type: ${user_type}. Categories: ${JSON.stringify(categories)}`,
      },
    });

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error: any) {
    console.error('Error during onboarding submission:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
