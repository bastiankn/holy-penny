/**
 * ARWorld - defines the world origin and computes spawn poses from camera frames.
 *
 * Pure math module: intentionally no `three` import so unit tests run
 * under the global `three` mock in `src/setupTests.ts`.
 *
 * Conventions (three.js compatible, right-handed, Y-up):
 * - Forward is -Z rotated by the frame's yaw, plus an optional yawOffset.
 * - Yaw is extracted from the quaternion manually:
 *   yaw = atan2(2 * (w * y + x * z), 1 - 2 * (y * y + x * x))
 * - forward = (-sin(yaw + yawOffset), 0, -cos(yaw + yawOffset))
 * - height = camera.y + heightOffset (default -0.2)
 * - distance defaults to 2.5m and is clamped to [2m, 3m].
 */

export interface Vector3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface QuaternionTuple {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface CameraFrame {
  position: Vector3Tuple;
  quaternion: QuaternionTuple;
}

export interface OriginPose extends CameraFrame {
  timestamp: number;
}

export interface SpawnOptions {
  distance?: number;
  heightOffset?: number;
  yawOffset?: number;
}

/** Something coin-like that can be spawned at a position. */
export interface Spawnable {
  spawn(p: Vector3Tuple): void;
}

const DEFAULT_DISTANCE = 2.5;
const MIN_DISTANCE = 2;
const MAX_DISTANCE = 3;
const DEFAULT_HEIGHT_OFFSET = -0.2;

function clampDistance(distance: number): number {
  if (!Number.isFinite(distance)) {
    return DEFAULT_DISTANCE;
  }
  return Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, distance));
}

function extractYaw(q: QuaternionTuple): number {
  return Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.x * q.x));
}

function copyVec(v: Vector3Tuple): Vector3Tuple {
  return { x: v.x, y: v.y, z: v.z };
}

function copyQuat(q: QuaternionTuple): QuaternionTuple {
  return { x: q.x, y: q.y, z: q.z, w: q.w };
}

export class ARWorld {
  private origin: OriginPose | null = null;
  private spawn: Vector3Tuple | null = null;
  private placed = false;

  constructor() {
    // Stateless until defineOrigin / placeOnce are called.
  }

  defineOrigin(pose: OriginPose): void {
    this.origin = {
      position: copyVec(pose.position),
      quaternion: copyQuat(pose.quaternion),
      timestamp: pose.timestamp,
    };
  }

  /**
   * Compute a spawn pose in front of the given camera frame.
   * Works without `defineOrigin` — it is a pure function of the frame.
   */
  computeSpawnPose(from: CameraFrame, opts?: SpawnOptions): Vector3Tuple {
    const distance = clampDistance(opts?.distance ?? DEFAULT_DISTANCE);
    const heightOffset = opts?.heightOffset ?? DEFAULT_HEIGHT_OFFSET;
    const yawOffset = opts?.yawOffset ?? 0;
    const yaw = extractYaw(from.quaternion) + yawOffset;
    const forwardX = -Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    return {
      x: from.position.x + forwardX * distance,
      y: from.position.y + heightOffset,
      z: from.position.z + forwardZ * distance,
    };
  }

  /**
   * Spawn the coin exactly once. Returns `true` on the first placement,
   * `false` for every later call until `reset()`.
   */
  placeOnce(coin: Spawnable, pose: OriginPose, opts?: SpawnOptions): boolean {
    if (this.placed) {
      return false;
    }
    const spawnPose = this.computeSpawnPose(pose, opts);
    coin.spawn(copyVec(spawnPose));
    this.spawn = spawnPose;
    this.placed = true;
    return true;
  }

  hasPlaced(): boolean {
    return this.placed;
  }

  getOrigin(): OriginPose | null {
    if (this.origin === null) {
      return null;
    }
    return {
      position: copyVec(this.origin.position),
      quaternion: copyQuat(this.origin.quaternion),
      timestamp: this.origin.timestamp,
    };
  }

  getSpawn(): Vector3Tuple | null {
    return this.spawn === null ? null : copyVec(this.spawn);
  }

  reset(): void {
    this.origin = null;
    this.spawn = null;
    this.placed = false;
  }
}
