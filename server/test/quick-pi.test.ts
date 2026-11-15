import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPiSource } from '../src/quick/pi.js';
import { createAvailability } from '../src/quick/availability.js';
import { NotPossibleError } from '../src/errors.js';

const ENV = { MATTERPORT_API_KEY: 'tokenid', MATTERPORT_API_TOKEN: 'supersecret' };
const ID = 'Ki9YdfpNKum';

const tempDirs: string[] = [];
function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'quick-pi-'));
  tempDirs.push(dir);
  return dir;
}
afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** The shape the real API answers (checked on Ki9YdfpNKum): blank labels, missing fields on empty rooms. */
function modelAnswer(meshes: unknown[] = [{ format: 'obj', resolution: '50k', status: 'available' }]) {
  return {
    data: {
      model: {
        name: '9117 Richland Dr', state: 'active', visibility: 'public',
        assets: { meshes },
        rooms: [
          {
            id: 'r1', label: '', keywords: ['indoor'],
            classifications: [{ label: 'Closet', confidence: 0.2 }, { label: 'Bedroom', confidence: 0.9 }],
            floor: { id: 'f1' },
            dimensionEstimates: { area: 20, width: 4, depth: 5, height: 2.5, lowerElevation: 0.02 },
            boundary: {
              edges: [
                {
                  type: 'wall', thickness: 0.09,
                  vertices: [{ position: { x: 0, y: 0 } }, { position: { x: 4, y: 0 } }],
                  openings: [{ id: 'o1', type: 'window', width: 1, height: 1.2, relativeCenter: 0.5, lowerElevation: 0.9 }],
                },
                { type: 'invisible', thickness: 0, vertices: [{ position: { x: 4, y: 0 } }], openings: [] },
              ],
            },
          },
          { id: 'r2', keywords: [], classifications: [], floor: { id: 'f1' }, boundary: { edges: [] } },
        ],
      },
    },
  };
}

const NOT_FOUND = {
  data: {},
  errors: [{ message: 'Error fetching data (path: /model, code: not.found): Not Found', extensions: { code: 'not.found' } }],
};

function fakeFetch(answer: () => Response | Promise<Response>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return answer();
  }) as typeof fetch;
  return { fn, calls };
}

async function reason(p: Promise<unknown>) {
  const err = await p.then(() => undefined, (e: unknown) => e);
  expect(err).toBeInstanceOf(NotPossibleError);
  return (err as NotPossibleError).reason;
}

