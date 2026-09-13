import { ARWorld } from './ARWorld';

const IDENTITY = { x: 0, y: 0, z: 0, w: 1 };
// -90° about Y (right-hand rule): camera faces +X.
const NEG_YAW_90 = { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };
// +90° about Y (right-hand rule): camera faces -X.
const POS_YAW_90 = { x: 0, y: Math.SQRT1_2, z: 0, w: Math.SQRT1_2 };

function frame(
  position: { x: number; y: number; z: number },
  quaternion: { x: number; y: number; z: number; w: number },
  timestamp = 1000
) {
  return { position, quaternion, timestamp };
}

describe('ARWorld', () => {
  describe('computeSpawnPose', () => {
    it('spawns 2.5m ahead for identity rotation', () => {
      const world = new ARWorld();
      const spawn = world.computeSpawnPose(frame({ x: 0, y: 1.6, z: 0 }, IDENTITY));
      expect(spawn.x).toBeCloseTo(0, 10);
      expect(spawn.y).toBeCloseTo(1.4, 10);
      expect(spawn.z).toBeCloseTo(-2.5, 10);
    });

    it('spawns at (+2.5, h, 0) when facing +X (yaw -90°)', () => {
      const world = new ARWorld();
      const spawn = world.computeSpawnPose(frame({ x: 0, y: 1.6, z: 0 }, NEG_YAW_90));
      expect(spawn.x).toBeCloseTo(2.5, 10);
      expect(spawn.y).toBeCloseTo(1.4, 10);
      expect(spawn.z).toBeCloseTo(0, 10);
    });

    it('spawns at (-2.5, h, 0) when facing -X (yaw +90°)', () => {
      const world = new ARWorld();
      const spawn = world.computeSpawnPose(frame({ x: 0, y: 1.6, z: 0 }, POS_YAW_90));
      expect(spawn.x).toBeCloseTo(-2.5, 10);
      expect(spawn.y).toBeCloseTo(1.4, 10);
      expect(spawn.z).toBeCloseTo(0, 10);
    });

    it('applies heightOffset on top of the camera height', () => {
      const world = new ARWorld();
      const spawn = world.computeSpawnPose(frame({ x: 0, y: 1.6, z: 0 }, IDENTITY), {
        heightOffset: 0.5,
      });
      expect(spawn.y).toBeCloseTo(2.1, 10);
    });

    it('applies yawOffset to the spawn direction', () => {
      const world = new ARWorld();
      const spawn = world.computeSpawnPose(frame({ x: 1, y: 1, z: 1 }, IDENTITY), {
        yawOffset: Math.PI,
      });
      expect(spawn.x).toBeCloseTo(1, 10);
      expect(spawn.y).toBeCloseTo(0.8, 10);
      expect(spawn.z).toBeCloseTo(3.5, 10);
    });

    it('clamps a 10m distance down to 3m', () => {
      const world = new ARWorld();
      const spawn = world.computeSpawnPose(frame({ x: 0, y: 1.6, z: 0 }, IDENTITY), {
        distance: 10,
      });
      expect(spawn.z).toBeCloseTo(-3, 10);
    });

    it('clamps a 0.5m distance up to 2m', () => {
      const world = new ARWorld();
      const spawn = world.computeSpawnPose(frame({ x: 0, y: 1.6, z: 0 }, IDENTITY), {
        distance: 0.5,
      });
      expect(spawn.z).toBeCloseTo(-2, 10);
    });

    it('works without defineOrigin (stateless)', () => {
      const world = new ARWorld();
      expect(world.getOrigin()).toBeNull();
      const spawn = world.computeSpawnPose(frame({ x: 5, y: 5, z: 5 }, IDENTITY));
      expect(spawn).toEqual({ x: 5, y: 4.8, z: 2.5 });
    });
  });

  describe('defineOrigin / getters', () => {
    it('stores and returns the origin', () => {
      const world = new ARWorld();
      const pose = frame({ x: 1, y: 2, z: 3 }, IDENTITY, 42);
      world.defineOrigin(pose);
      expect(world.getOrigin()).toEqual(pose);
    });

    it('returns null origin before defineOrigin', () => {
      expect(new ARWorld().getOrigin()).toBeNull();
    });

    it('returns null spawn before placement', () => {
      expect(new ARWorld().getSpawn()).toBeNull();
    });
  });

  describe('placeOnce', () => {
    it('places exactly once and reports the spawn', () => {
      const world = new ARWorld();
      const spawned: Array<{ x: number; y: number; z: number }> = [];
      const coin = { spawn: (p: { x: number; y: number; z: number }) => spawned.push(p) };

      const first = world.placeOnce(coin, frame({ x: 0, y: 1.6, z: 0 }, IDENTITY));
      const second = world.placeOnce(coin, frame({ x: 9, y: 9, z: 9 }, IDENTITY));

      expect(first).toBe(true);
      expect(second).toBe(false);
      expect(spawned).toHaveLength(1);
      expect(spawned[0].x).toBeCloseTo(0, 10);
      expect(spawned[0].y).toBeCloseTo(1.4, 10);
      expect(spawned[0].z).toBeCloseTo(-2.5, 10);
      expect(world.hasPlaced()).toBe(true);
      expect(world.getSpawn()).toEqual(spawned[0]);
    });

    it('places again after reset', () => {
      const world = new ARWorld();
      const coin = { spawn: () => undefined };
      expect(world.placeOnce(coin, frame({ x: 0, y: 0, z: 0 }, IDENTITY))).toBe(true);
      world.reset();
      expect(world.hasPlaced()).toBe(false);
      expect(world.getSpawn()).toBeNull();
      expect(world.placeOnce(coin, frame({ x: 0, y: 0, z: 0 }, IDENTITY))).toBe(true);
      expect(world.hasPlaced()).toBe(true);
    });
  });
});
