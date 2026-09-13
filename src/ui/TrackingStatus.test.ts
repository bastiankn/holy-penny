import { TrackingStatus } from './TrackingStatus';

describe('TrackingStatus', () => {
  let status: TrackingStatus | null = null;

  afterEach(() => {
    if (status) {
      try {
        status.destroy();
      } catch {
        // ignore cleanup errors
      }
      status = null;
    }
    document.body.innerHTML = '';
  });

  it('creates its own root when none is given (fixed, z-index 500)', () => {
    status = new TrackingStatus();
    expect(status.element.parentNode).toBe(document.body);
    expect(status.element.style.position).toBe('fixed');
    expect(status.element.style.zIndex).toBe('500');
  });

  it('shows INITIALIZING text', () => {
    status = new TrackingStatus();
    status.setTracking('INITIALIZING');
    const state = status.element.querySelector('[data-testid="tracking-state"]');
    expect(state?.textContent).toContain('Tracking: INITIALIZING');
    expect(status.element.getAttribute('data-state')).toBe('INITIALIZING');
  });

  it('ACTIVE with info contains numbers (pose/fps/features)', () => {
    status = new TrackingStatus();
    status.setTracking('ACTIVE', {
      fps: 30,
      featureCount: 42,
      position: { x: 1.5, y: 2.25, z: 3.75 },
    });
    const state = status.element.querySelector('[data-testid="tracking-state"]');
    const text = status.element.textContent ?? '';
    expect(state?.textContent).toContain('Tracking: ACTIVE');
    expect(text).toContain('30');
    expect(text).toContain('42');
    expect(text).toContain('1.5');
  });

  it('LOST sets data-state and warning class', () => {
    status = new TrackingStatus();
    status.setTracking('LOST');
    expect(status.element.getAttribute('data-state')).toBe('LOST');
    const hasWarning =
      status.element.classList.contains('warning') ||
      status.element.classList.contains('is-lost') ||
      status.element.classList.contains('tracking-lost') ||
      status.element.querySelector('.warning') !== null;
    expect(hasWarning).toBe(true);
  });

  it('STOPPED without info is safe', () => {
    status = new TrackingStatus();
    expect(() => status?.setTracking('STOPPED')).not.toThrow();
    const state = status.element.querySelector('[data-testid="tracking-state"]');
    expect(state?.textContent).toContain('Tracking: STOPPED');
  });

  it('destroy is double-safe', () => {
    status = new TrackingStatus();
    const el = status.element;
    status.destroy();
    expect(el.parentNode).toBeNull();
    expect(() => status?.destroy()).not.toThrow();
  });
});
