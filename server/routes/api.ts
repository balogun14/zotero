import { Router } from 'express';
import { db, toApiPaper, toApiCollection } from '../db';
import type { Request, Response } from 'express';

export const apiRouter = Router();

function generateId(prefix = 'item'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Get all papers with optional filtering
apiRouter.get('/papers', (req: Request, res: Response) => {
  const { collection, q, tag } = req.query;
  let sql = 'SELECT * FROM papers WHERE 1=1';
  const params: (string | number)[] = [];

  if (collection && collection !== 'all') {
    sql += ' AND collection_id = ?';
    params.push(String(collection));
  }

  if (tag) {
    sql += " AND tags LIKE ?";
    params.push(`%"${String(tag)}"%`);
  }

  if (q) {
    const query = `%${String(q)}%`;
    sql += ' AND (title LIKE ? OR abstract LIKE ? OR authors LIKE ?)';
    params.push(query, query, query);
  }

  sql += ' ORDER BY created_at DESC';

  const rows = db.prepare(sql).all(...params) as any[];
  res.json({ papers: rows.map(toApiPaper) });
});

// Get single paper
apiRouter.get('/papers/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM papers WHERE id = ?').get(req.params.id) as any;
  if (!row) {
    res.status(404).json({ error: 'Paper not found' });
    return;
  }
  res.json({ paper: toApiPaper(row) });
});

// Create paper
apiRouter.post('/papers', (req: Request, res: Response) => {
  const body = req.body;
  const id = body.id || generateId('paper');
  const collectionId = body.collection || body.collectionId || null;

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
      body.title || '',
      JSON.stringify(body.authors || []),
      body.year || null,
      body.date || null,
      body.abstract || '',
      body.doi || null,
      JSON.stringify(body.categories || []),
      collectionId,
      JSON.stringify(body.tags || []),
      body.journal || null,
      body.url || null,
      body.pdfUrl || body.pdf_url || null,
      body.source || 'manual',
      body.notes || null
    );
    const row = db.prepare('SELECT * FROM papers WHERE id = ?').get(id) as any;
    res.status(201).json({ paper: toApiPaper(row) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update paper
apiRouter.patch('/papers/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM papers WHERE id = ?').get(req.params.id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Paper not found' });
    return;
  }

  const body = req.body;
  const fields: string[] = [];
  const values: unknown[] = [];

  if ('title' in body) { fields.push('title = ?'); values.push(body.title); }
  if ('authors' in body) { fields.push('authors = ?'); values.push(JSON.stringify(body.authors)); }
  if ('year' in body) { fields.push('year = ?'); values.push(body.year); }
  if ('date' in body) { fields.push('date = ?'); values.push(body.date); }
  if ('abstract' in body) { fields.push('abstract = ?'); values.push(body.abstract); }
  if ('doi' in body) { fields.push('doi = ?'); values.push(body.doi); }
  if ('categories' in body) { fields.push('categories = ?'); values.push(JSON.stringify(body.categories)); }
  if ('collection' in body || 'collectionId' in body) { fields.push('collection_id = ?'); values.push(body.collection || body.collectionId); }
  if ('tags' in body) { fields.push('tags = ?'); values.push(JSON.stringify(body.tags)); }
  if ('journal' in body) { fields.push('journal = ?'); values.push(body.journal); }
  if ('url' in body) { fields.push('url = ?'); values.push(body.url); }
  if ('pdfUrl' in body || 'pdf_url' in body) { fields.push('pdf_url = ?'); values.push(body.pdfUrl || body.pdf_url); }
  if ('notes' in body) { fields.push('notes = ?'); values.push(body.notes); }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(req.params.id);

  db.prepare(`UPDATE papers SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const row = db.prepare('SELECT * FROM papers WHERE id = ?').get(req.params.id) as any;
  res.json({ paper: toApiPaper(row) });
});

// Delete paper
apiRouter.delete('/papers/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM papers WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Paper not found' });
    return;
  }
  res.status(204).end();
});

// Get all collections
apiRouter.get('/collections', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM collections ORDER BY name').all() as any[];
  res.json({ collections: rows.map(toApiCollection) });
});

// Create collection
apiRouter.post('/collections', (req: Request, res: Response) => {
  const body = req.body;
  const id = body.id || generateId('collection');
  const name = body.name || 'New Collection';
  const parentId = body.parentId || body.parent_id || null;

  try {
    db.prepare('INSERT INTO collections (id, name, parent_id) VALUES (?, ?, ?)').run(id, name, parentId);
    const row = db.prepare('SELECT * FROM collections WHERE id = ?').get(id) as any;
    res.status(201).json({ collection: toApiCollection(row) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Update collection (e.g., public sharing)
apiRouter.patch('/collections/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id) as any;
  if (!existing) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }

  const body = req.body;
  const fields: string[] = [];
  const values: unknown[] = [];

  if ('name' in body) { fields.push('name = ?'); values.push(body.name); }
  if ('parentId' in body || 'parent_id' in body) { fields.push('parent_id = ?'); values.push(body.parentId ?? body.parent_id); }
  if ('isPublic' in body || 'is_public' in body) { fields.push('is_public = ?'); values.push(body.isPublic || body.is_public ? 1 : 0); }
  if ('shareSlug' in body || 'share_slug' in body) { fields.push('share_slug = ?'); values.push(body.shareSlug || body.share_slug); }

  if (fields.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(req.params.id);

  try {
    db.prepare(`UPDATE collections SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    const row = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id) as any;
    res.json({ collection: toApiCollection(row) });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Delete collection
apiRouter.delete('/collections/:id', (req: Request, res: Response) => {
  const result = db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Collection not found' });
    return;
  }
  res.status(204).end();
});

// Search tags
apiRouter.get('/tags', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT tags FROM papers').all() as any[];
  const counts = new Map<string, number>();
  for (const row of rows) {
    const tags = safeJsonParse<string[]>(row.tags, []);
    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  const tags = Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
  res.json({ tags });
});

function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
