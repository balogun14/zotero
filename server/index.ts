import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, seedIfEmpty } from './db';
import { apiRouter } from './routes/api';
import { agentRouter } from './routes/agent';
import { publicRouter } from './routes/public';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize database
initDb();
const seeded = seedIfEmpty();
if (seeded) console.log('📚 Seeded database with sample papers');

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRouter);
app.use('/api/agent', agentRouter);
app.use('/api/public', publicRouter);

// Serve static frontend if dist exists
import fs from 'fs';
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔑 AI agent endpoint: POST http://localhost:${PORT}/api/agent/findings`);
  console.log(`   Use header X-API-Key: <your AI_API_KEY>`);
});
