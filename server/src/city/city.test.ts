import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import express from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCityMaps } from './index.js';
import { cityRouter } from './routes.js';
import type { Search } from '../search/index.js';

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(2000, 1)]);
let dir: string;
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'city-')); });
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const quiet = () => {};

describe('createCityMaps', () => {
  it('fetches once, sends the key in a header, and then serves the cached file', async () => {
    const fetchFn = vi.fn(async () => new Response(JPEG, { status: 200 })) as unknown as typeof fetch;
    const maps = createCityMaps({ cacheDir: dir, env: { VEXCEL_API_KEY: 'secret' }, fetchFn, log: quiet });
    expect((await maps.image('houston'))?.length).toBe(JPEG.length);
    expect((await maps.image('houston'))?.length).toBe(JPEG.length);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchFn as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).not.toContain('secret');
    expect((init.headers as Record<string, string>)['X-API-KEY']).toBe('secret');
  });
  it('answers null with no key, an unknown city, an error status, or a body that is not a JPEG', async () => {
    const bad = vi.fn(async () => new Response('<html>nope</html>'.repeat(100), { status: 200 })) as unknown as typeof fetch;
    expect(await createCityMaps({ cacheDir: dir, env: {}, log: quiet }).image('houston')).toBeNull();
    const maps = createCityMaps({ cacheDir: dir, env: { VEXCEL_API_KEY: 'k' }, fetchFn: bad, log: quiet });
    expect(await maps.image('atlantis')).toBeNull();
    expect(await maps.image('houston')).toBeNull();
    const err = vi.fn(async () => new Response('', { status: 500 })) as unknown as typeof fetch;
    expect(await createCityMaps({ cacheDir: dir, env: { VEXCEL_API_KEY: 'k' }, fetchFn: err, log: quiet }).image('los-angeles')).toBeNull();
  });
});

describe('cityRouter', () => {
  const row = { modelId: 'aaaaaaaaaaa', address: '1 Main St', city: 'Houston', lat: 29.7, lon: -95.4 };
  const search = { lookup: (id: string) => (id === row.modelId ? row : null) } as unknown as Search;
  function app(env: Record<string, string>) {
    const a = express();
    a.use('/api', cityRouter({ cities: createCityMaps({ cacheDir: dir, env, log: quiet, fetchFn: (async () => new Response('', { status: 500 })) as unknown as typeof fetch }), search }));
    return a;
  }

  it('lists the two cities with their image links', async () => {
    const res = await request(app({})).get('/api/city');
    expect(res.body.map((c: { slug: string }) => c.slug)).toEqual(['houston', 'los-angeles']);
  });
  it('serves a cached image and says 503 when there is none', async () => {
    writeFileSync(join(dir, 'city-houston.jpg'), JPEG);
    const ok = await request(app({})).get('/api/city/houston/image.jpg');
    expect(ok.status).toBe(200);
    expect(ok.headers['content-type']).toBe('image/jpeg');
    expect((await request(app({})).get('/api/city/los-angeles/image.jpg')).status).toBe(503);
    expect((await request(app({})).get('/api/city/atlantis/image.jpg')).status).toBe(400);
  });
  it('gives coordinates for known ids only, and ignores malformed ones', async () => {
    const res = await request(app({})).get('/api/places?ids=aaaaaaaaaaa,bbbbbbbbbbb,../etc');
    expect(res.body).toEqual([row]);
  });
});

describe('detail tiles', () => {
  it('serve only the known heights inside the two cities, from a snapped centre', async () => {
    const fetchFn = vi.fn(async () => new Response(JPEG, { status: 200 })) as unknown as typeof fetch;
    const maps = createCityMaps({ cacheDir: dir, env: { VEXCEL_API_KEY: 'k' }, fetchFn, log: quiet });
    expect(await maps.detail(29.76, -95.37, 3)).toBeNull(); // not a level
    expect(await maps.detail(40.7, -74, 2)).toBeNull(); // not Houston or Los Angeles
    expect(await maps.detail(Number.NaN, -95.37, 2)).toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
    expect(await maps.detail(29.7601, -95.3701, 2)).not.toBeNull();
    expect(await maps.detail(29.7602, -95.3699, 2)).not.toBeNull(); // same snapped tile: cached
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe('the country picture', () => {
  it('comes from NASA with no key and nothing about the user, and is cached', async () => {
    const fetchFn = vi.fn(async () => new Response(JPEG, { status: 200 })) as unknown as typeof fetch;
    const maps = createCityMaps({ cacheDir: dir, env: {}, fetchFn, log: quiet });
    expect((await maps.usa())?.length).toBe(JPEG.length);
    expect((await maps.usa())?.length).toBe(JPEG.length);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchFn as unknown as { mock: { calls: [string, RequestInit | undefined][] } }).mock.calls[0];
    expect(url).toContain('gibs.earthdata.nasa.gov');
    expect(init?.headers).toBeUndefined();
  });
});
