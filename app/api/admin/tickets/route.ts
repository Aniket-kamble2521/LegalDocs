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
    let tickets = await prisma.supportTicket.findMany({
      orderBy: { created_at: 'desc' }
    });

    if (tickets.length === 0) {
      // Seed a default support ticket dynamically
      const defaultTicket = await prisma.supportTicket.create({
        data: {
          email: 'founder@example.com',
          subject: 'Aadhaar eSign OTP not delivered to Signer B',
          message: 'Signer B is getting a network timeout from the mock Digio portal. Please check the webhook status.',
          status: 'OPEN',
          priority: 'HIGH',
          replies: [
            { sender: 'founder@example.com', message: 'I tried resending the request twice but they still did not receive the mail.', timestamp: new Date().toISOString() }
          ]
        }
      });
      tickets = [defaultTicket];
    }

    return NextResponse.json({
      success: true,
      tickets
    });
  } catch (error: any) {
    console.error('Error fetching support tickets:', error);
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
    const { action, ticketId, message, status, priority } = data;

    if (!ticketId) {
      return NextResponse.json({ success: false, error: 'Ticket ID is required' }, { status: 400 });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (action === 'reply') {
      if (!message) {
        return NextResponse.json({ success: false, error: 'Reply message cannot be empty' }, { status: 400 });
      }

      const existingReplies = (ticket.replies as any[]) || [];
      const newReplies = [
        ...existingReplies,
        {
          sender: `Admin (${admin})`,
          message,
          timestamp: new Date().toISOString()
        }
      ];

      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          replies: newReplies,
          status: 'RESOLVED'
        }
      });

      return NextResponse.json({ success: true, message: 'Reply sent successfully' });
    }

    if (action === 'status') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status }
      });
      return NextResponse.json({ success: true, message: 'Ticket status updated' });
    }

    if (action === 'priority') {
      await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { priority }
      });
      return NextResponse.json({ success: true, message: 'Ticket priority updated' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error modifying support ticket:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
