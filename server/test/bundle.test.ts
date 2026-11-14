import { it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

const MISSING = 'Matterport Bundle missing. Run: npm run fetch-bundle';
const tempDirs: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

it('serves files from the bundle folder', async () => {
  const dir = tempDir();
  writeFileSync(join(dir, 'showcase.html'), '<html>viewer</html>');
  const res = await request(createApp({}, { bundleDir: dir })).get('/bundle/showcase.html');
  expect(res.status).toBe(200);
  expect(res.text).toBe('<html>viewer</html>');
});

it('explains how to fetch the bundle when it is missing', async () => {
  const res = await request(createApp({}, { bundleDir: join(tmpdir(), 'no-such-bundle') })).get('/bundle/showcase.html');
  expect(res.status).toBe(503);
  expect(res.text).toBe(MISSING);
});

it('answers the missing message when no bundle folder is configured', async () => {
  const res = await request(createApp({})).get('/bundle/showcase.html');
  expect(res.status).toBe(503);
});

it('answers the missing message when the folder exists but has no showcase.html', async () => {
  const dir = tempDir();
  writeFileSync(join(dir, 'other.txt'), 'not the viewer');
  const res = await request(createApp({}, { bundleDir: dir })).get('/bundle/showcase.html');
  expect(res.status).toBe(503);
  expect(res.text).toBe(MISSING);
});

it('picks up a bundle fetched after the server started', async () => {
  const dir = tempDir();
  const app = createApp({}, { bundleDir: dir });
  expect((await request(app).get('/bundle/showcase.html')).status).toBe(503);

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'showcase.html'), '<html>late</html>');
  const res = await request(app).get('/bundle/showcase.html');
  expect(res.status).toBe(200);
  expect(res.text).toBe('<html>late</html>');
});

it('answers 404, not "missing", for an unknown file in a present bundle', async () => {
  const dir = tempDir();
  writeFileSync(join(dir, 'showcase.html'), '<html>viewer</html>');
  const res = await request(createApp({}, { bundleDir: dir })).get('/bundle/no-such-asset.js');
  expect(res.status).toBe(404);
});

it('answers HEAD requests, which the app uses to check the bundle', async () => {
  const dir = tempDir();
  writeFileSync(join(dir, 'showcase.html'), '<html>viewer</html>');
  expect((await request(createApp({}, { bundleDir: dir })).head('/bundle/showcase.html')).status).toBe(200);
  expect((await request(createApp({}, { bundleDir: join(dir, 'nope') })).head('/bundle/showcase.html')).status).toBe(503);
});
