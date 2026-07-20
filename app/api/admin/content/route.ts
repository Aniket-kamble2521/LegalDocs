import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminUser } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const DEFAULT_LANDING_CONFIG = {
  heroHeadline: "Professional Legal Documents. Generated in Minutes.",
  heroSubtitle: "Create customized, lawyer-reviewed legal contracts tailored for Indian jurisdiction. Our AI-assisted validator prevents naming errors, checks term chronology, and outputs clean print-ready PDFs instantly.",
  pricingSingle: "199",
  pricingBundle: "499",
  trustCounterClients: "12,000+",
  trustCounterVetted: "100% Lawyer Vetted",
  legalNotice: "Disclaimer: LegalDocs is a document automation platform. Vetted draft templates do not substitute custom professional legal counsel from an advocate."
};

export async function GET(request: Request) {
  try {
    let config = await prisma.contentConfig.findUnique({
      where: { key: 'landing_page' }
    });

    if (!config) {
      config = await prisma.contentConfig.create({
        data: {
          key: 'landing_page',
          value: DEFAULT_LANDING_CONFIG
        }
      });
    }

    return NextResponse.json({
      success: true,
      config: config.value
    });
  } catch (error: any) {
    console.error('Error fetching content config:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { config } = await request.json();

    if (!config) {
      return NextResponse.json({ success: false, error: 'Config payload is required' }, { status: 400 });
    }

    await prisma.contentConfig.upsert({
      where: { key: 'landing_page' },
      create: {
        key: 'landing_page',
        value: config
      },
      update: {
        value: config
      }
    });

    await prisma.adminActivityLog.create({
      data: {
        email: admin,
        action: 'UPDATE_LANDING_CONTENT',
        details: 'Saved updated landing page parameters'
      }
    });

    return NextResponse.json({ success: true, message: 'Landing content updated successfully' });
  } catch (error: any) {
    console.error('Error saving content config:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
