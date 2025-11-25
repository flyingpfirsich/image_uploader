import { Router, Request, Response } from 'express';
import * as postService from '../services/post.service.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/feed
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const posts = await postService.getTodaysFeed();
    res.json({ posts });
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

export default router;


