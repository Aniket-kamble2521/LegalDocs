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
    // Fetch unique emails across orders
    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' }
    });

    const uniqueEmails = Array.from(new Set(orders.map(o => o.email).filter(Boolean)));

    // Fetch credit balances
    const balances = await prisma.creditBalance.findMany();

    // Fetch documents
    const documents = await prisma.document.findMany();

    const usersList = await Promise.all(uniqueEmails.map(async (email: any) => {
      const userOrders = orders.filter(o => o.email === email);
      const userDocs = documents.filter(d => d.email === email);
      const userBalance = balances.find(b => b.email === email)?.credits || 0;

      // Check if suspended from admin logs
      const suspensionLogs = await prisma.adminActivityLog.findFirst({
        where: {
          action: 'SUSPEND_USER',
          details: { contains: email }
        },
        orderBy: { created_at: 'desc' }
      });
      const activationLogs = await prisma.adminActivityLog.findFirst({
        where: {
          action: 'ACTIVATE_USER',
          details: { contains: email }
        },
        orderBy: { created_at: 'desc' }
      });

      let isSuspended = false;
      if (suspensionLogs) {
        if (!activationLogs || suspensionLogs.created_at > activationLogs.created_at) {
          isSuspended = true;
        }
      }

      return {
        email,
        credits: userBalance,
        documentsCount: userDocs.length,
        paymentCount: userOrders.length,
        totalSpent: userOrders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + o.amount, 0) / 100,
        status: isSuspended ? 'SUSPENDED' : 'ACTIVE',
        lastActive: userOrders[0]?.created_at || new Date()
      };
    }));

    // Fetch activity logs
    const activityLogs = await prisma.adminActivityLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      users: usersList,
      logs: activityLogs
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, email, credits } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'User email is required' }, { status: 400 });
    }

    if (action === 'suspend') {
      await prisma.adminActivityLog.create({
        data: {
          email: admin,
          action: 'SUSPEND_USER',
          details: `Suspended user: ${email}`
        }
      });
      return NextResponse.json({ success: true, message: 'User suspended successfully' });
    }

    if (action === 'activate') {
      await prisma.adminActivityLog.create({
        data: {
          email: admin,
          action: 'ACTIVATE_USER',
          details: `Activated user: ${email}`
        }
      });
      return NextResponse.json({ success: true, message: 'User activated successfully' });
    }

    if (action === 'adjust-credits') {
      const parsedCredits = parseInt(credits);
      if (isNaN(parsedCredits)) {
        return NextResponse.json({ success: false, error: 'Invalid credits value' }, { status: 400 });
      }

      await prisma.creditBalance.upsert({
        where: { email },
        create: { email, credits: parsedCredits },
        update: { credits: parsedCredits }
      });

      await prisma.adminActivityLog.create({
        data: {
          email: admin,
          action: 'ADJUST_CREDITS',
          details: `Adjusted credits for ${email} to ${parsedCredits}`
        }
      });

      return NextResponse.json({ success: true, message: 'User credits updated successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error modifying user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
