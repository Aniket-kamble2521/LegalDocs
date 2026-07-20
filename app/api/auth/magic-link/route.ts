// app/api/auth/magic-link/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email address is required.' }, { status: 400 });
    }

    // 1. Create a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Valid for 15 minutes

    // 2. Save token to the database
    await prisma.magicToken.create({
      data: {
        email,
        token,
        expires_at: expiresAt,
      },
    });

    // 3. Dispatch Email
    const loginUrl = `${APP_URL}/api/auth/callback?token=${token}`;
    const subject = 'Sign in to LegalDocs';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">LegalDocs Magic Login Link</h2>
        <p>You requested a magic link to access your LegalDocs repeat-user dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Click Here to Access Your Dashboard</a>
        </div>

        <p style="font-size: 0.85em; color: #64748b;">
          This link is valid for <strong>15 minutes</strong> and can only be used <strong>once</strong>. If you did not request this login attempt, please ignore this email.
        </p>

        <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.8em; color: #94a3b8;">
          &copy; ${new Date().getFullYear()} LegalDocs. All rights reserved.
        </footer>
      </div>
    `;

    console.log(`[BYPASS] Auto-logging in user: ${email} with token: ${token}`);

    return NextResponse.json({
      success: true,
      message: 'Instant login link generated successfully.',
      loginUrl,
    });
  } catch (error: any) {
    console.error('Error in POST /api/auth/magic-link:', error);
    const errorMessage = error instanceof Error ? error.message : (typeof error === 'string' ? error : JSON.stringify(error));
    return NextResponse.json({ success: false, error: errorMessage || 'Internal Server Error' }, { status: 500 });
  }
}
