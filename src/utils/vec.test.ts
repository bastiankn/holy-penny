import { distance3, distanceXZ, isWithinThreshold, formatDistance, clamp } from './vec';

describe('vec', () => {
  describe('distance3', () => {
    it('computes Pythagorean distance in XY plane', () => {
      expect(distance3({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBeCloseTo(5, 10);
    });

    it('computes full 3D Euclidean distance', () => {
      // sqrt(1 + 4 + 4) = 3
      expect(distance3({ x: 0, y: 0, z: 0 }, { x: 1, y: 2, z: 2 })).toBeCloseTo(3, 10);
    });

    it('returns 0 for identical points', () => {
      expect(distance3({ x: 1.5, y: -2.25, z: 3.75 }, { x: 1.5, y: -2.25, z: 3.75 })).toBe(0);
    });
  });

  describe('distanceXZ', () => {
    it('ignores the y component', () => {
      expect(distanceXZ({ x: 0, y: 100, z: 0 }, { x: 3, y: -50, z: 4 })).toBeCloseTo(5, 10);
    });

    it('returns 0 when only y differs', () => {
      expect(distanceXZ({ x: 1, y: 0, z: 2 }, { x: 1, y: 999, z: 2 })).toBe(0);
    });
  });

  describe('isWithinThreshold', () => {
    it('returns true when distance is strictly below threshold', () => {
      expect(isWithinThreshold({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }, 5.001)).toBe(true);
    });

    it('returns false on the boundary (distance === threshold)', () => {
      expect(isWithinThreshold({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 }, 5)).toBe(false);
    });

    it('returns false for non-positive thresholds', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 0, y: 0, z: 0 };
      expect(isWithinThreshold(a, b, 0)).toBe(false);
      expect(isWithinThreshold(a, b, -1)).toBe(false);
    });
  });

  describe('formatDistance', () => {
    it('formats meters with two decimals', () => {
      expect(formatDistance(2.43)).toBe('2.43 m');
      expect(formatDistance(2)).toBe('2.00 m');
      expect(formatDistance(0)).toBe('0.00 m');
    });

    it('returns em dash for null, undefined, NaN and negative values', () => {
      expect(formatDistance(null)).toBe('—');
      expect(formatDistance(undefined)).toBe('—');
      expect(formatDistance(NaN)).toBe('—');
      expect(formatDistance(-0.5)).toBe('—');
      expect(formatDistance(-10)).toBe('—');
    });
  });

  describe('clamp', () => {
    it('returns value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamps to min and max boundaries', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });
});
