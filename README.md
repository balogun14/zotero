# Zotero Clone — Online Research Library

A production-ready online research library built from a Zotero-style frontend. Store papers, let AI agents dump findings via API, and share collections publicly.

## Features

- **3-pane resizable layout** — Collections, paper list, detail pane
- **In-app PDF reader** — pdfjs-dist with page navigation and zoom
- **Real backend + SQLite database** — Persistent storage, not just local files
- **AI agent endpoint** — `POST /api/agent/findings` with API key authentication
- **Public sharing** — Make any collection public and share a link
- **Search & tag filtering** — Full-text search across title, authors, abstract
- **Docker support** — One-command deployment with Docker Compose

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind CSS v4 |
| Routing | react-router-dom |
| State | Zustand |
| Backend | Express 5 + TypeScript |
| Database | SQLite (better-sqlite3) |
| PDF Viewer | pdfjs-dist v6 |
| Icons | lucide-react |

## Quick Start

### Local development

```bash
npm install

# Terminal 1: start backend
npm run server:dev

# Terminal 2: start frontend
npm run dev
```

Open http://localhost:5173. The frontend proxies `/api` requests to the backend at http://localhost:3000.

### Production build

```bash
npm install
npm start
```

This builds the frontend and starts the Express server on port 3000.

## Configuration

Copy `.env.example` to `.env` and set your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | `development` or `production` |
| `AI_API_KEY` | Secret key for AI agents to add findings |
| `DATABASE_URL` | SQLite file path (default: `./data/library.db`) |
| `CORS_ORIGIN` | Allowed frontend origin in production |

## AI Agent Integration

Any AI agent or script can save findings to your library using the API:

```bash
curl -X POST http://localhost:3000/api/agent/findings \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-very-secret-api-key" \
  -d '{
    "title": "A paper the agent found",
    "authors": ["AI Agent"],
    "abstract": "Summary of the finding",
    "url": "https://example.com/paper",
    "pdfUrl": "https://example.com/paper.pdf",
    "tags": ["ai", "research"],
    "collection": "llm-alignment",
    "year": 2026
  }'
```

Bulk import:

```bash
curl -X POST http://localhost:3000/api/agent/findings/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-very-secret-api-key" \
  -d '{"items": [{...}, {...}]}'
```

## Public Sharing

1. Hover over a collection in the left sidebar.
2. Click the share icon.
3. The public link is copied to your clipboard.

Shared collections are accessible at `/share/:slug` and via the API at `/api/public/share/:slug`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/papers` | List papers (filter by `collection`, `q`, `tag`) |
| POST | `/api/papers` | Add a paper |
| PATCH | `/api/papers/:id` | Update a paper |
| DELETE | `/api/papers/:id` | Delete a paper |
| GET | `/api/collections` | List collections |
| POST | `/api/collections` | Create collection |
| PATCH | `/api/collections/:id` | Update collection (share settings) |
| DELETE | `/api/collections/:id` | Delete collection |
| GET | `/api/tags` | List all tags with counts |
| POST | `/api/agent/findings` | AI agent adds a finding |
| POST | `/api/agent/findings/batch` | AI agent bulk import |
| GET | `/api/public/share/:slug` | Public shared collection |

## Deployment

### Docker Compose (recommended)

```bash
# Set a strong API key
export AI_API_KEY=$(openssl rand -hex 32)

# Build and run
docker-compose up --build -d
```

Your library is now running on http://localhost:3000.

### Manual server deployment

```bash
npm install
npm run build
NODE_ENV=production AI_API_KEY=your-key npm run server
```

### Cloud platforms

The app is a standard Node.js server. Deploy the repository to:
- **Railway**, **Render**, or **Fly.io** — use the `npm start` command
- **Vercel** — the frontend builds as before, but you will need a separate persistent backend host for the database

> Note: SQLite writes to the local filesystem. On serverless platforms like Vercel, use a hosted PostgreSQL database instead.

## Data Persistence

The SQLite database is stored at `./data/library.db` by default. Back up this file to preserve your library.

## License

MIT — see [LICENSE](LICENSE).
