// app/api/webhooks/razorpay/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generatePdf } from '@/lib/pdf';
import crypto from 'crypto';
import { getStoragePath } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    // 1. Verify Webhook Signature strictly
    if (!webhookSecret) {
      console.error('[RAZORPAY WEBHOOK ERROR] Webhook secret is not configured.');
      return NextResponse.json({ success: false, error: 'Webhook secret is not configured.' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('[RAZORPAY WEBHOOK WARNING] Invalid signature mismatch.');
      return NextResponse.json({ success: false, error: 'Invalid webhook signature.' }, { status: 400 });
    }

    // 2. Parse payload
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`[RAZORPAY WEBHOOK RECEIVED] Event: ${event}`);

    // Log the webhook call details in db
    await prisma.webhookLog.create({
      data: {
        event_type: event,
        payload: payload,
      },
    });

    // 3. Handle payment.captured
    if (event === 'payment.captured') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;
      const amount = paymentEntity?.amount; // in paise

      if (!razorpayOrderId) {
        return NextResponse.json({ success: false, error: 'Missing order_id in event entity.' }, { status: 400 });
      }

      // Find corresponding order in our database
      const order = await prisma.order.findUnique({
        where: { razorpay_order_id: razorpayOrderId },
      });

      if (!order) {
        console.warn(`[RAZORPAY WEBHOOK] Order not found for Razorpay Order ID: ${razorpayOrderId}`);
        return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
      }

      // Idempotency / Duplicate Webhook check: If already paid, return 200 OK
      if (order.status === 'PAID') {
        console.log(`[RAZORPAY WEBHOOK IDEMPOTENT] Order ${order.id} is already marked as PAID.`);
        return NextResponse.json({ success: true, message: 'Order already processed.' });
      }

      // Update Order Status to PAID
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          razorpay_payment_id: razorpayPaymentId,
          razorpay_signature: signature,
        },
      });

      // Write Payment Audit
      await prisma.paymentAudit.create({
        data: {
          order_id: order.id,
          email: order.email || 'customer@legaldocs.co',
          amount: order.amount,
          status: 'PAID',
          action: 'WEBHOOK_PAYMENT_CAPTURED',
        },
      });

      // Generate invoice PDF
      try {
        const invoiceDir = getStoragePath('invoices');
        const invoicePath = path.join(invoiceDir, `${order.id}.pdf`);

        if (!fs.existsSync(invoiceDir)) {
          fs.mkdirSync(invoiceDir, { recursive: true });
        }

        const templatePath = path.join(process.cwd(), 'templates', 'invoice.html');
        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf-8');
          const invoiceData = {
            email: order.email || 'customer@legaldocs.co',
            order_id: order.id,
            created_at: order.created_at.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
            payment_id: razorpayPaymentId || 'N/A',
            is_bundle: order.type === 'BUNDLE',
            amount: (order.amount / 100).toFixed(2),
          };

          await generatePdf(templateContent, invoiceData, invoicePath);
          console.log(`[RAZORPAY WEBHOOK] Invoice generated for order ${order.id}`);
        }
      } catch (invoiceErr) {
        console.error('[RAZORPAY WEBHOOK] Failed to generate invoice PDF:', invoiceErr);
      }

      // Allocate credits if bundle purchase
      if (updatedOrder.type === 'BUNDLE' && updatedOrder.email) {
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
        console.log(`[RAZORPAY WEBHOOK] Credited 3 balance to ${updatedOrder.email}`);
      }
    }

    // 4. Handle payment.failed
    if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id;
      const razorpayPaymentId = paymentEntity?.id;

      if (razorpayOrderId) {
        const order = await prisma.order.findUnique({
          where: { razorpay_order_id: razorpayOrderId },
        });

        if (order && order.status !== 'PAID') {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'FAILED' },
          });

          await prisma.paymentAudit.create({
            data: {
              order_id: order.id,
              email: order.email || 'customer@legaldocs.co',
              amount: order.amount,
              status: 'FAILED',
              action: 'WEBHOOK_PAYMENT_FAILED',
            },
          });
          console.log(`[RAZORPAY WEBHOOK] Order ${order.id} marked as FAILED`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[RAZORPAY WEBHOOK ERROR]:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
