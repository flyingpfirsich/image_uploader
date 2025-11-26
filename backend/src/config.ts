import { config as loadEnv } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'druzi-secret-change-in-production',
  jwtExpiresIn: '30d',
  
  // Database
  dbPath: process.env.DB_PATH || join(rootDir, 'data', 'druzi.db'),
  
  // File storage
  uploadsDir: process.env.UPLOADS_DIR || join(rootDir, 'uploads'),
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxVideoLength: 10_000, // 10 seconds in ms
  
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
};