describe('createPiSource', () => {
  it('asks for metric units with Basic auth', async () => {
    const { fn, calls } = fakeFetch(() => Response.json(modelAnswer()));
    await createPiSource({ cacheDir: tempDir(), env: ENV, fetchFn: fn }).get(ID);
    expect(calls[0].url).toBe('https://api.matterport.com/api/models/graph');
    const body = JSON.parse(String(calls[0].init?.body));
    expect(body.query).toContain('dimensionEstimates(units: metric)');
    expect(body.variables).toEqual({ id: ID });
    expect(new Headers(calls[0].init?.headers).get('authorization')).toBe(
      `Basic ${Buffer.from('tokenid:supersecret').toString('base64')}`,
    );
  });

  it('normalises rooms, edges and openings', async () => {
    const { fn } = fakeFetch(() => Response.json(modelAnswer()));
    const model = await createPiSource({ cacheDir: tempDir(), env: ENV, fetchFn: fn }).get(ID);
    expect(model).toMatchObject({ modelId: ID, name: '9117 Richland Dr', active: true, isPublic: true, hasMesh: true });
    const [r1, r2] = model.rooms;
    expect(r1).toMatchObject({ id: 'r1', label: '', floorId: 'f1', keywords: ['indoor'], area: 20, width: 4, depth: 5, height: 2.5, lowerElevation: 0.02 });
    expect(r1.classifications[0]).toEqual({ label: 'Bedroom', confidence: 0.9 });   // highest confidence first
    expect(r1.edges).toEqual([{
      type: 'wall', a: [0, 0], b: [4, 0], thickness: 0.09,
      openings: [{ id: 'o1', type: 'window', width: 1, height: 1.2, relativeCenter: 0.5, lowerElevation: 0.9 }],
    }]);   // the one-vertex edge is dropped
    expect(r2).toMatchObject({ id: 'r2', label: '', area: 0, width: 0, depth: 0, height: 0, lowerElevation: null, edges: [] });
  });

  it('caches a success and does not call again', async () => {
    const cacheDir = tempDir();
    const { fn, calls } = fakeFetch(() => Response.json(modelAnswer()));
    const pi = createPiSource({ cacheDir, env: ENV, fetchFn: fn });
    const first = await pi.get(ID);
    expect(existsSync(join(cacheDir, `pi-${ID}.json`))).toBe(true);
    expect(readdirSync(cacheDir).filter(f => f.endsWith('.part'))).toEqual([]);
    // A fresh source (a restarted server) reads the file.
    const again = await createPiSource({ cacheDir, env: ENV, fetchFn: fn }).get(ID);
    expect(await pi.get(ID)).toEqual(first);
    expect(again).toEqual(first);
    expect(calls).toHaveLength(1);
  });

  it('shares one request between concurrent gets', async () => {
    const { fn, calls } = fakeFetch(() => Response.json(modelAnswer()));
    const pi = createPiSource({ cacheDir: tempDir(), env: ENV, fetchFn: fn });
    const [a, b] = await Promise.all([pi.get(ID), pi.get(ID)]);
    expect(a).toEqual(b);
    expect(calls).toHaveLength(1);
  });

  it('caches not.found as model_not_found', async () => {
    const cacheDir = tempDir();
    const { fn, calls } = fakeFetch(() => Response.json(NOT_FOUND));
    const pi = createPiSource({ cacheDir, env: ENV, fetchFn: fn });
    expect((await reason(pi.get(ID))).code).toBe('model_not_found');
    expect((await reason(createPiSource({ cacheDir, env: ENV, fetchFn: fn }).get(ID))).code).toBe('model_not_found');
    expect(calls).toHaveLength(1);
  });

  it('does not cache an outage, and retries once', async () => {
    const cacheDir = tempDir();
    const down = fakeFetch(() => Promise.reject(new TypeError('fetch failed')));
    const pi = createPiSource({ cacheDir, env: ENV, fetchFn: down.fn });
    expect((await reason(pi.get(ID))).code).toBe('matterport_unreachable');
    expect(down.calls).toHaveLength(2);
    expect(readdirSync(cacheDir)).toEqual([]);
    const up = fakeFetch(() => Response.json(modelAnswer()));
    await createPiSource({ cacheDir, env: ENV, fetchFn: up.fn }).get(ID);
    expect(up.calls).toHaveLength(1);
  });

  it('recovers when the retry succeeds', async () => {
    let n = 0;
    const { fn, calls } = fakeFetch(() => (n++ === 0 ? new Response('busy', { status: 503 }) : Response.json(modelAnswer())));
    const model = await createPiSource({ cacheDir: tempDir(), env: ENV, fetchFn: fn }).get(ID);
    expect(model.rooms).toHaveLength(2);
    expect(calls).toHaveLength(2);
  });

  it('times out a stalled call', async () => {
    const { fn, calls } = fakeFetch(() => new Promise<Response>(() => {}));
    const stall = (async (input: string | URL | Request, init?: RequestInit) => {
      void fn(input, init);
      return new Promise<Response>((_, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
      });
    }) as typeof fetch;
    const pi = createPiSource({ cacheDir: tempDir(), env: ENV, fetchFn: stall, timeoutMs: 20 });
    expect((await reason(pi.get(ID))).code).toBe('matterport_unreachable');
    expect(calls).toHaveLength(2);
  });

  it('treats a refused token as unreachable, uncached', async () => {
    const cacheDir = tempDir();
    const { fn } = fakeFetch(() => new Response('no', { status: 401 }));
    expect((await reason(createPiSource({ cacheDir, env: ENV, fetchFn: fn }).get(ID))).code).toBe('matterport_unreachable');
    expect(readdirSync(cacheDir)).toEqual([]);
  });

  it('reports missing keys without calling out', async () => {
    const { fn, calls } = fakeFetch(() => Response.json(modelAnswer()));
    expect((await reason(createPiSource({ cacheDir: tempDir(), env: {}, fetchFn: fn }).get(ID))).code).toBe('server_not_configured');
    expect(calls).toHaveLength(0);
  });

  it('never puts the token in an error', async () => {
    const answers = [
      () => Promise.reject(new TypeError('fetch failed for supersecret')),
      () => Response.json({ errors: [{ message: 'bad token supersecret' }] }),
      () => new Response('supersecret', { status: 500 }),
    ];
    for (const answer of answers) {
      const { fn } = fakeFetch(answer);
      const r = await reason(createPiSource({ cacheDir: tempDir(), env: ENV, fetchFn: fn }).get(ID));
      expect(JSON.stringify(r)).not.toContain('supersecret');
      expect(r.code).toBe('matterport_unreachable');
    }
  });

  it('reads hasMesh from an available 50k obj', async () => {
    const cases: [unknown[], boolean][] = [
      [[], false],
      [[{ format: 'obj', resolution: '500k', status: 'available' }], false],
      [[{ format: 'obj', resolution: '50k', status: 'processing' }], false],
      [[{ format: 'obj', resolution: '50k', status: 'available' }], true],
    ];
    for (const [meshes, expected] of cases) {
      const { fn } = fakeFetch(() => Response.json(modelAnswer(meshes)));
      expect((await createPiSource({ cacheDir: tempDir(), env: ENV, fetchFn: fn }).get(ID)).hasMesh).toBe(expected);
    }
  });
});

describe('createAvailability', () => {
  it('remembers what was set, across restarts', () => {
    const cacheDir = tempDir();
    const a = createAvailability(cacheDir);
    expect(a.get(ID)).toBeNull();
    a.set(ID, { canEnter: false, canSummarise: true });
    expect(a.get(ID)).toEqual({ canEnter: false, canSummarise: true });
    expect(createAvailability(cacheDir).get(ID)).toEqual({ canEnter: false, canSummarise: true });
    expect(readdirSync(cacheDir).filter(f => f.endsWith('.part'))).toEqual([]);
  });

  it('starts empty from a broken file', () => {
    const cacheDir = tempDir();
    createAvailability(cacheDir).set(ID, { canEnter: true, canSummarise: true });
    writeFileSync(join(cacheDir, 'availability.json'), '{not json');
    expect(createAvailability(cacheDir).get(ID)).toBeNull();
  });
});
