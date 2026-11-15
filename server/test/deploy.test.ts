import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { parseLimit, rateLimit } from '../src/guard.js';

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

function builtPage(): string {
  const dir = mkdtempSync(join(tmpdir(), 'page-'));
  dirs.push(dir);
  mkdirSync(join(dir, 'assets'));
  writeFileSync(join(dir, 'index.html'), '<html>page</html>');
  writeFileSync(join(dir, 'assets', 'index-abc123.js'), 'console.log(1)');
  mkdirSync(join(dir, 'audio'));
  writeFileSync(join(dir, 'audio', 'loop.ogg'), 'ogg');
  return dir;
}

function basic(password: string, user = 'anyone'): string {
  return `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;
}

describe('serving the built page', () => {
  it('serves index.html at the root and for unknown page paths, never cached', async () => {
    const app = createApp({}, { pageDir: builtPage() });
    for (const path of ['/', '/some/page']) {
      const res = await request(app).get(path);
      expect(res.status).toBe(200);
      expect(res.text).toBe('<html>page</html>');
      expect(res.headers['cache-control']).toBe('no-cache');
    }
  });

  it('serves hashed assets for a year and other files as they are', async () => {
    const app = createApp({}, { pageDir: builtPage() });
    const asset = await request(app).get('/assets/index-abc123.js');
    expect(asset.status).toBe(200);
    expect(asset.headers['cache-control']).toContain('immutable');
    expect((await request(app).get('/audio/loop.ogg')).status).toBe(200);
    expect((await request(app).get('/assets/missing.js')).status).toBe(404);
  });

  it('keeps /api and /bundle answers instead of the page', async () => {
    const app = createApp({ MATTERPORT_SDK_KEY: 'k' }, { pageDir: builtPage() });
    expect((await request(app).get('/api/health')).body).toHaveProperty('bundle');
    expect((await request(app).get('/api/nope')).text).not.toContain('page');
    expect((await request(app).get('/bundle/showcase.html')).status).toBe(503);
  });

  it('falls back to the API-only answer when the page is not built', async () => {
    const res = await request(createApp({}, { pageDir: join(tmpdir(), 'no-such-page') })).get('/');
    expect(res.text).toContain('API server');
  });
});

describe('SITE_PASSWORD', () => {
  it('asks for the password everywhere except the health check', async () => {
    const app = createApp({ SITE_PASSWORD: 'open sesame' }, { pageDir: builtPage() });
    const page = await request(app).get('/');
    expect(page.status).toBe(401);
    expect(page.headers['www-authenticate']).toMatch(/^Basic/);
    expect((await request(app).get('/api/config')).status).toBe(401);
    expect((await request(app).get('/bundle/showcase.html')).status).toBe(401);
    expect((await request(app).get('/api/health')).status).toBe(200);
  });

  it('lets the right password in with any user name, and refuses a wrong one', async () => {
    const app = createApp({ SITE_PASSWORD: 'open sesame' }, { pageDir: builtPage() });
    expect((await request(app).get('/').set('Authorization', basic('open sesame'))).status).toBe(200);
    expect((await request(app).get('/').set('Authorization', basic('open sesame', ''))).status).toBe(200);
    expect((await request(app).get('/').set('Authorization', basic('wrong'))).status).toBe(401);
    expect((await request(app).get('/').set('Authorization', 'Basic !!!')).status).toBe(401);
  });

  it('is off when not set', async () => {
    expect((await request(createApp({}, { pageDir: builtPage() })).get('/')).status).toBe(200);
  });
});

describe('rate limit', () => {
  it('parses only whole numbers above zero', () => {
    expect(parseLimit('20')).toBe(20);
    for (const bad of [undefined, '', '0', '-1', '2.5', 'abc']) expect(parseLimit(bad)).toBeUndefined();
  });

  it('answers busy (429) past the limit and lets requests through again in the next window', async () => {
    let t = 0;
    const app = express();
    app.use(rateLimit(2, 60_000, () => t));
    app.get('/x', (_req, res) => { res.send('ok'); });
    expect((await request(app).get('/x')).status).toBe(200);
    expect((await request(app).get('/x')).status).toBe(200);
    const third = await request(app).get('/x');
    expect(third.status).toBe(429);
    expect(third.body.code).toBe('busy');
    expect(third.headers['retry-after']).toBe('60');
    t = 60_000;
    expect((await request(app).get('/x')).status).toBe(200);
  });

  it('applies to the paid routes only when RATE_LIMIT_PER_MIN is set', async () => {
    const limited = createApp({ RATE_LIMIT_PER_MIN: '1' });
    expect((await request(limited).post('/api/agent')).status).not.toBe(429);
    expect((await request(limited).post('/api/agent')).status).toBe(429);
    // Speech gets four times the limit: one answer is several short requests.
    for (let i = 0; i < 4; i++) expect((await request(limited).post('/api/tts')).status).not.toBe(429);
    expect((await request(limited).post('/api/tts')).status).toBe(429);
    // Each route has its own count, and the free routes have none.
    expect((await request(limited).post('/api/jev')).status).not.toBe(429);
    expect((await request(limited).get('/api/health')).status).toBe(200);
    expect((await request(limited).get('/api/health')).status).toBe(200);

    const open = createApp({});
    for (let i = 0; i < 3; i++) expect((await request(open).post('/api/agent')).status).not.toBe(429);
  });
});
