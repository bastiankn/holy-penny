import type { Vector3Tuple, QuaternionTuple } from '../utils/vec';

export type TrackingState = 'INITIALIZING' | 'ACTIVE' | 'LOST' | 'STOPPED';

export interface CameraPose {
  position: Vector3Tuple;
  quaternion: QuaternionTuple;
  timestamp: number;
  featureCount: number;
  trackingFps: number;
}

export type TrackingStateListener = (s: TrackingState) => void;

export interface TrackingProvider {
  start(): Promise<void>;
  stop(): void;
  getPose(): CameraPose | null;
  getState(): TrackingState;
  onStateChange(cb: TrackingStateListener): () => void;
}

function copyPose(p: CameraPose): CameraPose {
  return {
    position: { x: p.position.x, y: p.position.y, z: p.position.z },
    quaternion: {
      x: p.quaternion.x,
      y: p.quaternion.y,
      z: p.quaternion.z,
      w: p.quaternion.w,
    },
    timestamp: p.timestamp,
    featureCount: p.featureCount,
    trackingFps: p.trackingFps,
  };
}

export class MockTrackingProvider implements TrackingProvider {
  private state: TrackingState = 'STOPPED';
  private pose: CameraPose | null = null;
  private listeners = new Set<TrackingStateListener>();

  setState(s: TrackingState): void {
    this.state = s;
    for (const cb of this.listeners) {
      cb(s);
    }
  }

  setPose(p: CameraPose | null): void {
    this.pose = p === null ? null : copyPose(p);
  }

  start(): Promise<void> {
    if (this.state !== 'STOPPED') {
      return Promise.resolve();
    }
    this.setState('INITIALIZING');
    return Promise.resolve();
  }

  stop(): void {
    if (this.state === 'STOPPED') {
      return;
    }
    this.pose = null;
    this.setState('STOPPED');
  }

  getPose(): CameraPose | null {
    if (this.state !== 'ACTIVE') {
      return null;
    }
    if (this.pose === null) {
      return null;
    }
    return copyPose(this.pose);
  }

  getState(): TrackingState {
    return this.state;
  }

  onStateChange(cb: TrackingStateListener): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }
}
