import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    socketToken?: string;
    user?: DefaultSession['user'] & {
      id?: string;
      role?: string;
      rank?: number;
      credits?: number;
      experience?: number;
      safetyScore?: number;
    };
  }

  interface User extends DefaultUser {
    role?: string;
    id?: string;
    rank?: number;
    credits?: number;
    experience?: number;
    safetyScore?: number;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    sub?: string;
    name?: string;
    rank?: number;
    credits?: number;
    experience?: number;
    safetyScore?: number;
    lastRotationAt?: number;
  }
}
