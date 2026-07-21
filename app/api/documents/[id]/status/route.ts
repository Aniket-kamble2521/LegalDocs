// app/api/documents/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession, isAdmin } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Document ID is required.' }, { status: 400 });
    }

    // Authenticate request via session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const sessionEmail = verifySession(sessionCookie);
    if (!sessionEmail) {
      return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    }

    // Verify ownership
    const sessionEmailNormalized = sessionEmail.trim().toLowerCase();
    const docEmailNormalized = document.email?.trim().toLowerCase();
    const orderEmailNormalized = document.order?.email?.trim().toLowerCase();

    const isOwner = (docEmailNormalized === sessionEmailNormalized) || (orderEmailNormalized === sessionEmailNormalized);
    const isUserAdmin = isAdmin(sessionEmail);

    if (!isOwner && !isUserAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not own this document.' },
        { status: 403 }
      );
    }

    // Increment view count analytics if requested
    const url = new URL(request.url);
    const incrementView = url.searchParams.get('incrementView') === 'true';
    if (incrementView) {
      try {
        await prisma.document.update({
          where: { id },
          data: {
            view_count: { increment: 1 },
          },
        });
      } catch (e) {
        console.error('Failed to increment view count:', e);
      }
    }

    return NextResponse.json({
      success: true,
      signatureStatus: document.signature_status,
      signedPdfUrl: document.signed_pdf_url,
      downloadCount: document.download_count,
      viewCount: document.view_count,
      lastDownloaded: document.last_downloaded,
      createdAt: document.created_at,
      expiresAt: document.expires_at,
      docType: document.type,
      templateVersion: document.template_version,
      language: document.language,
    });
  } catch (error: any) {
    console.error(`Error in GET /api/documents/${params.id}/status:`, error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
