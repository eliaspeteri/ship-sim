/**
 * Authorization Middleware
 * Provides role-based access control for API routes and socket connections
 */
import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';
import { AuthenticatedUser } from './authentication';

/**
 * Interface for requests with attached user auth data
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Check if the user has the required permission to access a resource
 * @param userPermissions - List of user's permissions
 * @param requiredResource - The resource to check access for
 * @param requiredAction - The action to check permission for
 * @returns Boolean indicating if access is allowed
 */
export function hasPermission(
  userPermissions: { resource: string; action: string }[],
  requiredResource: string,
  requiredAction: string,
): boolean {
  // Check for specific permission
  const hasSpecific = userPermissions.some(
    p => p.resource === requiredResource && p.action === requiredAction,
  );

  // Check for wildcard manage permission (manage includes all actions)
  const hasManagePermission = userPermissions.some(
    p => p.resource === requiredResource && p.action === 'manage',
  );

  // Check for admin wildcard permission
  const hasSysAdminPermission = userPermissions.some(
    p => p.resource === '*' && p.action === '*',
  );

  return hasSpecific || hasManagePermission || hasSysAdminPermission;
}

/**
 * Express middleware to check if user has permission to access a route
 * @param resource - Resource name to check against
 * @param action - Action name to check against
 * @returns Express middleware function
 */
export function requirePermission(resource: string, action: string) {
  return function (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void {
    // Check if user exists in request
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // Check if user has required permission
    if (hasPermission(req.user.permissions, resource, action)) {
      next();
      return;
    }

    // Permission denied
    res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to perform this action',
    });
  };
}

/**
 * Express middleware to check if user has one of specified roles
 * @param roles - Array of role names to check against
 * @returns Express middleware function
 */
export function requireRole(roles: string[]) {
  return function (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void {
    // Check if user exists in request
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // Check if user has at least one of the required roles
    const hasRole = req.user.roles.some(role => roles.includes(role));
    if (hasRole) {
      next();
      return;
    }

    // Role requirement not met
    res.status(403).json({
      error: 'Forbidden',
      message: 'Your role does not have access to this resource',
    });
  };
}

/**
 * Socket.io middleware to check if socket has permission for an action
 * @param socket - Socket instance
 * @param resource - Resource name to check against
 * @param action - Action name to check against
 * @returns Boolean indicating if socket has permission
 */
export function socketHasPermission(
  socket: Socket,
  resource: string,
  action: string,
): boolean {
  const userData = socket.data as AuthenticatedUser;

  // No user data means no permission
  if (!userData || !userData.permissions) {
    return false;
  }

  return hasPermission(userData.permissions, resource, action);
}

/**
 * Create a Socket.io middleware function that verifies user has specific permissions
 * @param resource - Resource name that requires permission
 * @param action - Action name that requires permission
 * @returns Socket middleware function
 */
export function createSocketPermissionMiddleware(
  resource: string,
  action: string,
) {
  return (socket: Socket, next: (err?: Error) => void) => {
    const userData = socket.data as AuthenticatedUser;

    // If no user data or not authenticated, reject
    if (!userData) {
      return next(new Error('Authentication required'));
    }

    // Check if user has required permission
    if (hasPermission(userData.permissions, resource, action)) {
      return next();
    }

    // Permission denied
    return next(new Error('Insufficient permissions'));
  };
}
