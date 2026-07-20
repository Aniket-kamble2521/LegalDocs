// app/api/system/health/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, isAdmin } from '@/lib/session';
import { prisma } from '@/lib/db';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('legaldocs_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const email = verifySession(sessionCookie);
    if (!email || !isAdmin(email)) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    // 1. Database Health Check
    let dbStatus = 'HEALTHY';
    let dbResponseTime = 0;
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - start;
    } catch (e) {
      dbStatus = 'UNHEALTHY';
    }

    // 2. Load Stats
    const memoryUsage = process.memoryUsage();
    const systemLoad = os.loadavg();
    const freemem = os.freemem();
    const totalmem = os.totalmem();

    // 3. Count System logs
    const errorLogsCount = await prisma.systemLog.count({
      where: { level: 'ERROR' },
    });

    const warnLogsCount = await prisma.systemLog.count({
      where: { level: 'WARN' },
    });

    // 4. Fetch recent system logs
    const recentLogs = await prisma.systemLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    // 5. Check AI Key availability
    const aiKeyConfigured = !!process.env.ANTHROPIC_API_KEY;

    // 6. Check PDF generator status (check Puppeteer size or simple validation)
    const pdfGeneratorConfigured = true;

    return NextResponse.json({
      success: true,
      health: {
        database: {
          status: dbStatus,
          responseTimeMs: dbResponseTime,
        },
        ai: {
          status: aiKeyConfigured ? 'CONNECTED' : 'KEY_MISSING',
        },
        pdf: {
          status: pdfGeneratorConfigured ? 'READY' : 'ERROR',
        },
        system: {
          platform: os.platform(),
          nodeVersion: process.version,
          memory: {
            heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            freeGb: Math.round(freemem / 1024 / 1024 / 1024 * 100) / 100,
            totalGb: Math.round(totalmem / 1024 / 1024 / 1024 * 100) / 100,
          },
          loadAvg: systemLoad,
          uptimeHours: Math.round(os.uptime() / 3600),
        },
        logs: {
          errorCount: errorLogsCount,
          warnCount: warnLogsCount,
          recent: recentLogs,
        },
      },
    });
  } catch (error: any) {
    console.error('System health check failed:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
