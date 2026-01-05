import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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

const decodeNextAuthToken = (token: string): AuthenticatedUser | null => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret) as {
      sub?: string;
      name?: string;
      email?: string;
      role?: Role;
    };
    const baseRole: Role = decoded.role || 'player';
    const roles = expandRoles([baseRole]);
    const permissions = permissionsForRoles(roles);
    return {
      userId: decoded.sub || decoded.email || 'unknown',
      username: decoded.name || decoded.email || 'Unknown',
      roles,
      permissions,
    };
  } catch (error) {
    console.warn('Failed to verify NextAuth session token:', error);
    return null;
  }
};

/**
 * Middleware to authenticate requests using the NextAuth session token cookie.
 * Attaches a normalized user object to req.user when valid.
 */
export const authenticateRequest = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next();
  }

  const user = decodeNextAuthToken(token);
  if (user) {
    req.user = user;
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
