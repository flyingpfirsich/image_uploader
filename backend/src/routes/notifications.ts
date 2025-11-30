import { Router, Request, Response } from 'express';
import * as notificationService from '../services/notification.service.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications/vapid-public-key
router.get('/vapid-public-key', (_req: Request, res: Response) => {
  const key = notificationService.getVapidPublicKey();
  res.json({ key });
});

// POST /api/notifications/subscribe
router.post('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      res.status(400).json({ error: 'Invalid subscription object' });
      return;
    }

    await notificationService.subscribeToPush(req.user!.userId, subscription);
    res.json({ success: true });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// DELETE /api/notifications/subscribe
router.delete('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  try {
    await notificationService.unsubscribeFromPush(req.user!.userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// GET /api/notifications/preferences
router.get('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const prefs = await notificationService.getPreferences(req.user!.userId);
    res.json(prefs);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// PATCH /api/notifications/preferences
router.patch('/preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { dailyReminder, friendPosts } = req.body;

    await notificationService.updatePreferences(req.user!.userId, {
      dailyReminder,
      friendPosts,
    });

    const prefs = await notificationService.getPreferences(req.user!.userId);
    res.json(prefs);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// GET /api/notifications/scheduled-time
router.get('/scheduled-time', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const time = await notificationService.getTodayNotificationTime();
    res.json({ scheduledTime: time?.toISOString() || null });
  } catch (error) {
    console.error('Get scheduled time error:', error);
    res.status(500).json({ error: 'Failed to get scheduled time' });
  }
});

export default router;
