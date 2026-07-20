// app/api/clients/[id]/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET: Retrieve a single client's profile with documents and activities
export async function GET(request: Request, { params }: RouteParams) {
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

    const clientId = params.id;

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        user_email: userEmail,
      },
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
          orderBy: {
            created_at: 'desc',
          },
        },
        activities: {
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client,
    });
  } catch (error: any) {
    console.error('Error fetching client details:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT: Update a client's profile details or archive/favorite toggles
export async function PUT(request: Request, { params }: RouteParams) {
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

    const clientId = params.id;

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, user_email: userEmail },
    });

    if (!existingClient) {
      return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 });
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
      is_favorite,
      is_archived,
    } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email !== undefined && !emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }

    // Determine activity details
    const updates: string[] = [];
    if (is_favorite !== undefined && is_favorite !== existingClient.is_favorite) {
      updates.push(is_favorite ? 'marked as favorite' : 'removed from favorites');
    }
    if (is_archived !== undefined && is_archived !== existingClient.is_archived) {
      updates.push(is_archived ? 'archived' : 'restored from archive');
    }
    if (
      company_name || logo_url || contact_person || email || phone || address || gst || notes
    ) {
      updates.push('profile information updated');
    }

    const updatedClient = await prisma.$transaction(async (tx) => {
      const client = await tx.client.update({
        where: { id: clientId },
        data: {
          company_name: company_name !== undefined ? company_name : undefined,
          logo_url: logo_url !== undefined ? logo_url : undefined,
          contact_person: contact_person !== undefined ? contact_person : undefined,
          email: email !== undefined ? email : undefined,
          phone: phone !== undefined ? phone : undefined,
          address: address !== undefined ? address : undefined,
          gst: gst !== undefined ? gst : undefined,
          notes: notes !== undefined ? notes : undefined,
          is_favorite: is_favorite !== undefined ? is_favorite : undefined,
          is_archived: is_archived !== undefined ? is_archived : undefined,
        },
      });

      if (updates.length > 0) {
        await tx.clientActivity.create({
          data: {
            client_id: clientId,
            action: 'UPDATED',
            details: `Client workspace ${updates.join(' and ')}.`,
          },
        });
      }

      return client;
    });

    return NextResponse.json({
      success: true,
      client: updatedClient,
    });
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Delete a client workspace
export async function DELETE(request: Request, { params }: RouteParams) {
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

    const clientId = params.id;

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: { id: clientId, user_email: userEmail },
    });

    if (!existingClient) {
      return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 });
    }

    await prisma.client.delete({
      where: { id: clientId },
    });

    // Log admin/user delete activity
    await prisma.adminActivityLog.create({
      data: {
        email: userEmail,
        action: 'DELETE_CLIENT',
        details: `Deleted client workspace: ${existingClient.company_name} (ID: ${clientId})`,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Client deleted successfully.',
    });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
