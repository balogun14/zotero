# Zotero-ArXiv Library

> A pixel-perfect, pure-frontend clone of Zotero 9 with ~600 real arXiv papers across five AI/ML research collections. Built with React, TypeScript, Tailwind CSS, and pdfjs-dist.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![React](https://img.shields.io/badge/React-19-61dafb)
![Vite](https://img.shields.io/badge/Vite-8-646cff)

## Features

- **3-pane resizable layout** — Left collection tree + tag filter, middle sortable item list with expandable rows, right detail pane
- **~600 real arXiv papers** — All titles, authors, DOIs, and abstracts sourced from the arXiv API
- **5 AI/ML collections**: LLM Alignment, Diffusion & Generative Models, Graph Neural Networks, Multimodal Learning, Efficient Inference & Quantization
- **In-app PDF reader** — pdfjs-dist integration with page navigation, zoom controls, and fullscreen mode
- **Drag-and-drop reordering** — Powered by dnd-kit
- **Tag filtering** — Sidebar tag cloud + per-paper tag management
- **Related papers** — Finds papers sharing tags or collections
- **Real-time search** — Filters across title, author, abstract, and arXiv ID
- **Deployable to Vercel** — Serverless PDF proxy included

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Drag & Drop | @dnd-kit/core |
| PDF Viewer | pdfjs-dist v6 |
| Icons | lucide-react |

## Project Structure

```
zotero-clone/
├── api/                    # Vercel serverless functions
│   └── arxiv-pdf.ts        # arXiv PDF proxy (bypasses CORS)
├── src/
│   ├── components/         # React components
│   │   ├── LeftPane.tsx    # Collection tree wrapper
│   │   ├── CollectionTree.tsx
│   │   ├── TagFilter.tsx
│   │   ├── MiddlePane.tsx  # Sortable item list
│   │   ├── SortableItem.tsx
│   │   ├── RightPane.tsx   # Detail pane with tabs
│   │   ├── InfoTab.tsx
│   │   ├── AbstractTab.tsx
│   │   ├── TagsTab.tsx
│   │   ├── RelatedTab.tsx
│   │   ├── PdfPane.tsx     # In-pane PDF reader
│   │   └── Toolbar.tsx
│   ├── store/
│   │   └── useStore.ts     # Zustand store (single source of truth)
│   ├── data/
│   │   └── data.json       # 592 real arXiv papers
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── proxy.ts        # PDF URL proxy resolver
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── scripts/                # Data maintenance scripts
│   ├── fetch-papers.mjs    # arXiv API fetcher
│   ├── strip-latex.mjs     # LaTeX cleaner
│   └── fix-pdf-urls.mjs    # URL normalizer
├── vercel.json             # Vercel deployment config
└── vite.config.ts
```

## Data

All paper metadata lives in `src/data/data.json` as the single source of truth. Each entry:

```json
{
  "id": "llm-alignment-1",
  "arxivId": "2302.12345",
  "title": "Training Language Models to Follow Instructions",
  "authors": ["John Doe", "Jane Smith"],
  "year": 2023,
  "abstract": "...",
  "doi": "10.48550/arXiv.2302.12345",
  "collection": "LLM Alignment",
  "tags": ["LLM", "Alignment", "RLHF"],
  "url": "https://arxiv.org/abs/2302.12345",
  "pdfUrl": "https://arxiv.org/pdf/2302.12345"
}
```

To refresh or add papers, use the scripts in `scripts/`.

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

The `api/arxiv-pdf.ts` function is automatically deployed as a serverless function. Vercel's build process sets `VERCEL=1`, which tells the bundle to route PDF requests through the proxy.

### Static hosting

```bash
npm run build
# Deploy dist/ to any static host (Netlify, Cloudflare Pages, S3, etc.)
```

PDFs will use `corsproxy.io` as a fallback. For production use, deploy your own proxy.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and pull request guidelines.

## License

MIT — see [LICENSE](LICENSE).
