import type { CameraPose } from '../tracking/TrackingProvider';
import { ARWorld } from './ARWorld';
import { WorldCoinPlacement } from './WorldCoinPlacement';

function pose(x = 0, y = 1.6, z = 0): CameraPose {
  return {
    position: { x, y, z },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    timestamp: 1000,
    featureCount: 20,
    trackingFps: 30,
  };
}

function fakeCoin() {
  let position: { x: number; y: number; z: number } | null = null;
  return {
    spawn: jest.fn((next: { x: number; y: number; z: number }) => {
      position = { ...next };
    }),
    reset: jest.fn(() => {
      position = null;
    }),
    setVisible: jest.fn(),
    getPosition: jest.fn(() => (position === null ? null : { ...position })),
    update: jest.fn(),
    setOrientationYaw: jest.fn(),
  };
}

describe('WorldCoinPlacement', () => {
  it('places the coin once and keeps its original world position', () => {
    const coin = fakeCoin();
    const placement = new WorldCoinPlacement(new ARWorld(), coin);

    expect(placement.placeFromFirstPose(pose())).toBe(true);
    expect(placement.getPosition()).toEqual({ x: 0, y: 1.1, z: -2.5 });
    expect(coin.setOrientationYaw).toHaveBeenCalledWith(0);
    expect(placement.placeFromFirstPose(pose(8, 3, 4))).toBe(false);
    expect(placement.getPosition()).toEqual({ x: 0, y: 1.1, z: -2.5 });
    expect(coin.spawn).toHaveBeenCalledTimes(1);
  });

  it('drives animation, tracking visibility, and reset without game logic', () => {
    const coin = fakeCoin();
    const placement = new WorldCoinPlacement(new ARWorld(), coin);

    placement.update(0.1, 1);
    expect(coin.update).not.toHaveBeenCalled();
    placement.placeFromFirstPose(pose());
    placement.update(0.1, 1);
    expect(coin.update).toHaveBeenCalledWith(0.1, 1);

    placement.setTrackingVisible(false);
    placement.setTrackingVisible(true);
    expect(coin.setVisible).toHaveBeenNthCalledWith(2, false);
    expect(coin.setVisible).toHaveBeenNthCalledWith(3, true);

    placement.reset();
    expect(placement.isPlaced()).toBe(false);
    expect(placement.getPosition()).toBeNull();
    expect(coin.reset).toHaveBeenCalledTimes(1);
    expect(coin.setVisible).toHaveBeenLastCalledWith(false);
  });
});
