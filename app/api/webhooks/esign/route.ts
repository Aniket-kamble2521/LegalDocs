// app/api/webhooks/esign/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getStoragePath } from '@/lib/storage';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const checksum = request.headers.get('x-digio-checksum') || '';
    const webhookSecret = process.env.DIGIO_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      console.error('[E-SIGN WEBHOOK ERROR] DIGIO_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ success: false, error: 'Webhook secret is not configured.' }, { status: 500 });
    }

    const expectedChecksum = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedChecksum !== checksum) {
      console.warn('[E-SIGN WEBHOOK WARNING] Checksum validation failed.');
      return NextResponse.json({ success: false, error: 'Invalid checksum.' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    console.log('[E-SIGN WEBHOOK RECEIVED] Payload:', payload);

    // Extract Digio Request ID / Envelope ID
    // Digio formats can vary or be mocked in unit tests, support multiple styles:
    const esignRequestId = 
      payload.document_id || 
      payload.payload?.document?.id || 
      payload.esignRequestId;

    if (!esignRequestId) {
      return NextResponse.json({ success: false, error: 'Missing esignRequestId in payload' }, { status: 400 });
    }

    // 1. Find document by esign request ID
    const document = await prisma.document.findFirst({
      where: { esign_request_id: esignRequestId },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document matching request ID not found.' }, { status: 404 });
    }

    // 2. Simulate compiling the signed document by duplicating the original PDF
    const originalPath = getStoragePath('documents', `${document.id}.pdf`);
    const signedPath = getStoragePath('documents', `${document.id}_signed.pdf`);

    // Fallback: If original PDF is missing from ephemeral disk, recover it from database bytes
    if (!fs.existsSync(originalPath) && document.pdf_bytes) {
      try {
        const dir = path.dirname(originalPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(originalPath, document.pdf_bytes);
        console.log(`[ESIGN WEBHOOK] Restored original PDF to temp storage from database for document ${document.id}`);
      } catch (recoveryErr) {
        console.error('Failed to recover original PDF to temp storage:', recoveryErr);
      }
    }

    if (!fs.existsSync(originalPath)) {
      return NextResponse.json({ success: false, error: 'Original PDF not found on disk or database.' }, { status: 404 });
    }

    // Copy original PDF to simulate signed document storage
    fs.copyFileSync(originalPath, signedPath);
    const signedPdfBytes = fs.readFileSync(signedPath);

    // 3. Update database state to SIGNED
    const downloadUrl = `/api/documents/${document.id}/download?signed=true`;
    await prisma.document.update({
      where: { id: document.id },
      data: {
        signature_status: 'SIGNED',
        signed_at: new Date(),
        signed_pdf_url: downloadUrl,
        signed_pdf_bytes: signedPdfBytes,
      },
    });

    console.log(`[E-SIGN COMPLETE] Document ${document.id} status updated to SIGNED`);

    return NextResponse.json({ success: true, message: 'Signature status updated successfully.' });
  } catch (error: any) {
    console.error('Error handling eSign webhook callback:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
