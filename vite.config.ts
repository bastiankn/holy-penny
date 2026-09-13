import { defineConfig } from 'vite';
import path from 'path';

// Get base path from environment or use default
// For GitHub Pages, BASE_PATH is set by the deployment workflow
const basePath = process.env.BASE_PATH || '/holy-penny/';

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
    // Enable HTTPS for local camera testing
    https: {
      key: './localhost-key.pem',
      cert: './localhost-cert.pem',
    },
  },
});
