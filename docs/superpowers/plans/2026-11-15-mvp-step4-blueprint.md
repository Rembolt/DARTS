# MVP Step 4: Blueprint View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "Blueprint" button outside the viewer toggles our own three.js canvas over the tour, showing the mesh as dark-blue lines on see-through white, seen through exactly the tour's camera, so the blueprint walls sit on the tour's walls.

**Architecture:** The worker already returns the blueprint lines in its `ready` message (step 3). The page draws them as one `LineSegments` on a canvas laid exactly over the viewer iframe, with `pointer-events: none`. Each `Camera.pose` update sets our camera's view from the pose's position and rotation, and its lens from the pose's own `projection` matrix, so field of view, aspect and mode match without guessing. The canvas renders only when something changed, never while hidden, and nothing runs inside the viewer.

**Tech Stack:** Vite + TypeScript, `three@0.187.0` (already in `app/`), Vitest. No new dependency.

**Spec:** [docs/project/mvp-design.md](../../project/mvp-design.md): section 7 (blueprint view), 8 (viewer), 10 (build step 4: "Toggle the button: the blueprint walls sit on the tour's walls. This is the alignment check") and 11 (risks: misalignment, too many lines). Step 3's ledger: [2026-11-14-mvp-step3-mesh.md](2026-11-14-mvp-step3-mesh.md).

**Not in this step** (spec section 7 and 8 items owned by later build steps): source markers and direct lines (step 5), traced paths and the 0.3 m path start (step 8), `Room.current` (step 9), the P-key point picker (step 5).

## Global Constraints

- Look (spec 7): "white background at about 85% opacity … Mesh edges as thin dark-blue lines. No filled faces." Values: background `#ffffff`, opacity `0.85`, lines `#1f3a93`, 1 px.
- Camera (spec 7): "the same position, direction and field of view as the tour, updated from the camera pose."
- Input (spec 7): "the canvas ignores the mouse (`pointer-events: none`), so you keep moving through the tour underneath."
- Cost (spec 7): "it only redraws when the pose or the paths change, and it is not drawn at all while hidden."
- Spec 8: nothing heavy runs in the viewer. The blueprint runs on the page, in its own canvas.
- `Camera.Pose` is `{ mode, position, projection: Float32Array, rotation, sweep }`; rotation in degrees, `x` pitch, `y` yaw (`docs/matterport/official/reference/camera.md`).
- Ground truth for alignment: `Conversion.worldToScreen(worldPos, cameraPose, windowSize)` (`docs/matterport/official/reference/conversion.md`).
- All blueprint values live in `app/src/config.ts` as `BLUEPRINT`, beside `SIM.blueprintEdgeAngle` (25).
- Dev-only code is behind `import.meta.env.DEV`.
- Branch `mvp-step4-blueprint`, cut from `main`.

## Review Focus

1. **Dollhouse and floor plan:** the tour's lens there is not the inside lens (floor plan may be orthographic); the blueprint must still line up. Pinned by copying `projection` as is (Task 1, test `uses the pose projection as is, never its own fov`) and measured in all three modes (Task 4, Step 6).
2. **Pose updates faster than the screen refreshes** (every mouse move during a turn): at most one render per frame, and the latest pose wins. Pinned in Task 2 (`renders once for many requests in one frame`).
3. **The window, the header or the device pixel ratio changes:** the canvas must follow the iframe's box, or lines drift off the walls. Pinned in Task 2 (`canvasSize` tests) and checked live in Task 4.
4. **The mesh failed to load, or the user presses Blueprint before it is ready:** the button stays disabled with a reason, and nothing throws. Pinned in Task 3 (`toggle` tests).
5. **Blueprint hidden:** no renderer and no renders until first shown. Pinned in Task 2 (`does not render while hidden`).

---

### Task 1: Pose → camera

**Files:**
- Create: `app/src/blueprint/camera.ts`, `app/src/blueprint/camera.test.ts`
- Modify: `app/src/viewer.ts` (types), `app/src/viewer.test.ts` (pose fixtures gain `projection`)

