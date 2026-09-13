export interface Vector3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface QuaternionTuple {
  x: number;
  y: number;
  z: number;
  w: number;
}

export function distance3(a: Vector3Tuple, b: Vector3Tuple): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function distanceXZ(a: Vector3Tuple, b: Vector3Tuple): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function isWithinThreshold(a: Vector3Tuple, b: Vector3Tuple, t: number): boolean {
  if (t <= 0) {
    return false;
  }
  return distance3(a, b) < t;
}

export function formatDistance(m: number | null | undefined): string {
  if (m === null || m === undefined) {
    return '—';
  }
  if (typeof m !== 'number' || Number.isNaN(m) || !Number.isFinite(m)) {
    return '—';
  }
  if (m < 0) {
    return '—';
  }
  return `${m.toFixed(2)} m`;
}

export function clamp(v: number, min: number, max: number): number {
  if (v < min) {
    return min;
  }
  if (v > max) {
    return max;
  }
  return v;
}
