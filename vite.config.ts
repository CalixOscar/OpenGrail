/* SPDX-License-Identifier: MIT */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'graph', test: /node_modules[\\/]react-force-graph-2d[\\/]/ },
            { name: 'markdown', test: /node_modules[\\/](react-markdown|remark-gfm)[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom)[\\/]/ },
          ],
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
