import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp, MODEL_ID } from '../src/app.js';
import { createMeshSource, MeshError, type MeshSource } from '../src/mesh.js';

const ENV = { MATTERPORT_API_KEY: 'tokenid', MATTERPORT_API_TOKEN: 'supersecret' };
const OBJ = 'v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n';
const URL_50K = 'https://cdn.example/defurnished_50k.obj?sig=abc';
const URL_500K = 'https://cdn.example/lod3_room0_chunk1.obj?sig=abc';

const tempDirs: string[] = [];
function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'mesh-'));
  tempDirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

type Call = { url: string; init?: RequestInit };

const meshList = (meshes: unknown[]) => ({ data: { model: { assets: { meshes } } } });
const BOTH = meshList([
  { format: 'obj', resolution: '500k', status: 'available', url: URL_500K },
  { format: 'obj', resolution: '50k', status: 'available', url: URL_50K },
]);

/** A fake fetch: the GraphQL POST answers `graphql`, the CDN GET answers `download`. Records every call. */
function fakeFetch(opts: { graphql?: () => Response; download?: () => Response } = {}) {
  const calls: Call[] = [];
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    if (url.includes('api.matterport.com')) return opts.graphql ? opts.graphql() : Response.json(BOTH);
    return opts.download ? opts.download() : new Response(OBJ);
  }) as typeof fetch;
  return { fn, calls };
}

async function meshError(p: Promise<unknown>): Promise<MeshError> {
  const err = await p.then(() => undefined, (e: unknown) => e);
  expect(err).toBeInstanceOf(MeshError);
  return err as MeshError;
}

