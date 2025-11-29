import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  avatar: text('avatar'), // filename in uploads/avatars
  passwordHash: text('password_hash').notNull(),
  birthday: text('birthday'), // YYYY-MM-DD format
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Invite codes table
export const inviteCodes = sqliteTable('invite_codes', {
  code: text('code').primaryKey(),
  createdBy: text('created_by').references(() => users.id),
  usedBy: text('used_by').references(() => users.id),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Posts table
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  text: text('text'),
  location: text('location'),
  linkUrl: text('link_url'),
  linkTitle: text('link_title'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Media table (photos/videos attached to posts)
export const media = sqliteTable('media', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  durationMs: integer('duration_ms'), // for videos
  order: integer('order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Reactions table (kaomoji reactions)
export const reactions = sqliteTable('reactions', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kaomoji: text('kaomoji').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Push subscriptions table
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Notification preferences table
export const notificationPreferences = sqliteTable('notification_preferences', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  dailyReminder: integer('daily_reminder', { mode: 'boolean' }).notNull().default(true),
  friendPosts: integer('friend_posts', { mode: 'boolean' }).notNull().default(true),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Daily notification time (global, one row)
export const dailyNotificationTime = sqliteTable('daily_notification_time', {
  id: integer('id').primaryKey().default(1),
  scheduledTime: integer('scheduled_time', { mode: 'timestamp' }).notNull(),
  generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Music shares table
export const musicShares = sqliteTable('music_shares', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: text('post_id').references(() => posts.id, { onDelete: 'cascade' }),
  spotifyTrackId: text('spotify_track_id'),
  trackName: text('track_name').notNull(),
  artistName: text('artist_name').notNull(),
  albumName: text('album_name'),
  albumArtUrl: text('album_art_url'),
  previewUrl: text('preview_url'),
  externalUrl: text('external_url'),
  moodKaomoji: text('mood_kaomoji'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// TypeScript types derived from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
export type Reaction = typeof reactions.$inferSelect;
export type NewReaction = typeof reactions.$inferInsert;
export type InviteCode = typeof inviteCodes.$inferSelect;
export type NewInviteCode = typeof inviteCodes.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;
export type DailyNotificationTime = typeof dailyNotificationTime.$inferSelect;
export type MusicShare = typeof musicShares.$inferSelect;
export type NewMusicShare = typeof musicShares.$inferInsert;


