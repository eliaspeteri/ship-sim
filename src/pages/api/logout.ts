import { getToken } from 'next-auth/jwt';

import { recordAuthEvent } from '../../lib/authAudit';

import type { NextApiRequest, NextApiResponse } from 'next';

// Simple logout endpoint to clear auth-related cookies (NextAuth + legacy tokens)
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: false,
    });
    if (token) {
      await recordAuthEvent({
        userId: (token.sub as string) || undefined,
        event: 'logout',
        detail: { reason: 'manual' },
      });
    }
  } catch (error) {
    console.warn('Failed to record logout event', error);
  }

  const expires = new Date(0).toUTCString();
  res.setHeader('Set-Cookie', [
    `next-auth.session-token=deleted; Path=/; Expires=${expires}; HttpOnly; SameSite=Lax`,
    `__Secure-next-auth.session-token=deleted; Path=/; Expires=${expires}; HttpOnly; SameSite=Lax; Secure`,
    `access_token=deleted; Path=/; Expires=${expires}; HttpOnly; SameSite=Lax`,
    `refresh_token=deleted; Path=/; Expires=${expires}; HttpOnly; SameSite=Lax`,
  ]);

  return res.status(200).json({ success: true });
}
