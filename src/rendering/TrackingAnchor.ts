import * as THREE from 'three';
import type { CameraPose } from '../tracking/TrackingProvider';

/** A deliberately simple object for evaluating visual tracking stability. */
export class TrackingAnchor {
  private readonly scene: THREE.Scene;
  private readonly geometry: THREE.BoxGeometry;
  private readonly material: THREE.MeshNormalMaterial;
  private readonly mesh: THREE.Mesh;
  private placed = false;

  constructor(scene: THREE.Scene, distance = 5) {
    this.scene = scene;
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshNormalMaterial();
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.visible = false;
    this.mesh.userData['trackingAnchorDistance'] = distance;
    this.scene.add(this.mesh);
  }

  placeFromFirstPose(pose: CameraPose): boolean {
    if (this.placed) {
      return false;
    }
    const distance = Number(this.mesh.userData['trackingAnchorDistance']);
    const cameraPosition = new THREE.Vector3(pose.position.x, pose.position.y, pose.position.z);
    const cameraRotation = new THREE.Quaternion(
      pose.quaternion.x,
      pose.quaternion.y,
      pose.quaternion.z,
      pose.quaternion.w
    );
    const forward = new THREE.Vector3(0, 0, -distance).applyQuaternion(cameraRotation);
    this.mesh.position.copy(cameraPosition.add(forward));
    this.mesh.visible = true;
    this.placed = true;
    return true;
  }

  isPlaced(): boolean {
    return this.placed;
  }

  reset(): void {
    this.placed = false;
    this.mesh.visible = false;
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}
