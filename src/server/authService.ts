/**
 * Authentication Service
 * Provides secure authentication and role-based access control
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Initialize Prisma client
const prisma = new PrismaClient();

// Define auth-related interfaces
export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface UserAuth {
  userId: string;
  username: string;
  roles: string[];
  permissions: {
    resource: string;
    action: string;
  }[];
  token?: string; // Access token
  refreshToken?: string; // Refresh token
}

// JWT Token payload structure
export interface JWTPayload {
  sub: string; // Subject (userId)
  username: string;
  roles: string[];
  permissions?: { resource: string; action: string }[];
  iat?: number; // Issued at
  exp?: number; // Expires at
  type?: 'access' | 'refresh'; // Token type
}

// Get secret keys from environment variables, with fallback for development
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'ship-sim-access-token-secret-2025';
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'ship-sim-refresh-token-secret-2025';

// Token expiration times (in seconds)
const ACCESS_TOKEN_EXPIRY = 3600; // 1 hour
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 3600; // 30 days

/**
 * Authenticate a user based on provided credentials
 */
export async function authenticateUser(
  username: string,
  password: string,
): Promise<UserAuth | null> {
  try {
    // Find user in database with their roles and permissions
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // If user not found, return null
    if (!user) {
      return null;
    }

    // Verify password
    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return null;
    }

    // Extract roles and flattened permissions
    const roles = user.roles.map(r => r.role.name);

    // Collect all permissions from all roles
    const permissions = user.roles.flatMap(r =>
      r.role.permissions.map(p => ({
        resource: p.permission.resource,
        action: p.permission.action,
      })),
    );

    // Generate authentication tokens
    const { accessToken, refreshToken } = generateTokens(
      user.id,
      user.username,
      roles,
      permissions,
    );

    return {
      userId: user.id,
      username: user.username,
      roles,
      permissions,
      token: accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Generate both access and refresh tokens for a user
 */
function generateTokens(
  userId: string,
  username: string,
  roles: string[],
  permissions: { resource: string; action: string }[],
): { accessToken: string; refreshToken: string } {
  // Create access token with short expiry and all user data
  const accessTokenPayload: JWTPayload = {
    sub: userId,
    username,
    roles,
    permissions,
    type: 'access',
  };

  const accessToken = jwt.sign(accessTokenPayload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  // Create refresh token with longer expiry but limited data
  const refreshTokenPayload: JWTPayload = {
    sub: userId,
    username,
    roles,
    type: 'refresh',
  };

  const refreshToken = jwt.sign(refreshTokenPayload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}

/**
 * Verify an authentication token
 */
export function verifyAccessToken(token: string): Promise<UserAuth | null> {
  try {
    // Verify JWT token
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as JWTPayload;

    // Validate token is the correct type
    if (payload.type !== 'access') {
      console.error('Invalid token type');
      return Promise.resolve(null);
    }

    // Get complete user data with roles and permissions
    return getUserWithPermissions(payload.sub);
  } catch (error) {
    console.error('Token verification error:', error);
    return Promise.resolve(null);
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  try {
    // Verify JWT refresh token
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as JWTPayload;

    // Validate token is the correct type
    if (payload.type !== 'refresh') {
      console.error('Invalid token type');
      return Promise.resolve(null);
    }

    return Promise.resolve(payload);
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return Promise.resolve(null);
  }
}

/**
 * Refresh an authentication token
 */
export async function refreshAuthToken(
  refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    // Verify the refresh token
    const payload = await verifyRefreshToken(refreshToken);

    // If token is invalid, return null
    if (!payload) {
      return null;
    }

    // Get complete user data
    const userData = await getUserWithPermissions(payload.sub);

    // If user doesn't exist anymore, return null
    if (!userData) {
      return null;
    }

    // Generate new tokens
    return generateTokens(
      userData.userId,
      userData.username,
      userData.roles,
      userData.permissions,
    );
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}

/**
 * Auth data structure that might be passed during socket connections
 */
interface SocketAuthData {
  token?: string;
  refreshToken?: string;
  userId?: string;
  username?: string;
}

/**
 * Verify a user's socket connection based on auth data
 */
export async function verifySocketAuth(
  authData: SocketAuthData,
): Promise<UserAuth | null> {
  try {
    // Check if token is provided
    if (authData.token) {
      console.info('Verifying socket auth with token');
      return verifyAccessToken(authData.token);
    }

    // Fallback for existing connections
    const userId =
      authData.userId || `user_${Math.random().toString(36).substring(2, 9)}`;

    // For anonymous users, create a limited guest auth
    return {
      userId,
      username: authData.username || 'Anonymous',
      roles: ['guest'],
      permissions: [
        { resource: 'vessel', action: 'view' },
        { resource: 'environment', action: 'view' },
      ],
    };
  } catch (error) {
    console.error('Socket auth verification error:', error);

    // Return anonymous user on error with minimal permissions
    return {
      userId: `user_${Math.random().toString(36).substring(2, 9)}`,
      username: 'Anonymous',
      roles: ['guest'],
      permissions: [
        { resource: 'vessel', action: 'view' },
        { resource: 'environment', action: 'view' },
      ],
    };
  }
}

/**
 * Get a user with their roles and permissions
 */
async function getUserWithPermissions(
  userId: string,
): Promise<UserAuth | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    // Extract roles and permissions
    const roles = user.roles.map(r => r.role.name);
    const permissions = user.roles.flatMap(r =>
      r.role.permissions.map(p => ({
        resource: p.permission.resource,
        action: p.permission.action,
      })),
    );

    return {
      userId: user.id,
      username: user.username,
      roles,
      permissions,
    };
  } catch (error) {
    console.error('Error fetching user with permissions:', error);
    return null;
  }
}

/**
 * Verify a password against stored hash
 */
async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  // In a real app, this would use bcrypt or similar
  // For this implementation, we're using a simplified approach
  const hash = crypto.createHash('sha256').update(password).digest('hex');

  return hash === storedHash;
}

/**
 * Register a new admin user (for setup/testing)
 */
export async function registerAdminUser(
  username: string,
  password: string,
): Promise<UserAuth | null> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return null;
    }

    // Hash password
    const passwordHash = crypto
      .createHash('sha256')
      .update(password)
      .digest('hex');

    // Create a transaction to set up the user with admin role
    const newUser = await prisma.$transaction(async tx => {
      // Create user
      const user = await tx.user.create({
        data: {
          username,
          email: `${username}@ship-sim.local`,
          passwordHash,
        },
      });

      // Find or create admin role
      let adminRole = await tx.role.findFirst({
        where: { name: 'admin' },
      });

      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            name: 'admin',
            description: 'Full system administrator access',
          },
        });

        // Create basic admin permissions
        const adminPermissions = [
          { resource: 'user', action: 'manage' },
          { resource: 'role', action: 'manage' },
          { resource: 'vessel', action: 'manage' },
          { resource: 'environment', action: 'manage' },
          { resource: 'system', action: 'manage' },
        ];

        // Create permissions and link to admin role
        for (const perm of adminPermissions) {
          const permission = await tx.permission.create({
            data: {
              name: `${perm.resource}:${perm.action}`,
              resource: perm.resource,
              action: perm.action,
              description: `Permission to ${perm.action} ${perm.resource}`,
            },
          });

          await tx.rolePermission.create({
            data: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          });
        }
      }

      // Assign admin role to user
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });

      return user;
    });

    // Generate tokens
    const adminRoles = ['admin'];
    const adminPermissions = [
      { resource: 'user', action: 'manage' },
      { resource: 'role', action: 'manage' },
      { resource: 'vessel', action: 'manage' },
      { resource: 'environment', action: 'manage' },
      { resource: 'system', action: 'manage' },
    ];

    const { accessToken, refreshToken } = generateTokens(
      newUser.id,
      newUser.username,
      adminRoles,
      adminPermissions,
    );

    // Return complete user auth data
    return {
      userId: newUser.id,
      username: newUser.username,
      roles: adminRoles,
      permissions: adminPermissions,
      token: accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error('Error registering admin user:', error);
    return null;
  }
}
