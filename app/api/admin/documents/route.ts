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
    const documents = await prisma.document.findMany({
      orderBy: { created_at: 'desc' }
    });

    // Template statistics
    const statsMap = new Map<string, number>();
    documents.forEach(d => {
      statsMap.set(d.type, (statsMap.get(d.type) || 0) + 1);
    });

    const templateStats = Array.from(statsMap.entries()).map(([type, count]) => ({
      type,
      count
    }));

    return NextResponse.json({
      success: true,
      documents,
      templateStats
    });
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = getAdminUser();
  if (!admin) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, id } = await request.json();

    if (!id) {
      return NextResponse.json({ success: false, error: 'Document ID is required' }, { status: 400 });
    }

    if (action === 'delete') {
      await prisma.document.delete({
        where: { id }
      });

      await prisma.adminActivityLog.create({
        data: {
          email: admin,
          action: 'DELETE_DOCUMENT',
          details: `Deleted document ID: ${id}`
        }
      });

      return NextResponse.json({ success: true, message: 'Document deleted successfully' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error modifying document:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
