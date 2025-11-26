import { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

/**
 * Middleware to check if the authenticated user is an admin.
 * Must be used after authMiddleware.
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  if (req.user.username !== config.adminUsername) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  
  next();
}

/**
 * Check if a username is the admin username
 */
export function isAdmin(username: string): boolean {
  return username === config.adminUsername;
}





