import { eq } from 'drizzle-orm';
import { db, users, User } from '../db/index.js';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';

interface UpdateProfileInput {
  displayName?: string;
  birthday?: string;
  avatar?: string;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<Omit<User, 'passwordHash'> | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return null;

  // If updating avatar and old avatar exists, delete it
  if (input.avatar && user.avatar) {
    const oldPath = join(config.uploadsDir, 'avatars', user.avatar);
    if (existsSync(oldPath)) {
      unlinkSync(oldPath);
    }
  }

  const updates: Partial<User> = {};
  if (input.displayName !== undefined) updates.displayName = input.displayName;
  if (input.birthday !== undefined) updates.birthday = input.birthday;
  if (input.avatar !== undefined) updates.avatar = input.avatar;

  if (Object.keys(updates).length > 0) {
    await db.update(users).set(updates).where(eq(users.id, userId));
  }

  const updated = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!updated) return null;

  const { passwordHash: _, ...safeUser } = updated;
  return safeUser;
}

export async function getUserProfile(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return null;

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}
