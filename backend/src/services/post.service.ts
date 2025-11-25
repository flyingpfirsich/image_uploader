import { eq, desc, and, gte, lt } from 'drizzle-orm';
import { db, posts, media, reactions, users, Post, Media, Reaction } from '../db/index.js';
import { generateId } from '../utils/nanoid.js';

interface CreatePostInput {
  userId: string;
  text?: string;
  location?: string;
  linkUrl?: string;
  linkTitle?: string;
}

interface MediaInput {
  filename: string;
  mimeType: string;
  width?: number;
  height?: number;
  durationMs?: number;
  order: number;
}

export interface PostWithDetails extends Post {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  media: Media[];
  reactions: (Reaction & {
    user: {
      id: string;
      username: string;
      displayName: string;
    };
  })[];
}

export async function createPost(
  input: CreatePostInput,
  mediaFiles: MediaInput[]
): Promise<PostWithDetails> {
  const postId = generateId();
  
  // Insert post
  await db.insert(posts).values({
    id: postId,
    userId: input.userId,
    text: input.text || null,
    location: input.location || null,
    linkUrl: input.linkUrl || null,
    linkTitle: input.linkTitle || null,
  });
  
  // Insert media
  if (mediaFiles.length > 0) {
    await db.insert(media).values(
      mediaFiles.map((m) => ({
        id: generateId(),
        postId,
        filename: m.filename,
        mimeType: m.mimeType,
        width: m.width || null,
        height: m.height || null,
        durationMs: m.durationMs || null,
        order: m.order,
      }))
    );
  }
  
  return getPostById(postId) as Promise<PostWithDetails>;
}

export async function getPostById(postId: string): Promise<PostWithDetails | null> {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  });
  
  if (!post) return null;
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, post.userId),
  });
  
  if (!user) return null;
  
  const postMedia = await db.query.media.findMany({
    where: eq(media.postId, postId),
    orderBy: (media, { asc }) => [asc(media.order)],
  });
  
  const postReactions = await db.query.reactions.findMany({
    where: eq(reactions.postId, postId),
  });
  
  const reactionsWithUsers = await Promise.all(
    postReactions.map(async (r) => {
      const reactUser = await db.query.users.findFirst({
        where: eq(users.id, r.userId),
      });
      return {
        ...r,
        user: {
          id: reactUser!.id,
          username: reactUser!.username,
          displayName: reactUser!.displayName,
        },
      };
    })
  );
  
  return {
    ...post,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
    },
    media: postMedia,
    reactions: reactionsWithUsers,
  };
}

export async function getTodaysFeed(): Promise<PostWithDetails[]> {
  // Get start of today (local time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todaysPosts = await db.query.posts.findMany({
    where: and(
      gte(posts.createdAt, today),
      lt(posts.createdAt, tomorrow)
    ),
    orderBy: [desc(posts.createdAt)],
  });
  
  const postsWithDetails = await Promise.all(
    todaysPosts.map((p) => getPostById(p.id))
  );
  
  return postsWithDetails.filter((p): p is PostWithDetails => p !== null);
}

export async function getUserPosts(userId: string): Promise<PostWithDetails[]> {
  const userPosts = await db.query.posts.findMany({
    where: eq(posts.userId, userId),
    orderBy: [desc(posts.createdAt)],
  });
  
  const postsWithDetails = await Promise.all(
    userPosts.map((p) => getPostById(p.id))
  );
  
  return postsWithDetails.filter((p): p is PostWithDetails => p !== null);
}

export async function deletePost(postId: string, userId: string): Promise<boolean> {
  const post = await db.query.posts.findFirst({
    where: eq(posts.id, postId),
  });
  
  if (!post || post.userId !== userId) {
    return false;
  }
  
  // Media and reactions will be cascade deleted
  await db.delete(posts).where(eq(posts.id, postId));
  
  return true;
}

export async function addReaction(
  postId: string,
  userId: string,
  kaomoji: string
): Promise<Reaction> {
  // Check if user already reacted with this kaomoji
  const existing = await db.query.reactions.findFirst({
    where: and(
      eq(reactions.postId, postId),
      eq(reactions.userId, userId),
      eq(reactions.kaomoji, kaomoji)
    ),
  });
  
  if (existing) {
    return existing;
  }
  
  const id = generateId();
  await db.insert(reactions).values({
    id,
    postId,
    userId,
    kaomoji,
  });
  
  return db.query.reactions.findFirst({
    where: eq(reactions.id, id),
  }) as Promise<Reaction>;
}

export async function removeReaction(
  postId: string,
  userId: string,
  kaomoji: string
): Promise<boolean> {
  const result = await db.delete(reactions).where(
    and(
      eq(reactions.postId, postId),
      eq(reactions.userId, userId),
      eq(reactions.kaomoji, kaomoji)
    )
  );
  
  return result.changes > 0;
}


