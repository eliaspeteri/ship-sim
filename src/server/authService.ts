/**
 * Authentication Service
 * Provides secure authentication and role-based access control
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

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
  token?: string;
}

// Get secret key from environment variables, with fallback for development
const AUTH_SECRET = process.env.AUTH_SECRET || 'ship-sim-auth-secret-2025';

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

    // Generate authentication token
    const token = generateAuthToken(user.id);

    return {
      userId: user.id,
      username: user.username,
      roles,
      permissions,
      token,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

/**
 * Verify an authentication token
 */
export function verifyAuthToken(token: string): Promise<UserAuth | null> {
  try {
    // In a production system, this would verify JWT or other token
    // For this implementation, we're using a simple token format
    const [userId, timestamp, hash] = token.split('.');

    const expectedHash = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(`${userId}.${timestamp}`)
      .digest('hex');

    // Verify hash is valid
    if (hash !== expectedHash) {
      return Promise.resolve(null);
    }

    // Check if token is expired (24 hour validity)
    const tokenTimestamp = parseInt(timestamp, 10);
    if (Date.now() - tokenTimestamp > 24 * 60 * 60 * 1000) {
      return Promise.resolve(null);
    }

    // Get user with their roles and permissions
    return getUserWithPermissions(userId);
  } catch (error) {
    console.error('Token verification error:', error);
    return Promise.resolve(null);
  }
}

/**
 * Verify a user's socket connection based on auth data
 */
export async function verifySocketAuth(
  authData: any,
): Promise<UserAuth | null> {
  try {
    // Check if token is provided
    if (authData.token) {
      return verifyAuthToken(authData.token);
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
 * Generate an authentication token for a user
 */
function generateAuthToken(userId: string): string {
  const timestamp = Date.now().toString();

  // Create hash using userId and timestamp
  const hash = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${userId}.${timestamp}`)
    .digest('hex');

  // Format: userId.timestamp.hash
  return `${userId}.${timestamp}.${hash}`;
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

    // Generate token
    const token = generateAuthToken(newUser.id);

    // Return complete user auth data
    return {
      userId: newUser.id,
      username: newUser.username,
      roles: ['admin'],
      permissions: [
        { resource: 'user', action: 'manage' },
        { resource: 'role', action: 'manage' },
        { resource: 'vessel', action: 'manage' },
        { resource: 'environment', action: 'manage' },
        { resource: 'system', action: 'manage' },
      ],
      token,
    };
  } catch (error) {
    console.error('Error registering admin user:', error);
    return null;
  }
}
