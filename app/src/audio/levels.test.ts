import { describe, it, expect } from 'vitest';
import { dbToGain, distance, indoorDirectGain, outdoorDirectGain, shelfGainsDb } from './levels';
import { AUDIO } from '../config';

describe('gain formulas (mvp-design.md 6)', () => {
  it('indoor fades as 1/D beyond 1 m and holds full level inside 1 m', () => {
    expect(indoorDirectGain(0)).toBe(1);
    expect(indoorDirectGain(0.5)).toBe(1);
    expect(indoorDirectGain(4)).toBe(0.25);
    expect(indoorDirectGain(4, 0.25)).toBeCloseTo(0.125);
    expect(indoorDirectGain(2, -1)).toBe(0);
  });

  it('outdoor sits 12 dB below the song and does not depend on distance', () => {
    expect(outdoorDirectGain()).toBeCloseTo(dbToGain(-12));
    expect(outdoorDirectGain()).toBeCloseTo(0.2512, 4);
    expect(outdoorDirectGain(0.25)).toBeCloseTo(0.5 * dbToGain(-12));
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
