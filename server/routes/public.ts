import { Router } from 'express';
import { db, toApiPaper, toApiCollection } from '../db';
import type { Request, Response } from 'express';

export const publicRouter = Router();

// Public shared library endpoint
publicRouter.get('/share/:slug', (req: Request, res: Response) => {
  const collection = db.prepare('SELECT * FROM collections WHERE share_slug = ? AND is_public = 1').get(req.params.slug) as any;
  if (!collection) {
    res.status(404).json({ error: 'Shared library not found or not public' });
    return;
  }

  const papers = db.prepare('SELECT * FROM papers WHERE collection_id = ? ORDER BY created_at DESC').all(collection.id) as any[];

  res.json({
    collection: toApiCollection(collection),
    papers: papers.map(toApiPaper),
  });
});

// Public collection metadata (for HTML/meta tags if needed)
publicRouter.get('/share/:slug/meta', (req: Request, res: Response) => {
  const collection = db.prepare('SELECT * FROM collections WHERE share_slug = ? AND is_public = 1').get(req.params.slug) as any;
  if (!collection) {
    res.status(404).json({ error: 'Shared library not found' });
    return;
  }
  const count = db.prepare('SELECT COUNT(*) as c FROM papers WHERE collection_id = ?').get(collection.id) as { c: number };
  res.json({
    collection: toApiCollection(collection),
    paperCount: count.c,
  });
});
