/**
 * Test setup for backend unit tests
 * Creates an in-memory SQLite database for isolated testing
 */

import { beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema.js';

// Create in-memory database for tests
let testSqlite: Database.Database;
let testDb: ReturnType<typeof drizzle>;

export function getTestDb() {
  return testDb;
}

export function getTestSqlite() {
  return testSqlite;
}

// Setup fresh database before each test
beforeEach(() => {
  // Create new in-memory database
  testSqlite = new Database(':memory:');
  testSqlite.pragma('foreign_keys = ON');

  // Create schema
  testSqlite.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      avatar TEXT,
      password_hash TEXT NOT NULL,
      birthday TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE invite_codes (
      code TEXT PRIMARY KEY,
      created_by TEXT REFERENCES users(id),
      used_by TEXT REFERENCES users(id),
      used_at INTEGER,
      expires_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      text TEXT,
      location TEXT,
      link_url TEXT,
      link_title TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE media (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      duration_ms INTEGER,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE reactions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kaomoji TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE notification_preferences (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      daily_reminder INTEGER NOT NULL DEFAULT 1,
      friend_posts INTEGER NOT NULL DEFAULT 1,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE daily_notification_time (
      id INTEGER PRIMARY KEY DEFAULT 1,
      scheduled_time INTEGER NOT NULL,
      generated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE music_shares (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
      spotify_track_id TEXT,
      track_name TEXT NOT NULL,
      artist_name TEXT NOT NULL,
      album_name TEXT,
      album_art_url TEXT,
      preview_url TEXT,
      external_url TEXT,
      mood_kaomoji TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  // Create drizzle instance
  testDb = drizzle(testSqlite, { schema });
});

// Cleanup after each test
afterEach(() => {
  if (testSqlite) {
    testSqlite.close();
  }
  vi.clearAllMocks();
});

// Mock config for tests
vi.mock('../config.js', () => ({
  config: {
    port: 3000,
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h',
    dbPath: ':memory:',
    uploadsDir: '/tmp/test-uploads',
    maxFileSize: 10 * 1024 * 1024,
    maxVideoLength: 10_000,
    inviteCodeLength: 8,
    inviteCodeExpiresDays: 7,
    initialInviteCode: 'TEST-CODE',
    vapidPublicKey: 'test-vapid-public',
    vapidPrivateKey: 'test-vapid-private',
    vapidSubject: 'mailto:test@test.com',
    adminUsername: 'admin',
    spotifyClientId: '',
    spotifyClientSecret: '',
  },
}));
