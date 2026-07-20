import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminUser } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admin = getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const templates = await prisma.template.findMany();
    const metadata = await prisma.templateMetadata.findMany();

    // Compile templates with their metadata
    const compiledTemplates = await Promise.all(templates.map(async (t) => {
      let meta = metadata.find(m => m.template_id === t.id);
      if (!meta) {
        // Seed default metadata dynamically
        meta = await prisma.templateMetadata.create({
          data: {
            template_id: t.id,
            description: `${t.name} (variant: ${t.variant}) tailored for Indian legal compliance.`,
            price: 19900,
            lawyer_reviewed: true,
            ai_assisted: true,
            faqs: [
              { question: "Is this document valid in India?", answer: "Yes, under the Indian Contract Act, 1872." },
              { question: "Do I need a stamp paper?", answer: "Yes, standard agreements require stamp duty according to the relevant state laws." }
            ]
          }
        });
      }

      return {
        id: t.id,
        name: t.name,
        type: t.type,
        variant: t.variant,
        version: t.version,
        is_active: t.is_active,
        description: meta.description,
        price: meta.price / 100,
        lawyer_reviewed: meta.lawyer_reviewed,
        ai_assisted: meta.ai_assisted,
        faqs: meta.faqs || [],
        scheduled_update: meta.scheduled_update
      };
    }));

    return NextResponse.json({
      success: true,
      templates: compiledTemplates
    });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { 
      id, 
      is_active, 
      description, 
      price, 
      lawyer_reviewed, 
      ai_assisted, 
      faqs, 
      scheduled_update 
    } = data;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Template ID is required' }, { status: 400 });
    }

    // Update main Template record
    if (is_active !== undefined) {
      await prisma.template.update({
        where: { id },
        data: { is_active: !!is_active }
      });
    }

    // Update or insert TemplateMetadata
    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = Math.round(parseFloat(price) * 100);
    if (lawyer_reviewed !== undefined) updateData.lawyer_reviewed = !!lawyer_reviewed;
    if (ai_assisted !== undefined) updateData.ai_assisted = !!ai_assisted;
    if (faqs !== undefined) updateData.faqs = faqs;
    if (scheduled_update !== undefined) updateData.scheduled_update = scheduled_update ? new Date(scheduled_update) : null;

    await prisma.templateMetadata.upsert({
      where: { template_id: id },
      create: {
        template_id: id,
        description: description || 'Tailored compliance contract.',
        price: price ? Math.round(parseFloat(price) * 100) : 19900,
        lawyer_reviewed: lawyer_reviewed !== undefined ? !!lawyer_reviewed : true,
        ai_assisted: ai_assisted !== undefined ? !!ai_assisted : true,
        faqs: faqs || []
      },
      update: updateData
    });

    await prisma.adminActivityLog.create({
      data: {
        email: admin,
        action: 'UPDATE_TEMPLATE',
        details: `Updated template metadata for: ${id}`
      }
    });

    return NextResponse.json({ success: true, message: 'Template metadata updated successfully' });
  } catch (error: any) {
    console.error('Error updating template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
