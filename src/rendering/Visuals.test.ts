// These regression tests deliberately bypass setupTests.ts's global Three.js mock.
jest.unmock('three');
import * as THREE from 'three';
import { Coin } from '../game/Coin';
import { Beacon } from '../game/Beacon';

const flushImports = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('real Three.js visuals', () => {
  it('adds a visible gold mesh, animates it, collects it and disposes it', async () => {
    const scene = new THREE.Scene();
    const coin = new Coin(scene, { glbUrl: null });
    coin.spawn({ x: 1, y: 0, z: -2.5 });
    await flushImports();
    expect(scene.children).toHaveLength(1);
    const mesh = scene.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    expect(mesh.isMesh).toBe(true);
    expect(mesh.geometry.getAttribute('position').count).toBeGreaterThan(0);
    expect(mesh.material.color.getHex()).toBe(0xffc93c);
    expect(mesh.position.toArray()).toEqual([1, 0, -2.5]);
    expect(mesh.visible).toBe(true);
    coin.update(0.5, 0.5);
    expect(mesh.rotation.y).toBeCloseTo(1);
    expect(mesh.position.y).not.toBe(0);
    coin.collect();
    expect(mesh.visible).toBe(false);
    const geometryDispose = jest.spyOn(mesh.geometry, 'dispose');
    const materialDispose = jest.spyOn(mesh.material, 'dispose');
    coin.dispose();
    expect(scene.children).toHaveLength(0);
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
  });

  it('creates a translucent beam above its anchor and keeps it hidden after collection', async () => {
    const scene = new THREE.Scene();
    const beacon = new Beacon(scene);
    beacon.attachTo({ x: 1, y: -0.2, z: -2.5 });
    await flushImports();
    expect(scene.children).toHaveLength(1);
    const mesh = scene.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    expect(mesh.isMesh).toBe(true);
    expect(mesh.geometry.getAttribute('position').count).toBeGreaterThan(0);
    expect(mesh.position.y).toBeCloseTo(1.3);
    expect(mesh.material.transparent).toBe(true);
    beacon.setVisible(false);
    beacon.update(1, 1);
    expect(mesh.visible).toBe(false);
    beacon.dispose();
    expect(scene.children).toHaveLength(0);
  });
});