**Interfaces:**
- Consumes: `Pose`, `Vec3` (`app/src/viewer.ts`, `app/src/sim/types.ts`).
- Produces:
  - `Pose` gains `projection: ArrayLike<number>` (16 values).
  - `applyPose(camera: PerspectiveCamera, pose: Pose): void` in `camera.ts`.
  - `forwardOf(pose: Pose): Vec3` in `camera.ts`.
  - Constants `EULER_ORDER = 'YXZ'` and `YAW_SIGN = 1` in `camera.ts`, the one place to correct the convention if Task 4 finds it wrong.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { Matrix4, PerspectiveCamera, Vector3 } from 'three';
import { applyPose, forwardOf } from './camera';
import type { Pose } from '../viewer';

const lens = new PerspectiveCamera(70, 1.5, 0.1, 100).projectionMatrix.toArray();
const pose = (yaw: number, pitch: number, position = { x: 0, y: 0, z: 0 }): Pose =>
  ({ position, rotation: { x: pitch, y: yaw }, mode: 'mode.inside', projection: lens });

describe('applyPose', () => {
  it('uses the pose projection as is, never its own fov', () => {
    const odd = Array.from({ length: 16 }, (_, i) => (i % 5 === 0 ? 2 : i / 100));
    const cam = new PerspectiveCamera(10, 3, 1, 2);
    applyPose(cam, { ...pose(0, 0), projection: odd });
    expect(cam.projectionMatrix.toArray()).toEqual(odd);
    const id = new Matrix4().multiplyMatrices(cam.projectionMatrix, cam.projectionMatrixInverse).toArray();
    id.forEach((v, i) => expect(v).toBeCloseTo(i % 5 === 0 ? 1 : 0, 9));
  });

  it('projects a point straight ahead to the centre of the screen', () => {
    const cam = new PerspectiveCamera();
    applyPose(cam, pose(30, -10, { x: 1, y: 1.5, z: 2 }));
    const [fx, fy, fz] = forwardOf(pose(30, -10));
    const ndc = new Vector3(1 + 3 * fx, 1.5 + 3 * fy, 2 + 3 * fz).project(cam);
    expect(ndc.x).toBeCloseTo(0, 6);
    expect(ndc.y).toBeCloseTo(0, 6);
  });

  it('keeps only the latest pose', () => {
    const cam = new PerspectiveCamera();
    applyPose(cam, pose(90, 20, { x: 5, y: 5, z: 5 }));
    applyPose(cam, pose(0, 0));
    expect(cam.position.toArray()).toEqual([0, 0, 0]);
    expect(new Vector3(0, 0, -1).applyQuaternion(cam.quaternion).toArray().map(v => +v.toFixed(9) || 0)).toEqual([0, 0, -1]);
  });
});

