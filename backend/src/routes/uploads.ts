import { Router, Request, Response } from 'express';
import { join, extname } from 'path';
import { existsSync, createReadStream, statSync } from 'fs';
import { verifyToken } from '../utils/jwt.js';
import { config } from '../config.js';

const router = Router();

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

// Validate token from query parameter or Authorization header
function validateAuth(req: Request): boolean {
  // Check query parameter first (for direct URL access)
  const queryToken = req.query.token as string;
  if (queryToken) {
    const payload = verifyToken(queryToken);
    return !!payload;
  }

  // Fallback to Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    return !!payload;
  }

  return false;
}

// Serve a file with proper headers
function serveFile(filePath: string, res: Response): void {
  const ext = extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const stat = statSync(filePath);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour, but private (not shared caches)

    createReadStream(filePath).pipe(res);
  } catch {
    res.status(500).json({ error: 'Error reading file' });
  }
}

// Protected media files route
router.get('/media/:filename', (req: Request, res: Response) => {
  if (!validateAuth(req)) {
    res.status(401).json({ error: 'Unauthorized - valid token required' });
    return;
  }

  const { filename } = req.params;

  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  const filePath = join(config.uploadsDir, 'media', filename);

  if (!existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  serveFile(filePath, res);
});

// Protected avatar files route
router.get('/avatars/:filename', (req: Request, res: Response) => {
  if (!validateAuth(req)) {
    res.status(401).json({ error: 'Unauthorized - valid token required' });
    return;
  }

  const { filename } = req.params;

  // Security: prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }

  const filePath = join(config.uploadsDir, 'avatars', filename);

  if (!existsSync(filePath)) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  serveFile(filePath, res);
});

export default router;
