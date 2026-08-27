/* SPDX-License-Identifier: AGPL-3.0-or-later OR LicenseRef-OpenGrail-Commercial */
/* See LICENSE and LICENSE-COMMERCIAL.md for the applicable terms. */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/opengrail/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          graph: ['react-force-graph-2d'],
          markdown: ['react-markdown', 'remark-gfm'],
          react: ['react', 'react-dom'],
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
