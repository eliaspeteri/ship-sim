/**
 * Authentication middleware for Express routes
 */
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../authService';

/**
 * Extended Request interface with user authentication data
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    roles: string[];
    permissions: Array<{ resource: string; action: string }>;
  };
}

/**
 * Middleware to authenticate requests
 */
export async function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Get token from cookies (preferred) or from Authorization header
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);

    // If no token, continue without authentication
    if (!token) {
      return next();
    }

    // Verify token and get user data
    const userData = await verifyAccessToken(token);

    // If token is invalid, continue without authentication
    if (!userData) {
      return next();
    }

    // Add user data to request
    (req as AuthenticatedRequest).user = userData;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next();
  }
}

/**
 * Middleware to require authentication for routes
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Check if user exists in request (set by authenticateRequest)
  if (!(req as AuthenticatedRequest).user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // User is authenticated, proceed
  next();
}
