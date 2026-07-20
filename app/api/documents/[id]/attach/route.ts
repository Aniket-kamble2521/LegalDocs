// app/api/documents/[id]/attach/route.ts
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

// POST: Attach or detach a document to/from a client workspace
export async function POST(request: Request, { params }: RouteParams) {
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

    const documentId = params.id;
    const body = await request.json();
    const { clientId } = body; // Can be string or null (to detach)

    // 1. Verify the document belongs to the user
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        OR: [
          { email: userEmail },
          { order: { email: userEmail } },
        ],
      },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    }

    const oldClientId = document.client_id;

    // 2. If attaching to a client, verify that client exists and belongs to the user
    if (clientId) {
      const client = await prisma.client.findFirst({
        where: { id: clientId, user_email: userEmail },
      });

      if (!client) {
        return NextResponse.json({ success: false, error: 'Target client workspace not found.' }, { status: 404 });
      }
    }

    // 3. Update the document's client_id in a transaction and log activities
    await prisma.$transaction(async (tx) => {
      // Update document
      await tx.document.update({
        where: { id: documentId },
        data: {
          client_id: clientId || null,
        },
      });

      // Log activity in old client if detaching/moving
      if (oldClientId && oldClientId !== clientId) {
        const oldClient = await tx.client.findUnique({ where: { id: oldClientId } });
        if (oldClient) {
          await tx.clientActivity.create({
            data: {
              client_id: oldClientId,
              action: 'DOC_DETACHED',
              details: `Agreement "${document.type.replace(/_/g, ' ')}" (ID: ${document.id}) was detached from ${oldClient.company_name}.`,
            },
          });
        }
      }

      // Log activity in new client if attaching
      if (clientId) {
        await tx.clientActivity.create({
          data: {
            client_id: clientId,
            action: 'DOC_ATTACHED',
            details: `Agreement "${document.type.replace(/_/g, ' ')}" (ID: ${document.id}) was attached.`,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: clientId ? 'Document attached successfully.' : 'Document detached successfully.',
    });
  } catch (error: any) {
    console.error('Error attaching/detaching document:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
