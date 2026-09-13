import { Beacon } from './Beacon';

function flushAsync(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('Beacon (headless, no scene)', () => {
  describe('initial state', () => {
    it('is hidden until attached', () => {
      const beacon = new Beacon();
      expect(beacon.isVisible()).toBe(false);
      expect(beacon.getPosition()).toBeNull();
    });

    it('update while detached is safe', () => {
      const beacon = new Beacon();
      expect(() => beacon.update(0.016, 1.0)).not.toThrow();
      expect(beacon.isVisible()).toBe(false);
      expect(beacon.getPosition()).toBeNull();
    });

    it('ignores non-finite time values', () => {
      const beacon = new Beacon();
      beacon.attachTo({ x: 0, y: 1, z: 0 });
      expect(() => beacon.update(NaN, Infinity)).not.toThrow();
      expect(beacon.getPosition()).toEqual({ x: 0, y: 1, z: 0 });
    });
  });

  describe('attachTo', () => {
    it('becomes visible and reports the attached position', () => {
      const beacon = new Beacon();
      beacon.attachTo({ x: 1, y: 2, z: 3 });
      expect(beacon.isVisible()).toBe(true);
      expect(beacon.getPosition()).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('copies the position (no aliasing)', () => {
      const beacon = new Beacon();
      const pos = { x: 1, y: 2, z: 3 };
      beacon.attachTo(pos);
      pos.x = -42;
      expect(beacon.getPosition()).toEqual({ x: 1, y: 2, z: 3 });
      const copy = beacon.getPosition();
      if (copy !== null) {
        copy.z = -42;
      }
      expect(beacon.getPosition()).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('can re-attach to a new position', () => {
      const beacon = new Beacon();
      beacon.attachTo({ x: 1, y: 1, z: 1 });
      beacon.attachTo({ x: 4, y: 5, z: 6 });
      expect(beacon.getPosition()).toEqual({ x: 4, y: 5, z: 6 });
      expect(beacon.isVisible()).toBe(true);
    });
  });

  describe('update', () => {
    it('pulsing does not affect the attached position', () => {
      const beacon = new Beacon();
      beacon.attachTo({ x: 1, y: 1.4, z: -2.5 });
      for (let i = 0; i < 120; i += 1) {
        beacon.update(0.016, i * 0.016);
      }
      expect(beacon.getPosition()).toEqual({ x: 1, y: 1.4, z: -2.5 });
    });
  });

  describe('visibility', () => {
    it('setVisible(false) persists across updates (never re-shows)', () => {
      const beacon = new Beacon();
      beacon.attachTo({ x: 0, y: 1, z: 0 });
      beacon.setVisible(false);
      beacon.update(0.016, 1.0);
      beacon.update(0.016, 2.0);
      expect(beacon.isVisible()).toBe(false);
    });

    it('setVisible(true) restores visibility', () => {
      const beacon = new Beacon();
      beacon.attachTo({ x: 0, y: 1, z: 0 });
      beacon.setVisible(false);
      beacon.setVisible(true);
      expect(beacon.isVisible()).toBe(true);
      beacon.update(0.016, 1.0);
      expect(beacon.isVisible()).toBe(true);
    });
  });

  describe('dispose', () => {
    it('is safe and idempotent', () => {
      const beacon = new Beacon();
      beacon.attachTo({ x: 0, y: 1, z: 0 });
      expect(() => {
        beacon.dispose();
        beacon.dispose();
      }).not.toThrow();
      expect(() => beacon.update(0.016, 1.0)).not.toThrow();
    });
  });

  describe('with a stub scene (no WebGL)', () => {
    it('never throws and keeps headless state', async () => {
      const stubScene = {
        add: () => undefined,
        remove: () => undefined,
      };
      const beacon = new Beacon(stubScene);
      expect(() => {
        beacon.attachTo({ x: 1, y: 2, z: 3 });
        beacon.update(0.016, 0.5);
      }).not.toThrow();
      await flushAsync();
      expect(beacon.getPosition()).toEqual({ x: 1, y: 2, z: 3 });
      expect(beacon.isVisible()).toBe(true);
      beacon.setVisible(false);
      beacon.update(0.016, 1.0);
      expect(beacon.isVisible()).toBe(false);
      expect(() => beacon.dispose()).not.toThrow();
      await flushAsync();
    });
  });
});
