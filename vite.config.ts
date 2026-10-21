import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => ({
  // Project Pages are served under /HyperPolyGlot-SOS-/ rather than the domain root.
  base: process.env.GITHUB_PAGES === 'true' ? '/HyperPolyGlot-SOS-/' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname || '.', '.'),
    },
  },
  server: {
    hmr: false,
    watch: null,
  },
}));
