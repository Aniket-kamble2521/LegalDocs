// app/api/documents/generate-with-credit/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkAnswersConsistency } from '@/lib/llm';
import { generatePdf } from '@/lib/pdf';
import { getStoragePath } from '@/lib/storage';
import path from 'path';
import fs from 'fs';
import { cookies } from 'next/headers';
import { verifySession, isAdmin } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, answers } = body;

    const targetEmail = (email || '').trim().toLowerCase();

    if (!targetEmail || !answers) {
      return NextResponse.json(
        { success: false, error: 'Missing email or answers in request body.' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const sessionEmail = verifySession(sessionCookie);
    if (!sessionEmail) {
      return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 });
    }

    if (sessionEmail.trim().toLowerCase() !== targetEmail && !isAdmin(sessionEmail)) {
      return NextResponse.json({ success: false, error: 'Unauthorized credit usage.' }, { status: 403 });
    }

    // 1. Atomically check and deduct one credit using updateMany to prevent double-spending
    const updateResult = await prisma.creditBalance.updateMany({
      where: {
        email: targetEmail,
        credits: { gt: 0 },
      },
      data: {
        credits: { decrement: 1 },
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits remaining. Please buy a document bundle first.' },
        { status: 400 }
      );
    }

    // 2. Perform Anthropic Claude / local rule consistency checks
    const consistency = await checkAnswersConsistency(answers);
    if (!consistency.isValid) {
      // Revert the credit deduction if validation checks fail before generating
      await prisma.creditBalance.update({
        where: { email: targetEmail },
        data: { credits: { increment: 1 } },
      });

      return NextResponse.json(
        { 
          success: false, 
          error: 'Document consistency check failed. Reverted deducted credit.', 
          details: consistency.errors 
        },
        { status: 400 }
      );
    }

    // 3. Create a free/credit Order to maintain referential integrity
    const order = await prisma.order.create({
      data: {
        amount: 0,
        status: 'PAID',
        type: 'SINGLE',
        email: targetEmail,
      },
    });

    // 4. Find correct template variant based on docType and answers
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

    // 5. Register Document record with a 48-hour expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const clientId = body.clientId;

    const document = await prisma.document.create({
      data: {
        order_id: order.id,
        type: `${docType}_${variant}`,
        answers: answers,
        expires_at: expiresAt,
        email: targetEmail, // Store directly on the document for easy user dashboard lookup
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

    // 6. Set up workspace folder for secure file storage
    const outputDir = getStoragePath('documents');
    const pdfPath = path.join(outputDir, `${document.id}.pdf`);

    // 7. Compile and generate PDF using Puppeteer
    await generatePdf(templateContent, answers, pdfPath);

    // Read generated PDF bytes
    const pdfBytes = fs.readFileSync(pdfPath);

    // 8. Update document entry with the download url and PDF bytes
    const downloadUrl = `/api/documents/${document.id}/download`;
    await prisma.document.update({
      where: { id: document.id },
      data: {
        pdf_url: downloadUrl,
        pdf_bytes: pdfBytes,
      },
    });

    // Send PDF document download link email confirmation to the user asynchronously
    if (targetEmail) {
      try {
        const { sendDocumentConfirmationEmail } = require('@/lib/email');
        sendDocumentConfirmationEmail(targetEmail, document.id, downloadUrl).catch((err: any) => {
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
          email: targetEmail,
          action: 'GENERATE_DOCUMENT',
          details: `Generated PDF with Credit for Document ID: ${document.id}`
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
    console.error('Error in POST /api/documents/generate-with-credit:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
