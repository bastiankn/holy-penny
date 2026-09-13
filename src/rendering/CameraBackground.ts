/** Screen-aligned camera feed behind the transparent WebGL canvas. */
export class CameraBackground {
  constructor(private readonly video: HTMLVideoElement) {
    video.dataset.testid = 'camera-background';
    Object.assign(video.style, {
      display: 'block',
      position: 'fixed',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      zIndex: '0',
      pointerEvents: 'none',
    });
  }

  hide(): void {
    this.video.style.display = 'none';
  }
}
