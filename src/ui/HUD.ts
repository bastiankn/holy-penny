export interface HUDOptions {
  onRestart?: () => void;
  total?: number;
  simulated?: boolean;
}

export class HUD {
  readonly element: HTMLElement;
  private scoreElement: HTMLElement;
  private distanceElement: HTMLElement;
  private promptElement: HTMLElement;
  private finishedElement: HTMLElement;
  private restartButton: HTMLButtonElement;
  private total: number;
  private readonly simulated: boolean;
  private destroyed = false;
  private handleRestart: () => void;

  constructor(root?: HTMLElement, opts?: HUDOptions) {
    this.total = opts?.total ?? 1;
    this.simulated = opts?.simulated ?? false;
    this.handleRestart = () => {
      opts?.onRestart?.();
    };

    this.element = root ?? document.createElement('div');
    const isOwnRoot = root === undefined;
    this.element.setAttribute('data-testid', 'hud');
    this.element.style.position = 'fixed';
    this.element.style.top = '0';
    this.element.style.left = '0';
    this.element.style.right = '0';
    this.element.style.display = 'flex';
    this.element.style.flexDirection = 'column';
    this.element.style.alignItems = 'center';
    this.element.style.gap = '8px';
    this.element.style.paddingTop = 'env(safe-area-inset-top, 0px)';
    this.element.style.paddingLeft = 'env(safe-area-inset-left, 0px)';
    this.element.style.paddingRight = 'env(safe-area-inset-right, 0px)';
    this.element.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
    this.element.style.zIndex = '500';
    this.element.style.pointerEvents = 'none';
    this.element.style.fontFamily = 'Arial, sans-serif';

    this.scoreElement = document.createElement('div');
    this.scoreElement.setAttribute('data-testid', 'hud-score');
    this.scoreElement.style.color = 'white';
    this.scoreElement.style.backgroundColor = 'rgba(0, 0, 0, 0.55)';
    this.scoreElement.style.padding = '8px 12px';
    this.scoreElement.style.borderRadius = '8px';
    this.scoreElement.style.fontWeight = 'bold';

    this.distanceElement = document.createElement('div');
    this.distanceElement.setAttribute('data-testid', 'hud-distance');
    this.distanceElement.style.color = 'white';
    this.distanceElement.style.backgroundColor = 'rgba(0, 0, 0, 0.55)';
    this.distanceElement.style.padding = '8px 12px';
    this.distanceElement.style.borderRadius = '8px';

    this.promptElement = document.createElement('div');
    this.promptElement.setAttribute('data-testid', 'hud-collect-prompt');
    this.promptElement.textContent = 'Coin nearby — move closer to collect';
    this.promptElement.style.color = '#1a1a1a';
    this.promptElement.style.backgroundColor = '#ffd54f';
    this.promptElement.style.padding = '10px 14px';
    this.promptElement.style.borderRadius = '10px';
    this.promptElement.style.fontWeight = 'bold';
    this.promptElement.style.display = 'none';

    this.finishedElement = document.createElement('div');
    this.finishedElement.setAttribute('data-testid', 'hud-finished');
    this.finishedElement.textContent = 'Finished! All coins collected';
    this.finishedElement.style.color = 'white';
    this.finishedElement.style.backgroundColor = 'rgba(46, 125, 50, 0.9)';
    this.finishedElement.style.padding = '10px 14px';
    this.finishedElement.style.borderRadius = '10px';
    this.finishedElement.style.fontWeight = 'bold';
    this.finishedElement.style.display = 'none';

    this.restartButton = document.createElement('button');
    this.restartButton.setAttribute('data-testid', 'hud-restart');
    this.restartButton.textContent = 'Restart';
    this.restartButton.style.minWidth = '44px';
    this.restartButton.style.minHeight = '44px';
    this.restartButton.style.padding = '12px 20px';
    this.restartButton.style.fontSize = '1rem';
    this.restartButton.style.borderRadius = '8px';
    this.restartButton.style.border = 'none';
    this.restartButton.style.backgroundColor = '#4CAF50';
    this.restartButton.style.color = 'white';
    this.restartButton.style.cursor = 'pointer';
    this.restartButton.style.pointerEvents = 'auto';
    this.restartButton.style.touchAction = 'manipulation';
    this.restartButton.addEventListener('click', this.handleRestart);

    this.element.appendChild(this.scoreElement);
    this.element.appendChild(this.distanceElement);
    this.element.appendChild(this.promptElement);
    this.element.appendChild(this.finishedElement);
    this.element.appendChild(this.restartButton);

    this.setScore(0, this.total);
    this.setDistance(null);
    this.setCollectPrompt(false);

    if (isOwnRoot && !this.element.parentNode) {
      document.body.appendChild(this.element);
    }
  }

  setScore(collected: number, total: number): void {
    if (this.destroyed) {
      return;
    }
    this.total = total;
    this.scoreElement.textContent = `COINS ${collected}/${total}`;
  }

  setDistance(m: number | null): void {
    if (this.destroyed) {
      return;
    }
    if (m === null || Number.isNaN(m)) {
      this.distanceElement.textContent = '—';
    } else {
      this.distanceElement.textContent = `COIN ${m.toFixed(2)} ${this.simulated ? 'demo units' : 'm'}`;
    }
  }

  setCollectPrompt(visible: boolean): void {
    if (this.destroyed) {
      return;
    }
    this.promptElement.style.display = visible ? 'block' : 'none';
  }

  showFinished(): void {
    if (this.destroyed) {
      return;
    }
    this.finishedElement.style.display = 'block';
  }

  reset(): void {
    if (this.destroyed) {
      return;
    }
    this.setScore(0, this.total);
    this.setDistance(null);
    this.setCollectPrompt(false);
    this.finishedElement.style.display = 'none';
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.restartButton.removeEventListener('click', this.handleRestart);
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}
