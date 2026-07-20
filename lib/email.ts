// lib/email.ts

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'LegalDocs <noreply@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email using the Resend API (via fetch to avoid extra SDK dependencies).
 * Falls back to logging to console if RESEND_API_KEY is not set.
 */
export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.error('[EMAIL ERROR] RESEND_API_KEY environment variable is not configured.');
    return false;
  }

  const maxRetries = 3;
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to,
          subject,
          html,
        }),
      });

      if (response.ok) {
        console.log(`Email successfully sent to ${to} on attempt ${attempt}`);
        return true;
      }

      const errText = await response.text();
      console.warn(`Resend API returned error (attempt ${attempt}/${maxRetries}): ${response.status} - ${errText}`);
    } catch (error) {
      console.error(`Failed to connect to Resend API (attempt ${attempt}/${maxRetries}):`, error);
    }

    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }

  console.error(`Email delivery to ${to} failed after ${maxRetries} attempts.`);
  return false;
}

/**
 * Sends a PDF document download link email confirmation to the user.
 */
export async function sendDocumentConfirmationEmail(
  email: string,
  orderId: string,
  downloadUrl: string
): Promise<boolean> {
  const fullDownloadUrl = downloadUrl.startsWith('http') ? downloadUrl : `${APP_URL}${downloadUrl}`;
  const subject = 'Your LegalDocs NDA Document is Ready!';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 8px;">
      <h2 style="color: #2563eb; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">LegalDocs — Order Confirmation</h2>
      <p>Thank you for choosing LegalDocs! Your custom Non-Disclosure Agreement (NDA) has been successfully compiled and verified.</p>
      
      <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
        <strong>Order ID:</strong> <code style="background-color: #e2e8f0; padding: 2px 4px; border-radius: 4px;">${orderId}</code><br>
        <strong>Validity:</strong> The download link is active for <strong>48 hours</strong> or <strong>5 downloads</strong> (whichever comes first) under our data minimization policy.
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${fullDownloadUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download Your PDF Document</a>
      </div>

      <p style="font-size: 0.9em; color: #64748b; margin-top: 30px;">
        Need to retrieve it later? Keep this email handy. If your link expires before downloading, you can request a link resend using your email address and Order ID.
      </p>

      <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; font-size: 0.85em; color: #b45309;">
        <strong>Legal Disclaimer:</strong> LegalDocs is an automated document assembly system, not a law firm. This document is compiled from templates with pending lawyer reviews. Using this service does not constitute legal advice or create an attorney-client relationship. Please consult a qualified lawyer before executing this agreement.
      </div>

      <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.8em; color: #94a3b8;">
        &copy; ${new Date().getFullYear()} LegalDocs. All rights reserved.
      </footer>
    </div>
  `;

  // We await but don't block the caller if it fails (it has its own retry logic inside)
  return sendEmail({ to: email, subject, html }).catch((err) => {
    console.error('Unhandled email sender exception:', err);
    return false;
  });
}
