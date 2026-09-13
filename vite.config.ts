import { defineConfig } from 'vite';
import path from 'path';

// Get base path from environment or use default
const basePath = process.env.BASE_PATH || '/';

export default defineConfig({
  base: basePath,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
