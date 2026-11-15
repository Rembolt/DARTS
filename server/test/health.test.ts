import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('GET /api/health', () => {
  it('reports booleans and never a key', async () => {
    const res = await request(
      createApp({ MATTERPORT_SDK_KEY: 'sdk-secret', CLAUDE_API: 'c-secret' }, { health: () => ({ index: true }) }),
    ).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ bundle: false, sdkKey: true, matterport: false, vexcel: false, claude: true, index: true });
    expect(JSON.stringify(res.body)).not.toMatch(/secret/);
  });

  it('needs both Matterport keys, the Vexcel key and the Bundle file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'bundle-'));
    dirs.push(dir);
    writeFileSync(join(dir, 'showcase.html'), '<html></html>');
    const env = { MATTERPORT_API_KEY: 'a', MATTERPORT_API_TOKEN: 'b', VEXCEL_API_KEY: 'v' };
    const res = await request(createApp(env, { bundleDir: dir })).get('/api/health');
    expect(res.body).toEqual({ bundle: true, sdkKey: false, matterport: true, vexcel: true, claude: false, index: false });
    const half = await request(createApp({ MATTERPORT_API_KEY: 'a' })).get('/api/health');
    expect(half.body.matterport).toBe(false);
  });
});
