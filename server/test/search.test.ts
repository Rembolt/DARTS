import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSearch } from '../src/search/index.js';
import { CITY_BOXES, distanceKm, searchRows } from '../src/search/query.js';
import type { IndexRow, NotPossible, SearchQuery, SearchResult } from '../src/shared/contract.js';

const base: IndexRow = {
  modelId: '', kind: 'home', propertyKey: '', toursOnProperty: 1, address: '', city: 'Houston', zip: '77008',
  lat: 29.8, lon: -95.4, propertyType: 'Detached', buildingName: null, sqft: 2000, beds: 3, baths: 2,
  price: 300000, yearBuilt: null, stories: null, facts: [],
};
const row = (modelId: string, over: Partial<IndexRow>): IndexRow => ({ ...base, modelId, propertyKey: `home:${modelId}`, ...over });

// Six hand-made rows. The query point is (29.80, -95.40).
const ROWS: IndexRow[] = [
  row('farHome0000', { lat: 29.9, lon: -95.4, sqft: 1800 }), // ~11 km, matches
  row('nearHome000', { lat: 29.81, lon: -95.4, sqft: 1600 }), // ~1 km, matches
  row('smallHome00', { lat: 29.8, lon: -95.41, sqft: 900 }), // too small
  row('unpriced000', { lat: 29.82, lon: -95.4, price: null, beds: 4 }), // no price
  row('office00000', { kind: 'commercial', propertyType: 'Office', propertyKey: 'commercial:1', sqft: 50000, price: null, beds: null, baths: null }),
  row('laHome00000', { city: 'Los Angeles', zip: '90012', lat: 34.05, lon: -118.25 }),
];

const Q: SearchQuery = {
  city: 'Houston', zip: null, near: null, kind: 'any', propertyTypes: null,
  minSqft: null, maxPrice: null, minBeds: null, limit: 8,
};
const NEAR = { lat: 29.8, lon: -95.4, radiusKm: 15 };

const ok = (value: SearchResult | NotPossible): SearchResult => {
  if ('code' in value) throw new Error(`expected a result, got ${value.code}`);
  return value;
};
const ids = (value: SearchResult | NotPossible) => ok(value).rows.map((r) => r.modelId);

describe('searchRows', () => {
  it('filters by city, kind and size, nearest first', () => {
    const result = ok(searchRows(ROWS, { ...Q, near: NEAR, kind: 'home', minSqft: 1500 }));
    expect(result.rows.map((r) => r.modelId)).toEqual(['nearHome000', 'unpriced000', 'farHome0000']);
    expect(result.total).toBe(3);
  });
  it('keeps only rows within the radius', () => {
    expect(ids(searchRows(ROWS, { ...Q, near: { ...NEAR, radiusKm: 5 }, kind: 'home', minSqft: 1500 }))).toEqual(['nearHome000', 'unpriced000']);
  });
  it('answers outside_coverage for a point in Boston', () =>
    expect(searchRows(ROWS, { ...Q, near: { lat: 42.36, lon: -71.06, radiusKm: 5 } })).toMatchObject({ code: 'outside_coverage' }));
  it('answers outside_coverage for a Los Angeles point in a Houston search', () =>
    expect(searchRows(ROWS, { ...Q, near: { lat: 34.05, lon: -118.25, radiusKm: 5 } })).toMatchObject({ code: 'outside_coverage' }));
  it('returns one row per property', () => {
    const twoTours = [
      row('tourOne0000', { propertyKey: 'commercial:9', toursOnProperty: 2, kind: 'apartment' }),
      row('tourTwo0000', { propertyKey: 'commercial:9', toursOnProperty: 2, kind: 'apartment' }),
    ];
    const result = ok(searchRows(twoTours, { ...Q, kind: 'apartment' }));
    expect(result.rows.map((r) => [r.modelId, r.toursOnProperty])).toEqual([['tourOne0000', 2]]);
    expect(result.total).toBe(1);
  });
  it('gives the next tour of a property when the first is unusable', () => {
    const twoTours = [
      row('tourOne0000', { propertyKey: 'commercial:9', toursOnProperty: 2 }),
      row('tourTwo0000', { propertyKey: 'commercial:9', toursOnProperty: 2 }),
    ];
    expect(ids(searchRows(twoTours, Q, (id) => id === 'tourOne0000'))).toEqual(['tourTwo0000']);
  });
  it('drops unpriced rows under a price limit and says so', () => {
    const result = ok(searchRows(ROWS, { ...Q, kind: 'home', maxPrice: 400000 }));
    expect(result.rows.map((r) => r.modelId)).not.toContain('unpriced000');
    expect(result.total).toBe(3);
    expect(result.notes[0]).toMatch(/1 propert.* no listed price/);
  });
  it('skips ids marked unusable', () => {
    expect(ids(searchRows(ROWS, { ...Q, kind: 'home' }, (id) => id === 'nearHome000'))).not.toContain('nearHome000');
  });
  it('says which filter to relax when nothing matches', () => {
    const result = ok(searchRows(ROWS, { ...Q, kind: 'home', minBeds: 9 }));
    expect(result.total).toBe(0);
    expect(result.rows).toEqual([]);
    expect(result.notes[0]).toMatch(/bedrooms.*4 properties/);
  });
  it('names the filter that frees the most rows', () => {
    // Without the size limit, all 5 Houston properties (zip 77008) match; without the zip, none is that big.
    const result = ok(searchRows(ROWS, { ...Q, zip: '77008', minSqft: 100000 }));
    expect(result.total).toBe(0);
    expect(result.notes[0]).toMatch(/sqft.*5 properties/);
  });
  it('says so when no single filter would help', () => {
    const result = ok(searchRows(ROWS, { ...Q, minSqft: 100000, minBeds: 9 }));
    expect(result.total).toBe(0);
    expect(result.notes[0]).toMatch(/more than one/);
  });
  it('filters by zip and property type, case-insensitively', () => {
    expect(ids(searchRows(ROWS, { ...Q, zip: '77008', propertyTypes: ['office'] }))).toEqual(['office00000']);
  });
  it('sorts by size without a point or zip, biggest first', () => {
    expect(ids(searchRows(ROWS, { ...Q, kind: 'home' }))[0]).toBe('unpriced000');
    expect(ids(searchRows(ROWS, Q))[0]).toBe('office00000');
  });
  it('sorts by distance to the centroid of the zip matches', () => {
    const zipRows = [
      row('edgeA000000', { lat: 29.7, lon: -95.4, sqft: 5000 }),
      row('middle00000', { lat: 29.75, lon: -95.4, sqft: 100 }),
      row('edgeB000000', { lat: 29.8, lon: -95.4, sqft: 3000 }),
    ];
    expect(ids(searchRows(zipRows, { ...Q, zip: '77008' }))[0]).toBe('middle00000');
  });
  it('clamps limit and radius', () => {
    const many = Array.from({ length: 20 }, (_, i) => row(`many${String(i).padStart(7, '0')}`, { lat: 29.8 + i * 0.001 }));
    const result = ok(searchRows(many, { ...Q, limit: 50 }));
    expect(result.rows.length).toBe(8);
    expect(result.total).toBe(20);
    expect(ok(searchRows(many, { ...Q, limit: 0 })).rows.length).toBe(1);
    // A radius of 100 km is clamped to 15: the row ~11 km away stays, the row ~22 km away goes.
    const spread = [row('at11km00000', { lat: 29.9 }), row('at22km00000', { lat: 30.0 })];
    expect(ids(searchRows(spread, { ...Q, near: { ...NEAR, radiusKm: 100 } }))).toEqual(['at11km00000']);
  });
});

