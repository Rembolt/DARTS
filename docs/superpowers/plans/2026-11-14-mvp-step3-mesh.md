# MVP Step 3: Mesh and Worker Load Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The server downloads the property's defurnished mesh once and caches it on disk. The page hands it to the simulation worker, which parses it, builds the ray index, tags materials and extracts the blueprint lines, then reports `ready` with a load time and a line count.

**Architecture:** `GET /api/mesh/:id` asks Matterport GraphQL for the mesh list (the token stays on the server), downloads the `50k` OBJ into `server/cache/`, and serves the file. Later requests are served from disk. The page fetches the file while the tour loads, transfers the `ArrayBuffer` to a module Web Worker, and shows the worker's `ready` summary in the header. All parsing and indexing runs in the worker; nothing runs inside the viewer.

**Tech Stack:** As step 2, plus `three@0.187.0`, `three-mesh-bvh@0.9.18` and `@types/three@0.187.0` in `app/`.

**Spec:** [docs/project/mvp-design.md](../../project/mvp-design.md), sections 2, 5.1, 5.7 and 10 (build step 3). Step 2's plan: [2026-11-14-mvp-step2-viewer.md](2026-11-14-mvp-step2-viewer.md).

## Facts checked on Nov 14 (demo model `Ki9YdfpNKum`)

- `model(id) { assets { meshes { format resolution status url validUntil } } }` returns two `obj` entries: `500k` (one chunk of a pieced mesh) and `50k` (`defurnished_50k.obj`, one file). Use `50k`.
- The download link is signed and expires about 20 minutes after the query. Cache the file, never the link. Never log the link.
- The file is 4,976,054 bytes (about 0.4 s to download). Content type `binary/octet-stream`, so read it as bytes, not JSON or text by content type.
- Contents: 85,456 `v` lines, 116,539 `f` lines, 97 `g` lines (names such as `chunk001_group000_sub002_type002`, `mirror004_group000_sub002`), nothing else. Every face is already a triangle with plain indices (`f 61366 61314 61380`). No `vn`/`vt`, no CRLF. The parser must still handle polygons, `v/vt/vn` tokens, negative indices and CRLF so another model does not break it.
- Raw Z (up) runs from −0.59 to 19.26 m: taller than one house storey. Log the bounds; do not assume them.

## Global Constraints

- The GraphQL token (`MATTERPORT_API_KEY` = token id, `MATTERPORT_API_TOKEN` = secret, HTTP Basic) is read by the server only. It never reaches the browser, the logs or an error message.
- The server serves only `MODEL_ID` (`Ki9YdfpNKum`). Any other id answers 404.
- Cache file: `server/cache/<modelId>-50k.obj` (`server/cache/` is already git-ignored). Write to a temp file in the same folder, then rename, so a failed download never leaves a half file that looks cached.
- Coordinates: convert while parsing, `(x, y, z) → (x, z, −y)`. Everything after the parser is in viewer coordinates (Y up), metres.
- Material ids: `0 = wall`, `1 = floor`, `2 = ceiling`, matching the key order of `SimConfig['materials']`.
- The worker owns the mesh. Transfer buffers (`postMessage(msg, [buffer])`), never copy 5 MB.
- The tour must not wait for the mesh: start both at the same time.
- Work on branch `mvp-step3-mesh`, cut from `main`.

## Review Focus

- **Two requests arrive before the first download finishes** (page reload during the first load): one GraphQL query and one download, both requests get the file. (Task 1 test)
- **The download fails half way:** nothing is left in `server/cache/` that a later request would serve. (Task 1 test)
- **Credentials missing or wrong:** the header shows a named message (`MATTERPORT_API_KEY or MATTERPORT_API_TOKEN is not set in .env`, `Matterport GraphQL refused the token (HTTP 401)`), not a hang or `[object Object]`, and the token never appears in it. (Task 1 tests)
- **The model has no `50k` mesh:** `502` with `No single-file 50k mesh for model <id>`. (Task 1 test)
- **Chunk seams duplicate vertices:** the blueprint does not draw a line along every seam. Edges are matched on welded positions. (Task 3 test)
- **A ray hits a triangle from behind:** it still counts. (Task 3 test)
- **The worker throws** (bad file, out of memory): the header shows `Simulation failed to load: <message>`, and the tour keeps working. (Task 4)

## File Structure

