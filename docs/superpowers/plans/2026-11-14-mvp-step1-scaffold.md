# MVP Step 1: Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A page that opens in the browser, asks our local server for its config and shows the answer, with every hardcoded simulation value and the worker message types in place for the later steps.

**Architecture:** Two npm workspaces in one repo. `server/` is a Node + Express app that reads the root `.env` and answers `/api/config`. `app/` is a Vite + TypeScript page that calls it through Vite's dev proxy. `app/src/config.ts` and `app/src/sim/types.ts` are the contracts the worker, audio engine and blueprint view will be built against.

**Tech Stack:** Node 24, npm 11 workspaces, TypeScript, Express, dotenv, Vite, Vitest, supertest, tsx, concurrently.

**Spec:** [docs/project/mvp-design.md](../../project/mvp-design.md). This plan implements build step 1 of its section 10, using sections 3, 4 and 5.7.

## Global Constraints

- Secrets come from the root `.env` only: `MATTERPORT_SDK_KEY`, `MATTERPORT_API_KEY`, `MATTERPORT_API_TOKEN`. Never print, log or commit their values. Only the SDK key may reach the browser.
- Use `npm`. `yarn` is not installed.
- The server listens on port `8787` by default (`PORT` overrides it). Port 8080 is used by a teammate's test page; never use it.
- Vite's dev server stays on `localhost`. The SDK key only works on `localhost`.
- The server serves one model id: `Ki9YdfpNKum`.
- Never commit `server/bundle/`, `server/cache/`, `node_modules/`, `dist/` or any `.mp3` / `.wav`.
- Every hardcoded simulation value lives in `app/src/config.ts`, copied exactly from spec section 4.
- Target browser: desktop Chrome.
- Work on a branch named `mvp-step1-scaffold`, not on `main`.

## Review Focus

- **`MATTERPORT_SDK_KEY` missing from `.env`:** `/api/config` answers 500 with a JSON error naming the variable, and the page shows that message. (Task 1 and Task 3 tests)
- **The key is written with quotes or spaces in `.env`:** the server returns it trimmed and unquoted. (Task 1 test)
- **The server isn't running when the page loads:** the page shows "Server not reachable", not a blank screen. (Task 3 test)
- **The API token leaking to the browser:** the `/api/config` body contains exactly `sdkKey` and `modelId`, nothing else. (Task 1 test)
- **A material edit that makes absorption plus furnishing reach 1:** a config test fails, because the reverb formula divides by `ln(1 − absorption)`. (Task 2 test)

## File Structure

| File | Responsibility |
|---|---|
| `package.json` (root) | Workspaces `app` and `server`; scripts `dev`, `test`, `typecheck` |
| `server/src/env.ts` | Parse the root `.env` into a plain object |
| `server/src/app.ts` | Build the Express app from an env object. No listening, so tests can call it |
| `server/src/index.ts` | Load the env, build the app, listen |
| `server/test/config.test.ts` | Tests for `/api/config` |
| `app/src/config.ts` | Every hardcoded value from spec section 4, plus the 12 slot directions |
| `app/src/sim/types.ts` | Worker message types from spec section 5.7 |
| `app/src/api.ts` | Fetch and validate the server config |
| `app/src/main.ts` | Show the config status on the page |
| `app/index.html`, `app/vite.config.ts` | Page shell; proxy `/api` and `/bundle` to the server |

Not in this milestone: the Matterport Bundle, the mesh route, audio files, the worker, the audio engine, the blueprint view. `three` and `three-mesh-bvh` are installed in the step that first uses them.

---

### Task 1: Workspace and server with `/api/config`

