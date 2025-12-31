import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const AUTH_SECRET = process.env.AUTH_SECRET || 'default-secret-key';
const ACCESS_TOKEN_EXPIRY = '15m'; // Short expiry for access tokens
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

type Permission = { resource: string; action: string };

interface StoredUser {
  id: string;
  username: string;
  passwordHash: string;
  roles: string[];
  permissions: Permission[];
}

interface StoredRefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: number;
}

const users: StoredUser[] = [];
const refreshTokens: Map<string, StoredRefreshToken> = new Map();

// Define the structure of the JWT payload
export interface TokenPayload {
  userId: string;
  username: string;
  roles: string[];
  permissions: Permission[];
  tokenId?: string; // Optional: For refresh token invalidation
}

// Define the structure returned by authentication functions
export interface UserAuth extends TokenPayload {
  token?: string; // Access Token
  refreshToken?: string; // Refresh Token
  expiresIn?: number; // Access Token expiry in seconds
}

const defaultAdminPermissions: Permission[] = [{ resource: '*', action: '*' }];

/**
 * Generates JWT access and refresh tokens for a user.
 */
function generateTokens(user: StoredUser): {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
} {
  const accessTokenPayload: TokenPayload = {
    userId: user.id,
    username: user.username,
    roles: user.roles,
    permissions: user.permissions,
  };

  const accessToken = jwt.sign(accessTokenPayload, AUTH_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshTokenId = uuidv4();
  const refreshTokenPayload: TokenPayload = {
    userId: user.id,
    username: user.username,
    roles: [],
    permissions: [],
    tokenId: refreshTokenId,
  };

  const refreshToken = jwt.sign(refreshTokenPayload, AUTH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY_SECONDS,
  });

  refreshTokens.set(refreshTokenId, {
    id: refreshTokenId,
    token: refreshToken,
    userId: user.id,
    expiresAt: Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000,
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
 */
function getUserRolesAndPermissions(user: StoredUser): {
  roles: string[];
  permissions: Permission[];
} {
  return { roles: user.roles, permissions: user.permissions };
}

/**
 * Authenticates a user based on username and password.
 */
export async function authenticateUser(
  username: string,
  password: string,
): Promise<UserAuth | null> {
  const user = users.find(u => u.username === username);

  if (!user) {
    console.warn(`User ${username} not found during authentication.`);
    return null;
  }

  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatch) {
    console.error(
      `Authentication failed. ${JSON.stringify(
        { username, userId: user.id, passwordMatches: false },
        null,
        2,
      )}`,
    );
    return null;
  }

  const { roles, permissions } = getUserRolesAndPermissions(user);
  const { accessToken, refreshToken, expiresIn } = generateTokens(user);

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
 */
export async function registerAdminUser(
  username: string,
  password: string,
): Promise<UserAuth | null> {
  const existing = users.find(u => u.username === username);
  if (existing) {
    console.warn(`Registration failed: Username '${username}' already exists.`);
    return null;
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser: StoredUser = {
    id: uuidv4(),
    username,
    passwordHash: hashedPassword,
    roles: ['admin'],
    permissions: defaultAdminPermissions,
  };

  users.push(newUser);

  const { roles, permissions } = getUserRolesAndPermissions(newUser);
  const { accessToken, refreshToken, expiresIn } = generateTokens(newUser);

  return {
    userId: newUser.id,
    username: newUser.username,
    roles,
    permissions,
    token: accessToken,
    refreshToken,
    expiresIn,
  };
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

    const storedToken = refreshTokens.get(decoded.tokenId);
    if (!storedToken) {
      console.warn(`Refresh token ID ${decoded.tokenId} not found.`);
      return null;
    }

    if (storedToken.expiresAt < Date.now()) {
      console.warn(`Refresh token ID ${decoded.tokenId} has expired.`);
      refreshTokens.delete(decoded.tokenId);
      return null;
    }

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

    refreshTokens.delete(decoded.tokenId);
    console.info(`Refresh token ${decoded.tokenId} invalidated (in-memory).`);
    return true;
  } catch (error: unknown) {
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
  const user = users.find(u => u.id === decodedPayload.userId);

  if (!user) {
    console.error(
      `User ${decodedPayload.userId} not found during token refresh.`,
    );
    return null; // User associated with the token no longer exists
  }

  // 4. Generate new access and refresh tokens
  const { accessToken, refreshToken, expiresIn } = generateTokens(user);

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

// Seed a default admin for convenience
const defaultAdminUsername = process.env.ADMIN_USERNAME || 'admin';
const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin';
registerAdminUser(defaultAdminUsername, defaultAdminPassword).catch(error =>
  console.error('Failed to seed default admin user:', error),
);
