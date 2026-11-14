import { it, expect } from 'vitest';
import request from 'supertest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

it('serves files from the bundle folder', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-'));
  writeFileSync(join(dir, 'showcase.html'), '<html>viewer</html>');
  const res = await request(createApp({}, { bundleDir: dir })).get('/bundle/showcase.html');
  expect(res.status).toBe(200);
  expect(res.text).toBe('<html>viewer</html>');
});

it('explains how to fetch the bundle when it is missing', async () => {
  const res = await request(createApp({}, { bundleDir: join(tmpdir(), 'no-such-bundle') })).get('/bundle/showcase.html');
  expect(res.status).toBe(503);
  expect(res.text).toBe('Matterport Bundle missing. Run: npm run fetch-bundle');
});

it('answers the missing message when no bundle folder is configured', async () => {
  const res = await request(createApp({})).get('/bundle/showcase.html');
  expect(res.status).toBe(503);
});
