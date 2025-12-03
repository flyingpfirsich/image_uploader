import { eq, and, isNull, gt, ne, lt } from 'drizzle-orm';
import { db, users, inviteCodes, refreshTokens, User, NewUser } from '../db/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateId, generateInviteCode } from '../utils/nanoid.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { config } from '../config.js';
import crypto from 'crypto';

interface RegisterInput {
  username: string;
  password: string;
  displayName: string;
  inviteCode: string;
  birthday?: string;
}

interface LoginInput {
  username: string;
  password: string;
}

interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}

/**
 * Hash a refresh token for secure storage
 */
function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Store a refresh token in the database
 */
async function storeRefreshToken(userId: string, token: string): Promise<void> {
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date();
  // Parse the refresh token expiry (e.g., '7d' -> 7 days)
  const match = config.jwtRefreshExpiresIn.match(/(\d+)([dhms])/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 'd':
        expiresAt.setDate(expiresAt.getDate() + value);
        break;
      case 'h':
        expiresAt.setHours(expiresAt.getHours() + value);
        break;
      case 'm':
        expiresAt.setMinutes(expiresAt.getMinutes() + value);
        break;
      case 's':
        expiresAt.setSeconds(expiresAt.getSeconds() + value);
        break;
    }
  } else {
    // Default to 7 days if parsing fails
    expiresAt.setDate(expiresAt.getDate() + 7);
  }

  await db.insert(refreshTokens).values({
    id: generateId(),
    userId,
    tokenHash,
    expiresAt,
  });
}

/**
 * Validate and consume a refresh token
 */
async function validateRefreshToken(token: string): Promise<string | null> {
  const tokenHash = hashRefreshToken(token);

  const storedToken = await db.query.refreshTokens.findFirst({
    where: and(eq(refreshTokens.tokenHash, tokenHash), gt(refreshTokens.expiresAt, new Date())),
  });

  if (!storedToken) return null;

  // Delete the used token (single-use refresh tokens)
  await db.delete(refreshTokens).where(eq(refreshTokens.id, storedToken.id));

  return storedToken.userId;
}

/**
 * Clean up expired refresh tokens
 */
export async function cleanupExpiredRefreshTokens(): Promise<void> {
  await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()));
}

/**
 * Revoke all refresh tokens for a user (logout everywhere)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const { username, password, displayName, inviteCode, birthday } = input;

  // Check if username exists
  const existing = await db.query.users.findFirst({
    where: eq(users.username, username.toLowerCase()),
  });

  if (existing) {
    throw new Error('Username already taken');
  }

  // Validate invite code
  const isInitialCode = inviteCode === config.initialInviteCode;
  let invite = null;

  if (!isInitialCode) {
    invite = await db.query.inviteCodes.findFirst({
      where: and(
        eq(inviteCodes.code, inviteCode.toUpperCase()),
        isNull(inviteCodes.usedBy),
        gt(inviteCodes.expiresAt, new Date())
      ),
    });

    if (!invite) {
      throw new Error('Invalid or expired invite code');
    }
  }

  // Create user
  const userId = generateId();
  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    id: userId,
    username: username.toLowerCase(),
    displayName,
    passwordHash,
    birthday: birthday || null,
  };

  await db.insert(users).values(newUser);

  // Mark invite as used (if not initial code)
  if (invite) {
    await db
      .update(inviteCodes)
      .set({ usedBy: userId, usedAt: new Date() })
      .where(eq(inviteCodes.code, invite.code));
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error('Failed to create user');
  }

  const { passwordHash: _, ...safeUser } = user;
  const accessToken = signAccessToken({ userId: user.id, username: user.username });
  const refreshToken = signRefreshToken({ userId: user.id, username: user.username });

  // Store refresh token hash in database
  await storeRefreshToken(user.id, refreshToken);

  return { user: safeUser, accessToken, refreshToken };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const { username, password } = input;

  const user = await db.query.users.findFirst({
    where: eq(users.username, username.toLowerCase()),
  });

  if (!user) {
    throw new Error('Invalid username or password');
  }

  const valid = await verifyPassword(password, user.passwordHash);

  if (!valid) {
    throw new Error('Invalid username or password');
  }

  const { passwordHash: _, ...safeUser } = user;
  const accessToken = signAccessToken({ userId: user.id, username: user.username });
  const refreshToken = signRefreshToken({ userId: user.id, username: user.username });

  // Store refresh token hash in database
  await storeRefreshToken(user.id, refreshToken);

  return { user: safeUser, accessToken, refreshToken };
}

/**
 * Refresh access token using a valid refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  // Verify JWT signature and type
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    throw new Error('Invalid refresh token');
  }

  // Validate against database (single-use)
  const userId = await validateRefreshToken(refreshToken);
  if (!userId || userId !== payload.userId) {
    throw new Error('Invalid or expired refresh token');
  }

  // Get user to ensure they still exist
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate new tokens
  const newAccessToken = signAccessToken({ userId: user.id, username: user.username });
  const newRefreshToken = signRefreshToken({ userId: user.id, username: user.username });

  // Store new refresh token
  await storeRefreshToken(user.id, newRefreshToken);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

export async function getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return null;

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function createInviteCode(createdBy: string): Promise<string> {
  const code = generateInviteCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.inviteCodeExpiresDays);

  await db.insert(inviteCodes).values({
    code,
    createdBy,
    expiresAt,
  });

  return code;
}

export async function getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
  // Filter out admin user from the list - admin should not be visible to regular users
  const allUsers = await db.query.users.findMany({
    where: ne(users.username, config.adminUsername),
    orderBy: (users, { asc }) => [asc(users.displayName)],
  });

  return allUsers.map(({ passwordHash: _, ...user }) => user);
}
