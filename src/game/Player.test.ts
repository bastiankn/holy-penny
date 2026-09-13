import { Player } from './Player';

describe('Player', () => {
  describe('construction', () => {
    it('defaults to the origin', () => {
      const player = new Player();
      expect(player.getPosition()).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('starts at the given initial position', () => {
      const player = new Player({ x: 1, y: 2, z: 3 });
      expect(player.getPosition()).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('copies the initial position (no aliasing)', () => {
      const initial = { x: 1, y: 2, z: 3 };
      const player = new Player(initial);
      initial.x = 99;
      expect(player.getPosition()).toEqual({ x: 1, y: 2, z: 3 });
    });
  });

  describe('updateFromPose', () => {
    it('follows the pose position', () => {
      const player = new Player();
      player.updateFromPose({ position: { x: 1, y: 1.6, z: -2 } });
      expect(player.getPosition()).toEqual({ x: 1, y: 1.6, z: -2 });
    });

    it('keeps the last position on null pose (LOST safe)', () => {
      const player = new Player();
      player.updateFromPose({ position: { x: 4, y: 5, z: 6 } });
      player.updateFromPose(null);
      expect(player.getPosition()).toEqual({ x: 4, y: 5, z: 6 });
    });

    it('keeps the origin on null pose without any prior pose', () => {
      const player = new Player();
      player.updateFromPose(null);
      expect(player.getPosition()).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('copies the pose position (no aliasing)', () => {
      const player = new Player();
      const pose = { position: { x: 1, y: 2, z: 3 } };
      player.updateFromPose(pose);
      pose.position.x = -50;
      expect(player.getPosition()).toEqual({ x: 1, y: 2, z: 3 });
    });
  });

  describe('getPosition', () => {
    it('returns a defensive copy', () => {
      const player = new Player({ x: 7, y: 8, z: 9 });
      const copy = player.getPosition();
      copy.x = -1;
      copy.y = -1;
      copy.z = -1;
      expect(player.getPosition()).toEqual({ x: 7, y: 8, z: 9 });
    });
  });

  describe('distanceTo', () => {
    it('computes the Euclidean distance', () => {
      const player = new Player({ x: 0, y: 0, z: 0 });
      expect(player.distanceTo({ x: 1, y: 2, z: 2 })).toBeCloseTo(3, 10);
    });

    it('computes distance from a non-origin position', () => {
      const player = new Player({ x: 1, y: 1, z: 1 });
      expect(player.distanceTo({ x: 4, y: 5, z: 1 })).toBeCloseTo(5, 10);
    });

    it('returns 0 for the same position', () => {
      const player = new Player({ x: -2, y: 0.5, z: 3 });
      expect(player.distanceTo({ x: -2, y: 0.5, z: 3 })).toBe(0);
    });

    it('is symmetric regardless of direction', () => {
      const player = new Player({ x: 1, y: 0, z: 0 });
      expect(player.distanceTo({ x: -2, y: 0, z: 0 })).toBeCloseTo(3, 10);
    });
  });
});
