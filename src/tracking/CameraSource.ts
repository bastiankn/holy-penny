/**
 * CameraSource - Handles camera access via getUserMedia
 * Part of Phase 2: Camera Implementation
 */
export type CameraStream = MediaStream | null;

export interface CameraSourceOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment' | 'left' | 'right';
}

export interface CameraSourceState {
  hasPermission: boolean;
  isStreaming: boolean;
  error: Error | null;
  stream: CameraStream;
}

export class CameraSource {
  private stream: CameraStream = null;
  private videoElement: HTMLVideoElement | null = null;
  private options: CameraSourceOptions;
  private state: CameraSourceState = {
    hasPermission: false,
    isStreaming: false,
    error: null,
    stream: null,
  };

  constructor(options: CameraSourceOptions = {}) {
    this.options = {
      video: true,
      audio: false,
      width: 1280,
      height: 720,
      facingMode: 'environment',
      ...options,
    };
  }

  /**
   * Get the current state of the camera source
   */
  getState(): CameraSourceState {
    return { ...this.state };
  }

  /**
   * Get the video element (creates one if it doesn't exist)
   */
  getVideoElement(): HTMLVideoElement {
    if (!this.videoElement) {
      this.videoElement = document.createElement('video');
      this.videoElement.playsInline = true;
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      this.videoElement.style.display = 'none';
      document.body.appendChild(this.videoElement);
    }
    return this.videoElement;
  }

  /**
   * Request camera permission and start streaming
   */
  async start(): Promise<CameraStream> {
    try {
      // Clear any previous error
      this.state.error = null;

      // Get video element
      const video = this.getVideoElement();

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: this.options.video,
        audio: this.options.audio,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Set up video element
      video.srcObject = this.stream;
      await video.play();

      // Update state
      this.state = {
        hasPermission: true,
        isStreaming: true,
        error: null,
        stream: this.stream,
      };

      return this.stream;
    } catch (error) {
      const err = error as Error;
      this.state = {
        hasPermission: false,
        isStreaming: false,
        error: err,
        stream: null,
      };
      throw err;
    }
  }

  /**
   * Stop the camera stream
   */
  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      if (this.videoElement.parentNode) {
        this.videoElement.parentNode.removeChild(this.videoElement);
      }
      this.videoElement = null;
    }

    this.state = {
      hasPermission: false,
      isStreaming: false,
      error: null,
      stream: null,
    };
  }

  /**
   * Get the current stream
   */
  getStream(): CameraStream {
    return this.stream;
  }

  /**
   * Check if camera is currently streaming
   */
  isStreaming(): boolean {
    return this.state.isStreaming;
  }

  /**
   * Check if we have camera permission
   */
  hasPermission(): boolean {
    return this.state.hasPermission;
  }

  /**
   * Get the video element dimensions
   */
  getDimensions(): { width: number; height: number } {
    const video = this.getVideoElement();
    return {
      width: video.videoWidth || this.options.width || 1280,
      height: video.videoHeight || this.options.height || 720,
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
  }
}

// Singleton instance for convenience
export const cameraSource = new CameraSource();
