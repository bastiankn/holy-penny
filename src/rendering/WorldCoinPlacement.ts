import type { CameraPose } from '../tracking/TrackingProvider';
import { ARWorld } from './ARWorld';

export interface WorldCoin {
  spawn(position: { x: number; y: number; z: number }): void;
  reset(): void;
  setVisible(visible: boolean): void;
  getPosition(): { x: number; y: number; z: number } | null;
  update?(dtSec: number, elapsedSec: number): void;
  setOrientationYaw?(yaw: number): void;
}

function extractYaw(pose: CameraPose): number {
  const q = pose.quaternion;
  return Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.x * q.x));
}

/** Places and animates one coin without enabling collection or beacon logic. */
export class WorldCoinPlacement {
  private readonly world: ARWorld;
  private readonly coin: WorldCoin;
  private readonly distance: number;
  private readonly heightOffset: number;
  private placed = false;

  constructor(world: ARWorld, coin: WorldCoin, distance = 2.5, heightOffset = -0.5) {
    this.world = world;
    this.coin = coin;
    this.distance = distance;
    this.heightOffset = heightOffset;
  }

  placeFromFirstPose(pose: CameraPose): boolean {
    if (this.placed) {
      return false;
    }

    this.coin.setOrientationYaw?.(extractYaw(pose));
    this.world.defineOrigin(pose);
    const didPlace = this.world.placeOnce(this.coin, pose, {
      distance: this.distance,
      heightOffset: this.heightOffset,
    });
    if (!didPlace) {
      return false;
    }

    this.coin.setVisible(true);
    this.placed = true;
    return true;
  }

  update(dtSec: number, elapsedSec: number): void {
    if (this.placed) {
      this.coin.update?.(dtSec, elapsedSec);
    }
  }

  setTrackingVisible(active: boolean): void {
    this.coin.setVisible(this.placed && active);
  }

  isPlaced(): boolean {
    return this.placed;
  }

  getPosition(): { x: number; y: number; z: number } | null {
    return this.coin.getPosition();
  }

  reset(): void {
    this.world.reset();
    this.coin.reset();
    this.coin.setVisible(false);
    this.placed = false;
  }
}
