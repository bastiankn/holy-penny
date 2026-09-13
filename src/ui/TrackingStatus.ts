// Lane A owns src/tracking/TrackingProvider.ts in parallel.
// To avoid a hard dependency, the state union is defined inline here.
// It must stay in sync with Lane A's TrackingState.
export type TrackingState = 'INITIALIZING' | 'ACTIVE' | 'LOST' | 'STOPPED';

export interface TrackingInfo {
  fps?: number;
  featureCount?: number;
  position?: { x: number; y: number; z: number };
}

export class TrackingStatus {
  readonly element: HTMLElement;
  private stateElement: HTMLElement;
  private detailElement: HTMLElement;
  private destroyed = false;
  private readonly simulated: boolean;

  constructor(root?: HTMLElement, opts?: { simulated?: boolean; buildCommit?: string }) {
    this.simulated = opts?.simulated ?? false;
    this.element = root ?? document.createElement('div');
    const isOwnRoot = root === undefined;
    this.element.setAttribute('data-testid', 'tracking-status');
    this.element.setAttribute('data-state', 'INITIALIZING');
    this.element.style.position = 'fixed';
    this.element.style.left = '0';
    this.element.style.right = '0';
    this.element.style.bottom = '0';
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.alignItems = 'flex-start';
    this.element.style.gap = '4px';
    this.element.style.paddingLeft = 'env(safe-area-inset-left, 0px)';
    this.element.style.paddingRight = 'env(safe-area-inset-right, 0px)';
    this.element.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    this.element.style.margin = '8px';
    this.element.style.zIndex = '500';
    this.element.style.pointerEvents = 'none';
    this.element.style.fontFamily = 'Arial, sans-serif';
    this.element.style.fontSize = '0.8rem';

    this.stateElement = document.createElement('div');
    this.stateElement.setAttribute('data-testid', 'tracking-state');
    this.stateElement.textContent = 'Tracking: INITIALIZING';
    this.stateElement.style.color = 'white';
    this.stateElement.style.backgroundColor = 'rgba(0, 0, 0, 0.55)';
    this.stateElement.style.padding = '6px 10px';
    this.stateElement.style.borderRadius = '6px';

    this.detailElement = document.createElement('div');
    this.detailElement.setAttribute('data-testid', 'tracking-detail');
    this.detailElement.style.color = 'white';
    this.detailElement.style.backgroundColor = 'rgba(0, 0, 0, 0.55)';
    this.detailElement.style.padding = '6px 10px';
    this.detailElement.style.borderRadius = '6px';
    this.detailElement.style.display = 'none';

    if (opts?.buildCommit) {
      const build = document.createElement('div');
      build.textContent = `Build ${opts.buildCommit}`;
      build.dataset.testid = 'build-commit';
      build.style.cssText = 'color: white; background: #222; padding: 6px 10px; border-radius: 6px';
      this.element.appendChild(build);
    }
    this.element.appendChild(this.stateElement);
    this.element.appendChild(this.detailElement);

    if (isOwnRoot && !this.element.parentNode) {
      document.body.appendChild(this.element);
    }
  }

  setTracking(s: TrackingState, info?: TrackingInfo): void {
    if (this.destroyed) {
      return;
    }
    this.element.setAttribute('data-state', s);
    this.stateElement.textContent = this.simulated
      ? `SIMULATED: ${s} — room tracking not connected`
      : `Tracking: ${s}`;

    if (s === 'LOST') {
      this.element.classList.add('warning');
    } else {
      this.element.classList.remove('warning');
    }

    const parts: string[] = [];
    if (info?.fps !== undefined) {
      parts.push(`FPS: ${info.fps}`);
    }
    if (info?.featureCount !== undefined) {
      parts.push(`Features: ${info.featureCount}`);
    }
    if (info?.position !== undefined) {
      const p = info.position;
      parts.push(`Pose: (${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`);
    }

    if (parts.length > 0) {
      this.detailElement.textContent = parts.join(' | ');
      this.detailElement.style.display = 'block';
    } else {
      this.detailElement.textContent = '';
      this.detailElement.style.display = 'none';
    }
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
