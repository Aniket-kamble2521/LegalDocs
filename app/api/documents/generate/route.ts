// app/api/documents/generate/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAnswersConsistency } from '@/lib/llm';
import { generatePdf } from '@/lib/pdf';
import { getStoragePath } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, answers } = body;

    if (!orderId || !answers) {
      return NextResponse.json(
        { success: false, error: 'Missing orderId or answers in request body.' },
        { status: 400 }
      );
    }

    // 1. Fetch order and verify that payment was successful
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found.' },
        { status: 404 }
      );
    }

    if (order.status !== 'PAID') {
      return NextResponse.json(
        { success: false, error: 'Payment required. Document generation is blocked until payment is complete.' },
        { status: 402 } // 402 Payment Required
      );
    }

    // 2. Perform Anthropic Claude / local rule consistency checks
    const consistency = await checkAnswersConsistency(answers);
    if (!consistency.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Document consistency check failed. Please review your answers.', 
          details: consistency.errors 
        },
        { status: 400 }
      );
    }

    // 3. Find correct template variant based on docType and answers
    const docType = (answers.docType || 'NDA').trim().toUpperCase();
    let templateDocType = docType;
    let variant = 'STANDARD';
    if (docType === 'MUTUAL_NDA') {
      templateDocType = 'NDA';
      variant = 'MUTUAL';
    } else if (docType === 'UNILATERAL_NDA') {
      templateDocType = 'NDA';
      variant = 'UNILATERAL';
    } else if (docType === 'FREELANCE_AGREEMENT') {
      templateDocType = 'SERVICE_AGREEMENT';
      variant = 'STANDARD';
    } else if (docType === 'RENTAL_AGREEMENT') {
      templateDocType = 'RENTAL_AGREEMENT';
      variant = 'STANDARD';
    } else if (docType === 'NDA') {
      const ndaTypeLower = (answers.ndaType || '').trim().toLowerCase();
      variant = ndaTypeLower === 'mutual' ? 'MUTUAL' : 'UNILATERAL';
    } else if (docType === 'SERVICE_AGREEMENT') {
      variant = 'STANDARD';
    }
    
    let template = await prisma.template.findFirst({
      where: {
        type: templateDocType,
        variant,
        is_active: true,
      },
    });

    let templateContent = '';
    if (template) {
      templateContent = template.content;
    } else {
      // Resilient fallback to templates/ filesystem files
      let filename = '';
      if (templateDocType === 'NDA') {
        filename = variant === 'MUTUAL' ? 'nda-mutual.html' : 'nda-unilateral.html';
      } else if (templateDocType === 'SERVICE_AGREEMENT') {
        filename = 'service-agreement.html';
      } else if (templateDocType === 'RENTAL_AGREEMENT') {
        filename = 'rental-agreement.html';
      }

      const filepath = path.join(process.cwd(), 'templates', filename);
      if (filename && fs.existsSync(filepath)) {
        templateContent = fs.readFileSync(filepath, 'utf-8');
      } else {
        return NextResponse.json(
          { success: false, error: `Template for type ${templateDocType} variant ${variant} could not be loaded.` },
          { status: 500 }
        );
      }
    }

    // 4. Register Document record with a 48-hour expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const clientId = body.clientId;

    const document = await prisma.document.create({
      data: {
        order_id: orderId,
        type: `${docType}_${variant}`,
        answers: answers,
        expires_at: expiresAt,
        client_id: clientId || null,
      },
    });

    if (clientId) {
      try {
        await prisma.clientActivity.create({
          data: {
            client_id: clientId,
            action: 'DOC_ATTACHED',
            details: `Agreement "${docType}_${variant}" (ID: ${document.id}) was automatically attached upon generation.`,
          },
        });
      } catch (e) {
        console.error('Failed to log client activity during generation:', e);
      }
    }

    // 5. Set up workspace folder for secure file storage
    const outputDir = getStoragePath('documents');
    const pdfPath = path.join(outputDir, `${document.id}.pdf`);

    // 6. Compile and generate PDF using Puppeteer
    await generatePdf(templateContent, answers, pdfPath);

    // 7. Update document entry with the download url
    const downloadUrl = `/api/documents/${document.id}/download`;
    await prisma.document.update({
      where: { id: document.id },
      data: {
        pdf_url: downloadUrl,
      },
    });

    // Send PDF document download link email confirmation to the user asynchronously
    if (order.email) {
      try {
        const { sendDocumentConfirmationEmail } = require('@/lib/email');
        sendDocumentConfirmationEmail(order.email, order.id, downloadUrl).catch((err: any) => {
          console.error('[EMAIL ERROR] Failed to send document confirmation email:', err);
        });
      } catch (emailErr) {
        console.error('[EMAIL ERROR] Failed to require or initiate confirmation email:', emailErr);
      }
    }

    // Record audit activity log
    try {
      await prisma.adminActivityLog.create({
        data: {
          email: order.email || 'guest@legaldocs.co',
          action: 'GENERATE_DOCUMENT',
          details: `Generated PDF for Document ID: ${document.id}`
        }
      });
    } catch (e) {
      console.error('Failed to log document generation:', e);
    }

    return NextResponse.json({
      success: true,
      documentId: document.id,
      downloadUrl,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Error in POST /api/documents/generate:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
