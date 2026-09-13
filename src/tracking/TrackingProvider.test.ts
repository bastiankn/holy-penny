import { MockTrackingProvider } from './TrackingProvider';
import type { CameraPose } from './TrackingProvider';

function makePose(overrides: Partial<CameraPose> = {}): CameraPose {
  return {
    position: { x: 1, y: 2, z: 3 },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    timestamp: 1234,
    featureCount: 42,
    trackingFps: 30,
    ...overrides,
  };
}

describe('MockTrackingProvider', () => {
  it('initializes STOPPED with null pose', () => {
    const p = new MockTrackingProvider();
    expect(p.getState()).toBe('STOPPED');
    expect(p.getPose()).toBeNull();
  });

  it('start() sets INITIALIZING synchronously then resolves', async () => {
    const p = new MockTrackingProvider();
    const promise = p.start();
    expect(p.getState()).toBe('INITIALIZING');
    await promise;
    expect(p.getState()).toBe('INITIALIZING');
  });

  it('double-start is idempotent and fires listener once', async () => {
    const p = new MockTrackingProvider();
    const states: string[] = [];
    p.onStateChange((s) => states.push(s));
    await p.start();
    await p.start();
    expect(p.getState()).toBe('INITIALIZING');
    expect(states).toEqual(['INITIALIZING']);
  });

  it('getPose returns null unless ACTIVE', () => {
    const p = new MockTrackingProvider();
    p.setPose(makePose());
    expect(p.getPose()).toBeNull();
    p.setState('INITIALIZING');
    expect(p.getPose()).toBeNull();
    p.setState('LOST');
    expect(p.getPose()).toBeNull();
    p.setState('STOPPED');
    expect(p.getPose()).toBeNull();
  });

  it('getPose returns defensive copy only when ACTIVE', () => {
    const p = new MockTrackingProvider();
    p.setState('ACTIVE');
    p.setPose(makePose());
    const a = p.getPose();
    expect(a).not.toBeNull();
    expect(a).toEqual(makePose());
    // Mutate returned object: internal state must not change
    if (a !== null) {
      a.position.x = 999;
      a.quaternion.w = 0;
    }
    const b = p.getPose();
    expect(b?.position.x).toBe(1);
    expect(b?.quaternion.w).toBe(1);
  });

  it('LOST hides pose even when pose is set', () => {
    const p = new MockTrackingProvider();
    p.setState('ACTIVE');
    p.setPose(makePose());
    expect(p.getPose()).not.toBeNull();
    p.setState('LOST');
    expect(p.getPose()).toBeNull();
  });

  it('stop() synchronously transitions to STOPPED, clears pose, fires once', async () => {
    const p = new MockTrackingProvider();
    const states: string[] = [];
    p.onStateChange((s) => states.push(s));
    await p.start();
    p.setState('ACTIVE');
    p.setPose(makePose());
    expect(p.getPose()).not.toBeNull();
    states.length = 0;
    p.stop();
    expect(p.getState()).toBe('STOPPED');
    expect(p.getPose()).toBeNull();
    expect(states).toEqual(['STOPPED']);
    // Second stop fires nothing
    p.stop();
    expect(states).toEqual(['STOPPED']);
  });

  it('unsubscribe removes listener', async () => {
    const p = new MockTrackingProvider();
    const cb = jest.fn();
    const unsub = p.onStateChange(cb);
    unsub();
    await p.start();
    p.setState('ACTIVE');
    p.stop();
    expect(cb).not.toHaveBeenCalled();
  });

  it('setState notifies all listeners', () => {
    const p = new MockTrackingProvider();
    const cb1 = jest.fn();
    const cb2 = jest.fn();
    p.onStateChange(cb1);
    p.onStateChange(cb2);
    p.setState('ACTIVE');
    expect(cb1).toHaveBeenCalledWith('ACTIVE');
    expect(cb2).toHaveBeenCalledWith('ACTIVE');
  });
});