| File | Responsibility |
|---|---|
| `server/src/mesh.ts` | GraphQL query, 50k pick, download, disk cache, in-flight dedupe |
| `server/src/app.ts` | `GET /api/mesh/:id` |
| `app/src/sim/obj.ts` | OBJ text → Y-up `positions` + triangle `indices` |
| `app/src/sim/materials.ts` | One material id per triangle |
| `app/src/sim/edges.ts` | Blueprint line segments |
| `app/src/sim/geometry.ts` | `three` geometry + `MeshBVH`, double-sided hits |
| `app/src/sim/load.ts` | Runs 5.1 in order and builds the `ready` message, with timings |
| `app/src/sim/worker.ts` | The worker entry: message dispatch only |
| `app/src/sim/client.ts` | Page side: starts the worker, `load()` as a promise |
| `app/src/api.ts` | Adds `loadMesh()` |
| `app/src/main.ts`, `app/index.html` | A `#sim` line in the header |

---

### Task 1: `/api/mesh/:id` with the disk cache

**Files:**
- Create: `server/src/mesh.ts`, `server/test/mesh.test.ts`
- Modify: `server/src/app.ts`, `server/src/index.ts`

**Interfaces:**
- Produces, in `server/src/mesh.ts`:
  - `class MeshError extends Error { constructor(message: string, readonly status: number) }`
  - `type MeshSource = { meshPath(modelId: string): Promise<string> }`
  - `createMeshSource(options: { cacheDir: string; env: Record<string, string | undefined>; fetchFn?: typeof fetch }): MeshSource`
- Changes: `AppOptions` gains `mesh?: MeshSource`. Without it, `/api/mesh/:id` answers 503 `Mesh source not configured`.
- `GET /api/mesh/:id`: 404 for any id other than `MODEL_ID`; 200 with the file (`Content-Type: text/plain; charset=utf-8`, `Cache-Control: no-store`); on `MeshError`, its status with `{ error: message }`.

- [ ] **Step 1: Write the failing tests** in `server/test/mesh.test.ts`, with a fake `fetchFn` that answers the GraphQL POST and the CDN GET, and a temp `cacheDir`:
  1. First call queries GraphQL with `Authorization: Basic base64(id:secret)` and variables `{ id: 'Ki9YdfpNKum' }`, downloads the `50k` URL (not the `500k` one) and returns `<cacheDir>/Ki9YdfpNKum-50k.obj` holding the bytes.
  2. Second call returns the same path with no fetch at all.
  3. Two calls started together make one GraphQL call and one download.
  4. A download whose body errors half way rejects, leaves no `*.obj` in `cacheDir`, and the next call tries again.
  5. Missing `MATTERPORT_API_KEY` → `MeshError` 500 `MATTERPORT_API_KEY or MATTERPORT_API_TOKEN is not set in .env`, no fetch.
  6. GraphQL 401 → `MeshError` 502 `Matterport GraphQL refused the token (HTTP 401)`; the message does not contain the secret.
  7. GraphQL `errors` array → 502 `Matterport GraphQL error: <first message>`.
  8. No `50k` entry → 502 `No single-file 50k mesh for model Ki9YdfpNKum`.
  9. CDN 403 (expired link) → 502 `Mesh download failed: HTTP 403`.
  Route tests (supertest, a fake `MeshSource`): 200 with the file body for `MODEL_ID`, 404 for `abc`, the `MeshError` status and JSON for a failing source, 503 without a source.

- [ ] **Step 2: Run them to verify they fail.** `npm run test -w server` → FAIL, cannot find `../src/mesh.js`.

- [ ] **Step 3: Implement `server/src/mesh.ts`.**
  - Query: `query Mesh($id: ID!) { model(id: $id) { assets { meshes { format resolution status url } } } }`, POST to `https://api.matterport.com/api/models/graph`.
  - Pick `format === 'obj' && resolution === '50k'`.
  - Download with `pipeline(Readable.fromWeb(res.body), createWriteStream(tmp))`, `tmp` = `<cacheDir>/.<modelId>-<random>.part`; `renameSync(tmp, final)` on success, `rmSync(tmp, { force: true })` on failure. `mkdirSync(cacheDir, { recursive: true })` first.
  - Keep a `Map<modelId, Promise<string>>` of downloads in flight; delete the entry when it settles.
  - Error messages exactly as in Step 1. Wrap network failures as `MeshError(…, 502)` with `Matterport not reachable: <message>`.
  - `index.ts`: `mesh: createMeshSource({ cacheDir: resolve(import.meta.dirname, '../cache'), env })`.

