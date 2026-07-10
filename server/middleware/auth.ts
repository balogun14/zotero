import type { Request, Response, NextFunction } from 'express';

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validKey = process.env.AI_API_KEY;

  if (!validKey) {
    res.status(500).json({ error: 'Server misconfiguration: AI_API_KEY not set' });
    return;
  }

  if (!apiKey || apiKey !== validKey) {
    res.status(401).json({ error: 'Unauthorized. Provide a valid X-API-Key header.' });
    return;
  }

  next();
}

export function optionalApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  (req as any).isAgent = Boolean(apiKey && apiKey === process.env.AI_API_KEY);
  next();
}
