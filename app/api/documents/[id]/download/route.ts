// app/api/documents/[id]/download/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getStoragePath } from '@/lib/storage';
import { verifySession, isAdmin } from '@/lib/session';
import { cookies } from 'next/headers';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required.' },
        { status: 400 }
      );
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

    // 1. Fetch document metadata alongside order
    const document = await prisma.document.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found.' },
        { status: 404 }
      );
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

    // 2. Validate expiration (48 hours limit)
    const now = new Date();
    if (now > new Date(document.expires_at)) {
      return NextResponse.json(
        { success: false, error: 'The download link has expired. PDF access is valid for 48 hours only.' },
        { status: 410 } // 410 Gone
      );
    }

    // Check signed parameter
    const url = new URL(request.url);
    const isSigned = url.searchParams.get('signed') === 'true';
    const filename = isSigned ? `${id}_signed.pdf` : `${id}.pdf`;
    const downloadName = isSigned ? `Signed_Document_${id}.pdf` : `Document_${id}.pdf`;

    // 3. Locate and read the PDF
    const filePath = getStoragePath('documents', filename);
    let fileBuffer: Buffer;
    
    if (fs.existsSync(filePath)) {
      fileBuffer = fs.readFileSync(filePath);
    } else {
      // Fallback: Recover file bytes from database persistent storage
      const dbBytes = isSigned ? document.signed_pdf_bytes : document.pdf_bytes;
      if (!dbBytes) {
        return NextResponse.json(
          { success: false, error: isSigned ? 'Signed PDF has not been generated or compiled yet.' : 'PDF file not found in database or disk storage.' },
          { status: 404 }
        );
      }
      fileBuffer = Buffer.from(dbBytes);

      // Cache it back to temporary filesystem for optimization
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, fileBuffer);
      } catch (cacheErr) {
        console.error('Failed to write cached file in temp storage:', cacheErr);
      }
    }
    
    // Increment download count and update timestamp
    try {
      await prisma.document.update({
        where: { id },
        data: {
          download_count: { increment: 1 },
          last_downloaded: new Date(),
        },
      });
    } catch (e) {
      console.error('Failed to update download analytics:', e);
    }

    // 4. Return PDF binary file response
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${downloadName}`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error(`Error in GET /api/documents/${params.id}/download:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
