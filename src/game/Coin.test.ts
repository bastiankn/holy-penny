import { Coin } from './Coin';

function flushAsync(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe('Coin (headless, no scene)', () => {
  describe('initial state', () => {
    it('is not placed initially', () => {
      const coin = new Coin();
      expect(coin.isPlaced()).toBe(false);
      expect(coin.isCollected()).toBe(false);
      expect(coin.getPosition()).toBeNull();
    });

    it('is visible initially', () => {
      expect(new Coin().isVisible()).toBe(true);
    });

    it('update before spawn is safe', () => {
      const coin = new Coin();
      expect(() => coin.update(0.016, 1.0)).not.toThrow();
      expect(coin.isPlaced()).toBe(false);
    });

    it('collect before spawn returns false', () => {
      const coin = new Coin();
      expect(coin.collect()).toBe(false);
      expect(coin.isCollected()).toBe(false);
    });
  });

  describe('spawn', () => {
    it('places the coin at the given position', () => {
      const coin = new Coin();
      coin.spawn({ x: 1, y: 1.4, z: -2.5 });
      expect(coin.isPlaced()).toBe(true);
      expect(coin.getPosition()).toEqual({ x: 1, y: 1.4, z: -2.5 });
    });

    it('is once-only until reset (second spawn is a no-op)', () => {
      const coin = new Coin();
      coin.spawn({ x: 1, y: 1, z: 1 });
      coin.spawn({ x: 9, y: 9, z: 9 });
      expect(coin.getPosition()).toEqual({ x: 1, y: 1, z: 1 });
    });

    it('returns defensive copies from getPosition', () => {
      const coin = new Coin();
      const pos = { x: 1, y: 2, z: 3 };
      coin.spawn(pos);
      pos.x = 99;
      expect(coin.getPosition()).toEqual({ x: 1, y: 2, z: 3 });
      const copy = coin.getPosition();
      if (copy !== null) {
        copy.y = -99;
      }
      expect(coin.getPosition()).toEqual({ x: 1, y: 2, z: 3 });
    });
  });

  describe('update', () => {
    it('bobbing does not affect the logical position', () => {
      const coin = new Coin();
      coin.spawn({ x: 1, y: 1.4, z: -2.5 });
      for (let i = 0; i < 120; i += 1) {
        coin.update(0.016, i * 0.016);
      }
      expect(coin.getPosition()).toEqual({ x: 1, y: 1.4, z: -2.5 });
    });

    it('ignores non-finite time values', () => {
      const coin = new Coin();
      coin.spawn({ x: 0, y: 1, z: -2 });
      expect(() => coin.update(NaN, Infinity)).not.toThrow();
      expect(coin.getPosition()).toEqual({ x: 0, y: 1, z: -2 });
    });
  });

  describe('collect', () => {
    it('first collect returns true, later ones return false', () => {
      const coin = new Coin();
      coin.spawn({ x: 0, y: 1, z: -2 });
      expect(coin.collect()).toBe(true);
      expect(coin.isCollected()).toBe(true);
      expect(coin.collect()).toBe(false);
      expect(coin.collect()).toBe(false);
    });

    it('hides the coin on collect', () => {
      const coin = new Coin();
      coin.spawn({ x: 0, y: 1, z: -2 });
      coin.collect();
      expect(coin.isVisible()).toBe(false);
    });
  });

  describe('reset', () => {
    it('clears state and allows respawn + recollect', () => {
      const coin = new Coin();
      coin.spawn({ x: 0, y: 1, z: -2 });
      expect(coin.collect()).toBe(true);
      coin.reset();
      expect(coin.isPlaced()).toBe(false);
      expect(coin.isCollected()).toBe(false);
      expect(coin.getPosition()).toBeNull();
      expect(coin.isVisible()).toBe(true);
      coin.spawn({ x: 5, y: 5, z: 5 });
      expect(coin.isPlaced()).toBe(true);
      expect(coin.getPosition()).toEqual({ x: 5, y: 5, z: 5 });
      expect(coin.collect()).toBe(true);
    });
  });

  describe('visibility and lifecycle', () => {
    it('setVisible toggles visibility and update never re-shows', () => {
      const coin = new Coin();
      coin.spawn({ x: 0, y: 1, z: -2 });
      coin.setVisible(false);
      expect(coin.isVisible()).toBe(false);
      coin.update(0.016, 2.0);
      expect(coin.isVisible()).toBe(false);
      coin.setVisible(true);
      expect(coin.isVisible()).toBe(true);
    });

    it('dispose is safe and idempotent without a scene', () => {
      const coin = new Coin();
      coin.spawn({ x: 0, y: 1, z: -2 });
      expect(() => {
        coin.dispose();
        coin.dispose();
      }).not.toThrow();
      expect(() => coin.update(0.016, 3.0)).not.toThrow();
    });
  });

  describe('with a stub scene (no WebGL)', () => {
    it('never throws and keeps headless state', async () => {
      const added: unknown[] = [];
      const stubScene = {
        add: (obj: unknown) => {
          added.push(obj);
        },
        remove: () => undefined,
      };
      const coin = new Coin(stubScene);
      expect(() => {
        coin.spawn({ x: 1, y: 2, z: 3 });
        coin.update(0.016, 0.5);
      }).not.toThrow();
      await flushAsync();
      expect(coin.isPlaced()).toBe(true);
      expect(coin.getPosition()).toEqual({ x: 1, y: 2, z: 3 });
      expect(coin.collect()).toBe(true);
      expect(() => coin.dispose()).not.toThrow();
      await flushAsync();
    });
  });
});
