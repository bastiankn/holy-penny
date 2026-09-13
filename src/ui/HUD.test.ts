import { HUD } from './HUD';

describe('HUD', () => {
  let hud: HUD | null = null;

  afterEach(() => {
    if (hud) {
      try {
        hud.destroy();
      } catch {
        // ignore cleanup errors
      }
      hud = null;
    }
    document.body.innerHTML = '';
  });

  it('renders COINS 0/1 on init with default total', () => {
    hud = new HUD();
    const score = hud.element.querySelector('[data-testid="hud-score"]');
    expect(score).not.toBeNull();
    expect(score?.textContent).toContain('COINS 0/1');
  });

  it('creates its own root when none is given (fixed, z-index 500)', () => {
    hud = new HUD();
    expect(hud.element.parentNode).toBe(document.body);
    expect(hud.element.style.position).toBe('fixed');
    expect(hud.element.style.zIndex).toBe('500');
  });

  it('setScore updates the score text', () => {
    hud = new HUD(undefined, { total: 1 });
    hud.setScore(1, 1);
    const score = hud.element.querySelector('[data-testid="hud-score"]');
    expect(score?.textContent).toContain('COINS 1/1');
  });

  it('setDistance formats meters with two decimals', () => {
    hud = new HUD();
    hud.setDistance(2.434);
    const distance = hud.element.querySelector('[data-testid="hud-distance"]');
    expect(distance?.textContent).toContain('2.43');
  });

  it('setDistance(null) shows placeholder dash', () => {
    hud = new HUD();
    hud.setDistance(2.5);
    hud.setDistance(null);
    const distance = hud.element.querySelector('[data-testid="hud-distance"]');
    expect(distance?.textContent).toContain('—');
  });

  it('restart button fires onRestart exactly once per click', () => {
    const onRestart = jest.fn();
    hud = new HUD(undefined, { onRestart });
    const button = hud.element.querySelector('button');
    expect(button).not.toBeNull();
    button?.click();
    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it('restart button meets 44px touch target', () => {
    hud = new HUD();
    const button = hud.element.querySelector('button') as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    const minW = parseInt(button?.style.minWidth ?? '', 10);
    const minH = parseInt(button?.style.minHeight ?? '', 10);
    const w = parseInt(button?.style.width ?? '', 10);
    const h = parseInt(button?.style.height ?? '', 10);
    const width = Number.isNaN(minW) ? w : minW;
    const height = Number.isNaN(minH) ? h : minH;
    expect(width).toBeGreaterThanOrEqual(44);
    expect(height).toBeGreaterThanOrEqual(44);
  });

  it('setCollectPrompt toggles the near-threshold prompt', () => {
    hud = new HUD();
    hud.setCollectPrompt(true);
    const prompt = hud.element.querySelector(
      '[data-testid="hud-collect-prompt"]'
    ) as HTMLElement | null;
    expect(prompt).not.toBeNull();
    expect(prompt?.style.display).not.toBe('none');
    hud.setCollectPrompt(false);
    expect(prompt?.style.display).toBe('none');
  });

  it('reset/showFinished cycle restores initial state', () => {
    hud = new HUD(undefined, { total: 1 });
    hud.setScore(1, 1);
    hud.showFinished();
    const finished = hud.element.querySelector(
      '[data-testid="hud-finished"]'
    ) as HTMLElement | null;
    expect(finished?.style.display).not.toBe('none');
    hud.reset();
    const score = hud.element.querySelector('[data-testid="hud-score"]');
    expect(score?.textContent).toContain('COINS 0/1');
    expect(finished?.style.display).toBe('none');
  });

  it('destroy removes the node and is double-safe', () => {
    hud = new HUD();
    const el = hud.element;
    hud.destroy();
    expect(el.parentNode).toBeNull();
    expect(() => hud?.destroy()).not.toThrow();
  });
});
