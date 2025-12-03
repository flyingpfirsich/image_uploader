import { config as loadEnv } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load .env from the backend root directory
loadEnv({ path: join(rootDir, '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'druzi-secret-change-in-production',
  jwtExpiresIn: '30d',

  // Database
  dbPath: process.env.DB_PATH || join(rootDir, 'data', 'druzi.db'),

  // File storage
  uploadsDir: process.env.UPLOADS_DIR || join(rootDir, 'uploads'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxVideoLength: 10_000, // 10 seconds in ms (optimized for ~5s avg)

  // App settings
  inviteCodeLength: 8,
  inviteCodeExpiresDays: 7,

  // Initial admin invite code (for first user)
  initialInviteCode: process.env.INITIAL_INVITE_CODE || 'DRUZI2025',

  // Web Push (VAPID keys)
  // Generate with: npx web-push generate-vapid-keys
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY || '',
  vapidSubject: process.env.VAPID_SUBJECT || 'mailto:druzi@example.com',

  // Admin credentials
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'DRUZI2025',
  
  // Spotify API (for music moments)
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
};
