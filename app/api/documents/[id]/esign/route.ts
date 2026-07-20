// app/api/documents/[id]/esign/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { initiateEsign } from '@/lib/esign';
import { getStoragePath } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { signers } = body; // Array of { name, email }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Document ID is required.' }, { status: 400 });
    }

    if (!signers || !Array.isArray(signers) || signers.length === 0) {
      return NextResponse.json({ success: false, error: 'Signers information is required.' }, { status: 400 });
    }

    // Validate email addresses of each signer
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const signer of signers) {
      if (!signer.name || !signer.email || !emailRegex.test(signer.email)) {
        return NextResponse.json(
          { success: false, error: 'Each signer must have a valid name and email address.' },
          { status: 400 }
        );
      }
    }

    // 1. Fetch the document metadata
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    }

    // Check if eSign is already complete or active
    if ((document.signature_status as string) === 'SIGNED' || (document.signature_status as string) === 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'Document is already signed.' }, { status: 400 });
    }

    // 2. Read compiled PDF buffer
    const filePath = getStoragePath('documents', `${id}.pdf`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, error: 'PDF file is missing on server.' }, { status: 404 });
    }

    const pdfBuffer = fs.readFileSync(filePath);

    // 3. Initiate Esign
    const esignResult = await initiateEsign(pdfBuffer, id, signers);

    if (!esignResult.success) {
      return NextResponse.json({ success: false, error: 'Failed to initiate eSign request.' }, { status: 500 });
    }

    // 4. Update document with signing request details
    await prisma.document.update({
      where: { id },
      data: {
        esign_request_id: esignResult.esignRequestId,
        signature_status: 'SENT_FOR_SIGNATURE',
      },
    });

    return NextResponse.json({
      success: true,
      esignRequestId: esignResult.esignRequestId,
      signingUrls: esignResult.signingUrls,
    });
  } catch (error: any) {
    console.error(`Error in POST /api/documents/${params.id}/esign:`, error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
