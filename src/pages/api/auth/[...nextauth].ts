import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { User } from 'next-auth';

/**
 * NextAuth.js configuration for Ship Simulator
 * Uses Credentials provider to delegate authentication to the backend server.
 * Sessions are managed with JWT strategy for statelessness.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        // Authenticate against backend
        const res = await fetch('http://localhost:3001/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: credentials.username,
            password: credentials.password,
          }),
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok && data.success) {
          // Map backend user data to NextAuth user object
          return {
            id: data.username,
            name: data.username,
            roles: data.roles,
          } as User & { roles: string[] };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.roles = (user as ShipSimUser).roles;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as ShipSimUser).roles = (token as ShipSimJWT).roles || [];
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);

interface ShipSimUser extends User {
  roles: string[];
}

interface ShipSimJWT {
  roles?: string[];
  [key: string]: unknown;
}
