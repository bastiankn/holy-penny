import type {
  CameraPose,
  TrackingProvider,
  TrackingState,
  TrackingStateListener,
} from './TrackingProvider';

export interface AlvaRuntime {
  findCameraPose(frame: ImageData): ArrayLike<number> | null;
  getFramePoints(): Array<{ x: number; y: number }>;
  reset(): void;
}

interface AlvaModule {
  AlvaAR?: {
    Initialize(width: number, height: number, fov?: number): Promise<AlvaRuntime>;
  };
}

export type VideoSource = HTMLVideoElement | null | (() => HTMLVideoElement | null);

export interface AlvaTrackingProviderOptions {
  trackingWidth?: number;
  trackingHeight?: number;
  fieldOfView?: number;
  targetFps?: number;
  moduleUrl?: string;
  onPose?: (pose: CameraPose) => void;
  runtimeLoader?: (
    width: number,
    height: number,
    fieldOfView: number,
    moduleUrl: string
  ) => Promise<AlvaRuntime>;
  canvasFactory?: () => HTMLCanvasElement;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (handle: number) => void;
  now?: () => number;
}

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 480;
const DEFAULT_FOV = 45;
const DEFAULT_FPS = 30;

function copyPose(pose: CameraPose): CameraPose {
  return {
    position: { ...pose.position },
    quaternion: { ...pose.quaternion },
    timestamp: pose.timestamp,
    featureCount: pose.featureCount,
    trackingFps: pose.trackingFps,
  };
}

function positiveNumber(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Vertical projection angle produced by AlvaAR's intrinsic-camera calculation. */
export function alvaVerticalFieldOfView(width: number, height: number, fieldOfView = 45): number {
  const aspect = width / height;
  const horizontalFov = width > height ? fieldOfView * aspect : fieldOfView;
  const verticalFov = width > height ? fieldOfView : fieldOfView * aspect;
  const degreesToRadians = Math.PI / 180;
  const fx = (width * 0.5) / Math.tan(horizontalFov * 0.5 * degreesToRadians);
  const fy = (height * 0.5) / Math.tan(verticalFov * 0.5 * degreesToRadians);
  const focalLength = Math.min(fx, fy);
  return (2 * Math.atan((height * 0.5) / focalLength)) / degreesToRadians;
}

function runtimeAssetUrl(): string {
  if (typeof document === 'undefined') {
    return '/vendor/alvaar/alva_ar.js';
  }
  return new URL('vendor/alvaar/alva_ar.js', document.baseURI).toString();
}

async function loadRuntime(
  width: number,
  height: number,
  fieldOfView: number,
  moduleUrl: string
): Promise<AlvaRuntime> {
  const module = (await import(/* @vite-ignore */ moduleUrl)) as AlvaModule;
  if (typeof module.AlvaAR?.Initialize !== 'function') {
    throw new Error('AlvaAR module does not export AlvaAR.Initialize');
  }
  return module.AlvaAR.Initialize(width, height, fieldOfView);
}

/** Uses the same axis mapping as AlvaAR's official Three.js connector. */
export function alvaMatrixToCameraPose(
  matrix: ArrayLike<number>,
  timestamp: number,
  featureCount: number,
  trackingFps: number
): CameraPose {
  if (matrix.length < 16) {
    throw new Error('AlvaAR returned an invalid camera matrix');
  }

  const m11 = Number(matrix[0]);
  const m12 = Number(matrix[4]);
  const m13 = Number(matrix[8]);
  const m21 = Number(matrix[1]);
  const m22 = Number(matrix[5]);
  const m23 = Number(matrix[9]);
  const m31 = Number(matrix[2]);
  const m32 = Number(matrix[6]);
  const m33 = Number(matrix[10]);
  const trace = m11 + m22 + m33;

  let x: number;
  let y: number;
  let z: number;
  let w: number;
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1);
    w = 0.25 / s;
    x = (m32 - m23) * s;
    y = (m13 - m31) * s;
    z = (m21 - m12) * s;
  } else if (m11 > m22 && m11 > m33) {
    const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
    w = (m32 - m23) / s;
    x = 0.25 * s;
    y = (m12 + m21) / s;
    z = (m13 + m31) / s;
  } else if (m22 > m33) {
    const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
    w = (m13 - m31) / s;
    x = (m12 + m21) / s;
    y = 0.25 * s;
    z = (m23 + m32) / s;
  } else {
    const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
    w = (m21 - m12) / s;
    x = (m13 + m31) / s;
    y = (m23 + m32) / s;
    z = 0.25 * s;
  }

  return {
    position: {
      x: Number(matrix[12]),
      y: -Number(matrix[13]),
      z: -Number(matrix[14]),
    },
    quaternion: { x: -x, y, z, w },
    timestamp,
    featureCount,
    trackingFps,
  };
}

