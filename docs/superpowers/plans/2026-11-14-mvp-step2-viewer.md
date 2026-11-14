# MVP Step 2: Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The page shows the property's Matterport tour, served from our own server, and displays the camera pose live as you move.

**Architecture:** A script downloads the Matterport Bundle (the self-hosted viewer) into `server/bundle/`. The Express server serves it at `/bundle`, and Vite's dev proxy puts it on the page's own origin, so the page can reach `iframe.contentWindow.MP_SDK`. The page connects to the viewer, waits until it is playing, and subscribes to the camera pose.

**Tech Stack:** As step 1, plus `extract-zip@2.0.1` (root dev dependency) for unpacking the Bundle.

**Spec:** [docs/project/mvp-design.md](../../project/mvp-design.md), sections 3, 8 and 10 (build step 2). Step 1's plan and ledger: [2026-11-14-mvp-step1-scaffold.md](2026-11-14-mvp-step1-scaffold.md).

## Global Constraints

- Bundle version `26.10.4_webgl-1728-g1cd7e0997a`, from `https://static.matterport.com/showcase-sdk/bundle/26.10.4_webgl-1728-g1cd7e0997a/showcase-bundle.zip`. Tested with the hackathon key on `localhost`.
- `server/bundle/` is git-ignored. Never commit it.
- Viewer address: `/bundle/showcase.html?m=<modelId>&applicationKey=<sdkKey>&play=1&qs=1`.
- Connect with `iframe.contentWindow.MP_SDK.connect(iframe.contentWindow)`, then wait for `App.state` to reach `PLAYING`.
- The SDK key may appear only in the iframe address. Never write it to the page text or the console.
- Nothing heavy runs inside the viewer. This milestone adds only a pose subscription.
- Server port: `PORT`, default `8787`. Never use 8080. The page stays on `localhost`.
- Work on branch `mvp-step2-viewer`, cut from `main` (step 1 and its review fixes are merged).

## Review Focus

- **The Bundle was never fetched:** the iframe shows `Matterport Bundle missing. Run: npm run fetch-bundle`, not a blank frame or an Express error page. (Task 1 test)
- **The viewer never reaches playing** (key rejected, model unavailable, slow network): after 60 s the page says `Viewer did not start: …`, not `Loading tour…` forever. (Task 2 test of `withTimeout`)
- **`PORT` is set to move the server:** the page's proxy follows it. (Already covered by `app/proxy-target.test.ts`, from step 1's review fix.)
- **Port 8787 is already taken:** the server prints only `port 8787 is in use; set PORT to another one` and exits, with no false success line. (Already covered by `server/test/listen.test.ts`.)
- **The user switches to dollhouse or floor-plan mode:** the pose line keeps updating and shows the mode; nothing breaks. (Task 2 test of `formatPose`)

## File Structure

| File | Responsibility |
|---|---|
| `scripts/fetch-bundle.mjs` | Download and unpack the Bundle into `server/bundle/` |
| `server/src/app.ts` | Adds the `/bundle` static route |
| `app/src/viewer.ts` | Viewer address, connection, timeout, pose formatting |
| `app/src/main.ts`, `app/index.html` | Layout: a thin status bar above a full-size tour |

---

### Task 1: Fetch and serve the Bundle

**Files:**
- Create: `scripts/fetch-bundle.mjs`
- Modify: `package.json` (root: script `fetch-bundle`, dev dependency `extract-zip@2.0.1`), `server/src/app.ts`, `server/src/index.ts`, `AGENTS.md` (Commands)
- Test: `server/test/bundle.test.ts`

**Interfaces:**
- Changes: `createApp(env: Record<string, string | undefined>, options?: { bundleDir?: string }): express.Express`. Existing calls keep working.
- Produces: `GET /bundle/*` serves files from `bundleDir`.

- [ ] **Step 1: Write the failing tests**

`server/test/bundle.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -w server`
Expected: FAIL, 404 where 200 and 503 were expected.

- [ ] **Step 3: Implement the `/bundle` route in `server/src/app.ts`**