**Files:**
- Create: `package.json`, `server/package.json`, `server/tsconfig.json`
- Create: `server/src/env.ts`, `server/src/app.ts`, `server/src/index.ts`
- Test: `server/test/config.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `GET /api/config` → `200 { sdkKey: string, modelId: "Ki9YdfpNKum" }`, or `500 { error: string }`.
- Produces: `createApp(env: Record<string, string | undefined>): express.Express` in `server/src/app.ts`.
- Produces: `loadEnv(path: string): Record<string, string>` in `server/src/env.ts`. A missing file returns `{}`.
- Produces: `MODEL_ID = "Ki9YdfpNKum"` exported from `server/src/app.ts`.

- [ ] **Step 1: Create the branch and the workspace**

```bash
git checkout -b mvp-step1-scaffold
```

Root `package.json`: `"private": true`, `"workspaces": ["app", "server"]`, and scripts:
- `"dev": "concurrently -n server,app \"npm run dev -w server\" \"npm run dev -w app\""`
- `"test": "npm run test -w server && npm run test -w app"`
- `"typecheck": "npm run typecheck -w server && npm run typecheck -w app"`

`server/package.json`: `"type": "module"`, scripts `"dev": "tsx watch src/index.ts"`, `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`.

```bash
npm install -D concurrently
npm install -w server express dotenv
npm install -w server -D typescript tsx vitest supertest @types/express @types/supertest @types/node
```

`server/tsconfig.json`: `strict`, `module` and `moduleResolution` `NodeNext`, `target` `ES2022`, include `src` and `test`.

- [ ] **Step 2: Add the git-ignore entries**

Append to `.gitignore`:

```
# Build and dependencies
node_modules/
dist/

