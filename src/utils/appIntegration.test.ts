/**
 * App integration test: Game + Player + ARWorld + Coin + Beacon wired
 * through a MockTrackingProvider. Covers the full cycle:
 * place -> walk -> collect -> restart, plus tracking-loss resilience.
 */

import { Game } from '../game/Game';
import { Player } from '../game/Player';
import { ARWorld } from '../rendering/ARWorld';
import { Coin } from '../game/Coin';
import { Beacon } from '../game/Beacon';
import { MockTrackingProvider } from '../tracking/TrackingProvider';
import type { CameraPose } from '../tracking/TrackingProvider';

function poseAt(x: number, y: number, z: number): CameraPose {
  return {
    position: { x, y, z },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    timestamp: Date.now(),
    featureCount: 100,
    trackingFps: 30,
  };
}

function makeHud() {
  return {
    setScore: jest.fn(),
    setDistance: jest.fn(),
    showFinished: jest.fn(),
    reset: jest.fn(),
  };
}

function makeStatus() {
  return {
    setTracking: jest.fn(),
  };
}

function makeSound() {
  return {
    playCollect: jest.fn().mockResolvedValue('silent'),
  };
}

describe('app integration: place -> walk -> collect -> restart', () => {
  it('runs the full coin-hunt cycle and survives tracking loss', async () => {
    const tracking = new MockTrackingProvider();
    const player = new Player();
    const world = new ARWorld();
    const coin = new Coin();
    const beacon = new Beacon();
    const hud = makeHud();
    const status = makeStatus();
    const sound = makeSound();
    const game = new Game({
      tracking,
      player,
      coin,
      beacon,
      world,
      hud,
      status,
      sound,
      collectThreshold: 0.6,
    });

    // Boot: READY -> REQUEST_CAMERA -> INITIALIZING_TRACKING.
    await game.start();
    expect(game.getState()).toBe('READY');
    tracking.setState('ACTIVE');
    tracking.setPose(poseAt(0, 0, 0));
    await game.requestCameraAndTracking();
    expect(game.getState()).toBe('INITIALIZING_TRACKING');

    // First pose places the coin once, ~2.5 m ahead (-Z) and slightly below.
    game.update();
    expect(game.getState()).toBe('PLAYING');
    expect(coin.isPlaced()).toBe(true);
    expect(world.hasPlaced()).toBe(true);
    const spawn = coin.getPosition();
    expect(spawn).not.toBeNull();
    expect(spawn?.x).toBeCloseTo(0);
    expect(spawn?.z).toBeCloseTo(-2.5);
    expect(beacon.isVisible()).toBe(true);
    expect(beacon.getPosition()).toEqual(spawn);

    // Tracking loss mid-game: distance clears, nothing throws, coin stays.
    tracking.setState('LOST');
    game.update();
    expect(game.getState()).toBe('PLAYING');
    expect(game.getCoinDistance()).toBeNull();
    expect(coin.isPlaced()).toBe(true);

    // Walk towards the coin; distance must shrink monotonically.
    tracking.setState('ACTIVE');
    let previous = Number.POSITIVE_INFINITY;
    for (const z of [-0.5, -1.0, -1.5]) {
      tracking.setPose(poseAt(0, 0, z));
      game.update();
      expect(game.getState()).toBe('PLAYING');
      const d = game.getCoinDistance();
      expect(d).not.toBeNull();
      expect(d as number).toBeLessThan(previous);
      previous = d as number;
    }

    // Final step crosses the 0.6 m threshold -> auto-collect -> FINISHED.
    tracking.setPose(poseAt(0, 0, -2.0));
    game.update();
    expect(game.getScore()).toBe(1);
    expect(game.getState()).toBe('FINISHED');
    expect(coin.isCollected()).toBe(true);
    expect(beacon.isVisible()).toBe(false);
    expect(hud.showFinished).toHaveBeenCalled();
    expect(sound.playCollect).toHaveBeenCalled();
    expect(game.collectCoin()).toBe(false);

    // Restart re-spawns at the saved anchor and resumes play.
    game.restart();
    expect(game.getState()).toBe('PLAYING');
    expect(game.getScore()).toBe(0);
    expect(coin.isPlaced()).toBe(true);
    expect(coin.isCollected()).toBe(false);
    expect(coin.getPosition()).toEqual(spawn);
    expect(beacon.isVisible()).toBe(true);
    expect(hud.reset).toHaveBeenCalled();

    game.dispose();
  });
});
