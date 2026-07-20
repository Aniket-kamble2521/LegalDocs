// app/api/orders/[id]/invoice/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifySession, isAdmin } from '@/lib/session';
import { cookies } from 'next/headers';
import { generatePdf } from '@/lib/pdf';
import { getStoragePath } from '@/lib/storage';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });
    }

    // 1. Authenticate request via session cookie
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const email = verifySession(sessionCookie);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Invalid or expired session.' }, { status: 401 });
    }

    // 2. Fetch the corresponding order details
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    // 3. Authorization guard: order must belong to logged-in user, unless they are admin
    if (order.email?.trim().toLowerCase() !== email.trim().toLowerCase() && !isAdmin(email)) {
      return NextResponse.json({ success: false, error: 'Unauthorized to access this invoice.' }, { status: 403 });
    }

    if (order.status !== 'PAID') {
      return NextResponse.json({ success: false, error: 'Invoice only available for paid transactions.' }, { status: 400 });
    }

    const invoiceDir = getStoragePath('invoices');
    const invoicePath = path.join(invoiceDir, `${id}.pdf`);

    // Ensure directory exists
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }

    // 4. Compile on-the-fly if not already generated on disk
    if (!fs.existsSync(invoicePath)) {
      const templatePath = path.join(process.cwd(), 'templates', 'invoice.html');
      if (!fs.existsSync(templatePath)) {
        return NextResponse.json({ success: false, error: 'Invoice template not found on system.' }, { status: 500 });
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      const invoiceData = {
        email: order.email || 'customer@legaldocs.co',
        order_id: order.id,
        created_at: order.created_at.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        payment_id: order.razorpay_payment_id || 'N/A',
        is_bundle: order.type === 'BUNDLE',
        amount: (order.amount / 100).toFixed(2),
      };

      await generatePdf(templateContent, invoiceData, invoicePath);
    }

    const fileBuffer = fs.readFileSync(invoicePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Invoice_${id}.pdf`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error(`Error generating/serving invoice for order ${params.id}:`, error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
