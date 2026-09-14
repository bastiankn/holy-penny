import { test, expect, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

async function goldPixels(page: Page, coinOnly = false): Promise<number> {
  const screenshot = await page.getByTestId('ar-canvas').screenshot();
  const { data, width, height } = PNG.sync.read(screenshot);
  let gold = 0;
  for (let i = 0; i < data.length; i += 4) {
    // Below the beam's base: a missing coin must fail even when the beacon renders.
    if (coinOnly) {
      const x = (i / 4) % width;
      const y = Math.floor(i / 4 / width);
      if (Math.abs(x - width / 2) > height * 0.03 || y < height * 0.58 || y > height * 0.6)
        continue;
    }
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r > 90 && r > g * 1.08 && g > b * 1.5) gold++;
  }
  return gold;
}

function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  return errors;
}

test('desktop demo renders visible gold with the built assets and no camera permission', async ({
  page,
}, testInfo) => {
  const errors = watchErrors(page);
  await page.goto('?demo=1');
  await page.getByRole('button', { name: 'START DESKTOP DEMO' }).click();
  await expect(page.getByTestId('tracking-state')).toContainText('SIMULATED');
  await expect(page.getByTestId('build-commit')).toContainText('Build');
  await expect(page.getByTestId('hud-distance')).toContainText('demo units');
  await expect(page.locator('video')).toHaveCount(0);
  await expect.poll(() => goldPixels(page)).toBeGreaterThan(200);
  await expect.poll(() => goldPixels(page, true)).toBeGreaterThan(20);
  await page.screenshot({ path: testInfo.outputPath('desktop-portrait.png') });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(() => goldPixels(page)).toBeGreaterThan(200);
  await expect.poll(() => goldPixels(page, true)).toBeGreaterThan(20);
  expect(errors).toEqual([]);
});

test('camera permission, portrait/landscape feed and graphics work together', async ({
  page,
  context,
}, testInfo) => {
  testInfo.setTimeout(60_000);
  const errors = watchErrors(page);
  await context.grantPermissions(['camera']);
  await page.goto('');
  const runtimeLoaded = page.waitForResponse((response) =>
    response.url().endsWith('/vendor/alvaar/alva_ar.js')
  );
  await page.getByRole('button', { name: 'START AR TRACKING' }).click();
  expect((await runtimeLoaded).status()).toBe(200);
  const video = page.getByTestId('camera-background');
  await expect(video).toBeVisible();
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.videoWidth))
    .toBeGreaterThan(0);
  await expect(page.getByTestId('tracking-state')).toHaveText(
    /Tracking: (INITIALIZING|ACTIVE|LOST)/
  );
  await expect(page.getByTestId('tracking-guide')).toBeVisible();
  await expect(page.getByTestId('hud')).toBeHidden();
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(video).toHaveCSS('object-fit', 'cover');
    await expect(video).toHaveCSS('width', `${viewport.width}px`);
    await expect(video).toHaveCSS('height', `${viewport.height}px`);
    await expect(page.getByTestId('ar-canvas')).toHaveCSS('width', `${viewport.width}px`);
    await page.screenshot({ path: testInfo.outputPath(`camera-${viewport.width}.png`) });
  }
  expect(errors).toEqual([]);
});

test('denied camera permission leaves a usable retry and desktop demo', async ({ page }) => {
  await page.goto('');
  await page.getByRole('button', { name: 'START AR TRACKING' }).click();
  await expect(page.getByText(/AR start failed:/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'START AR TRACKING' })).toBeEnabled();
  await page.getByRole('link', { name: 'Try without a camera' }).click();
  await page.getByRole('button', { name: 'START DESKTOP DEMO' }).click();
  await expect(page.getByTestId('tracking-state')).toContainText('SIMULATED');
});

test('missing WebGL is explained instead of reporting a running demo', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      ...args: Parameters<typeof original>
    ) {
      if (String(args[0]).includes('webgl')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('?demo=1');
  await page.getByRole('button', { name: 'START DESKTOP DEMO' }).click();
  await expect(page.getByText(/AR start failed: WebGL is unavailable/)).toBeVisible();
  await expect(page.getByTestId('tracking-status')).toBeHidden();
});
