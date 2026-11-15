// One material per triangle, from which way it faces (mvp-design.md 4.2 and 5.1 step 5).
import type { Mesh } from './obj';

/** Material ids, in the key order of `SimConfig['materials']`. */
export const MATERIAL_IDS = { wall: 0, floor: 1, ceiling: 2 } as const;

const LEVEL_LIMIT = Math.cos(Math.PI / 4); // a normal within 45° of vertical means the surface is within 45° of level

/**
 * Facing is `(b − a) × (c − a)`: it follows the triangle's winding. Within 45° of level and facing up is floor,
 * facing down is ceiling, anything steeper is wall. Zero-area triangles count as wall.
 */
export function tagMaterials(mesh: Mesh): Uint8Array {
  const { positions: p, indices } = mesh;
  const out = new Uint8Array(indices.length / 3);
  for (let t = 0; t < out.length; t++) {
    const a = indices[3 * t] * 3;
    const b = indices[3 * t + 1] * 3;
    const c = indices[3 * t + 2] * 3;
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz);
    const up = len > 0 ? ny / len : 0;
    out[t] = up >= LEVEL_LIMIT ? MATERIAL_IDS.floor : up <= -LEVEL_LIMIT ? MATERIAL_IDS.ceiling : MATERIAL_IDS.wall;
  }
  return out;
}