# Matterport Bundle and downloaded meshes
server/bundle/
server/cache/
```

(`*.mp3` and `*.wav` are already ignored.)

- [ ] **Step 3: Write the failing tests**

`server/test/config.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { mkdtempSync, writeFileSync } from 'node:fs';
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
    writeFileSync(join(dir, '.env'), '# comment\nMATTERPORT_SDK_KEY = "sdk123" \nOTHER=x\n');
    expect(loadEnv(join(dir, '.env')).MATTERPORT_SDK_KEY).toBe('sdk123');
  });

  it('returns an empty object when the file does not exist', () => {
    expect(loadEnv(join(tmpdir(), 'no-such-dir', '.env'))).toEqual({});
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm run test -w server`
Expected: FAIL, cannot find `../src/app.js`.

- [ ] **Step 5: Implement `loadEnv` in `server/src/env.ts`**

Read the file and parse it with `dotenv.parse`, then trim every value. Do not write into `process.env`.

- [ ] **Step 6: Implement `createApp` in `server/src/app.ts`**

One route, `GET /api/config`. The key is `env.MATTERPORT_SDK_KEY` trimmed; empty or missing answers 500 with the exact error text in the test. Never log the env object or the key.

- [ ] **Step 7: Implement `server/src/index.ts`**

Load the env from the repo root: `loadEnv(resolve(import.meta.dirname, '../../.env'))`. Listen on `Number(process.env.PORT) || 8787`. Log only `server on http://localhost:<port>`. If the port is taken, log `port <port> is in use; set PORT to another one` and exit with code 1.

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npm run test -w server && npm run typecheck -w server`
Expected: 5 tests pass, no type errors.

- [ ] **Step 9: Check the real server**

Run: `npm run dev -w server`, then in another terminal `curl -s http://localhost:8787/api/config | node -e "process.stdin.on('data', d => { const j = JSON.parse(d); console.log(j.modelId, typeof j.sdkKey, j.sdkKey.length > 0); })"`
Expected: `Ki9YdfpNKum string true`. The command prints the key's type, never the key.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json .gitignore server/package.json server/tsconfig.json server/src server/test
git commit -m "feat: add server with /api/config"
```

---

### Task 2: App scaffold, hardcoded config and worker types

**Files:**
- Create: `app/package.json`, `app/tsconfig.json`, `app/vite.config.ts`, `app/index.html`
- Create: `app/src/config.ts`, `app/src/sim/types.ts`
- Test: `app/src/config.test.ts`, `app/src/sim/types.test.ts`

**Interfaces:**
- Produces, from `app/src/sim/types.ts`: `Vec3`, `Bands`, `Material`, `SimConfig`, `ToWorker`, `FromWorker`, `SourceResult`.
- Produces, from `app/src/config.ts`: `MATERIALS`, `SIM`, `SOURCES`, `AUDIO`, `SLOT_DIRECTIONS`, `simConfig(): SimConfig`.

- [ ] **Step 1: Scaffold the app workspace**

`app/package.json`: `"type": "module"`, scripts `"dev": "vite"`, `"build": "tsc --noEmit && vite build"`, `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`.

```bash
npm install -w app -D vite typescript vitest
```

`app/tsconfig.json`: `strict`, `target` `ES2022`, `module` `ESNext`, `moduleResolution` `Bundler`, `lib` `["ES2022", "DOM", "WebWorker"]`, `noEmit`, include `src`.

`app/vite.config.ts`: dev server on `localhost`, proxy `/api` and `/bundle` to `http://localhost:8787`.

`app/index.html`: title `Acoustic Experience`, one `<main>` containing `<p id="status">Loading…</p>`, and `<script type="module" src="/src/main.ts">`.

- [ ] **Step 2: Write `app/src/sim/types.ts`**

Copy the type block from spec section 5.7 exactly (`Vec3`, `Bands`, `ToWorker`, `FromWorker`, `SourceResult`), exporting each. The spec uses `SimConfig` without defining it; define it and `Material` here:

```ts
export type Material = { absorption: Bands; scattering: number; blockingDb: Bands };

export type SimConfig = {
  materials: { wall: Material; floor: Material; ceiling: Material };
  furnishing: number;
  transmissionScale: number;
  raysPerTrace: number;
  bounces: number;
  maxLegWalls: number;
  scatteringFloor: number;
  occlusionRays: number;
  occlusionRadius: number;       // metres
  wallMergeDistance: number;     // metres
  earlyWindow: number;           // seconds
  slotDirections: Vec3[];
  maxDrawnPaths: number;
  reverbRays: number;
  reverbBounces: number;
  blueprintEdgeAngle: number;    // degrees
  speedOfSound: number;          // metres per second
};
```

- [ ] **Step 3: Write the failing tests**

`app/src/config.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { MATERIALS, SIM, SOURCES, AUDIO, SLOT_DIRECTIONS, simConfig } from './config';

describe('materials (spec 4.2)', () => {
  it('has the spec values', () => {
    expect(MATERIALS.wall).toEqual({ absorption: [0.25, 0.06, 0.08], scattering: 0.10, blockingDb: [25, 35, 45] });
    expect(MATERIALS.floor).toEqual({ absorption: [0.15, 0.10, 0.07], scattering: 0.20, blockingDb: [35, 45, 50] });
    expect(MATERIALS.ceiling).toEqual({ absorption: [0.25, 0.06, 0.08], scattering: 0.10, blockingDb: [25, 35, 45] });
    expect(SIM.furnishing).toBe(0.15);
    expect(SIM.transmissionScale).toBe(0.6);
  });

  it('keeps absorption plus furnishing below 1 in every band', () => {
    for (const m of Object.values(MATERIALS))
      for (const a of m.absorption) expect(a + SIM.furnishing).toBeLessThan(1);
  });
});

describe('simulation settings (spec 4.4)', () => {
  it('has the spec values', () => {
    expect(SIM).toMatchObject({
      raysPerTrace: 2000, bounces: 4, maxLegWalls: 2, scatteringFloor: 0.3,
      occlusionRays: 9, occlusionRadius: 0.3, wallMergeDistance: 0.5, earlyWindow: 0.08,
      maxDrawnPaths: 40, reverbRays: 1500, reverbBounces: 60, blueprintEdgeAngle: 25, speedOfSound: 343,
    });
  });
});

describe('echo slot directions (spec 5.4)', () => {
  it('are 12 distinct unit vectors', () => {
    expect(SLOT_DIRECTIONS).toHaveLength(12);
    for (const [x, y, z] of SLOT_DIRECTIONS) expect(Math.hypot(x, y, z)).toBeCloseTo(1, 6);
    expect(new Set(SLOT_DIRECTIONS.map(d => d.map(n => n.toFixed(4)).join(','))).size).toBe(12);
  });

  it('are the corners of an icosahedron: each has 5 nearest neighbours at the same angle', () => {
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    for (const a of SLOT_DIRECTIONS) {
      const near = SLOT_DIRECTIONS.filter(b => b !== a && Math.abs(dot(a, b) - 1 / Math.sqrt(5)) < 1e-6);
      expect(near).toHaveLength(5);
    }
  });
});

describe('sources and audio (spec 4.3, 6)', () => {
  it('has the spec values', () => {
    expect(SOURCES.indoor).toEqual({ id: 'indoor', file: '/audio/indoor.mp3', position: null, startHeightOffset: -0.4 });
    expect(SOURCES.outdoor).toEqual({ id: 'outdoor', file: '/audio/outdoor.mp3', distance: 25, compassAngleDeg: 0, height: 1.5, levelDb: -12 });
    expect(AUDIO).toEqual({
      slotPannerDistance: 2, maxDelay: 0.2, delayJumpThreshold: 0.002, delayDipTime: 0.02,
      reverbGain: 1.5, reverbCrossfade: 0.2, reverbChangeThreshold: 0.15, smoothing: 0.08,
      lowShelfHz: 250, highShelfHz: 2000, echoTimeMin: 0.2, echoTimeMax: 2.5, listenerMoveThreshold: 0.25,
    });
  });
});

describe('simConfig', () => {
  it('bundles what the worker needs', () => {
    const c = simConfig();
    expect(c.materials).toBe(MATERIALS);
    expect(c.slotDirections).toBe(SLOT_DIRECTIONS);
    expect(c.raysPerTrace).toBe(2000);
    expect(c.furnishing).toBe(0.15);
  });
});
```

`app/src/sim/types.test.ts` (checks the types compile against realistic values; `npm run typecheck` is the real test):

```ts
import { it, expect } from 'vitest';
import type { FromWorker, ToWorker, SourceResult } from './types';

it('accepts a trace round trip', () => {
  const req: ToWorker = { type: 'trace', id: 1, listener: [0, 1.5, 0], sources: [{ id: 'indoor', position: [1, 1, 1] }] };
  const src: SourceResult = {
    id: 'indoor', distance: 1.7, direct: [1, 1, 1], walls: 0,
    slots: Array.from({ length: 12 }, () => ({ energy: [0, 0, 0] as [number, number, number], delay: 0.001 })),
    lateEnergy: [0, 0, 0],
  };
  const res: FromWorker = {
    type: 'trace', id: 1, listener: [0, 1.5, 0], ms: 200, echoTimeEstimate: [0.4, 0.5, 0.5],
    sources: [src], paths: new Float32Array(0), pathSource: new Uint8Array(0),
  };
  expect(req.type).toBe('trace');
  expect(res.type).toBe('trace');
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npm run test -w app`
Expected: FAIL, cannot find `./config`.

- [ ] **Step 5: Implement `app/src/config.ts`**

Export `MATERIALS`, `SIM`, `SOURCES`, `AUDIO` with exactly the values in the tests, typed with `Material` and `SimConfig` fields from `types.ts`.

`SLOT_DIRECTIONS: Vec3[]` is computed once: the 12 corners of an icosahedron are the cyclic permutations of `(0, ±1, ±φ)` with `φ = (1 + √5) / 2`, each divided by its length.

`simConfig(): SimConfig` returns `{ materials: MATERIALS, slotDirections: SLOT_DIRECTIONS, ...SIM }`.

Above `MATERIALS`, keep this comment: `// Starting values from memory, not from a measured table. See mvp-design.md 4.2.`

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npm run test -w app && npm run typecheck -w app`
Expected: all tests pass, no type errors.

- [ ] **Step 7: Commit**

```bash
git add app package-lock.json
git commit -m "feat: add app scaffold, hardcoded config and worker types"
```

---

### Task 3: The page shows the server config

**Files:**
- Create: `app/src/api.ts`, `app/src/main.ts`
- Test: `app/src/api.test.ts`
- Modify: `AGENTS.md` (the `## Commands` section)

**Interfaces:**
- Consumes: `GET /api/config` from Task 1.
- Produces: `type ServerConfig = { sdkKey: string; modelId: string }` and `loadServerConfig(fetchFn?: typeof fetch): Promise<ServerConfig>` in `app/src/api.ts`. It rejects with an `Error` whose message is ready to show to the user.

- [ ] **Step 1: Write the failing tests**

`app/src/api.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { loadServerConfig } from './api';

const respond = (status: number, body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;

describe('loadServerConfig', () => {
  it('returns the config', async () => {
    await expect(loadServerConfig(respond(200, { sdkKey: 'k', modelId: 'Ki9YdfpNKum' })))
      .resolves.toEqual({ sdkKey: 'k', modelId: 'Ki9YdfpNKum' });
  });

  it("passes on the server's error message", async () => {
    await expect(loadServerConfig(respond(500, { error: 'MATTERPORT_SDK_KEY is not set in .env' })))
      .rejects.toThrow('MATTERPORT_SDK_KEY is not set in .env');
  });

  it('reports an unreachable server', async () => {
    const down = (async () => { throw new TypeError('Failed to fetch'); }) as typeof fetch;
    await expect(loadServerConfig(down)).rejects.toThrow('Server not reachable. Start it with: npm run dev');
  });

  it('reports a non-JSON answer, as when the proxy target is down', async () => {
    const html = (async () => new Response('<html>', { status: 502 })) as typeof fetch;
    await expect(loadServerConfig(html)).rejects.toThrow('Server not reachable. Start it with: npm run dev');
  });

  it('rejects a config without a key', async () => {
    await expect(loadServerConfig(respond(200, { modelId: 'Ki9YdfpNKum' })))
      .rejects.toThrow('Server sent an incomplete config');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -w app`
Expected: FAIL, cannot find `./api`.

- [ ] **Step 3: Implement `loadServerConfig` in `app/src/api.ts`**

Fetch `/api/config` with `fetchFn` (default: the global `fetch`). The five tests fix the behavior and the exact messages.

- [ ] **Step 4: Implement `app/src/main.ts`**

Call `loadServerConfig()`. On success set `#status` to `Ready: model <modelId>`. On failure set it to the error's message. Never write the SDK key to the page or the console.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm run test && npm run typecheck`
Expected: every server and app test passes, no type errors.

- [ ] **Step 6: Check the page**

Run: `npm run dev`, open the address Vite prints (normally `http://localhost:5173`).
Expected: the page reads `Ready: model Ki9YdfpNKum`.
Then stop only the server and reload.
Expected: the page reads `Server not reachable. Start it with: npm run dev`.

- [ ] **Step 7: Record the commands in `AGENTS.md`**

In the `## Commands` section, replace the line that starts `- **App and server:** none yet.` with:

```markdown
- **Install:** `npm install` at the repo root (npm workspaces: `app/` and `server/`).
- **Run:** `npm run dev` starts the server on `http://localhost:8787` and the page on `http://localhost:5173`. Set `PORT` to move the server.
- **Test:** `npm test` runs both. One workspace: `npm run test -w app`. One file: `npm run test -w app -- src/config.test.ts`. One test: add `-t "name of the test"`.
- **Types:** `npm run typecheck`.
```

Also change the `## Current state` paragraph's first sentence to: `Build step 1 of the MVP design is done: the app and server scaffold, the hardcoded config and the worker types.`

- [ ] **Step 8: Commit**

```bash
git add app/src/api.ts app/src/api.test.ts app/src/main.ts AGENTS.md
git commit -m "feat: show server config on the page"
```
