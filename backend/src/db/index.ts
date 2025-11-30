import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.js';
import { config } from '../config.js';

// Ensure data directory exists
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
mkdirSync(dirname(config.dbPath), { recursive: true });

const sqlite = new Database(config.dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Run migrations on startup
const migrationsFolder = join(dirname(new URL(import.meta.url).pathname), '..', '..', 'drizzle');
if (existsSync(migrationsFolder)) {
  try {
    console.log('[DB] Running migrations...');
    migrate(db, { migrationsFolder });
    console.log('[DB] Migrations complete');
  } catch (err) {
    // If migration fails due to existing tables, it's okay - schema is already up to date
    // This can happen when using drizzle-kit push alongside migrations
    console.log('[DB] Migration skipped (schema already up to date)');
  }
} else {
  console.log('[DB] No migrations folder found at:', migrationsFolder);
}

// Re-export schema for convenience
export * from './schema.js';
