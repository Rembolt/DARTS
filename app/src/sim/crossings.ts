// Every surface crossed along a straight segment, merged into walls (mvp-design.md 5.2 steps 2 and 3).
import { DoubleSide, Ray } from 'three';
import { firstTracedHit, isTraced } from './layers';
import { surfaceAt } from './library';
import { carvedAt, hasCarved, panelHits } from './openings';
import type { SimState } from './load';
import type { Bands, Vec3 } from './types';

export type Crossing = { walls: number; transmission: Bands };

const ray = new Ray();
const point: Vec3 = [0, 0, 0];

/** A main-mesh hit that counts for sound: in a traced layer, and not the scanned glass or leaf of an opening. */
function counts(state: SimState, from: Vec3, unit: Vec3, distance: number, triangle: number, carving: boolean): boolean {
  if (!isTraced(state, triangle)) return false;
  if (!carving) return true;
  point[0] = from[0] + unit[0] * distance; point[1] = from[1] + unit[1] * distance; point[2] = from[2] + unit[2] * distance;
  return !carvedAt(state, point);
}

/**
 * Walls crossed between `from` and `to`, and the strength left per band after them.
 *
 * - Every triangle hit along the segment counts, from either side (the index is traced `DoubleSide`), except
 *   triangles of untraced layers (`setLayers`). Closed door and window panels count too: a panel's two faces
 *   merge into one wall, with the panel's material.
 * - Crossings are grouped into walls: a crossing joins the current wall while it is closer than `wallMergeDistance`
 *   to that wall's FIRST crossing. Measuring from the first crossing (not the previous one) keeps a run of bumpy
 *   scan triangles from chaining into one endless "wall" across a room.
 * - A wall's blocking, per band, is the largest blocking of the materials in its group (each triangle's material
 *   from the library, `surfaceAt`) (a floor slab seen as a floor
 *   face plus a ceiling face blocks like the floor). Each wall multiplies by `10^(−blocking × transmissionScale / 10)`.
 * - Returns null as soon as more than `maxWalls` walls are found (the caller skips the leg). With `maxWalls` 0 it
 *   only asks for the nearest hit.
 */
export function crossSegment(state: SimState, from: Vec3, to: Vec3, maxWalls = Infinity): Crossing | null {
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
  const length = Math.hypot(dx, dy, dz);
  const transmission: Bands = [1, 1, 1];
  if (length === 0) return { walls: 0, transmission };
  ray.origin.set(from[0], from[1], from[2]);
  ray.direction.set(dx / length, dy / length, dz / length);
  if (maxWalls === 0) {
    // Only a clear segment passes: the nearest hit is enough, and much cheaper than collecting all of them.
    return firstTracedHit(state, from, [dx, dy, dz], length) ? null : { walls: 0, transmission };
  }
  const hits = segmentHits(state, from, [dx / length, dy / length, dz / length], length);
  if (hits.length === 0) return { walls: 0, transmission };
  const distances = new Float64Array(hits.length);
  const triangles = new Int32Array(hits.length);
  const order = hits.map((_, i) => i).sort((a, b) => hits[a].distance - hits[b].distance);
  order.forEach((h, i) => {
    distances[i] = hits[h].distance;
    triangles[i] = hits[h].triangle;
  });

  const { config } = state;
  const scale = config.transmissionScale / 10;
  let walls = 0;
  let i = 0;
  while (i < distances.length) {
    const start = distances[i];
    const blocking: Bands = [0, 0, 0];
    for (; i < distances.length && distances[i] - start < config.wallMergeDistance; i++) {
      const db = surfaceAt(state, triangles[i]).blockingDb;
      for (let k = 0; k < 3; k++) if (db[k] > blocking[k]) blocking[k] = db[k];
    }
    walls++;
    if (walls > maxWalls) return null;
    for (let k = 0; k < 3; k++) transmission[k] *= 10 ** (-blocking[k] * scale);
  }
  return { walls, transmission };
}

/** Every surface along the segment that counts for sound: main-mesh hits (see `counts`) and closed panels. */
function segmentHits(state: SimState, from: Vec3, unit: Vec3, length: number): { distance: number; triangle: number }[] {
  const carving = hasCarved(state);
  const hits: { distance: number; triangle: number }[] = [];
  for (const h of state.index.bvh.raycast(ray, DoubleSide, 0, length)) {
    if (h.faceIndex != null && counts(state, from, unit, h.distance, h.faceIndex, carving)) hits.push({ distance: h.distance, triangle: h.faceIndex });
  }
  hits.push(...panelHits(state, from, unit, length));
  return hits;
}

export type WallCrossing = { /** metres from `from` to the wall */ distance: number; /** what the wall costs, dB per band (low, mid, high) */ lossDb: Bands };

/**
 * The same walls as `crossSegment`, one by one in order from `from`: where each is and what it costs. For drawing
 * what stands between a listener and a source; the product of the walls' transmissions equals `crossSegment`'s.
 */
export function wallsAlong(state: SimState, from: Vec3, to: Vec3): WallCrossing[] {
  const dx = to[0] - from[0], dy = to[1] - from[1], dz = to[2] - from[2];
  const length = Math.hypot(dx, dy, dz);
  if (length === 0) return [];
  ray.origin.set(from[0], from[1], from[2]);
  ray.direction.set(dx / length, dy / length, dz / length);
  // The same hits as crossSegment, closed panels included, so the badges show a closed window too.
  const hits = segmentHits(state, from, [dx / length, dy / length, dz / length], length).sort((a, b) => a.distance - b.distance);
  const { config } = state;
  const scale = config.transmissionScale;
  const out: WallCrossing[] = [];
  let i = 0;
  while (i < hits.length) {
    const start = hits[i].distance;
    const blocking: Bands = [0, 0, 0];
    for (; i < hits.length && hits[i].distance - start < config.wallMergeDistance; i++) {
      const db = surfaceAt(state, hits[i].triangle).blockingDb;
      for (let k = 0; k < 3; k++) if (db[k] > blocking[k]) blocking[k] = db[k];
    }
    out.push({ distance: start, lossDb: [blocking[0] * scale, blocking[1] * scale, blocking[2] * scale] });
  }
  return out;
}
