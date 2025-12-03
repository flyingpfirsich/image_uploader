import { Router, Request, Response } from 'express';
import * as postService from '../services/post.service.js';
import * as listService from '../services/list.service.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/feed
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const posts = await postService.getTodaysFeed();
    const listActivity = await listService.getRecentListActivity(20);

    // Filter list activity to today only
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysListActivity = listActivity.filter((activity) => activity.createdAt >= today);

    res.json({ posts, listActivity: todaysListActivity });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

export default router;
