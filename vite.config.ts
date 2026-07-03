import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

const isVercel = process.env.VERCEL === '1'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_VERCEL': isVercel ? '"1"' : '""',
  },
  server: {
    proxy: {
      '/arxiv-pdf': {
        target: 'https://arxiv.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/arxiv-pdf/, ''),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes: IncomingMessage, _req: IncomingMessage, res: ServerResponse) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
            const status = proxyRes.statusCode || 0;
            if (status >= 300 && status < 400 && proxyRes.headers.location) {
              const redirectTo = proxyRes.headers.location;
              const parsed = new URL(redirectTo, 'https://arxiv.org');
              const newPath = '/arxiv-pdf' + parsed.pathname + parsed.search;
              res.writeHead(307, { Location: newPath });
              res.end();
              (proxyRes as any).destroy();
            }
          });
        },
      },
    },
  },
})
