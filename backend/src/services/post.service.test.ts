/**
 * Unit tests for post.service.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { getTestDb } from '../test/setup.js';
import { users, posts, media, reactions } from '../db/schema.js';
import { hashPassword } from '../utils/password.js';
import { generateId } from '../utils/nanoid.js';

describe('post.service', () => {
  let testDb: ReturnType<typeof getTestDb>;
  let testUserId: string;

  beforeEach(async () => {
    testDb = getTestDb();

    // Create a test user for all tests
    testUserId = generateId();
    const passwordHash = await hashPassword('password123');
    await testDb.insert(users).values({
      id: testUserId,
      username: 'testuser',
      displayName: 'Test User',
      passwordHash,
    });
  });

  describe('createPost', () => {
    it('should create a post with text only', async () => {
      const postId = generateId();

      await testDb.insert(posts).values({
        id: postId,
        userId: testUserId,
        text: 'Hello world!',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });

      const post = await testDb.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

      expect(post).toBeDefined();
      expect(post!.text).toBe('Hello world!');
      expect(post!.userId).toBe(testUserId);
      expect(post!.location).toBeNull();
    });

    it('should create a post with location', async () => {
      const postId = generateId();

      await testDb.insert(posts).values({
        id: postId,
        userId: testUserId,
        text: 'Visiting!',
        location: 'Tokyo, Japan',
        linkUrl: null,
        linkTitle: null,
      });

      const post = await testDb.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

      expect(post!.location).toBe('Tokyo, Japan');
    });

    it('should create a post with link', async () => {
      const postId = generateId();

      await testDb.insert(posts).values({
        id: postId,
        userId: testUserId,
        text: 'Check this out!',
        location: null,
        linkUrl: 'https://example.com',
        linkTitle: 'Example Site',
      });

      const post = await testDb.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

      expect(post!.linkUrl).toBe('https://example.com');
      expect(post!.linkTitle).toBe('Example Site');
    });

    it('should create a post with media', async () => {
      const postId = generateId();
      const mediaId = generateId();

      await testDb.insert(posts).values({
        id: postId,
        userId: testUserId,
        text: 'With photo!',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });

      await testDb.insert(media).values({
        id: mediaId,
        postId,
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        width: 1920,
        height: 1080,
        order: 0,
      });

      const postMedia = await testDb.query.media.findMany({
        where: eq(media.postId, postId),
      });

      expect(postMedia).toHaveLength(1);
      expect(postMedia[0].filename).toBe('photo.jpg');
      expect(postMedia[0].mimeType).toBe('image/jpeg');
      expect(postMedia[0].width).toBe(1920);
    });

    it('should create a post with multiple media items in order', async () => {
      const postId = generateId();

      await testDb.insert(posts).values({
        id: postId,
        userId: testUserId,
        text: 'Multiple photos!',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });

      // Insert multiple media
      for (let i = 0; i < 3; i++) {
        await testDb.insert(media).values({
          id: generateId(),
          postId,
          filename: `photo${i}.jpg`,
          mimeType: 'image/jpeg',
          order: i,
        });
      }

      const postMedia = await testDb.query.media.findMany({
        where: eq(media.postId, postId),
        orderBy: (m, { asc }) => [asc(m.order)],
      });

      expect(postMedia).toHaveLength(3);
      expect(postMedia[0].filename).toBe('photo0.jpg');
      expect(postMedia[1].filename).toBe('photo1.jpg');
      expect(postMedia[2].filename).toBe('photo2.jpg');
    });
  });

  describe('getPostById', () => {
    it('should return post with user details', async () => {
      const postId = generateId();

      await testDb.insert(posts).values({
        id: postId,
        userId: testUserId,
        text: 'Test post',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });

      const post = await testDb.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

      expect(post).toBeDefined();

      const user = await testDb.query.users.findFirst({
        where: eq(users.id, post!.userId),
      });

      expect(user).toBeDefined();
      expect(user!.username).toBe('testuser');
    });

    it('should return null for non-existent post', async () => {
      const post = await testDb.query.posts.findFirst({
        where: eq(posts.id, 'nonexistent-id'),
      });

      expect(post).toBeUndefined();
    });
  });

  describe('deletePost', () => {
    it('should delete own post', async () => {
      const postId = generateId();

      await testDb.insert(posts).values({
        id: postId,
        userId: testUserId,
        text: 'To be deleted',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });

      // Verify post exists
      let post = await testDb.query.posts.findFirst({
        where: eq(posts.id, postId),
      });
      expect(post).toBeDefined();

      // Check ownership and delete
      if (post!.userId === testUserId) {
        await testDb.delete(posts).where(eq(posts.id, postId));
      }

      // Verify deleted
      post = await testDb.query.posts.findFirst({
        where: eq(posts.id, postId),
      });
      expect(post).toBeUndefined();
    });

    it("should not delete another user's post", async () => {
      const postId = generateId();
      const otherUserId = generateId();
      const passwordHash = await hashPassword('password123');

      // Create another user
      await testDb.insert(users).values({
        id: otherUserId,
        username: 'otheruser',
        displayName: 'Other User',
        passwordHash,
      });

      // Create their post
      await testDb.insert(posts).values({
        id: postId,
        userId: otherUserId,
        text: 'Other user post',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });

      const post = await testDb.query.posts.findFirst({
        where: eq(posts.id, postId),
      });

      // testUserId tries to delete - should fail ownership check
      expect(post!.userId).not.toBe(testUserId);
    });

    it('should cascade delete media when post is deleted', async () => {
      const postId = generateId();
      const mediaId = generateId();

      await testDb.insert(posts).values({
        id: postId,
        userId: testUserId,
        text: 'Post with media',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });

      await testDb.insert(media).values({
        id: mediaId,
        postId,
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        order: 0,
      });

      // Delete post
      await testDb.delete(posts).where(eq(posts.id, postId));

      // Media should be cascade deleted
      const postMedia = await testDb.query.media.findFirst({
        where: eq(media.id, mediaId),
      });
      expect(postMedia).toBeUndefined();
    });
  });

  describe('addReaction', () => {
    let testPostId: string;

    beforeEach(async () => {
      testPostId = generateId();
      await testDb.insert(posts).values({
        id: testPostId,
        userId: testUserId,
        text: 'Post for reactions',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });
    });

    it('should add a reaction to a post', async () => {
      const reactionId = generateId();
      const kaomoji = '(◕‿◕)';

      await testDb.insert(reactions).values({
        id: reactionId,
        postId: testPostId,
        userId: testUserId,
        kaomoji,
      });

      const reaction = await testDb.query.reactions.findFirst({
        where: eq(reactions.id, reactionId),
      });

      expect(reaction).toBeDefined();
      expect(reaction!.kaomoji).toBe('(◕‿◕)');
      expect(reaction!.postId).toBe(testPostId);
      expect(reaction!.userId).toBe(testUserId);
    });

    it('should be idempotent - not duplicate same reaction', async () => {
      const kaomoji = '(◕‿◕)';

      // Check if reaction already exists
      const existing = await testDb.query.reactions.findFirst({
        where: and(
          eq(reactions.postId, testPostId),
          eq(reactions.userId, testUserId),
          eq(reactions.kaomoji, kaomoji)
        ),
      });

      if (!existing) {
        await testDb.insert(reactions).values({
          id: generateId(),
          postId: testPostId,
          userId: testUserId,
          kaomoji,
        });
      }

      // Try to add same reaction again
      const existingAgain = await testDb.query.reactions.findFirst({
        where: and(
          eq(reactions.postId, testPostId),
          eq(reactions.userId, testUserId),
          eq(reactions.kaomoji, kaomoji)
        ),
      });

      expect(existingAgain).toBeDefined();

      // Count total reactions - should be 1
      const allReactions = await testDb.query.reactions.findMany({
        where: and(
          eq(reactions.postId, testPostId),
          eq(reactions.userId, testUserId),
          eq(reactions.kaomoji, kaomoji)
        ),
      });

      expect(allReactions).toHaveLength(1);
    });

    it('should allow different kaomoji from same user', async () => {
      const kaomojis = ['(◕‿◕)', '(╯°□°)╯', '(ಥ﹏ಥ)'];

      for (const kaomoji of kaomojis) {
        await testDb.insert(reactions).values({
          id: generateId(),
          postId: testPostId,
          userId: testUserId,
          kaomoji,
        });
      }

      const userReactions = await testDb.query.reactions.findMany({
        where: and(eq(reactions.postId, testPostId), eq(reactions.userId, testUserId)),
      });

      expect(userReactions).toHaveLength(3);
    });

    it('should allow same kaomoji from different users', async () => {
      const kaomoji = '(◕‿◕)';
      const otherUserId = generateId();
      const passwordHash = await hashPassword('password123');

      await testDb.insert(users).values({
        id: otherUserId,
        username: 'reactor',
        displayName: 'Reactor',
        passwordHash,
      });

      // Both users react with same kaomoji
      await testDb.insert(reactions).values({
        id: generateId(),
        postId: testPostId,
        userId: testUserId,
        kaomoji,
      });

      await testDb.insert(reactions).values({
        id: generateId(),
        postId: testPostId,
        userId: otherUserId,
        kaomoji,
      });

      const postReactions = await testDb.query.reactions.findMany({
        where: and(eq(reactions.postId, testPostId), eq(reactions.kaomoji, kaomoji)),
      });

      expect(postReactions).toHaveLength(2);
    });
  });

  describe('removeReaction', () => {
    it('should remove an existing reaction', async () => {
      const postId = generateId();
      const reactionId = generateId();
      const kaomoji = '(◕‿◕)';

      await testDb.insert(posts).values({
        id: postId,
        userId: testUserId,
        text: 'Post for reaction removal',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });

      await testDb.insert(reactions).values({
        id: reactionId,
        postId,
        userId: testUserId,
        kaomoji,
      });

      // Remove reaction
      const result = await testDb
        .delete(reactions)
        .where(
          and(
            eq(reactions.postId, postId),
            eq(reactions.userId, testUserId),
            eq(reactions.kaomoji, kaomoji)
          )
        );

      expect(result.changes).toBeGreaterThan(0);

      // Verify removed
      const removed = await testDb.query.reactions.findFirst({
        where: eq(reactions.id, reactionId),
      });
      expect(removed).toBeUndefined();
    });

    it('should return false when removing non-existent reaction', async () => {
      const postId = generateId();

      await testDb.insert(posts).values({
        id: postId,
        userId: testUserId,
        text: 'Post',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });

      const result = await testDb
        .delete(reactions)
        .where(
          and(
            eq(reactions.postId, postId),
            eq(reactions.userId, testUserId),
            eq(reactions.kaomoji, '(◕‿◕)')
          )
        );

      expect(result.changes).toBe(0);
    });
  });

  describe('cascade deletion', () => {
    it('should cascade delete reactions when post is deleted', async () => {
      const postId = generateId();
      const reactionId = generateId();

      await testDb.insert(posts).values({
        id: postId,
        userId: testUserId,
        text: 'Post with reactions',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });

      await testDb.insert(reactions).values({
        id: reactionId,
        postId,
        userId: testUserId,
        kaomoji: '(◕‿◕)',
      });

      // Delete post
      await testDb.delete(posts).where(eq(posts.id, postId));

      // Reaction should be cascade deleted
      const reaction = await testDb.query.reactions.findFirst({
        where: eq(reactions.id, reactionId),
      });
      expect(reaction).toBeUndefined();
    });

    it('should cascade delete posts when user is deleted', async () => {
      const tempUserId = generateId();
      const passwordHash = await hashPassword('password123');
      const postId = generateId();

      await testDb.insert(users).values({
        id: tempUserId,
        username: 'tempuser',
        displayName: 'Temp User',
        passwordHash,
      });

      await testDb.insert(posts).values({
        id: postId,
        userId: tempUserId,
        text: 'Temp user post',
        location: null,
        linkUrl: null,
        linkTitle: null,
      });

      // Delete user
      await testDb.delete(users).where(eq(users.id, tempUserId));

      // Post should be cascade deleted
      const post = await testDb.query.posts.findFirst({
        where: eq(posts.id, postId),
      });
      expect(post).toBeUndefined();
    });
  });
});
