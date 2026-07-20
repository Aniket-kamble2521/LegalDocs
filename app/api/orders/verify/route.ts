// app/api/orders/verify/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyRazorpaySignature } from '@/lib/payments';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment verification details.' },
        { status: 400 }
      );
    }

    // 1. Verify that the payment signature matches the credentials
    const isSignatureValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      (razorpaySignature || '').trim()
    );

    // Cross-verify payment status directly with Razorpay server-side API (never trust frontend success alone)
    let paymentVerifiedServerSide = false;
    try {
      const { razorpay } = require('@/lib/payments');
      if (razorpay) {
        const payment = await razorpay.payments.fetch(razorpayPaymentId);
        if (
          payment &&
          (payment.status === 'captured' || payment.status === 'authorized') &&
          payment.order_id === razorpayOrderId
        ) {
          const order = await prisma.order.findUnique({ where: { id: orderId } });
          if (order && Number(payment.amount) === order.amount) {
            paymentVerifiedServerSide = true;
          } else {
            console.error(`Razorpay server-side amount mismatch: Expected ${order?.amount}, Got ${payment.amount}`);
          }
        } else {
          console.error(`Razorpay payment fetch state mismatch: Status: ${payment?.status}, OrderID: ${payment?.order_id}`);
        }
      } else {
        console.error('Razorpay instance is not initialized. Cannot perform server-side check.');
      }
    } catch (err) {
      console.error('Failed to cross-verify payment directly with Razorpay API:', err);
    }

    if (!isSignatureValid || !paymentVerifiedServerSide) {
      // Update order status to FAILED
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'FAILED' },
      });

      // Write failure payment audit and webhook log
      try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        await prisma.paymentAudit.create({
          data: {
            order_id: orderId,
            email: order?.email || 'guest@legaldocs.co',
            amount: order?.amount || 0,
            status: 'FAILED',
            action: 'PAYMENT_FAILED_SIGNATURE_MISMATCH'
          }
        });

        await prisma.webhookLog.create({
          data: {
            event_type: 'payment.failed',
            payload: body
          }
        });
      } catch (e) {
        console.error('Failed to log payment failure:', e);
      }

      return NextResponse.json({
        success: false,
        error: 'Invalid payment signature. Payment verification failed.',
      }, { status: 400 });
    }

    // 2. Mark the order as paid in the database
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      },
    });

    // Write webhook and payment audit logs
    try {
      await prisma.paymentAudit.create({
        data: {
          order_id: orderId,
          email: updatedOrder.email || 'guest@legaldocs.co',
          amount: updatedOrder.amount,
          status: 'PAID',
          action: 'PAYMENT_VERIFIED'
        }
      });

      await prisma.webhookLog.create({
        data: {
          event_type: 'payment.captured',
          payload: body
        }
      });
    } catch (e) {
      console.error('Failed to write payment logs:', e);
    }

    // 3. Allocate credits if bundle purchase
    if (updatedOrder.status === 'PAID' && updatedOrder.type === 'BUNDLE' && updatedOrder.email) {
      await prisma.creditBalance.upsert({
        where: { email: updatedOrder.email },
        update: {
          credits: { increment: 3 },
        },
        create: {
          email: updatedOrder.email,
          credits: 3,
        },
      });
      console.log(`[CREDITS ACCRUED] Added 3 credits to ${updatedOrder.email}`);
    }

    return NextResponse.json({
      success: true,
      orderStatus: updatedOrder.status,
    });
  } catch (error: any) {
    console.error('Error in POST /api/orders/verify:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
