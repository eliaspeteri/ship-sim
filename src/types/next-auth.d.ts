import { DefaultSession, DefaultUser } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    socketToken?: string;
    user?: DefaultSession['user'] & {
      id?: string;
      roles?: string[];
    };
  }

  interface User extends DefaultUser {
    roles?: string[];
    id?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    roles?: string[];
    sub?: string;
    name?: string;
  }
}
