import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const AUTH_SECRET = process.env.AUTH_SECRET || 'default-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m'; // Short expiry for access tokens
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

// Define the structure of the JWT payload
export interface TokenPayload {
  userId: string;
  username: string;
  roles: string[];
  permissions: {
    resource: string;
    action: string;
  }[];
  tokenId?: string; // Optional: For refresh token invalidation
}

// Define the structure returned by authentication functions
export interface UserAuth extends TokenPayload {
  token?: string; // Access Token
  refreshToken?: string; // Refresh Token
  expiresIn?: number; // Access Token expiry in seconds
}

/**
 * Generates JWT access and refresh tokens for a user.
 * @param user The user object from the database.
 * @param roles Array of role names.
 * @param permissions Array of permission strings.
 * @returns Object containing access token, refresh token, and expiry.
 */
async function generateTokens(
  user: User,
  roles: string[],
  permissions: {
    resource: string;
    action: string;
  }[],
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const accessTokenPayload: TokenPayload = {
    userId: user.id,
    username: user.username,
    roles,
    permissions,
  };

  const accessToken = jwt.sign(accessTokenPayload, AUTH_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  // Generate a unique ID for the refresh token for potential invalidation
  const refreshTokenId = uuidv4();
  const refreshTokenPayload: TokenPayload = {
    userId: user.id,
    username: user.username, // Include username for easier identification if needed
    roles: [], // Refresh token shouldn't grant permissions directly
    permissions: [],
    tokenId: refreshTokenId,
  };

  const refreshToken = jwt.sign(refreshTokenPayload, AUTH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY_SECONDS,
  });

  // Store the refresh token details in the database
  await prisma.refreshToken.create({
    data: {
      id: refreshTokenId,
      token: refreshToken, // Store the signed token itself
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000),
    },
  });

  const decodedAccess = jwt.decode(accessToken) as jwt.JwtPayload;
  const expiresInSeconds = decodedAccess.exp
    ? decodedAccess.exp - Math.floor(Date.now() / 1000)
    : 0;

  return {
    accessToken,
    refreshToken,
    expiresIn: expiresInSeconds,
  };
}

/**
 * Fetches user roles and permissions.
 * @param userId The ID of the user.
 * @returns Object containing arrays of role names and permission strings.
 */
async function getUserRolesAndPermissions(userId: string): Promise<{
  roles: string[];
  permissions: {
    resource: string;
    action: string;
  }[];
}> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
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
  });

  const roles = userRoles.map(ur => ur.role.name);
  const permissionsSet = new Set<{
    resource: string;
    action: string;
  }>();
  userRoles.forEach(ur => {
    ur.role.permissions.forEach(rp => {
      permissionsSet.add({
        resource: rp.permission.resource,
        action: rp.permission.action,
      });
    });
  });

  return { roles, permissions: Array.from(permissionsSet) };
}

/**
 * Authenticates a user based on username and password.
 * @param username The username.
 * @param password The password.
 * @returns UserAuth object containing user details and tokens, or null if authentication fails.
 */
export async function authenticateUser(
  username: string,
  password: string,
): Promise<UserAuth | null> {
  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.warn(`User ${username} not found during authentication.`);

    return null; // User not found
  }

  // Check password using bcrypt
  const passwordMatch = bcrypt.compareSync(password, user?.passwordHash);
  if (!passwordMatch) {
    console.error(
      `Authentication failed. ${JSON.stringify(
        {
          username,
          userId: user?.id,
          passwordMatches: user
            ? bcrypt.compareSync(password, user.passwordHash)
            : false,
        },
        null,
        2,
      )}`,
    );

    return null; // Invalid credentials
  }

  const { roles, permissions } = await getUserRolesAndPermissions(user.id);
  const { accessToken, refreshToken, expiresIn } = await generateTokens(
    user,
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
    expiresIn,
  };
}

/**
 * Registers a new admin user.
 * @param username The username.
 * @param password The password.
 * @returns UserAuth object containing user details and tokens, or null if registration fails.
 */
export async function registerAdminUser(
  username: string,
  password: string,
): Promise<UserAuth | null> {
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Find or create the 'admin' role
    let adminRole = await prisma.role.findUnique({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'admin',
          description: 'Administrator with full access',
        },
      });
      // Optionally add default admin permissions here
    }

    // Create the user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        email: `${username}@shipsim.local`, // Placeholder email
        roles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
    });

    // Get roles/permissions (should include admin now)
    const { roles, permissions } = await getUserRolesAndPermissions(user.id);
    const { accessToken, refreshToken, expiresIn } = await generateTokens(
      user,
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
      expiresIn,
    };
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string; meta?: { target?: string[] } }).code ===
        'P2002' &&
      (error as { meta?: { target?: string[] } }).meta?.target?.includes(
        'username',
      )
    ) {
      console.warn(
        `Registration failed: Username '${username}' already exists.`,
      );
      return null;
    }
    console.error('Error during admin user registration:', error);
    return null;
  }
}

