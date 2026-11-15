// Echo slot math (mvp-design.md 5.4 and 6). Pure, so it is tested without Web Audio; engine.ts applies it.
import type { Vec3 } from '../sim/types';
import { AUDIO } from '../config';
import { indoorDirectGain, outdoorDirectGain } from './levels';
import type { SourceId } from './positions';

/** A slot's panner: `distance` m from the listener along the slot's fixed world direction. */
export function slotPannerPosition(listener: Vec3, dir: Vec3, distance: number = AUDIO.slotPannerDistance): Vec3 {
  return [listener[0] + dir[0] * distance, listener[1] + dir[1] * distance, listener[2] + dir[2] * distance];
}

/** The direct gain with nothing in the way: indoor 1/max(D,1), outdoor its fixed level. */
export function clearDirectGain(id: SourceId, d: number): number {
  return id === 'indoor' ? indoorDirectGain(d) : outdoorDirectGain();
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
