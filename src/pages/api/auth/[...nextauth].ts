import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../lib/prisma';
import { recordAuthEvent } from '../../../lib/authAudit';

// Simple in-memory rate limiter/lockout for credential auth
type LoginAttempt = { failures: number; lockedUntil: number };
const loginAttempts = new Map<string, LoginAttempt>();
const MAX_FAILURES = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes
const TOKEN_ROTATION_AUDIT_MS = 6 * 60 * 60 * 1000; // 6 hours

const getAttemptKey = (username?: string) =>
  (username || 'unknown').trim().toLowerCase() || 'unknown';

const getLockoutRetrySeconds = (key: string, now = Date.now()): number => {
  const entry = loginAttempts.get(key);
  if (!entry || entry.lockedUntil <= now) return 0;
  return Math.max(1, Math.ceil((entry.lockedUntil - now) / 1000));
};

const isLockedOut = (key: string) => {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (entry.lockedUntil > Date.now()) return true;
  if (entry.lockedUntil && entry.lockedUntil <= Date.now()) {
    loginAttempts.delete(key);
  }
  return false;
};

const recordFailure = (key: string) => {
  const entry = loginAttempts.get(key) || { failures: 0, lockedUntil: 0 };
  const failures = entry.failures + 1;
  const lockedUntil =
    failures >= MAX_FAILURES ? Date.now() + LOCKOUT_MS : entry.lockedUntil;
  loginAttempts.set(key, { failures, lockedUntil });
};

const clearFailures = (key: string) => {
  if (loginAttempts.has(key)) loginAttempts.delete(key);
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma as unknown as PrismaClient),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, _req) {
        const key = getAttemptKey(credentials?.username);
        if (isLockedOut(key)) {
          const retryAfterSeconds = getLockoutRetrySeconds(key);
          throw new Error(`LOCKED_OUT:${retryAfterSeconds}`);
        }
        if (!credentials?.username || !credentials?.password) {
          recordFailure(key);
          return null;
        }
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { name: credentials.username },
              { email: credentials.username },
            ],
          },
        });
        if (!user || !user.passwordHash) {
          recordFailure(key);
          return null;
        }
        const ok = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );
        if (!ok) {
          recordFailure(key);
          return null;
        }
        clearFailures(key);
        return {
          id: user.id,
          name: user.name || user.email || user.id,
          role: user.role || 'player',
          rank: (user as { rank?: number }).rank ?? 1,
          credits: (user as { credits?: number }).credits ?? 0,
          experience: (user as { experience?: number }).experience ?? 0,
          safetyScore: (user as { safetyScore?: number }).safetyScore ?? 1,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id || token.sub;
        token.name = user.name || token.name;
        (token as ShipSimJWT).role =
          (user as { role?: string }).role || (token as ShipSimJWT).role;
        (token as ShipSimJWT).rank =
          (user as { rank?: number }).rank ?? (token as ShipSimJWT).rank ?? 1;
        (token as ShipSimJWT).credits =
          (user as { credits?: number }).credits ??
          (token as ShipSimJWT).credits ??
          0;
        (token as ShipSimJWT).experience =
          (user as { experience?: number }).experience ??
          (token as ShipSimJWT).experience ??
          0;
        (token as ShipSimJWT).safetyScore =
          (user as { safetyScore?: number }).safetyScore ??
          (token as ShipSimJWT).safetyScore ??
          1;
        (token as ShipSimJWT).lastRotationAt = Date.now();
        await recordAuthEvent({
          userId: user.id,
          event: 'login',
          detail: {
            provider: account?.provider || 'credentials',
          },
        });
      } else {
        const now = Date.now();
        const lastRotation =
          (token as ShipSimJWT).lastRotationAt ||
          (token as ShipSimJWT).iat * 1000 ||
          0;
        if (now - lastRotation > TOKEN_ROTATION_AUDIT_MS) {
          (token as ShipSimJWT).lastRotationAt = now;
          await recordAuthEvent({
            userId: (token.sub as string) || undefined,
            event: 'token_rotate',
            detail: {
              ageMs: now - lastRotation,
              provider: account?.provider || 'session',
            },
          });
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as ShipSimUser).id =
          (token as ShipSimJWT).sub || session.user?.id || '';
        (session.user as ShipSimUser).role =
          (token as ShipSimJWT).role || 'player';
        (session.user as ShipSimUser).rank = (token as ShipSimJWT).rank ?? 1;
        (session.user as ShipSimUser).credits =
          (token as ShipSimJWT).credits ?? 0;
        (session.user as ShipSimUser).experience =
          (token as ShipSimJWT).experience ?? 0;
        (session.user as ShipSimUser).safetyScore =
          (token as ShipSimJWT).safetyScore ?? 1;
      }
      // Expose a signed token for sockets (non-HTTP-only)
      if (process.env.NEXTAUTH_SECRET) {
        (session as unknown as ShipSimSession).socketToken = jwt.sign(
          token,
          process.env.NEXTAUTH_SECRET,
        );
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);

export const __test__ = {
  getAttemptKey,
  getLockoutRetrySeconds,
};

interface ShipSimUser {
  id: string;
  role: string;
  rank?: number;
  credits?: number;
  experience?: number;
  safetyScore?: number;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ShipSimJWT {
  role?: string;
  sub?: string;
  rank?: number;
  credits?: number;
  experience?: number;
  safetyScore?: number;
  lastRotationAt?: number;
  [key: string]: unknown;
  iat: number;
}

interface ShipSimSession extends Record<string, unknown> {
  socketToken?: string;
}
