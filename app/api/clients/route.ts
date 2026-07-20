// app/api/clients/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: List all clients for the user
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const userEmail = verifySession(sessionCookie);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const favorite = searchParams.get('favorite');
    const archived = searchParams.get('archived') || 'false';

    const whereClause: any = {
      user_email: userEmail,
      is_archived: archived === 'true',
    };

    if (favorite === 'true') {
      whereClause.is_favorite = true;
    }

    if (search) {
      whereClause.OR = [
        { company_name: { contains: search, mode: 'insensitive' } },
        { contact_person: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        documents: {
          select: {
            id: true,
            type: true,
            created_at: true,
            expires_at: true,
            answers: true,
            signature_status: true,
            pdf_url: true,
            signed_pdf_url: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      clients,
    });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a new client workspace
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const userEmail = verifySession(sessionCookie);
    if (!userEmail) {
      return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_name,
      logo_url,
      contact_person,
      email,
      phone,
      address,
      gst,
      notes,
    } = body;

    if (!company_name || !contact_person || !email || !phone || !address) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields (Company Name, Contact Person, Email, Phone, Address).',
      }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }

    // Create client and first activity log in a transaction
    const client = await prisma.$transaction(async (tx) => {
      const newClient = await tx.client.create({
        data: {
          user_email: userEmail,
          company_name,
          logo_url: logo_url || null,
          contact_person,
          email,
          phone,
          address,
          gst: gst || null,
          notes: notes || null,
        },
      });

      await tx.clientActivity.create({
        data: {
          client_id: newClient.id,
          action: 'CREATED',
          details: `Client workspace created for ${company_name}.`,
        },
      });

      return newClient;
    });

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
