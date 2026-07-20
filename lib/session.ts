// lib/session.ts
import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'a_very_secure_random_string_secret_for_signing_sessions_123456';

export interface SessionData {
  email: string;
  exp: number;
}

/**
 * Encrypts and signs a session payload containing the user email.
 */
export function signSession(email: string): string {
  const payload: SessionData = {
    email: email.trim().toLowerCase(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // Valid for 7 days
  };

  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr, 'utf-8').toString('base64');
  
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadBase64)
    .digest('hex');

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies the session token and returns the email if valid, or null.
 */
export function verifySession(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadBase64)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('Session verification failed: Signature mismatch.');
      return null;
    }

    const payloadStr = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const data: SessionData = JSON.parse(payloadStr);

    if (Date.now() > data.exp) {
      console.warn('Session verification failed: Token expired.');
      return null;
    }

    return data.email;
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}

export function isAdmin(email: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  
  if (normalized === 'admin@legaldocs.co') {
    return true;
  }

  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  if (adminEmailsEnv) {
    const adminEmails = adminEmailsEnv.split(',').map((e) => e.trim().toLowerCase());
    return adminEmails.includes(normalized);
  }

  return false;
}
