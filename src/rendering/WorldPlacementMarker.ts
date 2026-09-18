import * as THREE from 'three';
import type { CameraPose } from '../tracking/TrackingProvider';
import { ARWorld } from './ARWorld';

/**
 * A neutral target used to validate one-time AR-world placement before the
 * coin, beacon, and collection stages are enabled on the camera route.
 */
export class WorldPlacementMarker {
  private readonly scene: THREE.Scene;
  private readonly world: ARWorld;
  private readonly marker: THREE.Group;
  private readonly geometries: THREE.BufferGeometry[];
  private readonly materials: THREE.Material[];
  private placed = false;

  constructor(scene: THREE.Scene, world: ARWorld, distance = 2.5, heightOffset = -0.5) {
    this.scene = scene;
    this.world = world;

    const ringGeometry = new THREE.TorusGeometry(0.34, 0.035, 12, 48);
    const coreGeometry = new THREE.SphereGeometry(0.11, 20, 14);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x32d6ff,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    });
    const coreMaterial = new THREE.MeshNormalMaterial();

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.marker = new THREE.Group();
    this.marker.add(ring, core);
    this.marker.visible = false;
    this.marker.userData['distance'] = distance;
    this.marker.userData['heightOffset'] = heightOffset;
    this.marker.renderOrder = 10;

    this.geometries = [ringGeometry, coreGeometry];
    this.materials = [ringMaterial, coreMaterial];
    this.scene.add(this.marker);
  }

  placeFromFirstPose(pose: CameraPose): boolean {
    if (this.placed) {
      return false;
    }

    this.marker.quaternion.set(
      pose.quaternion.x,
      pose.quaternion.y,
      pose.quaternion.z,
      pose.quaternion.w
    );
    this.world.defineOrigin(pose);
    const didPlace = this.world.placeOnce(
      {
        spawn: (position) => {
          this.marker.position.set(position.x, position.y, position.z);
        },
      },
      pose,
      {
        distance: Number(this.marker.userData['distance']),
        heightOffset: Number(this.marker.userData['heightOffset']),
      }
    );

    if (!didPlace) {
      return false;
    }
    this.marker.visible = true;
    this.placed = true;
    return true;
  }

  isPlaced(): boolean {
    return this.placed;
  }

  getPosition(): { x: number; y: number; z: number } | null {
    if (!this.placed) {
      return null;
    }
    return {
      x: this.marker.position.x,
      y: this.marker.position.y,
      z: this.marker.position.z,
    };
  }

  setTrackingVisible(active: boolean): void {
    this.marker.visible = this.placed && active;
  }

  reset(): void {
    this.world.reset();
    this.placed = false;
    this.marker.visible = false;
  }

  dispose(): void {
    this.scene.remove(this.marker);
    for (const geometry of this.geometries) {
      geometry.dispose();
    }
    for (const material of this.materials) {
      material.dispose();
    }
  }
}
