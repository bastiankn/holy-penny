jest.unmock('three');

import * as THREE from 'three';
import type { CameraPose } from '../tracking/TrackingProvider';
import { ARWorld } from './ARWorld';
import { WorldPlacementMarker } from './WorldPlacementMarker';

function pose(x = 0, y = 1.6, z = 0): CameraPose {
  return {
    position: { x, y, z },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    timestamp: 1000,
    featureCount: 20,
    trackingFps: 30,
  };
}

describe('WorldPlacementMarker', () => {
  it('places once from the first pose and keeps that world position', () => {
    const scene = new THREE.Scene();
    const world = new ARWorld();
    const placement = new WorldPlacementMarker(scene, world);

    expect(placement.placeFromFirstPose(pose())).toBe(true);
    expect(placement.getPosition()).toEqual({ x: 0, y: 1.1, z: -2.5 });
    expect(world.getOrigin()).toEqual({
      position: { x: 0, y: 1.6, z: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: 1000,
    });

    expect(placement.placeFromFirstPose(pose(8, 3, 4))).toBe(false);
    expect(placement.getPosition()).toEqual({ x: 0, y: 1.1, z: -2.5 });

    placement.dispose();
    expect(scene.children).toHaveLength(0);
  });

  it('hides on tracking loss and can place again after reset', () => {
    const scene = new THREE.Scene();
    const placement = new WorldPlacementMarker(scene, new ARWorld());
    const visual = scene.children[0];

    placement.placeFromFirstPose(pose());
    placement.setTrackingVisible(false);
    expect(visual.visible).toBe(false);
    placement.setTrackingVisible(true);
    expect(visual.visible).toBe(true);

    placement.reset();
    expect(placement.isPlaced()).toBe(false);
    expect(visual.visible).toBe(false);
    expect(placement.placeFromFirstPose(pose(1, 2, 3))).toBe(true);
    expect(placement.getPosition()).toEqual({ x: 1, y: 1.5, z: 0.5 });

    placement.dispose();
  });
});
