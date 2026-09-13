import { MockTrackingProvider } from './TrackingProvider';
import type { CameraPose } from './TrackingProvider';

/** Stage-one rendering demo only. Device movement does not change this pose. */
export class SimulationTrackingProvider extends MockTrackingProvider {
  override async start(): Promise<void> {
    if (this.getState() !== 'STOPPED') return;
    await super.start();
    if (this.getState() !== 'INITIALIZING') return;
    this.setPose({
      position: { x: 0, y: 0, z: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      timestamp: Date.now(),
      featureCount: 0,
      trackingFps: 0,
    });
    this.setState('ACTIVE');
  }

  override getPose(): CameraPose | null {
    const pose = super.getPose();
    return pose ? { ...pose, timestamp: Date.now() } : null;
  }
}
