/**
 * Authentication Service
 * Provides secure authentication for admin users
 */
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Initialize Prisma client
const prisma = new PrismaClient();

// Define auth-related interfaces
export interface UserAuth {
  userId: string;
  username: string;
  isAdmin: boolean;
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
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { username },
    });

    // If user not found or password doesn't match, return null
    if (!user) {
      return null;
    }

    // In a real app, we'd check password hash
    // For this implementation, we'll use a simplified approach
    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return null;
    }

    // Generate authentication token
    const token = generateAuthToken(user.id);

    return {
      userId: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
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
export function verifyAuthToken(token: string): UserAuth | null {
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
      return null;
    }

    // Check if token is expired (24 hour validity)
    const tokenTimestamp = parseInt(timestamp, 10);
    if (Date.now() - tokenTimestamp > 24 * 60 * 60 * 1000) {
      return null;
    }

    // In a real implementation, we'd query the database here
    // For this demo, we'll just return a simple response
    return {
      userId,
      username: 'admin',
      isAdmin: true,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
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

    return {
      userId,
      username: authData.username || 'Anonymous',
      isAdmin: false, // Default to non-admin without token
    };
  } catch (error) {
    console.error('Socket auth verification error:', error);

    // Return anonymous user on error
    return {
      userId: `user_${Math.random().toString(36).substring(2, 9)}`,
      username: 'Anonymous',
      isAdmin: false,
    };
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

    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        isAdmin: true,
      },
    });

    // Generate token
    const token = generateAuthToken(newUser.id);

    return {
      userId: newUser.id,
      username: newUser.username,
      isAdmin: newUser.isAdmin,
      token,
    };
  } catch (error) {
    console.error('Error registering admin user:', error);
    return null;
  }
}
