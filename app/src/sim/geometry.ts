// The ray index (mvp-design.md 5.1 step 4). Later steps trace against it.
import { BufferAttribute, BufferGeometry, DoubleSide, Ray, Vector3 } from 'three';
import { MeshBVH } from 'three-mesh-bvh';
import type { Mesh } from './obj';
import type { Vec3 } from './types';

export type RayIndex = { bvh: MeshBVH; geometry: BufferGeometry };

export function buildRayIndex(mesh: Mesh): RayIndex {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(mesh.positions, 3));
  geometry.setIndex(new BufferAttribute(mesh.indices, 1));
  return { bvh: new MeshBVH(geometry), geometry };
}

const ray = new Ray();

/** The nearest triangle along the ray, hit from either side, within `far`. `dir` need not be normalised. */
export function firstHit(
  index: RayIndex,
  origin: Vec3,
  dir: Vec3,
  far = Infinity,
): { distance: number; triangle: number } | null {
  ray.origin.set(origin[0], origin[1], origin[2]);
  ray.direction.copy(new Vector3(dir[0], dir[1], dir[2]).normalize());
  const hit = index.bvh.raycastFirst(ray, DoubleSide, 0, far);
  if (!hit || hit.faceIndex == null) return null;
  return { distance: hit.distance, triangle: hit.faceIndex };
}
