import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../lib/prisma';

// Simple in-memory rate limiter/lockout for credential auth
type LoginAttempt = { failures: number; lockedUntil: number };
const loginAttempts = new Map<string, LoginAttempt>();
const MAX_FAILURES = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

const getAttemptKey = (username?: string) =>
  (username || 'unknown').trim().toLowerCase() || 'unknown';

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
  adapter: PrismaAdapter(prisma),
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
          throw new Error('Too many failed attempts. Try again later.');
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
        const ok = bcrypt.compareSync(credentials.password, user.passwordHash);
        if (!ok) {
          recordFailure(key);
          return null;
        }
        clearFailures(key);
        return {
          id: user.id,
          name: user.name || user.email || user.id,
          role: user.role || 'player',
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
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id || token.sub;
        token.name = user.name || token.name;
        (token as ShipSimJWT).role =
          (user as { role?: string }).role || (token as ShipSimJWT).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as ShipSimUser).id =
          (token as ShipSimJWT).sub || session.user?.id || '';
        (session.user as ShipSimUser).role =
          (token as ShipSimJWT).role || 'player';
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

interface ShipSimUser {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface ShipSimJWT {
  role?: string;
  sub?: string;
  [key: string]: unknown;
}

interface ShipSimSession extends Record<string, unknown> {
  socketToken?: string;
}
