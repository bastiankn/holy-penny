/**
 * Jest setup file
 * Configures global mocks and test environment
 */

// Mock Three.js (optional, for unit tests that don't need Three.js)
jest.mock('three', () => ({
  Scene: jest.fn(),
  PerspectiveCamera: jest.fn(),
  WebGLRenderer: jest.fn(),
  AmbientLight: jest.fn(),
  DirectionalLight: jest.fn(),
  BoxGeometry: jest.fn(),
  MeshBasicMaterial: jest.fn(),
  Mesh: jest.fn(),
  VideoTexture: jest.fn(),
  PlaneGeometry: jest.fn(),
  Color: jest.fn(),
  Vector3: jest.fn(),
  Euler: jest.fn(),
  // Add more Three.js exports as needed
}));

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
const originalConsole = console;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
});

// Mock requestAnimationFrame for tests
global.requestAnimationFrame = (cb) => {
  return setTimeout(cb, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};
