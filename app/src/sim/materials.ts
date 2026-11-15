// One material per triangle, from which way it faces (mvp-design.md 4.2 and 5.1 step 5).
import { faceNormals } from './normals';
import type { Mesh } from './obj';

/** Material ids, in the key order of `SimConfig['materials']`. */
export const MATERIAL_IDS = { wall: 0, floor: 1, ceiling: 2 } as const;

const LEVEL_LIMIT = Math.cos(Math.PI / 4); // a normal within 45° of vertical means the surface is within 45° of level

/**
 * Within 45° of level and facing up is floor, facing down is ceiling, anything steeper is wall. Zero-area triangles
 * count as wall. Facing comes from `faceNormals` (the triangle's winding); pass its result to avoid computing it twice.
 */
export function tagMaterials(mesh: Mesh, normals: Float32Array = faceNormals(mesh)): Uint8Array {
  const out = new Uint8Array(mesh.indices.length / 3);
  for (let t = 0; t < out.length; t++) {
    const up = normals[3 * t + 1];
    out[t] = up >= LEVEL_LIMIT ? MATERIAL_IDS.floor : up <= -LEVEL_LIMIT ? MATERIAL_IDS.ceiling : MATERIAL_IDS.wall;
  }
  return out;
}
