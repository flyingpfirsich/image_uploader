import { Router, Request, Response } from 'express';
import * as listService from '../services/list.service.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// GET /api/lists - Get all lists (for current user and friends)
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const lists = await listService.getAllLists(req.user!.userId);
    res.json({ lists });
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// GET /api/lists/user/:userId - Get lists by specific user
router.get('/user/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const lists = await listService.getListsByUser(req.params.userId, req.user!.userId);
    res.json({ lists });
  } catch (error) {
    console.error('Get user lists error:', error);
    res.status(500).json({ error: 'Failed to fetch user lists' });
  }
});

// GET /api/lists/activity - Get recent list activity for feed
router.get('/activity', authMiddleware, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const activity = await listService.getRecentListActivity(limit);
    res.json({ activity });
  } catch (error) {
    console.error('Get list activity error:', error);
    res.status(500).json({ error: 'Failed to fetch list activity' });
  }
});

// GET /api/lists/:id - Get single list with items
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const list = await listService.getListFullDetails(req.params.id, req.user!.userId);

    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    res.json(list);
  } catch (error) {
    console.error('Get list error:', error);
    res.status(500).json({ error: 'Failed to fetch list' });
  }
});

// POST /api/lists - Create new list
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, description, allowAnyoneAdd } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Title required' });
      return;
    }

    const list = await listService.createList({
      creatorId: req.user!.userId,
      title: title.trim(),
      description: description?.trim(),
      allowAnyoneAdd,
    });

    res.json(list);
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ error: 'Failed to create list' });
  }
});

// PATCH /api/lists/:id - Update list (creator only)
router.patch('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, description, allowAnyoneAdd } = req.body;

    const list = await listService.updateList(req.params.id, req.user!.userId, {
      title: title?.trim(),
      description: description?.trim(),
      allowAnyoneAdd,
    });

    if (!list) {
      res.status(403).json({ error: 'Cannot update this list' });
      return;
    }

    res.json(list);
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({ error: 'Failed to update list' });
  }
});

// DELETE /api/lists/:id - Delete list (creator only)
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const success = await listService.deleteList(req.params.id, req.user!.userId);

    if (!success) {
      res.status(403).json({ error: 'Cannot delete this list' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ error: 'Failed to delete list' });
  }
});

// POST /api/lists/:id/items - Add item to list
router.post('/:id/items', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, note, externalUrl } = req.body;

    if (!title || !title.trim()) {
      res.status(400).json({ error: 'Item title required' });
      return;
    }

    const item = await listService.addItem({
      listId: req.params.id,
      addedById: req.user!.userId,
      title: title.trim(),
      note: note?.trim(),
      externalUrl: externalUrl?.trim(),
    });

    if (!item) {
      res.status(403).json({ error: 'Cannot add items to this list' });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// PATCH /api/lists/:id/items/:itemId - Update item
router.patch('/:id/items/:itemId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { title, note, externalUrl, completed } = req.body;

    const item = await listService.updateItem(req.params.itemId, req.user!.userId, {
      title: title?.trim(),
      note: note?.trim(),
      externalUrl: externalUrl?.trim(),
      completed,
    });

    if (!item) {
      res.status(403).json({ error: 'Cannot update this item' });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// DELETE /api/lists/:id/items/:itemId - Delete item
router.delete('/:id/items/:itemId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const success = await listService.deleteItem(req.params.itemId, req.user!.userId);

    if (!success) {
      res.status(403).json({ error: 'Cannot delete this item' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