/**
 * Verifies a JWT access token.
 * @param token The JWT access token string.
 * @returns The decoded token payload if valid, otherwise null.
 */
export async function verifyAccessToken(
  token: string,
): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as TokenPayload;
    // Perform additional checks if needed (e.g., ensure required fields exist)
    if (!decoded.userId || !decoded.username) {
      return null;
    }
    return decoded;
  } catch (error) {
    // Token verification failed (expired, invalid signature, etc.)
    console.error(
      'Access token verification failed:',
      (error as Error).message,
    );
    return null;
  }
}

/**
 * Verifies a JWT refresh token and checks if it's valid in the database.
 * @param token The JWT refresh token string.
 * @returns The decoded token payload if valid and exists in DB, otherwise null.
 */
export async function verifyRefreshToken(
  token: string,
): Promise<TokenPayload | null> {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as TokenPayload;

    // Check required fields and specifically the tokenId
    if (!decoded.userId || !decoded.tokenId) {
      console.warn('Refresh token missing userId or tokenId');
      return null;
    }

    // Check if the refresh token exists and hasn't expired in the database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { id: decoded.tokenId },
    });

    if (!storedToken) {
      console.warn(`Refresh token ID ${decoded.tokenId} not found in DB.`);
      return null;
    }

    if (storedToken.expiresAt < new Date()) {
      console.warn(`Refresh token ID ${decoded.tokenId} has expired.`);
      // Optionally clean up expired tokens
      await prisma.refreshToken.delete({ where: { id: decoded.tokenId } });
      return null;
    }

    // Optional: Check if the stored token string matches the provided one
    // This adds a layer against certain replay attacks if the DB is compromised
    // but might be overkill depending on threat model.
    // if (storedToken.token !== token) {
    //   console.warn(`Provided refresh token does not match stored token for ID ${decoded.tokenId}`);
    //   return null;
    // }

    return decoded; // Token is valid and exists in DB
  } catch (error: unknown) {
    // Token verification failed (expired, invalid signature, etc.)
    if (error instanceof Error) {
      console.warn('Refresh token JWT verification failed:', error.message);
    } else {
      console.warn('Refresh token JWT verification failed:', error);
    }
    return null;
  }
}

/**
 * Invalidates a refresh token by deleting it from the database.
 * @param token The JWT refresh token string.
 * @returns True if invalidated successfully or token was already invalid/not found, false on error.
 */
export async function invalidateRefreshToken(token: string): Promise<boolean> {
  try {
    // Decode to get the tokenId without verifying expiry (it might be expired)
    const decoded = jwt.decode(token) as TokenPayload | null;

    if (!decoded || !decoded.tokenId) {
      console.warn(
        'Could not decode refresh token or missing tokenId for invalidation.',
      );
      return true; // Treat as success if token is invalid anyway
    }

    // Attempt to delete the token from the database
    await prisma.refreshToken.delete({
      where: { id: decoded.tokenId },
    });

    console.info(`Refresh token ${decoded.tokenId} invalidated.`);
    return true;
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2025'
    ) {
      // Prisma error code for record not found
      console.info('Refresh token already invalidated or not found.');
      return true;
    }
    console.error('Error invalidating refresh token:', error);
    return false;
  }
}

/**
 * Refreshes an access token using a valid refresh token.
 * Invalidates the used refresh token and issues new access and refresh tokens.
 * @param oldRefreshToken The JWT refresh token string.
 * @returns Object containing new access and refresh tokens, or null if refresh fails.
 */
export async function refreshAuthToken(oldRefreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} | null> {
  // 1. Verify the old refresh token (checks DB validity and expiry)
  const decodedPayload = await verifyRefreshToken(oldRefreshToken);

  if (!decodedPayload || !decodedPayload.userId || !decodedPayload.tokenId) {
    return null; // Invalid or expired refresh token
  }

  // 2. Invalidate the old refresh token immediately (important for security)
  const invalidated = await invalidateRefreshToken(oldRefreshToken);
  if (!invalidated) {
    // Log error but potentially continue if invalidation failed unexpectedly
    console.error(
      `Failed to invalidate old refresh token ${decodedPayload.tokenId} during refresh.`,
    );
    // Depending on policy, you might want to return null here to force re-login.
  }

  // 3. Fetch the user associated with the token
  const user = await prisma.user.findUnique({
    where: { id: decodedPayload.userId },
  });

  if (!user) {
    console.error(
      `User ${decodedPayload.userId} not found during token refresh.`,
    );
    return null; // User associated with the token no longer exists
  }

  // 4. Generate new access and refresh tokens
  const { roles, permissions } = await getUserRolesAndPermissions(user.id);
  const { accessToken, refreshToken, expiresIn } = await generateTokens(
    user,
    roles,
    permissions,
  );

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}