describe('forwardOf', () => {
  it('looks along -Z at yaw 0, pitch 0', () => expect(forwardOf(pose(0, 0)).map(v => +v.toFixed(9) || 0)).toEqual([0, 0, -1]));
  it('looks along -X at yaw 90', () => expect(forwardOf(pose(90, 0)).map(v => +v.toFixed(9) || 0)).toEqual([-1, 0, 0]));
  it('looks up at pitch +30', () => expect(forwardOf(pose(0, 30))[1]).toBeCloseTo(0.5, 9));
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test -w app -- src/blueprint/camera.test.ts`
Expected: FAIL, cannot find `./camera`.

- [ ] **Step 3: Implement `applyPose` and `forwardOf` in `app/src/blueprint/camera.ts`**

`applyPose`: `camera.position.set(...)`, `camera.rotation.set(rad(pitch), YAW_SIGN * rad(yaw), 0, EULER_ORDER)`, `camera.projectionMatrix.fromArray(pose.projection)`, `camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert()`, `camera.updateMatrixWorld(true)`. Never call `updateProjectionMatrix()`: it would rebuild the lens from the camera's own `fov`. `forwardOf`: `(0, 0, -1)` rotated by the same Euler. Add `projection` to `Pose` and to the pose fixtures in `viewer.test.ts`.

- [ ] **Step 4: Run tests and types**

Run: `npm run test -w app && npm run typecheck -w app`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/blueprint/camera.ts app/src/blueprint/camera.test.ts app/src/viewer.ts app/src/viewer.test.ts
git commit -m "feat: camera from the tour's pose"
```

---

### Task 2: The blueprint view

**Files:**
- Create: `app/src/blueprint/schedule.ts`, `app/src/blueprint/schedule.test.ts`, `app/src/blueprint/view.ts`
- Modify: `app/src/config.ts`

**Interfaces:**
- Consumes: `applyPose` (Task 1), `Pose`.
- Produces:
  - `BLUEPRINT = { background: '#ffffff', opacity: 0.85, lineColor: '#1f3a93' }` in `config.ts`.
  - `createScheduler(render: () => void, raf?: (cb: () => void) => unknown): { request(): void; setVisible(visible: boolean): void }` in `schedule.ts`.
  - `canvasSize(box: { width: number; height: number }, pixelRatio: number): { width: number; height: number; pixelRatio: number }` in `schedule.ts` (pixel ratio clamped to 1–2, sizes rounded to whole CSS pixels, never below 1).
  - `createBlueprint(canvas: HTMLCanvasElement): Blueprint` in `view.ts`, where `type Blueprint = { setLines(lines: Float32Array): void; setPose(pose: Pose): void; setVisible(visible: boolean): void; resize(box: { width: number; height: number }, pixelRatio: number): void; dispose(): void }`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi } from 'vitest';
import { canvasSize, createScheduler } from './schedule';

function fakeRaf() {
  const queue: (() => void)[] = [];
  return { raf: (cb: () => void) => queue.push(cb), flush: () => queue.splice(0).forEach(cb => cb()), queue };
}

describe('createScheduler', () => {
  it('renders once for many requests in one frame', () => {
    const f = fakeRaf(); const render = vi.fn();
    const s = createScheduler(render, f.raf); s.setVisible(true); f.flush(); render.mockClear();
    for (let i = 0; i < 10; i++) s.request();
    expect(f.queue).toHaveLength(1); f.flush(); expect(render).toHaveBeenCalledTimes(1);
  });

  it('does not render while hidden, and renders once when shown', () => {
    const f = fakeRaf(); const render = vi.fn();
    const s = createScheduler(render, f.raf);
    s.request(); expect(f.queue).toHaveLength(0);
    s.setVisible(true); f.flush(); expect(render).toHaveBeenCalledTimes(1);
  });

  it('skips a queued frame after being hidden', () => {
    const f = fakeRaf(); const render = vi.fn();
    const s = createScheduler(render, f.raf); s.setVisible(true); f.flush(); render.mockClear();
    s.request(); s.setVisible(false); f.flush(); expect(render).not.toHaveBeenCalled();
  });

  it('keeps a request made during a render', () => {
    const f = fakeRaf(); let s!: ReturnType<typeof createScheduler>; let n = 0;
    s = createScheduler(() => { if (n++ === 0) s.request(); }, f.raf);
    s.setVisible(true); f.flush(); f.flush(); expect(n).toBe(2);
  });
});

describe('canvasSize', () => {
  it('follows the box and the pixel ratio', () => expect(canvasSize({ width: 800.4, height: 600.6 }, 1.5)).toEqual({ width: 800, height: 601, pixelRatio: 1.5 }));
  it('clamps the pixel ratio to 1..2', () => {
    expect(canvasSize({ width: 10, height: 10 }, 3).pixelRatio).toBe(2);
    expect(canvasSize({ width: 10, height: 10 }, 0.5).pixelRatio).toBe(1);
  });
  it('never returns a zero size', () => expect(canvasSize({ width: 0, height: 0 }, 1)).toEqual({ width: 1, height: 1, pixelRatio: 1 }));
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test -w app -- src/blueprint/schedule.test.ts`
Expected: FAIL, cannot find `./schedule`.

- [ ] **Step 3: Implement `schedule.ts`, `view.ts` and `BLUEPRINT`**

`view.ts`: the `WebGLRenderer({ canvas, alpha: true, antialias: true })` is created on the first `setVisible(true)`; clear colour `BLUEPRINT.background` with alpha `BLUEPRINT.opacity`. One `LineSegments(BufferGeometry, LineBasicMaterial({ color: BLUEPRINT.lineColor }))` with `frustumCulled = false`; `setLines` swaps the position attribute and disposes the old geometry. `setPose` → `applyPose` + `request()`. `resize` → `canvasSize` → `renderer.setPixelRatio` + `setSize(w, h, false)` + `request()`. Keep the latest pose and lines so the first show draws straight away. `view.ts` needs WebGL, so Task 4 checks it live.

- [ ] **Step 4: Run tests and types**

Run: `npm run test -w app && npm run typecheck -w app`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/blueprint/schedule.ts app/src/blueprint/schedule.test.ts app/src/blueprint/view.ts app/src/config.ts
git commit -m "feat: blueprint view that renders on demand"
```

---

### Task 3: Button, canvas and wiring

**Files:**
- Create: `app/src/blueprint/toggle.ts`, `app/src/blueprint/toggle.test.ts`
- Modify: `app/index.html`, `app/src/main.ts`

**Interfaces:**
- Consumes: `createBlueprint` (Task 2), `startSim().load` and its `ReadyMessage` (step 3), the `Camera.pose` subscription in `main.ts`.
- Produces: `createToggle(): Toggle` in `toggle.ts`, where `type ToggleView = { enabled: boolean; pressed: boolean; label: 'Blueprint' | 'Tour'; title: string }` and `type Toggle = { view(): ToggleView; ready(): void; failed(message: string): void; toggle(): ToggleView; isShortcut(key: string, target: { tagName?: string; isContentEditable?: boolean } | null): boolean }`.

- [ ] **Step 1: Write the failing tests**

```ts
import { it, expect } from 'vitest';
import { createToggle } from './toggle';

it('starts disabled while the mesh loads', () => {
  expect(createToggle().view()).toEqual({ enabled: false, pressed: false, label: 'Blueprint', title: 'Loading the mesh…' });
});

it('ignores presses before the mesh is ready', () => {
  const t = createToggle();
  expect(t.toggle().pressed).toBe(false);
});

it('enables when the mesh is ready and flips between Blueprint and Tour', () => {
  const t = createToggle(); t.ready();
  expect(t.view()).toEqual({ enabled: true, pressed: false, label: 'Blueprint', title: 'Show the blueprint (B)' });
  expect(t.toggle()).toEqual({ enabled: true, pressed: true, label: 'Tour', title: 'Back to the tour (B)' });
  expect(t.toggle().pressed).toBe(false);
});

it('stays disabled with the reason when the mesh failed', () => {
  const t = createToggle(); t.failed('Mesh download failed: HTTP 403');
  expect(t.view()).toEqual({ enabled: false, pressed: false, label: 'Blueprint', title: 'Blueprint needs the mesh: Mesh download failed: HTTP 403' });
  expect(t.toggle().pressed).toBe(false);
});

it('takes B as the shortcut, except while typing', () => {
  const t = createToggle();
  expect(t.isShortcut('b', { tagName: 'BODY' })).toBe(true);
  expect(t.isShortcut('B', null)).toBe(true);
  expect(t.isShortcut('b', { tagName: 'INPUT' })).toBe(false);
  expect(t.isShortcut('b', { tagName: 'DIV', isContentEditable: true })).toBe(false);
  expect(t.isShortcut('p', { tagName: 'BODY' })).toBe(false);
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test -w app -- src/blueprint/toggle.test.ts`
Expected: FAIL, cannot find `./toggle`.

- [ ] **Step 3: Implement `createToggle`, then lay out and wire the page**

`index.html`: wrap the iframe in `<div id="stage">` (`position: relative; flex: 1; min-height: 0`); after the iframe, `<canvas id="blueprint" hidden>` with `position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none`; in the header, `<button id="blueprint-toggle">` sized to the 28 px bar. `main.ts`: render `toggle.view()` into the button (`disabled`, `aria-pressed`, text, `title`); call `toggle.ready()` with `blueprint.setLines(ready.lines)` on sim ready and `toggle.failed(message)` on sim failure; click and `keydown` (when `isShortcut`) call `toggle()`, set `canvas.hidden` and `blueprint.setVisible(pressed)`; the existing pose subscription also calls `blueprint.setPose(pose)`; a `ResizeObserver` on `#stage` calls `blueprint.resize(contentRect, devicePixelRatio)`.

- [ ] **Step 4: Run tests and types**

Run: `npm test && npm run typecheck`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/src/blueprint/toggle.ts app/src/blueprint/toggle.test.ts app/index.html app/src/main.ts
git commit -m "feat: blueprint button over the tour"
```

---

### Task 4: The alignment check (build-step 4 check)

**Files:**
- Create: `app/src/blueprint/align.ts`, `app/src/blueprint/align.test.ts`, `app/src/debug.ts`
- Modify: `app/src/viewer.ts` (`MpSdk` gains `Conversion`, `Mode`, `Sweep` as used below), `app/src/main.ts` (`if (import.meta.env.DEV) import('./debug')` with the SDK, pose, lines and stage size), `AGENTS.md`, this plan's ledger

**Interfaces:**
- Consumes: `applyPose` (Task 1), the latest pose, the lines (`ReadyMessage.lines`), the stage size.
- Produces:
  - `sampleEndpoints(lines: Float32Array, count: number): Vec3[]` in `align.ts` (evenly strided over the segments, deterministic).
  - `toPixels(camera: PerspectiveCamera, point: Vec3, size: { w: number; h: number }): { x: number; y: number; inFront: boolean }` in `align.ts` (CSS pixels, origin top-left).
  - `alignmentStats(errors: number[]): { samples: number; maxPx: number; medianPx: number }` in `align.ts`.
  - Dev-only `window.__blueprintCheck(samples = 200)` in `debug.ts`: for each on-screen sample in front of the camera, the distance between `toPixels` and `sdk.Conversion.worldToScreen({x, y, z}, pose, { w, h })`; returns `{ mode, visible, ...alignmentStats(errors) }`.

- [ ] **Step 1: Write the failing tests**

```ts
import { it, expect } from 'vitest';
import { PerspectiveCamera } from 'three';
import { alignmentStats, sampleEndpoints, toPixels } from './align';

it('samples end points evenly and deterministically', () => {
  const lines = new Float32Array(Array.from({ length: 10 * 6 }, (_, i) => i));
  const pts = sampleEndpoints(lines, 5);
  expect(pts).toHaveLength(5);
  expect(sampleEndpoints(lines, 5)).toEqual(pts);
  expect(pts[0]).toEqual([0, 1, 2]);
});

it('puts a point straight ahead at the centre, origin top-left', () => {
  const cam = new PerspectiveCamera(60, 2, 0.1, 100); cam.updateMatrixWorld();
  expect(toPixels(cam, [0, 0, -5], { w: 800, h: 400 })).toEqual({ x: 400, y: 200, inFront: true });
  expect(toPixels(cam, [0, 0, 5], { w: 800, h: 400 }).inFront).toBe(false);
  expect(toPixels(cam, [0, 1, -5], { w: 800, h: 400 }).y).toBeLessThan(200);
});

it('reports the worst and the median error', () => {
  expect(alignmentStats([0.5, 3, 1])).toEqual({ samples: 3, maxPx: 3, medianPx: 1 });
  expect(alignmentStats([])).toEqual({ samples: 0, maxPx: 0, medianPx: 0 });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test -w app -- src/blueprint/align.test.ts`
Expected: FAIL, cannot find `./align`.

- [ ] **Step 3: Implement `align.ts` and `debug.ts`**

`toPixels`: `Vector3.project(camera)`; `inFront` when the projected `z` is within −1..1; `x = (ndc.x + 1) / 2 * w`, `y = (1 − ndc.y) / 2 * h`. `debug.ts` keeps its own `PerspectiveCamera` posed with `applyPose`, so the check measures the same math the view uses.

- [ ] **Step 4: Run tests and types**

Run: `npm test && npm run typecheck`
Expected: all pass.

- [ ] **Step 5: Measure at the start position**

Run `npm run dev`. Start headless Chrome with `--remote-debugging-port` and a fresh profile in the scratchpad (on this machine `--dump-dom` prints nothing; see step 3's ledger), open `http://localhost:5173/`, wait for `Tour playing` and `Mesh:` in the header, then evaluate `__blueprintCheck()`.
Expected: `visible ≥ 50`, `maxPx ≤ 2`.
If not: a mirror or a constant angle points at the convention (flip `YAW_SIGN`, or try `EULER_ORDER = 'XYZ'` in `camera.ts`, then add a test for the corrected convention); a match on one axis with a swap or flip on another points at the mesh conversion in `app/src/sim/obj.ts`. Measure again after each change.

- [ ] **Step 6: Measure across viewpoints and modes**

Through the same session: `sdk.Camera.rotate(90, 0)`, then `sdk.Camera.rotate(0, -30)`; two other sweeps via `sdk.Sweep.moveTo(id)`; `sdk.Mode.moveTo(sdk.Mode.Mode.DOLLHOUSE)`; `sdk.Mode.moveTo(sdk.Mode.Mode.FLOORPLAN)`. Wait for each move to finish, then run `__blueprintCheck()`.
Expected: `maxPx ≤ 2` in every case. Record each result in the ledger.

- [ ] **Step 7: Look at it and choose the line density**

Capture `Page.captureScreenshot` with the blueprint shown at the start position and in dollhouse, at `SIM.blueprintEdgeAngle` 25, 40 and 60. Then open `http://localhost:5173` in a normal browser, press Blueprint, and walk around.
Expected: blueprint walls sit on the tour's walls; the tour responds to the mouse through the canvas; turning stays smooth. Keep 25 unless walls are hard to read; record the choice and the line count.

- [ ] **Step 8: Record and commit**

Update `AGENTS.md` (Current state: steps 1–4; Facts: the confirmed convention, the projection layout, the alignment numbers, the chosen angle) and fill the ledger.

```bash
git add app/src/blueprint/align.ts app/src/blueprint/align.test.ts app/src/debug.ts app/src/viewer.ts app/src/main.ts app/src/config.ts AGENTS.md docs/superpowers/plans/2026-11-15-mvp-step4-blueprint.md
git commit -m "feat: measure blueprint alignment against the tour"
```

---

## Ledger

| Item | Value |
|---|---|
| Pose convention (Euler order, yaw sign, forward at 0/0) | `YXZ`, yaw sign +1, −Z at 0/0: confirmed (0 px error) |
| Projection layout | Row-major in the pose (−1 at index 14). The plan assumed column-major; `applyPose` transposes |
| Alignment max / median px: start, rotated, other sweeps | 0 / 0 (86 points); 90° turn 0 / 0 (42); pitch −30° 7e-13 / 3e-13 (40); sweep A 7e-13 / 2e-13 (49); sweep B 4e-13 / 2e-13 (10) |
| Alignment max / median px: dollhouse, floor plan | Dollhouse 0 / 0 (196 points). Floor plan: not measured, the headless software renderer did not finish the mode change |
| Mesh position (what `worldToScreen` cannot see) | Screenshot at the start: blueprint baseboards, doorway edges and wall corners sit on the tour's |
| Chosen `blueprintEdgeAngle` and line count | 25° kept, 135,730 lines. Most clutter is the trees outside, which no angle removes |
| Render time per frame with the blueprint shown | Not measurable headless (software rendering: 210 ms tour only, 128 ms turning with the blueprint) |
