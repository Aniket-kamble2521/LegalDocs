// app/api/documents/[id]/download/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getStoragePath } from '@/lib/storage';
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

    // 1. Fetch document metadata
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found.' },
        { status: 404 }
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
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: isSigned ? 'Signed PDF has not been generated or compiled yet.' : 'PDF file not found on disk. Please contact support.' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    
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
