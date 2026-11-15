// One facing direction per triangle, shared by material tagging and blueprint lines.
import type { Mesh } from './obj';

/**
 * Unit normal per triangle (3 floats each), from its winding: `(b − a) × (c − a)`. This is the one place that decides
 * which way a triangle faces. A zero-area triangle gets (0, 0, 0): it has no facing.
 */
export function faceNormals(mesh: Mesh): Float32Array {
  const { positions: p, indices } = mesh;
  const out = new Float32Array(indices.length);
  for (let t = 0; t < indices.length / 3; t++) {
    const a = indices[3 * t] * 3, b = indices[3 * t + 1] * 3, c = indices[3 * t + 2] * 3;
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    if (len === 0) continue;
    out[3 * t] = nx / len;
    out[3 * t + 1] = ny / len;
    out[3 * t + 2] = nz / len;
  }
  return out;
}

/** True when triangle `t` has no facing (zero area). */
export function isDegenerate(normals: Float32Array, t: number): boolean {
  return normals[3 * t] === 0 && normals[3 * t + 1] === 0 && normals[3 * t + 2] === 0;
}