export class AlvaTrackingProvider implements TrackingProvider {
  private state: TrackingState = 'STOPPED';
  private pose: CameraPose | null = null;
  private readonly listeners = new Set<TrackingStateListener>();
  private readonly videoSource: VideoSource;
  private readonly width: number;
  private readonly height: number;
  private readonly fieldOfView: number;
  private readonly targetFps: number;
  private readonly moduleUrl: string;
  private readonly onPose?: (pose: CameraPose) => void;
  private readonly runtimeLoader: NonNullable<AlvaTrackingProviderOptions['runtimeLoader']>;
  private readonly canvasFactory: () => HTMLCanvasElement;
  private readonly requestFrame: (callback: FrameRequestCallback) => number;
  private readonly cancelFrame: (handle: number) => void;
  private readonly now: () => number;
  private runtime: AlvaRuntime | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private video: HTMLVideoElement | null = null;
  private animationFrameId = 0;
  private generation = 0;
  private lastProcessedAt = Number.NEGATIVE_INFINITY;
  private processedFrameTimes: number[] = [];
  private fps = 0;
  private featureCount = 0;
  private hasTracked = false;

  constructor(videoSource: VideoSource, options: AlvaTrackingProviderOptions = {}) {
    this.videoSource = videoSource;
    this.width = Math.round(positiveNumber(options.trackingWidth, DEFAULT_WIDTH));
    this.height = Math.round(positiveNumber(options.trackingHeight, DEFAULT_HEIGHT));
    this.fieldOfView = positiveNumber(options.fieldOfView, DEFAULT_FOV);
    this.targetFps = positiveNumber(options.targetFps, DEFAULT_FPS);
    this.moduleUrl = options.moduleUrl ?? runtimeAssetUrl();
    this.onPose = options.onPose;
    this.runtimeLoader = options.runtimeLoader ?? loadRuntime;
    this.canvasFactory = options.canvasFactory ?? (() => document.createElement('canvas'));
    this.requestFrame = options.requestFrame ?? ((callback) => requestAnimationFrame(callback));
    this.cancelFrame = options.cancelFrame ?? ((handle) => cancelAnimationFrame(handle));
    this.now = options.now ?? (() => performance.now());
  }

