// app/api/documents/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Document ID is required.' }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
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
