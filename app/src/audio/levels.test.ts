import { describe, it, expect } from 'vitest';
import { dbToGain, directGain, distance, shelfGainsDb } from './levels';
import { AUDIO } from '../config';

describe('gain formulas (mvp-design.md 6, v2-design 5.1)', () => {
  it('point: fades as 1/D beyond 1 m, holds full level inside 1 m, scaled by its level', () => {
    expect(directGain('point', 0, 0)).toBe(1);
    expect(directGain('point', 0, 0.5)).toBe(1);
    expect(directGain('point', 0, 4)).toBe(0.25);
    expect(directGain('point', 0, 4, 0.25)).toBeCloseTo(0.125);
    expect(directGain('point', 0, 2, -1)).toBe(0);
    expect(directGain('point', -6, 1)).toBeCloseTo(dbToGain(-6));
  });

  it('directGain: ambient ignores distance, point fades', () => {
    expect(directGain('ambient', -12, 5)).toBeCloseTo(directGain('ambient', -12, 50), 6);
    expect(directGain('point', 0, 2)).toBeGreaterThan(directGain('point', 0, 8));
    expect(directGain('ambient', -12, 1)).toBeCloseTo(0.2512, 3);
  });

  it('ambient: the level times sqrt(direct mid energy), as the MVP highway', () => {
    expect(directGain('ambient', -12, 30, 0.25)).toBeCloseTo(0.5 * dbToGain(-12));
  });

  it('stereo: its level only', () => {
    expect(directGain('stereo', -10, 100)).toBeCloseTo(dbToGain(-10));
  });

  it('measures distance in metres', () => {
    expect(distance([0, 0, 0], [3, 4, 12])).toBe(13);
  });

  it('sets shelves from low and high compared with mid', () => {
    expect(shelfGainsDb([1, 1, 1])).toEqual({ low: 0, high: 0 });
    const s = shelfGainsDb([1, 0.1, 0.01]);
    expect(s.low).toBeCloseTo(10);
    expect(s.high).toBeCloseTo(-10);
    expect(shelfGainsDb([0, 1, 1e-9]).low).toBe(-AUDIO.maxShelfDb);
    expect(shelfGainsDb([0, 1, 1e-9]).high).toBe(-AUDIO.maxShelfDb);
    expect(shelfGainsDb([1, 0, 1])).toEqual({ low: 0, high: 0 });
  });
});
