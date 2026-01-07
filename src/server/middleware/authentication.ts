import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';
import { expandRoles, permissionsForRoles, Role, Permission } from '../roles';

export interface AuthenticatedUser {
  userId: string;
  username: string;
  roles: Role[];
  permissions: Permission[];
}

// Extend the Express Request interface to include the user property
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const getTokenFromRequest = (req: Request): string | undefined => {
  return (
    req.cookies?.['next-auth.session-token'] ||
    req.cookies?.['__Secure-next-auth.session-token']
  );
};

const toAuthenticatedUser = (token: {
  sub?: string;
  name?: string;
  email?: string;
  role?: Role;
}): AuthenticatedUser => {
  const baseRole: Role = token.role || 'player';
  const roles = expandRoles([baseRole]);
  const permissions = permissionsForRoles(roles);
  return {
    userId: token.sub || token.email || 'unknown',
    username: token.name || token.email || 'Unknown',
    roles,
    permissions,
  };
};

const decodeNextAuthToken = async (
  req: Request,
): Promise<AuthenticatedUser | null> => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  // First try the official NextAuth decoder (handles encrypted/JWE cookies)
  try {
    const token = await getToken({
      req: req as unknown as Parameters<typeof getToken>[0]['req'],
      secret,
      secureCookie: false,
    });
    if (token) {
      return toAuthenticatedUser(
        token as { sub?: string; name?: string; email?: string; role?: Role },
      );
    }
  } catch (err) {
    console.warn('Failed to decode NextAuth token via getToken:', err);
  }

  // Fallback to legacy JWT verification
  const raw = getTokenFromRequest(req);
  if (!raw) return null;
  try {
    const decoded = jwt.verify(raw, secret) as {
      sub?: string;
      name?: string;
      email?: string;
      role?: Role;
    };
    return toAuthenticatedUser(decoded);
  } catch (error) {
    console.warn('Failed to verify NextAuth session token:', error);
    return null;
  }
};

/**
 * Middleware to authenticate requests using the NextAuth session token cookie.
 * Attaches a normalized user object to req.user when valid.
 */
export const authenticateRequest = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await decodeNextAuthToken(req);
    if (user) {
      req.user = user;
    }
  } catch (err) {
    console.warn('Failed to authenticate request:', err);
  }
  next();
};

/**
 * Middleware to ensure a request is authenticated.
 * Must be used *after* `authenticateRequest`.
 * If the user is not authenticated (req.user is not set), it sends a 401 Unauthorized response.
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
  } else {
    next();
  }
};
