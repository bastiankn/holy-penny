/**
 * Shared three.js geometry guards.
 *
 * Real three.js `BufferGeometry` exposes vertex positions via
 * `getAttribute('position')` / `attributes.position` — NOT as a direct
 * `position` property. Checking `'position' in geometry` is always false in
 * the browser and silently discards valid geometry (which is how Coin/Beacon
 * ended up invisible).
 */

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Whether `geometry` looks like a usable BufferGeometry with a position
 * attribute. Safe against mocks/stubs (returns false) and never throws.
 */
export function hasPositionAttribute(geometry: unknown): boolean {
  if (!isObject(geometry)) {
    return false;
  }
  const geo = geometry as {
    getAttribute?: (name: string) => unknown;
    attributes?: unknown;
  };
  if (typeof geo.getAttribute === 'function') {
    try {
      return geo.getAttribute('position') != null;
    } catch {
      return false;
    }
  }
  return (
    isObject(geo.attributes) && (geo.attributes as Record<string, unknown>)['position'] != null
  );
}
