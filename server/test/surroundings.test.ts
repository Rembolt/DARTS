import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pngjs from 'pngjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { IndexRow } from '../src/shared/contract.js';
import { createSurroundings, createSurroundingsWith } from '../src/surroundings/index.js';

const { PNG } = pngjs;
const FIXTURE_TEXT = readFileSync(join(import.meta.dirname, 'fixtures', 'vexcel-detect.json'), 'utf8');
const KEY = 'vexcel-test-key-123';
const ROW: IndexRow = {
  modelId: 'Ki9YdfpNKum', kind: 'home', propertyKey: 'p1', toursOnProperty: 1,
  address: '9117 Richland Drive', city: 'Houston', zip: '77078', lat: 29.838364, lon: -95.255745,
  propertyType: 'Detached', buildingName: null, sqft: 1436, beds: 4, baths: 2, price: 280000,
  yearBuilt: null, stories: null, facts: [],
};

type Call = { url: string; init: RequestInit };
/** A fake fetch that answers from a list, one per call (the last one repeats), and records every call. */
function fakeFetch(answers: (() => Promise<Response>)[]) {
  const calls: Call[] = [];
  const fn = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = answers[Math.min(calls.length - 1, answers.length - 1)]!;
    return next();
  }) as typeof fetch;
  return { fn, calls };
}
const ok = (text = FIXTURE_TEXT) => () => Promise.resolve(new Response(text, { status: 200 }));
const status = (code: number) => () => Promise.resolve(new Response('{}', { status: code }));
const timeout = () => () => Promise.reject(new DOMException('The operation timed out.', 'TimeoutError'));

let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'surroundings-')); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const sleeps: number[] = [];
const make = (fetchFn: typeof fetch, env: Record<string, string | undefined> = { VEXCEL_API_KEY: KEY }) => {
  sleeps.length = 0;
  return createSurroundingsWith({ cacheDir: dir, env, fetchFn, sleep: async ms => { sleeps.push(ms); }, log: () => {} });
};
const cacheFile = () => join(dir, `surroundings-${ROW.modelId}.json`);

