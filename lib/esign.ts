// lib/esign.ts

const DIGIO_CLIENT_ID = process.env.DIGIO_CLIENT_ID || '';
const DIGIO_CLIENT_SECRET = process.env.DIGIO_CLIENT_SECRET || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export interface SignerInfo {
  name: string;
  email: string;
}

export interface EsignResponse {
  success: boolean;
  esignRequestId: string;
  signingUrls: Record<string, string>; // Maps email to signing URL
}

export async function initiateEsign(
  pdfBuffer: Buffer,
  documentId: string,
  signers: SignerInfo[]
): Promise<EsignResponse> {
  if (!DIGIO_CLIENT_ID || !DIGIO_CLIENT_SECRET) {
    throw new Error('Digio eSign API client is not configured. DIGIO_CLIENT_ID and DIGIO_CLIENT_SECRET are required.');
  }

  // Real Digio Integration Sandbox Call
  try {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    // Structure metadata configuration for Digio request
    const metadata = {
      comment: `Esign request for document ${documentId}`,
      expire_in_days: 10,
      display_on_page: 'custom',
      signers: signers.map((s) => ({
        identifier: s.email,
        name: s.name,
        reason: 'Execution of legal agreement',
        sign_type: 'aadhaar', // Aadhaar-based OTP signature
      })),
    };

    // Construct multipart form data body manually to avoid external libraries
    const headerStr = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${documentId}.pdf"\r\n` +
      `Content-Type: application/pdf\r\n\r\n`;
    const middleStr = 
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="request"\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}--\r\n`;

    const bodyBuffer = Buffer.concat([
      Buffer.from(headerStr, 'utf-8'),
      pdfBuffer,
      Buffer.from(middleStr, 'utf-8')
    ]);

    const auth = Buffer.from(`${DIGIO_CLIENT_ID}:${DIGIO_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch('https://ext.digio.in:8080/v2/client/document/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': `Basic ${auth}`,
      },
      body: bodyBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Digio API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // Map response URLs from Digio
    const esignRequestId = result.id;
    const signingUrls: Record<string, string> = {};
    
    signers.forEach((s) => {
      // In Digio production or sandbox, users sign on Digio portal
      signingUrls[s.email] = `https://ext.digio.in:8080/v2/viewer/show?token=${esignRequestId}&email=${encodeURIComponent(s.email)}`;
    });

    return {
      success: true,
      esignRequestId,
      signingUrls,
    };
  } catch (error: any) {
    console.error('Failed to communicate with Digio eSign:', error);
    throw error;
  }
}
