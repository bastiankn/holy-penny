import { TrackingMetrics } from './trackingMetrics';
import type { CameraPose } from '../tracking/TrackingProvider';

function makePose(x = 0, y = 0, z = 0, timestamp = 0, extra: Partial<CameraPose> = {}): CameraPose {
  return {
    position: { x, y, z },
    quaternion: { x: 0, y: 0, z: 0, w: 1 },
    timestamp,
    featureCount: 10,
    trackingFps: 30,
    ...extra,
  };
}

describe('TrackingMetrics', () => {
  it('empty session is safe and toJSON parses', () => {
    const m = new TrackingMetrics(() => 1000);
    const r = m.getReport();
    expect(r.frames).toBe(0);
    expect(r.avgFps).toBe(0);
    expect(r.minFps).toBe(0);
    expect(r.initTimeMs).toBeNull();
    expect(r.lossCount).toBe(0);
    expect(r.totalLostMs).toBe(0);
    expect(r.recoveries).toBe(0);
    expect(r.maxDriftM).toBeNull();
    expect(() => JSON.parse(m.toJSON())).not.toThrow();
    expect(JSON.parse(m.toJSON())).toEqual(r);
  });

  it('initTimeMs is first ACTIVE timestamp minus startSession', () => {
    let now = 1000;
    const m = new TrackingMetrics(() => now);
    m.startSession();
    now = 1500;
    m.recordFrame(makePose(0, 0, 0, 1500), 1500);
    expect(m.getReport().initTimeMs).toBe(500);
    // Second frame does not change init time
    m.recordFrame(makePose(1, 0, 0, 1600), 1600);
    expect(m.getReport().initTimeMs).toBe(500);
  });

  it('computes FPS from inter-frame deltas of non-null frames', () => {
    const m = new TrackingMetrics(() => 0);
    m.startSession();
    m.recordFrame(makePose(0, 0, 0, 0), 0);
    m.recordFrame(makePose(0, 0, 0, 100), 100);
    m.recordFrame(makePose(0, 0, 0, 200), 200);
    const r = m.getReport();
    expect(r.frames).toBe(3);
    expect(r.avgFps).toBeCloseTo(10, 5);
    expect(r.minFps).toBeCloseTo(10, 5);
  });

  it('single frame yields zero fps', () => {
    const m = new TrackingMetrics(() => 0);
    m.startSession();
    m.recordFrame(makePose(0, 0, 0, 0), 0);
    const r = m.getReport();
    expect(r.frames).toBe(1);
    expect(r.avgFps).toBe(0);
    expect(r.minFps).toBe(0);
  });

  it('null-run counts as loss and null-to-active as recovery', () => {
    const m = new TrackingMetrics(() => 0);
    m.startSession();
    m.recordFrame(makePose(0, 0, 0, 0), 0);
    m.recordFrame(null, 100);
    m.recordFrame(null, 200);
    m.recordFrame(makePose(0, 0, 0, 350), 350);
    const r = m.getReport();
    expect(r.lossCount).toBe(1);
    expect(r.recoveries).toBe(1);
    expect(r.totalLostMs).toBe(250);
  });

  it('leading nulls before first ACTIVE do not count as loss', () => {
    const m = new TrackingMetrics(() => 0);
    m.startSession();
    m.recordFrame(null, 0);
    m.recordFrame(null, 100);
    m.recordFrame(makePose(0, 0, 0, 200), 200);
    const r = m.getReport();
    expect(r.lossCount).toBe(0);
    expect(r.recoveries).toBe(0);
    expect(r.frames).toBe(1);
  });

  it('tracks max drift between consecutive ACTIVE positions', () => {
    const m = new TrackingMetrics(() => 0);
    m.startSession();
    m.recordFrame(makePose(0, 0, 0, 0), 0);
    expect(m.getReport().maxDriftM).toBeNull();
    m.recordFrame(makePose(1, 0, 0, 100), 100);
    expect(m.getReport().maxDriftM).toBeCloseTo(1, 10);
    m.recordFrame(makePose(4, 4, 0, 200), 200);
    expect(m.getReport().maxDriftM).toBeCloseTo(5, 10);
    // Null frames do not reset drift baseline: next ACTIVE compares to last ACTIVE
    m.recordFrame(null, 300);
    m.recordFrame(makePose(4, 4, 0, 400), 400);
    expect(m.getReport().maxDriftM).toBeCloseTo(5, 10);
  });

  it('reset clears all state', () => {
    const m = new TrackingMetrics(() => 0);
    m.startSession();
    m.recordFrame(makePose(0, 0, 0, 0), 0);
    m.recordFrame(null, 100);
    m.recordFrame(makePose(1, 0, 0, 200), 200);
    m.reset();
    const r = m.getReport();
    expect(r.frames).toBe(0);
    expect(r.initTimeMs).toBeNull();
    expect(r.lossCount).toBe(0);
    expect(r.recoveries).toBe(0);
    expect(r.totalLostMs).toBe(0);
    expect(r.maxDriftM).toBeNull();
  });
});
