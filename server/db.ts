import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = process.env.DATABASE_URL?.replace('file:', '') || path.join(DB_DIR, 'library.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      is_public INTEGER NOT NULL DEFAULT 0,
      share_slug TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS papers (
      id TEXT PRIMARY KEY,
      arxiv_id TEXT,
      title TEXT NOT NULL,
      authors TEXT NOT NULL DEFAULT '[]',
      year INTEGER,
      date TEXT,
      abstract TEXT NOT NULL DEFAULT '',
      doi TEXT,
      categories TEXT NOT NULL DEFAULT '[]',
      collection_id TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      journal TEXT,
      url TEXT,
      pdf_url TEXT,
      source TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_papers_collection ON papers(collection_id);
    CREATE INDEX IF NOT EXISTS idx_papers_title ON papers(title);
    CREATE INDEX IF NOT EXISTS idx_collections_share_slug ON collections(share_slug);
  `);
}

export function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM papers').get() as { c: number };
  if (count.c > 0) return false;

  try {
    const raw = fs.readFileSync(path.resolve(process.cwd(), 'src/data/data.json'), 'utf-8');
    const papers = JSON.parse(raw) as Array<Record<string, unknown>>;

    const insertCollection = db.prepare(`
      INSERT OR IGNORE INTO collections (id, name, parent_id)
      VALUES (?, ?, ?)
    `);

    const insertPaper = db.prepare(`
      INSERT INTO papers (
        id, arxiv_id, title, authors, year, date, abstract, doi,
        categories, collection_id, tags, journal, url, pdf_url, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultCollections = [
      { id: 'all', name: 'My Library', parentId: null },
      { id: 'llm-alignment', name: 'LLM Alignment', parentId: 'all' },
      { id: 'diffusion', name: 'Diffusion & Generative Models', parentId: 'all' },
      { id: 'gnn', name: 'Graph Neural Networks', parentId: 'all' },
      { id: 'multimodal', name: 'Multimodal Learning', parentId: 'all' },
      { id: 'efficient-inference', name: 'Efficient Inference & Quantization', parentId: 'all' },
    ];

    const collectionMap: Record<string, string> = {
      'LLM Alignment': 'llm-alignment',
      'Diffusion & Generative Models': 'diffusion',
      'Graph Neural Networks': 'gnn',
      'Multimodal Learning': 'multimodal',
      'Efficient Inference & Quantization': 'efficient-inference',
    };

    const seed = db.transaction(() => {
      for (const c of defaultCollections) {
        insertCollection.run(c.id, c.name, c.parentId);
      }
      for (const p of papers) {
        const collectionName = String(p.collection || '');
        const collectionId = collectionMap[collectionName] || null;
        insertPaper.run(
          String(p.id),
          p.arxivId ? String(p.arxivId) : null,
          String(p.title || ''),
          JSON.stringify(p.authors || []),
          p.year ? Number(p.year) : null,
          p.date ? String(p.date) : null,
          String(p.abstract || ''),
          p.doi ? String(p.doi) : null,
          JSON.stringify(p.categories || []),
          collectionId,
          JSON.stringify(p.tags || []),
          p.journal ? String(p.journal) : null,
          p.url ? String(p.url) : null,
          p.pdfUrl ? String(p.pdfUrl) : null,
          p.source ? String(p.source) : 'arxiv'
        );
      }
    });

    seed();
    return true;
  } catch (err) {
    console.error('Failed to seed database:', err);
    return false;
  }
}

export interface DbPaper {
  id: string;
  arxiv_id: string | null;
  title: string;
  authors: string;
  year: number | null;
  date: string | null;
  abstract: string;
  doi: string | null;
  categories: string;
  collection_id: string | null;
  tags: string;
  journal: string | null;
  url: string | null;
  pdf_url: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCollection {
  id: string;
  name: string;
  parent_id: string | null;
  is_public: number;
  share_slug: string | null;
  created_at: string;
  updated_at: string;
}

export function toApiPaper(row: DbPaper) {
  return {
    id: row.id,
    arxivId: row.arxiv_id || '',
    title: row.title,
    authors: safeJsonParse<string[]>(row.authors, []),
    year: row.year || 0,
    date: row.date || '',
    abstract: row.abstract,
    doi: row.doi || '',
    categories: safeJsonParse<string[]>(row.categories, []),
    collection: row.collection_id || 'all',
    tags: safeJsonParse<string[]>(row.tags, []),
    journal: row.journal || '',
    url: row.url || '',
    pdfUrl: row.pdf_url || '',
    source: row.source || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toApiCollection(row: DbCollection) {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    isPublic: Boolean(row.is_public),
    shareSlug: row.share_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
