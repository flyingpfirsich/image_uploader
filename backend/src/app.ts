import express from 'express';
import cors from 'cors';
import { join } from 'path';

// Routes
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import feedRoutes from './routes/feed.js';
import usersRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import musicRoutes from './routes/music.js';
import uploadsRoutes from './routes/uploads.js';

// Services
import { initializeWebPush, initializeScheduler } from './services/notification.service.js';

// Initialize notification system
initializeWebPush();
initializeScheduler();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Protected uploads routes (requires authentication)
app.use('/uploads', uploadsRoutes);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/music', musicRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// API info endpoint
app.get('/api', (_req, res) => {
  res.json({
    name: 'druzi API',
    version: '1.0.0',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/auth/me',
      'POST /api/auth/invite',
      'GET  /api/feed',
      'POST /api/posts',
      'DELETE /api/posts/:id',
      'POST /api/posts/:id/react',
      'DELETE /api/posts/:id/react',
      'GET  /api/users',
      'GET  /api/users/:id',
      'PATCH /api/users/me',
      'GET  /api/notifications/vapid-public-key',
      'POST /api/notifications/subscribe',
      'DELETE /api/notifications/subscribe',
      'GET  /api/notifications/preferences',
      'PATCH /api/notifications/preferences',
      'GET  /api/notifications/scheduled-time',
      'GET  /api/admin/stats',
      'GET  /api/admin/activity',
      'GET  /api/admin/top-posters',
      'GET  /api/admin/engagement',
      'GET  /api/admin/users',
      'DELETE /api/admin/users/:id',
      'POST /api/admin/users/:id/reset-password',
      'GET  /api/admin/invite-codes',
      'POST /api/admin/invite-codes',
      'DELETE /api/admin/invite-codes/:code',
      'POST /api/admin/test-notification',
      'POST /api/admin/test-daily-reminder',
      'POST /api/admin/test-post',
      'POST /api/admin/test-bulk-posts',
      'POST /api/admin/test-reactions',
      'POST /api/admin/test-users',
      'DELETE /api/admin/test-data',
      'GET  /api/admin/system',
      'GET  /api/music/spotify/status',
      'GET  /api/music/search',
      'GET  /api/music/recent',
      'POST /api/music',
      'GET  /api/music/:id',
      'DELETE /api/music/:id',
    ],
  });
});

// Serve frontend in production (from ./public directory)
if (process.env.NODE_ENV === 'production') {
  const frontendPath = join(process.cwd(), 'public');
  app.use(express.static(frontendPath));
  app.get('*', (_req, res) => {
    res.sendFile(join(frontendPath, 'index.html'));
  });
}

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
