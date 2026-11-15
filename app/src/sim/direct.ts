// Direct sound (mvp-design.md 5.2): volumetric occlusion with a few rays to points around the source.
import { crossSegment } from './crossings';
import type { SimState } from './load';
import { fibonacciSphere } from './sampling';
import type { Bands, Vec3 } from './types';

export type DirectResult = {
  direct: Bands; // strength left after walls, averaged over the occlusion rays, 0..1
  walls: number; // walls crossed by the centre ray
  distance: number; // metres, listener to source
  direction: Vec3; // unit vector from the listener to the source ([0, 0, 0] when they coincide)
};

/**
 * Cast `occlusionRays` rays from the listener: one to the source and the rest to points `occlusionRadius` from it,
 * spread evenly over a sphere (deterministic, so the result does not flicker between traces).
 */
export function directSound(state: SimState, listener: Vec3, source: Vec3): DirectResult {
  const { occlusionRays, occlusionRadius } = state.config;
  const dx = source[0] - listener[0], dy = source[1] - listener[1], dz = source[2] - listener[2];
  const distance = Math.hypot(dx, dy, dz);
  const direction: Vec3 = distance > 0 ? [dx / distance, dy / distance, dz / distance] : [0, 0, 0];

  const centre = crossSegment(state, listener, source)!;
  const direct: Bands = [...centre.transmission];
  const offsets = fibonacciSphere(Math.max(0, occlusionRays - 1));
  for (const o of offsets) {
    const target: Vec3 = [source[0] + o[0] * occlusionRadius, source[1] + o[1] * occlusionRadius, source[2] + o[2] * occlusionRadius];
    const t = crossSegment(state, listener, target)!.transmission;
    for (let k = 0; k < 3; k++) direct[k] += t[k];
  }
  const n = offsets.length + 1;
  for (let k = 0; k < 3; k++) direct[k] /= n;
  return { direct, walls: centre.walls, distance, direction };
}
