// app/api/system/ping/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Simple, lightweight database query check
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ success: true, message: 'pong' });
  } catch (error: any) {
    console.error('Public database health check failed:', error);
    return NextResponse.json({ success: false, error: 'Database unreachable.' }, { status: 500 });
  }
}
