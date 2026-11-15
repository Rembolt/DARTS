import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { DEMO_MODEL_ID } from '../src/shared/contract.js';
import { loadEnv, serverEnv } from '../src/env.js';

describe('GET /api/config', () => {
  it('returns the SDK key and the model id, and nothing else', async () => {
    const app = createApp({ MATTERPORT_SDK_KEY: 'sdk123', MATTERPORT_API_KEY: 'id', MATTERPORT_API_TOKEN: 'secret' });
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sdkKey: 'sdk123', modelId: 'Ki9YdfpNKum' });
    expect(DEMO_MODEL_ID).toBe('Ki9YdfpNKum');
  });

  it('serves an allowed id', async () => {
    const app = createApp({ MATTERPORT_SDK_KEY: 'k' }, { allowedIds: new Set([DEMO_MODEL_ID, 'aaaaaaaaaaa']) });
    const res = await request(app).get('/api/config?m=aaaaaaaaaaa');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sdkKey: 'k', modelId: 'aaaaaaaaaaa' });
  });

  it('refuses an unknown id', async () => {
    const app = createApp({ MATTERPORT_SDK_KEY: 'k' }, { allowedIds: new Set([DEMO_MODEL_ID, 'aaaaaaaaaaa']) });
    const res = await request(app).get('/api/config?m=bbbbbbbbbbb');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('unknown_model');
    expect(res.body.error).toBe('Not possible to load: this property is not in the catalogue.');
    expect(res.body.retry).toBe(false);
  });

  it('refuses a malformed id', async () => {
    const res = await request(createApp({ MATTERPORT_SDK_KEY: 'k' })).get('/api/config?m=../x');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('unknown_model');
  });

  it('defaults to the demo house', async () => {
    const app = createApp({ MATTERPORT_SDK_KEY: 'k' }, { allowedIds: new Set(['aaaaaaaaaaa']) });
    const res = await request(app).get('/api/config');
    expect(res.body.modelId).toBe(DEMO_MODEL_ID);
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

describe('serverEnv', () => {
  it('puts non-empty environment variables over the file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'env-'));
    try {
      const file = join(dir, '.env');
      writeFileSync(file, 'A=from-file\nB=from-file\nC=from-file\n');
      expect(serverEnv(file, { A: 'from-env', B: '  ', D: 'only-env', E: undefined })).toEqual({
        A: 'from-env',
        B: 'from-file',
        C: 'from-file',
        D: 'only-env',
      });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('works with no file at all, as on a deployment', () => {
    expect(serverEnv(join(tmpdir(), 'no-such-dir', '.env'), { MATTERPORT_SDK_KEY: 'k' })).toEqual({ MATTERPORT_SDK_KEY: 'k' });
  });
});

describe('GET /', () => {
  it('points to the app instead of answering Cannot GET', async () => {
    const res = await request(createApp({})).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('http://localhost:5173');
  });
});
