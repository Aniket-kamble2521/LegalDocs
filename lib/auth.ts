// lib/auth.ts
import { prisma } from './db';

export interface ValidateResult {
  authorized: boolean;
  partnerId?: string;
  error?: string;
  status?: number;
}

/**
 * Validates the API key from request headers and enforces sliding-window rate limits.
 */
export async function validatePartner(
  apiKey: string | null,
  path: string
): Promise<ValidateResult> {
  if (!apiKey) {
    return {
      authorized: false,
      error: 'API key is missing. Please provide it in x-api-key header.',
      status: 401,
    };
  }

  // 1. Fetch partner details
  const partner = await prisma.partner.findUnique({
    where: { api_key: apiKey },
  });

  if (!partner || !partner.is_active) {
    return {
      authorized: false,
      error: 'Invalid or inactive API key.',
      status: 403,
    };
  }

  // 2. Enforce sliding window rate limit (60 seconds)
  const oneMinuteAgo = new Date();
  oneMinuteAgo.setSeconds(oneMinuteAgo.getSeconds() - 60);

  // Clean up older logs in the background to prevent table bloating
  prisma.partnerRequest
    .deleteMany({
      where: {
        partner_id: partner.id,
        created_at: { lt: oneMinuteAgo },
      },
    })
    .catch((err) => console.error('Error pruning old request logs:', err));

  // Count requests in last minute
  const recentRequestCount = await prisma.partnerRequest.count({
    where: {
      partner_id: partner.id,
      created_at: { gte: oneMinuteAgo },
    },
  });

  if (recentRequestCount >= partner.rate_limit) {
    return {
      authorized: false,
      error: `Rate limit exceeded. Allowed: ${partner.rate_limit} requests per minute.`,
      status: 429,
    };
  }

  // 3. Log current request
  await prisma.partnerRequest.create({
    data: {
      partner_id: partner.id,
      path,
    },
  });

  return {
    authorized: true,
    partnerId: partner.id,
  };
}
