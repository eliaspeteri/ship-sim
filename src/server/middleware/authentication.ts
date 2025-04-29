/**
 * Authentication middleware for Express routes
 */
import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../authService';

// Extend the Express Request interface to include the user property
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using a JWT access token from an HttpOnly cookie.
 * If the token is valid, it attaches the decoded payload to `req.user`.
 * If the token is invalid or missing, it proceeds without attaching `req.user`,
 * allowing subsequent middleware or route handlers to decide how to handle unauthenticated requests.
 */
export const authenticateRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // Read the access token from the 'access_token' cookie
  const token = req.cookies?.access_token;

  if (!token) {
    // No token found, proceed without authenticating
    // console.debug('No access token cookie found.');
    return next();
  }

  try {
    // Verify the access token
    const decodedPayload = await verifyAccessToken(token);

    if (decodedPayload) {
      // Token is valid, attach user payload to the request object
      req.user = decodedPayload;
      // console.debug(`Authenticated user: ${req.user.username}`);
    } else {
      // Token is invalid (expired, bad signature, etc.)
      // console.debug('Invalid access token cookie found.');
      // Clear the invalid cookie? Optional, might interfere with refresh logic if cleared too early.
      // res.clearCookie('access_token', { path: '/' });
    }
  } catch (error) {
    // Unexpected error during token verification
    console.error('Error during access token verification middleware:', error);
  }

  // Proceed to the next middleware/handler regardless of authentication success
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
