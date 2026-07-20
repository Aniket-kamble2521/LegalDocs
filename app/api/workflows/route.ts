import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminUser } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// GET: Retrieve all active/inactive document workflows
export async function GET() {
  try {
    const workflows = await prisma.documentWorkflow.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({
      success: true,
      workflows
    });
  } catch (error: any) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST/PUT: Upsert a document workflow configuration (admin only)
export async function POST(request: Request) {
  const admin = getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized administrative access required.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      doc_type,
      name,
      description,
      is_active,
      question_set,
      validation_rules,
      ai_suggestions,
      industry_rules,
      estimated_pages,
      reading_time,
      recommended_docs
    } = body;

    if (!doc_type || !name || !question_set || !validation_rules || !ai_suggestions) {
      return NextResponse.json({ success: false, error: 'Missing required configuration fields.' }, { status: 400 });
    }

    const workflow = await prisma.documentWorkflow.upsert({
      where: { doc_type },
      create: {
        doc_type,
        name,
        description,
        is_active: is_active !== false,
        question_set,
        validation_rules,
        ai_suggestions,
        industry_rules: industry_rules || null,
        estimated_pages: Number(estimated_pages) || 8,
        reading_time: Number(reading_time) || 12,
        recommended_docs: recommended_docs || []
      },
      update: {
        name,
        description,
        is_active: is_active !== false,
        question_set,
        validation_rules,
        ai_suggestions,
        industry_rules: industry_rules || null,
        estimated_pages: Number(estimated_pages) || 8,
        reading_time: Number(reading_time) || 12,
        recommended_docs: recommended_docs || []
      }
    });

    // Record audit activity log
    await prisma.adminActivityLog.create({
      data: {
        email: admin,
        action: 'UPSERT_WORKFLOW_CONFIG',
        details: `Configured dynamic workflow for doc_type: ${doc_type}`
      }
    });

    return NextResponse.json({
      success: true,
      workflow
    });
  } catch (error: any) {
    console.error('Error saving workflow config:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
