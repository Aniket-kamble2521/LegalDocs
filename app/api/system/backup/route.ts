// app/api/system/backup/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, isAdmin } from '@/lib/session';
import { prisma } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

export const dynamic = 'force-dynamic';

const BACKUP_DIR = path.join(process.cwd(), 'storage', 'backups');

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

    // Ensure directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // List all files in the backup directory
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          sizeBytes: stats.size,
          created_at: stats.birthtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      success: true,
      backups,
    });
  } catch (error: any) {
    console.error('Error listing database backups:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const { action, filename } = body;

    // Ensure directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    if (action === 'restore') {
      if (!filename || typeof filename !== 'string') {
        return NextResponse.json({ success: false, error: 'Filename is required for restoration.' }, { status: 400 });
      }

      // Enforce strict regex validation to prevent directory traversal attacks
      const safeFilenamePattern = /^[a-zA-Z0-9_-]+\.json$/;
      if (!safeFilenamePattern.test(filename)) {
        return NextResponse.json({ success: false, error: 'Invalid backup filename. Only alphanumeric characters, underscores, and dashes followed by .json are allowed.' }, { status: 400 });
      }

      const filePath = path.join(BACKUP_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ success: false, error: 'Backup file not found.' }, { status: 404 });
      }

      const dataStr = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(dataStr);

      // Restore System Settings
      if (Array.isArray(data.settings)) {
        for (const item of data.settings) {
          await prisma.systemSetting.upsert({
            where: { key: item.key },
            update: { value: item.value },
            create: { key: item.key, value: item.value },
          });
        }
      }

      // Restore Templates
      if (Array.isArray(data.templates)) {
        for (const item of data.templates) {
          const existing = await prisma.template.findFirst({
            where: { type: item.type, variant: item.variant, version: item.version }
          });
          if (existing) {
            await prisma.template.update({
              where: { id: existing.id },
              data: { name: item.name, content: item.content, is_active: item.is_active }
            });
          } else {
            await prisma.template.create({
              data: { name: item.name, type: item.type, variant: item.variant, version: item.version, content: item.content, is_active: item.is_active }
            });
          }
        }
      }

      // Log Restore Action
      await prisma.adminActivityLog.create({
        data: {
          email,
          action: 'RESTORE_DATABASE',
          details: `Restored templates and settings from backup file: ${filename}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Restored templates and settings successfully from ${filename}.`,
      });
    }

    // Default Action: Trigger Backup
    // Fetch settings and templates to back up
    const settings = await prisma.systemSetting.findMany();
    const templates = await prisma.template.findMany();

    const backupPayload = {
      timestamp: new Date().toISOString(),
      triggeredBy: email,
      settings,
      templates,
    };

    const newFilename = `backup_${Date.now()}.json`;
    const newFilePath = path.join(BACKUP_DIR, newFilename);

    fs.writeFileSync(newFilePath, JSON.stringify(backupPayload, null, 2), 'utf-8');

    // Log Backup Action
    await prisma.adminActivityLog.create({
      data: {
        email,
        action: 'CREATE_BACKUP',
        details: `Created new database backup file: ${newFilename}`,
      },
    });

    return NextResponse.json({
      success: true,
      filename: newFilename,
      message: `Database backup created successfully: ${newFilename}`,
    });
  } catch (error: any) {
    console.error('Error handling database backup action:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
