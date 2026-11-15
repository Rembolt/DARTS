// Echo slot math (mvp-design.md 5.4 and 6). Pure, so it is tested without Web Audio; engine.ts applies it.
import type { Bands, Vec3 } from '../sim/types';
import { AUDIO, SLOT_DIRECTIONS } from '../config';
import type { SourceKind } from './engine';
import { directGain } from './levels';

/** A slot's panner: `distance` m from the listener along the slot's fixed world direction. */
export function slotPannerPosition(listener: Vec3, dir: Vec3, distance: number = AUDIO.slotPannerDistance): Vec3 {
  return [listener[0] + dir[0] * distance, listener[1] + dir[1] * distance, listener[2] + dir[2] * distance];
}

/** The direct gain with nothing in the way: a point source 1/max(D,1) × level, an ambient one its fixed level. */
export function clearDirectGain(kind: SourceKind, levelDb: number, d: number): number {
  return directGain(kind, levelDb, d);
}

/** The 8 directions a voice from the fifth source on uses for its echoes: the corners of a cube (v2-design 5.2). */
export const MERGED_DIRECTIONS: Vec3[] = (() => {
  const c = 1 / Math.sqrt(3);
  const dirs: Vec3[] = [];
  for (const x of [c, -c]) for (const y of [c, -c]) for (const z of [c, -c]) dirs.push([x, y, z]);
  return dirs;
})();

/**
 * Which of the 8 merged directions each of the 12 slot directions goes to: the nearest; on a tie (every icosahedron
 * corner sits between two cube corners) the first in `MERGED_DIRECTIONS` order.
 */
export const SLOT_MERGE: number[] = SLOT_DIRECTIONS.map(dir => {
  let best = 0;
  let bestDot = -Infinity;
  MERGED_DIRECTIONS.forEach((m, i) => {
    const dot = dir[0] * m[0] + dir[1] * m[1] + dir[2] * m[2];
    if (dot > bestDot + 1e-9) {
      best = i;
      bestDot = dot;
    }
  });
  return best;
});

/**
 * The worker's 12 echo slots as 8: energies summed per band, so nothing is lost; the delay of the strongest slot
 * (mid band), so the merged echo arrives when a real one does instead of at an average no path took.
 */
export function mergeSlots(slots: { energy: Bands; delay: number }[]): { energy: Bands; delay: number }[] {
  const merged = MERGED_DIRECTIONS.map(() => ({ energy: [0, 0, 0] as Bands, delay: 0, strongest: 0 }));
  slots.forEach((slot, i) => {
    const m = merged[SLOT_MERGE[i]];
    if (!m) return;
    for (let b = 0; b < 3; b++) m.energy[b] += slot.energy[b];
    if (slot.energy[1] > m.strongest) {
      m.strongest = slot.energy[1];
      m.delay = slot.delay;
    }
  });
  return merged.map(({ energy, delay }) => ({ energy, delay }));
}

/** Echo gain: sqrt(slot energy mid) × the clear direct gain; 0 for an empty slot. */
export function echoGain(energyMid: number, clearGain: number): number {
  return energyMid > 0 ? Math.sqrt(energyMid) * clearGain : 0;
}

export type DelayPlan =
  /** Silent before: set delay and gain now; nothing can click. */
  | { kind: 'set'; delay: number; gain: number; at: number }
  /** Small change: glide delay and gain with `setTargetAtTime(…, at, AUDIO.smoothing)`. */
  | { kind: 'glide'; delay: number; gain: number; at: number }
  /**
   * Jump: gain from `from` to 0 linearly over [dipStart, delayAt], delay set at `delayAt`, gain back to `gain`
   * linearly by `end`. Changing a delay while it plays bends the pitch, so it changes in silence.
   */
  | { kind: 'dip'; from: number; delay: number; gain: number; dipStart: number; delayAt: number; end: number };

/** Decide how a slot moves to a new delay and gain (mvp-design.md 6, "Echo delay"). */
export function planDelayChange(p: { now: number; currentDelay: number; nextDelay: number; currentGain: number; nextGain: number }): DelayPlan {
  const delay = Math.min(AUDIO.maxDelay, Math.max(0, p.nextDelay));
  if (p.currentGain <= 0) return { kind: 'set', delay, gain: p.nextGain, at: p.now };
  if (Math.abs(delay - p.currentDelay) <= AUDIO.delayJumpThreshold) return { kind: 'glide', delay, gain: p.nextGain, at: p.now };
  const d = AUDIO.delayDipTime;
  return { kind: 'dip', from: p.currentGain, delay, gain: p.nextGain, dipStart: p.now, delayAt: p.now + d, end: p.now + 2 * d };
}

/** When a later gain change may start: not before a running dip ends, so it does not cut the ramp. */
export function gainStartTime(now: number, dipEnd: number): number {
  return Math.max(now, dipEnd);
}
