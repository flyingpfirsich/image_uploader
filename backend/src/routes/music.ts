import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import * as spotifyService from '../services/spotify.service.js';
import * as musicService from '../services/music.service.js';

const router = Router();

// GET /api/music/spotify/status
// Check if Spotify is configured
router.get('/spotify/status', (_req: Request, res: Response) => {
  res.json({ configured: spotifyService.isSpotifyConfigured() });
});

// GET /api/music/search?q={query}
// Search for tracks on Spotify
router.get('/search', authMiddleware, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }

    if (!spotifyService.isSpotifyConfigured()) {
      res.status(503).json({ error: 'Spotify is not configured' });
      return;
    }

    const tracks = await spotifyService.searchTracks(query, limit);
    res.json({ tracks });
  } catch (error) {
    console.error('Music search error:', error);
    res.status(500).json({ error: 'Failed to search for music' });
  }
});

// GET /api/music/recent
// Get recent music shares from all users
router.get('/recent', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const shares = await musicService.getRecentMusicShares(20);
    res.json({ shares });
  } catch (error) {
    console.error('Get recent music error:', error);
    res.status(500).json({ error: 'Failed to get recent music' });
  }
});

// POST /api/music
// Create a new music share
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      postId,
      spotifyTrackId,
      trackName,
      artistName,
      albumName,
      albumArtUrl,
      previewUrl,
      externalUrl,
      moodKaomoji,
    } = req.body;

    if (!trackName || !artistName) {
      res.status(400).json({ error: 'Track name and artist name are required' });
      return;
    }

    const share = await musicService.createMusicShare({
      userId: req.user!.userId,
      postId,
      spotifyTrackId,
      trackName,
      artistName,
      albumName,
      albumArtUrl,
      previewUrl,
      externalUrl,
      moodKaomoji,
    });

    res.json(share);
  } catch (error) {
    console.error('Create music share error:', error);
    res.status(500).json({ error: 'Failed to create music share' });
  }
});

// GET /api/music/:id
// Get a specific music share
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const share = await musicService.getMusicShareById(req.params.id);

    if (!share) {
      res.status(404).json({ error: 'Music share not found' });
      return;
    }

    res.json(share);
  } catch (error) {
    console.error('Get music share error:', error);
    res.status(500).json({ error: 'Failed to get music share' });
  }
});

// DELETE /api/music/:id
// Delete own music share
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const success = await musicService.deleteMusicShare(req.params.id, req.user!.userId);

    if (!success) {
      res.status(403).json({ error: 'Cannot delete this music share' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete music share error:', error);
    res.status(500).json({ error: 'Failed to delete music share' });
  }
});

export default router;

