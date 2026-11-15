import { describe, it, expect } from 'vitest';
import { LOOP_FACADE_DB, ROAD_LEVEL_10M, lineLevelDb, sumDb } from '../src/surroundings/area.js';
import { summarise } from '../src/surroundings/index.js';
import type { Detections } from '../src/surroundings/detect.js';
import type { IndexRow } from '../src/shared/contract.js';

// Far from every airport in the list, so only the road is located.
const ROW = { modelId: 'aaaaaaaaaaa', lat: 30.3, lon: -95.9 } as IndexRow;

function reading(counts: Record<string, number>, road?: { distanceM: number; bearingDeg: number }): Detections {
  return { counts, nearest: road ? { road } : {}, imageryDate: null } as Detections;
}
const RESIDENTIAL = { house: 40 };
const CITY = { house: 30, 'commercial building': 5 };

describe('road sound', () => {
  it('locates the nearest road for every area class, louder where it is busier', () => {
    const quiet = summarise(reading(RESIDENTIAL, { distanceM: 20, bearingDeg: 90 }), ROW);
    const busy = summarise(reading(CITY, { distanceM: 20, bearingDeg: 90 }), ROW);
    expect(quiet.located).toEqual([
      { kind: 'road', distanceM: 20, bearingDeg: 90, levelDb: lineLevelDb(ROAD_LEVEL_10M.residential, 20) },
    ]);
    expect(busy.located[0]!.kind).toBe('road');
    expect(busy.located[0]!.levelDb).toBeGreaterThan(quiet.located[0]!.levelDb);
  });

  it('adds the road to the facade level', () => {
    const s = summarise(reading(RESIDENTIAL, { distanceM: 20, bearingDeg: 90 }), ROW);
    expect(s.facadeDb).toBeCloseTo(sumDb([LOOP_FACADE_DB.residential, s.located[0]!.levelDb]), 5);
    expect(s.facadeDb).toBeGreaterThan(LOOP_FACADE_DB.residential);
  });

  it('leaves out a road farther than 100 m and a reading with no road', () => {
    expect(summarise(reading(RESIDENTIAL, { distanceM: 150, bearingDeg: 0 }), ROW).located).toEqual([]);
    expect(summarise(reading(RESIDENTIAL), ROW).located).toEqual([]);
  });

  it('plays the city louder than before', () => {
    expect(LOOP_FACADE_DB.city).toBe(70);
  });
});
