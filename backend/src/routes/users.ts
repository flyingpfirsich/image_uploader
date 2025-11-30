import { Router, Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import * as postService from '../services/post.service.js';
import { authMiddleware } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';
import { uploadAvatar } from '../middleware/upload.js';

const router = Router();

// GET /api/users - all friends
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const allUsers = await authService.getAllUsers();
    res.json({ users: allUsers });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - profile with posts
// Own profile or admin: see all archived posts
// Friend's profile: only see today's posts
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserProfile(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isOwnProfile = req.user!.userId === req.params.id;
    const isAdminUser = isAdmin(req.user!.username);

    // Show all posts for own profile or admin, otherwise only today's posts
    const posts =
      isOwnProfile || isAdminUser
        ? await postService.getUserPosts(req.params.id)
        : await postService.getUserTodaysPosts(req.params.id);

    res.json({ user, posts });
  } catch (_error) {
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
    } catch (_error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

export default router;
