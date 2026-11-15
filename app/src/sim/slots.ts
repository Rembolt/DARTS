// Echo slots and drawn paths (mvp-design.md 5.4 and 7).
import type { Contribution, EarlyResult } from './early';
import type { Bands, SimConfig, SourceResult, Vec3 } from './types';

/** Shortest delay a slot reports, seconds. Empty slots report this too (with zero energy). */
export const MIN_SLOT_DELAY = 0.001;

/** Drawn paths start this far from the listener, so lines from the camera itself are not drawn (section 7). */
export const PATH_START_OFFSET = 0.3; // metres

/** The slot whose direction is closest to `dir` (largest dot product). */
export function nearestSlot(dir: Vec3, slotDirections: Vec3[]): number {
  let best = 0, bestDot = -Infinity;
  for (let i = 0; i < slotDirections.length; i++) {
    const s = slotDirections[i];
    const dot = s[0] * dir[0] + s[1] * dir[1] + s[2] * dir[2];
    if (dot > bestDot) { bestDot = dot; best = i; }
  }
  return best;
}

/**
 * One source's echo slots. A contribution arriving at most `earlyWindow` after the direct sound (`D / c`) goes into
 * the nearest slot; later ones add to `lateEnergy`. Per slot: energy is the sum per band; delay is the average of
 * `arrival − D / c` weighted by the contribution's energy summed over the three bands, at least `MIN_SLOT_DELAY`.
 * An empty slot has energy [0, 0, 0] and delay `MIN_SLOT_DELAY`.
 */
export function binSlots(
  contributions: Contribution[],
  distance: number,
  config: SimConfig,
): Pick<SourceResult, 'slots' | 'lateEnergy'> {
  const directTime = distance / config.speedOfSound;
  const slots = config.slotDirections.map(() => ({ energy: [0, 0, 0] as Bands, weightedDelay: 0, weight: 0 }));
  const lateEnergy: Bands = [0, 0, 0];
  for (const c of contributions) {
    const delay = c.arrival - directTime;
    if (delay > config.earlyWindow) {
      for (let k = 0; k < 3; k++) lateEnergy[k] += c.energy[k];
      continue;
    }
    const slot = slots[nearestSlot(c.direction, config.slotDirections)];
    const w = c.energy[0] + c.energy[1] + c.energy[2];
    for (let k = 0; k < 3; k++) slot.energy[k] += c.energy[k];
    slot.weightedDelay += w * delay;
    slot.weight += w;
  }
  return {
    slots: slots.map(s => ({
      energy: s.energy,
      delay: s.weight > 0 ? Math.max(MIN_SLOT_DELAY, s.weightedDelay / s.weight) : MIN_SLOT_DELAY,
    })),
    lateEnergy,
  };
}

/**
 * The `maxDrawnPaths` strongest contributions (energy summed over bands, all sources together) as line segments:
 * listener → each hit → source. Paths are written strongest first, so a viewer can fade by order. The first segment
 * starts `PATH_START_OFFSET` from the listener along the ray (dropped if the first hit is closer than that).
 * `pathSource[i]` is the source index of segment i.
 */
export function drawnPaths(
  early: EarlyResult,
  listener: Vec3,
  sources: Vec3[],
  maxPaths: number,
): { paths: Float32Array; pathSource: Uint8Array } {
  const strongest = early.contributions
    .map((c, i) => ({ i, w: c.energy[0] + c.energy[1] + c.energy[2] }))
    .filter(e => e.w > 0)
    .sort((a, b) => b.w - a.w)
    .slice(0, maxPaths)
    .map(e => early.contributions[e.i]);

  const points: number[] = [];
  const owner: number[] = [];
  const segment = (a: ArrayLike<number>, b: ArrayLike<number>, source: number) => {
    points.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    owner.push(source);
  };
  for (const c of strongest) {
    const hit = (b: number) => early.hitPoints.subarray((c.ray * early.bounces + b) * 3, (c.ray * early.bounces + b) * 3 + 3);
    const h0 = hit(0);
    const firstLength = Math.hypot(h0[0] - listener[0], h0[1] - listener[1], h0[2] - listener[2]);
    if (firstLength > PATH_START_OFFSET) {
      const d = c.direction;
      segment(
        [listener[0] + d[0] * PATH_START_OFFSET, listener[1] + d[1] * PATH_START_OFFSET, listener[2] + d[2] * PATH_START_OFFSET],
        h0,
        c.source,
      );
    }
    for (let b = 0; b < c.bounce; b++) segment(hit(b), hit(b + 1), c.source);
    segment(hit(c.bounce), sources[c.source], c.source);
  }
  return { paths: new Float32Array(points), pathSource: new Uint8Array(owner) };
}