  async start(): Promise<void> {
    if (this.state !== 'STOPPED') {
      return;
    }

    const generation = ++this.generation;
    this.setState('INITIALIZING');
    this.pose = null;
    this.hasTracked = false;
    this.processedFrameTimes = [];
    this.fps = 0;
    this.featureCount = 0;

    try {
      const video = this.resolveVideo();
      if (video === null) {
        throw new Error('AlvaAR tracking requires a live camera video element');
      }
      await this.waitForVideo(video, generation);
      if (generation !== this.generation || this.state === 'STOPPED') {
        return;
      }

      this.video = video;
      const canvas = this.canvasFactory();
      canvas.width = this.width;
      canvas.height = this.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context === null) {
        throw new Error('AlvaAR tracking could not create a 2D frame buffer');
      }
      this.context = context;
      this.runtime =
        this.runtime ??
        (await this.runtimeLoader(this.width, this.height, this.fieldOfView, this.moduleUrl));
      if (generation !== this.generation || this.state === 'STOPPED') {
        return;
      }
      this.scheduleFrame();
    } catch (error) {
      if (generation === this.generation) {
        this.stop();
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Unable to start AlvaAR tracking: ${message}`);
    }
  }

  stop(): void {
    this.generation += 1;
    if (this.animationFrameId !== 0) {
      this.cancelFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
    try {
      this.runtime?.reset();
    } catch {
      // A failed reset must not prevent camera/session cleanup.
    }
    this.context = null;
    this.video = null;
    this.pose = null;
    this.hasTracked = false;
    this.processedFrameTimes = [];
    this.fps = 0;
    this.featureCount = 0;
    this.setState('STOPPED');
  }

  getPose(): CameraPose | null {
    return this.state === 'ACTIVE' && this.pose !== null ? copyPose(this.pose) : null;
  }

  getState(): TrackingState {
    return this.state;
  }

  onStateChange(callback: TrackingStateListener): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  getFps(): number {
    return this.fps;
  }

  getFeatureCount(): number {
    return this.featureCount;
  }

  getTrackingSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  getVerticalFieldOfView(): number {
    return alvaVerticalFieldOfView(this.width, this.height, this.fieldOfView);
  }

  private resolveVideo(): HTMLVideoElement | null {
    return typeof this.videoSource === 'function' ? this.videoSource() : this.videoSource;
  }

  private async waitForVideo(video: HTMLVideoElement, generation: number): Promise<void> {
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error('camera did not produce a video frame within 5 seconds'));
      }, 5000);
      const ready = (): void => {
        if (generation !== this.generation) {
          cleanup();
          resolve();
        } else if (video.videoWidth > 0 && video.videoHeight > 0) {
          cleanup();
          resolve();
        }
      };
      const cleanup = (): void => {
        window.clearTimeout(timeout);
        video.removeEventListener('loadedmetadata', ready);
        video.removeEventListener('canplay', ready);
        video.removeEventListener('resize', ready);
      };
      video.addEventListener('loadedmetadata', ready);
      video.addEventListener('canplay', ready);
      video.addEventListener('resize', ready);
    });
  }

  private scheduleFrame(): void {
    this.animationFrameId = this.requestFrame((timestamp) => {
      this.animationFrameId = 0;
      this.processFrame(timestamp);
      if (this.state !== 'STOPPED') {
        this.scheduleFrame();
      }
    });
  }

  private processFrame(timestamp: number): void {
    const runtime = this.runtime;
    const context = this.context;
    const video = this.video;
    if (runtime === null || context === null || video === null) {
      return;
    }
    if (timestamp - this.lastProcessedAt < 1000 / this.targetFps) {
      return;
    }
    this.lastProcessedAt = timestamp;

    try {
      const scale = Math.max(this.width / video.videoWidth, this.height / video.videoHeight);
      const drawWidth = video.videoWidth * scale;
      const drawHeight = video.videoHeight * scale;
      context.drawImage(
        video,
        (this.width - drawWidth) / 2,
        (this.height - drawHeight) / 2,
        drawWidth,
        drawHeight
      );
      const frame = context.getImageData(0, 0, this.width, this.height);
      const rawPose = runtime.findCameraPose(frame);
      this.featureCount = runtime.getFramePoints().length;
      this.recordProcessedFrame(timestamp);

      if (rawPose === null) {
        this.pose = null;
        this.setState(this.hasTracked ? 'LOST' : 'INITIALIZING');
        return;
      }

      this.hasTracked = true;
      const pose = alvaMatrixToCameraPose(rawPose, this.now(), this.featureCount, this.fps);
      this.pose = pose;
      this.setState('ACTIVE');
      try {
        this.onPose?.(copyPose(pose));
      } catch {
        // Consumer callbacks cannot interrupt the tracking loop.
      }
    } catch {
      this.pose = null;
      this.setState(this.hasTracked ? 'LOST' : 'INITIALIZING');
    }
  }

  private recordProcessedFrame(timestamp: number): void {
    this.processedFrameTimes.push(timestamp);
    const cutoff = timestamp - 1000;
    while (this.processedFrameTimes.length > 0 && this.processedFrameTimes[0] < cutoff) {
      this.processedFrameTimes.shift();
    }
    if (this.processedFrameTimes.length < 2) {
      this.fps = this.processedFrameTimes.length;
      return;
    }
    const elapsed = timestamp - this.processedFrameTimes[0];
    this.fps =
      elapsed > 0 ? Math.round(((this.processedFrameTimes.length - 1) * 1000) / elapsed) : 0;
  }

  private setState(next: TrackingState): void {
    if (next === this.state) {
      return;
    }
    this.state = next;
    for (const listener of this.listeners) {
      try {
        listener(next);
      } catch {
        // One observer cannot prevent other state observers from being notified.
      }
    }
  }
}
