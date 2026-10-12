import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()], base: './',
  build: { rollupOptions: { output: { manualChunks(id) {
    const product = id.match(/\/products\/([^/]+)\//)?.[1];
    if (product) return `manual-${product}`;
    if (id.includes('/node_modules/')) return 'vendor';
  } } } },
});
