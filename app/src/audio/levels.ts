// Gain and filter values for the audio engine (mvp-design.md 6). Pure, so they are tested without Web Audio.
import type { Bands, Vec3 } from '../sim/types';
import { AUDIO, SOURCES } from '../config';

export const dbToGain = (db: number) => 10 ** (db / 20);

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Indoor direct gain: `sqrt(direct mid) / max(D, 1)`. Step 5 has no simulation yet, so `directMid` defaults to 1. */
export function indoorDirectGain(d: number, directMid = 1): number {
  return Math.sqrt(Math.max(directMid, 0)) / Math.max(d, 1);
}

/** Outdoor direct gain: `sqrt(direct mid) × outdoor level`; no fade with distance. */
export function outdoorDirectGain(directMid = 1): number {
  return Math.sqrt(Math.max(directMid, 0)) * dbToGain(SOURCES.outdoor.levelDb);
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
