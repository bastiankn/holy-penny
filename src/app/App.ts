/**
 * App - Main application class
 * Orchestrates camera, rendering, and game logic
 * Part of Phase 2: Camera Implementation
 */

import { CameraSource, cameraSource } from '../tracking/CameraSource';
import { StartScreen } from '../ui/StartScreen';
import * as THREE from 'three';

export interface AppOptions {
  canvas?: HTMLCanvasElement;
  cameraOptions?: ConstructorParameters<typeof CameraSource>[0];
}

export class App {
  private cameraSource: CameraSource;
  private startScreen: StartScreen;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private videoTexture: THREE.VideoTexture | null = null;
  private videoMesh: THREE.Mesh | null = null;
  private animationFrameId: number = 0;
  private options: AppOptions;

  constructor(options: AppOptions = {}) {
    this.options = options;
    this.cameraSource = options.cameraOptions
      ? new CameraSource(options.cameraOptions)
      : cameraSource;

    // Initialize Three.js
    this.initThreeJS();

    // Initialize UI
    this.startScreen = new StartScreen({
      onStart: () => this.startCamera(),
    });

    // Handle window resize
    window.addEventListener('resize', () => this.onResize());
  }

  /**
   * Initialize Three.js scene, camera, and renderer
   */
  private initThreeJS(): void {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(directionalLight);
  }

  /**
   * Start the camera and show video feed
   */
  private async startCamera(): Promise<void> {
    try {
      this.startScreen.setStatus('Starting camera...');
      this.startScreen.setButtonEnabled(false);

      // Start camera
      await this.cameraSource.start();

      // Get video element
      const video = this.cameraSource.getVideoElement();

      // Create video texture
      this.videoTexture = new THREE.VideoTexture(video);
      this.videoTexture.minFilter = THREE.LinearFilter;
      this.videoTexture.magFilter = THREE.LinearFilter;

      // Create a plane to display the video
      // Use the actual video dimensions for correct aspect ratio
      const videoWidth = video.videoWidth || 720;
      const videoHeight = video.videoHeight || 1280;
      const aspectRatio = videoWidth / videoHeight;

      // Create plane with correct aspect ratio (width, height)
      const geometry = new THREE.PlaneGeometry(10 * aspectRatio, 10);
      const material = new THREE.MeshBasicMaterial({ map: this.videoTexture });
      this.videoMesh = new THREE.Mesh(geometry, material);
      this.videoMesh.position.set(0, 0, -10);
      this.scene.add(this.videoMesh);

      // Hide start screen
      this.startScreen.hide();

      // Start animation loop
      this.startAnimation();

      this.startScreen.setStatus('Camera active');
    } catch (error) {
      const err = error as Error;
      this.startScreen.setStatus(`Camera error: ${err.message}`);
      this.startScreen.setButtonEnabled(true);
      console.error('Camera error:', err);
    }
  }

  /**
   * Stop the camera
   */
  stopCamera(): void {
    this.cameraSource.stop();

    // Remove video mesh
    if (this.videoMesh) {
      this.scene.remove(this.videoMesh);
      this.videoMesh = null;
    }

    // Dispose video texture
    if (this.videoTexture) {
      this.videoTexture.dispose();
      this.videoTexture = null;
    }

    // Stop animation
    this.stopAnimation();

    // Show start screen
    this.startScreen.show();
    this.startScreen.setStatus('Camera stopped');
    this.startScreen.setButtonEnabled(true);
  }

  /**
   * Start the animation loop
   */
  private startAnimation(): void {
    this.stopAnimation();
    this.animate();
  }

  /**
   * Animation loop
   */
  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());

    // Update video texture if available
    if (this.videoTexture) {
      this.videoTexture.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Stop the animation loop
   */
  private stopAnimation(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = 0;
    }
  }

  /**
   * Handle window resize
   */
  private onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);

    // Adjust video mesh aspect ratio to match camera (portrait)
    if (this.videoMesh && this.cameraSource.isStreaming()) {
      const video = this.cameraSource.getVideoElement();
      const videoAspect = video.videoWidth / video.videoHeight;
      const meshAspect = 9 / 16; // Portrait aspect ratio

      if (videoAspect > 0) {
        // For portrait video, we want the mesh to maintain 9:16 ratio
        this.videoMesh.scale.set(meshAspect / videoAspect, 1, 1);
      }
    }
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.stopCamera();
    this.stopAnimation();

    // Clean up Three.js
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    // Clean up UI
    this.startScreen.destroy();
  }
}

// Singleton instance
export const app = new App();
