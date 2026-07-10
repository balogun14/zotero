import { Router } from 'express';
import { db, toApiPaper } from '../db';
import { requireApiKey } from '../middleware/auth';
import type { Request, Response } from 'express';

export const agentRouter = Router();

function generateId(prefix = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// AI agent endpoint: add a finding/paper
agentRouter.post('/findings', requireApiKey, (req: Request, res: Response) => {
  const body = req.body;

  if (!body.title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const collectionId = body.collection || body.collectionId || 'all';
  const id = body.id || generateId('finding');

  // Ensure collection exists, fallback to 'all'
  const collection = db.prepare('SELECT id FROM collections WHERE id = ?').get(collectionId) as any;
  const finalCollectionId = collection ? collection.id : 'all';

  const insert = db.prepare(`
    INSERT INTO papers (
      id, arxiv_id, title, authors, year, date, abstract, doi,
      categories, collection_id, tags, journal, url, pdf_url, source, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    insert.run(
      id,
      body.arxivId || body.arxiv_id || null,
      body.title,
      JSON.stringify(body.authors || []),
      body.year || null,
      body.date || new Date().toISOString().split('T')[0],
      body.abstract || body.summary || '',
      body.doi || null,
      JSON.stringify(body.categories || []),
      finalCollectionId,
      JSON.stringify(body.tags || []),
      body.journal || body.venue || null,
      body.url || null,
      body.pdfUrl || body.pdf_url || null,
      body.source || 'agent',
      body.notes || body.reasoning || null
    );

    const row = db.prepare('SELECT * FROM papers WHERE id = ?').get(id) as any;
    res.status(201).json({
      success: true,
      message: 'Finding saved to library',
      paper: toApiPaper(row),
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Bulk import for agents
agentRouter.post('/findings/batch', requireApiKey, (req: Request, res: Response) => {
  const items = req.body.items || req.body.papers || [];
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Expected an array of items or papers' });
    return;
  }

  const results: any[] = [];
  const errors: any[] = [];

  const insert = db.prepare(`
    INSERT INTO papers (
      id, arxiv_id, title, authors, year, date, abstract, doi,
      categories, collection_id, tags, journal, url, pdf_url, source, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const bulk = db.transaction(() => {
    for (const body of items) {
      try {
        const collectionId = body.collection || body.collectionId || 'all';
        const collection = db.prepare('SELECT id FROM collections WHERE id = ?').get(collectionId) as any;
        const finalCollectionId = collection ? collection.id : 'all';
        const id = body.id || generateId('finding');

        insert.run(
          id,
          body.arxivId || body.arxiv_id || null,
          body.title || '',
          JSON.stringify(body.authors || []),
          body.year || null,
          body.date || new Date().toISOString().split('T')[0],
          body.abstract || body.summary || '',
          body.doi || null,
          JSON.stringify(body.categories || []),
          finalCollectionId,
          JSON.stringify(body.tags || []),
          body.journal || body.venue || null,
          body.url || null,
          body.pdfUrl || body.pdf_url || null,
          body.source || 'agent',
          body.notes || body.reasoning || null
        );
        results.push(id);
      } catch (err: any) {
        errors.push({ item: body.title || body.id, error: err.message });
      }
    }
  });

  bulk();

  res.status(201).json({
    success: true,
    imported: results.length,
    failed: errors.length,
    errors: errors.slice(0, 10),
  });
});
