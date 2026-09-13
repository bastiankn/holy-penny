/**
 * Player - tracks the player position in AR world space.
 *
 * With world tracking the camera position approximates the player position,
 * so the game feeds each camera pose into `updateFromPose`.
 *
 * Pure logic module: intentionally no `three` import so unit tests run
 * under the global `three` mock in `src/setupTests.ts`.
 *
 * NOTE on Lane A timing: `../tracking/TrackingProvider` (with `CameraPose`)
 * and `../utils/vec` (with `Vector3Tuple`) may not exist yet while Lane A
 * works in parallel. The types below are structural copies and stay
 * assignment-compatible once Lane A lands — no hard dependency is taken.
 */

export interface Vector3Tuple {
  x: number;
  y: number;
  z: number;
}

/** Minimal structural subset of Lane A's `CameraPose` used by the Player. */
export interface PoseLike {
  position: Vector3Tuple;
}

export class Player {
  private position: Vector3Tuple;

  constructor(initial?: Vector3Tuple) {
    this.position = initial ? { x: initial.x, y: initial.y, z: initial.z } : { x: 0, y: 0, z: 0 };
  }

  /**
   * Adopt the latest camera pose position.
   * A `null` pose means tracking is LOST — the last known position is kept.
   */
  updateFromPose(pose: PoseLike | null): void {
    if (pose === null || pose === undefined) {
      return;
    }
    this.position = { x: pose.position.x, y: pose.position.y, z: pose.position.z };
  }

  /** Defensive copy of the current position (defaults to the origin). */
  getPosition(): Vector3Tuple {
    return { x: this.position.x, y: this.position.y, z: this.position.z };
  }

  /** Euclidean distance from the player to the target. */
  distanceTo(target: Vector3Tuple): number {
    const dx = this.position.x - target.x;
    const dy = this.position.y - target.y;
    const dz = this.position.z - target.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }
}
