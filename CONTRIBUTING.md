# Contributing to Zotero-ArXiv Library

Thanks for your interest in contributing! This is a pure-frontend clone of Zotero 9 built with React, TypeScript, and Tailwind CSS, preloaded with ~600 real arXiv papers across five AI/ML research collections.

## Getting Started

```bash
git clone https://github.com/user/zotero-arxiv-library.git
cd zotero-arxiv-library
npm install
npm run dev
```

## Development

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State**: Zustand
- **Drag & drop**: dnd-kit
- **PDF viewer**: pdfjs-dist
- **Icons**: lucide-react

### Project Structure

```
src/
  components/     # UI components (LeftPane, MiddlePane, RightPane, PDF viewer, etc.)
  store/          # Zustand store (useStore.ts)
  types/          # TypeScript interfaces
  data/           # data.json (single source of truth for papers)
  utils/          # Utility functions (proxy, etc.)
api/              # Vercel serverless functions
scripts/          # Data fetching and maintenance scripts
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `node scripts/fetch-papers.mjs` | Fetch papers from arXiv API |
| `node scripts/strip-latex.mjs` | Strip LaTeX from titles/abstracts |

## Pull Request Process

1. Fork the repo and create a feature branch
2. Ensure TypeScript compiles: `npx tsc --noEmit`
3. Ensure the build passes: `npm run build`
4. Update documentation if you change functionality
5. Open a PR with a clear description

## Code Style

- Follow existing patterns in the codebase
- No unused imports or variables
- Use Tailwind utility classes (not inline styles)
- TypeScript strict mode
- Component files in PascalCase, utilities in camelCase

## Adding Papers

Papers live in `src/data/data.json`. To add more:

1. Use `scripts/fetch-papers.mjs` to query arXiv API
2. Run `scripts/strip-latex.mjs` to clean formatting
3. Run `scripts/fix-pdf-urls.mjs` to ensure correct URLs
4. Rebuild and verify

## Questions?

Open a discussion or issue on GitHub.