describe('surroundings', () => {
  it('classifies and caches', async () => {
    const f = fakeFetch([ok()]);
    const s = make(f.fn);
    const first = await s.get(ROW);
    expect(first).toMatchObject({ areaClass: 'residential', source: 'vexcel', imageryDate: '2026-02-07', });
    expect(first.located.map(s => s.kind)).toEqual(['road']);   // the street 30 m from the demo house
    expect(first.counts.house).toBe(82);
    expect(first.roadBearingDeg).not.toBeNull();
    expect(first.facadeDb).toBeCloseTo(10 * Math.log10(10 ** 5 + 10 ** (first.located[0]!.levelDb / 10)), 5);   // the 50 dB loop plus the road
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0]!.url).toBe('https://api.vexcelgroup.com/v2/elements/detect');
    expect(existsSync(cacheFile())).toBe(true);
    expect(readdirSync(dir).filter(n => n.endsWith('.part'))).toEqual([]);

    expect(await s.get(ROW)).toEqual(first);
    expect(f.calls).toHaveLength(1);
    // A fresh source (a server restart) reads the cache too.
    const f2 = fakeFetch([ok()]);
    expect(await make(f2.fn).get(ROW)).toEqual(first);
    expect(f2.calls).toHaveLength(0);
  });

  it('shares one request between concurrent gets', async () => {
    let release!: () => void;
    const gate = new Promise<void>(r => { release = r; });
    const f = fakeFetch([async () => { await gate; return new Response(FIXTURE_TEXT, { status: 200 }); }]);
    const s = make(f.fn);
    const both = Promise.all([s.get(ROW), s.get(ROW)]);
    release();
    const [a, b] = await both;
    expect(a).toEqual(b);
    expect(a.source).toBe('vexcel');
    expect(f.calls).toHaveLength(1);
  });

  it('falls back without a key and does not cache', async () => {
    const f = fakeFetch([ok()]);
    const area = await make(f.fn, {}).get(ROW);
    expect(area).toMatchObject({ areaClass: 'residential', source: 'property_type', counts: {} });
    expect(f.calls).toHaveLength(0);
    expect(existsSync(cacheFile())).toBe(false);
  });

  it('falls back on a timeout and tries again next time', async () => {
    const f = fakeFetch([timeout(), ok()]);
    const s = make(f.fn);
    expect((await s.get(ROW)).source).toBe('property_type');
    expect(existsSync(cacheFile())).toBe(false);
    expect((await s.get(ROW)).source).toBe('vexcel');
    expect(f.calls).toHaveLength(2);
  });

  it('gives every request a time limit', async () => {
    const f = fakeFetch([ok()]);
    await make(f.fn).get(ROW);
    expect(f.calls[0]!.init.signal).toBeInstanceOf(AbortSignal);
  });

  it('backs off on 429 then succeeds', async () => {
    const f = fakeFetch([status(429), status(429), ok()]);
    const area = await make(f.fn).get(ROW);
    expect(area.source).toBe('vexcel');
    expect(sleeps).toEqual([1000, 2000]);
    expect(f.calls).toHaveLength(3);
  });

  it('falls back after three 429s', async () => {
    const f = fakeFetch([status(429)]);
    const area = await make(f.fn).get(ROW);
    expect(area.source).toBe('property_type');
    expect(sleeps).toEqual([1000, 2000, 4000]);
    expect(f.calls).toHaveLength(4);
    expect(existsSync(cacheFile())).toBe(false);
  });

  it('falls back on a non-OK answer, bad JSON or an answer with no features', async () => {
    for (const answer of [status(500), status(401), ok('not json'), ok(JSON.stringify({ type: 'FeatureCollection', images: [], features: [] }))]) {
      const area = await make(fakeFetch([answer]).fn).get(ROW);
      expect(area.source).toBe('property_type');
      expect(existsSync(cacheFile())).toBe(false);
    }
  });

  it('never rejects, even when fetch throws a plain error', async () => {
    const area = await make((async () => { throw new Error('boom'); }) as typeof fetch).get(ROW);
    expect(area.source).toBe('property_type');
  });

  it('does not call Vexcel for an id that could reach a path, or a row without coordinates', async () => {
    const f = fakeFetch([ok()]);
    const s = make(f.fn);
    expect((await s.get({ ...ROW, modelId: '../../x/abc' })).source).toBe('property_type');
    expect((await s.get({ ...ROW, modelId: 'Ab3' + 'x'.repeat(8), lat: Number.NaN })).source).toBe('property_type');
    expect(f.calls).toHaveLength(0);
    expect(readdirSync(dir)).toEqual([]);
  });

  it('treats a corrupt cache file as a miss', async () => {
    writeFileSync(cacheFile(), '{ half a fi');
    const f = fakeFetch([ok()]);
    expect((await make(f.fn).get(ROW)).source).toBe('vexcel');
    expect(f.calls).toHaveLength(1);
  });

  it('adds a highway to the facade level', async () => {
    // A highway mask that is all white, 95–105 m east of the property: its nearest pixel is about 96 m away.
    const png = new PNG({ width: 10, height: 10 });
    png.data.fill(255);
    const mLon = 111_320 * Math.cos((ROW.lat * Math.PI) / 180);
    const [w, e] = [ROW.lon + 95 / mLon, ROW.lon + 105 / mLon];
    const [s, n] = [ROW.lat - 5 / 111_320, ROW.lat + 5 / 111_320];
    const answer = { type: 'FeatureCollection', images: [], features: [{ type: 'Feature', properties: { label: 'highway', detections: [{
      bbox: `POLYGON ((${w} ${n}, ${e} ${n}, ${e} ${s}, ${w} ${s}, ${w} ${n}))`, confidence: 0.75,
      'pixel-bbox': [0, 0, 10, 10], 'pixel-mask': PNG.sync.write(png).toString('base64'),
    }] } }] };
    const area = await make(fakeFetch([ok(JSON.stringify(answer))]).fn).get(ROW);
    expect(area.located).toHaveLength(1);
    expect(area.located[0]).toMatchObject({ kind: 'highway' });
    expect(area.located[0]!.levelDb).toBeCloseTo(70, 0);
    expect(area.located[0]!.bearingDeg).toBeCloseTo(90, -1);
    expect(area.facadeDb).toBeGreaterThan(70);
  });

  it('drops a highway more than 300 m away', async () => {
    const mLon = 111_320 * Math.cos((ROW.lat * Math.PI) / 180);
    const [w, e] = [ROW.lon + 310 / mLon, ROW.lon + 330 / mLon];
    const answer = { type: 'FeatureCollection', images: [], features: [{ type: 'Feature', properties: { label: 'highway', detections: [{
      bbox: `POLYGON ((${w} ${ROW.lat + 0.0001}, ${e} ${ROW.lat + 0.0001}, ${e} ${ROW.lat - 0.0001}, ${w} ${ROW.lat - 0.0001}, ${w} ${ROW.lat + 0.0001}))`,
      confidence: 0.75,
    }] } }] };
    const area = await make(fakeFetch([ok(JSON.stringify(answer))]).fn).get(ROW);
    expect(area.located).toEqual([]);
    expect(area.counts.highway).toBe(1);
  });

  it('sends the key only in the header', async () => {
    const f = fakeFetch([ok()]);
    await make(f.fn).get(ROW);
    const { url, init } = f.calls[0]!;
    expect(url).not.toContain(KEY);
    expect(String(init.body)).not.toContain(KEY);
    expect(new Headers(init.headers).get('X-API-KEY')).toBe(KEY);
    expect(init.method).toBe('POST');
    expect(readFileSync(cacheFile(), 'utf8')).not.toContain(KEY);
  });

  it('createSurroundings keeps the Lane 0 signature', async () => {
    const s = createSurroundings({ cacheDir: dir, env: {} });
    expect((await s.get(ROW)).source).toBe('property_type');
  });
});
