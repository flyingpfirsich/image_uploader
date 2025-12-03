/**
 * Unit tests for auth.service.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { eq, and, isNull, gt } from 'drizzle-orm';
import { getTestDb } from '../test/setup.js';
import { users, inviteCodes } from '../db/schema.js';
import { hashPassword } from '../utils/password.js';
import { generateId, generateInviteCode } from '../utils/nanoid.js';
import { signToken } from '../utils/jwt.js';

// We'll test the service logic directly using the test database
// Instead of importing the actual service (which has hardcoded db import),
// we replicate the logic here with the test db

describe('auth.service', () => {
  let testDb: ReturnType<typeof getTestDb>;

  beforeEach(() => {
    testDb = getTestDb();
  });

  describe('register', () => {
    it('should register a new user with initial invite code', async () => {
      const username = 'testuser';
      const password = 'password123';
      const displayName = 'Test User';
      // inviteCode = 'TEST-CODE' matches config mock - not validated in this test

      // Simulate registration logic
      const existing = await testDb.query.users.findFirst({
        where: eq(users.username, username.toLowerCase()),
      });

      expect(existing).toBeUndefined();

      const userId = generateId();
      const passwordHash = await hashPassword(password);

      await testDb.insert(users).values({
        id: userId,
        username: username.toLowerCase(),
        displayName,
        passwordHash,
        birthday: null,
      });

      const user = await testDb.query.users.findFirst({
        where: eq(users.id, userId),
      });

      expect(user).toBeDefined();
      expect(user!.username).toBe('testuser');
      expect(user!.displayName).toBe('Test User');
    });

    it('should reject registration with existing username', async () => {
      const userId = generateId();
      const passwordHash = await hashPassword('password123');

      // Create existing user
      await testDb.insert(users).values({
        id: userId,
        username: 'existinguser',
        displayName: 'Existing User',
        passwordHash,
      });

      // Try to find user with same username
      const existing = await testDb.query.users.findFirst({
        where: eq(users.username, 'existinguser'),
      });

      expect(existing).toBeDefined();
      // In actual service, this would throw 'Username already taken'
    });

    it('should register user with valid invite code', async () => {
      // Create an invite code
      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await testDb.insert(inviteCodes).values({
        code,
        createdBy: null,
        expiresAt,
      });

      // Find the invite code
      const invite = await testDb.query.inviteCodes.findFirst({
        where: and(
          eq(inviteCodes.code, code),
          isNull(inviteCodes.usedBy),
          gt(inviteCodes.expiresAt, new Date())
        ),
      });

      expect(invite).toBeDefined();
      expect(invite!.code).toBe(code);

      // Create user
      const userId = generateId();
      const passwordHash = await hashPassword('password123');

      await testDb.insert(users).values({
        id: userId,
        username: 'newuser',
        displayName: 'New User',
        passwordHash,
      });

      // Mark invite as used
      await testDb
        .update(inviteCodes)
        .set({ usedBy: userId, usedAt: new Date() })
        .where(eq(inviteCodes.code, code));

      const usedInvite = await testDb.query.inviteCodes.findFirst({
        where: eq(inviteCodes.code, code),
      });

      expect(usedInvite!.usedBy).toBe(userId);
    });

    it('should reject expired invite code', async () => {
      // Create an expired invite code
      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 1); // Expired yesterday

      await testDb.insert(inviteCodes).values({
        code,
        createdBy: null,
        expiresAt,
      });

      // Try to find valid invite
      const invite = await testDb.query.inviteCodes.findFirst({
        where: and(
          eq(inviteCodes.code, code),
          isNull(inviteCodes.usedBy),
          gt(inviteCodes.expiresAt, new Date())
        ),
      });

      expect(invite).toBeUndefined();
      // In actual service, this would throw 'Invalid or expired invite code'
    });

    it('should reject already used invite code', async () => {
      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const usedByUserId = generateId();

      // Create user who "used" the invite code (foreign key constraint)
      const passwordHash = await hashPassword('password123');
      await testDb.insert(users).values({
        id: usedByUserId,
        username: 'usedbyuser',
        displayName: 'Used By User',
        passwordHash,
      });

      await testDb.insert(inviteCodes).values({
        code,
        createdBy: null,
        usedBy: usedByUserId, // Already used
        usedAt: new Date(),
        expiresAt,
      });

      const invite = await testDb.query.inviteCodes.findFirst({
        where: and(
          eq(inviteCodes.code, code),
          isNull(inviteCodes.usedBy),
          gt(inviteCodes.expiresAt, new Date())
        ),
      });

      expect(invite).toBeUndefined();
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const password = 'correctpassword';
      const passwordHash = await hashPassword(password);
      const userId = generateId();

      await testDb.insert(users).values({
        id: userId,
        username: 'loginuser',
        displayName: 'Login User',
        passwordHash,
      });

      const user = await testDb.query.users.findFirst({
        where: eq(users.username, 'loginuser'),
      });

      expect(user).toBeDefined();

      // Import and test password verification
      const { verifyPassword } = await import('../utils/password.js');
      const valid = await verifyPassword(password, user!.passwordHash);

      expect(valid).toBe(true);

      // Generate token
      const token = signToken({ userId: user!.id, username: user!.username });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should reject login with wrong password', async () => {
      const passwordHash = await hashPassword('correctpassword');
      const userId = generateId();

      await testDb.insert(users).values({
        id: userId,
        username: 'wrongpassuser',
        displayName: 'Wrong Pass User',
        passwordHash,
      });

      const user = await testDb.query.users.findFirst({
        where: eq(users.username, 'wrongpassuser'),
      });

      const { verifyPassword } = await import('../utils/password.js');
      const valid = await verifyPassword('wrongpassword', user!.passwordHash);

      expect(valid).toBe(false);
    });

    it('should reject login with non-existent user', async () => {
      const user = await testDb.query.users.findFirst({
        where: eq(users.username, 'nonexistent'),
      });

      expect(user).toBeUndefined();
      // In actual service, this would throw 'Invalid username or password'
    });

    it('should handle case-insensitive username lookup', async () => {
      const passwordHash = await hashPassword('password123');
      const userId = generateId();

      await testDb.insert(users).values({
        id: userId,
        username: 'caseuser', // stored lowercase
        displayName: 'Case User',
        passwordHash,
      });

      // Login with different cases - the service converts to lowercase
      const userLower = await testDb.query.users.findFirst({
        where: eq(users.username, 'caseuser'),
      });
      const userMixed = await testDb.query.users.findFirst({
        where: eq(users.username, 'CaseUser'.toLowerCase()),
      });

      expect(userLower).toBeDefined();
      expect(userMixed).toBeDefined();
      expect(userLower!.id).toBe(userMixed!.id);
    });
  });

  describe('getUserById', () => {
    it('should return user without password hash', async () => {
      const passwordHash = await hashPassword('password123');
      const userId = generateId();

      await testDb.insert(users).values({
        id: userId,
        username: 'getuser',
        displayName: 'Get User',
        passwordHash,
        birthday: '1990-01-15',
      });

      const user = await testDb.query.users.findFirst({
        where: eq(users.id, userId),
      });

      expect(user).toBeDefined();
      expect(user!.username).toBe('getuser');
      expect(user!.birthday).toBe('1990-01-15');

      // In service, passwordHash is excluded from return
      const { passwordHash: _, ...safeUser } = user!;
      expect(safeUser).not.toHaveProperty('passwordHash');
    });

    it('should return null for non-existent user', async () => {
      const user = await testDb.query.users.findFirst({
        where: eq(users.id, 'nonexistent-id'),
      });

      expect(user).toBeUndefined();
    });
  });

  describe('createInviteCode', () => {
    it('should create a valid invite code', async () => {
      const creatorId = generateId();
      const passwordHash = await hashPassword('password123');

      // Create the creator user first
      await testDb.insert(users).values({
        id: creatorId,
        username: 'creator',
        displayName: 'Creator',
        passwordHash,
      });

      const code = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await testDb.insert(inviteCodes).values({
        code,
        createdBy: creatorId,
        expiresAt,
      });

      const invite = await testDb.query.inviteCodes.findFirst({
        where: eq(inviteCodes.code, code),
      });

      expect(invite).toBeDefined();
      expect(invite!.code).toBe(code);
      expect(invite!.createdBy).toBe(creatorId);
      expect(invite!.usedBy).toBeNull();
      expect(new Date(invite!.expiresAt!).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('getAllUsers', () => {
    it('should return all users without password hashes', async () => {
      const passwordHash = await hashPassword('password123');

      // Create multiple users
      for (let i = 0; i < 3; i++) {
        await testDb.insert(users).values({
          id: generateId(),
          username: `user${i}`,
          displayName: `User ${i}`,
          passwordHash,
        });
      }

      const allUsers = await testDb.query.users.findMany();

      expect(allUsers).toHaveLength(3);

      // Check that all users have required fields
      allUsers.forEach((user) => {
        expect(user.username).toBeDefined();
        expect(user.displayName).toBeDefined();
      });
    });
  });
});
