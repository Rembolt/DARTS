import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';
import { DEMO_MODEL_ID as MODEL_ID } from '../src/shared/contract.js';
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

describe('createMeshSource time limits and edge cases', () => {
  const SHORT = { graphqlMs: 50, downloadMs: 50 };

  /** A fetch that never answers, except by rejecting when its signal aborts. */
  const stalled = ((_url: string | URL | Request, init?: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(init.signal!.reason));
    })) as typeof fetch;

  it('gives up on a GraphQL request that never answers, and a later call tries again', async () => {
    const cacheDir = tempDir();
    const source = createMeshSource({ cacheDir, env: ENV, fetchFn: stalled, timeouts: SHORT });
    const err = await meshError(source.meshPath('Ki9YdfpNKum'));
    expect(err.status).toBe(504);
    expect(err.message).toBe('Matterport GraphQL timed out after 50 ms');

    const retry = fakeFetch();
    const path = await createMeshSource({ cacheDir, env: ENV, fetchFn: retry.fn, timeouts: SHORT }).meshPath('Ki9YdfpNKum');
    expect(readFileSync(path, 'utf8')).toBe(OBJ);
  });

  it('gives up on a download whose body stalls, and leaves nothing cached', async () => {
    const cacheDir = tempDir();
    const fn = (async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).includes('api.matterport.com')) return Response.json(BOTH);
      const body = new ReadableStream({
        start(c) {
          c.enqueue(new TextEncoder().encode('v 0 0 0\n'));
          init?.signal?.addEventListener('abort', () => c.error(init.signal!.reason));
        },
      });
      return new Response(body);
    }) as typeof fetch;
    const source = createMeshSource({ cacheDir, env: ENV, fetchFn: fn, timeouts: SHORT });
    const err = await meshError(source.meshPath('Ki9YdfpNKum'));
    expect(err.status).toBe(504);
    expect(err.message).toBe('Mesh download timed out after 50 ms');
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it('uses a partial answer that still holds an available 50k mesh', async () => {
    const graphql = () => Response.json({ ...BOTH, errors: [{ message: 'field x is deprecated' }] });
    const path = await createMeshSource({ cacheDir: tempDir(), env: ENV, fetchFn: fakeFetch({ graphql }).fn }).meshPath('Ki9YdfpNKum');
    expect(readFileSync(path, 'utf8')).toBe(OBJ);
  });

  it('refuses a 50k mesh that is not available yet', async () => {
    const graphql = () => Response.json(meshList([{ format: 'obj', resolution: '50k', status: 'processing', url: URL_50K }]));
    const { fn, calls } = fakeFetch({ graphql });
    const err = await meshError(createMeshSource({ cacheDir: tempDir(), env: ENV, fetchFn: fn }).meshPath('Ki9YdfpNKum'));
    expect(err.status).toBe(502);
    expect(err.message).toBe('The 50k mesh for model Ki9YdfpNKum is not available (status: processing)');
    expect(calls).toHaveLength(1);
  });

  it('overwrites a temp file left by a server killed mid-download', async () => {
    const cacheDir = tempDir();
    writeFileSync(join(cacheDir, '.Ki9YdfpNKum-50k.part'), 'half a file from last time');
    const path = await createMeshSource({ cacheDir, env: ENV, fetchFn: fakeFetch().fn }).meshPath('Ki9YdfpNKum');
    expect(readFileSync(path, 'utf8')).toBe(OBJ);
    expect(readdirSync(cacheDir)).toEqual(['Ki9YdfpNKum-50k.obj']);
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

  it('answers 404 unknown_model for a malformed id', async () => {
    const res = await request(createApp({}, { mesh: fileSource() })).get('/api/mesh/abc');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('unknown_model');
  });

  it('serves any allowed id and refuses others', async () => {
    const asked: string[] = [];
    const recording: MeshSource = {
      meshPath: async id => {
        asked.push(id);
        return fileSource().meshPath(id);
      },
    };
    const app = createApp({}, { mesh: recording, allowedIds: new Set([MODEL_ID, 'aaaaaaaaaaa']) });
    const ok = await request(app).get('/api/mesh/aaaaaaaaaaa');
    expect(ok.status).toBe(200);
    expect(asked).toEqual(['aaaaaaaaaaa']);
    const refused = await request(app).get('/api/mesh/bbbbbbbbbbb');
    expect(refused.status).toBe(404);
    expect(refused.body.code).toBe('unknown_model');
    expect(asked).toEqual(['aaaaaaaaaaa']);
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

  it('serves a cache that sits under a dot folder (agent worktrees live in .claude/)', async () => {
    const dotDir = join(tempDir(), '.claude', 'cache');
    mkdirSync(dotDir, { recursive: true });
    const source = createMeshSource({ cacheDir: dotDir, env: ENV, fetchFn: fakeFetch().fn });
    const res = await request(createApp({}, { mesh: source })).get(`/api/mesh/${MODEL_ID}`);
    expect(res.status).toBe(200);
    expect(res.text).toBe(OBJ);
  });

  it('answers JSON when the cached file cannot be sent', async () => {
    const gone: MeshSource = { meshPath: async () => join(tempDir(), 'deleted.obj') };
    const res = await request(createApp({}, { mesh: gone })).get(`/api/mesh/${MODEL_ID}`);
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/^Could not send the cached mesh: /);
  });

  it('answers 503 without a mesh source', async () => {
    const res = await request(createApp({})).get(`/api/mesh/${MODEL_ID}`);
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'Mesh source not configured' });
  });
});
