import { eq, desc, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { musicShares, users } from '../db/schema.js';
import { generateId } from '../utils/nanoid.js';

export interface CreateMusicShareInput {
  userId: string;
  postId?: string;
  spotifyTrackId?: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  albumArtUrl?: string;
  previewUrl?: string;
  externalUrl?: string;
  moodKaomoji?: string;
}

export interface MusicShareWithUser {
  id: string;
  userId: string;
  postId: string | null;
  spotifyTrackId: string | null;
  trackName: string;
  artistName: string;
  albumName: string | null;
  albumArtUrl: string | null;
  previewUrl: string | null;
  externalUrl: string | null;
  moodKaomoji: string | null;
  createdAt: Date;
  user?: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
}

/**
 * Create a new music share
 */
export async function createMusicShare(input: CreateMusicShareInput): Promise<MusicShareWithUser> {
  const id = generateId();

  await db.insert(musicShares).values({
    id,
    userId: input.userId,
    postId: input.postId || null,
    spotifyTrackId: input.spotifyTrackId || null,
    trackName: input.trackName,
    artistName: input.artistName,
    albumName: input.albumName || null,
    albumArtUrl: input.albumArtUrl || null,
    previewUrl: input.previewUrl || null,
    externalUrl: input.externalUrl || null,
    moodKaomoji: input.moodKaomoji || null,
  });

  const share = await getMusicShareById(id);
  return share!;
}

/**
 * Get a music share by ID with user info
 */
export async function getMusicShareById(id: string): Promise<MusicShareWithUser | null> {
  const result = await db
    .select({
      share: musicShares,
      user: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
      },
    })
    .from(musicShares)
    .leftJoin(users, eq(musicShares.userId, users.id))
    .where(eq(musicShares.id, id))
    .limit(1);

  if (result.length === 0) return null;

  const { share, user } = result[0];
  return {
    ...share,
    user: user || undefined,
  };
}

/**
 * Get music share by post ID
 */
export async function getMusicShareByPostId(postId: string): Promise<MusicShareWithUser | null> {
  const result = await db
    .select({
      share: musicShares,
      user: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
      },
    })
    .from(musicShares)
    .leftJoin(users, eq(musicShares.userId, users.id))
    .where(eq(musicShares.postId, postId))
    .limit(1);

  if (result.length === 0) return null;

  const { share, user } = result[0];
  return {
    ...share,
    user: user || undefined,
  };
}

/**
 * Get recent music shares (for a feed)
 */
export async function getRecentMusicShares(limit: number = 20): Promise<MusicShareWithUser[]> {
  const result = await db
    .select({
      share: musicShares,
      user: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
      },
    })
    .from(musicShares)
    .leftJoin(users, eq(musicShares.userId, users.id))
    .orderBy(desc(musicShares.createdAt))
    .limit(limit);

  return result.map(({ share, user }) => ({
    ...share,
    user: user || undefined,
  }));
}

/**
 * Delete a music share (owner only)
 */
export async function deleteMusicShare(id: string, userId: string): Promise<boolean> {
  const share = await db.select().from(musicShares).where(eq(musicShares.id, id)).limit(1);

  if (share.length === 0) return false;
  if (share[0].userId !== userId) return false;

  await db.delete(musicShares).where(eq(musicShares.id, id));
  return true;
}

/**
 * Get recent music shares for a specific user
 */
export async function getUserRecentMusicShares(
  userId: string,
  limit: number = 3
): Promise<MusicShareWithUser[]> {
  const result = await db
    .select({
      share: musicShares,
      user: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
      },
    })
    .from(musicShares)
    .leftJoin(users, eq(musicShares.userId, users.id))
    .where(eq(musicShares.userId, userId))
    .orderBy(desc(musicShares.createdAt))
    .limit(limit);

  return result.map(({ share, user }) => ({
    ...share,
    user: user || undefined,
  }));
}

/**
 * Batch fetch music shares for multiple posts
 */
export async function getMusicSharesForPosts(
  postIds: string[]
): Promise<Map<string, MusicShareWithUser>> {
  if (postIds.length === 0) return new Map();

  const result = await db
    .select({
      share: musicShares,
      user: {
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        avatar: users.avatar,
      },
    })
    .from(musicShares)
    .leftJoin(users, eq(musicShares.userId, users.id))
    .where(inArray(musicShares.postId, postIds));

  const map = new Map<string, MusicShareWithUser>();
  for (const { share, user } of result) {
    if (share.postId) {
      map.set(share.postId, {
        ...share,
        user: user || undefined,
      });
    }
  }

  return map;
}
