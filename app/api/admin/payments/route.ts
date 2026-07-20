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
    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' }
    });

    const audits = await prisma.paymentAudit.findMany({
      orderBy: { created_at: 'desc' }
    });

    const webhooks = await prisma.webhookLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 50
    });

    return NextResponse.json({
      success: true,
      orders,
      audits,
      webhooks
    });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    if (action === 'refund') {
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' }
      });

      // Record financial audit log
      await prisma.paymentAudit.create({
        data: {
          order_id: orderId,
          email: order.email || 'guest@legaldocs.co',
          amount: order.amount,
          status: 'REFUNDED',
          action: 'REFUND_APPROVED'
        }
      });

      // Record admin intervention log
      await prisma.adminActivityLog.create({
        data: {
          email: admin,
          action: 'REFUND_ORDER',
          details: `Processed refund of ₹${(order.amount / 100).toFixed(2)} for Order: ${orderId}`
        }
      });

      return NextResponse.json({ success: true, message: 'Refund processed successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing payment action:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
