import bcrypt from 'bcryptjs';

import { recordAuthEvent } from '../../lib/authAudit';
import { prisma } from '../../lib/prisma';
import { createRateLimiter } from '../../server/rateLimit';
import { REGISTER_LIMITS } from '../../server/requestLimits';

import type { NextApiRequest, NextApiResponse } from 'next';

const registerLimiter = createRateLimiter(REGISTER_LIMITS.rateLimit);

const getClientIp = (req: NextApiRequest) => {
  const forwarded = req.headers?.['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const fromHeader = typeof raw === 'string' ? raw.split(',')[0]?.trim() : '';
  return fromHeader || req.socket?.remoteAddress || 'unknown';
};

const normalizeUsername = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const setRetryAfterHeader = (res: NextApiResponse, retryAfterMs: number) => {
  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  res.setHeader('Retry-After', String(seconds));
};

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

  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };
  const normalizedUsername = normalizeUsername(username);
  const rateLimitKey = `${getClientIp(req)}:${normalizedUsername || 'unknown'}`;
  const rateLimit = registerLimiter.check(rateLimitKey);
  if (!rateLimit.allowed) {
    setRetryAfterHeader(res, rateLimit.retryAfterMs);
    return res.status(429).json({
      success: false,
      error: 'Too many registration attempts. Try again later.',
    });
  }

  if (!normalizedUsername || !password) {
    return res
      .status(400)
      .json({ success: false, error: 'Username and password are required' });
  }

  if (
    normalizedUsername.length > REGISTER_LIMITS.maxUsernameLength ||
    password.length > REGISTER_LIMITS.maxPasswordLength
  ) {
    return res
      .status(400)
      .json({ success: false, error: 'Username or password is too long' });
  }

  try {
    // name is not unique in the schema, so use findFirst for existence check
    const existing = await prisma.user.findFirst({
      where: { name: normalizedUsername },
      select: { id: true },
    });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: normalizedUsername,
        role: 'player',
        rank: 1,
        experience: 0,
        credits: 0,
        safetyScore: 1,
        passwordHash,
      },
    });
    await recordAuthEvent({
      userId: user.id,
      event: 'register',
      detail: { method: 'credentials' },
    });

    return res.status(201).json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Error registering user', err);
    return res
      .status(500)
      .json({ success: false, error: 'Internal server error' });
  }
}
