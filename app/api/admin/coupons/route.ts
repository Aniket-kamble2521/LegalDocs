// app/api/admin/coupons/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminUser } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const couponSetting = await prisma.systemSetting.findUnique({
      where: { key: 'coupons_list' },
    });

    const coupons = couponSetting && Array.isArray(couponSetting.value) 
      ? couponSetting.value 
      : [];

    return NextResponse.json({
      success: true,
      coupons,
    });
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
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
    const { action, code, discountPercent, expiresAt, maxUses } = body;

    const couponSetting = await prisma.systemSetting.findUnique({
      where: { key: 'coupons_list' },
    });

    let coupons: any[] = couponSetting && Array.isArray(couponSetting.value) 
      ? couponSetting.value 
      : [];

    if (action === 'delete') {
      if (!code) {
        return NextResponse.json({ success: false, error: 'Coupon code is required for deletion.' }, { status: 400 });
      }

      coupons = coupons.filter(c => c.code !== code.toUpperCase());

      await prisma.systemSetting.upsert({
        where: { key: 'coupons_list' },
        update: { value: coupons },
        create: { key: 'coupons_list', value: coupons },
      });

      await prisma.adminActivityLog.create({
        data: {
          email: admin,
          action: 'DELETE_COUPON',
          details: `Deleted coupon code: ${code}`,
        },
      });

      return NextResponse.json({
        success: true,
        coupons,
      });
    }

    // Create coupon
    if (!code || !discountPercent || !expiresAt || !maxUses) {
      return NextResponse.json({ success: false, error: 'All fields (code, discountPercent, expiresAt, maxUses) are required.' }, { status: 400 });
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Check if code exists
    if (coupons.some(c => c.code === uppercaseCode)) {
      return NextResponse.json({ success: false, error: 'A coupon with this code already exists.' }, { status: 400 });
    }

    const newCoupon = {
      code: uppercaseCode,
      discountPercent: Number(discountPercent),
      expiresAt,
      maxUses: Number(maxUses),
      usesCount: 0,
      created_at: new Date().toISOString(),
    };

    coupons.push(newCoupon);

    await prisma.systemSetting.upsert({
      where: { key: 'coupons_list' },
      update: { value: coupons },
      create: { key: 'coupons_list', value: coupons },
    });

    await prisma.adminActivityLog.create({
      data: {
        email: admin,
        action: 'CREATE_COUPON',
        details: `Created new coupon code: ${uppercaseCode} (${discountPercent}% off)`,
      },
    });

    return NextResponse.json({
      success: true,
      coupon: newCoupon,
      coupons,
    });
  } catch (error: any) {
    console.error('Error managing coupons:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
