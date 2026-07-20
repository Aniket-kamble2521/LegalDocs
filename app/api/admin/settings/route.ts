// app/api/admin/settings/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminUser } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.systemSetting.findMany();
    const map: Record<string, any> = {};
    settings.forEach((s) => {
      map[s.key] = s.value;
    });

    // Provide default configurations if not defined
    const defaults = {
      enable_esign: map.enable_esign !== undefined ? map.enable_esign : true,
      enable_ai: map.enable_ai !== undefined ? map.enable_ai : true,
      enable_sandbox_payments: map.enable_sandbox_payments !== undefined ? map.enable_sandbox_payments : true,
      announcement: map.announcement !== undefined ? map.announcement : 'Scheduled platform optimization will take place on Sunday 2 AM IST.',
      maintenance_mode: map.maintenance_mode !== undefined ? map.maintenance_mode : false,
      email_welcome_subject: map.email_welcome_subject !== undefined ? map.email_welcome_subject : 'Welcome to LegalDocs!',
      email_welcome_body: map.email_welcome_body !== undefined ? map.email_welcome_body : 'Hello, thank you for choosing LegalDocs. Start creating smart agreements directly in your workspace.',
      email_magic_subject: map.email_magic_subject !== undefined ? map.email_magic_subject : 'Your LegalDocs Magic Login Link',
      email_magic_body: map.email_magic_body !== undefined ? map.email_magic_body : 'Click on the link below to access your LegalDocs Operating System. This link is valid for 15 minutes.',
      referral_reward_amount: map.referral_reward_amount !== undefined ? map.referral_reward_amount : 100,
    };

    return NextResponse.json({
      success: true,
      settings: defaults,
    });
  } catch (error: any) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: 'Setting key is required.' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    await prisma.adminActivityLog.create({
      data: {
        email: admin,
        action: 'UPDATE_SYSTEM_SETTING',
        details: `Updated system setting key: ${key}`,
      },
    });

    return NextResponse.json({
      success: true,
      setting,
    });
  } catch (error: any) {
    console.error('Error saving admin setting:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
