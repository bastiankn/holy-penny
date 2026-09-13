/**
 * Main entry point for Holy Penny WebAR Game
 * Wires Lanes A-D through the App class.
 */

import { App } from './app/App';

function isJestEnv(): boolean {
  try {
    const g = globalThis as unknown as Record<string, unknown>;
    const proc = g['process'] as { env?: Record<string, unknown> } | undefined;
    return !!proc?.env?.['JEST_WORKER_ID'];
  } catch {
    return false;
  }
}

// Singleton for the browser only: importing this module under Jest/jsdom
// must stay side-effect free (no renderer, no DOM nodes).
let app: App | undefined;
if (typeof window !== 'undefined' && !isJestEnv()) {
  app = new App({
    cameraEnabled: new URLSearchParams(window.location.search).get('demo') !== '1',
    buildCommit: __BUILD_COMMIT__,
  });
}

export { App, app };
