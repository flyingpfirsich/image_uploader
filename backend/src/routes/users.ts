import { Router, Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import * as postService from '../services/post.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = Router();

// GET /api/users - all friends
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const users = await authService.getAllUsers();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - profile with archive
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserProfile(req.params.id);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const posts = await postService.getUserPosts(req.params.id);
    
    res.json({ user, posts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH /api/users/me - update own profile
router.patch(
  '/me',
  authMiddleware,
  uploadAvatar.single('avatar'),
  async (req: Request, res: Response) => {
    try {
      const { displayName, birthday } = req.body;
      const avatarFile = req.file;
      
      const user = await userService.updateProfile(req.user!.userId, {
        displayName,
        birthday,
        avatar: avatarFile?.filename,
      });
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      res.json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

export default router;


