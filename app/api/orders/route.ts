// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createRazorpayOrder } from '@/lib/payments';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type, email } = body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }

    const isBundle = type === 'BUNDLE';
    const amount = isBundle ? 49900 : 19900; // ₹499 vs ₹199 in paise

    // 1. Create a pending order in our database
    const order = await prisma.order.create({
      data: {
        amount,
        status: 'PENDING',
        type: isBundle ? 'BUNDLE' : 'SINGLE',
        email: email || null,
      },
    });

    // 2. Generate the order with Razorpay
    const rzpOrder = await createRazorpayOrder(amount, order.id);

    // 3. Update the database order with Razorpay's reference ID
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        razorpay_order_id: rzpOrder.id,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      razorpayOrderId: rzpOrder.id,
      amount: updatedOrder.amount,
    });
  } catch (error: any) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
