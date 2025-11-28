import { Router, Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password, displayName, inviteCode, birthday } = req.body;
    
    if (!username || !password || !displayName || !inviteCode) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    if (username.length < 3 || username.length > 20) {
      res.status(400).json({ error: 'Username must be 3-20 characters' });
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
      return;
    }
    
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }
    
    const result = await authService.register({
      username,
      password,
      displayName,
      inviteCode,
      birthday,
    });
    
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password required' });
      return;
    }
    
    const result = await authService.login({ username, password });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await authService.getUserById(req.user!.userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({ user });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/auth/invite
router.post('/invite', authMiddleware, async (req: Request, res: Response) => {
  try {
    const code = await authService.createInviteCode(req.user!.userId);
    res.json({ code });
  } catch (_error) {
    res.status(500).json({ error: 'Failed to create invite code' });
  }
});

export default router;