- [ ] **Step 4: Run tests and types.** `npm run test -w server && npm run typecheck -w server` → all pass.

- [ ] **Step 5: Check it live.** With `.env` in place, `npm run dev -w server`, then:
  `curl -s -o /dev/null -w "%{http_code} %{size_download} %{time_total}\n" http://127.0.0.1:8787/api/mesh/Ki9YdfpNKum` twice.
  Expected: `200 4976054 <about 2 s>`, then `200 4976054 <well under 0.1 s>`. `git status --short` shows nothing under `server/cache/`.

- [ ] **Step 6: Commit.** `feat: download and cache the property mesh`

---

### Task 2: Parse the OBJ and tag materials

**Files:**
- Create: `app/src/sim/obj.ts`, `app/src/sim/obj.test.ts`, `app/src/sim/materials.ts`, `app/src/sim/materials.test.ts`

**Interfaces:**
- `type Mesh = { positions: Float32Array; indices: Uint32Array }` (3 floats per vertex, Y-up; 3 indices per triangle).
- `parseObj(obj: ArrayBuffer): Mesh`. Throws `Error('Mesh has no triangles')` when there are none, and `Error('Face refers to vertex <n>, which does not exist')` for an index out of range.
- `const MATERIAL_IDS = { wall: 0, floor: 1, ceiling: 2 } as const`
- `tagMaterials(mesh: Mesh): Uint8Array`

- [ ] **Step 1: Write the failing tests.**

`app/src/sim/obj.test.ts`:

```ts
import { it, expect } from 'vitest';
import { parseObj } from './obj';

const bytes = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;

it('converts Z-up to Y-up and reads triangles, polygons, v/vt/vn tokens, negative indices and CRLF', () => {
  const mesh = parseObj(bytes(
    'v 0 0 0\nv 1 0 0\nv 1 2 3\r\nv 0 1 0\n# comment\ng chunk000\n' +
    'f 1 2 3\nf 1/1/1 2/2/2 3/3/3 4/4/4\nf -4 -3 -2\n',
  ));
  expect(Array.from(mesh.positions.slice(6, 9))).toEqual([1, 3, -2]);
  expect(Array.from(mesh.indices)).toEqual([0, 1, 2, 0, 1, 2, 0, 2, 3, 0, 1, 2]);
});

it('rejects a file without triangles', () => {
  expect(() => parseObj(bytes('v 0 0 0\n'))).toThrow('Mesh has no triangles');
});

it('rejects a face that points past the vertex list', () => {
  expect(() => parseObj(bytes('v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 9\n'))).toThrow('Face refers to vertex 9, which does not exist');
});
```

`app/src/sim/materials.test.ts` (positions already Y-up):

```ts
import { it, expect } from 'vitest';
import { tagMaterials } from './materials';

const tri = (...p: number[]) => ({ positions: new Float32Array(p), indices: new Uint32Array([0, 1, 2]) });

it('tags a triangle facing up as floor', () => {
  expect(tagMaterials(tri(0, 0, 0, 0, 0, 1, 1, 0, 0))[0]).toBe(1);
});

it('tags a triangle facing down as ceiling', () => {
  expect(tagMaterials(tri(0, 0, 0, 1, 0, 0, 0, 0, 1))[0]).toBe(2);
});

it('tags a sideways triangle as wall', () => {
  expect(tagMaterials(tri(0, 0, 0, 1, 0, 0, 0, 1, 0))[0]).toBe(0);
});

it('splits at 45°: a slope of 37° from level is floor, 53° is wall', () => {
  expect(tagMaterials(tri(0, 0, 0, 0, 0, 1, 1, 0.75, 0))[0]).toBe(1);
  expect(tagMaterials(tri(0, 0, 0, 0, 0, 1, 1, 1.333, 0))[0]).toBe(0);
});
```

- [ ] **Step 2: Run them to verify they fail.** `npm run test -w app` → FAIL, missing modules.

- [ ] **Step 3: Implement.**
  - `parseObj`: decode with `TextDecoder`, walk lines once. Grow plain number arrays and copy into typed arrays at the end, or pre-count `v`/`f` lines in a first pass and fill typed arrays directly (faster on 5 MB). Fan-split polygons (`0,i,i+1`). An index token's vertex part is before the first `/`. Negative indices count back from the vertices read so far.
  - `tagMaterials`: normal = `(b − a) × (c − a)`, normalised. `|ny| < cos 45°` → wall, `ny > 0` → floor, else ceiling. Zero-area triangles → wall.

