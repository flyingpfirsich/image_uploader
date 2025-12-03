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
    console.log('[DB] Running migrations from:', migrationsFolder);
    migrate(db, { migrationsFolder });
    console.log('[DB] Migrations complete');
  } catch (err) {
    const error = err as Error;
    // Only skip for "table already exists" errors
    if (error.message?.includes('already exists')) {
      console.log('[DB] Migration skipped (tables already exist)');
    } else {
      // Log the actual error for debugging
      console.error('[DB] Migration failed:', error.message);
      console.error('[DB] Full error:', error);
      throw err; // Re-throw to fail fast on real errors
    }
  }
} else {
  console.log('[DB] No migrations folder found at:', migrationsFolder);
}

// Re-export schema for convenience
export * from './schema.js';
