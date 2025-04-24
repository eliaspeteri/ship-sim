/**
 * Authentication Middleware
 * Extracts and verifies user authentication from incoming requests
 */
import { Response, NextFunction } from 'express';
import { verifyAuthToken } from '../authService';
import { AuthenticatedRequest } from './authorization';

/**
 * Express middleware to extract and verify authentication token.
 * Attaches the authenticated user to the request object if valid.
 */
export async function authenticateRequest(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Check for auth token in header or query param
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : (req.query.token as string);

    if (!token) {
      // No token provided - continue as unauthenticated
      return next();
    }

    // Verify the token
    const user = await verifyAuthToken(token);

    if (user) {
      // Attach verified user to request
      req.user = user;
    }

    // Continue with request processing
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    // Continue as unauthenticated on error
    next();
  }
}

/**
 * Express middleware to require authentication.
 * Must be applied after the authenticateRequest middleware.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required for this resource',
    });
    return;
  }

  next();
}
