// app/api/v1/generate/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { validatePartner } from '@/lib/auth';
import { checkAnswersConsistency } from '@/lib/llm';
import { generatePdf } from '@/lib/pdf';
import { getStoragePath } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get('x-api-key');
    const authResult = await validatePartner(apiKey, '/api/v1/generate');

    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { answers } = body;

    if (!answers) {
      return NextResponse.json(
        { success: false, error: 'Missing answers in request body.' },
        { status: 400 }
      );
    }

    // 1. Perform Anthropic Claude / local rule consistency checks
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

    // 2. Create a free Order record linked to the API compilation
    const order = await prisma.order.create({
      data: {
        amount: 0,
        status: 'PAID',
        type: 'SINGLE',
        email: `api-partner-${authResult.partnerId}@legaldocs.internal`,
      },
    });

    // 3. Find correct template variant based on docType and answers
    const docType = (answers.docType || 'NDA').trim().toUpperCase();
    let variant = 'STANDARD';
    if (docType === 'NDA') {
      const ndaTypeLower = (answers.ndaType || '').trim().toLowerCase();
      variant = ndaTypeLower === 'mutual' ? 'MUTUAL' : 'UNILATERAL';
    } else if (docType === 'SERVICE_AGREEMENT') {
      variant = 'STANDARD';
    }
    
    let template = await prisma.template.findFirst({
      where: {
        type: docType,
        variant,
        is_active: true,
      },
    });

    let templateContent = '';
    if (template) {
      templateContent = template.content;
    } else {
      // Fallback
      let filename = '';
      if (docType === 'NDA') {
        filename = variant === 'MUTUAL' ? 'nda-mutual.html' : 'nda-unilateral.html';
      } else if (docType === 'SERVICE_AGREEMENT') {
        filename = 'service-agreement.html';
      }

      const filepath = path.join(process.cwd(), 'templates', filename);
      if (filename && fs.existsSync(filepath)) {
        templateContent = fs.readFileSync(filepath, 'utf-8');
      } else {
        return NextResponse.json(
          { success: false, error: `Template for type ${docType} variant ${variant} could not be loaded.` },
          { status: 500 }
        );
      }
    }

    // 4. Register Document record with a 48-hour expiration date
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const document = await prisma.document.create({
      data: {
        order_id: order.id,
        type: `${docType}_${variant}`,
        answers: answers,
        expires_at: expiresAt,
        email: `partner-${authResult.partnerId}`,
      },
    });

    // 5. Secure file storage path
    const outputDir = getStoragePath('documents');
    const pdfPath = path.join(outputDir, `${document.id}.pdf`);

    // 6. Compile and generate PDF using Puppeteer
    await generatePdf(templateContent, answers, pdfPath);

    // Read generated PDF bytes
    const pdfBytes = fs.readFileSync(pdfPath);

    // 7. Update document entry with the download url and PDF bytes
    const downloadUrl = `/api/documents/${document.id}/download`;
    await prisma.document.update({
      where: { id: document.id },
      data: {
        pdf_url: downloadUrl,
        pdf_bytes: pdfBytes,
      },
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      downloadUrl,
      expiresAt,
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/generate:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
