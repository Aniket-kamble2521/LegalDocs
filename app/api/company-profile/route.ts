// app/api/company-profile/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Retrieve company profile
export async function GET() {
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

    const profile = await prisma.companyProfile.findUnique({
      where: { email },
    });

    if (!profile) {
      return NextResponse.json({
        success: true,
        profile: null,
      });
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Error fetching company profile:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Save or update company profile
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
    const {
      company_name,
      gst,
      pan,
      address,
      state,
      country,
      representative,
      phone,
      email_contact,
      website,
    } = body;

    if (!company_name || !address || !state || !representative || !phone || !email_contact) {
      return NextResponse.json({
        success: false,
        error: 'Missing required profile fields (Company Name, Address, State, Representative Name, Phone, Email).',
      }, { status: 400 });
    }

    const profile = await prisma.companyProfile.upsert({
      where: { email },
      update: {
        company_name,
        gst: gst || null,
        pan: pan || null,
        address,
        state,
        country: country || 'India',
        representative,
        phone,
        email_contact: email_contact.trim().toLowerCase(),
        website: website || null,
      },
      create: {
        email,
        company_name,
        gst: gst || null,
        pan: pan || null,
        address,
        state,
        country: country || 'India',
        representative,
        phone,
        email_contact: email_contact.trim().toLowerCase(),
        website: website || null,
      },
    });

    // Log admin/user update activity
    await prisma.adminActivityLog.create({
      data: {
        email,
        action: 'UPDATE_COMPANY_PROFILE',
        details: `Updated company profile details for email: ${email_contact}`,
      },
    });

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Error saving company profile:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
