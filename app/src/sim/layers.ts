// Mesh layers (v2-design.md 7.3): the OBJ groups, each traced or not. Every ray cast in the worker goes through
// `firstTracedHit` (or `crossSegment`, which filters the same way), so an untraced layer is invisible to sound.
import { firstHit } from './geometry';
import type { SimState } from './load';
import { firstPanelHit } from './openings';
import type { ToWorker, Vec3 } from './types';

export type Hit = { distance: number; triangle: number };
export type SetLayers = Extract<ToWorker, { type: 'setLayers' }>;

/** A ray gives up after skipping this many untraced triangles (it is then treated as escaping). */
export const MAX_SKIPS = 64;
/** How far past a skipped triangle the ray restarts, metres. */
const SKIP_STEP = 1e-4;

/**
 * The layer of each triangle after `buildRayIndex` reordered `after` (the same triangles as `before`, in a new
 * order, each keeping its corner order). Each reordered triangle is found again by its three vertex indices, through
 * a table of the original triangles grouped by first vertex. Identical triangles in two groups (never seen) would
 * both take the first one's group.
 */
export function layersAfterReorder(before: Uint32Array, triangleGroup: Uint8Array, after: Uint32Array, vertexCount: number): Uint8Array {
  const triangles = before.length / 3;
  const start = new Uint32Array(vertexCount + 1);
  for (let t = 0; t < triangles; t++) start[before[3 * t] + 1]++;
  for (let v = 0; v < vertexCount; v++) start[v + 1] += start[v];
  const fill = start.slice(0, vertexCount);
  const byFirst = new Uint32Array(triangles);
  for (let t = 0; t < triangles; t++) byFirst[fill[before[3 * t]]++] = t;

  const out = new Uint8Array(triangles);
  for (let t = 0; t < triangles; t++) {
    const a = after[3 * t], b = after[3 * t + 1], c = after[3 * t + 2];
    let found = -1;
    for (let k = start[a]; k < start[a + 1]; k++) {
      const o = byFirst[k];
      if (before[3 * o + 1] === b && before[3 * o + 2] === c) {
        found = o;
        break;
      }
    }
    if (found < 0) throw new Error('layersAfterReorder: a triangle changed during indexing');
    out[t] = triangleGroup[found];
  }
  return out;
}

/** Triangles per layer, in layer order. */
export function layerCounts(layer: Uint8Array, layerIds: string[]): { id: string; triangles: number }[] {
  const counts = new Array<number>(layerIds.length).fill(0);
  for (let t = 0; t < layer.length; t++) counts[layer[t]]++;
  return layerIds.map((id, i) => ({ id, triangles: counts[i] }));
}

/** Apply a `setLayers` message: the layers named are traced or not; unknown ids are ignored, others unchanged. */
export function applySetLayers(state: SimState, msg: SetLayers): void {
  const traced = [...state.layerTraced];
  for (const [id, on] of Object.entries(msg.traced)) {
    const i = state.layerIds.indexOf(id);
    if (i >= 0) traced[i] = on === true;
  }
  state.layerTraced = traced;
  state.allTraced = traced.every(Boolean);
}

/** True when triangle `t` of the main mesh is in a traced layer. */
export function isTraced(state: SimState, t: number): boolean {
  return state.allTraced || state.layerTraced[state.layer[t]];
}

const at: Vec3 = [0, 0, 0];

/**
 * The nearest traced triangle along the ray within `maxDist`, or the nearest closed door or window panel if that is
 * nearer (its triangle numbered after the main mesh's). With every layer traced and no panel closed this is
 * exactly `firstHit`.
 */
export function firstTracedHit(state: SimState, origin: Vec3, dir: Vec3, maxDist = Infinity): Hit | null {
  const main = firstMeshHit(state, origin, dir, maxDist);
  if (!state.panels?.anyActive) return main;
  const panel = firstPanelHit(state, origin, dir, main ? main.distance : maxDist);
  return panel && (!main || panel.distance < main.distance) ? panel : main;
}

/**
 * The nearest main-mesh triangle in a traced layer. A hit on an untraced layer is skipped and the ray continues
 * just past it, up to `MAX_SKIPS` times.
 */
function firstMeshHit(state: SimState, origin: Vec3, dir: Vec3, maxDist: number): Hit | null {
  if (state.allTraced) return firstHit(state.index, origin, dir, maxDist);
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  if (len === 0) return null;
  const dx = dir[0] / len, dy = dir[1] / len, dz = dir[2] / len;
  let travelled = 0;
  for (let skips = 0; skips <= MAX_SKIPS; skips++) {
    at[0] = origin[0] + dx * travelled; at[1] = origin[1] + dy * travelled; at[2] = origin[2] + dz * travelled;
    const hit = firstHit(state.index, at, dir, maxDist - travelled);
    if (!hit) return null;
    if (state.layerTraced[state.layer[hit.triangle]]) return { distance: travelled + hit.distance, triangle: hit.triangle };
    travelled += hit.distance + SKIP_STEP;
    if (travelled >= maxDist) return null;
  }
  return null;
}
