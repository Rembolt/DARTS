// Gain and filter values for the audio engine (mvp-design.md 6, v2-design 5.1). Pure, so they are tested without Web Audio.
import type { Bands, Vec3 } from '../sim/types';
import { AUDIO } from '../config';
import type { SourceKind } from './engine';

export const dbToGain = (db: number) => 10 ** (db / 20);

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * A source's direct gain. `directMid` is the trace's direct energy in the mid band (1 before the first trace), so its
 * square root scales the amplitude, as the MVP's two curves did.
 * - point (MVP indoor): `sqrt(directMid) / max(D, 1) × level`, full level inside 1 m.
 * - ambient (MVP outdoor): `sqrt(directMid) × level`, no fade with distance.
 * - stereo: its level; never traced, so `directMid` and `d` are ignored.
 */
export function directGain(kind: SourceKind, levelDb: number, d: number, directMid = 1): number {
  const level = dbToGain(levelDb);
  if (kind === 'stereo') return level;
  const amp = Math.sqrt(Math.max(directMid, 0));
  return kind === 'point' ? (amp / Math.max(d, 1)) * level : amp * level;
}

/**
 * Shelf gains in dB from a band triple (low, mid, high), each compared with mid. Bands are energies, so
 * 10·log10 of the ratio. Clamped to ±`AUDIO.maxShelfDb`; flat when mid is zero (the gain is zero anyway).
 */
export function shelfGainsDb(bands: Bands): { low: number; high: number } {
  const [lo, mid, hi] = bands;
  if (!(mid > 0)) return { low: 0, high: 0 };
  const db = (x: number) => {
    const v = x > 0 ? 10 * Math.log10(x / mid) : -AUDIO.maxShelfDb;
    return Math.min(AUDIO.maxShelfDb, Math.max(-AUDIO.maxShelfDb, v));
  };
  return { low: db(lo), high: db(hi) };
}
