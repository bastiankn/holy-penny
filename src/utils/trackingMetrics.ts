import type { CameraPose } from '../tracking/TrackingProvider';
import { distance3 } from './vec';
import type { Vector3Tuple } from './vec';

export interface TrackingMetricsReport {
  sessionMs: number;
  initTimeMs: number | null;
  frames: number;
  avgFps: number;
  minFps: number;
  lossCount: number;
  totalLostMs: number;
  recoveries: number;
  maxDriftM: number | null;
}

export class TrackingMetrics {
  private now: () => number;
  private sessionStartMs: number | null = null;
  private frameTimes: number[] = [];
  private initTimeMs: number | null = null;
  private lossCount = 0;
  private totalLostMs = 0;
  private recoveries = 0;
  private maxDriftM: number | null = null;
  private lastPosition: Vector3Tuple | null = null;
  private hasBeenActive = false;
  private inLost = false;
  private lostStartMs = 0;

  constructor(now: () => number = () => Date.now()) {
    this.now = now;
  }

  startSession(): void {
    this.reset();
    this.sessionStartMs = this.now();
  }

  reset(): void {
    this.sessionStartMs = null;
    this.frameTimes = [];
    this.initTimeMs = null;
    this.lossCount = 0;
    this.totalLostMs = 0;
    this.recoveries = 0;
    this.maxDriftM = null;
    this.lastPosition = null;
    this.hasBeenActive = false;
    this.inLost = false;
    this.lostStartMs = 0;
  }

  recordFrame(pose: CameraPose | null, atMs?: number): void {
    const t = atMs ?? pose?.timestamp ?? this.now();
    if (pose !== null) {
      this.frameTimes.push(t);
      if (this.initTimeMs === null && this.sessionStartMs !== null) {
        this.initTimeMs = t - this.sessionStartMs;
      }
      if (this.lastPosition !== null) {
        const d = distance3(this.lastPosition, pose.position);
        if (this.maxDriftM === null || d > this.maxDriftM) {
          this.maxDriftM = d;
        }
      }
      this.lastPosition = {
        x: pose.position.x,
        y: pose.position.y,
        z: pose.position.z,
      };
      if (this.inLost) {
        this.recoveries += 1;
        const lostMs = t - this.lostStartMs;
        if (lostMs > 0) {
          this.totalLostMs += lostMs;
        }
        this.inLost = false;
      }
      this.hasBeenActive = true;
    } else {
      if (this.hasBeenActive && !this.inLost) {
        this.lossCount += 1;
        this.inLost = true;
        this.lostStartMs = t;
      }
    }
  }

  getReport(): TrackingMetricsReport {
    const frames = this.frameTimes.length;
    let avgFps = 0;
    let minFps = 0;
    if (frames >= 2) {
      const fpsValues: number[] = [];
      for (let i = 1; i < this.frameTimes.length; i++) {
        const delta = this.frameTimes[i] - this.frameTimes[i - 1];
        if (delta > 0) {
          fpsValues.push(1000 / delta);
        }
      }
      if (fpsValues.length > 0) {
        const sum = fpsValues.reduce((a, b) => a + b, 0);
        avgFps = sum / fpsValues.length;
        minFps = Math.min(...fpsValues);
      }
    }
    return {
      sessionMs: this.sessionStartMs === null ? 0 : this.now() - this.sessionStartMs,
      initTimeMs: this.initTimeMs,
      frames,
      avgFps,
      minFps,
      lossCount: this.lossCount,
      totalLostMs: this.totalLostMs,
      recoveries: this.recoveries,
      maxDriftM: this.maxDriftM,
    };
  }

  toJSON(): string {
    return JSON.stringify(this.getReport());
  }
}
