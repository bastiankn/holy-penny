import { defineConfig } from '@playwright/test';

const basePath = process.env.TEST_BASE_PATH || '/holy-penny/';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    // Full Chromium supports the synthetic camera; headless-shell may not.
    channel: 'chromium',
    baseURL: `http://127.0.0.1:4173${basePath}`,
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: ['--use-fake-device-for-media-stream', '--enable-unsafe-swiftshader'],
    },
  },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort --base ${basePath}`,
    url: `http://127.0.0.1:4173${basePath}`,
    reuseExistingServer: !process.env.CI,
  },
});
