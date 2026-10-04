/* SPDX-License-Identifier: MIT */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-force-graph-2d')) return 'graph';
          if (/node_modules\/(react-markdown|remark-gfm)\//.test(id)) return 'markdown';
          if (/node_modules\/(react|react-dom)\//.test(id)) return 'react';
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
  },
});
