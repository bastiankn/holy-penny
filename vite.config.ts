import { defineConfig } from 'vite';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function buildCommit(): string {
  if (process.env.BUILD_COMMIT) return process.env.BUILD_COMMIT.slice(0, 8);
  try {
    return `${execFileSync('git', ['rev-parse', '--short=8', 'HEAD']).toString().trim()}-local`;
  } catch {
    return 'local';
  }
}

export default defineConfig(({ command }) => ({
  base: process.env.BASE_PATH || (command === 'serve' ? '/' : '/holy-penny/'),
  define: { __BUILD_COMMIT__: JSON.stringify(buildCommit()) },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: 'dist', assetsDir: 'assets', sourcemap: true },
  // Localhost is a secure context for camera access. Phone tests use HTTPS Pages previews.
  server: { host: '127.0.0.1', port: 3000, strictPort: true },
}));
