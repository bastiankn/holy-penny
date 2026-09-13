import * as THREE from 'three';

// Create the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Create the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

// Create the renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.getElementById('app')?.appendChild(renderer.domElement);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Add directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Create a test cube
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  roughness: 0.4,
  metalness: 0.6,
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Add axes helper for debugging
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
const animate = () => {
  requestAnimationFrame(animate);

  // Rotate the cube
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera);
};

// Start animation
animate();

// Add a simple UI message
const message = document.createElement('div');
message.style.position = 'absolute';
message.style.top = '20px';
message.style.left = '20px';
message.style.color = 'white';
message.style.fontFamily = 'Arial, sans-serif';
message.style.fontSize = '18px';
message.style.backgroundColor = 'rgba(0,0,0,0.5)';
message.style.padding = '10px 20px';
message.style.borderRadius = '5px';
message.textContent = 'Holy Penny - WebAR Coin Game (Phase 1)';
document.body.appendChild(message);

console.log('Holy Penny - Phase 1: Basic Three.js scene loaded successfully');
