import { describe, it, expect } from 'vitest';
import {
  createHistogram, addContribution, schroederCurve, echoTimeFromCurve, echoTimes, estimateEchoTime,
  DECAY_BIN_WIDTH, DEFAULT_ECHO_TIME,
} from './decay';
import { AUDIO } from '../config';
import type { Bands } from './types';

/** Fills a histogram with one contribution per step, energy exp(−13.8 t / T60) per band. */
function exponential(t60: Bands) {
  const h = createHistogram();
  const n = h.bins[0].length;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) * DECAY_BIN_WIDTH;
    addContribution(h, t, [0, 1, 2].map((b) => Math.exp((-13.8 * t) / t60[b])) as Bands);
  }
  return h;
}

describe('histogram', () => {
  it('has 5 ms steps over 3 s', () => {
    const h = createHistogram();
    expect(h.binWidth).toBe(0.005);
    expect(h.bins[1].length).toBe(600);
  });

  it('adds energy to the right step and band', () => {
    const h = createHistogram();
    addContribution(h, 0.0123, [1, 2, 3]);
    addContribution(h, 0.0149, [1, 0, 0]);
    expect(h.bins[0][2]).toBe(2);
    expect(h.bins[1][2]).toBe(2);
    expect(h.bins[2][2]).toBe(3);
  });

  it('puts late energy in overflow and ignores bad input', () => {
    const h = createHistogram();
    addContribution(h, 3, [1, 1, 1]);
    addContribution(h, 10, [1, 0, 0]);
    addContribution(h, -1, [5, 5, 5]);
    addContribution(h, NaN, [5, 5, 5]);
    addContribution(h, 0.1, [NaN, -1, Infinity]);
    expect(h.overflow).toEqual([2, 1, 1]);
    expect(h.bins.every((b) => b.every((v) => v === 0))).toBe(true);
  });
});

describe('Schroeder curve', () => {
  it('starts at 0 dB and never rises', () => {
    const db = schroederCurve(exponential([0.8, 0.8, 0.8]).bins[1]);
    expect(db[0]).toBeCloseTo(0);
    for (let i = 1; i < db.length; i++) expect(db[i]).toBeLessThanOrEqual(db[i - 1]);
  });

  it('counts the overflow tail in every step', () => {
    const db = schroederCurve([1, 0, 0], 1);
    expect(db[0]).toBeCloseTo(0);
    expect(db[1]).toBeCloseTo(-3.0103, 3);
    expect(db[2]).toBeCloseTo(-3.0103, 3);
  });

  it('is −Infinity when empty', () => {
    expect([...schroederCurve(new Float64Array(4))].every((v) => v === -Infinity)).toBe(true);
  });
});

describe('echo time', () => {
  it('recovers a known T60 within 5% per band', () => {
    const t = echoTimes(exponential([0.8, 0.5, 1.6]));
    expect(t[0]).toBeGreaterThan(0.8 * 0.95);
    expect(t[0]).toBeLessThan(0.8 * 1.05);
    expect(t[1]).toBeCloseTo(0.5, 1);
    expect(Math.abs(t[2] - 1.6) / 1.6).toBeLessThan(0.05);
  });

  it('clamps to the echo time range', () => {
    const t = echoTimes(exponential([0.05, 0.8, 20]));
    expect(t[0]).toBe(AUDIO.echoTimeMin);
    expect(t[2]).toBe(AUDIO.echoTimeMax);
  });

  it('uses the fallback for an empty histogram', () => {
    expect(echoTimes(createHistogram())).toEqual(DEFAULT_ECHO_TIME);
    expect(echoTimes(createHistogram(), [0.3, 0.9, 5])).toEqual([0.3, 0.9, AUDIO.echoTimeMax]);
  });

  it('extrapolates a curve that stops between −15 and −25 dB, falls back above −15 dB', () => {
    // A straight 60 dB-per-second fall that ends at −20 dB: T60 = 1 s.
    const curve = Array.from({ length: 70 }, (_, i) => Math.max(-20, -60 * i * 0.005));
    expect(echoTimeFromCurve(curve, 0.005)).toBeCloseTo(1, 2);
    const short = Array.from({ length: 70 }, (_, i) => Math.max(-12, -60 * i * 0.005));
    expect(echoTimeFromCurve(short, 0.005)).toBeUndefined();
  });

  it('falls back when there is a single contribution', () => {
    const h = createHistogram();
    addContribution(h, 0.02, [1, 1, 1]);
    expect(echoTimes(h, [0.6, 0.6, 0.6])).toEqual([0.6, 0.6, 0.6]);
  });
});

describe('estimateEchoTime', () => {
  it('follows 0.04 × mean free path / −ln(1 − absorption)', () => {
    const t = estimateEchoTime(3, [0.2, 0.1, 0.3]);
    expect(t[0]).toBeCloseTo((0.04 * 3) / -Math.log(0.8));
    expect(t[1]).toBeCloseTo((0.04 * 3) / -Math.log(0.9));
    expect(t[2]).toBeCloseTo((0.04 * 3) / -Math.log(0.7));
  });

  it('clamps the edges', () => {
    expect(estimateEchoTime(3, [0, 1, -0.1])).toEqual([AUDIO.echoTimeMax, AUDIO.echoTimeMin, AUDIO.echoTimeMax]);
    expect(estimateEchoTime(0, [0.2, 0.2, 0.2])).toEqual([AUDIO.echoTimeMin, AUDIO.echoTimeMin, AUDIO.echoTimeMin]);
    expect(estimateEchoTime(NaN, [0.2, 0.2, 0.2])[0]).toBe(AUDIO.echoTimeMin);
  });
});