- [ ] **Step 4: Run tests and types.** `npm run test -w app && npm run typecheck -w app` → all pass.

- [ ] **Step 5: Commit.** `feat: parse the mesh and tag materials`

---

### Task 3: Ray index and blueprint lines

**Files:**
- Create: `app/src/sim/geometry.ts`, `app/src/sim/geometry.test.ts`, `app/src/sim/edges.ts`, `app/src/sim/edges.test.ts`
- Modify: `app/package.json` (dependencies)

```bash
npm install -w app three@0.187.0 three-mesh-bvh@0.9.18
npm install -w app -D @types/three@0.187.0
```

**Interfaces:**
- `type RayIndex = { bvh: MeshBVH; geometry: BufferGeometry }`
- `buildRayIndex(mesh: Mesh): RayIndex`
- `firstHit(index: RayIndex, origin: Vec3, dir: Vec3, far?: number): { distance: number; triangle: number } | null`. Double-sided. Later steps use it for tracing; here it proves the index works.
- `extractLines(mesh: Mesh, angleDeg: number): Float32Array`: segments as pairs of points (6 floats per line).

- [ ] **Step 1: Write the failing tests.**
  - `geometry.test.ts`: one floor triangle at `y = 0` covering `(0..1, 0..1)` in x/z. A ray from `(0.2, 1, 0.2)` pointing down hits at distance 1, triangle 0. A ray from `(0.2, −1, 0.2)` pointing up also hits (from behind). A ray pointing away misses (`null`). `far = 0.5` misses.
  - `edges.test.ts`:
    1. Two coplanar triangles forming a square, sharing an edge: 4 lines (24 floats). The flat shared edge is dropped.
    2. The same square with the seam vertices duplicated (6 vertices, no shared indices): still 4 lines. Edges are matched on positions welded to 1 mm.
    3. A floor triangle and a wall triangle sharing one edge at 90°: 5 lines.
    4. Two triangles meeting at 20° with `angleDeg = 25`: 4 lines; at 30°: 5 lines.

- [ ] **Step 2: Run them to verify they fail.**

- [ ] **Step 3: Implement.**
  - `buildRayIndex`: `BufferGeometry` with the positions and index, `new MeshBVH(geometry)`. `firstHit` uses `bvh.raycastFirst(new Ray(...), DoubleSide, 0, far)` and returns `faceIndex` as `triangle`.
  - `extractLines`: weld vertices by rounding to 1 mm into a `Map<string, number>`. For each triangle edge, key on the sorted welded pair, collect the triangles that share it. Keep an edge with one triangle, more than two triangles, or two triangles whose normals differ by more than `angleDeg`. Output the original positions of one occurrence.

- [ ] **Step 4: Run tests and types.** All pass.

- [ ] **Step 5: Commit.** `feat: ray index and blueprint lines`

---

### Task 4: The worker and the page

**Files:**
- Create: `app/src/sim/load.ts`, `app/src/sim/load.test.ts`, `app/src/sim/worker.ts`, `app/src/sim/client.ts`
- Modify: `app/src/sim/types.ts`, `app/src/sim/types.test.ts`, `app/src/api.ts`, `app/src/api.test.ts`, `app/src/main.ts`, `app/index.html`

**Interfaces:**
- Contract change in `app/src/sim/types.ts`: the `ready` message gains `triangles: number` and `timings: { parse: number; index: number; materials: number; lines: number }` (ms). Make this change first; update `types.test.ts`.
- `loadMesh(fetchFn?): Promise<ArrayBuffer>` in `api.ts`: `GET /api/mesh/<MODEL_ID>`. Reuse the proxy-down rule: unreachable → `UNREACHABLE`; JSON `{ error }` → that message; otherwise `Mesh download failed: HTTP <status>`.
- `loadSim(obj: ArrayBuffer, config: SimConfig): { state: SimState; ready: Extract<FromWorker, { type: 'ready' }> }` in `load.ts`, where `SimState = { mesh: Mesh; materials: Uint8Array; index: RayIndex }`. Times each stage with `performance.now()`.
- `startSim(): { load(obj: ArrayBuffer, config: SimConfig): Promise<Extract<FromWorker, { type: 'ready' }>> }` in `client.ts`. Creates `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`, transfers `obj`, rejects on an `error` message or the worker's `error` event.
- `formatSimReady(ready): string` → `Mesh: 116,539 triangles · 23,456 lines · loaded in 412 ms`.

