// Late reverb, steps 3 and 4 of mvp-design.md 5.5: an energy histogram per band, Schroeder backward
// integration, and the echo time (T60) read from the decay curve. Pure functions, no tracing here.
// The results are estimates from a simulation, not measurements.
import { AUDIO } from '../config';
import type { Bands } from './types';

/** Width of one histogram step, in seconds (5.5 step 3). */
export const DECAY_BIN_WIDTH = 0.005;
/** Longest arrival time the histogram holds, in seconds. Longer than `AUDIO.echoTimeMax`, so a 2.5 s room still
 *  falls past −25 dB inside the window. */
export const DECAY_MAX_TIME = 3;
/** Echo time used when nothing better is known: the traced decay in the emulation (5.5). */
export const DEFAULT_ECHO_TIME: Bands = [0.8, 0.8, 0.8];
/** The fit needs at least this many dB of fall when the curve stops before −25 dB. */
const MIN_FIT_RANGE_DB = 10;

export type DecayHistogram = {
  binWidth: number; // seconds
  bins: [Float64Array, Float64Array, Float64Array]; // energy per step, per band (low, mid, high)
  /** Energy that arrived at or after the end of the window, per band. It is not dropped: the backward integral adds
   *  it to every step as the tail beyond the window, which keeps the integral exact (only its shape is unknown). */
  overflow: Bands;
};

export function createHistogram(maxTime = DECAY_MAX_TIME, binWidth = DECAY_BIN_WIDTH): DecayHistogram {
  const n = Math.max(1, Math.ceil(maxTime / binWidth - 1e-9));
  return { binWidth, bins: [new Float64Array(n), new Float64Array(n), new Float64Array(n)], overflow: [0, 0, 0] };
}

/** Adds one contribution arriving at `time` seconds. Negative or non-finite times and energies are ignored. */
export function addContribution(h: DecayHistogram, time: number, energy: Bands): void {
  if (!(time >= 0) || !Number.isFinite(time)) return;
  const i = Math.floor(time / h.binWidth);
  for (let b = 0; b < 3; b++) {
    const e = energy[b];
    if (!(e > 0) || !Number.isFinite(e)) continue;
    if (i < h.bins[b].length) h.bins[b][i] += e;
    else h.overflow[b] += e;
  }
}

/**
 * Schroeder backward integration: entry i is the energy still to arrive from step i on (plus `tail`, the energy
 * after the window), in dB relative to the total. Starts at 0 dB and falls. Steps with nothing left are −Infinity.
 * An empty histogram gives all −Infinity.
 */
export function schroederCurve(bins: ArrayLike<number>, tail = 0): Float64Array {
  const n = bins.length;
  const sums = new Float64Array(n);
  let acc = tail > 0 ? tail : 0;
  for (let i = n - 1; i >= 0; i--) {
    acc += bins[i] > 0 ? bins[i] : 0;
    sums[i] = acc;
  }
  const total = n > 0 ? sums[0] : 0;
  const db = new Float64Array(n);
  for (let i = 0; i < n; i++) db[i] = total > 0 && sums[i] > 0 ? 10 * Math.log10(sums[i] / total) : -Infinity;
  return db;
}

/**
 * Echo time from one decay curve: a least-squares line through the steps between −5 and −25 dB, extrapolated to a
 * 60 dB fall (the same as "time from −5 to −25 dB, times 3", but steadier on noisy traced data).
 * If the curve stops before −25 dB, the fit uses what is there below −5 dB, as long as it spans at least 10 dB.
 * The fit ends at the first step that reaches its bottom, so a flat tail (the overflow) does not bend it.
 * Returns `undefined` when there is not enough curve to fit (empty, too short, or not falling). Not clamped.
 */
export function echoTimeFromCurve(curveDb: ArrayLike<number>, binWidth: number): number | undefined {
  let lowest = 0;
  for (let i = 0; i < curveDb.length; i++) if (Number.isFinite(curveDb[i])) lowest = Math.min(lowest, curveDb[i]);
  const stop = Math.max(-25, lowest);
  if (-5 - stop < MIN_FIT_RANGE_DB) return undefined;

  let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < curveDb.length; i++) {
    const y = curveDb[i];
    if (!Number.isFinite(y) || y < stop) break;
    if (y > -5) continue;
    const x = i * binWidth;
    n++; sx += x; sy += y; sxx += x * x; sxy += x * y;
    if (y <= stop) break; // stop at the first step that reaches the bottom: a flat tail after it would bend the fit
  }
  if (n < 2) return undefined;
  const den = n * sxx - sx * sx;
  if (den <= 0) return undefined;
  const slope = (n * sxy - sx * sy) / den; // dB per second
  if (!(slope < 0)) return undefined;
  return -60 / slope;
}

export function clampEchoTime(t: number): number {
  if (Number.isNaN(t)) return AUDIO.echoTimeMax;
  return Math.min(AUDIO.echoTimeMax, Math.max(AUDIO.echoTimeMin, t));
}

/**
 * Echo time per band from a filled histogram (5.5 step 4), clamped to `AUDIO.echoTimeMin..echoTimeMax`.
 * A band whose curve cannot be fitted (see `echoTimeFromCurve`) gets that band of `fallback` instead, also clamped;
 * pass the last trace's `estimateEchoTime` result when there is one.
 */
export function echoTimes(h: DecayHistogram, fallback: Bands = DEFAULT_ECHO_TIME): Bands {
  const out: Bands = [0, 0, 0];
  for (let b = 0; b < 3; b++) {
    const t = echoTimeFromCurve(schroederCurve(h.bins[b], h.overflow[b]), h.binWidth);
    out[b] = clampEchoTime(t ?? fallback[b]);
  }
  return out;
}

/**
 * The placeholder echo time used until the reverb job returns (5.5):
 * `0.04 × meanFreePath / −ln(1 − averageAbsorption)` per band (Eyring's formula with mean free path 4V/S), clamped.
 * `meanFreePath` is the average ray segment length in metres. Absorption at or below 0 gives the longest time,
 * at or above 1 the shortest; a missing or non-positive mean free path gives the shortest.
 */
export function estimateEchoTime(meanFreePath: number, averageAbsorption: Bands): Bands {
  const out: Bands = [0, 0, 0];
  for (let b = 0; b < 3; b++) {
    const a = averageAbsorption[b];
    let t: number;
    if (!(meanFreePath > 0) || !Number.isFinite(meanFreePath) || a >= 1) t = 0;
    else if (!(a > 0)) t = Infinity;
    else t = (0.04 * meanFreePath) / -Math.log(1 - a);
    out[b] = clampEchoTime(t);
  }
  return out;
}
