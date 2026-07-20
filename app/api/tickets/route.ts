// app/api/tickets/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, isAdmin } from '@/lib/session';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Retrieve tickets (User tickets, or Admin lists all)
export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const email = verifySession(sessionCookie);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 });
    }

    let tickets;
    if (isAdmin(email)) {
      tickets = await prisma.supportTicket.findMany({
        orderBy: { updated_at: 'desc' },
      });
    } else {
      tickets = await prisma.supportTicket.findMany({
        where: { email },
        orderBy: { updated_at: 'desc' },
      });
    }

    return NextResponse.json({
      success: true,
      tickets,
    });
  } catch (error: any) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Create a support ticket or submit a reply
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const email = verifySession(sessionCookie);
    if (!email) {
      return NextResponse.json({ success: false, error: 'Invalid session.' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ticketId, subject, message, priority, status } = body;

    // 1. Reply to existing ticket
    if (action === 'reply') {
      if (!ticketId || !message) {
        return NextResponse.json({ success: false, error: 'Ticket ID and message are required for replies.' }, { status: 400 });
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return NextResponse.json({ success: false, error: 'Ticket not found.' }, { status: 404 });
      }

      // Check authorization (must be ticket owner or admin)
      if (ticket.email !== email && !isAdmin(email)) {
        return NextResponse.json({ success: false, error: 'Unauthorized to reply to this ticket.' }, { status: 403 });
      }

      const existingReplies = Array.isArray(ticket.replies) ? ticket.replies : [];
      const newReply = {
        sender: email,
        message,
        timestamp: new Date().toISOString(),
      };

      const updated = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          replies: [...existingReplies, newReply],
          status: isAdmin(email) ? 'RESOLVED' : 'OPEN', // Mark resolved when admin replies, open when user replies
        },
      });

      return NextResponse.json({
        success: true,
        ticket: updated,
      });
    }

    // 2. Update status of ticket (Admin only, or user closing own ticket)
    if (action === 'status') {
      if (!ticketId || !status) {
        return NextResponse.json({ success: false, error: 'Ticket ID and status are required.' }, { status: 400 });
      }

      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return NextResponse.json({ success: false, error: 'Ticket not found.' }, { status: 404 });
      }

      if (ticket.email !== email && !isAdmin(email)) {
        return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
      }

      const updated = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status },
      });

      return NextResponse.json({
        success: true,
        ticket: updated,
      });
    }

    // 3. Create a new support ticket
    if (!subject || !message) {
      return NextResponse.json({ success: false, error: 'Subject and message are required.' }, { status: 400 });
    }

    const newTicket = await prisma.supportTicket.create({
      data: {
        email,
        subject,
        message,
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        replies: [],
      },
    });

    return NextResponse.json({
      success: true,
      ticket: newTicket,
    });
  } catch (error: any) {
    console.error('Error handling support ticket action:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
