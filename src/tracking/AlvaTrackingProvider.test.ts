import {
  AlvaTrackingProvider,
  alvaMatrixToCameraPose,
  alvaVerticalFieldOfView,
  type AlvaRuntime,
} from './AlvaTrackingProvider';

const IDENTITY_POSE = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 2, 3, 4, 1]);

function readyVideo(width = 1280, height = 720): HTMLVideoElement {
  const video = document.createElement('video');
  Object.defineProperty(video, 'videoWidth', { configurable: true, value: width });
  Object.defineProperty(video, 'videoHeight', { configurable: true, value: height });
  return video;
}

function harness(poses: Array<ArrayLike<number> | null> = [null]) {
  let scheduled: FrameRequestCallback | null = null;
  const drawImage = jest.fn();
  const getImageData = jest.fn().mockReturnValue({ data: new Uint8ClampedArray(640 * 480 * 4) });
  const context = { drawImage, getImageData } as unknown as CanvasRenderingContext2D;
  const canvas = document.createElement('canvas');
  jest.spyOn(canvas, 'getContext').mockReturnValue(context);
  const runtime: AlvaRuntime = {
    findCameraPose: jest.fn(() => poses.shift() ?? null),
    getFramePoints: jest.fn(() => [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ]),
    reset: jest.fn(),
  };
  const runtimeLoader = jest.fn().mockResolvedValue(runtime);
  const requestFrame = jest.fn((callback: FrameRequestCallback) => {
    scheduled = callback;
    return 17;
  });
  const cancelFrame = jest.fn();
  const provider = new AlvaTrackingProvider(readyVideo(), {
    runtimeLoader,
    canvasFactory: () => canvas,
    requestFrame,
    cancelFrame,
    now: () => 1234,
  });
  const frame = (timestamp: number): void => {
    const callback = scheduled as FrameRequestCallback | null;
    if (callback === null) throw new Error('No tracking frame was scheduled');
    scheduled = null;
    callback(timestamp);
  };
  return {
    provider,
    runtime,
    runtimeLoader,
    requestFrame,
    cancelFrame,
    drawImage,
    getImageData,
    frame,
  };
}

describe('alvaMatrixToCameraPose', () => {
  it('matches the official connector axis mapping', () => {
    const pose = alvaMatrixToCameraPose(IDENTITY_POSE, 99, 8, 30);
    expect(pose).toEqual({
      position: { x: 2, y: -3, z: -4 },
      quaternion: { x: -0, y: 0, z: 0, w: 1 },
      timestamp: 99,
      featureCount: 8,
      trackingFps: 30,
    });
  });

  it('rejects a truncated matrix', () => {
    expect(() => alvaMatrixToCameraPose([1, 0, 0], 0, 0, 0)).toThrow('invalid camera matrix');
  });
});

describe('alvaVerticalFieldOfView', () => {
  it('matches AlvaAR camera intrinsics for portrait and landscape buffers', () => {
    expect(alvaVerticalFieldOfView(480, 640, 45)).toBeCloseTo(57.82, 1);
    expect(alvaVerticalFieldOfView(640, 480, 45)).toBeCloseTo(46.83, 1);
  });
});

describe('AlvaTrackingProvider', () => {
  it('loads Alva at the reduced tracking resolution and waits for real poses', async () => {
    const h = harness([null]);
    const states: string[] = [];
    h.provider.onStateChange((state) => states.push(state));

    await h.provider.start();

    expect(h.runtimeLoader).toHaveBeenCalledWith(
      640,
      480,
      45,
      expect.stringContaining('/vendor/alvaar/alva_ar.js')
    );
    expect(h.provider.getState()).toBe('INITIALIZING');
    expect(h.provider.getPose()).toBeNull();
    h.frame(0);
    expect(h.provider.getState()).toBe('INITIALIZING');
    expect(h.provider.getFeatureCount()).toBe(2);
    expect(states).toEqual(['INITIALIZING']);
    h.provider.stop();
  });

  it('publishes an ACTIVE pose, then reports LOST and recovers', async () => {
    const h = harness([IDENTITY_POSE, null, IDENTITY_POSE]);
    const states: string[] = [];
    h.provider.onStateChange((state) => states.push(state));
    await h.provider.start();

    h.frame(0);
    const first = h.provider.getPose();
    expect(h.provider.getState()).toBe('ACTIVE');
    expect(first?.position).toEqual({ x: 2, y: -3, z: -4 });
    expect(first?.featureCount).toBe(2);
    if (first !== null) first.position.x = 999;
    expect(h.provider.getPose()?.position.x).toBe(2);

    h.frame(40);
    expect(h.provider.getState()).toBe('LOST');
    expect(h.provider.getPose()).toBeNull();
    h.frame(80);
    expect(h.provider.getState()).toBe('ACTIVE');
    expect(states).toEqual(['INITIALIZING', 'ACTIVE', 'LOST', 'ACTIVE']);
    h.provider.stop();
  });

  it('cover-crops the video and throttles processing to the target FPS', async () => {
    const h = harness([null, null]);
    await h.provider.start();

    h.frame(0);
    h.frame(10);
    h.frame(40);

    expect(h.runtime.findCameraPose).toHaveBeenCalledTimes(2);
    expect(h.getImageData).toHaveBeenCalledWith(0, 0, 640, 480);
    expect(h.drawImage).toHaveBeenCalledWith(
      expect.any(HTMLVideoElement),
      -106.66666666666663,
      0,
      853.3333333333333,
      480
    );
    h.provider.stop();
  });

  it('stops the frame loop, resets Alva and clears metrics', async () => {
    const h = harness([IDENTITY_POSE]);
    await h.provider.start();
    h.frame(0);
    h.provider.stop();

    expect(h.cancelFrame).toHaveBeenCalledWith(17);
    expect(h.runtime.reset).toHaveBeenCalledTimes(1);
    expect(h.provider.getState()).toBe('STOPPED');
    expect(h.provider.getPose()).toBeNull();
    expect(h.provider.getFps()).toBe(0);
    expect(h.provider.getFeatureCount()).toBe(0);
  });

  it('rejects missing video instead of fabricating a pose', async () => {
    const provider = new AlvaTrackingProvider(null);
    await expect(provider.start()).rejects.toThrow('requires a live camera video element');
    expect(provider.getState()).toBe('STOPPED');
    expect(provider.getPose()).toBeNull();
  });

  it('surfaces runtime initialization failures', async () => {
    const provider = new AlvaTrackingProvider(readyVideo(), {
      runtimeLoader: jest.fn().mockRejectedValue(new Error('WASM compile failed')),
      canvasFactory: () => {
        const canvas = document.createElement('canvas');
        jest.spyOn(canvas, 'getContext').mockReturnValue({} as CanvasRenderingContext2D);
        return canvas;
      },
    });
    await expect(provider.start()).rejects.toThrow('WASM compile failed');
    expect(provider.getState()).toBe('STOPPED');
  });
});
