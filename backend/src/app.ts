import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { config } from './config.js';

// Routes
import authRoutes from './routes/auth.js';
import postsRoutes from './routes/posts.js';
import feedRoutes from './routes/feed.js';
import usersRoutes from './routes/users.js';
import notificationsRoutes from './routes/notifications.js';

// Services
import { initializeWebPush, initializeScheduler } from './services/notification.service.js';

// Initialize notification system
initializeWebPush();
initializeScheduler();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(config.uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Root
app.get('/', (_req, res) => {
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
    ],
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = join(config.uploadsDir, '..', '..', 'frontend', 'dist');
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