describe('createMeshSource', () => {
  it('queries GraphQL with Basic auth, downloads the 50k mesh and caches it', async () => {
    const cacheDir = tempDir();
    const { fn, calls } = fakeFetch();
    const path = await createMeshSource({ cacheDir, env: ENV, fetchFn: fn }).meshPath('Ki9YdfpNKum');

    expect(path).toBe(join(cacheDir, 'Ki9YdfpNKum-50k.obj'));
    expect(readFileSync(path, 'utf8')).toBe(OBJ);
    expect(calls).toHaveLength(2);
    const headers = new Headers(calls[0].init?.headers);
    expect(headers.get('Authorization')).toBe(`Basic ${Buffer.from('tokenid:supersecret').toString('base64')}`);
    expect(JSON.parse(String(calls[0].init?.body)).variables).toEqual({ id: 'Ki9YdfpNKum' });
    expect(calls[1].url).toBe(URL_50K);
  });

  it('serves the cached file without any request', async () => {
    const cacheDir = tempDir();
    await createMeshSource({ cacheDir, env: ENV, fetchFn: fakeFetch().fn }).meshPath('Ki9YdfpNKum');
    const second = fakeFetch();
    const path = await createMeshSource({ cacheDir, env: ENV, fetchFn: second.fn }).meshPath('Ki9YdfpNKum');
    expect(readFileSync(path, 'utf8')).toBe(OBJ);
    expect(second.calls).toHaveLength(0);
  });

  it('shares one download between requests that arrive together', async () => {
    const { fn, calls } = fakeFetch();
    const source = createMeshSource({ cacheDir: tempDir(), env: ENV, fetchFn: fn });
    const [a, b] = await Promise.all([source.meshPath('Ki9YdfpNKum'), source.meshPath('Ki9YdfpNKum')]);
    expect(a).toBe(b);
    expect(calls).toHaveLength(2);
  });

  it('leaves nothing in the cache when the download breaks half way, and tries again next time', async () => {
    const cacheDir = tempDir();
    const broken = () =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(new TextEncoder().encode('v 0 0 0\n'));
            c.error(new Error('connection reset'));
          },
        }),
      );
    const source = createMeshSource({ cacheDir, env: ENV, fetchFn: fakeFetch({ download: broken }).fn });
    const err = await meshError(source.meshPath('Ki9YdfpNKum'));
    expect(err.status).toBe(502);
    expect(err.message).toBe('Mesh download interrupted: connection reset');
    expect(readdirSync(cacheDir)).toEqual([]);

    const retry = fakeFetch();
    const path = await createMeshSource({ cacheDir, env: ENV, fetchFn: retry.fn }).meshPath('Ki9YdfpNKum');
    expect(readFileSync(path, 'utf8')).toBe(OBJ);
    expect(retry.calls).toHaveLength(2);
  });

  it('names the missing credentials and makes no request', async () => {
    const { fn, calls } = fakeFetch();
    const source = createMeshSource({ cacheDir: tempDir(), env: { MATTERPORT_API_KEY: 'x' }, fetchFn: fn });
    const err = await meshError(source.meshPath('Ki9YdfpNKum'));
    expect(err.status).toBe(500);
    expect(err.message).toBe('MATTERPORT_API_KEY or MATTERPORT_API_TOKEN is not set in .env');
    expect(calls).toHaveLength(0);
  });

  it('reports a refused token without leaking it', async () => {
    const graphql = () => new Response('Unauthorized', { status: 401 });
    const source = createMeshSource({ cacheDir: tempDir(), env: ENV, fetchFn: fakeFetch({ graphql }).fn });
    const err = await meshError(source.meshPath('Ki9YdfpNKum'));
    expect(err.status).toBe(502);
    expect(err.message).toBe('Matterport GraphQL refused the token (HTTP 401)');
    expect(err.message).not.toContain('supersecret');
  });

  it('passes on the first GraphQL error', async () => {
    const graphql = () => Response.json({ errors: [{ message: 'Model not found' }, { message: 'other' }] });
    const source = createMeshSource({ cacheDir: tempDir(), env: ENV, fetchFn: fakeFetch({ graphql }).fn });
    const err = await meshError(source.meshPath('Ki9YdfpNKum'));
    expect(err.status).toBe(502);
    expect(err.message).toBe('Matterport GraphQL error: Model not found');
  });

  it('reports a model without a 50k mesh', async () => {
    const graphql = () => Response.json(meshList([{ format: 'obj', resolution: '500k', status: 'available', url: URL_500K }]));
    const source = createMeshSource({ cacheDir: tempDir(), env: ENV, fetchFn: fakeFetch({ graphql }).fn });
    const err = await meshError(source.meshPath('Ki9YdfpNKum'));
    expect(err.status).toBe(502);
    expect(err.message).toBe('No single-file 50k mesh for model Ki9YdfpNKum');
  });

  it('reports a refused download, such as an expired link', async () => {
    const cacheDir = tempDir();
    const download = () => new Response('Forbidden', { status: 403 });
    const source = createMeshSource({ cacheDir, env: ENV, fetchFn: fakeFetch({ download }).fn });
    const err = await meshError(source.meshPath('Ki9YdfpNKum'));
    expect(err.status).toBe(502);
    expect(err.message).toBe('Mesh download failed: HTTP 403');
    expect(existsSync(join(cacheDir, 'Ki9YdfpNKum-50k.obj'))).toBe(false);
  });

  it('reports Matterport being unreachable', async () => {
    const fn = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;
    const err = await meshError(createMeshSource({ cacheDir: tempDir(), env: ENV, fetchFn: fn }).meshPath('Ki9YdfpNKum'));
    expect(err.status).toBe(502);
    expect(err.message).toBe('Matterport not reachable: fetch failed');
  });
});

describe('GET /api/mesh/:id', () => {
  const fileSource = (): MeshSource => createMeshSource({ cacheDir: tempDir(), env: ENV, fetchFn: fakeFetch().fn });

  it('serves the mesh file for the demo model', async () => {
    const res = await request(createApp({}, { mesh: fileSource() })).get(`/api/mesh/${MODEL_ID}`);
    expect(res.status).toBe(200);
    expect(res.text).toBe(OBJ);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('answers 404 for any other model', async () => {
    const res = await request(createApp({}, { mesh: fileSource() })).get('/api/mesh/abc');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Only model Ki9YdfpNKum is served' });
  });

  it('answers the error status and message of a failing source', async () => {
    const failing: MeshSource = {
      meshPath: async () => {
        throw new MeshError('Mesh download failed: HTTP 403', 502);
      },
    };
    const res = await request(createApp({}, { mesh: failing })).get(`/api/mesh/${MODEL_ID}`);
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'Mesh download failed: HTTP 403' });
  });

  it('answers 503 without a mesh source', async () => {
    const res = await request(createApp({})).get(`/api/mesh/${MODEL_ID}`);
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'Mesh source not configured' });
  });
});
