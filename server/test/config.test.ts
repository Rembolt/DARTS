import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, MODEL_ID } from '../src/app.js';
import { loadEnv } from '../src/env.js';

describe('GET /api/config', () => {
  it('returns the SDK key and the model id, and nothing else', async () => {
    const app = createApp({ MATTERPORT_SDK_KEY: 'sdk123', MATTERPORT_API_KEY: 'id', MATTERPORT_API_TOKEN: 'secret' });
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sdkKey: 'sdk123', modelId: 'Ki9YdfpNKum' });
    expect(MODEL_ID).toBe('Ki9YdfpNKum');
  });

  it('answers 500 with a named error when the SDK key is missing', async () => {
    const res = await request(createApp({})).get('/api/config');
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'MATTERPORT_SDK_KEY is not set in .env' });
  });

  it('treats a blank SDK key as missing', async () => {
    const res = await request(createApp({ MATTERPORT_SDK_KEY: '   ' })).get('/api/config');
    expect(res.status).toBe(500);
  });
});

describe('loadEnv', () => {
  it('strips quotes and surrounding spaces', () => {
    const dir = mkdtempSync(join(tmpdir(), 'env-'));
    try {
      writeFileSync(join(dir, '.env'), '# comment\nMATTERPORT_SDK_KEY = "sdk123" \nOTHER=x\n');
      expect(loadEnv(join(dir, '.env')).MATTERPORT_SDK_KEY).toBe('sdk123');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns an empty object when the file does not exist', () => {
    expect(loadEnv(join(tmpdir(), 'no-such-dir', '.env'))).toEqual({});
  });
});

describe('GET /', () => {
  it('points to the app instead of answering Cannot GET', async () => {
    const res = await request(createApp({})).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http://localhost:5173');
  });
});
