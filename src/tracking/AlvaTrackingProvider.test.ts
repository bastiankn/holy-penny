import { AlvaTrackingProvider } from './AlvaTrackingProvider';

describe('AlvaTrackingProvider', () => {
  it('initializes STOPPED with null pose and zero fps/features', () => {
    const video = document.createElement('video');
    const p = new AlvaTrackingProvider(video);
    expect(p.getState()).toBe('STOPPED');
    expect(p.getPose()).toBeNull();
    expect(p.getFps()).toBe(0);
    expect(p.getFeatureCount()).toBe(0);
  });

  it('start() sets INITIALIZING synchronously then falls back to ACTIVE', async () => {
    const video = document.createElement('video');
    const p = new AlvaTrackingProvider(video);
    const promise = p.start();
    expect(p.getState()).toBe('INITIALIZING');
    await promise;
    expect(p.getState()).toBe('ACTIVE');
    p.stop();
  });

  it('dynamic-import failure still yields ACTIVE dummy pose at origin', async () => {
    const video = document.createElement('video');
    const p = new AlvaTrackingProvider(video);
    await p.start();
    expect(p.getState()).toBe('ACTIVE');
    const pose = p.getPose();
    expect(pose).not.toBeNull();
    expect(pose?.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(pose?.quaternion).toEqual({ x: 0, y: 0, z: 0, w: 1 });
    expect(pose?.featureCount).toBe(0);
    expect(pose?.trackingFps).toBe(0);
    p.stop();
  });

  it('works with null video element without throwing', async () => {
    const p = new AlvaTrackingProvider(null);
    await expect(p.start()).resolves.toBeUndefined();
    expect(p.getState()).toBe('ACTIVE');
    expect(p.getPose()).not.toBeNull();
    p.stop();
  });

  it('getPose returns defensive copy', async () => {
    const video = document.createElement('video');
    const p = new AlvaTrackingProvider(video);
    await p.start();
    const a = p.getPose();
    expect(a).not.toBeNull();
    if (a !== null) {
      a.position.x = 999;
    }
    const b = p.getPose();
    expect(b?.position.x).toBe(0);
    p.stop();
  });

  it('stop() transitions to STOPPED and clears pose', async () => {
    const video = document.createElement('video');
    const p = new AlvaTrackingProvider(video);
    await p.start();
    expect(p.getState()).toBe('ACTIVE');
    p.stop();
    expect(p.getState()).toBe('STOPPED');
    expect(p.getPose()).toBeNull();
  });

  it('double-start is idempotent (no duplicate state events)', async () => {
    const video = document.createElement('video');
    const p = new AlvaTrackingProvider(video);
    const states: string[] = [];
    p.onStateChange((s) => states.push(s));
    await p.start();
    await p.start();
    expect(p.getState()).toBe('ACTIVE');
    expect(states).toEqual(['INITIALIZING', 'ACTIVE']);
    p.stop();
  });

  it('unsubscribe removes listener', async () => {
    const video = document.createElement('video');
    const p = new AlvaTrackingProvider(video);
    const cb = jest.fn();
    const unsub = p.onStateChange(cb);
    unsub();
    await p.start();
    p.stop();
    expect(cb).not.toHaveBeenCalled();
  });
});