- [ ] **Step 1: Write the failing tests.**
  - `load.test.ts`: `loadSim` on a small OBJ (a closed box, 12 triangles) returns `triangles: 12`, 12 box edges (72 floats; the diagonal of each face is flat), bounds in Y-up, `loadMs ≥ 0`, and a `state.materials` with 2 floor, 2 ceiling and 8 wall triangles. Write the box with inward-facing winding (as seen from inside the room) and check the two bottom triangles are floor; flip the winding and check the bottom two are now ceiling. The test documents that facing comes from winding.
  - `api.test.ts`: `loadMesh` returns the bytes on 200; empty-body 502 → `UNREACHABLE`; `{ error }` JSON → that message.
  - `formatSimReady`: the exact string above for 116539 triangles, 23456 lines (140736 floats) and 412.4 ms.

- [ ] **Step 2: Run them to verify they fail.**

- [ ] **Step 3: Implement.**
  - `worker.ts`: hold `let state: SimState | null`. On `load`: `loadSim`, then `postMessage(ready, [ready.lines.buffer])`. On `trace`/`reverb`: post `{ type: 'error', message: 'trace is not built yet (step 6)' }`. Wrap every handler and post `{ type: 'error', message }` on a throw.
  - `main.ts`: start `loadMesh()` right after the config, in parallel with the viewer. Show `Loading mesh…` in `#sim`, then `formatSimReady(ready)`; on failure `Simulation failed to load: <message>`. `console.info` the timings and bounds (never the config or key). The tour flow does not wait for any of this.
  - `index.html`: add `<p id="sim">` after `#pose`, styled like `#status`.

- [ ] **Step 4: Run tests and types.** `npm test && npm run typecheck` → all pass.

- [ ] **Step 5: Check it live** (the build-step 3 check).
  `npm run dev`, then the headless check from step 2's plan with a fresh profile in the scratchpad and `--virtual-time-budget=30000`.
  Expected: `#sim` reads `Mesh: 116,539 triangles · <N> lines · loaded in <T> ms`, `#status` still reads `Tour playing: model Ki9YdfpNKum`.
  Then open `http://localhost:5173` in a normal browser and read the console's timings.
  Expected: load (without download) under 1 s; the tour stays smooth while it runs.
  Record `N`, `T`, the per-stage timings, the Y-up bounds and the floor/wall/ceiling share in the ledger below. If floor and ceiling look swapped (most "floor" triangles near the top of the bounds), the mesh winding faces outward: flip the rule in `tagMaterials` and note it in AGENTS.md.
  Stop only the processes you started.

- [ ] **Step 6: Update `AGENTS.md`.** Current state: steps 1–3 done. Facts: the OBJ facts at the top of this plan, the measured load timings, and the line count.

- [ ] **Step 7: Commit.** `feat: load the mesh in the simulation worker`

---

## Ledger

| Item | Value |
|---|---|
| Triangles | 116,539 |
| Blueprint lines | 135,730 at 25° (135,733 before zero-area triangles were treated as flat) (119,976 at 40°, 103,222 at 60°). 51,011 edges have one triangle (open scan); welding at 1 cm instead of 1 mm barely changes it |
| Load in worker | 874 ms in headless Chrome. Node, best of 6: 782 ms (parse 316 / index 173 / materials 17 / lines 228) |
| Bounds, Y-up | min (−16.718, −0.591, −25.414), max (26.709, 19.261, 20.658) |
| Floor / wall / ceiling share | 10.4% / 68.5% / 21.1%; mean height floor 2.99 m, ceiling 7.53 m: winding faces into rooms, no flip |
| First `/api/mesh` request / cached | 1.11 s / 0.035 s |

Found while building:
- `three-mesh-bvh` reorders `mesh.indices` in place. `loadSim` tags materials after building the index so triangle numbers match its hits; `load.test.ts` checks this with rays.
- Our server answers 502 with a JSON message when Matterport fails, so `loadMesh` reads the message before applying the proxy-down rule.
- Chrome on this machine prints nothing headless; the live check drives it through `--remote-debugging-port`.