When `bundleDir` holds `showcase.html`, serve the folder with `express.static`. Otherwise every `/bundle/*` request answers 503 with that exact plain-text message. Check for the folder per request, so fetching the Bundle while the server runs works without a restart.
`server/src/index.ts` passes `bundleDir: resolve(import.meta.dirname, '../bundle')`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -w server && npm run typecheck -w server`
Expected: all pass.

- [ ] **Step 5: Write `scripts/fetch-bundle.mjs`**

- Constant `BUNDLE_VERSION = '26.10.4_webgl-1728-g1cd7e0997a'`; the address in Global Constraints.
- If `server/bundle/version.txt` exists and contains the version, print `Bundle <version> already in server/bundle` and exit 0. `--force` skips this check.
- Otherwise download the zip into a temporary file, delete any old `server/bundle/`, unpack with `extract-zip` into `server/bundle/`, delete the zip, and print `Bundle <version> ready in server/bundle (<N> files)`.
- On a failed download print `Download failed: HTTP <status>` and exit 1.
- The zip's files sit at its top level (`showcase.html`, `js/`, `version.txt`, …). If `server/bundle/showcase.html` is missing after unpacking, print `Unexpected bundle layout` and exit 1.

```bash
npm install -D extract-zip@2.0.1
```

Root `package.json` script: `"fetch-bundle": "node scripts/fetch-bundle.mjs"`.

- [ ] **Step 6: Run it, twice**

Run: `npm run fetch-bundle`
Expected: `Bundle 26.10.4_webgl-1728-g1cd7e0997a ready in server/bundle (552 files)` (about 11 MB download).
Run it again.
Expected: `Bundle 26.10.4_webgl-1728-g1cd7e0997a already in server/bundle`.
Run: `git status --short`
Expected: nothing under `server/bundle/`.

- [ ] **Step 7: Check it is served through the page's origin**

Run: `npm run dev`, then `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/bundle/showcase.html`
Expected: `200`.

- [ ] **Step 8: Record the command in `AGENTS.md`**

Under `## Commands`, after the Install line, add:
`- **Viewer files:** \`npm run fetch-bundle\` downloads the Matterport Bundle into \`server/bundle/\` (git-ignored). Run once after cloning.`

- [ ] **Step 9: Commit**

```bash
git add scripts/fetch-bundle.mjs package.json package-lock.json server/src/app.ts server/src/index.ts server/test/bundle.test.ts AGENTS.md
git commit -m "feat: fetch and serve the Matterport Bundle"
```

---

### Task 2: Embed the tour and show the pose

**Files:**
- Create: `app/src/viewer.ts`
- Test: `app/src/viewer.test.ts`
- Modify: `app/src/main.ts`, `app/index.html`

