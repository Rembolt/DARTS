import { describe, expect, it } from 'vitest';
import type { IndexRow } from '../src/shared/contract.js';
import {
  AIRPORTS,
  LOOP_FACADE_DB,
  airportsNear,
  bearingDeg,
  classifyArea,
  fallbackArea,
  lineLevelDb,
  planeLevelDb,
  square,
  sumDb,
} from '../src/surroundings/area.js';

const row = (over: Partial<IndexRow>): IndexRow => ({
  modelId: 'Ki9YdfpNKum', kind: 'home', propertyKey: 'p1', toursOnProperty: 1,
  address: '9117 Richland Drive', city: 'Houston', zip: '77078', lat: 29.838364, lon: -95.255745,
  propertyType: 'Detached', buildingName: null, sqft: 1436, beds: 4, baths: 2, price: 280000,
  yearBuilt: null, stories: null, facts: [], ...over,
});
const HOME = row({});
const RETAIL = row({ kind: 'commercial', propertyType: 'GeneralRetail' });
const INDUSTRIAL = row({ kind: 'commercial', propertyType: 'Industrial' });

describe('classifyArea', () => {
  it('classifies the measured places', () => {
    expect(classifyArea({ house: 82, 'commercial building': 0 })).toBe('residential');
    expect(classifyArea({ house: 0, 'commercial building': 13, 'parking lot': 3 })).toBe('commercial');
    expect(classifyArea({ warehouse: 3, house: 30 })).toBe('industrial');
    expect(classifyArea({ house: 25, 'commercial building': 4 })).toBe('city');
    expect(classifyArea({})).toBe('nature');
  });
});

describe('levels', () => {
  it('a highway 100 m away is 70 dB', () => expect(lineLevelDb(80, 100)).toBeCloseTo(70, 5));
  it('a line source closer than 10 m keeps its 10 m level', () => expect(lineLevelDb(80, 2)).toBe(80));
  it('planes fall 6 dB per doubling past 3 km', () => {
    expect(planeLevelDb(2)).toBe(70);
    expect(planeLevelDb(6)).toBeCloseTo(63.98, 1);
  });
  it('sums levels as energy', () => expect(sumDb([60, 60])).toBeCloseTo(63.01, 1));
  it('has the spec loop levels', () =>
    expect(LOOP_FACADE_DB).toEqual({ commercial: 62, city: 65, industrial: 65, residential: 50, nature: 42 }));
});

describe('airports', () => {
  it('lists the eight hardcoded airports', () =>
    expect(AIRPORTS.map(a => a.code).sort()).toEqual(['BUR', 'EFD', 'HOU', 'IAH', 'LAX', 'LGB', 'SMO', 'VNY']));
  // The plan's test used the demo house (29.838, -95.256), but IAH is 18.2 km and HOU 21.5 km from it, so the
  // spec's 15 km rule finds nothing there. A point 5 km north of HOU tests the same thing.
  it('finds HOU from a point 5 km north of it', () => {
    const found = airportsNear(29.6454 + 5 / 111.32, -95.2789);
    expect(found).toHaveLength(1);
    expect(found[0]!.kind).toBe('airport');
    expect(found[0]!.distanceM).toBeCloseTo(5000, -2);
    expect(found[0]!.bearingDeg).toBeCloseTo(180, 0);
    expect(found[0]!.levelDb).toBeCloseTo(planeLevelDb(found[0]!.distanceM / 1000), 5);
  });
  it('finds nothing more than 15 km from every airport', () => {
    expect(airportsNear(29.838364, -95.255745)).toEqual([]);
    expect(airportsNear(31, -97)).toEqual([]);
  });
  it('keeps only the nearest when two are in range', () => {
    // Between LAX and SMO: both within 15 km.
    const found = airportsNear(33.97, -118.43);
    expect(found).toHaveLength(1);
  });
});

describe('bearingDeg', () => {
  const P = { lat: 29.8, lon: -95.3 };
  it('bearings', () => {
    expect(bearingDeg(P, { lat: 29.81, lon: -95.3 })).toBeCloseTo(0, 0);
    expect(bearingDeg(P, { lat: 29.8, lon: -95.29 })).toBeCloseTo(90, 0);
    expect(bearingDeg(P, { lat: 29.79, lon: -95.3 })).toBeCloseTo(180, 0);
    expect(bearingDeg(P, { lat: 29.8, lon: -95.31 })).toBeCloseTo(270, 0);
  });
});

describe('fallbackArea', () => {
  it('falls back by property type and says so', () => {
    expect(fallbackArea(HOME)).toMatchObject({
      areaClass: 'residential', source: 'property_type', located: expect.any(Array),
      counts: {}, roadBearingDeg: null, imageryDate: null, facadeDb: 50,
    });
    expect(fallbackArea(RETAIL).areaClass).toBe('commercial');
    expect(fallbackArea(INDUSTRIAL).areaClass).toBe('industrial');
  });
  it('reads the spec types in any spelling', () => {
    for (const t of ['Office', 'General Retail', 'Hospitality', 'MixedUse', 'Mixed Use'])
      expect(fallbackArea(row({ kind: 'commercial', propertyType: t })).areaClass, t).toBe('commercial');
    expect(fallbackArea(row({ kind: 'commercial', propertyType: 'Flex' })).areaClass).toBe('industrial');
    expect(fallbackArea(row({ kind: 'apartment', propertyType: 'Multifamily' })).areaClass).toBe('residential');
  });
  it('keeps the airport and adds it to the facade level', () => {
    const near = fallbackArea(row({ lat: 29.6454 + 5 / 111.32, lon: -95.2789 }));
    expect(near.located).toHaveLength(1);
    expect(near.facadeDb).toBeCloseTo(sumDb([50, near.located[0]!.levelDb]), 5);
    expect(near.facadeDb).toBeGreaterThan(65);
  });
});

describe('square', () => {
  it('draws a closed WKT square, lon before lat', () => {
    const wkt = square(29.8, -95.3, 200);
    const pts = wkt.replace('POLYGON((', '').replace('))', '').split(',').map(p => p.split(' ').map(Number));
    expect(pts).toHaveLength(5);
    expect(pts[0]).toEqual(pts[4]);
    const [w, s] = pts[0] as [number, number];
    const [e, n] = pts[2] as [number, number];
    expect((n - s) * 111_320).toBeCloseTo(400, 3);
    expect((e - w) * 111_320 * Math.cos((29.8 * Math.PI) / 180)).toBeCloseTo(400, 3);
    expect(w).toBeLessThan(-95.3);
  });
});
