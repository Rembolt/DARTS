// The direct-sound field (heat map, probes): how much of one source reaches each point, through walls. One ray per
// point, no occlusion spread, no reflections: a fast estimate of what the walls let through, not a full trace.
import { crossSegment } from './crossings';
import type { SimState } from './load';
import type { FromWorker, Vec3 } from './types';

export function directField(state: SimState, source: Vec3, points: Float32Array, id = 0): Extract<FromWorker, { type: 'field' }> {
  const start = performance.now();
  const n = Math.floor(points.length / 3);
  const direct = new Float32Array(n * 3);
  const walls = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const p: Vec3 = [points[i * 3], points[i * 3 + 1], points[i * 3 + 2]];
    const c = crossSegment(state, p, source)!;
    direct.set(c.transmission, i * 3);
    walls[i] = Math.min(255, c.walls);
  }
  return { type: 'field', id, direct, walls, ms: performance.now() - start };
}
