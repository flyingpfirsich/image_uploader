import { eq, and, isNull, gt } from 'drizzle-orm';
import { db, users, inviteCodes, User, NewUser } from '../db/index.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateId, generateInviteCode } from '../utils/nanoid.js';
import { signToken } from '../utils/jwt.js';
import { config } from '../config.js';

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
  token: string;
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
  const token = signToken({ userId: user.id, username: user.username });

  return { user: safeUser, token };
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
  const token = signToken({ userId: user.id, username: user.username });

  return { user: safeUser, token };
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
  const allUsers = await db.query.users.findMany({
    orderBy: (users, { asc }) => [asc(users.displayName)],
  });

  return allUsers.map(({ passwordHash: _, ...user }) => user);
}
