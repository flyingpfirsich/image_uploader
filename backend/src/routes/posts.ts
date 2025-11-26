import { Router, Request, Response } from 'express';
import * as postService from '../services/post.service.js';
import * as notificationService from '../services/notification.service.js';
import * as authService from '../services/auth.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadMedia } from '../middleware/upload.js';

const router = Router();

// POST /api/posts
router.post(
  '/',
  authMiddleware,
  uploadMedia.array('media', 10),
  async (req: Request, res: Response) => {
    try {
      const { text, location, linkUrl, linkTitle } = req.body;
      const files = req.files as Express.Multer.File[];
      
      // Must have text or media
      if (!text && (!files || files.length === 0)) {
        res.status(400).json({ error: 'Post must have text or media' });
        return;
      }
      
      const mediaInputs = (files || []).map((file, index) => ({
        filename: file.filename,
        mimeType: file.mimetype,
        order: index,
      }));
      
      const post = await postService.createPost(
        {
          userId: req.user!.userId,
          text,
          location,
          linkUrl,
          linkTitle,
        },
        mediaInputs
      );
      
      // Send notification to friends (async, don't wait)
      authService.getUserById(req.user!.userId).then((user) => {
        if (user) {
          notificationService.notifyFriendPosted(req.user!.userId, user.displayName);
        }
      }).catch((err) => {
        console.error('Failed to send friend notification:', err);
      });
      
      res.json(post);
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }
);

// GET /api/posts/:id
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const post = await postService.getPostById(req.params.id);
    
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const success = await postService.deletePost(req.params.id, req.user!.userId);
    
    if (!success) {
      res.status(403).json({ error: 'Cannot delete this post' });
      return;
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// POST /api/posts/:id/react
router.post('/:id/react', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { kaomoji } = req.body;
    
    if (!kaomoji) {
      res.status(400).json({ error: 'Kaomoji required' });
      return;
    }
    
    const reaction = await postService.addReaction(
      req.params.id,
      req.user!.userId,
      kaomoji
    );
    
    res.json(reaction);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// DELETE /api/posts/:id/react
router.delete('/:id/react', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { kaomoji } = req.body;
    
    if (!kaomoji) {
      res.status(400).json({ error: 'Kaomoji required' });
      return;
    }
    
    await postService.removeReaction(req.params.id, req.user!.userId, kaomoji);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

export default router;


