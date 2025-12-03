import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq } from 'drizzle-orm';
import * as schema from './schema.js';
import { config } from '../config.js';

// Ensure data directory exists
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
mkdirSync(dirname(config.dbPath), { recursive: true });

const sqlite = new Database(config.dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Run migrations on startup
const migrationsFolder = join(dirname(new URL(import.meta.url).pathname), '..', '..', 'drizzle');
if (existsSync(migrationsFolder)) {
  console.log('[DB] Running migrations...');
  migrate(db, { migrationsFolder });
  console.log('[DB] Migrations complete');
} else {
  console.log('[DB] No migrations folder found at:', migrationsFolder);
}

// Initialize admin user if not exists
async function initializeAdmin() {
  const existingAdmin = await db.query.users.findFirst({
    where: eq(schema.users.username, config.adminUsername),
  });

  if (!existingAdmin) {
    console.log('[DB] Creating admin user...');
    const adminId = nanoid();
    const passwordHash = await bcrypt.hash(config.adminPassword, 12);
    
    await db.insert(schema.users).values({
      id: adminId,
      username: config.adminUsername,
      displayName: 'Admin',
      passwordHash,
      birthday: null,
    });
    console.log(`[DB] Admin user created with username: ${config.adminUsername}`);
  } else {
    console.log('[DB] Admin user already exists');
  }
}

// Run admin initialization
initializeAdmin().catch(err => {
  console.error('[DB] Failed to initialize admin:', err);
});

// Re-export schema for convenience
export * from './schema.js';