**Interfaces:**
- Consumes: `loadServerConfig(): Promise<ServerConfig>` from `app/src/api.ts` (step 1).
- Produces, in `app/src/viewer.ts`:
  - `type Pose = { position: { x: number; y: number; z: number }; rotation: { x: number; y: number }; mode: string }` (the fields we use from the Bundle's `Camera.Pose`; rotation is in degrees).
  - `type MpSdk = { App: { Phase: { PLAYING: string }; state: { waitUntil(cond: (s: { phase: string }) => boolean): Promise<unknown> } }; Camera: { pose: { subscribe(cb: (pose: Pose) => void): { cancel(): void } } } }`. Later steps add `Room`, `Pointer` and `Conversion` to it.
  - `viewerUrl(config: ServerConfig): string`
  - `withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T>`
  - `connectViewer(iframe: HTMLIFrameElement): Promise<MpSdk>`
  - `formatPose(pose: Pose): string`

- [ ] **Step 1: Write the failing tests**

`app/src/viewer.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { viewerUrl, withTimeout, formatPose } from './viewer';

describe('viewerUrl', () => {
  it('builds the Bundle address', () => {
    expect(viewerUrl({ sdkKey: 'abc', modelId: 'Ki9YdfpNKum' }))
      .toBe('/bundle/showcase.html?m=Ki9YdfpNKum&applicationKey=abc&play=1&qs=1');
  });

  it('encodes characters that would break the address', () => {
    expect(viewerUrl({ sdkKey: 'a&b=c', modelId: 'Ki9YdfpNKum' })).toContain('applicationKey=a%26b%3Dc&');
  });
});

describe('withTimeout', () => {
  it('passes the result through when it arrives in time', async () => {
    await expect(withTimeout(Promise.resolve(7), 1000, 'too slow')).resolves.toBe(7);
  });

  it('rejects with the message when time runs out', async () => {
    vi.useFakeTimers();
    const p = withTimeout(new Promise(() => {}), 60_000, 'Viewer did not start: timed out after 60 s');
    vi.advanceTimersByTime(60_000);
    await expect(p).rejects.toThrow('Viewer did not start: timed out after 60 s');
    vi.useRealTimers();
  });
});

describe('formatPose', () => {
  it('shows position, rotation and mode', () => {
    expect(formatPose({ position: { x: 1.234, y: 1.5, z: -0.4 }, rotation: { x: -10, y: 45.25 }, mode: 'mode.inside' }))
      .toBe('x 1.23  y 1.50  z -0.40 m  ·  pitch -10.0°  yaw 45.3°  ·  inside');
  });

  it('works in dollhouse mode', () => {
    expect(formatPose({ position: { x: 0, y: 12, z: 0 }, rotation: { x: -60, y: 0 }, mode: 'mode.dollhouse' }))
      .toBe('x 0.00  y 12.00  z 0.00 m  ·  pitch -60.0°  yaw 0.0°  ·  dollhouse');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -w app`
Expected: FAIL, cannot find `./viewer`.

- [ ] **Step 3: Implement `app/src/viewer.ts`**

- `viewerUrl`: the address in Global Constraints, with both values through `encodeURIComponent`.
- `withTimeout`: rejects with `new Error(message)` after `ms`; clears its timer when the promise settles first.
- `formatPose`: the exact format in the tests. The mode is the part after `mode.`.
- `connectViewer`: wait for the iframe's `load` event, call `iframe.contentWindow.MP_SDK.connect(iframe.contentWindow)`, then `App.state.waitUntil(s => s.phase === App.Phase.PLAYING)`. Wrap the whole thing in `withTimeout(…, 60_000, 'Viewer did not start: timed out after 60 s')`. Turn other failures into `Viewer did not start: <their message>`. Not unit-tested; Step 6 checks it live.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test -w app && npm run typecheck -w app`
Expected: all pass.

- [ ] **Step 5: Wire the page**

`app/index.html`: a header bar holding `<p id="status">` and `<p id="pose">`, then `<iframe id="viewer" allow="fullscreen; xr-spatial-tracking">`. The header is one line high. The iframe fills the rest of the window with no border. No horizontal scroll.

`app/src/main.ts`:
1. `loadServerConfig()`; on failure, show its message (as in step 1) and stop.
2. Set `#status` to `Loading tour…` and the iframe's `src` to `viewerUrl(config)`.
3. `connectViewer(iframe)`; on failure, show its message.
4. On success set `#status` to `Tour playing: model <modelId>`, then subscribe to `Camera.pose` and write `formatPose(pose)` into `#pose` on every update.

- [ ] **Step 6: Check it live**

Run: `npm run dev` (with the Bundle fetched in Task 1).
Headless check, with a fresh profile in the scratchpad:
`chrome --headless=new --no-first-run --disable-extensions --user-data-dir=<scratchpad>/chrome-step2 --virtual-time-budget=20000 --dump-dom http://localhost:5173/`
Expected: `#status` reads `Tour playing: model Ki9YdfpNKum` and `#pose` holds a line in the `formatPose` format.
Then open `http://localhost:5173` in a normal browser and move around the tour.
Expected: the pose line changes as you move and turn, and shows `dollhouse` when you switch to dollhouse view.
Stop only the processes you started; never stop browser processes by name.

- [ ] **Step 7: Commit**

```bash
git add app/src/viewer.ts app/src/viewer.test.ts app/src/main.ts app/index.html
git commit -m "feat: embed the tour and show the camera pose"
```