describe('distanceKm and CITY_BOXES', () => {
  it('measures great-circle distance', () => {
    expect(distanceKm({ lat: 29.8, lon: -95.4 }, { lat: 29.9, lon: -95.4 })).toBeCloseTo(11.12, 1);
  });
  it('boxes both cities', () => {
    expect(CITY_BOXES.Houston).toEqual({ latMin: 29.4, latMax: 30.3, lonMin: -96.0, lonMax: -94.8 });
    expect(CITY_BOXES['Los Angeles']).toEqual({ latMin: 33.6, latMax: 34.5, lonMin: -118.9, lonMax: -117.6 });
  });
});

describe('createSearch', () => {
  const dirs: string[] = [];
  const tempDir = () => {
    const dir = mkdtempSync(join(tmpdir(), 'search-'));
    dirs.push(dir);
    return dir;
  };
  afterEach(() => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  it('reports not ready without an index file', () => {
    const s = createSearch({ cacheDir: tempDir() });
    expect(s.ready()).toBe(false);
    expect(s.lookup('nearHome000')).toBeNull();
    expect(s.search(Q)).toMatchObject({ code: 'index_missing' });
  });
  it('treats an unreadable index as missing', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'index.json'), '{not json');
    const s = createSearch({ cacheDir: dir });
    expect(s.ready()).toBe(false);
    expect(s.search(Q)).toMatchObject({ code: 'index_missing' });
  });
  it('loads the index, looks up any tour and searches', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'index.json'), JSON.stringify(ROWS));
    const s = createSearch({ cacheDir: dir });
    expect(s.ready()).toBe(true);
    expect(s.lookup('laHome00000')).toMatchObject({ city: 'Los Angeles' });
    expect(s.lookup('bbbbbbbbbbb')).toBeNull();
    expect(ids(s.search({ ...Q, city: 'Los Angeles' }))).toEqual(['laHome00000']);
  });
  it('reloads when the file changes', () => {
    const dir = tempDir();
    const file = join(dir, 'index.json');
    writeFileSync(file, JSON.stringify(ROWS.slice(0, 1)));
    const s = createSearch({ cacheDir: dir });
    expect(s.lookup('nearHome000')).toBeNull();
    writeFileSync(file, JSON.stringify(ROWS));
    const later = new Date(Date.now() + 5000);
    utimesSync(file, later, later);
    expect(s.lookup('nearHome000')).not.toBeNull();
  });
});
