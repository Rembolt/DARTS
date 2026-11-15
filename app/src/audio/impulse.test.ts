import { describe, it, expect } from 'vitest';
import { makeImpulse, splitBands, IMPULSE_TAIL } from './impulse';
import { createHistogram, addContribution, echoTimes } from '../sim/decay';
import type { Bands } from '../sim/types';

const SR = 48000;

const energy = (x: Float32Array) => x.reduce((s, v) => s + v * v, 0);

/** Echo time per band measured from an impulse response with our own decay.ts. */
function measure(ir: Float32Array): Bands {
  const bands = splitBands(ir, SR);
  const h = createHistogram();
  for (let b = 0; b < 3; b++) {
    const e: Bands = [0, 0, 0];
    for (let i = 0; i < ir.length; i++) {
      e[0] = e[1] = e[2] = 0;
      e[b] = bands[b][i] * bands[b][i];
      addContribution(h, i / SR, e);
    }
  }
  return echoTimes(h, [NaN, NaN, NaN]);
}

describe('makeImpulse', () => {
  const echo: Bands = [1.2, 0.8, 0.5];
  const ir = makeImpulse(echo, SR, 7);

  it('is stereo and as long as the longest echo time plus the tail', () => {
    expect(ir).toHaveLength(2);
    expect(ir[0].length).toBe(Math.ceil((1.2 + IMPULSE_TAIL) * SR));
    expect(ir[1].length).toBe(ir[0].length);
  });

  it('has energy 1 per channel and no NaN', () => {
    for (const ch of ir) {
      expect(energy(ch)).toBeCloseTo(1, 4);
      expect(ch.every((v) => Number.isFinite(v))).toBe(true);
    }
  });

  it('is deterministic for a seed', () => {
    const again = makeImpulse(echo, SR, 7);
    expect(again[0]).toEqual(ir[0]);
    expect(again[1]).toEqual(ir[1]);
    expect(makeImpulse(echo, SR, 8)[0]).not.toEqual(ir[0]);
  });

  it('has decorrelated channels', () => {
    let lr = 0;
    for (let i = 0; i < ir[0].length; i++) lr += ir[0][i] * ir[1][i];
    expect(Math.abs(lr)).toBeLessThan(0.1); // both channels have energy 1, so this is the correlation
  });

  it('decays each band over roughly its echo time', () => {
    // Measured about 10% long (1.32, 0.89, 0.57 s for seed 7): the measuring band filters overlap, so each band
    // also picks up the slower-decaying edge of its neighbour.
    for (const ch of ir) {
      const t = measure(ch);
      for (let b = 0; b < 3; b++) expect(Math.abs(t[b] - echo[b]) / echo[b]).toBeLessThan(0.2);
    }
  });

  it('matches the echo time closely when all bands are equal', () => {
    const t = measure(makeImpulse([0.8, 0.8, 0.8], SR, 3)[0]);
    for (let b = 0; b < 3; b++) expect(Math.abs(t[b] - 0.8) / 0.8).toBeLessThan(0.08);
  });

  it('falls about 60 dB by the longest echo time', () => {
    const win = Math.round(0.02 * SR);
    const rms = (from: number) => Math.sqrt(energy(ir[0].subarray(from, from + win)) / win);
    const drop = 20 * Math.log10(rms(Math.round(1.2 * SR) - win) / rms(0));
    expect(drop).toBeLessThan(-50);
    expect(drop).toBeGreaterThan(-70);
  });

  it('survives bad echo times', () => {
    const odd = makeImpulse([0, NaN, 0.3], 44100);
    expect(odd[0].every((v) => Number.isFinite(v))).toBe(true);
    expect(energy(odd[0])).toBeCloseTo(1, 4);
  });
});
