// app/api/v1/download/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validatePartner } from '@/lib/auth';
import { getStoragePath } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const authResult = await validatePartner(apiKey, '/api/v1/download');

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json({ success: false, error: 'documentId query parameter is required.' }, { status: 400 });
    }

    // 1. Fetch document metadata
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    }

    // Verify B2B workspace isolation
    if (document.email !== `partner-${authResult.partnerId}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. This document does not belong to your B2B partner account.' },
        { status: 403 }
      );
    }

    const isSigned = searchParams.get('signed') === 'true';
    const filename = isSigned ? `${documentId}_signed.pdf` : `${documentId}.pdf`;
    const downloadName = isSigned ? `Signed_Document_${documentId}.pdf` : `Document_${documentId}.pdf`;

    // 2. Locate and read the PDF
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

    // 3. Return PDF binary file response
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${downloadName}`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error(`Error in GET /api/v1/download:`, error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
